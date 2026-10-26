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
  checkCkob7DaysDeadline,
  getDtrDocCategoryInfo,
  calculateDistanceMeters,
  verifyOnSiteGps,
  calculateWorkAndTravelMetrics,
  isVehicleAsset,
  getMachineCounterUnit,
  checkVehicleDatesStatus,
  normalizeLicensePlate,
  findMachineByIdentifierOrPlate,
  extractLicensePlateFromOcrText,
  recognizeLicensePlateFromVideoFrame,
  getAllRefrigerantTypes,
  saveCustomRefrigerant,
  deleteCustomRefrigerant,
  isHvacAsset,
} from '../fieldServiceHelpers';
import { checkServiceUrgency } from '../logicHelpers';
import fs from 'fs';
import path from 'path';
import SignaturePad from '../../components/shared/SignaturePad';
import QRScannerModal from '../../components/shared/QRScannerModal';
import OperatorScanner from '../../components/operator/OperatorScanner';
import MachineInfoCard from '../../components/manager/machines/MachineInfoCard';
import MachineForm from '../../components/manager/MachineForm';
import MachineDTR from '../../components/manager/MachineDTR';
import PlannedMaintenanceFormModal from '../../components/manager/PlannedMaintenanceFormModal';
import SuperAdminTenantModal from '../../components/manager/superadmin/SuperAdminTenantModal';
import TicketMainColumnHeader from '../../components/manager/tickets/TicketMainColumnHeader';
import TicketMainColumnStepper from '../../components/manager/tickets/TicketMainColumnStepper';
import PlannedMaintenanceInfo from '../../components/manager/PlannedMaintenanceInfo';
import TechnicianPerformancePanel from '../../components/manager/reports/TechnicianPerformancePanel';
import MachineCard from '../../components/manager/MachineCard';
import Login from '../../components/Login';
import { MemoryRouter } from 'react-router-dom';
import { useManagerStore } from '../../store/managerStore';
import { formatDetails } from '../../services/audit.service';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
    i18n: {
      language: 'pl',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('../../services/auth.service', () => ({
  loginWithEmail: vi.fn(),
  loginAnon: vi.fn(),
  subscribeToGeneralSettings: vi.fn(() => () => {}),
  subscribeToBranding: vi.fn(() => () => {}),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'u-test', name: 'Inż. Testowy', role: 'admin', licenseNumber: 'POM/0123/PBKb/20' },
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

      // 3a. Gdy rejon ma podmapę Google, ale urządzenie NIE ma postawionej pineski -> brak nawigacji (nie bierzemy googleLat/googleLng kadru)
      const regionsWithGoogleSubmap = [
        {
          id: 'gp010',
          name: 'Gp-010',
          mapType: 'google',
          submapConfigured: true,
          googleLat: 54.5364,
          googleLng: 18.5469,
        },
      ];
      const unpinnedMachineInGoogleRegion = {
        id: 'm3',
        name: 'Suwnica nieprzypięta',
        regionId: 'gp010',
      };
      const geoUnpinned = resolveMachineGeoLocation(
        unpinnedMachineInGoogleRegion,
        regionsWithGoogleSubmap
      );
      expect(geoUnpinned.canNavigate).toBe(false);
      expect(buildGoogleMapsNavigationUrl(geoUnpinned)).toBe('');

      // 3b. Gdy urządzenie MA postawioną pineskę na podmapie Google -> nawigacja działa
      const pinnedMachineInGoogleRegion = {
        id: 'm4',
        name: 'Suwnica przypięta na Google',
        regionId: 'gp010',
        xPercent: 45,
        yPercent: 55,
        lat: 54.5371,
        lng: 18.5482,
        pinnedOnMap: 'submap',
        pinnedOnMapType: 'google',
      };
      const geoPinnedGoogle = resolveMachineGeoLocation(
        pinnedMachineInGoogleRegion,
        regionsWithGoogleSubmap
      );
      expect(geoPinnedGoogle.canNavigate).toBe(true);
      expect(buildGoogleMapsNavigationUrl(geoPinnedGoogle)).toContain('54.5371%2C18.5482');

      // 3c. Gdy mapa powyższa (podmapa rejonu lub Mapa Główna) jest ustawiona na JPG / PNG ('image') -> brak nawigacji
      const regionsWithImageSubmap = [
        {
          id: 'gp010',
          name: 'Gp-010',
          mapType: 'image',
          mapImageUrl: 'https://example.com/hala.png',
          submapConfigured: true,
        },
      ];
      const geoOnJpgSubmap = resolveMachineGeoLocation(
        pinnedMachineInGoogleRegion,
        regionsWithImageSubmap
      );
      expect(geoOnJpgSubmap.canNavigate).toBe(false);
      expect(buildGoogleMapsNavigationUrl(geoOnJpgSubmap)).toBe('');

      const geoOnJpgMainMap = resolveMachineGeoLocation(
        { ...machineWithOwnCoords, pinnedOnMap: 'main' },
        regions,
        { mapType: 'image' }
      );
      expect(geoOnJpgMainMap.canNavigate).toBe(false);
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

    it('wyświetla przycisk Nawiguj GPS, dane F-Gaz (CRO) i dane klienta w MachineInfoCard dla profilu hvac oraz blokuje F-Gaz i c-KOB dla profilu industrial (przemysł)', () => {
      const machine = {
        id: 'm-hvac-1',
        name: 'Pompa Ciepła Daikin Altherma',
        regionId: 'r1',
        address: 'Sopot, ul. Bohaterów Monte Cassino 15',
        contactPerson: 'Wspólnota Sopot 15',
        contactPhone: '501 202 303',
        accessNotes: 'Kod domofonu: 15#9999',
        inspectionCategory: 'gazowa_1r',
        refrigerantType: 'R32',
        refrigerantChargeKg: 9,
      };

      // A. Profil HVAC -> pokazuje F-Gaz i klienta, ukrywa budowlane c-KOB
      useManagerStore.getState().setBranding({
        companyName: 'Klima-Serwis',
        industryProfile: 'hvac',
      });

      const { unmount: unmountHvac } = render(
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
      expect(screen.queryByTestId('machine-ckob-badge')).toBeNull();
      expect(screen.getByText(/Kod domofonu: 15#9999/)).toBeTruthy();
      unmountHvac();

      // B. Profil FACILITY -> pokazuje c-KOB i lokatora/domofon
      useManagerStore.getState().setBranding({
        companyName: 'Osiedle Zielone',
        industryProfile: 'facility',
      });

      const { unmount: unmountFacility } = render(
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
      expect(screen.getByTestId('machine-ckob-badge')).toBeTruthy();
      expect(screen.queryByTestId('machine-fgas-badge')).toBeNull();
      unmountFacility();

      // C. Profil INDUSTRIAL (Przemysł / Produkcja) -> blokuje zarówno F-Gazy, jak i przeglądy c-KOB w karcie i formularzu urządzenia
      useManagerStore.getState().setBranding({
        companyName: 'Zakład Produkcyjny Demo',
        industryProfile: 'industrial',
      });

      const { unmount: unmountInd } = render(
        <>
          <MachineInfoCard
            machine={machine}
            parentMachine={null}
            childMachines={[]}
            regions={[{ id: 'r1', name: 'Hala H-1' }]}
            regionName="Hala H-1"
            totalPartsCost={0}
            setIsWorkHoursModalOpen={vi.fn()}
            onViewRelatedMachine={vi.fn()}
            onAddChildMachine={vi.fn()}
            parts={[]}
          />
          <MachineForm
            isOpen={true}
            onClose={vi.fn()}
            editingMachine={null}
            regions={[{ id: 'r1', name: 'Hala H-1' }]}
            onSaved={vi.fn()}
            onError={vi.fn()}
          />
        </>
      );
      expect(screen.queryByTestId('machine-fgas-badge')).toBeNull();
      expect(screen.queryByTestId('machine-ckob-badge')).toBeNull();
      expect(screen.queryByTestId('machine-form-domain-section')).toBeNull();
      unmountInd();
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
        companyName: 'Zakład Produkcyjny',
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

  describe('8. Weryfikacja poprawek z audytu Gemini (MachineCard toggleNode, domyślne modele Vertex AI)', () => {
    it('MachineCard poprawnie przyjmuje i wywołuje toggleNode dla maszyny nadrzędnej na widoku mobilnym', () => {
      const toggleNode = vi.fn();
      const onClick = vi.fn();
      const parentMachine = {
        id: 'parent-1',
        name: 'Linia Produkcyjna A',
        hasChildren: true,
        isCollapsed: true,
        regionId: 'r1',
      };

      render(
        <MachineCard
          machine={parentMachine}
          regions={[{ id: 'r1', name: 'Hala 1' }]}
          onClick={onClick}
          toggleNode={toggleNode}
        />
      );

      fireEvent.click(screen.getByText('Linia Produkcyjna A'));
      expect(toggleNode).toHaveBeenCalledWith('parent-1');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('ustawia istniejące modele Vertex AI jako bezpieczny fallback (gemini-2.5-flash oraz chirp_2)', () => {
      const state = useManagerStore.getState();
      expect(state.geminiModel).toBe('gemini-2.5-flash');
      expect(state.transcribeModel).toBe('chirp_2');
    });
  });

  describe('9. Pakiet B: c-KOB (art. 60j, art. 60k ust. 2 i art. 62 PB), Dedykowane Serwisy, Karta Planowania i ścieżka QR', () => {
    it('checkCkob7DaysDeadline weryfikuje termin 7 dni na wpis do c-KOB (przed upływem 7 dni, po przekroczeniu 7 dni oraz po odhaczeniu ckobEntered: true)', () => {
      const nowMs = new Date('2026-10-22T12:00:00.000Z').getTime();
      const machineWithCkob = { id: 'm-ckob', name: 'Budynek A', inspectionCategory: 'roczny_ogolny' };

      // 1) Przed upływem 7 dni (minęły 3 dni -> pozostały 4 dni)
      const completed3DaysAgo = new Date(nowMs - 3 * 24 * 60 * 60 * 1000).toISOString();
      const resBefore = checkCkob7DaysDeadline(
        { id: 's1', status: 'completed', completedAt: completed3DaysAgo, ckobEntered: false },
        machineWithCkob,
        'facility',
        nowMs
      );
      expect(resBefore.requiresCkobEntry).toBe(true);
      expect(resBefore.daysElapsed).toBe(3);
      expect(resBefore.daysRemaining).toBe(4);
      expect(resBefore.isOverdue7Days).toBe(false);

      // 2) Po przekroczeniu 7 dni (minęło 9 dni -> przekroczono o 2 dni)
      const completed9DaysAgo = new Date(nowMs - 9 * 24 * 60 * 60 * 1000).toISOString();
      const resOverdue = checkCkob7DaysDeadline(
        { id: 's2', status: 'completed', completedAt: completed9DaysAgo, ckobEntered: false },
        machineWithCkob,
        'facility',
        nowMs
      );
      expect(resOverdue.requiresCkobEntry).toBe(true);
      expect(resOverdue.daysElapsed).toBe(9);
      expect(resOverdue.daysRemaining).toBe(-2);
      expect(resOverdue.isOverdue7Days).toBe(true);

      // 3) Po odhaczeniu ckobEntered: true -> nie wymaga już wpisu
      const resEntered = checkCkob7DaysDeadline(
        {
          id: 's3',
          status: 'completed',
          completedAt: completed9DaysAgo,
          ckobEntered: true,
          ckobEnteredAt: '2026-10-15T10:00:00.000Z',
          ckobEnteredBy: 'Inż. Piotr',
        },
        machineWithCkob,
        'facility',
        nowMs
      );
      expect(resEntered.requiresCkobEntry).toBe(false);
      expect(resEntered.ckobEntered).toBe(true);
      expect(resEntered.isOverdue7Days).toBe(false);
    });

    it('renderuje Metryczkę techniczną obiektu budowlanego (art. 60j PB) w MachineInfoCard oraz uprawnienia inspektora i pasek 7 dni c-KOB w PlannedMaintenanceInfo', () => {
      useManagerStore.getState().setBranding({
        companyName: 'Zarządca Nieruchomości',
        industryProfile: 'facility',
      });

      const buildingMachine = {
        id: 'b-1',
        name: 'Budynek Wielorodzinny ul. Morska 10',
        regionId: 'r1',
        inspectionCategory: 'budowlany_5l',
        buildingType: 'Budynek mieszkalny wielorodzinny',
        constructionYear: '2018',
        usableAreaM2: '3450',
        cubatureM3: '11200',
        floorsCount: '6',
        hasAsbestos: 'Brak',
        pinbAuthority: 'PINB w Gdyni',
        legalTitleDoc: 'GD1Y/00012345/6',
      };

      const completedService = {
        id: 'srv-ckob-1',
        name: 'Przegląd budowlany 5-letni',
        machineId: 'b-1',
        machineName: buildingMachine.name,
        category: 'ckob_5year',
        triggerType: 'calendar',
        intervalDays: 1825,
        status: 'completed',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        inspectorLicense: 'POM/0123/PBKb/20',
        ckobEntered: false,
      };

      const { unmount } = render(
        <>
          <MachineInfoCard
            machine={buildingMachine}
            parentMachine={null}
            childMachines={[]}
            regions={[{ id: 'r1', name: 'Osiedle Nadmorskie' }]}
            regionName="Osiedle Nadmorskie"
            totalPartsCost={0}
            setIsWorkHoursModalOpen={vi.fn()}
            onViewRelatedMachine={vi.fn()}
            onAddChildMachine={vi.fn()}
            parts={[]}
          />
          <PlannedMaintenanceInfo
            srv={completedService}
            machine={buildingMachine}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Osiedle Nadmorskie'}
            regions={[{ id: 'r1', name: 'Osiedle Nadmorskie' }]}
          />
        </>
      );

      const metricCard = screen.getByTestId('machine-ckob-metric-card');
      expect(metricCard.textContent).toContain('Budynek mieszkalny wielorodzinny');
      expect(metricCard.textContent).toContain('3450');
      expect(metricCard.textContent).toContain('11200');
      expect(metricCard.textContent).toContain('PINB w Gdyni');
      expect(metricCard.textContent).toContain('GD1Y/00012345/6');

      const licenseBadge = screen.getByTestId('service-inspector-license');
      expect(licenseBadge.textContent).toContain('POM/0123/PBKb/20');

      const ckobBanner = screen.getByTestId('ckob-7days-banner');
      expect(ckobBanner.textContent).toContain('art. 60k ust. 2 PB');
      expect(screen.getByTestId('mark-ckob-entered-btn')).toBeTruthy();

      unmount();
    });

    it('dostosowuje kartę Nowy Plan Serwisowy do profilu facility / hvac i wyświetla "Urządzenie" zamiast "Maszyna"', () => {
      useManagerStore.getState().setBranding({
        companyName: 'Wspólnota Mieszkaniowa',
        industryProfile: 'facility',
      });

      const { unmount } = render(
        <PlannedMaintenanceFormModal
          isOpen={true}
          onClose={vi.fn()}
          editingService={null}
          machines={[{ id: 'm1', name: 'Węzeł cieplny W-1' }]}
        />
      );

      expect(screen.getByText('Urządzenie')).toBeTruthy();
      expect(screen.getByTestId('planned-service-device-input')).toBeTruthy();
      expect(screen.queryByText('Maszyna')).toBeNull();

      const categorySelect = screen.getByTestId('planned-service-category-select');
      expect(categorySelect.textContent).toContain('Przegląd roczny okresowy (art. 62 ust. 1 pkt 1 PB - c-KOB)');
      expect(categorySelect.textContent).toContain('Przegląd 5-letni kompleksowy i elektryczny (art. 62 ust. 1 pkt 2 PB)');

      const statusSelect = screen.getByTestId('planned-service-status-select');
      expect(statusSelect.textContent).toContain('Wymagane powiadomienie mieszkańców / dostęp do lokali');

      expect(screen.getByText(/Roczny \(365 dni - art\. 62\.1\.1\)/)).toBeTruthy();
      unmount();
    });

    it('obsługuje kategorie dokumentacji obiektu pod c-KOB (docCategory) w MachineDTR', () => {
      expect(getDtrDocCategoryInfo('PROTOKOL_KONTROLI').shortLabel).toContain('Protokół c-KOB');
      expect(getDtrDocCategoryInfo('DECYZJA_PINB').shortLabel).toContain('Decyzja PINB/UDT');

      const machineWithFiles = {
        id: 'm-dtr-1',
        name: 'Budynek B',
        dtrFiles: [
          {
            name: 'protokol_kominiarski_2026.pdf',
            url: 'https://example.com/p.pdf',
            docCategory: 'PROTOKOL_KONTROLI',
            uploadedAt: '2026-10-20T10:00:00.000Z',
          },
        ],
      };

      const { unmount } = render(
        <MachineDTR machine={machineWithFiles} canManage={true} canDeleteNotes={true} />
      );

      expect(screen.getByTestId('dtr-doc-category-select')).toBeTruthy();
      expect(screen.getByTestId('dtr-file-category-badge').textContent).toContain('Protokół c-KOB');
      unmount();
    });

    it('filtruje zlecenia i serwis po dedykowanym serwisie przypisanym do serwisanta (user.assignedService)', () => {
      const dedicatedTech = {
        uid: 'u-hvac-tech',
        name: 'Kamil Chłodnik',
        role: 'serwisant',
        assignedService: 'Serwis Klimatyzacji i Pomp Ciepła',
      };

      const allServices = [
        {
          id: 'srv-1',
          name: 'Przegląd agregatu wody lodowej',
          machineId: 'm-chiller',
          assignedService: 'Serwis Klimatyzacji i Pomp Ciepła',
        },
        {
          id: 'srv-2',
          name: 'Przegląd bramy wjazdowej',
          machineId: 'm-gate',
          assignedService: 'Serwis Bram i Automatyki',
        },
      ];

      const filtered = filterTasksForFieldTechnician(allServices, dedicatedTech, true);
      expect(filtered.map(s => s.id)).toEqual(['srv-1']);
    });

    it('używa poprawnej ścieżki Firestore settings/qr_access w qrAccess.service.js', () => {
      const qrServicePath = path.resolve(__dirname, '../../services/qrAccess.service.js');
      const source = fs.readFileSync(qrServicePath, 'utf8');
      expect(source).toContain("doc(db, 'tenants', tenantId, 'settings', 'qr_access')");
    });

    it('w Kroku 1 wyświetla przycisk Przyjęcie zgłoszenia, w Kroku 3 nie wyświetla Start GPS, a w Kroku 4 nie wyświetla Potwierdzenia obecności GPS, zachowując podpis i nr uprawnień', () => {
      const ticketInStep1 = { id: 't-step1', machineId: 'm1', status: 1 };
      const { unmount: unmountStep1 } = render(
        <TicketMainColumnStepper
          currentTicket={ticketInStep1}
          user={{ role: 'admin', name: 'Mistrz' }}
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
          branding={{ industryProfile: 'industrial' }}
          setIsPartModalOpen={vi.fn()}
          isUploading={false}
          uploadProgress=""
        />
      );
      expect(screen.getByTestId('ticket-accept-btn').textContent).toContain('Przyjęcie zgłoszenia');
      unmountStep1();

      const ticketInStep3 = { id: 't-step3', machineId: 'm1', status: 3, assignedTo: 'Mechanicy' };
      const { unmount: unmountStep3 } = render(
        <TicketMainColumnStepper
          currentTicket={ticketInStep3}
          user={{ role: 'admin', name: 'Mistrz' }}
          loading={false}
          isArchive={false}
          selectedService="Mechanicy"
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
      expect(screen.queryByTestId('ticket-start-travel-btn')).toBeNull();
      expect(screen.queryByTestId('ticket-travel-started-badge')).toBeNull();
      unmountStep3();

      const ticketInStep4 = { id: 't-step4', machineId: 'm1', status: 4 };
      const handleUpdate = vi.fn();

      // 1) Profil INDUSTRIAL (Przemysł / Produkcja) -> brak pola nr uprawnień, brak Potwierdzenia GPS, podpis zwinięty jako opcja
      const { unmount: unmountInd } = render(
        <TicketMainColumnStepper
          currentTicket={ticketInStep4}
          user={{ role: 'admin', name: 'Mistrz' }}
          loading={false}
          isArchive={false}
          selectedService="Mechanicy"
          setSelectedService={vi.fn()}
          services={[]}
          etr={null}
          comment=""
          setComment={vi.fn()}
          handleUpdate={handleUpdate}
          handleArchiveTicket={vi.fn()}
          handleDeleteTicket={vi.fn()}
          allowTicketDeletion={false}
          uploadedPhotos={[]}
          setUploadedPhotos={vi.fn()}
          uploadError={null}
          branding={{ industryProfile: 'industrial' }}
          setIsPartModalOpen={vi.fn()}
          isUploading={false}
          uploadProgress=""
        />
      );

      expect(screen.queryByTestId('ticket-inspector-license-input')).toBeNull();
      expect(screen.queryByTestId('ticket-gps-optional-toggle')).toBeNull();
      expect(screen.queryByTestId('ticket-capture-gps-btn')).toBeNull();
      expect(screen.getByTestId('signature-optional-toggle')).toBeTruthy();
      expect(screen.queryByTestId('signature-canvas')).toBeNull();

      // Kliknięcie opcji podpisu rozwija canvas
      fireEvent.click(screen.getByTestId('signature-optional-toggle'));
      expect(screen.getByTestId('signature-canvas')).toBeTruthy();
      unmountInd();

      // 2) Profil FACILITY / HVAC -> pole nr uprawnień jest widoczne i wymagane przed zakończeniem
      const { unmount: unmountFac } = render(
        <TicketMainColumnStepper
          currentTicket={ticketInStep4}
          user={{ role: 'admin', name: 'Inspektor', licenseNumber: '' }}
          loading={false}
          isArchive={false}
          selectedService="Inspektorzy"
          setSelectedService={vi.fn()}
          services={[]}
          etr={null}
          comment=""
          setComment={vi.fn()}
          handleUpdate={handleUpdate}
          handleArchiveTicket={vi.fn()}
          handleDeleteTicket={vi.fn()}
          allowTicketDeletion={false}
          uploadedPhotos={[]}
          setUploadedPhotos={vi.fn()}
          uploadError={null}
          branding={{ industryProfile: 'facility' }}
          setIsPartModalOpen={vi.fn()}
          isUploading={false}
          uploadProgress=""
        />
      );

      const licInput = screen.getByTestId('ticket-inspector-license-input');
      expect(licInput).toBeTruthy();

      // Próba zakończenia bez wpisania nr uprawnień -> blokuje i wyświetla komunikat błędu
      fireEvent.click(screen.getByText('Zakończ Naprawę'));
      expect(handleUpdate).not.toHaveBeenCalled();
      expect(screen.getByTestId('ticket-inspector-license-error')).toBeTruthy();

      // Po wpisaniu nr uprawnień -> pozwala zakończyć naprawę
      fireEvent.change(licInput, { target: { value: 'POM/0999/PBKb/22' } });
      fireEvent.click(screen.getByText('Zakończ Naprawę'));
      expect(handleUpdate).toHaveBeenCalledWith(
        't-step4',
        5,
        expect.anything(),
        null,
        [],
        expect.anything(),
        expect.objectContaining({ inspectorLicense: 'POM/0999/PBKb/22' })
      );
      unmountFac();
    });
  });

  describe('10. Ewidencja Czasu Dojazdu, Pracy (Stoper vs RBG), Geofencing GPS (Haversine) i Porównanie Serwisantów', () => {
    it('oblicza odległość Haversine w metrach (calculateDistanceMeters) i weryfikuje geofencing GPS (verifyOnSiteGps)', () => {
      // Ten sam punkt -> 0 m
      expect(calculateDistanceMeters(54.5189, 18.5305, 54.5189, 18.5305)).toBe(0);
      // Brak współrzędnych -> null
      expect(calculateDistanceMeters(null, 18.5305, 54.5189, 18.5305)).toBeNull();
      expect(calculateDistanceMeters('', 18.5305, 54.5189, 18.5305)).toBeNull();

      // Odległość ~110 m w Gdyni
      const distNear = calculateDistanceMeters(54.5189, 18.5305, 54.5198, 18.5312);
      expect(distNear).toBeGreaterThan(80);
      expect(distNear).toBeLessThan(150);

      const targetMachine = {
        id: 'm-hvac-1',
        name: 'Pompa ciepła Budynek A',
        lat: 54.5189,
        lng: 18.5305,
      };

      // Serwisant na miejscu (~110 m <= 300 m)
      const onSiteRes = verifyOnSiteGps({ lat: 54.5198, lng: 18.5312 }, targetMachine, []);
      expect(onSiteRes.status).toBe('on_site');
      expect(onSiteRes.isOnSite).toBe(true);
      expect(onSiteRes.label).toContain('Na miejscu (');

      // Serwisant poza obiektem (~19.5 km w Gdańsku)
      const offSiteRes = verifyOnSiteGps({ lat: 54.352, lng: 18.6466 }, targetMachine, []);
      expect(offSiteRes.status).toBe('off_site');
      expect(offSiteRes.isOnSite).toBe(false);
      expect(offSiteRes.label).toContain('POZA OBIEKTEM (');
      expect(offSiteRes.label).toContain('km od obiektu!)');

      // Fallback dla urządzenia przypiętego na rzucie JPG kondygnacji wewnątrz budynku posiadającego GPS na rejonie
      const regionsWithBuildingGps = [
        {
          id: 'reg-osiedle',
          name: 'Osiedle Nadmorskie',
          lat: 54.5189,
          lng: 18.5305,
        },
        {
          id: 'reg-piwnica',
          name: 'Kondygnacja -1 (Rzut JPG)',
          parentId: 'reg-osiedle',
          mapType: 'image',
          mapImageUrl: 'https://example.com/piwnica.png',
          submapConfigured: true,
        },
      ];
      const indoorBoiler = {
        id: 'm-boiler',
        name: 'Kocioł gazowy Viessmann',
        regionId: 'reg-piwnica',
        pinnedOnMapType: 'image',
      };
      const indoorVerify = verifyOnSiteGps(
        { lat: 54.5191, lng: 18.5307 },
        indoorBoiler,
        regionsWithBuildingGps
      );
      expect(indoorVerify.status).toBe('on_site');
      expect(indoorVerify.isOnSite).toBe(true);

      // Dziedziczenie googleLat / googleLng z rejonu budynku (Facility Management / Wspólnoty)
      const regionsWithGoogleCoords = [
        {
          id: 'reg-wspolnota-1',
          name: 'Wspólnota Mieszkaniowa ul. Słoneczna 12',
          mapType: 'google',
          googleLat: 54.5189,
          googleLng: 18.5305,
          submapConfigured: true,
        },
      ];
      const apartmentVentilation = {
        id: 'm-vent-lokal4',
        name: 'Wentylacja i kominy - Lokal nr 4',
        regionId: 'reg-wspolnota-1',
      };
      const buildingInheritedVerify = verifyOnSiteGps(
        { lat: 54.519, lng: 18.5306 },
        apartmentVentilation,
        regionsWithGoogleCoords
      );
      expect(buildingInheritedVerify.status).toBe('on_site');
      expect(buildingInheritedVerify.isOnSite).toBe(true);
    });

    it('oblicza czas dojazdu, stoper pracy na miejscu, odchyłkę RBG oraz wykrywa przegląd okresowy wykonany poniżej 5 minut (isSuspiciouslyShort)', () => {
      const machine = { id: 'm1', name: 'Klimatyzator Daikin', lat: 54.5189, lng: 18.5305 };
      const task = {
        id: 't-100',
        travelStartedAt: '2026-10-25T08:00:00.000Z',
        workStartedAt: '2026-10-25T08:30:00.000Z', // 30 min dojazdu
        closedAt: '2026-10-25T10:00:00.000Z', // 90 min (1.50 h) pracy wg stopera
        manHours: 3.0, // zadeklarowano 3.0 h -> nadwyżka +1.50 h (> 0.25h)
        completedGps: { lat: 54.519, lng: 18.5306 },
      };

      const metrics = calculateWorkAndTravelMetrics(task, machine, []);
      expect(metrics.travelDurationMinutes).toBe(30);
      expect(metrics.stopwatchWorkMinutes).toBe(90);
      expect(metrics.stopwatchWorkHours).toBe(1.5);
      expect(metrics.declaredManHours).toBe(3);
      expect(metrics.discrepancyHours).toBe(1.5);
      expect(metrics.isTimeInflated).toBe(true);
      expect(metrics.isSuspiciouslyShort).toBe(false);
      expect(metrics.isMultiDayOrPaused).toBe(false);
      expect(metrics.endGpsVerification.status).toBe('on_site');

      // Przegląd okresowy c-KOB zamknięty po 2 minutach ("zza biurka") -> isSuspiciouslyShort: true
      const fastInspection = {
        id: 'srv-fast-1',
        triggerType: 'calendar',
        workStartedAt: '2026-10-25T11:00:00.000Z',
        completedAt: '2026-10-25T11:02:00.000Z', // 2 minuty
        manHours: 1.0,
      };
      const fastMetrics = calculateWorkAndTravelMetrics(fastInspection, machine, []);
      expect(fastMetrics.stopwatchWorkMinutes).toBe(2);
      expect(fastMetrics.isSuspiciouslyShort).toBe(true);
      expect(fastMetrics.isTimeInflated).toBe(true);
    });

    it('wyświetla sekcję weryfikacji czasu i GPS w nagłówku awarii i przeglądu (w tym alert <5 min) oraz tabelę rozliczenia budynków/wspólnot w raportach', () => {
      const regions = [{ id: 'reg-b1', name: 'Budynek Wspólnoty B1', lat: 54.5189, lng: 18.5305 }];
      const machine = {
        id: 'm1',
        name: 'Pompa Ciepła B1',
        regionId: 'reg-b1',
        lat: 54.5189,
        lng: 18.5305,
      };
      const ticketWithMetrics = {
        id: 't-ver-1',
        topic: 'Awaria sprężarki',
        machineId: 'm1',
        machineName: 'Pompa Ciepła B1',
        assignedTo: 'Jan Serwisant',
        status: 5,
        travelStartedAt: '2026-10-25T08:00:00.000Z',
        workStartedAt: '2026-10-25T08:25:00.000Z',
        closedAt: '2026-10-25T09:25:00.000Z', // 60 min = 1.0 h
        manHours: 2.5, // +1.5 h nadwyżki
        completedGps: { lat: 54.352, lng: 18.6466 }, // poza obiektem
      };

      const shortPlannedService = {
        id: 'srv-ver-2',
        name: 'Przegląd roczny kominiarski (art. 62 PB)',
        machineId: 'm1',
        machineName: 'Pompa Ciepła B1',
        assignedService: 'Jan Serwisant',
        triggerType: 'calendar',
        status: 'completed',
        workStartedAt: '2026-10-25T10:00:00.000Z',
        completedAt: '2026-10-25T10:03:00.000Z', // 3 minuty (< 5 min!)
        manHours: 1.0,
        completedGps: { lat: 54.5189, lng: 18.5305 },
      };

      const { unmount } = render(
        <>
          <TicketMainColumnHeader
            currentTicket={ticketWithMetrics}
            STATUSES={{ 5: { label: 'Zakończone', color: 'bg-green-100 text-green-800' } }}
            machines={[machine]}
            regions={regions}
          />
          <PlannedMaintenanceInfo
            srv={shortPlannedService}
            machine={machine}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Budynek Wspólnoty B1'}
            regions={regions}
          />
          <TechnicianPerformancePanel
            tickets={[ticketWithMetrics]}
            plannedServices={[shortPlannedService]}
            machines={[machine]}
            regions={regions}
            services={[{ id: 's1', name: 'Jan Serwisant' }]}
          />
        </>
      );

      expect(screen.getByTestId('ticket-work-gps-verification-box')).toBeTruthy();
      expect(screen.getByTestId('ticket-time-inflated-badge').textContent).toContain('+1.5 h');
      expect(screen.getByTestId('ticket-gps-geofence-badge').textContent).toContain('POZA OBIEKTEM');

      expect(screen.getByTestId('service-work-gps-verification-box')).toBeTruthy();
      expect(screen.getByTestId('service-suspiciously-short-badge').textContent).toContain(
        'Przegląd trwał poniżej 5 min (3 min)'
      );

      const summaryTable = screen.getByTestId('tech-performance-summary-table');
      expect(summaryTable.textContent).toContain('Jan Serwisant');
      expect(summaryTable.textContent).toContain('25 min');
      expect(summaryTable.textContent).toContain('3.5 h'); // 2.5h + 1.0h

      const regionsTable = screen.getByTestId('tech-performance-regions-table');
      expect(regionsTable.textContent).toContain('Budynek Wspólnoty B1');
      expect(regionsTable.textContent).toContain('3.5 h');

      unmount();
    });

    it('obsługuje przypadki brzegowe z audytu: dziedziczenie GPS po drzewie maszyn (parentId), brak fałszywego zawyżenia RBG bez stopera oraz filtrowanie podrejonów budynku', () => {
      const parentBuildingMachine = {
        id: 'm-parent-building',
        name: 'Budynek Główny A',
        gpsLat: 54.5189,
        gpsLng: 18.5305,
        regionId: 'reg-building-a',
      };
      const childApartmentDevice = {
        id: 'm-child-flat-12',
        name: 'Kocioł dwufunkcyjny - Lokal 12',
        parentId: 'm-parent-building',
      };
      const allMachines = [parentBuildingMachine, childApartmentDevice];
      const allRegions = [
        { id: 'reg-building-a', name: 'Budynek A (ul. Morska)' },
        { id: 'reg-staircase-a1', name: 'Klatka A1', parentId: 'reg-building-a' },
      ];

      // 1) Dziedziczenie GPS po drzewie maszyn (machine.parentId)
      const gpsInheritedFromParentMachine = verifyOnSiteGps(
        { lat: 54.519, lng: 18.5306 },
        childApartmentDevice,
        allRegions,
        300,
        allMachines
      );
      expect(gpsInheritedFromParentMachine.status).toBe('on_site');
      expect(gpsInheritedFromParentMachine.isOnSite).toBe(true);

      // 2) Zamknięcie przeglądu w 0 sekund (completedAt === workStartedAt) + przecinek w RBG ("1,5") + wcześniejsze inProgressAt z Kroku 2
      const instantService = {
        id: 'srv-instant',
        triggerType: 'calendar',
        inProgressAt: '2026-10-25T07:00:00.000Z', // przydzielenie w biurze
        travelStartedAt: '2026-10-25T09:00:00.000Z', // wyjazd o 09:00
        workStartedAt: '2026-10-25T09:20:00.000Z', // przyjazd o 09:20 (20 min dojazdu)
        completedAt: '2026-10-25T09:20:00.000Z', // 0 minut pracy!
        manHours: '1,5',
      };
      const instantMetrics = calculateWorkAndTravelMetrics(
        instantService,
        childApartmentDevice,
        allRegions,
        allMachines
      );
      expect(instantMetrics.travelDurationMinutes).toBe(20);
      expect(instantMetrics.stopwatchWorkMinutes).toBe(0);
      expect(instantMetrics.declaredManHours).toBe(1.5);
      expect(instantMetrics.isSuspiciouslyShort).toBe(true);

      // 3) Zlecenie bez uruchomionego stopera (workStartedAt: null, manHours: 4.0) NIE generuje fałszywego alarmu +4.0 h nadwyżki w tabeli
      const taskWithoutStopwatch = {
        id: 't-no-stopwatch',
        topic: 'Wymiana zaworu w Klatce A1',
        machineId: 'm-child-flat-12',
        regionId: 'reg-staircase-a1',
        assignedTo: 'Marek Konserwator',
        status: 5,
        closedAt: '2026-10-25T14:00:00.000Z',
        manHours: 4.0,
      };

      const { unmount } = render(
        <TechnicianPerformancePanel
          tickets={[taskWithoutStopwatch]}
          plannedServices={[]}
          machines={allMachines}
          regions={allRegions}
          services={[{ id: 's-marek', name: 'Marek Konserwator' }]}
        />
      );

      const summaryTable = screen.getByTestId('tech-performance-summary-table');
      expect(summaryTable.textContent).toContain('Marek Konserwator');
      expect(summaryTable.textContent).toContain('4 h');
      expect(summaryTable.textContent).not.toContain('+4 h');

      // Filtr budynku nadrzędnego ('reg-building-a') uwzględnia zlecenia z podrejonu ('reg-staircase-a1')
      const regionSelect = screen.getByTestId('tech-perf-region-select');
      fireEvent.change(regionSelect, { target: { value: 'reg-building-a' } });
      expect(screen.getByTestId('tech-performance-summary-table').textContent).toContain(
        'Marek Konserwator'
      );

      unmount();
    });

    it('otwiera i zamyka modal Polityki Prywatności, RODO i EU AI Act na ekranie startowym (Login.jsx)', () => {
      const { unmount } = render(
        <MemoryRouter>
          <Login onLogin={vi.fn()} currentUser={null} />
        </MemoryRouter>
      );

      const openBtn = screen.getByTestId('privacy-policy-open-btn');
      expect(openBtn.textContent).toContain('Polityka Prywatności, RODO i AI');
      expect(screen.queryByTestId('privacy-policy-modal')).toBeNull();

      // Otwarcie modala
      fireEvent.click(openBtn);
      const modal = screen.getByTestId('privacy-policy-modal');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain(
        'Polityka Prywatności, Ochrona Danych (RODO) i Informacja o AI'
      );
      expect(modal.textContent).toContain('Punktowa weryfikacja lokalizacji GPS');
      expect(modal.textContent).toContain('EU AI Act — Art. 50');

      // Zamknięcie modala przyciskiem X
      fireEvent.click(screen.getByTestId('privacy-policy-close-btn'));
      expect(screen.queryByTestId('privacy-policy-modal')).toBeNull();

      unmount();
    });

    it('obsługuje oba rozwiązania Floty Samochodowej: profil VexoNT Fleet (industryProfile="fleet") oraz hybrydowy przełącznik Pojazd / Środek transportu w każdym profilu', () => {
      // 1) Sprawdzenie 4. profilu branżowego 'fleet' oraz modułu 'fleet' w SuperAdminTenantModal
      const formData = {
        id: 'trans-logist',
        name: 'Trans-Logist Sp. z o.o.',
        industryProfile: 'fleet',
        maxUsers: 25,
        maxMachines: 100,
        modules: {
          tickets: true,
          planned: true,
          parts: true,
          fleet: true,
          aiDtr: true,
          voiceDictation: true,
        },
        aiTier: 'standard',
      };
      const setFormData = vi.fn();

      const { unmount: unmountModal } = render(
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

      expect(screen.getByTestId('industry-profile-option-fleet')).toBeTruthy();
      expect(screen.getByTestId('superadmin-module-fleet-checkbox').checked).toBe(true);
      unmountModal();

      // 2) Hybrydowy przełącznik w MachineForm dla firmy np. HVAC (bus serwisowy jako Pojazd)
      useManagerStore.getState().setBranding({
        companyName: 'Klima-Serwis Mobilny',
        industryProfile: 'hvac',
      });

      const { unmount: unmountForm } = render(
        <MachineForm
          isOpen={true}
          onClose={vi.fn()}
          editingMachine={null}
          initialParentId=""
          regions={[{ id: 'r-baza', name: 'Baza Serwisowa Gdynia' }]}
          onSaved={vi.fn()}
          onError={vi.fn()}
        />
      );

      // Domyślnie w profilu HVAC wybrany jest zasób typu 'device'
      expect(screen.queryByTestId('machine-form-fleet-section')).toBeNull();
      expect(screen.getByTestId('machine-form-parent-field')).toBeTruthy();
      expect(screen.getByTestId('machine-form-region-select').textContent).toContain('Mapa Główna');

      // Kliknięcie przełącznika "Pojazd / Środek transportu — Flota (km / RBG)"
      fireEvent.click(screen.getByTestId('asset-category-vehicle-btn'));
      expect(screen.getByTestId('machine-form-fleet-section')).toBeTruthy();
      // Przy dodawaniu samochodu "Urządzenie nadrzędne (Opcjonalnie)" nie jest wymagane i jest ukryte
      expect(screen.queryByTestId('machine-form-parent-field')).toBeNull();
      // W bazie zamiast "Mapa Główna" widnieje "Cała Firma"
      expect(screen.getByTestId('machine-form-region-select').textContent).toContain('Cała Firma');
      expect(screen.getByTestId('fleet-license-plate-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-vin-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-first-registration-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-initial-counter-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-counter-unit-select').value).toBe('km');
      expect(screen.getByTestId('fleet-tech-inspection-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-insurance-expiry-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-production-year-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-engine-spec-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-tire-season-select')).toBeTruthy();
      expect(screen.getByTestId('fleet-tire-size-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-policy-number-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-assistance-phone-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-towbar-dmc-select')).toBeTruthy();
      expect(screen.getByTestId('fleet-udt-extinguisher-date-input')).toBeTruthy();
      expect(screen.getByTestId('fleet-ownership-fuelcard-input')).toBeTruthy();
      unmountForm();

      // 3) Karta pojazdu w MachineInfoCard, PlannedMaintenanceInfo i TicketMainColumnHeader + alerty SKP / OC / UDT + próg 1000 km
      const serviceVan = {
        id: 'van-1',
        name: 'Renault Master Bus Serwisowy #1',
        assetCategory: 'vehicle',
        counterUnit: 'km',
        currentWorkHours: 149200,
        licensePlate: 'GD 12345',
        vinNumber: 'VF1MA000087654321',
        firstRegistrationDate: '2022-05-18',
        productionYear: '2022',
        engineSpec: '2.3 dCi 150 KM (Euro 6)',
        tireSeason: 'Zimowe',
        tireSize: '225/65 R16C',
        policyNumber: 'PZU / 10293847',
        assistancePhone: '+48 22 566 55 44',
        hasTowbar: 'Hak holowniczy (DMC do 3.5t - kat. B)',
        ownershipType: 'Leasing PKO (limit 30 tys. km/rok) • Orlen #4412',
        udtOrExtinguisherDate: '2026-11-15', // za 21 dni względem 2026-10-25
        fuelType: 'Diesel (ON)',
        assignedDriver: 'Jan Serwisant',
        techInspectionDate: '2026-11-05', // za 11 dni względem 2026-10-25
        insuranceExpiryDate: '2026-10-10', // 15 dni po terminie względem 2026-10-25
        regionId: 'main_map',
      };

      expect(isVehicleAsset(serviceVan, 'hvac')).toBe(true);
      expect(getMachineCounterUnit(serviceVan, 'hvac')).toBe('km');

      const datesCheck = checkVehicleDatesStatus(serviceVan, 30, '2026-10-25T12:00:00Z');
      expect(datesCheck.techInspectionStatus).toBe('upcoming');
      expect(datesCheck.techInspectionDaysLeft).toBe(11);
      expect(datesCheck.insuranceStatus).toBe('overdue');
      expect(datesCheck.insuranceDaysLeft).toBe(-15);
      expect(datesCheck.udtExtinguisherStatus).toBe('upcoming');
      expect(datesCheck.udtExtinguisherDaysLeft).toBe(21);

      // Sprawdzenie progu 1000 km w checkServiceUrgency (zostało 800 km do 150 000 km -> isUpcoming = true!)
      const oilServicePlan = {
        id: 'srv-oil-1',
        name: 'Wymiana oleju i filtrów co 15 000 km',
        machineId: 'van-1',
        triggerType: 'hours',
        hoursInterval: 15000,
        targetWorkHours: 150000,
        status: 'pending',
      };
      const urgencyKm = checkServiceUrgency(oilServicePlan, serviceVan, 30);
      expect(urgencyKm.isUpcoming).toBe(true);
      expect(urgencyKm.isOverdue).toBe(false);
      expect(urgencyKm.message).toContain('zostało 800 km');

      const { unmount: unmountCards } = render(
        <>
          <MachineInfoCard
            machine={serviceVan}
            parentMachine={null}
            childMachines={[]}
            regions={[{ id: 'r-baza', name: 'Baza Gdynia' }]}
            regionName="Baza Gdynia"
            totalPartsCost={1250}
            setIsWorkHoursModalOpen={vi.fn()}
            onViewRelatedMachine={vi.fn()}
            onAddChildMachine={vi.fn()}
            parts={[]}
          />
          <PlannedMaintenanceInfo
            srv={oilServicePlan}
            machine={serviceVan}
            parts={[]}
            actualPartsUsed={[]}
            getMachineRegionName={() => 'Baza Gdynia'}
            regions={[{ id: 'r-baza', name: 'Baza Gdynia' }]}
          />
          <TicketMainColumnHeader
            currentTicket={{
              id: 't-van-1',
              topic: 'Świeci kontrolka klocków hamulcowych',
              machineId: 'van-1',
              machineName: serviceVan.name,
              status: 2,
            }}
            STATUSES={{ 2: { label: 'W realizacji', color: 'bg-blue-100' } }}
            machines={[serviceVan]}
            regions={[{ id: 'r-baza', name: 'Baza Gdynia' }]}
          />
        </>
      );

      expect(screen.getByTestId('machine-license-plate-badge').textContent).toBe('GD 12345');
      expect(screen.getByTestId('machine-counter-value').textContent).toContain('149200 km');
      expect(screen.getByTestId('machine-fleet-card').textContent).toContain('VF1MA000087654321');
      expect(screen.getByTestId('machine-fleet-first-reg').textContent).toBe('2022-05-18');
      expect(screen.getByTestId('machine-fleet-engine').textContent).toContain('2.3 dCi 150 KM');
      expect(screen.getByTestId('machine-fleet-tires').textContent).toContain('Zimowe • 225/65 R16C');
      expect(screen.getByTestId('machine-fleet-policy').textContent).toContain('PZU / 10293847');
      expect(screen.getByTestId('machine-fleet-assistance-call-btn').textContent).toContain(
        '+48 22 566 55 44'
      );
      expect(screen.getByTestId('machine-fleet-udt-status').textContent).toContain('2026-11-15');
      expect(screen.getByTestId('service-domain-fleet').textContent).toContain('GD 12345');
      expect(screen.getByTestId('ticket-domain-fleet').textContent).toContain('GD 12345');

      unmountCards();
    });

    it('odnajduje pojazd po numerze tablicy rejestracyjnej (dokładnie, bez spacji/myślników, po VIN oraz z korektą OCR ANPR) w QRScannerModal i OperatorScanner', async () => {
      const fleetMachines = [
        {
          id: 'veh-master',
          name: 'Renault Master Bus Serwisowy #1',
          assetCategory: 'vehicle',
          licensePlate: 'GD 12345',
          vinNumber: 'VF1MA000087654321',
          qrCode: 'QR-MASTER-01',
        },
        {
          id: 'veh-transit',
          name: 'Ford Transit Pogotowie Techniczne',
          assetCategory: 'vehicle',
          licensePlate: 'WE 9876A',
          vinNumber: 'WF0XXXTTGX1234567',
          qrCode: 'QR-TRANSIT-02',
        },
      ];

      // 1) Normalizacja tablic rejestracyjnych
      expect(normalizeLicensePlate('gd 12-345')).toBe('GD12345');
      expect(normalizeLicensePlate('PL GD 12345')).toBe('GD12345');

      // 2) Dopasowanie po tablicy (z odstępem, bez odstępu, z małych liter), VIN, QR oraz z korektą OCR (S <-> 5, O <-> 0)
      expect(findMachineByIdentifierOrPlate(fleetMachines, 'GD 12345')?.id).toBe('veh-master');
      expect(findMachineByIdentifierOrPlate(fleetMachines, 'gd12345')?.id).toBe('veh-master');
      expect(findMachineByIdentifierOrPlate(fleetMachines, 'GD-1234S')?.id).toBe('veh-master'); // S zamiast 5 z OCR!
      expect(findMachineByIdentifierOrPlate(fleetMachines, 'VF1MA000087654321')?.id).toBe(
        'veh-master'
      );
      expect(findMachineByIdentifierOrPlate(fleetMachines, 'QR-TRANSIT-02')?.id).toBe(
        'veh-transit'
      );

      // 3) Ekstrakcja tablicy z tekstu OCR (z tablicą z bazy oraz ogólny wzorzec tablicy)
      const ocrKnown = extractLicensePlateFromOcrText('RENAULT MASTER PL GD 12345', fleetMachines);
      expect(ocrKnown.matchedMachine?.id).toBe('veh-master');
      expect(ocrKnown.plate).toBe('GD 12345');

      const ocrGeneric = extractLicensePlateFromOcrText('AUTO SERWIS KR 4567C', fleetMachines);
      expect(ocrGeneric.plate).toBe('KR 4567C');
      expect(ocrGeneric.matchedMachine).toBeNull();

      // 4) Rozpoznanie z ramki wideo przy użyciu detektora ANPR
      const fakeVideoEl = { videoWidth: 1280, videoHeight: 720 };
      const fakeDetector = {
        detect: vi.fn().mockResolvedValue([{ rawValue: 'PL WE 9876A' }]),
      };
      const frameResult = await recognizeLicensePlateFromVideoFrame(
        fakeVideoEl,
        fleetMachines,
        fakeDetector
      );
      expect(frameResult.matchedMachine?.id).toBe('veh-transit');
      expect(frameResult.plate).toBe('WE 9876A');

      // 5) Interakcja w QRScannerModal (rozwijana sekcja ręczna + wyszukanie po tablicy)
      useManagerStore.getState().setMachines(fleetMachines);
      const onModalScan = vi.fn();
      const onModalClose = vi.fn();

      const { unmount: unmountQrModal } = render(
        <QRScannerModal
          isOpen={true}
          onClose={onModalClose}
          onScanSuccess={onModalScan}
          title="Skanuj QR lub tablicę"
        />
      );

      expect(screen.getByTestId('scanner-auto-anpr-badge')).toBeTruthy();
      expect(screen.getByTestId('scanner-license-plate-section')).toBeTruthy();
      expect(screen.queryByTestId('scanner-plate-input')).toBeNull(); // Domyślnie zwinięte!
      fireEvent.click(screen.getByTestId('scanner-manual-toggle-btn')); // Rozwinięcie opcji wpisz ręcznie
      const plateInput = screen.getByTestId('scanner-plate-input');
      fireEvent.change(plateInput, { target: { value: 'gd12345' } });
      fireEvent.click(screen.getByTestId('scanner-plate-submit-btn'));

      expect(onModalScan).toHaveBeenCalledWith('veh-master', 'GD 12345');
      unmountQrModal();

      // 6a) Interakcja w OperatorScanner BEZ logowania (isInternal=false) -> brak zgłaszania bez QR/NFC i brak ręcznego wpisywania (bo QR/NFC wskazują tenanta)
      const onOperatorScan = vi.fn();
      const { unmount: unmountUnloggedScanner } = render(
        <OperatorScanner onScanSuccess={onOperatorScan} machines={fleetMachines} isInternal={false} />
      );
      expect(screen.queryByTestId('operator-report-without-qr-btn')).toBeNull();
      expect(screen.queryByTestId('operator-license-plate-section')).toBeNull();
      unmountUnloggedScanner();

      // 6b) Interakcja w OperatorScanner PO zalogowaniu (isInternal=true) -> dostępne zgłaszanie bez QR/NFC oraz rozwijana sekcja ręczna
      const { unmount: unmountOpScanner } = render(
        <OperatorScanner onScanSuccess={onOperatorScan} machines={fleetMachines} isInternal={true} />
      );

      expect(screen.getByTestId('operator-report-without-qr-btn')).toBeTruthy();
      expect(screen.getByTestId('operator-license-plate-section')).toBeTruthy();
      expect(screen.queryByTestId('operator-plate-input')).toBeNull(); // Domyślnie zwinięte!
      fireEvent.click(screen.getByTestId('operator-manual-toggle-btn'));
      fireEvent.click(screen.getByTestId('operator-plate-suggestion-veh-transit'));
      expect(onOperatorScan).toHaveBeenCalledWith('veh-transit', 'WE 9876A');

      fireEvent.click(screen.getByTestId('operator-report-without-qr-btn'));
      expect(onOperatorScan).toHaveBeenCalledWith('manual', 'manual');

      unmountOpScanner();
    });

    it('obsługuje edytowalną listę czynników chłodniczych (dodawanie nowych, edycja GWP, usuwanie) oraz niezależną zakładkę Klimatyzacja / HVAC w MachineForm', () => {
      // 1) Dodanie nowego czynnika R452B (GWP 698) i przeliczenie CO2e
      const updatedTypes = saveCustomRefrigerant({
        code: 'R452B',
        name: 'R452B (Opteon XL55)',
        gwp: 698,
        isFluorinated: true,
      });
      expect(updatedTypes.R452B).toBeTruthy();
      expect(updatedTypes.R452B.gwp).toBe(698);

      const calc = calculateCo2Equivalent('R452B', 10);
      expect(calc.co2EquivalentTons).toBe(6.98);
      expect(calc.requiresCroCard).toBe(true);

      // 2) Niezależna zakładka HVAC w MachineForm nawet w profilu 'industrial'
      useManagerStore.getState().setBranding({
        companyName: 'Zakład Przemysłowy',
        industryProfile: 'industrial',
      });

      const { unmount } = render(
        <MachineForm
          isOpen={true}
          onClose={vi.fn()}
          editingMachine={null}
          initialParentId=""
          regions={[{ id: 'r1', name: 'Hala A' }]}
          onSaved={vi.fn()}
          onError={vi.fn()}
        />
      );

      // Kliknięcie zakładki "Klimatyzacja / HVAC (F-Gazy / CRO)"
      fireEvent.click(screen.getByTestId('asset-category-hvac-btn'));
      expect(screen.getByTestId('machine-form-fgas-section')).toBeTruthy();

      // Otwarcie edytora czynników chłodniczych w formularzu
      fireEvent.click(screen.getByTestId('toggle-refrigerant-manager-btn'));
      expect(screen.getByTestId('refrigerant-manager-panel')).toBeTruthy();

      fireEvent.change(screen.getByTestId('custom-refrigerant-code-input'), {
        target: { value: 'R513A' },
      });
      fireEvent.change(screen.getByTestId('custom-refrigerant-name-input'), {
        target: { value: 'R513A (Opteon XP10)' },
      });
      fireEvent.change(screen.getByTestId('custom-refrigerant-gwp-input'), {
        target: { value: '631' },
      });
      fireEvent.click(screen.getByTestId('save-custom-refrigerant-btn'));

      expect(getAllRefrigerantTypes().R513A?.gwp).toBe(631);
      expect(screen.getByTestId('machine-form-refrigerant-select').value).toBe('R513A');

      // Usunięcie dodanego czynnika
      deleteCustomRefrigerant('R452B');
      deleteCustomRefrigerant('R513A');
      unmount();
    });
  });
});
