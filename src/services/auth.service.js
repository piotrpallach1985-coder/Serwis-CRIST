import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

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

export const loginAnon = async (targetTenantId) => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const user = auth.currentUser;
  if (user && targetTenantId) {
    try {
      const sessionRef = doc(db, 'anon_sessions', user.uid);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        await setDoc(sessionRef, {
          tenantId: targetTenantId,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('Could not bind anon session:', e);
    }
  }
  return user;
};

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
