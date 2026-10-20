import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  calculateCo2Equivalent,
  formatFGasSummary,
  getCkobCategoryLabel,
  resolveMachineGeoLocation,
  buildGoogleMapsNavigationUrl,
  formatGpsCheckIn,
  isTaskAssignedToUser,
  filterTasksForFieldTechnician,
  filterMachinesForFieldTechnician,
  checkQrSubmissionCooldown,
  recordQrSubmissionTimestamp,
  getIndustryProfileConfig,
} from '../fieldServiceHelpers';
import SignaturePad from '../../components/shared/SignaturePad';
import MachineInfoCard from '../../components/manager/machines/MachineInfoCard';
import SuperAdminTenantModal from '../../components/manager/superadmin/SuperAdminTenantModal';
import TicketMainColumnHeader from '../../components/manager/tickets/TicketMainColumnHeader';
import TicketMainColumnStepper from '../../components/manager/tickets/TicketMainColumnStepper';
import PlannedMaintenanceInfo from '../../components/manager/PlannedMaintenanceInfo';
import { useManagerStore } from '../../store/managerStore';
import { formatDetails } from '../../services/audit.service';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

describe('Rozszerzenia Field Service (HVAC / F-Gazy) oraz Facility Management (Osiedla / c-KOB / RODO B2C)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. F-Gazy (Rozporządzenie UE 2024/573 & Centralny Rejestr Operatorów CRO)', () => {
    it('oblicza ekwiwalent CO2 (t CO2e) i wykrywa obowiązek karty CRO powyżej 5 t CO2e', () => {
      // R32 (GWP 675): 8 kg -> 5.4 t CO2e -> wymaga karty CRO (próby co 12 mies.)
      const r32Above = calculateCo2Equivalent('R32', 8);
      expect(r32Above.gwp).toBe(675);
      expect(r32Above.co2EquivalentTons).toBe(5.4);
      expect(r32Above.requiresCroCard).toBe(true);
      expect(r32Above.recommendedLeakCheckMonths).toBe(12);

      // R32 (GWP 675): 2 kg -> 1.35 t CO2e -> poniżej 5 t CO2e
      const r32Below = calculateCo2Equivalent('R32', 2);
      expect(r32Below.co2EquivalentTons).toBe(1.35);
      expect(r32Below.requiresCroCard).toBe(false);
      expect(r32Below.recommendedLeakCheckMonths).toBeNull();

      // R410A (GWP 2088): 30 kg -> 62.64 t CO2e -> powyżej 50 t CO2e (próby co 6 mies.)
      const r410aMedium = calculateCo2Equivalent('R410A', 30);
      expect(r410aMedium.co2EquivalentTons).toBe(62.64);
      expect(r410aMedium.requiresCroCard).toBe(true);
      expect(r410aMedium.recommendedLeakCheckMonths).toBe(6);

      // R290 (Propan - gaz naturalny, GWP 3): nawet przy dużej masie nie wymaga karty F-gazowej CRO
      const r290Natural = calculateCo2Equivalent('R290', 10);
      expect(r290Natural.co2EquivalentTons).toBe(0.03);
      expect(r290Natural.requiresCroCard).toBe(false);
    });

    it('formatuje podsumowanie protokołu F-Gaz (próba szczelności, odzysk i uzupełnienie czynnika)', () => {
      const summary = formatFGasSummary({
        refrigerantType: 'R32',
        refrigerantChargeKg: 8,
        leakTestResult: 'positive',
        refrigerantAddedKg: 0.45,
        refrigerantRecoveredKg: 0,
      });

      expect(summary).toContain('Czynnik: R32 (8 kg / 5.4 t CO2e)');
      expect(summary).toContain('Próba szczelności: POZYTYWNA (Szczelny)');
      expect(summary).toContain('Uzupełniono czynnik: +0.45 kg');
    });
  });

  describe('2. Prawo Budowlane — c-KOB (Cyfrowa Książka Obiektu Budowlanego)', () => {
    it('zwraca pełną nazwę kategorii przeglądu okresowego c-KOB', () => {
      expect(getCkobCategoryLabel('gazowa_1r')).toContain('Instalacja gazowa');
      expect(getCkobCategoryLabel('budowlany_5l')).toContain('5-letni');
      expect(getCkobCategoryLabel('')).toBe('');
    });
  });

  describe('3. Geolokalizacja GPS, Nawigacja Google Maps i Check-in GPS', () => {
    it('rozwiązuje współrzędne lub adres z maszyny albo z rejonu nadrzędnego i buduje URL nawigacji', () => {
      const regions = [
        { id: 'reg-osiedle', name: 'Osiedle Zielone', address: 'Gdańsk, ul. Zielona 10' },
      ];

      const machineWithOwnCoords = {
        id: 'm1',
        name: 'Pompa ciepła Panasonic 9kW',
        mapLat: 54.5189,
        mapLng: 18.5305,
        address: 'Gdynia, ul. Morska 12',
      };

      const geo1 = resolveMachineGeoLocation(machineWithOwnCoords, regions);
      expect(geo1.hasCoordinates).toBe(true);
      expect(geo1.hasAddress).toBe(true);
      expect(geo1.canNavigate).toBe(true);
      expect(buildGoogleMapsNavigationUrl(geo1)).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=54.5189%2C18.5305'
      );

      const machineInheritingRegionAddress = {
        id: 'm2',
        name: 'Brama garażowa B-1',
        regionId: 'reg-osiedle',
      };
      const geo2 = resolveMachineGeoLocation(machineInheritingRegionAddress, regions);
      expect(geo2.hasCoordinates).toBe(false);
      expect(geo2.hasAddress).toBe(true);
      expect(geo2.address).toBe('Gdańsk, ul. Zielona 10');
      expect(buildGoogleMapsNavigationUrl(geo2)).toContain(
        'https://www.google.com/maps/dir/?api=1&destination=Gda%C5%84sk'
      );
    });

    it('formatuje potwierdzenie obecności GPS (Check-in)', () => {
      const formatted = formatGpsCheckIn({
        lat: 54.518891,
        lng: 18.530542,
        accuracy: 11.7,
      });
      expect(formatted).toBe('54.51889, 18.53054 (±12 m)');
    });
  });

  describe('4. Zaostrzone RODO B2C — Izolacja zleceń i bazy klientów dla mobilnego serwisanta', () => {
    const fieldTechUser = {
      uid: 'u-tech-1',
      name: 'Marek Serwisant',
      email: 'marek@klima-serwis.pl',
      role: 'serwisant',
    };

    const adminUser = {
      uid: 'u-admin-1',
      name: 'Szef',
      role: 'admin',
    };

    const tickets = [
      { id: 't1', machineId: 'm-kowalski', assignedTo: 'Marek Serwisant', topic: 'Brak grzania' },
      { id: 't2', machineId: 'm-nowak', assignedTo: 'Inny Instalator', topic: 'Wyciek' },
    ];

    const services = [
      { id: 's1', machineId: 'm-wisniewski', requiredPersonnel: 'Marek Serwisant', name: 'Przegląd roczny' },
      { id: 's2', machineId: 'm-nowak', requiredPersonnel: 'Inny Instalator', name: 'Przegląd 5-letni' },
    ];

    const machines = [
      { id: 'm-kowalski', name: 'Pompa Kowalski', address: 'Warszawa, ul. Prywatna 1' },
      { id: 'm-wisniewski', name: 'Klimatyzator Wiśniewski', address: 'Warszawa, ul. Cicha 5' },
      { id: 'm-nowak', name: 'Kocioł Nowak (Obcy klient)', address: 'Kraków, ul. Tajna 99' },
    ];

    it('filtruje zgłoszenia i serwisy tylko do przypisanych dla serwisanta z włączoną opcją onlyAssignedTasks', () => {
      expect(isTaskAssignedToUser(tickets[0], fieldTechUser)).toBe(true);
      expect(isTaskAssignedToUser(tickets[1], fieldTechUser)).toBe(false);

      const techTickets = filterTasksForFieldTechnician(tickets, fieldTechUser, true);
      expect(techTickets.map(t => t.id)).toEqual(['t1']);

      const techServices = filterTasksForFieldTechnician(services, fieldTechUser, true);
      expect(techServices.map(s => s.id)).toEqual(['s1']);

      // Administrator zawsze widzi wszystkie zlecenia
      const adminTickets = filterTasksForFieldTechnician(tickets, adminUser, true);
      expect(adminTickets).toHaveLength(2);
    });

    it('ukrywa adresy i urządzenia obcych klientów (m-nowak) przed mobilnym serwisantem', () => {
      const visibleMachines = filterMachinesForFieldTechnician(
        machines,
        tickets,
        services,
        fieldTechUser,
        true
      );
      expect(visibleMachines.map(m => m.id)).toEqual(['m-kowalski', 'm-wisniewski']);
      expect(visibleMachines.some(m => m.id === 'm-nowak')).toBe(false);
    });

    it('nie dopasowuje fałszywie pustego symbolu "-" w assignedTo do e-maila z myślnikiem oraz rozpoznaje completionDetails.completedBy', () => {
      const unassignedDashTask = { id: 't-dash', assignedTo: '-', assignedService: '-' };
      expect(isTaskAssignedToUser(unassignedDashTask, fieldTechUser)).toBe(false);

      const archivedService = {
        id: 's-arch',
        status: 'completed',
        completionDetails: { completedBy: 'Marek Serwisant' },
      };
      expect(isTaskAssignedToUser(archivedService, fieldTechUser)).toBe(true);
    });
  });

  describe('5. Ochrona antyspamowa publicznych kodów QR na osiedlach', () => {
    it('blokuje ponowne wysłanie zgłoszenia przed upływem czasu cooldownu', () => {
      const t0 = 1700000000000;
      expect(checkQrSubmissionCooldown(45000, t0).allowed).toBe(true);

      recordQrSubmissionTimestamp(t0);

      // 10 sekund później -> zablokowane (pozostało 35 s)
      const check1 = checkQrSubmissionCooldown(45000, t0 + 10000);
      expect(check1.allowed).toBe(false);
      expect(check1.remainingSeconds).toBe(35);

      // 46 sekund później -> odblokowane
      const check2 = checkQrSubmissionCooldown(45000, t0 + 46000);
      expect(check2.allowed).toBe(true);
      expect(check2.remainingSeconds).toBe(0);
    });
  });

  describe('6. Komponenty UI: SignaturePad, Audit Trail oraz Karta Maszyny z Nawigacją GPS i F-Gazem', () => {
    it('renderuje SignaturePad, zachowuje podpis przy zmianie nazwiska i pozwala wyczyścić canvas', () => {
      const handleChange = vi.fn();
      const handleSignerChange = vi.fn();

      render(
        <SignaturePad
          signerName="Jan Kowalski"
          onSignerNameChange={handleSignerChange}
          onChange={handleChange}
        />
      );

      const input = screen.getByTestId('signature-signer-input');
      expect(input.value).toBe('Jan Kowalski');

      const canvas = screen.getByTestId('signature-canvas');
      fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseMove(canvas, { clientX: 80, clientY: 50 });
      fireEvent.mouseUp(canvas);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          signatureDataUrl: expect.stringContaining('data:image/png;base64,'),
        })
      );

      // Zmiana nazwiska po złożeniu podpisu nie może nadpisać signatureDataUrl pustym stringiem
      fireEvent.change(input, { target: { value: 'Anna Nowak' } });
      expect(handleSignerChange).toHaveBeenCalledWith('Anna Nowak');
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          signatureDataUrl: expect.stringContaining('data:image/png;base64,'),
          signerName: 'Anna Nowak',
        })
      );

      const clearBtn = screen.getByTestId('signature-clear-btn');
      fireEvent.click(clearBtn);
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ signatureDataUrl: '' })
      );
    });

    it('pomija base64 clientSignature w logach audytowych i tłumaczy nowe pola HVAC/Facility Management', () => {
      const formatted = formatDetails(
        {
          address: 'Gdynia, ul. Morska 10',
          refrigerantType: 'R32',
          clientSignerName: 'Jan Kowalski',
          clientSignature: 'data:image/png;base64,VERY_LONG_BASE64_STRING',
        },
        'UPDATE',
        'MACHINE',
        { machines: [], regions: [] }
      );

      expect(formatted).toContain('Adres GPS: Gdynia, ul. Morska 10');
      expect(formatted).toContain('Czynnik chłodniczy: R32');
      expect(formatted).toContain('Podpisał (Klient): Jan Kowalski');
      expect(formatted).not.toContain('VERY_LONG_BASE64_STRING');
      expect(formatted).not.toContain('clientSignature');
    });

    it('wyświetla przycisk Nawiguj GPS, dane F-Gaz (CRO) i dane klienta w MachineInfoCard', () => {
      const machine = {
        id: 'm-hvac-1',
        name: 'Pompa Ciepła Daikin Altherma',
        regionId: 'r1',
        address: 'Sopot, ul. Bohaterów Monte Cassino 15',
        contactPerson: 'Wspólnota Sopot 15',
        contactPhone: '501 202 303',
        accessNotes: 'Kod domofonu: 15#9999',
        inspectionCategory: 'hvac_kotlownia',
        refrigerantType: 'R32',
        refrigerantChargeKg: 9,
      };

      render(
        <MachineInfoCard
          machine={machine}
          parentMachine={null}
          childMachines={[]}
          regions={[{ id: 'r1', name: 'Sopot Centrum' }]}
          regionName="Sopot Centrum"
          totalPartsCost={0}
          setIsWorkHoursModalOpen={vi.fn()}
          onViewRelatedMachine={vi.fn()}
          onAddChildMachine={vi.fn()}
          parts={[]}
        />
      );

      const navBtn = screen.getByTestId('machine-navigate-gps-btn');
      expect(navBtn).toBeTruthy();
      expect(navBtn.getAttribute('href')).toContain('google.com/maps/dir/');

      const fGasBadge = screen.getByTestId('machine-fgas-badge');
      expect(fGasBadge.textContent).toContain('R32');
      expect(fGasBadge.textContent).toContain('6.075 t CO2e');
      expect(fGasBadge.textContent).toContain('Wymagana Karta CRO');
      expect(screen.getByText(/Kod domofonu: 15#9999/)).toBeTruthy();
    });
  });

  describe('7. Profile branżowe firm (industrial / facility / hvac), karty serwisu/awarii i blokada F-Gaz na nieaktywnym etapie', () => {
    it('pozwala wybrać rodzaj firmy (industrial / facility / hvac) w oknie tworzenia i edycji firmy (SuperAdminTenantModal)', () => {
      const setFormData = vi.fn();
      const formData = {
        id: 'klima',
        name: 'Serwis Klima Sp. z o.o.',
        industryProfile: 'industrial',
        maxUsers: 10,
        maxMachines: 50,
        modules: { planned_services: true, inventory: true },
      };

      render(
        <SuperAdminTenantModal
          isModalOpen={true}
          setIsModalOpen={vi.fn()}
          isEditing={false}
          formData={formData}
          setFormData={setFormData}
          handleSave={vi.fn(e => e.preventDefault())}
          fileInputRef={{ current: null }}
          processCompanyLogo={vi.fn()}
          uploadingLogo={false}
        />
      );

      const hvacBtn = screen.getByTestId('industry-profile-option-hvac');
      fireEvent.click(hvacBtn);
      expect(setFormData).toHaveBeenCalledWith(
        expect.objectContaining({ industryProfile: 'hvac' })
      );

      const facilityBtn = screen.getByTestId('industry-profile-option-facility');
      fireEvent.click(facilityBtn);
      expect(setFormData).toHaveBeenCalledWith(
        expect.objectContaining({ industryProfile: 'facility' })
      );
    });

    it('renderuje różne Karty Awarii oraz Karty Serwisu dla każdego rodzaju firmy (industrial, facility, hvac)', () => {
      const sampleTicket = {
        id: 't100',
        topic: 'Przegląd i usterka',
        machineId: 'm1',
        machineName: 'Obiekt Testowy 1',
        regionName: 'Lokalizacja A',
        status: 2,
        isCritical: true,
        reportedBy: 'Jan Testowy',
      };
      const sampleMachine = {
        id: 'm1',
        name: 'Obiekt Testowy 1',
        regionId: 'r1',
        operatingHours: 1450,
        inspectionCategory: 'gazowa_1r',
        refrigerantType: 'R32',
        refrigerantChargeKg: 8,
        contactPerson: 'Wspólnota Mieszkaniowa',
        accessNotes: 'Kod domofonu 12#3456',
      };
      const sampleService = {
        id: 's100',
        name: 'Przegląd roczny',
        machineId: 'm1',
        machineName: 'Obiekt Testowy 1',
        triggerType: 'calendar',
        intervalDays: 365,
        status: 'pending',
      };

      // 1. INDUSTRIAL
      useManagerStore.getState().setBranding({
        companyName: 'Stocznia',
        industryProfile: 'industrial',
      });
      const { unmount: u1 } = render(
        <>
          <TicketMainColumnHeader
            currentTicket={sampleTicket}
            STATUSES={{ 2: { label: 'W toku', color: '' } }}
            machines={[sampleMachine]}
            regions={[{ id: 'r1', name: 'Hala H-1' }]}
          />
          <PlannedMaintenanceInfo
            srv={sampleService}
            machine={sampleMachine}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Hala H-1'}
            regions={[{ id: 'r1', name: 'Hala H-1' }]}
          />
        </>
      );
      expect(screen.getByTestId('ticket-domain-industrial')).toBeTruthy();
      expect(screen.getByTestId('service-domain-industrial')).toBeTruthy();
      expect(screen.getByTestId('ticket-profile-banner').textContent).toContain(
        getIndustryProfileConfig('industrial').ticketCardTitle
      );
      u1();

      // 2. FACILITY (Osiedla / c-KOB)
      useManagerStore.getState().setBranding({
        companyName: 'Osiedle Zielone',
        industryProfile: 'facility',
      });
      const { unmount: u2 } = render(
        <>
          <TicketMainColumnHeader
            currentTicket={sampleTicket}
            STATUSES={{ 2: { label: 'W toku', color: '' } }}
            machines={[sampleMachine]}
            regions={[{ id: 'r1', name: 'Budynek B' }]}
          />
          <PlannedMaintenanceInfo
            srv={sampleService}
            machine={sampleMachine}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Budynek B'}
            regions={[{ id: 'r1', name: 'Budynek B' }]}
          />
        </>
      );
      expect(screen.getByTestId('ticket-domain-facility')).toBeTruthy();
      expect(screen.getByTestId('service-domain-facility')).toBeTruthy();
      expect(screen.getByTestId('ticket-profile-banner').textContent).toContain(
        getIndustryProfileConfig('facility').ticketCardTitle
      );
      u2();

      // 3. HVAC (Serwis mobilny / F-Gazy)
      useManagerStore.getState().setBranding({
        companyName: 'Klima-Serwis',
        industryProfile: 'hvac',
      });
      const { unmount: u3 } = render(
        <>
          <TicketMainColumnHeader
            currentTicket={sampleTicket}
            STATUSES={{ 2: { label: 'W toku', color: '' } }}
            machines={[sampleMachine]}
            regions={[{ id: 'r1', name: 'Dom Klienta' }]}
          />
          <PlannedMaintenanceInfo
            srv={sampleService}
            machine={sampleMachine}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Dom Klienta'}
            regions={[{ id: 'r1', name: 'Dom Klienta' }]}
          />
        </>
      );
      expect(screen.getByTestId('ticket-domain-hvac')).toBeTruthy();
      expect(screen.getByTestId('service-domain-hvac')).toBeTruthy();
      expect(screen.getByTestId('ticket-profile-banner').textContent).toContain(
        getIndustryProfileConfig('hvac').ticketCardTitle
      );
      u3();
    });

    it('blokuje możliwość wybrania lub rozwinięcia F-Gazów gdy etap 4 jest nieaktywny (podgląd innego etapu)', () => {
      useManagerStore.getState().setBranding({
        companyName: 'Klima-Serwis',
        industryProfile: 'hvac',
      });
      useManagerStore.getState().setMachines([
        {
          id: 'm-hvac',
          name: 'Pompa ciepła R32',
          refrigerantType: 'R32',
          refrigerantChargeKg: 8,
        },
      ]);

      // Zgłoszenie jest na etapie 1 (Przyjęcie zgłoszenia), więc etap 4 jest NIEAKTYWNY
      const ticketInStep1 = {
        id: 't-step1',
        machineId: 'm-hvac',
        status: 1,
      };

      render(
        <TicketMainColumnStepper
          currentTicket={ticketInStep1}
          user={{ role: 'admin', name: 'Admin' }}
          loading={false}
          isArchive={false}
          selectedService=""
          setSelectedService={vi.fn()}
          services={[]}
          etr={null}
          comment=""
          setComment={vi.fn()}
          handleUpdate={vi.fn()}
          handleArchiveTicket={vi.fn()}
          handleDeleteTicket={vi.fn()}
          allowTicketDeletion={false}
          uploadedPhotos={[]}
          setUploadedPhotos={vi.fn()}
          uploadError={null}
          branding={{ industryProfile: 'hvac' }}
          setIsPartModalOpen={vi.fn()}
          isUploading={false}
          uploadProgress=""
        />
      );

      // Klikamy nagłówek kroku 4 (podgląd nieaktywnego etapu)
      const step4Circle = screen.getByRole('button', { name: '4' });
      fireEvent.click(step4Circle);

      // Przycisk sekcji F-Gaz musi być disabled i pola F-Gaz nie mogą być rozwinięte/aktywne
      const fGasToggleBtn = screen.getByTestId('ticket-fgas-toggle-btn');
      expect(fGasToggleBtn.disabled).toBe(true);
      fireEvent.click(fGasToggleBtn);
      expect(screen.queryByText('Wynik próby szczelności układu')).toBeNull();
    });
  });
});
