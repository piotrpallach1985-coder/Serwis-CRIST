import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useManagerStore } from '../store/managerStore';

export const requestPushPermission = async (userId) => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // UWAGA: Potrzebujesz VAPID Key wygenerowanego z konsoli Firebase (Project Settings -> Cloud Messaging)
      // Tymczasowo wstaw tutaj puste stringi albo poproś usera o klucz. Ominiemy vapidKey dla testów lokalnych jeśli go brakuje, 
      // ale dla HTTPS/PWA jest WYMAGANY.
      const currentToken = await getToken(messaging, { 
        // vapidKey: 'TUTAJ_WKLEJ_VAPID_KEY_Z_KONSOLI_FIREBASE' 
      });
      
      if (currentToken) {
        // Zapisujemy token do profilu użytkownika
        const userRef = doc(db, 'tenants', (useManagerStore.getState().tenantId || import.meta.env.VITE_DEFAULT_TENANT || 'crist'), 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken)
        });
        return currentToken;
      }
    }
    return null;
  } catch (error) {
    console.error('Błąd podczas pobierania tokena FCM', error);
    return null;
  }
};

export const listenToForegroundMessages = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};



export const createNotification = async (notifData) => {
  return await addDoc(collection(db, 'tenants', (useManagerStore.getState().tenantId || import.meta.env.VITE_DEFAULT_TENANT || 'crist'), 'notifications'), {
    ...notifData,
    createdAt: serverTimestamp(),
    read: false
  });
};

export const markNotificationAsRead = async (notifId) => {
  const notifRef = doc(db, 'tenants', (useManagerStore.getState().tenantId || import.meta.env.VITE_DEFAULT_TENANT || 'crist'), 'notifications', notifId);
  return await updateDoc(notifRef, { read: true });
};
