import {  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp , increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';


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
        lastWorkHoursUpdate: serverTimestamp()
      });
    } else {
      await updateDoc(machineRef, {
        currentWorkHours: newHours,
        lastWorkHoursUpdate: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Błąd aktualizacji roboczogodzin maszyny:", error);
    throw error;
  }
};

/**
 * Dodaje nową maszynę do bazy.
 * @param {Object} machineData Dane maszyny
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Referencja do utworzonego dokumentu
 */
export const addMachine = async (machineData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'machines'), machineData);
};

export const updateMachine = async (machineId, machineData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'machines', machineId), machineData);
};

export const deleteMachine = async (machineId) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'machines', machineId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: 'System' });
};
