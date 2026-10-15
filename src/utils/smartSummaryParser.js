// Normalizacja wyniku "Inteligentnego podsumowania serwisu" (AI voice to text -> Gemini -> szablon).
// Odporna na różne nazwy kluczy / typy wartości zwracane przez model oraz na fallback
// do surowej transkrypcji (gdy Gemini nie odpowie). Zdania potwierdzające zużycie części
// trafiają do checkboxa, a NIE do notatki.

// Zdanie potwierdzające zużycie części, np.:
// "Potwierdzam zużycie wymaganych części planowych", "Potwierdzam użycie wymaganych części",
// "Zużyłem wymagane części", "Wymieniono części zgodnie z planem"
const PARTS_CONFIRM_RE = /(potwierdzam|potwierdzono|potwierdzić|zużyłem|zużyliśmy|zużyto|użyłem|użyliśmy|użyto|wykorzystałem|wykorzystano|wymieniłem|wymieniono)[^.!?\n]{0,60}częś\w*/i;
const PARTS_NEGATION_RE = /\bnie\s+(zużyłem|zużyliśmy|zużyto|użyłem|użyto|wykorzystałem|wykorzystano|wymieniłem|wymieniono|potwierdzam)/i;

const TRUE_VALUES = ['true', 'tak', 'yes', '1', 'y', 't'];

const toBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') return TRUE_VALUES.includes(val.trim().toLowerCase());
  return undefined;
};

const toNumber = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? undefined : n;
};

const splitSentences = (text) =>
  String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

/** Usuwa z notatki zdania potwierdzające zużycie części. Zwraca { note, confirmed }. */
export const stripPartsConfirmation = (text) => {
  let confirmed = false;
  const kept = [];
  for (const sentence of splitSentences(text)) {
    if (PARTS_CONFIRM_RE.test(sentence) && !PARTS_NEGATION_RE.test(sentence)) {
      confirmed = true;
      continue;
    }
    kept.push(sentence);
  }
  return { note: kept.join(' ').trim(), confirmed };
};

/**
 * @param {object|string} result wynik z DictationButton mode="smart"
 * @returns {{ note: string, manHours?: number, partsUsed?: boolean, createActionItem: boolean, actionItemDetails: string, actionItemDays?: number }}
 */
export const normalizeSmartSummary = (result) => {
  if (typeof result === 'string') {
    const { note, confirmed } = stripPartsConfirmation(result);
    return { note, partsUsed: confirmed ? true : undefined, createActionItem: false, actionItemDetails: '' };
  }
  if (!result || typeof result !== 'object') {
    return { note: '', createActionItem: false, actionItemDetails: '' };
  }

  const rawNote = result.czysta_notatka ?? result.notatka ?? result.note ?? result.notes ?? '';
  const { note, confirmed } = stripPartsConfirmation(rawNote);

  let partsUsed = toBool(result.zuzyto_wymagane_czesci ?? result.zuzyto_czesci ?? result.partsUsed ?? result.parts_used);
  if (confirmed && partsUsed !== false) partsUsed = true;

  const manHours = toNumber(result.czas_pracy ?? result.timeSpentHours ?? result.manHours);

  const actionItemDetails = String(result.szczegoly_tematu ?? result.actionItem ?? result.temat ?? '').trim();
  const createActionItem = Boolean(toBool(result.tematy_do_realizacji) || actionItemDetails);
  const actionItemDays = toNumber(result.termin_dni ?? result.actionItemDays);

  return { note, manHours, partsUsed, createActionItem, actionItemDetails, actionItemDays };
};

export const daysFromNowISODate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
