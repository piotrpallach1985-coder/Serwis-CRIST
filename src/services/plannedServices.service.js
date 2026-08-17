import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notifications.service';

export const addPlannedService = async (serviceData) => {
  return await addDoc(collection(db, 'planned_services'), {
    ...serviceData,
    createdAt: serverTimestamp(),
    status: 'pending', // pending, in_progress, completed
    history: serviceData.history || []
  });
};

export const updatePlannedService = async (serviceId, data) => {
  return await updateDoc(doc(db, 'planned_services', serviceId), data);
};

export const deletePlannedService = async (serviceId) => {
  return await deleteDoc(doc(db, 'planned_services', serviceId));
};

export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null) => {
  const serviceRef = doc(db, 'planned_services', serviceId);
  const payload = {
    status: 'completed',
    completedAt: serverTimestamp(),
    completionDetails: completionData
  };
  
  if (completionData.historyEntry) {
    payload.history = arrayUnion(completionData.historyEntry);
    delete payload.completionDetails.historyEntry;
  }
  
  await updateDoc(serviceRef, payload);

  // Jeśli zdefiniowano interwał odnowienia, generujemy nowy plan serwisowy w oparciu o poprzedni
  if (nextPlanData) {
    await addPlannedService(nextPlanData);
  }
};

/**
 * Mechanizm sprawdzający czy zbliża się termin planowanego przeglądu dla wszystkich zaplanowanych serwisów.
 * Jeśli termin jest blisko, a powiadomienie nie zostało jeszcze wysłane (flaga), wysyłamy powiadomienie.
 * Wywoływane przy starcie aplikacji przez uprawnionego użytkownika (np. Kierownika).
 */
export const checkAndTriggerDueServices = async (machinesMap) => {
  try {
    const q = query(collection(db, 'planned_services'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    const now = new Date();
    
    snapshot.docs.forEach(async (docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const machine = machinesMap[data.machineId];
      if (!machine) return;

      let shouldAlert = false;
      let alertMessage = '';
      
      if (!data.notified) {
        // Sprawdzanie dla triggera KALENDARZOWEGO
        if (data.triggerType === 'calendar' || data.triggerType === 'mixed') {
          if (data.nextDate) {
            const nextDate = data.nextDate.toDate ? data.nextDate.toDate() : new Date(data.nextDate);
            const daysLeft = (nextDate - now) / (1000 * 60 * 60 * 24);
            
            if (daysLeft <= 7) { // Alert 7 dni przed przeglądem
              shouldAlert = true;
              alertMessage = `Zbliża się termin planowanego przeglądu "${data.name}" (zostało ${Math.max(0, Math.ceil(daysLeft))} dni).`;
            }
          }
        }

        // Sprawdzanie dla triggera LICZNIKOWEGO
        if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
          if (data.targetWorkHours && machine.currentWorkHours) {
            const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
            if (hoursLeft <= 50 && hoursLeft >= 0) { // Alert np. 50 rbg przed
              shouldAlert = true;
              alertMessage = `Zbliża się termin przeglądu liczonego w roboczogodzinach "${data.name}" (zostało ${hoursLeft} rbg).`;
            }
          }
        }

        if (shouldAlert) {
          // Wysyłamy powiadomienie i zaznaczamy, żeby nie spamować co odświeżenie
          await createNotification({
            title: `Planowany Serwis: ${machine.name}`,
            message: alertMessage,
            isCritical: data.priority === 'Krytyczny',
            linkTo: 'planned_maintenance',
            machineId: data.machineId
          });
          
          await updateDoc(docSnap.ref, { notified: true });
        }
      }
    });
  } catch (error) {
    console.error("Błąd przy sprawdzaniu terminów Serwisu Planowanego:", error);
  }
};
