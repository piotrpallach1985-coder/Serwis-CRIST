import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getOperatorQrKey, saveOperatorQrKey } from './qrAccess.service';

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    throw new Error('USER_NO_ROLE');
  }
  
  return { uid: user.uid, ...userDoc.data() };
};

let anonBindInFlight = null;

/**
 * Zapewnia, że anonimowa sesja (operator QR) jest powiązana z daną firmą (anon_sessions/{uid}).
 * Wymaga klucza QR firmy (z zeskanowanego kodu lub zapamiętanego na urządzeniu) – weryfikują go reguły.
 * Jeśli urządzenie było powiązane z INNĄ firmą albo ze starym kluczem, tworzy nową sesję anonimową.
 * Zwraca aktualnego użytkownika Firebase Auth (może mieć inne uid niż przed wywołaniem).
 */
export const ensureAnonSessionForTenant = async (targetTenantId, qrKey = null) => {
  while (anonBindInFlight) {
    const prev = await anonBindInFlight.catch(() => null);
    if (!qrKey) return prev; // wywołanie z kluczem (skan QR) wykonujemy po zakończeniu poprzedniego
  }
  anonBindInFlight = (async () => {
    let user = auth.currentUser;
    if (!user) {
      await signInAnonymously(auth);
      user = auth.currentUser;
    }
    if (!user || !user.isAnonymous || !targetTenantId) return user;
    const key = qrKey || getOperatorQrKey(targetTenantId);
    try {
      const snap = await getDoc(doc(db, 'anon_sessions', user.uid));
      if (snap.exists()) {
        const s = snap.data();
        if (s.tenantId === targetTenantId && (!key || s.qrKey === key)) return user;
        if (!key) return user; // brak klucza – nie da się przepiąć, reguły odmówią dostępu
        // Inna firma lub nowy klucz -> nowa sesja anonimowa (sesji nie można edytować)
        await signOut(auth);
        await signInAnonymously(auth);
        user = auth.currentUser;
      }
      if (!key) return user; // operator musi zeskanować kod QR firmy
      await setDoc(doc(db, 'anon_sessions', user.uid), {
        tenantId: targetTenantId,
        qrKey: key,
        createdAt: serverTimestamp()
      });
      saveOperatorQrKey(targetTenantId, key);
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
      callback(snap.data());
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
