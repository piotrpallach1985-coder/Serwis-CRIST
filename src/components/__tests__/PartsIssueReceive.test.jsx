import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartsIssueReceive from '../manager/parts/PartsIssueReceive';
import { useManagerStore } from '../../store/managerStore';
import { runTransaction } from 'firebase/firestore';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Zustand store
vi.mock('../../store/managerStore', () => ({
  useManagerStore: vi.fn(),
}));

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  storage: {},
  auth: { currentUser: { uid: '123', displayName: 'Test' } }
}));

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    collection: vi.fn(),
    serverTimestamp: vi.fn(),
    runTransaction: vi.fn(),
    addDoc: vi.fn(),
    collection: vi.fn()
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { name: 'TestUser' } }))
}));

vi.mock('../../utils/tenantHelper', () => ({
  getCurrentTenant: vi.fn(() => 'crist')
}));

describe('PartsIssueReceive - Szybkie Wydania i Przyjęcia (Integration)', () => {
  const mockUser = { name: 'Jan Kowalski' };
  const mockParts = [
    { id: 'P1', name: 'Łożysko SKF', indexNumber: 'IDX-001', stock: 10, unit: 'szt.' },
    { id: 'P2', name: 'Olej silnikowy', indexNumber: 'IDX-002', stock: 50, unit: 'L' }
  ];
  const mockMachines = [
    { id: 'M1', name: 'Suwnica S1' }
  ];

  let storeMock;

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock = {
      parts: mockParts,
      machines: mockMachines,
    };
    useManagerStore.mockImplementation((selector) => {
      return selector(storeMock);
    });
    runTransaction.mockResolvedValue();
  });

  it('renders correctly and shows search input', () => {
    render(<PartsIssueReceive user={mockUser} />);
    expect(screen.getByText('Szybkie Wydania i Przyjęcia')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Wpisz nazwę lub kod/i)).toBeInTheDocument();
  });

  it('searches and selects a part to show the form', async () => {
    render(<PartsIssueReceive user={mockUser} />);
    
    const searchInput = screen.getByPlaceholderText(/Wpisz nazwę lub kod/i);
    fireEvent.change(searchInput, { target: { value: 'Łożysko' } });
    
    const resultItem = screen.getByText(/Łożysko SKF/i);
    fireEvent.click(resultItem);
    
    expect(screen.getByText(/Wydaj/i)).toBeInTheDocument();
    expect(screen.getByText(/Przyjmij/i)).toBeInTheDocument();
  });

  it('submits part issue transaction correctly', async () => {
    const { container } = render(<PartsIssueReceive user={mockUser} />);
    
    const searchInput = screen.getByPlaceholderText(/Wpisz nazwę lub kod/i);
    fireEvent.change(searchInput, { target: { value: 'Łożysko' } });
    fireEvent.click(screen.getByText(/Łożysko SKF/i));
    
    const qtyInput = container.querySelector('input[type="number"]');
    fireEvent.change(qtyInput, { target: { value: '2' } });

    const machineInput = screen.getByPlaceholderText(/Wyszukaj urządzenie.../i);
    fireEvent.change(machineInput, { target: { value: 'Suwnica' } });
    fireEvent.click(screen.getByText('Suwnica S1'));
    
    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(runTransaction).toHaveBeenCalled();
    });
  });
});
