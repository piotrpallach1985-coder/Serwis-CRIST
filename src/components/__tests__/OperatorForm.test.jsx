import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OperatorForm from '../OperatorForm';
import { addDoc, getDocs, collection, query, where, doc, setDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  storage: {}
}));

// Mock Firebase functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(() => Promise.resolve()),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

describe('OperatorForm', () => {
  const mockProps = {
    selectedMachine: { id: 'M1', name: 'Suwnica S1', regionId: 'R1' },
    setSelectedMachine: vi.fn(),
    regions: [{ id: 'R1', name: 'Hala A' }],
    initialMachineId: null,
    handleStepChange: vi.fn(),
    isOnline: true,
    topicsList: [],
    reportersList: [],
    stopLiveScanner: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with selected machine', () => {
    render(<OperatorForm {...mockProps} />);
    expect(screen.getByText('Suwnica S1')).toBeInTheDocument();
  });

  it('handles user input correctly', () => {
    render(<OperatorForm {...mockProps} />);
    
    // Switch to manual topic mode if needed, but it should be default or there's a toggle
    const descInput = screen.getAllByRole('textbox')[1]; // Drugi textbox po nameInput
    fireEvent.change(descInput, { target: { value: 'Złamany wał' } });
    expect(descInput.value).toBe('Złamany wał');

    const nameInput = screen.getByPlaceholderText(/np. Jan Kowalski/i);
    fireEvent.change(nameInput, { target: { value: 'Jan Kowalski' } });
    expect(nameInput.value).toBe('Jan Kowalski');
  });

  it('submits form correctly when online', async () => {
    getDocs.mockResolvedValue({ empty: true, forEach: () => {} }); // No duplicates
    doc.mockReturnValue({ id: 'TICKET1' });
    collection.mockReturnValue('mock-collection');

    const { container } = render(<OperatorForm {...mockProps} />);
    
    // Fill out form
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Test description' } });
    fireEvent.change(screen.getByPlaceholderText(/np. Jan Kowalski/i), { target: { value: 'Jan Kowalski' } });
    fireEvent.change(screen.getByPlaceholderText(/np. 500 600 700/i), { target: { value: '500 600 700' } });
    
    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'manual' } }); // Select manual topic
    
    // Type into the manual topic input
    fireEvent.change(screen.getByPlaceholderText(/Wpisz własny temat.../i), { target: { value: 'My custom topic' } });
    
    // Simulate form submission directly instead of click to bypass some HTML5 validation quirks in JSDOM
    const form = screen.getByRole('button', { name: /Wyślij Zgłoszenie/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(mockProps.handleStepChange).toHaveBeenCalledWith('success');
    });
  });

  it('prevents submission if duplicate exists', async () => {
    // Mock that a duplicate ticket exists within the last 2 hours
    const recentDate = new Date();
    getDocs.mockResolvedValueOnce({ 
      empty: false, 
      forEach: (cb) => {
        cb({ 
          id: 'DUP1', 
          data: () => ({ createdAt: recentDate.toISOString(), status: 1 })
        });
      }
    }); 
    doc.mockReturnValue({ id: 'DUP1' });
    collection.mockReturnValue('mock-collection');

    const { container } = render(<OperatorForm {...mockProps} />);
    
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Test description' } });
    fireEvent.change(screen.getByPlaceholderText(/np. Jan Kowalski/i), { target: { value: 'Jan Kowalski' } });
    fireEvent.change(screen.getByPlaceholderText(/np. 500 600 700/i), { target: { value: '500 600 700' } });
    
    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'manual' } });
    
    fireEvent.change(screen.getByPlaceholderText(/Wpisz własny temat.../i), { target: { value: 'My custom topic' } });

    const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => false); // false means do not proceed
    
    const form = screen.getByRole('button', { name: /Wyślij Zgłoszenie/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
      expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('UWAGA: Awaria dla tej maszyny została już zgłoszona'));
    });
    
    confirmMock.mockRestore();
  });
});
