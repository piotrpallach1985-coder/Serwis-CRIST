import { getCurrentTenant } from '../utils/tenantHelper';
import { db } from '../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { useManagerStore } from '../store/managerStore';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Przetwarza surowy tekst z notatki technika i rozbija go na ustrukturyzowane dane
 * (notatka, przepracowane godziny, akcje do podjęcia w przyszłości) przy użyciu AI.
 */
export async function extractServiceDataWithAI(rawText) {
  try {
    const extractServiceDataFn = httpsCallable(functions, 'extractServiceData');
    const result = await extractServiceDataFn({ rawText });
    return result.data;
  } catch (error) {
    console.error('Błąd wywoływania Cloud Function extractServiceData:', error);
    throw new Error('Nie udało się przeanalizować tekstu. Funkcja sieciowa zwróciła błąd.');
  }
}
