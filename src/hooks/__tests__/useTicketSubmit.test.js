import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTicketSubmit } from '../useTicketSubmit';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../firebase', () => ({
  db: {},
  storage: {},
  auth: { currentUser: null }
}));

vi.mock('../../utils/offlineStorage', () => ({
  savePhotoToIndexedDB: vi.fn()
}));

vi.mock('../../services/audit.service', () => ({
  logAudit: vi.fn()
}));

const mockUpdateMachineWorkHours = vi.fn().mockResolvedValue(true);
vi.mock('../../services/machines.service', () => ({
  updateMachineWorkHours: (...args) => mockUpdateMachineWorkHours(...args)
}));

vi.mock('../../store/managerStore', () => ({
  useManagerStore: () => ({ tenantId: 'test-tenant' })
}));

vi.mock('../../utils/tenantHelper', () => ({
  getCurrentTenant: () => 'test-tenant'
}));

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-machine-123' });
const mockSetDoc = vi.fn().mockResolvedValue();
const mockGetDocs = vi.fn().mockResolvedValue({ empty: true, forEach: vi.fn() });

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'new-ticket-123' })),
  setDoc: (...args) => mockSetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: (...args) => mockAddDoc(...args),
  serverTimestamp: vi.fn(() => 'server-time')
}));

describe('useTicketSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects if topic or description are missing', async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useTicketSubmit({ regions: [], onStepChange: vi.fn(), showToast }));
    
    let success = false;
    await act(async () => {
      success = await result.current.submitTicket({
        selectedMachine: { id: 'M1', name: 'M1' },
        topic: '',
        description: 'Test',
        reporterName: 'Test',
        reporterPhone: '',
        pendingPhotos: []
      });
    });

    expect(success).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Wypełnij wszystkie wymagane pola!', 'error');
  });

  it('creates new machine with (DO WERYFIKACJI) suffix when manual', async () => {
    const showToast = vi.fn();
    const onStepChange = vi.fn();
    const { result } = renderHook(() => useTicketSubmit({ regions: [], onStepChange, showToast }));
    
    await act(async () => {
      await result.current.submitTicket({
        selectedMachine: { id: 'manual', name: 'Nieznana Maszyna' },
        topic: 'Test topic',
        description: 'Test desc',
        reporterName: 'Anonim',
        reporterPhone: '123456789',
        pendingPhotos: [],
        isOnline: true,
        timeoutRef: { current: null },
        setTopicMode: vi.fn()
      });
    });

    // addDoc should be called to create the machine
    expect(mockAddDoc).toHaveBeenCalledWith(
      undefined, 
      expect.objectContaining({
        name: 'Nieznana Maszyna (DO WERYFIKACJI)',
        description: expect.stringContaining('Wymaga uzupełnienia danych')
      })
    );
  });

  it('saves vehicleGps and reportedWorkHours on ticket and updates machine meter when provided', async () => {
    localStorage.removeItem('last_ticket_time');
    const showToast = vi.fn();
    const onStepChange = vi.fn();
    const { result } = renderHook(() =>
      useTicketSubmit({ regions: [{ id: 'R-FLOTA', name: 'Baza Floty' }], onStepChange, showToast })
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.submitTicket({
        selectedMachine: { id: 'veh-101', name: 'VW Crafter', regionId: 'R-FLOTA' },
        topic: 'Awaria hamulców',
        description: 'Świeci kontrolka ABS',
        reporterName: 'Piotr Kierowca',
        reporterPhone: '500600700',
        pendingPhotos: [],
        vehicleGps: { lat: 54.51889, lng: 18.53054, accuracy: 8, timestamp: '2026-11-08T10:00:00.000Z' },
        reportedWorkHours: 158400,
        isOnline: true,
        timeoutRef: { current: null },
        setTopicMode: vi.fn(),
      });
    });

    expect(ok).toBe(true);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-ticket-123' }),
      expect.objectContaining({
        machineId: 'veh-101',
        reportedWorkHours: 158400,
        vehicleGps: {
          lat: 54.51889,
          lng: 18.53054,
          accuracy: 8,
          timestamp: '2026-11-08T10:00:00.000Z',
        },
      })
    );
    expect(mockUpdateMachineWorkHours).toHaveBeenCalledWith('veh-101', 158400, false);
  });
});
