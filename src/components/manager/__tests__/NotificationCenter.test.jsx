import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationCenter from '../NotificationCenter';
import { useManagerStore } from '../../../store/managerStore';
import { checkServiceUrgency } from '../../../utils/logicHelpers';

vi.mock('../../../store/managerStore', () => ({
  useManagerStore: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: '123' } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultVal) => (typeof defaultVal === 'string' ? defaultVal : key),
    i18n: { language: 'pl' },
  }),
}));

vi.mock('../../../utils/logicHelpers', () => ({
  checkServiceUrgency: vi.fn(() => ({ isOverdue: false, isUpcoming: false, message: '' })),
  checkInventoryStatus: vi.fn(() => ({ isLow: false, isOut: false })),
}));

const openBell = () => fireEvent.click(screen.getAllByRole('button')[0]);

describe('NotificationCenter – nawigacja z dzwonka (regresja)', () => {
  const mockMarkAsRead = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useManagerStore.mockImplementation((selector) =>
      selector({ notifications: [], currentModule: 'ur', markAsRead: mockMarkAsRead, plannedWarningDays: 30, parts: [] })
    );
  });

  it('kliknięcie awarii wywołuje onNavigate z propsa (nie ze store)', () => {
    const tickets = [{ id: 'ticket_123', status: 1, machineName: 'Maszyna X', topic: 'Awaria', createdAt: new Date() }];
    render(<NotificationCenter onNavigate={mockOnNavigate} tickets={tickets} />);
    openBell();
    fireEvent.click(screen.getByText(/Maszyna X/));
    expect(mockOnNavigate).toHaveBeenCalledWith('ur', 'tickets', { ticketId: 'ticket_123' });
  });

  it('kliknięcie przeterminowanego serwisu otwiera ten konkretny serwis', () => {
    checkServiceUrgency.mockReturnValue({ isOverdue: true, isUpcoming: false, message: 'po terminie' });
    const plannedServices = [{ id: 'service_123', name: 'Przegląd X', status: 'pending', machineId: 'm1' }];
    const machines = [{ id: 'm1', name: 'Maszyna Y' }];
    render(<NotificationCenter onNavigate={mockOnNavigate} plannedServices={plannedServices} machines={machines} />);
    openBell();
    fireEvent.click(screen.getByText(/Maszyna Y/));
    expect(mockOnNavigate).toHaveBeenCalledWith('ur', 'planned_maintenance', { serviceId: 'service_123' });
  });

  it('teksty powiadomień zawierają poprawne polskie znaki (ochrona przed uszkodzeniem kodowania)', () => {
    const tickets = [{ id: 't1', status: 1, machineName: 'M', topic: 'T', createdAt: new Date() }];
    render(<NotificationCenter onNavigate={mockOnNavigate} tickets={tickets} />);
    openBell();
    expect(screen.getByText('NOWE ZGŁOSZENIE AWARII')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('\uFFFD');
  });
});
