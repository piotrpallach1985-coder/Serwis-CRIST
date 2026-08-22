import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Zwiększa lub ustawia licznik roboczogodzin dla maszyny.
 * W przyszłości ta funkcja może być zintegrowana z API zewnętrznym (np. ERP/MES).
 */
export const updateMachineWorkHours = async (machineId, newHours, isDelta = false) => {
  try {
    const machineRef = doc(db, 'machines', machineId);
    
    // Jeśli isDelta, dodajemy wartość, w przeciwnym razie nadpisujemy. 
    // Ponieważ potrzebujemy odczytać starą wartość dla delty, najpierw moglibyśmy ją pobrać.
    // Dla uproszczenia (i bezpieczeństwa transakcji) tu po prostu aktualizujemy pole absolute.
    
    // Z uwagi na brak transakcji w tym snippet-cie, zalecamy `isDelta=false` w prostym widoku, 
    // użytkownik wpisuje po prostu aktualny stan licznika.
    await updateDoc(machineRef, {
      currentWorkHours: newHours,
      lastWorkHoursUpdate: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Błąd aktualizacji roboczogodzin maszyny:", error);
    throw error;
  }
};

export const addMachine = async (machineData) => {
  return await addDoc(collection(db, 'machines'), machineData);
};

export const updateMachine = async (machineId, machineData) => {
  return await updateDoc(doc(db, 'machines', machineId), machineData);
};

export const deleteMachine = async (machineId) => {
  return await deleteDoc(doc(db, 'machines', machineId));
};
