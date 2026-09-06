import { describe, it, expect } from 'vitest';
import { safeParseDate } from '../dateHelpers';

describe('dateHelpers', () => {
  describe('safeParseDate', () => {
    it('should return null for empty values', () => {
      expect(safeParseDate(null)).toBeNull();
      expect(safeParseDate(undefined)).toBeNull();
      expect(safeParseDate('')).toBeNull();
    });

    it('should correctly parse a JS Date object', () => {
      const date = new Date('2026-09-04T12:00:00Z');
      const parsed = safeParseDate(date);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(date.toISOString());
    });

    it('should correctly parse an ISO string', () => {
      const isoString = '2026-09-04T12:00:00.000Z';
      const parsed = safeParseDate(isoString);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(isoString);
    });

    it('should correctly parse a Timestamp with toDate function (Firestore Timestamp)', () => {
      const date = new Date('2026-09-04T12:00:00Z');
      const firestoreTimestamp = {
        toDate: () => date
      };
      const parsed = safeParseDate(firestoreTimestamp);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(date.toISOString());
    });

    it('should correctly parse a plain object with seconds (Serialized Firestore Timestamp)', () => {
      const timestampSeconds = Math.floor(new Date('2026-09-04T12:00:00Z').getTime() / 1000);
      const serializedTimestamp = { seconds: timestampSeconds, nanoseconds: 0 };
      const parsed = safeParseDate(serializedTimestamp);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getTime()).toBe(timestampSeconds * 1000);
    });

    it('should return null for invalid date strings', () => {
      expect(safeParseDate('not-a-date')).toBeNull();
    });
  });
});
