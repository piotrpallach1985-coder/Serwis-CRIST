import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const createNotification = async (notifData) => {
  return await addDoc(collection(db, 'notifications'), {
    ...notifData,
    createdAt: serverTimestamp(),
    read: false
  });
};

export const markNotificationAsRead = async (notifId) => {
  const notifRef = doc(db, 'notifications', notifId);
  return await updateDoc(notifRef, { read: true });
};
