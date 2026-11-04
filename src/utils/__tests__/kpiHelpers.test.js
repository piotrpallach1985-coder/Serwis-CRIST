import { calculateKPIs } from '../kpiHelpers';
import { describe, it, expect } from 'vitest';

describe('calculateKPIs', () => {
  it('zwraca 0 dla pustej listy', () => {
    const result = calculateKPIs([]);
    expect(result.mttrHours).toBe('0.0');
    expect(result.mtbfDays).toBe('0.0');
    expect(result.totalIncidents).toBe(0);
  });

  it('poprawnie oblicza MTTR dla zamkniętych awarii (preferuje workStartedAt / inProgressAt nad createdAt)', () => {
    const tickets = [
      {
        status: 5,
        createdAt: '2026-09-01T08:00:00Z',
        workStartedAt: '2026-09-01T10:00:00Z',
        closedAt: '2026-09-01T12:00:00Z', // 2 hours real repair time
      },
      {
        status: 5,
        createdAt: '2026-09-02T10:00:00Z',
        closedAt: '2026-09-02T14:00:00Z', // 4 hours fallback to createdAt
      },
      {
        status: 1, // open ticket, should be ignored
        createdAt: '2026-09-03T10:00:00Z',
        closedAt: null,
      },
    ];

    const result = calculateKPIs(tickets);
    // (2 + 4) / 2 = 3 hours
    expect(result.mttrHours).toBe('3.0');
    expect(result.totalIncidents).toBe(3);
    expect(result.closedIncidents).toBe(2);
    expect(result.openIncidents).toBe(1);
  });

  it('poprawnie oblicza MTBF', () => {
    const tickets = [
      { machineId: 'm1', createdAt: '2026-09-01T00:00:00Z', status: 5 },
      { machineId: 'm1', createdAt: '2026-09-03T00:00:00Z', status: 5 }, // 2 days diff
      { machineId: 'm1', createdAt: '2026-09-07T00:00:00Z', status: 5 }, // 4 days diff (avg = 3)
      { machineId: 'm2', createdAt: '2026-09-01T00:00:00Z', status: 5 }, // Only 1 incident, ignored for MTBF
    ];

    const result = calculateKPIs(tickets);
    // Machine 1: (2 days + 4 days) / 2 = 3 days
    expect(result.mtbfDays).toBe('3.0');
  });
});
