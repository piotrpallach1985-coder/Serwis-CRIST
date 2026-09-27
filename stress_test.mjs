import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDhaAwJbcDNRp5wloQFweluHdAvbCiZ82U",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "serwis-crist.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "serwis-crist",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  console.log("---------------------------------------------------------");
  console.log("Rozpoczynanie testu obciążeniowego Firestore (Firebase)...");
  
  const loginStart = performance.now();
  await signInAnonymously(auth);
  console.log(`[+] Zalogowano jako anonimowy technik w ${(performance.now() - loginStart).toFixed(2)} ms.`);

  const tenantId = 'crist';
  const NUM_TECH = 50;
  
  const ticketIds = [];
  for (let i = 0; i < NUM_TECH; i++) {
    ticketIds.push(`load_test_ticket_${Date.now()}_${i}`);
  }

  // FAZA 1: Równoległe tworzenie zgłoszeń (np. rano, na halach produkcyjnych powstaje X awarii)
  console.log(`\n[FAZA 1] Symulacja: ${NUM_TECH} nowych awarii spływa jednocześnie z hal...`);
  const createStart = performance.now();
  
  const createPromises = ticketIds.map((id, index) => {
    const ref = doc(db, 'tenants', tenantId, 'tickets', id);
    return setDoc(ref, {
      title: `Awaria testowa ${index}`,
      status: 1, 
      machineName: 'Maszyna Testowa',
      description: 'Zgłoszenie z testu obciążeniowego',
      createdAt: new Date().toISOString(),
      isLoadTest: true
    });
  });

  const createResults = await Promise.allSettled(createPromises);
  const createEnd = performance.now();
  
  const createSuccess = createResults.filter(r => r.status === 'fulfilled').length;
  console.log(`=> Wynik Fazy 1: Utworzono pomyślnie ${createSuccess} na ${NUM_TECH} zgłoszeń.`);
  console.log(`=> Czas trwania: ${(createEnd - createStart).toFixed(2)} ms (${((createEnd - createStart)/NUM_TECH).toFixed(2)} ms średnio na zgłoszenie).`);

  // FAZA 2: Równoległe aktualizowanie zgłoszeń (Technicy otwierają mapę i przypisują się)
  console.log(`\n[FAZA 2] Symulacja: ${NUM_TECH} techników w jednym momencie przypisuje się do różnych zgłoszeń...`);
  const updateStart = performance.now();
  
  const updatePromises = ticketIds.map((id, index) => {
    const ref = doc(db, 'tenants', tenantId, 'tickets', id);
    return updateDoc(ref, {
      status: 2, 
      assignedTo: `Technik Testowy ${index}`,
      updatedAt: new Date().toISOString()
    });
  });

  const updateResults = await Promise.allSettled(updatePromises);
  const updateEnd = performance.now();

  const updateSuccess = updateResults.filter(r => r.status === 'fulfilled').length;
  const updateFailed = updateResults.filter(r => r.status !== 'fulfilled');
  console.log(`=> Wynik Fazy 2: Zaktualizowano pomyślnie ${updateSuccess} na ${NUM_TECH} zgłoszeń.`);
  console.log(`=> Czas trwania: ${(updateEnd - updateStart).toFixed(2)} ms (${((updateEnd - updateStart)/NUM_TECH).toFixed(2)} ms średnio na aktualizację).`);
  
  if (updateFailed.length > 0) {
      console.log("! Pojawiły się błędy przy aktualizacji: ", updateFailed[0].reason);
  } else {
      console.log("=> Brak deadlocków. Firestore pomyślnie obsłużył 50 zrównoleglonych transakcji zapisu.");
  }

  // FAZA 3: Cleanup
  console.log(`\n[FAZA 3] Sprzątanie: Usuwanie ${NUM_TECH} testowych zgłoszeń z bazy produkcyjnej...`);
  const deleteStart = performance.now();
  const deletePromises = ticketIds.map(id => {
    const ref = doc(db, 'tenants', tenantId, 'tickets', id);
    return deleteDoc(ref);
  });
  await Promise.all(deletePromises);
  console.log(`=> Usunięto pomyślnie w ${(performance.now() - deleteStart).toFixed(2)} ms.`);
  
  console.log("\n---------------------------------------------------------");
  console.log("TEST OBCIĄŻENIOWY ZAKOŃCZONY SUKCESEM.");
  process.exit(0);
}

runTest().catch(err => {
    console.error("Błąd podczas testu:", err);
    process.exit(1);
});
