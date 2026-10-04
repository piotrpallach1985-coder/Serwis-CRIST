import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock everything that Machines.jsx imports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' } }),
}));
let mockStoreState = {
  machines: [],
  regions: [],
  tickets: [],
  plannedServices: [],
  parts: [],
  partTransactions: [],
};

vi.mock('../../../store/managerStore', () => ({
  useManagerStore: Object.assign(vi.fn((selector) => selector ? selector(mockStoreState) : mockStoreState), {
    getState: () => mockStoreState,
    setState: (newState) => { mockStoreState = { ...mockStoreState, ...newState }; }
  }),
}));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
vi.mock('../../../utils/reports/pdfMachineCard', () => ({
  generateMachineHistoryPDF: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), query: vi.fn(), where: vi.fn(), 
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })), 
  deleteDoc: vi.fn(), doc: vi.fn(), updateDoc: vi.fn(), serverTimestamp: vi.fn(), 
  writeBatch: vi.fn(), arrayUnion: vi.fn()
}));
vi.mock('../../../firebase', () => ({ db: {} }));
vi.mock('../../../utils/dateHelpers', () => ({ safeParseDate: vi.fn(() => new Date('2026-10-04')) }));

import Machines from '../Machines';

describe('Machines component XSS vulnerability', () => {
  it('escapes HTML when printing QR code to prevent XSS', async () => {
    // 1. Setup mock data
    const mockMachines = [{
      id: 'm123',
      name: '<script>alert("XSS")</script>', // Malicious input
      qrCode: 'qr123',
      createdAt: new Date().toISOString()
    }];
    
    // Override store mock to return our malicious machine
    const { useManagerStore } = await import('../../../store/managerStore');
    useManagerStore.setState({ machines: mockMachines });

    // 2. Mock window.open and document.write
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockPrintWindow = {
      document: {
        write: mockWrite,
        close: mockClose
      }
    };
    vi.stubGlobal('open', vi.fn(() => mockPrintWindow));

    // 3. Render component
    render(<Machines />);

    // 4. Trigger print (we have to select the machine first to see details, then click print)
    // Wait for render
    await waitFor(() => {
       expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
    });

    // Click on the machine to open details
    fireEvent.click(screen.getByText('<script>alert("XSS")</script>'));

    // In MachineDetails, find the print button
    const printButton = await screen.findByText('machines.buttons.printQr');
    
    // Inject a fake SVG so that document.getElementById(`qr-svg-m123`) works
    const fakeDiv = document.createElement('div');
    fakeDiv.id = 'qr-svg-m123';
    fakeDiv.innerHTML = '<svg></svg>';
    document.body.appendChild(fakeDiv);

    fireEvent.click(printButton);

    // 5. Assert that document.write was called with ESCAPED html
    expect(mockWrite).toHaveBeenCalled();
    const writtenHtml = mockWrite.mock.calls[0][0];
    
    // It should NOT contain the raw script tag
    expect(writtenHtml).not.toContain('<script>alert("XSS")</script>');
    
    // It SHOULD contain the escaped version
    expect(writtenHtml).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    
    // Cleanup
    document.body.removeChild(fakeDiv);
    vi.restoreAllMocks();
  });
});
