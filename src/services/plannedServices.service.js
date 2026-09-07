import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notifications.service';
import { SERVICE_STATUS, TIME_THRESHOLDS } from '../utils/constants';

/**
 * Dodaje nowy plan serwisowy do bazy danych.
 * 
 * @param {Object} serviceData Dane definiujące plan serwisowy
 * @param {string} serviceData.name Nazwa przeglądu/serwisu
 * @param {string} serviceData.machineId ID przypisanej maszyny
 * @param {string} [serviceData.triggerType='calendar'] Typ wyzwalacza: 'calendar' | 'hours' | 'mixed'
 * @param {string} [serviceData.nextDate] Kolejna data przeglądu
 * @param {number} [serviceData.targetWorkHours] Docelowa liczba rbg
 * @param {Array<Object>} [serviceData.history] Historia wykonanych przeglądów
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Referencja do utworzonego dokumentu
 */
export const addPlannedService = async (serviceData) => {
  return await addDoc(collection(db, 'planned_services'), {
    ...serviceData,
    createdAt: serverTimestamp(),
    status: SERVICE_STATUS.PENDING,
    history: serviceData.history || []
  });
};

/**
 * Aktualizuje istniejący plan serwisowy w bazie.
 * 
 * @param {string} serviceId Identyfikator dokumentu serwisu
 * @param {Object} data Pola do zaktualizowania
 * @returns {Promise<void>}
 */
export const updatePlannedService = async (serviceId, data) => {
  return await updateDoc(doc(db, 'planned_services', serviceId), data);
};

/**
 * Wykonuje miękkie usunięcie (soft-delete) planu serwisowego.
 * 
 * @param {string} serviceId Identyfikator serwisu do usunięcia
 * @returns {Promise<void>}
 */
export const deletePlannedService = async (serviceId) => {
  return await updateDoc(doc(db, 'planned_services', serviceId), { 
    isDeleted: true, 
    deletedAt: serverTimestamp(), 
    deletedBy: 'System' 
  });
};

/**
 * Oznacza serwis jako zrealizowany, zapisuje historię oraz opcjonalnie planuje kolejny cykl.
 * 
 * @param {string} serviceId Identyfikator realizowanego serwisu
 * @param {Object} completionData Szczegóły wykonania (data, wykonawca, notatki, protokół)
 * @param {Object} [nextPlanData=null] Dane dla automatycznego zaplanowania kolejnego cyklu
 * @param {Object} [actionItemData=null] Opcjonalne dodatkowe zadanie do realizacji (Action Item)
 * @returns {Promise<void>}
 */
export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null, actionItemData = null) => {
  const batch = writeBatch(db);
  const serviceRef = doc(db, 'planned_services', serviceId);
  
  const payload = {
    status: SERVICE_STATUS.COMPLETED,
    completedAt: serverTimestamp(),
    completionDetails: completionData
  };
  
  if (completionData.historyEntry) {
    payload.history = arrayUnion(completionData.historyEntry);
    delete payload.completionDetails.historyEntry;
  }
  
  batch.update(serviceRef, payload);

  // Generujemy nowy plan serwisowy na kolejny cykl
  if (nextPlanData) {
    const nextDataObj = {
      ...nextPlanData,
      status: SERVICE_STATUS.PENDING,
      createdAt: serverTimestamp()
    };
    const nextDateRaw = nextDataObj.nextDate;
    if (nextDateRaw && typeof nextDateRaw.toISOString === 'function') {
      nextDataObj.nextDate = nextDateRaw.toISOString();
    }
    const newServiceRef = doc(collection(db, 'planned_services'));
    batch.set(newServiceRef, nextDataObj);
  }

  // Generujemy action item (tematy do realizacji), jeśli dodano podczas odbioru
  if (actionItemData) {
    const newActionItemRef = doc(collection(db, 'action_items'));
    batch.set(newActionItemRef, actionItemData);
  }

  await batch.commit();
};

/**
 * Mechanizm sprawdzający zbliżające się terminy planowanych przeglądów dla aktywnych serwisów.
 * Sprawdza progi czasowe i progowe roboczogodziny zdefiniowane w constants.js.
 * Jeśli zbliża się termin i nie wysłano jeszcze powiadomienia, generuje alert w systemie.
 * 
 * @param {Record<string, Object>} machinesMap Słownik maszyn po ich ID
 * @returns {Promise<void>}
 */
export const checkAndTriggerDueServices = async (machinesMap) => {
  try {
    const q = query(
      collection(db, 'planned_services'), 
      where('status', '==', SERVICE_STATUS.PENDING)
    );
    const snapshot = await getDocs(q);
    
    const now = new Date();
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
            
            // Alert jeśli pozostało mniej niż zdefiniowany próg dni
            if (daysLeft <= TIME_THRESHOLDS.CRITICAL_DAYS_WARNING) {
              shouldAlert = true;
              alertMessage = `Zbliża się termin planowanego przeglądu "${data.name}" (zostało ${Math.max(0, Math.ceil(daysLeft))} dni).`;
            }
          }
        }

        // Sprawdzanie dla triggera LICZNIKOWEGO (roboczogodziny)
        if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
          if (data.targetWorkHours && machine.currentWorkHours) {
            const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
            // Alert jeśli pozostało mniej niż próg roboczogodzin
            if (hoursLeft <= TIME_THRESHOLDS.CRITICAL_HOURS_WARNING && hoursLeft >= 0) {
              shouldAlert = true;
              alertMessage = `Zbliża się termin przeglądu liczonego w roboczogodzinach "${data.name}" (zostało ${hoursLeft} rbg).`;
            }
          }
        }

        if (shouldAlert) {
          // Wysyłamy powiadomienie do batcha
          const newNotifRef = doc(collection(db, 'notifications'));
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
