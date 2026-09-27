/**
 * Słownik polskich komunikatów dla aplikacji.
 * Przygotowanie pod ewentualne wdrożenie i18n (umiędzynarodowienia).
 */
export const MESSAGES = {
  // Błędy
  ERRORS: {
    FETCH_FAILED: 'Nie udało się pobrać danych.',
    SAVE_FAILED: 'Wystąpił błąd podczas zapisywania.',
    DELETE_FAILED: 'Nie udało się usunąć obiektu.',
    UNAUTHORIZED: 'Brak wymaganych uprawnień do wykonania tej akcji.',
    NETWORK_ERROR: 'Błąd sieci. Sprawdź swoje połączenie z internetem.',
    REQUIRED_FIELDS: 'Wypełnij wszystkie wymagane pola.',
    FILE_UPLOAD_FAILED: 'Nie udało się wgrać pliku.',
  },
  // Sukcesy
  SUCCESS: {
    SAVED: 'Pomyślnie zapisano.',
    DELETED: 'Pomyślnie usunięto.',
    UPDATED: 'Pomyślnie zaktualizowano.',
    SENT: 'Wysłano pomyślnie.',
  },
  // Typowe etykiety
  LABELS: {
    SAVE: 'Zapisz',
    CANCEL: 'Anuluj',
    DELETE: 'Usuń',
    EDIT: 'Edytuj',
    SEARCH: 'Szukaj',
    LOADING: 'Ładowanie...',
    NO_DATA: 'Brak danych do wyświetlenia.',
  },
  // Etapy (Statusy)
  STATUSES: {
    TICKET_NEW: 'Zgłoszono nową awarię',
    TICKET_ASSIGNED: 'Wybór wykonawcy',
    TICKET_START: 'Rozpoczęcie naprawy',
    TICKET_IN_PROGRESS: 'Naprawa w trakcie',
    TICKET_CLOSED: 'Zakończenie naprawy',
  },
  // Powiadomienia
  NOTIFICATIONS: {
    NEW_TICKET_PREFIX: 'Nowa awaria:',
    STATUS_CHANGED: 'Zmiana statusu:',
  }
};
