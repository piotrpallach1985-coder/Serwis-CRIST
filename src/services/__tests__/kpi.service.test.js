import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchServerKPIStats, fetchServerPlannedKPIStats } from '../kpi.service';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { httpsCallable } from 'firebase/functions';

// Mock dependencji
vi.mock('../../utils/tenantHelper', () => ({
  getCurrentTenant: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn()
}));

// Dummy firebase functions object
vi.mock('../../firebase', () => ({
  functions: {},
  db: {}
}));

describe('kpi.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchServerKPIStats', () => {
    it('zwraca null jesli brak tenantId', async () => {
      getCurrentTenant.mockReturnValue(null);
      const result = await fetchServerKPIStats('30');
      expect(result).toBeNull();
      expect(httpsCallable).not.toHaveBeenCalled();
    });

    it('wywoluje funkcie getKPIStats z prawidlowymi parametrami', async () => {
      getCurrentTenant.mockReturnValue('test-tenant-123');
      const mockCallable = vi.fn().mockResolvedValue({ data: { totalTickets: 42 } });
      httpsCallable.mockReturnValue(mockCallable);

      const result = await fetchServerKPIStats('7');

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'getKPIStats');
      expect(mockCallable).toHaveBeenCalledWith({ tenantId: 'test-tenant-123', period: '7' });
      expect(result).toEqual({ totalTickets: 42 });
    });
  });

  describe('fetchServerPlannedKPIStats', () => {
    it('zwraca null jesli brak tenantId', async () => {
      getCurrentTenant.mockReturnValue(null);
      const result = await fetchServerPlannedKPIStats('30');
      expect(result).toBeNull();
      expect(httpsCallable).not.toHaveBeenCalled();
    });

    it('wywoluje funkcie getPlannedKPIStats z prawidlowymi parametrami', async () => {
      getCurrentTenant.mockReturnValue('test-tenant-abc');
      const mockCallable = vi.fn().mockResolvedValue({ data: { completedCount: 15 } });
      httpsCallable.mockReturnValue(mockCallable);

      const result = await fetchServerPlannedKPIStats('all');

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'getPlannedKPIStats');
      expect(mockCallable).toHaveBeenCalledWith({ tenantId: 'test-tenant-abc', period: 'all' });
      expect(result).toEqual({ completedCount: 15 });
    });
  });
});
