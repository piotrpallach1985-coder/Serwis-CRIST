import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDr-XXX", // Let's read it from the existing config! Wait, I can just regex it out or run in browser...
};
