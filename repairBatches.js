import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixBatches() {
  console.log("Rozpoczynam sprawdzanie parts...");
  const tenantsSnap = await getDocs(collection(db, 'tenants'));
  
  for (const tDoc of tenantsSnap.docs) {
    const tenantId = tDoc.id;
    console.log(`Sprawdzam firmę: ${tenantId}`);
    
    const partsSnap = await getDocs(collection(db, 'tenants', tenantId, 'parts'));
    
    for (const pDoc of partsSnap.docs) {
      const data = pDoc.data();
      const stock = Number(data.stock || 0);
      let batches = data.batches || [];
      
      let batchesSum = batches.reduce((acc, b) => acc + Number(b.qty || 0), 0);
      
      if (batchesSum !== stock) {
        console.log(`Niezgodność w części ${data.name} (${pDoc.id}): stock=${stock}, batchesSum=${batchesSum}`);
        
        let newBatches = [...batches];
        let diff = batchesSum - stock;
        
        if (diff > 0) {
          let remainingToIssue = diff;
          while (remainingToIssue > 0 && newBatches.length > 0) {
            if (newBatches[0].qty <= remainingToIssue) {
              remainingToIssue -= newBatches[0].qty;
              newBatches.shift();
            } else {
              newBatches[0].qty -= remainingToIssue;
              remainingToIssue = 0;
            }
          }
        } else if (diff < 0) {
          newBatches.push({
            qty: -diff,
            price: Number(data.unitPrice || 0),
            date: new Date().toISOString(),
            expirationDate: null,
            note: 'Wyrównanie systemowe'
          });
        }
        
        await updateDoc(doc(db, 'tenants', tenantId, 'parts', pDoc.id), {
          batches: newBatches
        });
        console.log(`-> Zaktualizowano batches dla ${data.name}`);
      }
    }
  }
  
  console.log("Koniec!");
  process.exit(0);
}

fixBatches().catch(console.error);
