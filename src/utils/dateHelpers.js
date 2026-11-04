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

/**
 * Oblicza za ile dni (lub ile dni po terminie) zaplanowany jest serwis względem dzisiejszej daty.
 * @param {any} dateVal Wartość daty planowanego serwisu.
 * @param {any} nowRef Opcjonalna data odniesienia (do testów).
 * @returns {{ diffDays: number, label: string, badgeClass: string, textClass: string } | null}
 */
export const getPlannedDateRelativeInfo = (dateVal, nowRef = new Date()) => {
  const target = safeParseDate(dateVal);
  if (!target) return null;

  const baseNow = safeParseDate(nowRef) || new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowMidnight = new Date(baseNow.getFullYear(), baseNow.getMonth(), baseNow.getDate());

  const diffDays = Math.round((targetMidnight.getTime() - nowMidnight.getTime()) / 86400000);

  let label = '';
  if (diffDays > 1) {
    label = `za ${diffDays} dni`;
  } else if (diffDays === 1) {
    label = 'za 1 dzień';
  } else if (diffDays === 0) {
    label = 'dzisiaj';
  } else if (diffDays === -1) {
    label = '1 dzień po terminie';
  } else {
    label = `${Math.abs(diffDays)} dni po terminie`;
  }

  let badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
  let textClass = 'text-blue-600';

  if (diffDays < 0) {
    badgeClass = 'bg-red-50 text-red-700 border border-red-200';
    textClass = 'text-red-600';
  } else if (diffDays <= 7) {
    badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
    textClass = 'text-amber-700';
  }

  return { diffDays, label, badgeClass, textClass };
};
