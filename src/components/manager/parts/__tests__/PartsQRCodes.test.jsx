import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartsQRCodes from '../PartsQRCodes';
import { useManagerStore } from '../../../../store/managerStore';

vi.mock('../../../../store/managerStore', () => ({
  useManagerStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k })
}));

vi.mock('../../../../utils/tenantHelper', () => ({
  getCurrentTenant: () => 'tenant-123'
}));

// Mock the QRCode component to avoid canvas errors in JSDOM
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <svg data-testid="mock-qr"></svg>
}));

describe('PartsQRCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders original createdAt date on the QR code label, ignoring updatedAt', () => {
    useManagerStore.mockImplementation((selector) => {
      const state = {
        parts: [
          {
            id: 'part_1',
            name: 'Silnik',
            code: 'SIL-123',
            createdAt: '2026-01-01T10:00:00Z',
            updatedAt: '2026-05-05T10:00:00Z'
          }
        ],
        branding: { name: 'VexoNT' }
      };
      return selector(state);
    });

    render(<PartsQRCodes />);
    
    // Check if the original date is displayed
    const dateText = screen.getByText(/1.01.2026|01.01.2026/);
    expect(dateText).toBeInTheDocument();

    // Check that the updated date is NOT displayed
    const updatedText = screen.queryByText(/5.05.2026|05.05.2026/);
    expect(updatedText).not.toBeInTheDocument();
  });
});
