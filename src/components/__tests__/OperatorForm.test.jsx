import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OperatorForm from '../OperatorForm';
import { useTicketSubmit } from '../../hooks/useTicketSubmit';
import { useToast } from '../../hooks/useToast';

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

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toastConfig: null, showToast: vi.fn(), hideToast: vi.fn() })
}));

vi.mock('../../hooks/useTicketSubmit', () => {
  return {
    useTicketSubmit: vi.fn()
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Jan Kowalski', phone: '111222333' } })
}));

describe('OperatorForm (Integration Test)', () => {
  const mockProps = {
    selectedMachine: { id: 'M1', name: 'Suwnica S1', regionId: 'R1' },
    setSelectedMachine: vi.fn(),
    regions: [{ id: 'R1', name: 'Hala A' }],
    initialMachineId: null,
    handleStepChange: vi.fn(),
    isOnline: true,
    topicsList: [],
    reportersList: [],
    stopLiveScanner: vi.fn(),
    isInternal: false // Test anonymous flow
  };
  
  let submitTicketMock;

  beforeEach(() => {
    vi.clearAllMocks();
    submitTicketMock = vi.fn().mockResolvedValue(true);
    useTicketSubmit.mockReturnValue({
      submitLoading: false,
      submitProgress: '',
      submitTicket: submitTicketMock
    });
  });

  it('renders correctly with selected machine', () => {
    render(<OperatorForm {...mockProps} />);
    expect(screen.getByText('Suwnica S1')).toBeInTheDocument();
  });

  it('submits form correctly', async () => {
    const { container } = render(<OperatorForm {...mockProps} />);
    
    // Fill out form
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Test description' } });
    fireEvent.change(screen.getByPlaceholderText(/np. 500 600 700/i), { target: { value: '500 600 700' } });
    
    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'manual' } });
    
    fireEvent.change(screen.getByPlaceholderText(/Wpisz w.asny temat.../i), { target: { value: 'My custom topic' } });

    const form = screen.getByRole('button', { name: /Wy.lij zg.oszenie/i }).closest('form');
    
    // Override the submit event to test our logic
    fireEvent.submit(form);

    expect(submitTicketMock).toHaveBeenCalled();
  });
});
