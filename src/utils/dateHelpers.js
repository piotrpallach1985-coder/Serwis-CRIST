/**
 * Bezpiecznie parsuje datę z dowolnego formatu (Firebase Timestamp, JS Date, String, Number).
 * @param {any} dateVal Wartość daty do przetworzenia.
 * @returns {Date|null} Zwraca obiekt JS Date lub null w przypadku błędu.
 */
export const safeParseDate = (dateVal) => {
  if (!dateVal) return null;
  // Firestore Timestamp
  if (typeof dateVal.toDate === 'function') return dateVal.toDate();
  // Firestore Timestamp stored as plain object
  if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
  
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};
