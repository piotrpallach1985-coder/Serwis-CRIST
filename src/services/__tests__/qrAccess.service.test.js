import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = vi.fn((_db, ...segments) => ({ path: segments.join('/') }));
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockServerTimestamp = vi.fn(() => 'SERVER_TS');

vi.mock('../../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

import {
  parseQrPayload,
  buildMachineQrValue,
  generateQrKey,
  getOrCreateQrKey,
  rotateQrKey,
} from '../qrAccess.service';

describe('qrAccess.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buduje i parsuje treść QR z kluczem', () => {
    const v = buildMachineQrValue('firma-demo', 'm123', 'abc_DEF-123');
    expect(v).toBe('tenant=firma-demo&machine=m123&k=abc_DEF-123');
    expect(parseQrPayload(v)).toEqual({ tenantId: 'firma-demo', machineId: 'm123', key: 'abc_DEF-123' });
  });

  it('parsuje pełny URL oraz URL z hashem', () => {
    expect(parseQrPayload('https://app.example.com/?tenant=t1&machine=m1&k=K1')).toEqual({ tenantId: 't1', machineId: 'm1', key: 'K1' });
    expect(parseQrPayload('https://app.example.com/?tenant=t1#/operator?machine=m1&k=K1')).toEqual({ tenantId: 't1', machineId: 'm1', key: 'K1' });
  });

  it('stary format bez klucza i samo ID maszyny', () => {
    expect(parseQrPayload('tenant=firma-demo&machine=m9')).toEqual({ tenantId: 'firma-demo', machineId: 'm9', key: null });
    expect(parseQrPayload('m9')).toEqual({ tenantId: null, machineId: 'm9', key: null });
  });

  it('nie myli parametru "k" z innymi (np. "bank=")', () => {
    expect(parseQrPayload('tenant=t&bank=x&machine=m').key).toBeNull();
  });

  it('generuje losowy klucz URL-safe o długości >= 20', () => {
    const a = generateQrKey();
    const b = generateQrKey();
    expect(a).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(a).not.toBe(b);
  });

  it('getOrCreateQrKey oraz rotateQrKey używają ścieżki tenants/{tenantId}/settings/qr_access i pól { key, createdAt } zgodnych z firestore.rules', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
    mockSetDoc.mockResolvedValue(undefined);

    const createdKey = await getOrCreateQrKey('tenant_test_qr');
    expect(createdKey).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'tenants', 'tenant_test_qr', 'settings', 'qr_access');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'tenants/tenant_test_qr/settings/qr_access' },
      { key: createdKey, createdAt: 'SERVER_TS' }
    );

    const rotatedKey = await rotateQrKey('tenant_test_qr');
    expect(rotatedKey).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(rotatedKey).not.toBe(createdKey);
    expect(mockSetDoc).toHaveBeenLastCalledWith(
      { path: 'tenants/tenant_test_qr/settings/qr_access' },
      { key: rotatedKey, createdAt: 'SERVER_TS' }
    );
  });
});
