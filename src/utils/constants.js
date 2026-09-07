/**
 * @file constants.js
 * @description Centralny rejestr stałych, enumów i progów konfiguracyjnych dla aplikacji Serwis CRIST.
 * Konwencja: Nazwy zmiennych i kluczy w języku angielskim, opisy i etykiety UI w języku polskim.
 */

/**
 * Statusy zgłoszeń awarii (Tickets).
 * @readonly
 * @enum {number}
 */
export const TICKET_STATUS = Object.freeze({
  OPEN: 1,         // Nowe / Otwarte
  VERIFICATION: 2, // W trakcie weryfikacji
  PENDING: 3,      // Oczekujące (np. na części)
  IN_PROGRESS: 4,  // W trakcie naprawy
  CLOSED: 5,       // Zakończone / Zamknięte
});

/**
 * Mapowanie statusów zgłoszeń na czytelne etykiety w języku polskim.
 * @type {Record<number, string>}
 */
export const TICKET_STATUS_LABELS = Object.freeze({
  [TICKET_STATUS.OPEN]: 'Otwarte',
  [TICKET_STATUS.VERIFICATION]: 'Weryfikacja',
  [TICKET_STATUS.PENDING]: 'Oczekujące',
  [TICKET_STATUS.IN_PROGRESS]: 'W trakcie',
  [TICKET_STATUS.CLOSED]: 'Zakończone',
});

/**
 * Statusy planowanych serwisów i przeglądów prewencyjnych (Planned Maintenance).
 * @readonly
 * @enum {string}
 */
export const SERVICE_STATUS = Object.freeze({
  PENDING: 'pending',         // Oczekujący na realizację
  IN_PROGRESS: 'in_progress', // W trakcie realizacji
  COMPLETED: 'completed',     // Zakończony i rozliczony
});

/**
 * Mapowanie statusów serwisów na czytelne etykiety w języku polskim.
 * @type {Record<string, string>}
 */
export const SERVICE_STATUS_LABELS = Object.freeze({
  [SERVICE_STATUS.PENDING]: 'Oczekujący',
  [SERVICE_STATUS.IN_PROGRESS]: 'W trakcie',
  [SERVICE_STATUS.COMPLETED]: 'Zakończony',
});

/**
 * Statusy tematów do realizacji (Action Items).
 * @readonly
 * @enum {string}
 */
export const ACTION_ITEM_STATUS = Object.freeze({
  PENDING: 'pending',     // Do wykonania / otwarte
  COMPLETED: 'completed', // Zrealizowane
});

/**
 * Mapowanie statusów tematów do realizacji na etykiety w języku polskim.
 * @type {Record<string, string>}
 */
export const ACTION_ITEM_STATUS_LABELS = Object.freeze({
  [ACTION_ITEM_STATUS.PENDING]: 'Oczekujące',
  [ACTION_ITEM_STATUS.COMPLETED]: 'Zrealizowane',
});

/**
 * Role użytkowników w systemie.
 * @readonly
 * @enum {string}
 */
export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'kierownik',
  MANAGER_ALT: 'manager',
  OPERATOR: 'operator',
  TECH: 'tech',
});

/**
 * Progi czasowe i konfiguracyjne (godziny, dni).
 * @readonly
 */
export const TIME_THRESHOLDS = Object.freeze({
  /** Standardowy okres wyprzedzenia przeglądów (dni) */
  UPCOMING_DAYS_DEFAULT: 30,
  /** Krytyczny czas ostrzegawczy przed przekroczeniem terminu (dni) */
  CRITICAL_DAYS_WARNING: 7,
  /** Krytyczny margines roboczogodzin przed wymaganym serwisem (godziny) */
  CRITICAL_HOURS_WARNING: 50,
  /** Domyślny przelicznik roboczogodzin na dzień roboczy */
  WORK_HOURS_PER_DAY: 8,
});

/**
 * Statusy pinesek na mapie stoczni / maszyn.
 * @readonly
 * @enum {string}
 */
export const PIN_STATUS = Object.freeze({
  CRITICAL: 'critical',
  IN_PROGRESS: 'in_progress',
  WARNING: 'warning',
  OK: 'ok',
});
