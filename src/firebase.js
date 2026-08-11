import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhaAwJbcDNRp5wloQFweluHdAvbCiZ82U",
  authDomain: "serwis-crist.firebaseapp.com",
  databaseURL: "https://serwis-crist-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "serwis-crist",
  storageBucket: "serwis-crist.firebasestorage.app",
  messagingSenderId: "321327519677",
  appId: "1:321327519677:web:107294ad94ad3eb45664d4"
};

const app = initializeApp(firebaseConfig);

// Włączenie trwałego cache offline dla Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
