import { describe, it, expect } from 'vitest';
import {
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
  ACTION_ITEM_STATUS,
  ACTION_ITEM_STATUS_LABELS,
  USER_ROLES,
  TIME_THRESHOLDS,
  PIN_STATUS,
} from '../constants';

describe('constants', () => {
  it('should define correct TICKET_STATUS numbers', () => {
    expect(TICKET_STATUS.OPEN).toBe(1);
    expect(TICKET_STATUS.VERIFICATION).toBe(2);
    expect(TICKET_STATUS.PENDING).toBe(3);
    expect(TICKET_STATUS.IN_PROGRESS).toBe(4);
    expect(TICKET_STATUS.CLOSED).toBe(5);
  });

  it('should have matching labels for all ticket statuses', () => {
    expect(TICKET_STATUS_LABELS[TICKET_STATUS.OPEN]).toBe('Otwarte');
    expect(TICKET_STATUS_LABELS[TICKET_STATUS.CLOSED]).toBe('Zakończone');
  });

  it('should define correct SERVICE_STATUS strings', () => {
    expect(SERVICE_STATUS.PENDING).toBe('pending');
    expect(SERVICE_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(SERVICE_STATUS.COMPLETED).toBe('completed');
    expect(SERVICE_STATUS_LABELS[SERVICE_STATUS.COMPLETED]).toBe('Zakończony');
  });

  it('should define correct ACTION_ITEM_STATUS strings', () => {
    expect(ACTION_ITEM_STATUS.PENDING).toBe('pending');
    expect(ACTION_ITEM_STATUS.COMPLETED).toBe('completed');
    expect(ACTION_ITEM_STATUS_LABELS[ACTION_ITEM_STATUS.COMPLETED]).toBe('Zrealizowane');
  });

  it('should define valid thresholds', () => {
    expect(TIME_THRESHOLDS.CRITICAL_DAYS_WARNING).toBe(7);
    expect(TIME_THRESHOLDS.CRITICAL_HOURS_WARNING).toBe(50);
  });
});
