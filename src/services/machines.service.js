import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
  increment,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';
import { logAudit } from './audit.service';

/**
 * Zwiększa lub ustawia licznik godzin pracy / przebiegu dla maszyny lub pojazdu
 * i dopisuje wpis do historii aktualizacji (workHoursHistory).
 */
export const updateMachineWorkHours = async (
  machineId,
  newHours,
  isDelta = false,
  updatedBy = null
) => {
  try {
    const machineRef = doc(db, 'tenants', getCurrentTenant(), 'machines', machineId);
    const authorName =
      updatedBy ||
      auth?.currentUser?.displayName ||
      auth?.currentUser?.email ||
      (auth?.currentUser?.isAnonymous ? 'Szybkie Zgłoszenie (QR/NFC)' : 'Operator');

    if (isDelta) {
      await updateDoc(machineRef, {
        currentWorkHours: increment(newHours),
        lastWorkHoursUpdate: serverTimestamp(),
      });
    } else {
      const historyEntry = {
        hours: Number(newHours),
        date: new Date().toISOString(),
        user: authorName,
      };
      await updateDoc(machineRef, {
        currentWorkHours: Number(newHours),
        lastWorkHoursUpdate: serverTimestamp(),
        workHoursHistory: arrayUnion(historyEntry),
      });
    }

    logAudit('UPDATE', 'MACHINE', machineId, { currentWorkHours: Number(newHours) });
    return true;
  } catch (error) {
    console.error('Błąd aktualizacji roboczogodzin maszyny:', error);
    throw error;
  }
};

/**
 * Dodaje nową maszynę do bazy (wraz z datą wygenerowania kodu QR i utworzenia).
 * @param {Object} machineData Dane maszyny
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Referencja do utworzonego dokumentu
 */
export const addMachine = async (machineData) => {
  const payload = {
    ...machineData,
    createdAt: machineData.createdAt || serverTimestamp(),
    updatedAt: machineData.updatedAt || serverTimestamp(),
    qrCreatedAt: machineData.qrCreatedAt || serverTimestamp(),
    qrNeedsPrint: machineData.qrNeedsPrint !== undefined ? machineData.qrNeedsPrint : true,
    qrPrintedAt: null,
  };
  const res = await addDoc(collection(db, 'tenants', getCurrentTenant(), 'machines'), payload);
  logAudit('CREATE', 'MACHINE', res.id, `Dodano maszynę: ${machineData.name}`);
  return res;
};

export const updateMachine = async (machineId, machineData) => {
  const payload = {
    ...machineData,
    updatedAt: machineData.updatedAt || serverTimestamp(),
    ...(machineData.qrNeedsPrint === false
      ? {}
      : {
          qrNeedsPrint: true,
          qrPrintedAt: null,
        }),
  };
  const res = await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'machines', machineId), payload);
  logAudit('UPDATE', 'MACHINE', machineId, payload);
  return res;
};

export const deleteMachine = async (machineId) => {
  logAudit('DELETE', 'MACHINE', machineId, 'Usunięto maszynę');
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'machines', machineId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: 'System',
  });
};

export const updateMapSettings = async (updateData) => {
  return await setDoc(
    doc(db, 'tenants', getCurrentTenant(), 'settings', 'map'),
    updateData,
    { merge: true }
  );
};

export const subscribeToMapSettings = (callback) => {
  return onSnapshot(doc(db, 'tenants', getCurrentTenant(), 'settings', 'map'), callback);
};

export const updateRegion = async (regionId, updateData) => {
  return await setDoc(
    doc(db, 'tenants', getCurrentTenant(), 'regions', regionId),
    updateData,
    { merge: true }
  );
};

export const updateMachineRegion = async (machineId, updateData) => {
  return await setDoc(
    doc(db, 'tenants', getCurrentTenant(), 'machines', machineId),
    updateData,
    { merge: true }
  );
};
