import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import plTranslation from '../../../locales/pl/translation.json';
import MapEditModal from '../MapEditModal';
import MapControls from '../map/MapControls';
import TicketMainColumnStepper from '../tickets/TicketMainColumnStepper';
import PlannedMaintenanceTimeline from '../PlannedMaintenanceTimeline';
import SuperAdminTenantTable from '../superadmin/SuperAdminTenantTable';
import { formatDetails, normalizeAuditLogDetails } from '../../../services/audit.service';
import { generateMachineHistoryPDF } from '../../../utils/reports/pdfMachineCard';
import { generateTicketPDF } from '../../../utils/reports/pdfTicketCard';
import { generateServicePDF } from '../../../utils/reports/pdfServiceCard';
import { generateKPIReportPDF } from '../../../utils/reports/pdfKPIReport';

// Mock useAuth for MapControls
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', role: 'admin', permissions: ['edit_map'] } })
}));

// Mock DictationButton
vi.mock('../../shared/DictationButton', () => ({
  default: () => <div data-testid="dictation-btn" />
}));

const mockSavePdfWithPrompt = vi.fn();
vi.mock('../../../utils/pdfHelper', () => ({
  savePdfWithPrompt: (...args) => mockSavePdfWithPrompt(...args)
}));

vi.mock('../../../utils/reports/pdfHelpers', () => ({
  getBrandingLogoBase64: vi.fn(async () => null),
  getImageDimensions: vi.fn(async () => ({ width: 100, height: 100 }))
}));

vi.mock('../../../hooks/usePartTransactions', () => ({
  fetchTransactionsForMachine: vi.fn(async () => [
    {
      id: 'tx1',
      partId: 'p1',
      partName: 'Dysza węglikowa 8mm',
      type: 'issue_ticket',
      machineId: 'm1',
      referenceId: 't1',
      quantity: -2,
      totalCost: 350,
      createdAt: '2026-10-18T10:00:00Z',
      userName: 'Mechanik 1'
    }
  ]),
  fetchTransactionsForReference: vi.fn(async () => [
    {
      id: 'tx1',
      partId: 'p1',
      partName: 'Dysza węglikowa 8mm',
      type: 'issue_ticket',
      machineId: 'm1',
      referenceId: 't1',
      quantity: -2,
      totalCost: 350,
      createdAt: '2026-10-18T10:00:00Z',
      userName: 'Mechanik 1'
    }
  ])
}));

describe('Weryfikacja 12 punktów wdrożeniowych', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Pkt 1 & 2: MapControls wyświetla ścieżkę podmap (breadcrumbs) oraz panel konfiguracji Mapy Google', () => {
    const onSaveGoogleMapConfig = vi.fn();
    const setCurrentSubmapId = vi.fn();

    render(
      <MapControls
        mode="edit"
        setMode={vi.fn()}
        currentSubmapId="budynek_a"
        setCurrentSubmapId={setCurrentSubmapId}
        breadcrumbPath={[
          { id: 'osiedle_1', name: 'Osiedle Słoneczne' },
          { id: 'budynek_a', name: 'Budynek A' }
        ]}
        activeMapType="google"
        activeGoogleQuery="Gdańsk, ul. Słoneczna 10"
        activeGoogleLat={54.352}
        activeGoogleLng={18.6466}
        activeGoogleZoom={18}
        activeGoogleStyle="k"
        onSaveGoogleMapConfig={onSaveGoogleMapConfig}
        isFullscreen={false}
        toggleFullscreen={vi.fn()}
        zoomScale={1}
        setZoomScale={vi.fn()}
        setZoomPan={vi.fn()}
        saveDefaultView={vi.fn()}
        uploadingMap={false}
        handleMapFileChange={vi.fn()}
        mapDragActive={false}
        handleMapDragEnter={vi.fn()}
        handleMapDragLeave={vi.fn()}
        handleMapDragOver={vi.fn()}
        handleMapDrop={vi.fn()}
        isSettingsMinimized={false}
        setIsSettingsMinimized={vi.fn()}
      />
    );

    // Weryfikacja breadcrumbs podmap
    expect(screen.getByText('Osiedle Słoneczne')).toBeInTheDocument();
    expect(screen.getByText('Budynek A')).toBeInTheDocument();

    // Kliknięcie "Poziom wyżej" cofa do rodzica ('osiedle_1')
    fireEvent.click(screen.getByTitle('Cofnij poziom wyżej'));
    expect(setCurrentSubmapId).toHaveBeenCalledWith('osiedle_1');

    // Weryfikacja zapisu Mapy Google
    const applyBtn = screen.getByText(/Wgraj ustawiony widok mapy/i);
    fireEvent.click(applyBtn);
    expect(onSaveGoogleMapConfig).toHaveBeenCalledWith({
      mapType: 'google',
      googleQuery: 'Gdańsk, ul. Słoneczna 10',
      googleLat: 54.352,
      googleLng: 18.6466,
      googleZoom: 18,
      googleMapStyle: 'k'
    });
  });

  it('Pkt 2: MapEditModal pozwala przypinać podmapy wewnątrz podmap i blokuje cykle (rodziców)', () => {
    const setEditingType = vi.fn();
    const setEditingId = vi.fn();

    const regions = [
      { id: 'osiedle_1', name: 'Osiedle Słoneczne', parentId: null, xPercent: 50, yPercent: 50 },
      { id: 'budynek_a', name: 'Budynek A', parentId: 'osiedle_1', xPercent: 30, yPercent: 30 },
      { id: 'klatka_1', name: 'Klatka 1', parentId: 'budynek_a', xPercent: null, yPercent: null }
    ];

    render(
      <MapEditModal
        isModalOpen={true}
        editingType="region"
        setEditingType={setEditingType}
        editingId=""
        setEditingId={setEditingId}
        currentSubmapId="budynek_a"
        regions={regions}
        machines={[]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Przycisk "Podrejon / Podmapa" jest aktywny na podmapie
    expect(screen.getByText('Podrejon / Podmapa')).not.toBeDisabled();

    // Na liście do przypięcia w 'budynek_a' jest 'Klatka 1', a nie ma 'Osiedle Słoneczne' ani 'Budynek A'
    expect(screen.getByRole('option', { name: 'Klatka 1' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Osiedle Słoneczne' })).not.toBeInTheDocument();
  });

  it('Pkt 4, 5, 6: Karta awarii (TicketMainColumnStepper) ma ujednolicony wybór wykonawcy, Aktywny etap, cofanie kroków i komunikat końcowy w Kroku 5', () => {
    const handleUpdate = vi.fn();
    const setSelectedService = vi.fn();

    const { rerender } = render(
      <TicketMainColumnStepper
        currentTicket={{
          id: 't100',
          status: 3,
          assignedTo: 'Serwis Dźwigowy Sp. z o.o.',
          assignedAt: '2026-10-19T08:00:00.000Z'
        }}
        user={{ uid: 'u1', role: 'admin' }}
        loading={false}
        isArchive={false}
        selectedService="Serwis Dźwigowy Sp. z o.o."
        setSelectedService={setSelectedService}
        services={[{ id: 's1', name: 'Serwis Dźwigowy Sp. z o.o.' }]}
        etr=""
        comment=""
        setComment={vi.fn()}
        handleUpdate={handleUpdate}
        handleArchiveTicket={vi.fn()}
        handleDeleteTicket={vi.fn()}
        allowTicketDeletion={false}
        uploadedPhotos={[]}
        setUploadedPhotos={vi.fn()}
        uploadError={null}
        branding={{}}
        setIsPartModalOpen={vi.fn()}
        isUploading={false}
        uploadProgress={0}
      />
    );

    // Oznaczenie "Aktywny etap" oraz informacja kto został wybrany jako wykonawca w Kroku 3
    expect(screen.getByText('Aktywny etap')).toBeInTheDocument();
    expect(screen.getByText(/Wyznaczony wykonawca:/i)).toBeInTheDocument();
    expect(screen.getByText('Serwis Dźwigowy Sp. z o.o.')).toBeInTheDocument();

    // W aktywnym Kroku 3 przycisk cofania wykonawcy działa
    fireEvent.click(screen.getByText('tickets.details.change_contractor'));
    expect(handleUpdate).toHaveBeenCalledWith('t100', 2, 'tickets.details.reverted_contractor', '');

    // W podglądzie Kroku 2 (gdy aktywny jest Krok 3) przyciski z Kroku 2 są zablokowane, a nie zawiera sekcji notatki
    expect(screen.getByText(/Wybierz wykonawcę \(serwis wewnętrzny lub podwykonawca\):/i)).toBeInTheDocument();
    expect(screen.getByText('Cofnij').closest('button')).toBeDisabled();

    // Krok 5 po zakończeniu wyświetla komunikat "Naprawa została pomyślnie zrealizowana i przeniesiona do historii."
    rerender(
      <TicketMainColumnStepper
        currentTicket={{
          id: 't100',
          status: 5,
          assignedTo: 'Serwis Dźwigowy Sp. z o.o.',
          closedAt: '2026-10-19T12:00:00.000Z'
        }}
        user={{ uid: 'u1', role: 'admin' }}
        loading={false}
        isArchive={true}
        selectedService="Serwis Dźwigowy Sp. z o.o."
        setSelectedService={setSelectedService}
        services={[]}
        etr=""
        comment=""
        setComment={vi.fn()}
        handleUpdate={handleUpdate}
        handleArchiveTicket={vi.fn()}
        handleDeleteTicket={vi.fn()}
        allowTicketDeletion={false}
        uploadedPhotos={[]}
        setUploadedPhotos={vi.fn()}
        uploadError={null}
        branding={{}}
        setIsPartModalOpen={vi.fn()}
        isUploading={false}
        uploadProgress={0}
      />
    );

    expect(
      screen.getByText('Naprawa została pomyślnie zrealizowana i przeniesiona do historii.')
    ).toBeInTheDocument();
  });

  it('Pkt 6: Karta serwisu (PlannedMaintenanceTimeline) wyświetla w Kroku 5 zaktualizowany napis o przeniesieniu do historii', () => {
    render(
      <PlannedMaintenanceTimeline
        srv={{
          id: 'srv_1',
          name: 'Przegląd roczny suwnicy',
          status: 'completed',
          currentStep: 5,
          assignedService: 'Serwis Zewnętrzny',
          completedAt: '2026-10-19T14:00:00.000Z'
        }}
        isCompleted={true}
        user={{ uid: 'u1', role: 'admin' }}
        canEditPlanned={true}
        canDeletePlanned={false}
        isArchive={true}
        actualPartsUsed={[]}
      />
    );

    expect(
      screen.getByText('Serwis został pomyślnie zrealizowany i przeniesiony do historii')
    ).toBeInTheDocument();
  });

  it('Pkt 7: Raporty PDF (Maszyna, Awaria, Serwis, KPI) generują tabele części, podzespołów, DTR i kosztów bez błędów', async () => {
    const machine = {
      id: 'm1',
      name: 'Piaskarka Komorowa',
      internalId: 'PK-01',
      parentId: 'm_parent',
      dtrFiles: [{ name: 'Instrukcja_PK01.pdf', category: 'DTR', uploadedAt: '2026-10-01' }],
      techNotes: [{ text: 'Wymieniono dyszę', createdBy: 'Jan Kowalski', createdAt: '2026-10-10T10:00:00Z' }]
    };
    const tickets = [
      {
        id: 't1',
        machineId: 'm1',
        machineName: 'Piaskarka Komorowa',
        topic: 'Spadek ciśnienia',
        status: 5,
        isCritical: true,
        assignedTo: 'Dział UR',
        assignedAt: '2026-10-18T08:30:00Z',
        inProgressAt: '2026-10-18T09:00:00Z',
        createdAt: '2026-10-18T08:00:00Z',
        closedAt: '2026-10-18T11:00:00Z',
        history: []
      }
    ];
    const plannedServices = [
      {
        id: 's1',
        name: 'Wymiana filtrów',
        machineId: 'm1',
        machineName: 'Piaskarka Komorowa',
        status: 'completed',
        assignedService: 'Dział UR',
        manHours: 3.5,
        requiredParts: [{ partId: 'p1', partName: 'Dysza węglikowa 8mm', quantity: 2, unit: 'szt.' }],
        checklist: [{ task: 'Sprawdzenie szczelności', checked: true }]
      }
    ];

    await generateMachineHistoryPDF(machine, tickets, plannedServices);
    expect(mockSavePdfWithPrompt).toHaveBeenCalledTimes(1);

    await generateTicketPDF(tickets[0]);
    expect(mockSavePdfWithPrompt).toHaveBeenCalledTimes(2);

    await generateServicePDF(plannedServices[0], machine);
    expect(mockSavePdfWithPrompt).toHaveBeenCalledTimes(3);

    await generateKPIReportPDF(tickets, plannedServices, [machine], 'Październik 2026');
    expect(mockSavePdfWithPrompt).toHaveBeenCalledTimes(4);
  });

  it('Pkt 8: Tłumaczenie przycisku DTR ma wartość "Analizuj wszystkie pliki DTR"', () => {
    expect(plTranslation.machines.dtr.chatWithDtr).toBe('Analizuj wszystkie pliki DTR');
  });

  it('Pkt 10: Audit Trail (ISO 55000) rozwiązuje Maszyna: Nieznana i czyści niejasne opisy inProgressAt / ETR:', () => {
    const storeState = {
      machines: [{ id: 'm_piaskarka', name: 'Piaskarka' }],
      tickets: [{ id: 't_1', machineId: 'm_piaskarka', machineName: 'Piaskarka' }]
    };

    // Test formatowania nowych logów
    const formatted = formatDetails(
      { status: 4, inProgressAt: '2026-10-19T09:11:25.335Z', etr: '' },
      'UPDATE',
      'TICKET',
      storeState
    );
    expect(formatted).toContain('Status: Naprawa w trakcie');
    expect(formatted).toContain('Rozpoczęto naprawę:');
    expect(formatted).not.toContain('inProgressAt');
    expect(formatted).not.toContain('ETR:');

    // Test normalizacji historycznych logów zapisanych już w bazie
    const legacyNormalized = normalizeAuditLogDetails(
      {
        entityType: 'TICKET',
        entityId: 't_1',
        details: '[Maszyna: Nieznana] Aktualizacja: Status: Zakończone, inProgressAt: 2026-10-19T09:11:25.335Z, ETR:'
      },
      storeState
    );

    expect(legacyNormalized).toContain('[Maszyna: Piaskarka]');
    expect(legacyNormalized).toContain('Status: Naprawa w trakcie');
    expect(legacyNormalized).toContain('Rozpoczęto naprawę:');
    expect(legacyNormalized).not.toContain('Maszyna: Nieznana');
    expect(legacyNormalized).not.toContain('ETR:');
  });

  it('Pkt 11 & 12: SuperAdminTenantTable wyświetla moduły Panel Serwisu (DTR) oraz Magazyn części zamiennych', () => {
    render(
      <SuperAdminTenantTable
        tenantsWithTokens={[
          {
            id: 'crist',
            name: 'CRIST S.A.',
            isActive: true,
            modules: { planned_services: true, inventory: true },
            totalTokens: 0,
            whisperSeconds: 0,
            calculatedCostPLN: 0,
            frozenCostPLN: 0
          }
        ]}
        globalRates={{}}
        currentBillingMonth="2026-10"
        selectedMonth="2026-10"
        onOpenEditModal={vi.fn()}
        onOpenMachinesModal={vi.fn()}
        onToggleStatus={vi.fn()}
        onDeleteTenant={vi.fn()}
      />
    );

    expect(screen.getByText('Panel Serwisu (DTR)')).toBeInTheDocument();
    expect(screen.getByText('Magazyn części zamiennych')).toBeInTheDocument();
  });

  it('Pkt 9: Pełny Raport Audytorski (auditorExport.js) rozdziela zdarzenia w historii znakiem nowej linii (\\r\\n) i włącza wrapText', async () => {
    const fsSource = await import('fs');
    const pathSource = await import('path');
    const auditorCode = fsSource.readFileSync(
      pathSource.resolve(__dirname, '../../../utils/reports/auditorExport.js'),
      'utf8'
    );
    const ticketTableCode = fsSource.readFileSync(
      pathSource.resolve(__dirname, '../TicketTable.jsx'),
      'utf8'
    );

    // Pkt 9: Historia łączona przez \r\n oraz wrapText: true
    expect(auditorCode).toContain(".join('\\r\\n')");
    expect(auditorCode).toContain('wrapText: true');
    expect(auditorCode).not.toContain(".join(' | ')");

    // Pkt 3: Archiwum awarii bez wewnętrznego suwaka (virtualize={false})
    expect(ticketTableCode).toContain('virtualize={false}');
    expect(ticketTableCode).not.toContain('virtualize={true}');
  });
});
