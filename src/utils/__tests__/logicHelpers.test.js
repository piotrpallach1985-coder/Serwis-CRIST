import { describe, it, expect, vi } from 'vitest';
import { checkInventoryStatus, checkServiceUrgency } from '../logicHelpers';

describe('logicHelpers.js', () => {
  describe('checkInventoryStatus', () => {
    it('zwraca domyślne wartości gdy part jest null', () => {
      const result = checkInventoryStatus(null);
      expect(result).toEqual({ isOut: false, isLow: false, isOk: true, available: 0 });
    });

    it('poprawnie wylicza stan isOk gdy available > minStock', () => {
      const part = { stock: 100, minStock: 10 };
      const result = checkInventoryStatus(part, 0); // 100 dostepnych
      expect(result.isOk).toBe(true);
      expect(result.isLow).toBe(false);
      expect(result.isOut).toBe(false);
      expect(result.available).toBe(100);
    });

    it('poprawnie wylicza stan isLow z uwzględnieniem rezerwacji', () => {
      const part = { stock: 20, minStock: 10 };
      const result = checkInventoryStatus(part, 11); // 9 dostepnych, 11 zarezerwowanych
      expect(result.isOk).toBe(false);
      expect(result.isLow).toBe(true);
      expect(result.isOut).toBe(false);
      expect(result.available).toBe(9);
    });

    it('poprawnie wylicza stan isOut gdy dostepnosc spada <= 0', () => {
      const part = { stock: 10, minStock: 5 };
      const result = checkInventoryStatus(part, 15); // -5 dostepnych (przekroczona rezerwacja)
      expect(result.isOk).toBe(false);
      expect(result.isLow).toBe(false);
      expect(result.isOut).toBe(true);
    });

    it('używa pola available bezposrednio, jeśli istnieje', () => {
      const part = { available: 5, minStock: 10, stock: 20 };
      const result = checkInventoryStatus(part);
      expect(result.available).toBe(5);
      expect(result.isLow).toBe(true);
    });
  });

  describe('checkServiceUrgency', () => {
    it('zwraca domyślne flagi gdy service nie istnieje', () => {
      const result = checkServiceUrgency(null);
      expect(result.isOverdue).toBe(false);
      expect(result.isUpcoming).toBe(false);
    });

    // Ustawiamy mock dla Date.now(), aby mieć przewidywalny czas
    const mockDate = new Date('2026-10-04T12:00:00Z');
    
    it('wykrywa przeterminowany serwis z kalendarza (isOverdue)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const service = { triggerType: 'calendar', nextDate: '2026-10-01' }; // 3 dni temu
      const result = checkServiceUrgency(service, null, 30);
      
      expect(result.isOverdue).toBe(true);
      expect(result.isUpcoming).toBe(false);
      expect(result.daysLeft).toBeLessThan(0);

      vi.useRealTimers();
    });

    it('wykrywa nadchodzacy serwis z kalendarza (isUpcoming)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const service = { triggerType: 'calendar', nextDate: '2026-10-10' }; // za 6 dni (w progu 30 dni)
      const result = checkServiceUrgency(service, null, 30);
      
      expect(result.isOverdue).toBe(false);
      expect(result.isUpcoming).toBe(true);

      vi.useRealTimers();
    });

    it('wykrywa przeterminowany serwis wg motogodzin', () => {
      const service = { triggerType: 'hours', targetWorkHours: 1000 };
      const machine = { currentWorkHours: 1050 }; // Przekroczone o 50
      const result = checkServiceUrgency(service, machine, 30);
      
      expect(result.isOverdue).toBe(true);
      expect(result.isUpcoming).toBe(false);
      expect(result.hoursLeft).toBe(-50);
    });

    it('wykrywa nadchodzacy serwis wg motogodzin (<= 50 rbg)', () => {
      const service = { triggerType: 'hours', targetWorkHours: 1000 };
      const machine = { currentWorkHours: 980 }; // Zostało 20 rbg
      const result = checkServiceUrgency(service, machine, 30);
      
      expect(result.isOverdue).toBe(false);
      expect(result.isUpcoming).toBe(true);
      expect(result.hoursLeft).toBe(20);
    });

    it('serwis bez przekroczen nie zwraca flag ostrzegawczych', () => {
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const service = { triggerType: 'mixed', targetWorkHours: 1000, nextDate: '2027-01-01' };
      const machine = { currentWorkHours: 500 }; 
      const result = checkServiceUrgency(service, machine, 30);
      
      expect(result.isOverdue).toBe(false);
      expect(result.isUpcoming).toBe(false);

      vi.useRealTimers();
    });
  });
});

