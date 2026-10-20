import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';
import { logAudit } from './audit.service';

/**
 * Zwiększa lub ustawia licznik roboczogodzin dla maszyny.
 * W przyszłości ta funkcja może być zintegrowana z API zewnętrznym (np. ERP/MES).
 */
export const updateMachineWorkHours = async (machineId, newHours, isDelta = false) => {
  try {
    const machineRef = doc(db, 'tenants', getCurrentTenant(), 'machines', machineId);

    if (isDelta) {
      await updateDoc(machineRef, {
        currentWorkHours: increment(newHours),
        lastWorkHoursUpdate: serverTimestamp(),
      });
    } else {
      await updateDoc(machineRef, {
        currentWorkHours: newHours,
        lastWorkHoursUpdate: serverTimestamp(),
      });
    }

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
  };
  const res = await addDoc(collection(db, 'tenants', getCurrentTenant(), 'machines'), payload);
  logAudit('CREATE', 'MACHINE', res.id, `Dodano maszynę: ${machineData.name}`);
  return res;
};

export const updateMachine = async (machineId, machineData) => {
  const payload = {
    ...machineData,
    updatedAt: machineData.updatedAt || serverTimestamp(),
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
