import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentTenant } from './tenantHelper';
import { useManagerStore } from '../store/managerStore';

// Mock the zustand store
vi.mock('../store/managerStore', () => ({
  useManagerStore: {
    getState: vi.fn()
  }
}));

describe('tenantHelper', () => {
  const originalLocation = window.location;
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup clean environment for each test
    delete window.location;
    window.location = { ...originalLocation, search: '' };
    vi.unstubAllEnvs();
  });

  it('should return tenantId from store if available', () => {
    useManagerStore.getState.mockReturnValue({ tenantId: 'tenant-from-store' });
    expect(getCurrentTenant()).toBe('tenant-from-store');
  });

  it('should fallback to URL search params if store is empty', () => {
    useManagerStore.getState.mockReturnValue({ tenantId: null });
    window.location.search = '?tenant=tenant-from-url';
    expect(getCurrentTenant()).toBe('tenant-from-url');
  });

  it('should fallback to VITE_DEFAULT_TENANT if store and URL are empty', () => {
    useManagerStore.getState.mockReturnValue({ tenantId: null });
    vi.stubEnv('VITE_DEFAULT_TENANT', 'tenant-from-env');
    expect(getCurrentTenant()).toBe('tenant-from-env');
  });

  it('should fallback to "default" if everything else is empty', () => {
    useManagerStore.getState.mockReturnValue({ tenantId: null });
    vi.stubEnv('VITE_DEFAULT_TENANT', '');
    expect(getCurrentTenant()).toBe('default');
  });
});
