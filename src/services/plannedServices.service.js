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
  logAudit('CREATE', 'PLANNED_SERVICE', res.id, serviceData);
  return res;
};

/**
 * Aktualizuje istniejący plan serwisowy w bazie.
 * 
 * @param {string} serviceId Identyfikator dokumentu serwisu
 * @param {Object} data Pola do zaktualizowania
 * @returns {Promise<void>}
 */
export const updatePlannedService = async (serviceId, data) => {
  const tenantId = getCurrentTenant();
  const res = await updateDoc(doc(db, 'tenants', tenantId, 'planned_services', serviceId), data);
  logAudit('UPDATE', 'PLANNED_SERVICE', serviceId, data);
  return res;
};

/**
 * Wykonuje miękkie usunięcie (soft-delete) planu serwisowego.
 * 
 * @param {string} serviceId Identyfikator serwisu do usunięcia
 * @returns {Promise<void>}
 */
export const deletePlannedService = async (serviceId) => {
  const tenantId = getCurrentTenant();
  const res = await updateDoc(doc(db, 'tenants', tenantId, 'planned_services', serviceId), { 
    isDeleted: true, 
    deletedAt: serverTimestamp(), 
    deletedBy: 'System' 
  });
  logAudit('DELETE', 'PLANNED_SERVICE', serviceId, { isDeleted: true });
  return res;
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
// Rekurencyjnie zamienia wartości undefined na null, aby Firestore (szczególnie arrayUnion) nigdy nie wyrzucił błędu Unsupported field value: undefined
const sanitizeForFirestore = (val) => {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function' || typeof val._methodName === 'string') return val;
  if (Array.isArray(val)) return val.map(sanitizeForFirestore);
  const out = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = sanitizeForFirestore(v);
  }
  return out;
};

export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null, actionItemData = null) => {
  const tenantId = getCurrentTenant();
  const batch = writeBatch(db);
  const serviceRef = doc(db, 'tenants', tenantId, 'planned_services', serviceId);
  const safeCompletion = sanitizeForFirestore(completionData || {});
  const historyEntry = safeCompletion.historyEntry;
  delete safeCompletion.historyEntry;
  
  const payload = {
    status: SERVICE_STATUS.COMPLETED,
    currentStep: 5,
    completedAt: serverTimestamp(),
    completedBy: safeCompletion.completedBy || 'System',
    completionNotes: safeCompletion.notes || '',
    completedGps: safeCompletion.completedGps || null,
    fGasProtocol: safeCompletion.fGasProtocol || null,
    clientSignature: safeCompletion.clientSignature || null,
    clientSignerName: safeCompletion.clientSignerName || null,
    completionDetails: safeCompletion
  };
  
  if (historyEntry) {
    payload.history = arrayUnion(historyEntry);
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
  logAudit('UPDATE', 'PLANNED_SERVICE', serviceId, 'Zakończono serwis planowany.');
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
    const batches = [];
    let currentBatch = writeBatch(db);
    let currentBatchCount = 0;
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
          const newNotifRef = doc(collection(db, 'tenants', tenantId, 'notifications'));
          currentBatch.set(newNotifRef, {
            title: `Planowany Serwis: ${machine.name}`,
            message: alertMessage,
            isCritical: data.priority === 'Krytyczny',
            linkTo: 'planned_maintenance',
            machineId: data.machineId,
            createdAt: serverTimestamp(),
            read: false
          });
          
          // Aktualizujemy status dokumentu w batchu
          currentBatch.update(docSnap.ref, { notified: true });
          currentBatchCount += 2; // Dodajemy 2 operacje
          hasWrites = true;

          // Jeśli batch zbliża się do limitu (np. > 490), dodajemy go do tablicy i tworzymy nowy
          if (currentBatchCount > 490) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            currentBatchCount = 0;
          }
        }
      }
    }
    
    if (currentBatchCount > 0) {
      batches.push(currentBatch);
    }
    
    if (hasWrites) {
      for (const b of batches) {
        await b.commit();
      }
    }
  } catch (error) {
    console.error("Błąd przy sprawdzaniu terminów Serwisu Planowanego:", error);
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
       transaction.set(txRef, { 
           partId: p.id, 
           type: 'issue_planned', 
           quantity: Number(p.quantity), 
           date: new Date().toISOString(), 
           user: serviceToComplete.completedBy || 'System', 
           notes: 'Zużyto podczas realizacji serwisu: ' + (serviceToComplete.name || ''), 
           totalValue: totalCost, 
           averageUnitPrice: avgUnitPrice, 
           issueDetails: issueDetails, 
           referenceId: serviceToComplete.id, 
           machineId: serviceToComplete.machineId || null, 
           machineName: serviceToComplete.machineName || null,
           createdAt: new Date().toISOString() 
         });
    }
  });
  return finalCost;
};

/**
 * Zamyka serwis planowany, rozlicza ewentualne części i generuje kolejny cykl za pomocą pojedynczej, atomowej transakcji.
 * Zapewnia to integralność bazy danych na wypadek np. przerwania połączenia internetowego.
 */
export const completeServiceWithTransaction = async (serviceToComplete, completionData, nextPlanData = null, actionItemData = null, extraParts = []) => {
  const tenantId = getCurrentTenant();
  
  await runTransaction(db, async (transaction) => {
    // 1. Zbieranie wszystkich części do pobrania (planowane + pozaplanowe)
    const allRequestedParts = [];
    
    if (completionData.partsUsed && serviceToComplete.requiredParts) {
       for (const req of serviceToComplete.requiredParts) {
          if (!req.partId || req.partId === 'custom') continue;
          allRequestedParts.push({ partId: req.partId, quantity: Number(req.quantity || 1), type: 'issue_planned', notes: 'Zużycie planowe: ' + serviceToComplete.name });
       }
    }
    
    for (const ep of extraParts) {
       if (!ep.partId || ep.partId === '') continue;
       allRequestedParts.push({ partId: ep.partId, quantity: Number(ep.quantity || 1), type: 'issue_planned', notes: 'Część dodatkowa (poza planem) - serwis: ' + serviceToComplete.name });
    }

    // 2. Grupowanie ilości jeśli ta sama część została dodana dwukrotnie
    const mergedRequests = {};
    for (const req of allRequestedParts) {
       if (!mergedRequests[req.partId]) {
          mergedRequests[req.partId] = { partId: req.partId, quantity: 0, notes: req.notes, type: req.type };
       }
       mergedRequests[req.partId].quantity += req.quantity;
    }

    // 3. Faza ODCZYTÓW (READS) - Firestore wymaga by wszystkie read-y były przed write-ami w transakcji
    const partsToUpdate = [];
    for (const partId of Object.keys(mergedRequests)) {
       const req = mergedRequests[partId];
       const pRef = doc(db, 'tenants', tenantId, 'parts', partId);
       const pSnap = await transaction.get(pRef);
       if (pSnap.exists()) {
           partsToUpdate.push({
               ref: pRef,
               id: partId,
               currentStock: Number(pSnap.data().stock || 0),
               unitPrice: Number(pSnap.data().unitPrice || 0),
               quantity: req.quantity,
               batches: pSnap.data().batches || [],
               type: req.type,
               notes: req.notes
           });
       }
    }

    // Odczyt opcjonalny - sam serwis do update'u upewnia nas, że dokument nadal istnieje
    const serviceRef = doc(db, 'tenants', tenantId, 'planned_services', serviceToComplete.id);
    await transaction.get(serviceRef); 

    // 4. Faza ZAPISÓW (WRITES)
    let finalCost = 0;
    
    for (const p of partsToUpdate) {
       // Logika FIFO - kanoniczny schemat partii: { qty, price } (zgodny z TicketPartUsageModal / parts.service)
       // Obsługa danych legacy: { quantity, unitPrice }
       const newStock = Math.max(0, p.currentStock - p.quantity);
       let currentBatches = (p.batches || []).map(b => ({
         ...b,
         qty: Number(b.qty ?? b.quantity ?? 0),
         price: Number(b.price ?? b.unitPrice ?? 0)
       })).filter(b => b.qty > 0);
       if (currentBatches.length === 0 && p.currentStock > 0) {
         currentBatches = [{ qty: p.currentStock, price: p.unitPrice, date: new Date().toISOString() }];
       }
       let remainingToIssue = p.quantity;
       let totalCost = 0;
       const issueDetails = [];
       while (remainingToIssue > 0 && currentBatches.length > 0) {
         const oldestBatch = currentBatches[0];
         if (oldestBatch.qty <= remainingToIssue) {
            totalCost += oldestBatch.qty * oldestBatch.price;
            issueDetails.push({ qty: oldestBatch.qty, price: oldestBatch.price });
            remainingToIssue -= oldestBatch.qty;
            currentBatches.shift();
         } else {
            totalCost += remainingToIssue * oldestBatch.price;
            issueDetails.push({ qty: remainingToIssue, price: oldestBatch.price });
            oldestBatch.qty -= remainingToIssue;
            remainingToIssue = 0;
         }
       }
       if (remainingToIssue > 0) {
         // Brak pokrycia w partiach - wyceniamy po cenie katalogowej
         totalCost += remainingToIssue * p.unitPrice;
         issueDetails.push({ qty: remainingToIssue, price: p.unitPrice });
       }
       finalCost += totalCost;
       // Usuwamy pola legacy, aby partie miały jednolity schemat
       const cleanBatches = currentBatches.map(({ quantity, unitPrice, ...rest }) => rest);
       
       transaction.update(p.ref, { stock: newStock, batches: cleanBatches });
       
       const txRef = doc(collection(db, 'tenants', tenantId, 'part_transactions'));
       transaction.set(txRef, { 
           partId: p.id, 
           type: p.type, 
           quantity: -Number(p.quantity), 
           price: p.quantity > 0 ? totalCost / p.quantity : 0,
           totalCost: totalCost,
           issueDetails: issueDetails,
           date: new Date().toISOString(), 
           user: completionData.completedBy || 'System',
           notes: p.notes,
           referenceId: serviceToComplete.id,
           machineId: serviceToComplete.machineId || null,
           machineName: serviceToComplete.machineName || null,
           createdAt: serverTimestamp()
       });
    }

    // Aktualizacja kosztu w notatce historycznej
    if (completionData.historyEntry && finalCost > 0) {
       completionData.historyEntry.cost = finalCost;
       completionData.historyEntry.note = (completionData.historyEntry.note ? completionData.historyEntry.note + '\n' : '') + 'Zużyto części o wartości: ' + finalCost.toLocaleString('pl-PL') + ' PLN.';
    }

    // Aktualizacja statusu serwisu
    const safeCompletion = sanitizeForFirestore(completionData || {});
    const safeHistoryEntry = safeCompletion.historyEntry;
    delete safeCompletion.historyEntry;

    const payload = {
      status: SERVICE_STATUS.COMPLETED,
      currentStep: 5,
      completedAt: serverTimestamp(),
      completedBy: safeCompletion.completedBy || 'System',
      completionNotes: safeCompletion.notes || '',
      completedGps: safeCompletion.completedGps || null,
      fGasProtocol: safeCompletion.fGasProtocol || null,
      clientSignature: safeCompletion.clientSignature || null,
      clientSignerName: safeCompletion.clientSignerName || null,
      completionDetails: safeCompletion
    };
    
    if (safeHistoryEntry) {
      payload.history = arrayUnion(safeHistoryEntry);
    }
    transaction.update(serviceRef, payload);

    // Wygenerowanie następnego cyklu
    if (nextPlanData) {
      const nextDataObj = sanitizeForFirestore({
        ...nextPlanData,
        status: SERVICE_STATUS.PENDING,
        createdAt: serverTimestamp()
      });
      const nextDateRaw = nextDataObj.nextDate;
      if (nextDateRaw && typeof nextDateRaw.toISOString === 'function') {
        nextDataObj.nextDate = nextDateRaw.toISOString();
      }
      const newServiceRef = doc(collection(db, 'tenants', tenantId, 'planned_services'));
      transaction.set(newServiceRef, nextDataObj);
    }

    // Wygenerowanie tematu do realizacji
    if (actionItemData) {
      const newActionItemRef = doc(collection(db, 'tenants', tenantId, 'action_items'));
      transaction.set(newActionItemRef, sanitizeForFirestore(actionItemData));
    }
  });

  logAudit('UPDATE', 'PLANNED_SERVICE', serviceToComplete.id, 'Zakończono serwis planowany (Pełna atomowa transakcja).');
};
