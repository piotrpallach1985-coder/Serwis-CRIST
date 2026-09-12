import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTickets } from '../useTickets';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {}
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  startAfter: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn()
}));

const mockTickets = [
  { id: '1', machineId: 'm1', status: 1, isDeleted: false, closedAt: null },
  { id: '2', machineId: 'm2', status: 5, isDeleted: false, closedAt: '2026-08-15T10:00:00Z', regionId: 'r1' },
  { id: '3', machineId: 'm1', status: 3, isDeleted: false, closedAt: null },
  { id: '4', machineId: 'm3', status: 5, isDeleted: true, closedAt: '2026-08-16T10:00:00Z' },
];

const mockMachines = [
  { id: 'm1', name: 'Laser 1', regionId: 'r1' },
  { id: 'm2', name: 'Laser 2', regionId: 'r1' },
];

const mockRegions = [
  { id: 'r1', name: 'Hala A' },
  { id: 'r2', name: 'Hala B' }
];

describe('useTickets hook filters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('zwraca wszystkie aktywne zg³oszenia domyœlnie', () => {
    const { result } = renderHook(() => useTickets({ tickets: mockTickets }));
    
    // Zg³oszenie ID: 4 jest isDeleted=true, wiec powinno byc odrzucone
    expect(result.current.filteredTickets.length).toBe(3);
    expect(result.current.filteredTickets.map(t => t.id)).toEqual(['1', '2', '3']);
  });

  it('filtruje po statusie', () => {
    const { result } = renderHook(() => useTickets({ tickets: mockTickets }));
    
    act(() => {
      result.current.setFilterStatus('5');
    });

    expect(result.current.filteredTickets.length).toBe(1);
    expect(result.current.filteredTickets[0].id).toBe('2');
  });

  it('filtruje po maszynie (filterMachineId)', () => {
    const { result } = renderHook(() => useTickets({ tickets: mockTickets, machines: mockMachines }));
    
    act(() => {
      result.current.setFilterMachineId('m1');
    });

    expect(result.current.filteredTickets.length).toBe(2);
    expect(result.current.filteredTickets.map(t => t.id)).toEqual(['1', '3']);
  });

  it('filtruje po dacie w archiwum (filterTime)', () => {
    // Kiedy isArchive=true, archiwum jest pobierane z Firebase, 
    // zmockujmy po prostu internalArchive zeby przetestowac filtry archiwum.
    // Hack: U¿yjemy useTickets i po prostu ustawimy filterTime, a nastepnie
    // sprawdzimy logike zmockowujac setInternalArchive - ale prosciej jest
    // wywolac to samo co wywoluje archive
  });
});

