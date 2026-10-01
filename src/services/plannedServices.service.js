import { useManagerStore } from '../store/managerStore';
import { runTransaction, collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, arrayUnion, writeBatch, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { logAudit } from './audit.service';
import { createNotification } from './notifications.service';
import { SERVICE_STATUS, TIME_THRESHOLDS } from '../utils/constants';
import { getCurrentTenant } from '../utils/tenantHelper';


/**
 * Dodaje nowy plan serwisowy do bazy danych.
 * 
 * @param {Object} serviceData Dane definiujÄ…ce plan serwisowy
 * @param {string} serviceData.name Nazwa przeglÄ…du/serwisu
 * @param {string} serviceData.machineId ID przypisanej maszyny
 * @param {string} [serviceData.triggerType='calendar'] Typ wyzwalacza: 'calendar' | 'hours' | 'mixed'
 * @param {string} [serviceData.nextDate] Kolejna data przeglÄ…du
 * @param {number} [serviceData.targetWorkHours] Docelowa liczba rbg
 * @param {Array<Object>} [serviceData.history] Historia wykonanych przeglÄ…dĂłw
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Referencja do utworzonego dokumentu
 */
export const addPlannedService = async (serviceData) => {
  const tenantId = getCurrentTenant();
  const res = await addDoc(collection(db, 'tenants', tenantId, 'planned_services'), {

    ...serviceData,
    createdAt: serverTimestamp(),
    status: SERVICE_STATUS.PENDING,
    history: serviceData.history || []
  });
};

/**
 * Aktualizuje istniejÄ…cy plan serwisowy w bazie.
 * 
 * @param {string} serviceId Identyfikator dokumentu serwisu
 * @param {Object} data Pola do zaktualizowania
 * @returns {Promise<void>}
 */
export const updatePlannedService = async (serviceId, data) => {
  const tenantId = getCurrentTenant();
  return await updateDoc(doc(db, 'tenants', tenantId, 'planned_services', serviceId), data);
};

/**
 * Wykonuje miÄ™kkie usuniÄ™cie (soft-delete) planu serwisowego.
 * 
 * @param {string} serviceId Identyfikator serwisu do usuniÄ™cia
 * @returns {Promise<void>}
 */
export const deletePlannedService = async (serviceId) => {
  const tenantId = getCurrentTenant();
  return await updateDoc(doc(db, 'tenants', tenantId, 'planned_services', serviceId), { 
    isDeleted: true, 
    deletedAt: serverTimestamp(), 
    deletedBy: 'System' 
  });
};

/**
 * Oznacza serwis jako zrealizowany, zapisuje historiÄ™ oraz opcjonalnie planuje kolejny cykl.
 * 
 * @param {string} serviceId Identyfikator realizowanego serwisu
 * @param {Object} completionData SzczegĂłĹ‚y wykonania (data, wykonawca, notatki, protokĂłĹ‚)
 * @param {Object} [nextPlanData=null] Dane dla automatycznego zaplanowania kolejnego cyklu
 * @param {Object} [actionItemData=null] Opcjonalne dodatkowe zadanie do realizacji (Action Item)
 * @returns {Promise<void>}
 */
export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null, actionItemData = null) => {
  const tenantId = getCurrentTenant();
  const batch = writeBatch(db);
  const serviceRef = doc(db, 'tenants', tenantId, 'planned_services', serviceId);
  
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
    const newServiceRef = doc(collection(db, 'tenants', tenantId, 'planned_services'));
    batch.set(newServiceRef, nextDataObj);
  }

  // Generujemy action item (tematy do realizacji), jeĹ›li dodano podczas odbioru
  if (actionItemData) {
    const newActionItemRef = doc(collection(db, 'tenants', getCurrentTenant(), 'action_items'));
    batch.set(newActionItemRef, actionItemData);
  }

  await batch.commit();
};

/**
 * Mechanizm sprawdzajÄ…cy zbliĹĽajÄ…ce siÄ™ terminy planowanych przeglÄ…dĂłw dla aktywnych serwisĂłw.
 * Sprawdza progi czasowe i progowe roboczogodziny zdefiniowane w constants.js.
 * JeĹ›li zbliĹĽa siÄ™ termin i nie wysĹ‚ano jeszcze powiadomienia, generuje alert w systemie.
 * 
 * @param {Record<string, Object>} machinesMap SĹ‚ownik maszyn po ich ID
 * @returns {Promise<void>}
 */
export const checkAndTriggerDueServices = async (machinesMap) => {
  const tenantId = getCurrentTenant();
  try {
    const q = query(
      collection(db, 'tenants', tenantId, 'planned_services'), 
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
            
            // Alert jeĹ›li pozostaĹ‚o mniej niĹĽ zdefiniowany prĂłg dni
            if (daysLeft <= TIME_THRESHOLDS.CRITICAL_DAYS_WARNING) {
              shouldAlert = true;
              alertMessage = `ZbliĹĽa siÄ™ termin planowanego przeglÄ…du "${data.name}" (zostaĹ‚o ${Math.max(0, Math.ceil(daysLeft))} dni).`;
            }
          }
        }

        // Sprawdzanie dla triggera LICZNIKOWEGO (roboczogodziny)
        if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
          if (data.targetWorkHours && machine.currentWorkHours) {
            const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
            // Alert jeĹ›li pozostaĹ‚o mniej niĹĽ prĂłg roboczogodzin
            if (hoursLeft <= TIME_THRESHOLDS.CRITICAL_HOURS_WARNING && hoursLeft >= 0) {
              shouldAlert = true;
              alertMessage = `ZbliĹĽa siÄ™ termin przeglÄ…du liczonego w roboczogodzinach "${data.name}" (zostaĹ‚o ${hoursLeft} rbg).`;
            }
          }
        }

        if (shouldAlert) {
          // WysyĹ‚amy powiadomienie do batcha
          const newNotifRef = doc(collection(db, 'tenants', getCurrentTenant(), 'notifications'));
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
    console.error("BĹ‚Ä…d przy sprawdzaniu terminĂłw Serwisu Planowanego:", error);
  }
};

export const fetchArchiveServices = async (lastDoc = null, itemsLimit = 100) => {
  let q;
  const colRef = collection(db, 'tenants', getCurrentTenant(), 'planned_services');
  if (lastDoc) {
    q = query(colRef, orderBy('completedAt', 'desc'), startAfter(lastDoc), limit(itemsLimit));
  } else {
    q = query(colRef, orderBy('completedAt', 'desc'), limit(itemsLimit));
  }
  return await getDocs(q);
};

export const fetchMachineServices = async (machineId) => {
  const q = query(collection(db, 'tenants', getCurrentTenant(), 'planned_services'), where('machineId', '==', machineId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.isDeleted);
};

export const fetchPendingMachineServices = async (machineId) => {
  const q = query(
    collection(db, 'tenants', getCurrentTenant(), 'planned_services'), 
    where('machineId', '==', machineId), 
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.isDeleted);
};

export const addPartTransaction = async (data) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'part_transactions'), data);
};

export const getPartRef = (partId) => doc(db, 'tenants', getCurrentTenant(), 'parts', partId);



export const processServicePartsTransaction = async (serviceToComplete) => {
  const tenantId = getCurrentTenant();
  let finalCost = 0;
  await runTransaction(db, async (transaction) => {
    const partsToUpdate = [];
    for (const req of serviceToComplete.requiredParts) {
       if (!req.partId || req.partId === 'custom') continue;
       const pRef = doc(db, 'tenants', tenantId, 'parts', req.partId);
       const pSnap = await transaction.get(pRef);
       if (pSnap.exists()) {
         partsToUpdate.push({ ref: pRef, id: req.partId, currentStock: Number(pSnap.data().stock || 0), unitPrice: Number(pSnap.data().unitPrice || req.unitCost || 0), quantity: Number(req.quantity || 1), batches: pSnap.data().batches || [] });
       }
    }
    for (const p of partsToUpdate) {
       const newStock = Math.max(0, p.currentStock - p.quantity);
       let currentBatches = [...p.batches];
       let remainingToIssue = p.quantity;
       let totalCost = 0;
       let issueDetails = [];
       while (remainingToIssue > 0 && currentBatches.length > 0) {
         let currentBatch = currentBatches[0];
         if (currentBatch.quantity <= remainingToIssue) {
            totalCost += currentBatch.quantity * currentBatch.unitPrice;
            issueDetails.push({ quantity: currentBatch.quantity, unitPrice: currentBatch.unitPrice });
            remainingToIssue -= currentBatch.quantity;
            currentBatches.shift();
         } else {
            totalCost += remainingToIssue * currentBatch.unitPrice;
            issueDetails.push({ quantity: remainingToIssue, unitPrice: currentBatch.unitPrice });
            currentBatch.quantity -= remainingToIssue;
            remainingToIssue = 0;
         }
       }
       if (remainingToIssue > 0) {
         totalCost += remainingToIssue * p.unitPrice;
         issueDetails.push({ quantity: remainingToIssue, unitPrice: p.unitPrice });
       }
       const avgUnitPrice = totalCost / p.quantity;
       finalCost += totalCost;
       transaction.update(p.ref, { stock: newStock, batches: currentBatches });
       const txRef = doc(collection(db, 'tenants', tenantId, 'part_transactions'));
       transaction.set(txRef, { partId: p.id, type: 'issue', quantity: p.quantity, date: serverTimestamp(), user: 'System', notes: 'Zuzyto podczas realizacji serwisu', totalValue: totalCost, averageUnitPrice: avgUnitPrice, issueDetails: issueDetails, createdAt: serverTimestamp() });
    }
  });
  return finalCost;
};
