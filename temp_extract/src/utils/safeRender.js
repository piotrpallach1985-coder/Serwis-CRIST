/**
 * Safely converts any value to a renderable string for JSX.
 * Prevents React Error #300 ("Objects are not valid as a React child").
 * @param {any} val - The value to render
 * @param {string} fallback - Fallback string if val is null/undefined
 * @returns {string} A safe string representation
 */
export function safe(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  // Firebase Timestamp
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    try { return val.toDate().toLocaleString('pl-PL'); } catch { return fallback; }
  }
  // Firebase Timestamp as plain object
  if (typeof val === 'object' && val.seconds !== undefined) {
    try { return new Date(val.seconds * 1000).toLocaleString('pl-PL'); } catch { return fallback; }
  }
  // Any other object or array
  if (typeof val === 'object') {
    try { return JSON.stringify(val); } catch { return '[obiekt]'; }
  }
  return String(val);
}
