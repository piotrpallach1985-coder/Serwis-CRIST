import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Roles from '../Roles';
import Users from '../Users';
import ActionItems from '../ActionItems';
import SidebarNavUR from '../sidebar/SidebarNavUR';
import SidebarFooter from '../sidebar/SidebarFooter';
import TicketMainColumnStepper from '../tickets/TicketMainColumnStepper';
import PlannedMaintenanceFormModal from '../PlannedMaintenanceFormModal';
import PlannedMaintenanceTimeline from '../PlannedMaintenanceTimeline';
import { useManagerStore } from '../../../store/managerStore';
import { TICKET_STATUS } from '../../../utils/constants';

let mockCurrentUser = {
  uid: 'admin-1',
  name: 'Admin Główny',
  email: 'admin@crist.pl',
  role: 'admin',
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}));

vi.mock('../../shared/DictationButton', () => ({
  default: () => <div data-testid="dictation-btn" />,
}));

vi.mock('../../shared/SignaturePad', () => ({
  default: () => <div data-testid="signature-pad" />,
}));

describe('Skondensowany model Ról i Wykonawców oraz ścisłe uprawnienia zakładek 1:1', () => {
  beforeEach(() => {
    mockCurrentUser = {
      uid: 'admin-1',
      name: 'Admin Główny',
      email: 'admin@crist.pl',
      role: 'admin',
    };
    useManagerStore.getState().setRoles([
      {
        id: 'role-doc-plazma',
        name: 'Serwis Zewnętrzny Plazma',
        permissions: ['tickets', 'only_assigned_tasks'],
      },
      {
        id: 'role-doc-automatycy',
        name: 'Automatycy UR',
        permissions: ['tickets', 'planned_maintenance', 'machines', 'machines_qr'],
      },
    ]);
    useManagerStore.getState().setTickets([]);
    useManagerStore.getState().setPlannedServices([]);
    useManagerStore.getState().setMachines([
      { id: 'm-1', name: 'Przecinarka Plazmowa #1', internalId: 'UR-01', location: 'Hala A' },
    ]);
  });

  it('Roles.jsx: w oknie tworzenia/edycji roli wyświetla uprawnienie Baza QR Urządzeń (machines_qr) i nie wyświetla usuniętej zakładki Podwykonawcy / Serwis', () => {
    render(<Roles />);

    const addRoleBtn = screen.getByRole('button', { name: /admin\.roles\.add_role|Dodaj Rolę/i });
    fireEvent.click(addRoleBtn);

    expect(screen.getByText(/admin\.roles\.perm_machines_qr|Baza QR Urządzeń/i)).toBeTruthy();
    expect(screen.queryByText(/admin\.roles\.perm_services|Podwykonawcy \/ Serwis/i)).toBeNull();
  });

  it('Users.jsx: w oknie dodawania/edycji użytkownika wyświetla wyłącznie pojedyncze pole wyboru roli (Uprawnienia) bez drugiego pola Podwykonawca / Serwis', () => {
    render(<Users />);

    const addUserBtn = screen.getByRole('button', {
      name: /admin\.users\.add_user|Dodaj Użytkownika/i,
    });
    fireEvent.click(addUserBtn);

    // Jedno pole select z rolami (w tym rolami niestandardowymi z Role i Uprawnienia)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(1);
    expect(within(selects[0]).getByText('Serwis Zewnętrzny Plazma')).toBeTruthy();
    expect(within(selects[0]).getByText('Automatycy UR')).toBeTruthy();

    // Brak drugiego pola wyboru Powiązany Podwykonawca / Serwis
    expect(screen.queryByText(/Powiązany Podwykonawca/i)).toBeNull();
    expect(screen.queryByText(/Dedykowany Serwis \/ Zakres/i)).toBeNull();
  });

  it('SidebarNavUR.jsx: ściśle przestrzega uprawnień 1:1 z edycji roli i nie wyświetla zakładki Podwykonawcy / Serwis', () => {
    // 1) Jako Admin: brak zakładki Podwykonawcy / Serwis w sekcji Dane Bazowe menu bocznego UR
    const { unmount } = render(
      <SidebarNavUR activeTab="tickets" handleItemClick={vi.fn()} branding={{}} />
    );
    expect(screen.queryByText(/sidebar\.services_menu|Podwykonawcy \/ Serwis/i)).toBeNull();
    expect(screen.getByTestId('sidebar-machines-menu')).toBeTruthy();
    expect(screen.getByTestId('sidebar-machines-qr-menu')).toBeTruthy();
    expect(screen.getByTestId('sidebar-regions-menu')).toBeTruthy();
    unmount();

    // 2) Jako Serwisant z rolą posiadającą wyłącznie ['tickets', 'only_assigned_tasks']
    mockCurrentUser = {
      uid: 'user-andrzej',
      name: 'Andrzej Andrzej',
      email: 'andrzej@plazma.com.pl',
      role: 'role-doc-plazma',
    };

    render(<SidebarNavUR activeTab="tickets" handleItemClick={vi.fn()} branding={{}} />);

    // Widoczna wyłącznie zaznaczona zakładka Bieżące Awarie
    expect(screen.getByText(/sidebar\.active_tickets|Bieżące Awarie/i)).toBeTruthy();

    // Wszystkie niezaznaczone w roli zakładki są ukryte (1:1)
    expect(screen.queryByText(/sidebar\.archive_tickets_menu|Archiwum Awarii/i)).toBeNull();
    expect(screen.queryByText(/sidebar\.services_list|Serwisy Planowane/i)).toBeNull();
    expect(screen.queryByText(/sidebar\.archive_services|Archiwum Serwisów/i)).toBeNull();
    expect(screen.queryByText(/sidebar\.services_kpi|Raport KPI Serwisów/i)).toBeNull();
    expect(screen.queryByText(/sidebar\.action_items_menu|Zadania \/ Zalecenia/i)).toBeNull();
    expect(screen.queryByTestId('sidebar-machines-menu')).toBeNull();
    expect(screen.queryByTestId('sidebar-machines-qr-menu')).toBeNull();
    expect(screen.queryByText(/sidebar\.warehouse_base_menu|Magazyn Części/i)).toBeNull();
  });

  it('SidebarFooter.jsx: wyświetla czytelne nazewnictwo roli zamiast surowego ID dokumentu z Firestore', () => {
    const techUser = {
      uid: 'user-andrzej',
      name: 'Andrzej Andrzej',
      role: 'role-doc-plazma',
    };

    render(
      <SidebarFooter
        user={techUser}
        onNavigate={vi.fn()}
        handleReturnHome={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText('Andrzej Andrzej')).toBeTruthy();
    expect(screen.getByText('Serwis Zewnętrzny Plazma')).toBeTruthy();
    expect(screen.queryByText('role-doc-plazma')).toBeNull();
  });

  it('TicketMainColumnStepper.jsx oraz PlannedMaintenanceFormModal.jsx: pobierają listę wykonawców bezpośrednio z Ról (roles)', () => {
    const setSelectedService = vi.fn();

    const { unmount } = render(
      <TicketMainColumnStepper
        currentTicket={{
          id: 't-100',
          machineName: 'Przecinarka Plazmowa #1',
          status: 2,
          priority: 'Krytyczny',
        }}
        user={mockCurrentUser}
        loading={false}
        isArchive={false}
        selectedService=""
        setSelectedService={setSelectedService}
        services={[]}
        etr=""
        comment=""
        setComment={vi.fn()}
        handleUpdate={vi.fn()}
        handleArchiveTicket={vi.fn()}
        handleDeleteTicket={vi.fn()}
        allowTicketDeletion={true}
        uploadedPhotos={[]}
        setUploadedPhotos={vi.fn()}
        uploadError=""
        branding={{ industryProfile: 'industrial' }}
        setIsPartModalOpen={vi.fn()}
        isUploading={false}
        uploadProgress={0}
      />
    );

    expect(screen.getByRole('option', { name: 'Serwis Zewnętrzny Plazma' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Automatycy UR' })).toBeTruthy();
    unmount();

    render(
      <PlannedMaintenanceFormModal
        isOpen={true}
        onClose={vi.fn()}
        editingService={null}
        machines={[{ id: 'm-1', name: 'Przecinarka Plazmowa #1', internalId: 'UR-01' }]}
      />
    );

    expect(screen.getByRole('option', { name: 'Serwis Zewnętrzny Plazma' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Automatycy UR' })).toBeTruthy();
  });

  it('ActionItems.jsx: umożliwia wyznaczenie wykonawcy (np. Serwis Zewnętrzny Plazma) na liście tematów do realizacji oraz w oknie dodawania tematu', () => {
    useManagerStore.getState().setActionItems([
      {
        id: 'ai-1',
        machineId: 'm-1',
        machineName: 'Przecinarka Plazmowa #1',
        problem: 'Wymiana dyszy i kontrola chłodzenia',
        status: 'pending',
        createdAt: '2026-11-05T10:00:00Z',
        createdBy: 'Admin Główny',
        assignedService: 'Serwis Zewnętrzny Plazma',
      },
    ]);

    render(<ActionItems />);

    const rowContractorSelect = screen.getByTestId('action-item-contractor-ai-1');
    expect(rowContractorSelect.value).toBe('Serwis Zewnętrzny Plazma');
    expect(within(rowContractorSelect).getByText('Automatycy UR')).toBeTruthy();

    // Otwarcie okna dodawania nowego tematu i sprawdzenie listy wykonawców
    const addBtn = screen.getByRole('button', {
      name: /admin\.action_items\.add_btn|Dodaj temat/i,
    });
    fireEvent.click(addBtn);

    const modalContractorSelect = screen.getByTestId('new-action-item-contractor-select');
    expect(within(modalContractorSelect).getByText('Serwis Zewnętrzny Plazma')).toBeTruthy();
    expect(within(modalContractorSelect).getByText('Automatycy UR')).toBeTruthy();
  });

  it('ActionItems.jsx: dla serwisu zewnętrznego (onlyAssignedTasks) pokazuje wyłącznie tematy przypisane do tego wykonawcy i blokuje edycję wykonawcy oraz wykonanych tematów', () => {
    mockCurrentUser = {
      uid: 'user-andrzej',
      name: 'Andrzej Andrzej',
      email: 'andrzej@plazma.com.pl',
      role: 'role-doc-plazma',
    };

    // Nawet jeśli maszyna m-1 ma awarię przypisaną do Serwisu Zewnętrznego Plazma,
    // temat przypisany do Automatyków UR lub bez wykonawcy NIE może być widoczny
    useManagerStore.getState().setTickets([
      {
        id: 't-plazma',
        machineId: 'm-1',
        assignedTo: 'Serwis Zewnętrzny Plazma',
        status: 3,
      },
    ]);

    useManagerStore.getState().setActionItems([
      {
        id: 'ai-plazma-pending',
        machineId: 'm-1',
        machineName: 'Przecinarka Plazmowa #1',
        problem: 'Kalibracja palnika plazmowego',
        status: 'pending',
        createdAt: '2026-11-05T10:00:00Z',
        createdBy: 'Admin Główny',
        assignedService: 'Serwis Zewnętrzny Plazma',
      },
      {
        id: 'ai-automatycy',
        machineId: 'm-1',
        machineName: 'Przecinarka Plazmowa #1',
        problem: 'Aktualizacja PLC sterownika',
        status: 'pending',
        createdAt: '2026-11-05T11:00:00Z',
        createdBy: 'Admin Główny',
        assignedService: 'Automatycy UR',
      },
      {
        id: 'ai-unassigned',
        machineId: 'm-1',
        machineName: 'Przecinarka Plazmowa #1',
        problem: 'Malowanie osłony bocznej',
        status: 'pending',
        createdAt: '2026-11-05T12:00:00Z',
        createdBy: 'Admin Główny',
        assignedService: '',
      },
      {
        id: 'ai-plazma-done',
        machineId: 'm-1',
        machineName: 'Przecinarka Plazmowa #1',
        problem: 'Wymiana elektrody zakończona',
        status: 'completed',
        createdAt: '2026-11-04T10:00:00Z',
        completedAt: '2026-11-05T09:00:00Z',
        completedBy: 'Andrzej Andrzej',
        assignedService: 'Serwis Zewnętrzny Plazma',
      },
    ]);

    render(<ActionItems />);

    // Widoczny tylko temat przypisany do Serwis Zewnętrzny Plazma
    expect(screen.getAllByText('Kalibracja palnika plazmowego').length).toBeGreaterThan(0);
    expect(screen.queryByText('Aktualizacja PLC sterownika')).toBeNull();
    expect(screen.queryByText('Malowanie osłony bocznej')).toBeNull();

    // Pole wyboru wykonawcy jest zablokowane dla serwisu zewnętrznego
    const contractorSelect = screen.getByTestId('action-item-contractor-ai-plazma-pending');
    expect(contractorSelect.disabled).toBe(true);

    // Przełączenie na zakładkę Zrealizowane: wykonany temat ma zablokowaną zmianę statusu
    const completedFilterBtn = screen.getByRole('button', {
      name: /admin\.action_items\.filter_completed|Zrealizowane/i,
    });
    fireEvent.click(completedFilterBtn);

    const completedStatusSelect = screen.getByTestId('action-item-status-ai-plazma-done');
    expect(completedStatusSelect.disabled).toBe(true);
  });

  it('TicketMainColumnStepper.jsx oraz PlannedMaintenanceTimeline.jsx: blokują serwisowi zewnętrznemu edycję już wykonanych zdarzeń (np. zmianę wykonawcy lub wznowienie zamkniętej awarii)', () => {
    mockCurrentUser = {
      uid: 'user-andrzej',
      name: 'Andrzej Andrzej',
      email: 'andrzej@plazma.com.pl',
      role: 'role-doc-plazma',
    };

    // 1) Awaria na etapie 3 (przydzielony wykonawca): brak przycisku "Zmień wykonawcę"
    const { unmount } = render(
      <TicketMainColumnStepper
        currentTicket={{
          id: 't-step3',
          machineName: 'Przecinarka Plazmowa #1',
          status: 3,
          assignedTo: 'Serwis Zewnętrzny Plazma',
          priority: 'Krytyczny',
        }}
        user={mockCurrentUser}
        loading={false}
        isArchive={false}
        selectedService="Serwis Zewnętrzny Plazma"
        setSelectedService={vi.fn()}
        services={[]}
        etr=""
        comment=""
        setComment={vi.fn()}
        handleUpdate={vi.fn()}
        handleArchiveTicket={vi.fn()}
        handleDeleteTicket={vi.fn()}
        allowTicketDeletion={false}
        uploadedPhotos={[]}
        setUploadedPhotos={vi.fn()}
        uploadError=""
        branding={{ industryProfile: 'industrial' }}
        setIsPartModalOpen={vi.fn()}
        isUploading={false}
        uploadProgress={0}
      />
    );

    expect(screen.queryByText(/tickets\.details\.change_contractor|Zmień wykonawcę/i)).toBeNull();
    unmount();

    // 2) Awaria już zakończona (Krok 5): brak przycisku "Wznów pracę nad zgłoszeniem"
    const { unmount: unmountClosed } = render(
      <TicketMainColumnStepper
        currentTicket={{
          id: 't-step5',
          machineName: 'Przecinarka Plazmowa #1',
          status: 5,
          assignedTo: 'Serwis Zewnętrzny Plazma',
          priority: 'Krytyczny',
        }}
        user={mockCurrentUser}
        loading={false}
        isArchive={false}
        selectedService="Serwis Zewnętrzny Plazma"
        setSelectedService={vi.fn()}
        services={[]}
        etr=""
        comment=""
        setComment={vi.fn()}
        handleUpdate={vi.fn()}
        handleArchiveTicket={vi.fn()}
        handleDeleteTicket={vi.fn()}
        allowTicketDeletion={false}
        uploadedPhotos={[]}
        setUploadedPhotos={vi.fn()}
        uploadError=""
        branding={{ industryProfile: 'industrial' }}
        setIsPartModalOpen={vi.fn()}
        isUploading={false}
        uploadProgress={0}
      />
    );

    expect(screen.queryByText(/tickets\.details\.reopen_ticket|Wznów pracę/i)).toBeNull();
    unmountClosed();

    // 3) Serwis planowany na etapie 3: brak przycisku "Zmień wykonawcę" oraz brak "Zakończ serwis (Pomiń Kroki)"
    render(
      <PlannedMaintenanceTimeline
        srv={{
          id: 'srv-step3',
          name: 'Przegląd kwartalny plazmy',
          machineId: 'm-1',
          machineName: 'Przecinarka Plazmowa #1',
          status: 'in_progress',
          currentStep: 3,
          assignedService: 'Serwis Zewnętrzny Plazma',
        }}
        isCompleted={false}
        user={mockCurrentUser}
        onAddFutureNote={vi.fn()}
        setServiceToComplete={vi.fn()}
        onComplete={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenPartModal={vi.fn()}
        canEditPlanned={false}
        canDeletePlanned={false}
        isArchive={false}
        allowTicketDeletion={false}
        onBack={vi.fn()}
      />
    );

    expect(screen.queryByText(/tickets\.details\.change_contractor|Zmień wykonawcę/i)).toBeNull();
    expect(
      screen.queryByText(/planned\.timeline\.skipStepsCompleteBtn|Zakończ serwis \(Pomiń Kroki\)/i)
    ).toBeNull();
  });
});
