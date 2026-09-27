import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, arrayUnion, writeBatch } from 'firebase/firestore';
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
  return await updateDoc(doc(db, 'planned_services', serviceId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: 'System' });
};

export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null, actionItemData = null) => {
  const batch = writeBatch(db);
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
  
  batch.update(serviceRef, payload);

  // Generujemy nowy plan serwisowy
  if (nextPlanData) {
    const nextDataObj = {
      ...nextPlanData,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    const nextDateRaw = nextDataObj.nextDate;
    if (nextDateRaw && typeof nextDateRaw.toISOString === 'function') {
      nextDataObj.nextDate = nextDateRaw.toISOString();
    }
    const newServiceRef = doc(collection(db, 'planned_services'));
    batch.set(newServiceRef, nextDataObj);
  }

  // Generujemy action item (tematy do realizacji)
  if (actionItemData) {
    const newActionItemRef = doc(collection(db, 'action_items'));
    batch.set(newActionItemRef, actionItemData);
  }

  await batch.commit();
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
    
    // Używamy dynamicznego importu lub zaimportowanego writeBatch, doc
    const { writeBatch, doc, collection: firestoreCollection } = await import('firebase/firestore');
    const batch = writeBatch(db);
    let hasWrites = false;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const machine = machinesMap[data.machineId];
      if (!machine) continue;

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
          // Wysyłamy powiadomienie do batcha
          const newNotifRef = doc(firestoreCollection(db, 'notifications'));
          batch.set(newNotifRef, {
            title: `Planowany Serwis: ${machine.name}`,
            message: alertMessage,
            isCritical: data.priority === 'Krytyczny',
            linkTo: 'planned_maintenance',
            machineId: data.machineId,
            createdAt: serverTimestamp(),
            read: false
          });
          
          // Aktualizujemy status dokumentu w batchu
          batch.update(docSnap.ref, { notified: true });
          hasWrites = true;
        }
      }
    }
    
    if (hasWrites) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Błąd przy sprawdzaniu terminów Serwisu Planowanego:", error);
  }
};
