import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getOperatorQrKey, saveOperatorQrKey } from './qrAccess.service';

const USER_PROFILE_CACHE_KEY = 'vexont_cached_user_profile';
const inFlightUserFetches = new Map();
const recentUserProfileMemCache = new Map();
const tenantGeneralStatusCache = new Map();

export const getCachedUserProfile = (uid = null) => {
  if (uid && recentUserProfileMemCache.has(uid)) {
    const entry = recentUserProfileMemCache.get(uid);
    if (Date.now() - entry.ts < 15000) {
      return entry.profile;
    }
  }
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.uid) return null;
    if (uid && parsed.uid !== uid) return null;
    if (parsed.isDeleted || parsed.status === 'suspended' || parsed.isBlocked) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveCachedUserProfile = profile => {
  if (!profile || !profile.uid) return;
  recentUserProfileMemCache.set(profile.uid, { profile, ts: Date.now() });
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profile));
    }
  } catch {
    // ignore storage errors
  }
};

export const clearCachedUserProfile = () => {
  recentUserProfileMemCache.clear();
  inFlightUserFetches.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    }
  } catch {
    // ignore
  }
};

const tryGetDocCacheFirst = async (docRef, preferCache = false) => {
  if (preferCache && typeof firestoreModule.getDocFromCache === 'function') {
    try {
      const cachedSnap = await firestoreModule.getDocFromCache(docRef);
      if (cachedSnap && typeof cachedSnap.exists === 'function' && cachedSnap.exists()) {
        return cachedSnap;
      }
    } catch {
      // Cache miss -> fallback to server getDoc
    }
  }
  return getDoc(docRef);
};

/**
 * Współdzielony (deduplikowany) odczyt i weryfikacja profilu użytkownika oraz statusu firmy.
 * Zapobiega podwójnym zapytaniom z loginWithEmail() i onAuthStateChanged() w tej samej chwili.
 */
export const resolveVerifiedUserProfile = async (
  uid,
  { preferCache = false, fallbackEmail = '' } = {}
) => {
  if (!uid) return null;

  if (!preferCache && recentUserProfileMemCache.has(uid)) {
    const cached = recentUserProfileMemCache.get(uid);
    if (Date.now() - cached.ts < 8000) {
      return cached.profile;
    }
  }

  if (inFlightUserFetches.has(uid)) {
    return inFlightUserFetches.get(uid);
  }

  const fetchPromise = (async () => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await tryGetDocCacheFirst(userDocRef, preferCache);

    if (!userDoc || typeof userDoc.exists !== 'function' || !userDoc.exists()) {
      clearCachedUserProfile();
      throw new Error('USER_NO_ROLE');
    }

    const userData = userDoc.data();

    if (userData.isDeleted || userData.status === 'suspended' || userData.isBlocked) {
      clearCachedUserProfile();
      try {
        sessionStorage.setItem('vexont_suspended_notice', '1');
      } catch {
        // ignore
      }
      await signOut(auth);
      throw new Error('USER_DELETED');
    }

    if (userData.role !== 'superadmin' && userData.tenantId) {
      const tId = userData.tenantId;
      let genData = tenantGeneralStatusCache.get(tId) || null;

      if (!genData) {
        try {
          const genRef = doc(db, 'tenants', tId, 'settings', 'general');
          const genDoc = await tryGetDocCacheFirst(genRef, true);
          if (genDoc && typeof genDoc.exists === 'function' && genDoc.exists()) {
            genData = genDoc.data();
            if (genData) tenantGeneralStatusCache.set(tId, genData);
          }
        } catch (err) {
          if (err && err.message === 'TENANT_SUSPENDED') {
            throw err;
          }
        }
      }

      if (genData && genData.status === 'suspended') {
        clearCachedUserProfile();
        try {
          sessionStorage.setItem('vexont_suspended_notice', '1');
        } catch {
          // ignore
        }
        await signOut(auth);
        throw new Error('TENANT_SUSPENDED');
      }
    }

    const profile = {
      uid,
      ...userData,
      email: userData.email || fallbackEmail || '',
    };
    saveCachedUserProfile(profile);
    return profile;
  })();

  inFlightUserFetches.set(uid, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightUserFetches.delete(uid);
  }
};

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  return resolveVerifiedUserProfile(user.uid, {
    preferCache: false,
    fallbackEmail: user.email || email,
  });
};

let anonBindInFlight = null;
let anonSessionRotating = false;
let boundAnonCache = { uid: null, tenantId: null, qrKey: null };

export const isAnonSessionRotating = () => anonSessionRotating || Boolean(anonBindInFlight);

/**
 * Zapewnia, że anonimowa sesja (operator QR) jest powiązana z daną firmą (anon_sessions/{uid}).
 * Wymaga klucza QR firmy (z zeskanowanego kodu lub zapamiętanego na urządzeniu) – weryfikują go reguły.
 * Jeśli urządzenie było powiązane z INNĄ firmą albo ze starym kluczem, tworzy nową sesję anonimową.
 * Zwraca aktualnego użytkownika Firebase Auth (może mieć inne uid niż przed wywołaniem).
 */
export const ensureAnonSessionForTenant = async (targetTenantId, qrKey = null) => {
  if (targetTenantId && qrKey) {
    saveOperatorQrKey(targetTenantId, qrKey);
  }
  const effectiveKey = qrKey || getOperatorQrKey(targetTenantId);
  if (
    auth.currentUser &&
    auth.currentUser.isAnonymous &&
    boundAnonCache.uid === auth.currentUser.uid &&
    boundAnonCache.tenantId === targetTenantId &&
    (!effectiveKey || boundAnonCache.qrKey === effectiveKey)
  ) {
    return auth.currentUser;
  }
  while (anonBindInFlight) {
    const prev = await anonBindInFlight.catch(() => null);
    if (!qrKey) return prev; // wywołanie z kluczem (skan QR) wykonujemy po zakończeniu poprzedniego
  }
  anonBindInFlight = (async () => {
    const [, generalCheckErr] = await Promise.all([
      !auth.currentUser ? signInAnonymously(auth).catch(() => null) : Promise.resolve(),
      targetTenantId
        ? getDoc(doc(db, 'tenants', targetTenantId, 'settings', 'general'))
            .then(genDoc => {
              if (genDoc && typeof genDoc.exists === 'function' && genDoc.exists()) {
                const genData = genDoc.data();
                if (genData && genData.status === 'suspended') {
                  return new Error('TENANT_SUSPENDED');
                }
              }
              return null;
            })
            .catch(() => null)
        : Promise.resolve(null),
    ]);
    if (generalCheckErr) {
      throw generalCheckErr;
    }
    let user = auth.currentUser;
    if (!user || !user.isAnonymous || !targetTenantId) return user;
    const key = qrKey || getOperatorQrKey(targetTenantId);
    try {
      const snap = await getDoc(doc(db, 'anon_sessions', user.uid));
      if (snap.exists()) {
        const s = snap.data();
        if (s.tenantId === targetTenantId && (!key || s.qrKey === key)) {
          boundAnonCache = { uid: user.uid, tenantId: targetTenantId, qrKey: s.qrKey || key };
          return user;
        }
        if (!key) return user; // brak klucza – nie da się przepiąć, reguły odmówią dostępu
        // Inna firma lub nowy klucz -> nowa sesja anonimowa (sesji nie można edytować)
        anonSessionRotating = true;
        try {
          await signOut(auth);
          await signInAnonymously(auth);
          user = auth.currentUser;
        } finally {
          anonSessionRotating = false;
        }
      }
      if (!key) {
        boundAnonCache = { uid: user.uid, tenantId: targetTenantId, qrKey: null };
        return user; // operator musi zeskanować kod QR firmy
      }
      await setDoc(doc(db, 'anon_sessions', user.uid), {
        tenantId: targetTenantId,
        qrKey: key,
        createdAt: serverTimestamp()
      });
      saveOperatorQrKey(targetTenantId, key);
      boundAnonCache = { uid: user.uid, tenantId: targetTenantId, qrKey: key };
    } catch (e) {
      console.warn('Could not bind anon session:', e);
    }
    return user;
  })();
  try {
    return await anonBindInFlight;
  } finally {
    anonBindInFlight = null;
  }
};

export const loginAnon = async (targetTenantId, qrKey = null) => ensureAnonSessionForTenant(targetTenantId, qrKey);

export const subscribeToGeneralSettings = (tenantId, callback) => {
  return onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'general'), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (tenantId && data) {
        tenantGeneralStatusCache.set(tenantId, data);
      }
      callback(data);
    }
  }, (err) => { console.warn(err) });
};

export const subscribeToBranding = (tenantId, callback) => {
  let globalAppLogo = '';
  
  const unsubGlobal = onSnapshot(doc(db, 'tenant_registry', '_global_settings_'), (globalSnap) => {
    if (globalSnap.exists()) {
      globalAppLogo = globalSnap.data().appLogoUrl || '';
      callback({ type: 'global', globalAppLogo });
    }
  }, (err) => { console.warn(err) });

  const unsubLocal = onSnapshot(doc(db, 'tenants', tenantId, 'settings', "branding"), (docSnap) => {
    if (docSnap.exists()) {
      callback({ type: 'local', data: docSnap.data() });
    } else {
      callback({ type: 'local', data: null });
    }
  }, (err) => { console.warn(err) });

  return () => {
    unsubGlobal();
    unsubLocal();
  };
};
