import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDhaAwJbcDNRp5wloQFweluHdAvbCiZ82U",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "serwis-crist.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "serwis-crist",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function cleanUp() {
  console.log("Logowanie anonimowe...");
  await signInAnonymously(auth);
  
  const tenantId = 'crist';
  console.log("Pobieranie biletów testowych...");
  
  const q = query(collection(db, 'tenants', tenantId, 'tickets'), where('isLoadTest', '==', true));
  const snapshot = await getDocs(q);
  
  console.log(`Znaleziono ${snapshot.size} biletów do 'usunięcia' (archiwizacji).`);
  
  let successCount = 0;
  for (const docSnap of snapshot.docs) {
      try {
          await updateDoc(doc(db, 'tenants', tenantId, 'tickets', docSnap.id), {
              status: 5, // CLOSED - przeniesie do archiwum
              title: '[USUNIĘTO - TEST OBCIĄŻENIOWY]',
              isDeleted: true,
              archived: true
          });
          successCount++;
      } catch (err) {
          console.error("Błąd aktualizacji doc:", docSnap.id, err.message);
      }
  }
  
  console.log(`Pomyślnie oznaczono jako usunięte: ${successCount} / ${snapshot.size}`);
  process.exit(0);
}

cleanUp().catch(console.error);
