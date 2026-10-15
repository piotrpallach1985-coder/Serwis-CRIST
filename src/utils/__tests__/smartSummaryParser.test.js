import { describe, it, expect } from 'vitest';
import { normalizeSmartSummary, stripPartsConfirmation } from '../smartSummaryParser';

describe('smartSummaryParser', () => {
  it('przenosi potwierdzenie zużycia części z notatki do checkboxa', () => {
    const r = normalizeSmartSummary({
      czas_pracy: 3.5,
      czysta_notatka: 'Potwierdzam zużycie wymaganych części planowych. Prace serwisowe przebiegły poprawnie, nie ma zastrzeżeń.'
    });
    expect(r.partsUsed).toBe(true);
    expect(r.note).toBe('Prace serwisowe przebiegły poprawnie, nie ma zastrzeżeń.');
    expect(r.manHours).toBe(3.5);
  });

  it('obsługuje wariant "użycie" i fallback tekstowy', () => {
    const r = normalizeSmartSummary('Potwierdzam użycie wymaganych części. Serwis przeszedł bez problemów.');
    expect(r.partsUsed).toBe(true);
    expect(r.note).toBe('Serwis przeszedł bez problemów.');
  });

  it('nie zaznacza przy zaprzeczeniu', () => {
    const { confirmed } = stripPartsConfirmation('Nie zużyłem żadnych części.');
    expect(confirmed).toBe(false);
  });

  it('akceptuje wartości tekstowe i przecinek dziesiętny', () => {
    const r = normalizeSmartSummary({ zuzyto_wymagane_czesci: 'tak', czas_pracy: '2,5', szczegoly_tematu: 'Wymienić pasek', termin_dni: '14' });
    expect(r.partsUsed).toBe(true);
    expect(r.manHours).toBe(2.5);
    expect(r.createActionItem).toBe(true);
    expect(r.actionItemDays).toBe(14);
  });
});
