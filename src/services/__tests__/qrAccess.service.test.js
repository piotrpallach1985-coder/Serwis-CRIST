import { describe, it, expect, vi } from 'vitest';

vi.mock('../../firebase', () => ({ db: {} }));

import { parseQrPayload, buildMachineQrValue, generateQrKey } from '../qrAccess.service';

describe('qrAccess.service', () => {
  it('buduje i parsuje treść QR z kluczem', () => {
    const v = buildMachineQrValue('crist', 'm123', 'abc_DEF-123');
    expect(v).toBe('tenant=crist&machine=m123&k=abc_DEF-123');
    expect(parseQrPayload(v)).toEqual({ tenantId: 'crist', machineId: 'm123', key: 'abc_DEF-123' });
  });

  it('parsuje pełny URL oraz URL z hashem', () => {
    expect(parseQrPayload('https://app.example.com/?tenant=t1&machine=m1&k=K1')).toEqual({ tenantId: 't1', machineId: 'm1', key: 'K1' });
    expect(parseQrPayload('https://app.example.com/?tenant=t1#/operator?machine=m1&k=K1')).toEqual({ tenantId: 't1', machineId: 'm1', key: 'K1' });
  });

  it('stary format bez klucza i samo ID maszyny', () => {
    expect(parseQrPayload('tenant=crist&machine=m9')).toEqual({ tenantId: 'crist', machineId: 'm9', key: null });
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
});
