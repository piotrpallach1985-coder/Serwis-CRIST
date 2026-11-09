import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  getDtrDocCategoriesForMachine,
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
  hydrateCustomRefrigerants,
  saveCustomRefrigerant,
  deleteCustomRefrigerant,
  isHvacAsset,
  generateRandomReportPin,
  resolveRegionReportPin,
  resolveAnonymousReportPin,
  verifyAnonymousReportPin,
} from '../fieldServiceHelpers';
import { checkServiceUrgency } from '../logicHelpers';
import fs from 'fs';
import path from 'path';
import SignaturePad from '../../components/shared/SignaturePad';
import QRScannerModal from '../../components/shared/QRScannerModal';
import OperatorScanner from '../../components/operator/OperatorScanner';
import OperatorForm from '../../components/OperatorForm';
import Regions from '../../components/manager/Regions';
import MachineInfoCard from '../../components/manager/machines/MachineInfoCard';
import MachineQRCard from '../../components/manager/machines/MachineQRCard';
import MachinesQRCodes from '../../components/manager/machines/MachinesQRCodes';
import Machines from '../../components/manager/Machines';
import MachineForm from '../../components/manager/MachineForm';
import BulkImportModal from '../../components/manager/BulkImportModal';
import PartForm from '../../components/manager/parts/PartForm';
import SidebarNavUR from '../../components/manager/sidebar/SidebarNavUR';
import MachineDTR from '../../components/manager/MachineDTR';
import {
  isMachineIncompleteForQr,
  autoDetectColumnMapping,
  prepareMachinesImportPreview,
  preparePartsImportPreview,
  getImportLegendRows,
  getMachineParentHierarchyInfo,
} from '../bulkImportHelper';
import PlannedMaintenanceFormModal from '../../components/manager/PlannedMaintenanceFormModal';
import SuperAdminTenantModal from '../../components/manager/superadmin/SuperAdminTenantModal';
import SuperAdminTenantTable from '../../components/manager/superadmin/SuperAdminTenantTable';
import { FALLBACK_LOGO_BASE64 } from '../reports/logoBase64';
import TicketMainColumnHeader from '../../components/manager/tickets/TicketMainColumnHeader';
import MapPin from '../../components/manager/map/MapPin';
import TicketMainColumnStepper from '../../components/manager/tickets/TicketMainColumnStepper';
import PlannedMaintenanceInfo from '../../components/manager/PlannedMaintenanceInfo';
import TechnicianPerformancePanel from '../../components/manager/reports/TechnicianPerformancePanel';
import MachineCard from '../../components/manager/MachineCard';
import InAppTicketScanner from '../../components/manager/InAppTicketScanner';
import Login from '../../components/Login';
import { MemoryRouter } from 'react-router-dom';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../tenantHelper';
import { formatDetails } from '../../services/audit.service';
import { isQrUnprintedNew } from '../../services/qrAccess.service';
import plTranslations from '../../locales/pl/translation.json';
import enTranslations from '../../locales/en/translation.json';

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

      // 4) Zwykły serwis prewencyjny na obiekcie bez kategorii c-KOB w profilu facility NIE uruchamia fałszywego alarmu 7 dni c-KOB
      const resNonCkob = checkCkob7DaysDeadline(
        { id: 's4', status: 'completed', category: 'preventive', completedAt: completed9DaysAgo, ckobEntered: false },
        { id: 'm-gate', name: 'Szlaban wjazdowy', inspectionCategory: '' },
        'facility',
        nowMs
      );
      expect(resNonCkob.requiresCkobEntry).toBe(false);
      expect(resNonCkob.isOverdue7Days).toBe(false);
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

    it('obsługuje kategorie dokumentacji zależnie od typu urządzenia/profilu (DTR / Pojazd / Budowlanka + Inne/Pozostałe) w MachineDTR', () => {
      expect(getDtrDocCategoryInfo('PROTOKOL_KONTROLI').shortLabel).toContain('Protokół c-KOB');
      expect(getDtrDocCategoryInfo('DECYZJA_PINB').shortLabel).toContain('Decyzja PINB/UDT');
      expect(getDtrDocCategoryInfo('INNE').shortLabel).toContain('Inne / Pozostałe');

      // 1) Urządzenie przemysłowe -> tylko DTR oraz Inne / Pozostałe
      const indCats = getDtrDocCategoriesForMachine({ id: 'm1', assetCategory: 'device' }, 'industrial');
      expect(indCats.map(c => c.id)).toEqual(['DTR', 'INNE']);

      // 2) Pojazd -> dokumenty flotowe (Dowód, Polisa, SKP/UDT) oraz Inne / Pozostałe
      const vehCats = getDtrDocCategoriesForMachine(
        { id: 'v1', assetCategory: 'vehicle', licensePlate: 'GD 12345' },
        'industrial'
      );
      expect(vehCats.map(c => c.id)).toEqual([
        'DOWOD_POLISA_FLOTA',
        'POLISA_FLOTA',
        'BADANIE_SKP_UDT',
        'INNE',
      ]);

      // 3) Budowlanka (facility) -> dokumenty c-KOB / budowlane + DTR + Inne / Pozostałe
      const facCats = getDtrDocCategoriesForMachine({ id: 'b1', assetCategory: 'device' }, 'facility');
      expect(facCats.map(c => c.id)).toContain('PROTOKOL_KONTROLI');
      expect(facCats.map(c => c.id)).toContain('INNE');
      expect(facCats.map(c => c.id)).not.toContain('DOWOD_POLISA_FLOTA');

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
      expect(screen.getByTestId('ticket-work-gps-verification-box').textContent).toContain('2.5 h');
      expect(screen.queryByTestId('ticket-gps-geofence-badge')).toBeNull();

      expect(screen.getByTestId('service-work-gps-verification-box')).toBeTruthy();
      expect(screen.getByTestId('service-work-gps-verification-box').textContent).toContain('1 h');
      expect(screen.queryByTestId('service-gps-geofence-badge')).toBeNull();

      const summaryTable = screen.getByTestId('tech-performance-summary-table');
      expect(summaryTable.textContent).toContain('Jan Serwisant');
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

      // Domyślnie w profilu HVAC wybrany jest zasób typu 'device' — bez dolnej sekcji HVAC i bez sekcji Floty
      expect(screen.queryByTestId('machine-form-fleet-section')).toBeNull();
      expect(screen.queryByTestId('machine-form-fgas-section')).toBeNull();
      expect(screen.queryByTestId('machine-form-domain-section')).toBeNull();
      expect(screen.getByTestId('machine-form-parent-field')).toBeTruthy();
      expect(screen.getByTestId('machine-form-region-select').textContent).toContain('Mapa Główna');

      // Kliknięcie przełącznika "Pojazd / Flota (km / RBG)" — brak dolnej sekcji HVAC
      fireEvent.click(screen.getByTestId('asset-category-vehicle-btn'));
      expect(screen.getByTestId('machine-form-fleet-section')).toBeTruthy();
      expect(screen.queryByTestId('machine-form-fgas-section')).toBeNull();
      expect(screen.queryByTestId('machine-form-domain-section')).toBeNull();
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
      expect(screen.getByTestId('service-domain-fleet').textContent).toContain('149200 km');
      expect(screen.getByTestId('ticket-domain-fleet').textContent).toContain('GD 12345');
      expect(screen.getByTestId('ticket-domain-fleet').textContent).toContain('149200 km');
      // Pojazd nie może dublować karty przemysłowej (RBG) ani pokazywać jednocześnie RBG i km
      expect(screen.queryByTestId('ticket-domain-industrial')).toBeNull();
      expect(screen.queryByTestId('service-domain-industrial')).toBeNull();

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

      const ocrGeneric = extractLicensePlateFromOcrText('AUTO SERWIS PL KR 4567C', fleetMachines);
      expect(ocrGeneric.plate).toBe('KR 4567C');
      expect(ocrGeneric.matchedMachine).toBeNull();

      const ocrMerged = extractLicensePlateFromOcrText('PLGDA54321', []);
      expect(ocrMerged.plate).toBe('GDA 54321');

      // 3b) Obsługa polskiej nalepki legalizacyjnej pomiędzy wyróżnikiem a numerem (np. GD [nalepka] 3V975 + napisy z ramki PLICHTA TIGUAN)
      const tiguanList = [
        ...fleetMachines,
        { id: 'veh-tiguan', name: 'VW Tiguan', assetCategory: 'vehicle', licensePlate: 'GD 3V975' },
      ];
      const ocrStickerMerged = extractLicensePlateFromOcrText(
        'PL GD13V975 PLICHTA TIGUAN 4MOTION',
        tiguanList
      );
      expect(ocrStickerMerged.matchedMachine?.id).toBe('veh-tiguan');
      expect(ocrStickerMerged.plate).toBe('GD 3V975');

      const ocrStickerSplit = extractLicensePlateFromOcrText('PL GD I 3V975 PLICHTA', []);
      expect(ocrStickerSplit.plate).toBe('GD 3V975');

      const ocrNoise = extractLicensePlateFromOcrText(
        'EE\nJ - 7 4\n\n1 1 RL L\nJT 1\n\n4 1 3 IA SESE',
        tiguanList
      );
      expect(ocrNoise.plate).toBe('');
      expect(ocrNoise.matchedMachine).toBeNull();

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

      // 6a) Interakcja w OperatorScanner BEZ logowania (isInternal=false) -> brak zgłaszania bez QR/NFC i brak skanowania tablic, ale widoczna informacja o możliwości zgłoszenia innego urządzenia po zeskanowaniu QR/NFC w rejonie
      const onOperatorScan = vi.fn();
      const { unmount: unmountUnloggedScanner } = render(
        <OperatorScanner onScanSuccess={onOperatorScan} machines={fleetMachines} isInternal={false} />
      );
      expect(screen.getByText('Skanuj QR')).toBeTruthy();
      expect(screen.queryByText('Skanuj QR/Tablicę')).toBeNull();
      expect(screen.getByText('Zbliżeniowe NFC')).toBeTruthy();
      expect(
        screen.getByText(
          'Zeskanuj dowolny kod QR lub NFC w swoim rejonie, i zgłoś awarię dowolnego urządzenia z firmy.'
        )
      ).toBeTruthy();
      expect(screen.queryByTestId('operator-report-without-qr-btn')).toBeNull();
      expect(screen.queryByTestId('operator-license-plate-section')).toBeNull();
      unmountUnloggedScanner();

      // 6b) Interakcja w OperatorScanner PO zalogowaniu (isInternal=true) -> dostępne Skanuj QR/Tablicę, zgłaszanie bez QR/NFC oraz rozwijana sekcja ręczna
      const { unmount: unmountOpScanner } = render(
        <OperatorScanner onScanSuccess={onOperatorScan} machines={fleetMachines} isInternal={true} />
      );

      expect(screen.getByText('Skanuj QR/Tablicę')).toBeTruthy();
      expect(screen.getByText('Zbliżeniowe NFC')).toBeTruthy();
      expect(
        screen.getByText(
          'Zgłoś awarię dowolnego urządzenia z firmy, jeśli nie ma widocznego QR/NFC'
        )
      ).toBeTruthy();
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

    it('obsługuje nazwy w menu bocznym dla HVAC (Awarie, Serwisy), etykietę Miejsce/rejon montażu oraz brak wbudowanego edytora czynników w MachineForm', () => {
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

      // 2) W menu bocznym (SidebarNavUR) dla firmy HVAC nazwy sekcji to "Awarie" i "Serwisy" (bez dopisku UR)
      const { unmount: unmountSidebarHvac } = render(
        <SidebarNavUR
          activeTab="tickets"
          handleItemClick={vi.fn()}
          branding={{ industryProfile: 'hvac' }}
        />
      );
      expect(screen.getByTestId('sidebar-section-tickets').textContent).toBe('Awarie');
      expect(screen.getByTestId('sidebar-section-services').textContent).toBe('Serwisy');
      unmountSidebarHvac();

      // 2b) W menu bocznym i widokach dla firmy Osiedla (facility): Awarie, Serwisy, Baza Obiektów/Urządzeń, Baza QR Obiektów/Urządzeń, Rejony/Adresy, Dodaj Obiekt/Urządzenie, Obiektów/Urządzenia oraz brak zakładki HVAC
      useManagerStore.getState().setBranding({
        companyName: 'Wspólnota Słoneczna',
        industryProfile: 'facility',
      });
      const { unmount: unmountSidebarFacility } = render(
        <SidebarNavUR
          activeTab="tickets"
          handleItemClick={vi.fn()}
          branding={{ industryProfile: 'facility' }}
        />
      );
      expect(screen.getByTestId('sidebar-section-tickets').textContent).toBe('Awarie');
      expect(screen.getByTestId('sidebar-section-services').textContent).toBe('Serwisy');
      expect(screen.getByTestId('sidebar-machines-menu').textContent).toBe(
        'Baza Obiektów/Urządzeń'
      );
      expect(screen.getByTestId('sidebar-machines-qr-menu').textContent).toBe(
        'Baza QR Obiektów/Urządzeń'
      );
      expect(screen.getByTestId('sidebar-regions-menu').textContent).toBe('Rejony/Adresy');
      unmountSidebarFacility();

      const { unmount: unmountFacilityForm } = render(
        <MachineForm
          isOpen={true}
          onClose={vi.fn()}
          editingMachine={null}
          initialParentId=""
          regions={[{ id: 'r1', name: 'ul. Słoneczna 12' }]}
          onSaved={vi.fn()}
          onError={vi.fn()}
        />
      );
      expect(screen.queryByTestId('asset-category-hvac-btn')).toBeNull();
      expect(screen.getByTestId('asset-category-device-btn').textContent).toBe('Obiekt/Urządzenie');
      unmountFacilityForm();

      const { unmount: unmountFacilityMachines } = render(
        <MemoryRouter>
          <Machines onOpenMachinesQR={vi.fn()} />
        </MemoryRouter>
      );
      expect(screen.getByTestId('machines-header-title').textContent).toContain(
        'Baza Obiektów/Urządzeń'
      );
      expect(screen.getByTestId('machines-add-btn').textContent).toContain(
        'Dodaj Obiekt/Urządzenie'
      );
      expect(screen.getByTestId('machines-tab-device').textContent).toContain(
        'Obiekty/Urządzenia'
      );
      expect(screen.queryByTestId('machines-tab-hvac')).toBeNull();
      expect(screen.getByTestId('open-machines-qr-btn').textContent).toContain(
        'Baza QR Obiektów/Urządzeń'
      );
      unmountFacilityMachines();

      const { unmount: unmountFacilityQr } = render(<MachinesQRCodes onBack={vi.fn()} />);
      expect(screen.getByTestId('machines-qr-title').textContent).toBe(
        'Baza QR Obiektów/Urządzeń'
      );
      unmountFacilityQr();

      const { unmount: unmountFacilityRegions } = render(<Regions />);
      expect(screen.getByTestId('regions-header-title').textContent).toBe('Rejony/Adresy');
      unmountFacilityRegions();

      // 3) W profilu 'industrial' (Przemysł) zakres HVAC nie jest widoczny, a przyciski nie zawierają napisu RBG
      useManagerStore.getState().setBranding({
        companyName: 'Zakład Przemysłowy',
        industryProfile: 'industrial',
      });

      const { unmount: unmountInd } = render(
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
      expect(screen.queryByTestId('asset-category-hvac-btn')).toBeNull();
      expect(screen.getByTestId('asset-category-device-btn').textContent).toBe(
        'Urządzenie / Instalacja'
      );
      expect(screen.getByTestId('asset-category-vehicle-btn').textContent).toBe('Pojazd / Flota');
      // Dla firmy przemysłowej (industrial) wymogi PIN w Dodaj Urządzenie są usunięte
      expect(screen.queryByTestId('machine-report-pin-section')).toBeNull();
      unmountInd();

      const { unmount: unmountIndRegions } = render(<Regions />);
      expect(screen.queryByTestId('region-pin-cell-main_map')).toBeNull();
      unmountIndRegions();

      // 4) W profilu 'hvac' w zakładce Klimatyzacja / HVAC etykieta to "Miejsce/rejon montażu *", a lista edycji czynników jest usunięta z okna dodawania urządzenia
      useManagerStore.getState().setBranding({
        companyName: 'Klima-Serwis',
        industryProfile: 'hvac',
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
      expect(screen.getByTestId('machine-form-region-label').textContent).toBe(
        'Miejsce/rejon montażu *'
      );
      // Zakres "Edytowalna lista czynników chłodniczych" usunięty z okienka dodawania urządzenia (zarządzany w osobnej liście)
      expect(screen.queryByTestId('refrigerant-manager-panel')).toBeNull();
      expect(screen.queryByTestId('toggle-refrigerant-manager-btn')).toBeNull();

      // Wybór czynnika z listy rozwijanej nadal działa (w tym czynnika R452B dodanego w osobnej liście)
      fireEvent.change(screen.getByTestId('machine-form-refrigerant-select'), {
        target: { value: 'R452B' },
      });
      expect(screen.getByTestId('machine-form-refrigerant-select').value).toBe('R452B');

      deleteCustomRefrigerant('R452B');
      unmount();
    });

    it('obsługuje PIN autoryzacji dla zgłoszeń anonimowych (globalny PIN rejonu oraz indywidualny PIN urządzenia, przy całkowitym usunięciu PIN-u dla samochodów)', () => {
      const randPin = generateRandomReportPin(4);
      expect(randPin).toMatch(/^[1-9]\d{3}$/);

      const testRegions = [
        { id: 'reg-building-a', name: 'Budynek A (Wspólnota)', reportPin: '4821' },
        { id: 'reg-floor-2', name: 'Piętro 2', parentId: 'reg-building-a', reportPin: '' },
        { id: 'reg-open', name: 'Teren Zewnętrzny', reportPin: '' },
      ];

      // 1) Dziedziczenie PIN-u dla lokalizacji (bezpośredni, z rejonu nadrzędnego, z Mapy Głównej)
      const directRegPin = resolveRegionReportPin('reg-building-a', testRegions, {}, {});
      expect(directRegPin.pin).toBe('4821');
      expect(directRegPin.isInherited).toBe(false);

      const inheritedRegPin = resolveRegionReportPin('reg-floor-2', testRegions, {}, {});
      expect(inheritedRegPin.pin).toBe('4821');
      expect(inheritedRegPin.isInherited).toBe(true);
      expect(inheritedRegPin.sourceName).toBe('Budynek A (Wspólnota)');

      const openRegPin = resolveRegionReportPin('reg-open', testRegions, {}, {});
      expect(openRegPin.pin).toBe('');

      const mainFallbackPin = resolveRegionReportPin(
        'reg-open',
        testRegions,
        { reportPin: '9000' },
        {}
      );
      expect(mainFallbackPin.pin).toBe('9000');
      expect(mainFallbackPin.isInherited).toBe(true);

      // 2) Rozwiązywanie PIN-u dla urządzeń (globalny dla rejonu vs indywidualny dla konkretnego urządzenia) oraz brak PIN-u dla samochodów
      const elevatorInBuildingA = {
        id: 'm-elev-1',
        name: 'Winda Osobowa Klatka B',
        regionId: 'reg-floor-2',
        assetCategory: 'device',
      };
      const elevPinReq = resolveAnonymousReportPin(elevatorInBuildingA, testRegions, {}, {});
      expect(elevPinReq.required).toBe(true);
      expect(elevPinReq.pin).toBe('4821');
      expect(elevPinReq.source).toBe('parent_region');

      // Urządzenie z własnym indywidualnym PIN-em nadpisuje PIN rejonu
      const hvacUnitWithOwnPin = {
        id: 'm-hvac-1',
        name: 'Pompa Ciepła Daikin Altherma',
        regionId: 'reg-floor-2',
        assetCategory: 'hvac',
        reportPin: '7788',
      };
      const deviceIndivReq = resolveAnonymousReportPin(hvacUnitWithOwnPin, testRegions, {}, {});
      expect(deviceIndivReq.required).toBe(true);
      expect(deviceIndivReq.pin).toBe('7788');
      expect(deviceIndivReq.source).toBe('machine');

      // Samochody firmowe NIE mają PIN-u zgłoszeń anonimowych (ani indywidualnego, ani globalnego floty)
      const companyCar = {
        id: 'veh-1',
        name: 'Toyota Proace',
        licensePlate: 'GD 11111',
        assetCategory: 'vehicle',
        regionId: 'reg-building-a',
        reportPin: '9999',
      };
      const carPinReq = resolveAnonymousReportPin(
        companyCar,
        testRegions,
        { globalFleetPin: '5520' },
        {}
      );
      expect(carPinReq.required).toBe(false);
      expect(carPinReq.pin).toBe('');

      expect(verifyAnonymousReportPin('7788', '7788')).toBe(true);
      expect(verifyAnonymousReportPin('4821', '7788')).toBe(false);

      // 3) W MachineForm: zakładka Urządzenie oraz HVAC mają pole PIN-u dla konkretnego urządzenia, a zakładka Pojazd / Flota NIE ma pola PIN-u
      const { unmount: unmountMachinePinForm } = render(
        <MachineForm
          isOpen={true}
          onClose={vi.fn()}
          editingMachine={null}
          initialParentId=""
          regions={testRegions}
          onSaved={vi.fn()}
          onError={vi.fn()}
        />
      );
      // W zakładce Urządzenie / Instalacja ( lub HVAC ) pole PIN dla urządzenia jest widoczne
      expect(screen.getByTestId('machine-report-pin-section')).toBeTruthy();
      expect(screen.getByTestId('machine-report-pin-input')).toBeTruthy();
      // Po przełączeniu na Pojazd / Flota pole PIN znika całkowicie
      fireEvent.click(screen.getByTestId('asset-category-vehicle-btn'));
      expect(screen.queryByTestId('machine-report-pin-section')).toBeNull();
      expect(screen.queryByTestId('fleet-report-pin-input')).toBeNull();
      unmountMachinePinForm();

      // 4) OperatorForm: wymaga PIN-u dla urządzenia przez inne osoby niż serwisanci (isInternal=false), a NIE dla zalogowanych serwisantów (isInternal=true)
      useManagerStore.getState().setBranding({
        companyName: 'HVAC & Nieruchomości',
        industryProfile: 'hvac',
      });

      const { unmount: unmountAnonForm } = render(
        <OperatorForm
          machines={[hvacUnitWithOwnPin, elevatorInBuildingA]}
          selectedMachine={hvacUnitWithOwnPin}
          setSelectedMachine={vi.fn()}
          regions={testRegions}
          handleStepChange={vi.fn()}
          isOnline={true}
          topicsList={['Brak chłodzenia']}
          reportersList={[]}
          isInternal={false}
        />
      );
      expect(screen.getByTestId('operator-report-pin-section')).toBeTruthy();
      expect(screen.getByTestId('operator-report-pin-input')).toBeTruthy();
      unmountAnonForm();

      const { unmount: unmountInternalForm } = render(
        <OperatorForm
          machines={[hvacUnitWithOwnPin, elevatorInBuildingA]}
          selectedMachine={hvacUnitWithOwnPin}
          setSelectedMachine={vi.fn()}
          regions={testRegions}
          handleStepChange={vi.fn()}
          isOnline={true}
          topicsList={['Brak chłodzenia']}
          reportersList={[]}
          isInternal={true}
        />
      );
      expect(screen.queryByTestId('operator-report-pin-section')).toBeNull();
      unmountInternalForm();

      // 5) Zestawienie rejonów (Regions.jsx): wyświetla globalny PIN dla rejonów (dla HVAC / Osiedli), natomiast okienko Globalnego PIN-u Floty Samochodowej jest usunięte
      useManagerStore.setState({
        regions: testRegions,
        machines: [elevatorInBuildingA, hvacUnitWithOwnPin],
        branding: {
          companyName: 'HVAC & Nieruchomości',
          industryProfile: 'hvac',
          mainMapReportPin: '1010',
        },
      });

      const { unmount: unmountRegions } = render(<Regions />);
      expect(screen.queryByTestId('regions-global-fleet-pin-bar')).toBeNull();
      expect(screen.getByTestId('region-pin-badge-main_map').textContent).toContain('1010');
      expect(screen.getByTestId('region-pin-badge-reg-building-a').textContent).toContain('4821');
      expect(screen.getByTestId('region-pin-badge-reg-floor-2').textContent).toContain('4821');
      unmountRegions();

      // 6) Ochrona przed ominięciem PIN-u przy przełączeniu na "Inne Urządzenie" i zmianie rejonu na pusty
      function WrapperAnonForm() {
        const [mach, setMach] = React.useState(elevatorInBuildingA);
        return (
          <OperatorForm
            machines={[elevatorInBuildingA]}
            selectedMachine={mach}
            setSelectedMachine={setMach}
            regions={testRegions}
            handleStepChange={vi.fn()}
            isOnline={true}
            topicsList={['Drzwi nie domykają się']}
            reportersList={[]}
            isInternal={false}
          />
        );
      }
      const { unmount: unmountBypass } = render(<WrapperAnonForm />);
      expect(screen.getByTestId('operator-report-pin-section')).toBeTruthy();
      // Po kliknięciu "Inne Urządzenie" użytkownik wpisuje ręcznie jakie urządzenie i gdzie (BEZ listy urządzeń i BEZ listy rejonów)
      fireEvent.click(screen.getByText('Inne Urządzenie'));
      expect(screen.getByTestId('operator-form-machine-input')).toBeTruthy();
      expect(screen.getByTestId('operator-form-location-input')).toBeTruthy();
      expect(screen.queryByTestId('operator-form-machine-dropdown-toggle')).toBeNull();
      expect(screen.queryByTestId('operator-form-region-select')).toBeNull();
      fireEvent.change(screen.getByTestId('operator-form-machine-input'), {
        target: { value: 'Spawarka Kemppi' },
      });
      fireEvent.change(screen.getByTestId('operator-form-location-input'), {
        target: { value: 'Hala 2 przy bramie' },
      });
      // Nawet po przełączeniu na "Inne Urządzenie", sekcja PIN-u dla pierwotnego budynku A (4821) pozostaje wymagana, a podpowiedzi typu awarii są widoczne
      expect(screen.getByTestId('operator-report-pin-section')).toBeTruthy();
      expect(screen.getByText('Drzwi nie domykają się')).toBeTruthy();
      unmountBypass();

      // Natomiast ZALOGOWANY użytkownik (isInternal=true) przy zgłaszaniu bez QR ("manual") widzi listę podpowiedzi urządzeń oraz listę rejonów
      const { unmount: unmountInternalManual } = render(
        <OperatorForm
          machines={[elevatorInBuildingA]}
          selectedMachine={{ id: 'manual', name: '', regionId: '' }}
          setSelectedMachine={vi.fn()}
          regions={testRegions}
          handleStepChange={vi.fn()}
          isOnline={true}
          topicsList={['Drzwi nie domykają się']}
          reportersList={[]}
          isInternal={true}
        />
      );
      expect(screen.getByTestId('operator-form-machine-input')).toBeTruthy();
      expect(screen.getByTestId('operator-form-machine-dropdown-toggle')).toBeTruthy();
      expect(screen.getByTestId('operator-form-region-select')).toBeTruthy();
      expect(screen.queryByTestId('operator-form-location-input')).toBeNull();
      unmountInternalManual();

      // 7) Hydratacja czynników chłodniczych z Firestore (branding.customRefrigerants) oraz fallback assignedAt w metrykach
      const hydrated = hydrateCustomRefrigerants({
        R513A: { code: 'R513A', name: 'R513A (Opteon XP10)', gwp: 631, isFluorinated: true, isCustom: true },
      });
      expect(hydrated.R513A).toBeDefined();
      expect(hydrated.R513A.gwp).toBe(631);

      const srvWithoutManualStopwatch = {
        id: 'srv-no-stopwatch',
        status: 'completed',
        assignedAt: '2026-10-28T08:00:00.000Z',
        completedAt: '2026-10-28T09:30:00.000Z',
        manHours: 1.5,
      };
      const fallbackMetrics = calculateWorkAndTravelMetrics(srvWithoutManualStopwatch, null, [], []);
      expect(fallbackMetrics.stopwatchWorkMinutes).toBe(90);
      expect(fallbackMetrics.stopwatchWorkHours).toBe(1.5);
    });

    it('obsługuje Kreator Masowego Importu z Excela/CSV (Urządzenia + Części) i generuje kod QR wyłącznie dla kompletnych urządzeń (z rejonem i zweryfikowanych)', async () => {
      // 1) Walidacja reguły isMachineIncompleteForQr
      expect(
        isMachineIncompleteForQr({
          id: 'm1',
          name: 'Tokarka CNC',
          regionId: 'reg-hala-a',
          needsVerification: false,
        })
      ).toBe(false);
      // Brak rejonu -> niekompletne -> brak kodu QR
      expect(
        isMachineIncompleteForQr({
          id: 'm2',
          name: 'Tokarka CNC',
          regionId: '',
        })
      ).toBe(true);
      // Dopisek (DO WERYFIKACJI) -> niekompletne -> brak kodu QR
      expect(
        isMachineIncompleteForQr({
          id: 'm3',
          name: 'Suwnica 16T (DO WERYFIKACJI)',
          regionId: 'reg-hala-a',
        })
      ).toBe(true);

      // 2) Przygotowanie podglądu importu maszyn (1 kompletna z istniejącym rejonem, 1 podzespół podlegający pod UR-101 dziedziczący rejon z tego samego pliku, 1 z nowym rejonem, 1 bez rejonu -> DO WERYFIKACJI bez QR)
      const excelMachineRows = [
        {
          'Nazwa urządzenia *': 'Wycinarka laserowa Nukon',
          'Miejsce montażu (Rejon)': 'Hala Cięcia',
          'Numer wewnętrzny': 'UR-101',
          'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
          'Stan licznika': '1250',
        },
        {
          'Nazwa urządzenia *': 'Agregat chłodzący Chiller Nukon',
          'Miejsce montażu (Rejon)': '',
          'Numer wewnętrzny': 'UR-101-CH',
          'Urządzenie nadrzędne (Nazwa lub Nr wew.)': 'UR-101',
          'Stan licznika': '1250',
        },
        {
          'Nazwa urządzenia *': 'Prasa krawędziowa TrumaBend',
          'Miejsce montażu (Rejon)': 'Hala Nowa Spawalnia',
          'Numer wewnętrzny': 'UR-102',
          'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
          'Stan licznika': '400',
        },
        {
          'Nazwa urządzenia *': 'Wiertarka kolumnowa bez rejonu',
          'Miejsce montażu (Rejon)': '',
          'Numer wewnętrzny': 'UR-103',
          'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
          'Stan licznika': '0',
        },
      ];

      // Sprawdzenie legendy wymagalności kolumn dla obu plików (Maszyny i Części)
      const machinesLegend = getImportLegendRows('machines');
      const partsLegend = getImportLegendRows('parts');
      expect(
        machinesLegend.find(r => r.Wymagalność === 'WYMAGANE BEZWARUNKOWO')?.Kolumna
      ).toContain('Nazwa urządzenia');
      expect(
        machinesLegend.find(r => r.Wymagalność === 'WYMAGANE DO KODU QR')?.Kolumna
      ).toContain('Miejsce montażu');
      expect(
        partsLegend.filter(r => r.Wymagalność === 'WYMAGANE BEZWARUNKOWO').map(r => r.Kolumna)
      ).toEqual([
        'Nazwa części *',
        'Kod magazynowy / Indeks *',
        'Stan początkowy (Fizyczny) *',
      ]);

      const colMap = autoDetectColumnMapping(Object.keys(excelMachineRows[0]), 'machines');
      expect(colMap.name).toBe('Nazwa urządzenia *');
      expect(colMap.regionName).toBe('Miejsce montażu (Rejon)');
      expect(colMap.internalId).toBe('Numer wewnętrzny');
      expect(colMap.parentMachine).toBe('Urządzenie nadrzędne (Nazwa lub Nr wew.)');

      const preview = prepareMachinesImportPreview(excelMachineRows, colMap, {
        existingMachines: [],
        existingRegions: [{ id: 'reg-ciecie', name: 'Hala Cięcia', isDeleted: false }],
        duplicateStrategy: 'skip',
        industryProfile: 'industrial',
      });

      expect(preview.summary.readyWithQrCount).toBe(3);
      expect(preview.summary.subassembliesCount).toBe(1);
      expect(preview.summary.incompleteWithoutQrCount).toBe(1);
      expect(preview.summary.newRegions).toEqual(['Hala Nowa Spawalnia']);

      // Podzespół (wiersz 2) dziedziczy rejon Hala Cięcia z maszyny nadrzędnej UR-101 i jest gotowy do QR
      const subassemblyRow = preview.rows[1];
      expect(subassemblyRow.qrReady).toBe(true);
      expect(subassemblyRow.parentRowIndex).toBe(1);
      expect(subassemblyRow.parentDisplay).toContain('Wycinarka laserowa Nukon');
      expect(subassemblyRow.regionDisplay).toContain('Hala Cięcia');

      const incompleteRow = preview.rows[3];
      expect(incompleteRow.status).toBe('incomplete');
      expect(incompleteRow.qrReady).toBe(false);
      expect(incompleteRow.name).toBe('Wiertarka kolumnowa bez rejonu (DO WERYFIKACJI)');
      expect(incompleteRow.payload.needsVerification).toBe(true);

      // Sprawdzenie widoczności legendy w Kroku 1 kreatora
      const { unmount: unmountStep1Modal } = render(
        <BulkImportModal isOpen={true} onClose={vi.fn()} mode="machines" />
      );
      expect(screen.getByTestId('bulk-import-legend-section')).toBeTruthy();
      expect(screen.getByTestId('legend-row-name').textContent).toContain('WYMAGANE BEZWARUNKOWO');
      expect(screen.getByTestId('legend-row-parentMachine').textContent).toContain('OPCJONALNE');
      unmountStep1Modal();

      // 3) Wykonanie importu w BulkImportModal i sprawdzenie, że podzespół ma przypisane parentId do UR-101, a maszyna bez rejonu ma qrCreatedAt=null
      useManagerStore.setState({
        regions: [{ id: 'reg-ciecie', name: 'Hala Cięcia', isDeleted: false }],
        machines: [],
        parts: [],
      });

      const onImportDone = vi.fn();
      const { unmount: unmountImportModal } = render(
        <BulkImportModal
          isOpen={true}
          onClose={vi.fn()}
          mode="machines"
          initialRowsForTest={excelMachineRows}
          onImportSuccess={onImportDone}
        />
      );

      expect(screen.getByTestId('summary-ready-qr').textContent).toContain('3');
      expect(screen.getByTestId('summary-subassemblies').textContent).toContain('1');
      expect(screen.getByTestId('summary-incomplete-no-qr').textContent).toContain('1');
      expect(screen.getByTestId('incomplete-qr-warning-banner')).toBeTruthy();

      fireEvent.click(screen.getByTestId('execute-bulk-import-btn'));
      await screen.findByTestId('bulk-import-success-summary');
      expect(onImportDone).toHaveBeenCalledTimes(1);
      unmountImportModal();

      const importedMachines = useManagerStore.getState().machines;
      expect(importedMachines.length).toBe(4);

      const nukon = importedMachines.find(m => m.internalId === 'UR-101');
      const chillerSub = importedMachines.find(m => m.internalId === 'UR-101-CH');
      const wiertarkaUnverified = importedMachines.find(m => m.internalId === 'UR-103');

      expect(nukon.qrCreatedAt).toBeTruthy();
      expect(nukon.needsVerification).toBe(false);
      // Podzespół ma ustawione parentId wskazujące bezpośrednio na ID zaimportowanego Nukona oraz odziedziczony regionId
      expect(chillerSub.parentId).toBe(nukon.id);
      expect(chillerSub.regionId).toBe('reg-ciecie');
      expect(chillerSub.qrCreatedAt).toBeTruthy();
      expect(wiertarkaUnverified.qrCreatedAt).toBeNull();
      expect(wiertarkaUnverified.needsVerification).toBe(true);
      expect(wiertarkaUnverified.name).toContain('(DO WERYFIKACJI)');

      // W MachineQRCard maszyna bez rejonu / do weryfikacji NIE ma wygenerowanego kodu QR
      const { container: qrCardUnverified, unmount: unmountQrCard1 } = render(
        <MachineQRCard machine={wiertarkaUnverified} />
      );
      expect(qrCardUnverified.querySelector('svg[id^="qr-svg-"]')).toBeNull();
      unmountQrCard1();

      // W MachineQRCard maszyna kompletna MA wygenerowany kod QR
      const { container: qrCardVerified, unmount: unmountQrCard2 } = render(
        <MachineQRCard machine={nukon} />
      );
      expect(qrCardVerified.querySelector('svg[id^="qr-svg-"]')).toBeTruthy();
      unmountQrCard2();

      // W Baza QR Urządzeń (MachinesQRCodes) widoczne są tylko 3 kompletne maszyny, a o 1 niezweryfikowanej informuje baner
      const { unmount: unmountQrList } = render(<MachinesQRCodes onBack={vi.fn()} />);
      expect(screen.getByTestId('qr-unverified-machines-notice').textContent).toContain('1');
      expect(screen.queryByText(/Wiertarka kolumnowa bez rejonu/)).toBeNull();
      expect(screen.getByText('Wycinarka laserowa Nukon')).toBeTruthy();
      unmountQrList();

      // 4) Podgląd importu części magazynowych z partią FIFO i powiązaniem z maszyną po numerze wewnętrznym UR-101
      const partRows = [
        {
          'Nazwa części *': 'Soczewka ochronna lasera',
          'Kod magazynowy *': 'SOCZ-NUK-01',
          'Stan początkowy': '8',
          'Jednostka miary': 'szt.',
          'Stan minimalny': '2',
          'Cena jedn. netto (PLN)': '190',
          'Kompatybilne urządzenia': 'UR-101',
        },
      ];
      const partColMap = autoDetectColumnMapping(Object.keys(partRows[0]), 'parts');
      const partPreview = preparePartsImportPreview(partRows, partColMap, {
        existingParts: [],
        existingMachines: importedMachines,
        duplicateStrategy: 'skip',
      });
      expect(partPreview.summary.createCount).toBe(1);
      expect(partPreview.rows[0].batches.length).toBe(1);
      expect(partPreview.rows[0].batches[0].qty).toBe(8);
      expect(partPreview.rows[0].compatibleMachines).toEqual([nukon.id]);

      // 5) W formularzu części (PartForm) przy wyborze kompatybilności podzespół ma wyraźne oznaczenie pod jakie urządzenie nadrzędne podlega
      const hierarchyInfo = getMachineParentHierarchyInfo(chillerSub, importedMachines);
      expect(hierarchyInfo.isChild).toBe(true);
      expect(hierarchyInfo.parentLabel).toBe('Wycinarka laserowa Nukon (UR-101)');

      const { unmount: unmountPartForm } = render(
        <PartForm part={null} onClose={vi.fn()} user={{ uid: 'u1' }} />
      );
      const searchInput = screen.getByTestId('part-compat-machine-search');
      fireEvent.focus(searchInput);

      const parentBadgeInDropdown = screen.getByTestId(`part-compat-parent-badge-${chillerSub.id}`);
      expect(parentBadgeInDropdown.textContent).toContain('Podlega pod: Wycinarka laserowa Nukon (UR-101)');

      // Po kliknięciu podzespołu, wybrany tag również pokazuje informację o maszynie nadrzędnej
      fireEvent.click(screen.getByTestId(`part-compat-option-${chillerSub.id}`));
      const selectedParentBadge = screen.getByTestId(`selected-compat-parent-${chillerSub.id}`);
      expect(selectedParentBadge.textContent).toContain('Podlega pod: Wycinarka laserowa Nukon (UR-101)');
      unmountPartForm();

      // 6) Opcjonalne drukowanie PIN-u na etykietach QR (domyślnie ukryte, widoczne po zaznaczeniu checkboxa)
      useManagerStore.getState().setRegions([
        { id: 'reg-ciecie', name: 'Hala Cięcia', reportPin: '4821' },
        { id: 'reg-spaw', name: 'Hala Spawalni' },
      ]);
      const { unmount: unmountSinglePinQr } = render(<MachineQRCard machine={nukon} />);
      expect(screen.queryByTestId('single-qr-pin-value')).toBeNull();
      const singlePinCheckbox = screen.getByTestId('single-qr-show-pin-checkbox');
      fireEvent.click(singlePinCheckbox);
      expect(screen.getByTestId('single-qr-pin-value').textContent).toContain('4821');
      unmountSinglePinQr();

      const { unmount: unmountBulkPinQr } = render(<MachinesQRCodes onBack={vi.fn()} />);
      expect(screen.queryByTestId(`qr-card-pin-${nukon.id}`)).toBeNull();
      fireEvent.click(screen.getByTestId('qr-print-show-pin-checkbox'));
      expect(screen.getByTestId(`qr-card-pin-${nukon.id}`).textContent).toContain('4821');
      unmountBulkPinQr();

      // 7) Szybki filtr "Do weryfikacji (1)" oraz masowe przypisanie rejonu i aktywacja kodów QR w Machines.jsx
      const { unmount: unmountMachinesView } = render(
        <MemoryRouter>
          <Machines />
        </MemoryRouter>
      );
      const unverifiedBar = screen.getByTestId('unverified-machines-bar');
      expect(unverifiedBar.textContent).toContain('Do weryfikacji (1)');

      // Kliknięcie szybkiego filtra zostawia na liście tylko maszynę do weryfikacji
      fireEvent.click(screen.getByTestId('filter-unverified-machines-btn'));
      expect(screen.getByText(/Wiertarka kolumnowa bez rejonu/)).toBeTruthy();
      expect(screen.queryByText('Wycinarka laserowa Nukon')).toBeNull();

      // Masowe przypisanie rejonu "Hala Spawalni" i aktywacja kodów QR
      fireEvent.change(screen.getByTestId('bulk-verify-region-select'), {
        target: { value: 'reg-spaw' },
      });
      fireEvent.click(screen.getByTestId('bulk-verify-assign-region-btn'));

      await waitFor(() => {
        const updatedWiertarka = useManagerStore
          .getState()
          .machines.find(m => m.internalId === 'UR-103');
        expect(updatedWiertarka.regionId).toBe('reg-spaw');
        expect(updatedWiertarka.needsVerification).toBe(false);
        expect(updatedWiertarka.name).toBe('Wiertarka kolumnowa bez rejonu');
        expect(updatedWiertarka.qrCreatedAt).toBeTruthy();
      });
      unmountMachinesView();
    });

    it('obsługuje: (1) pełne pokrycie języka EN względem PL, (2) odznakę NOWY dla niewydrukowanych/zaktualizowanych kodów QR, (3) Numer tablicy rejestracyjnej na kodach QR dla floty oraz (4) dopasowanie zleceń serwisanta zewnętrznego po roli/podwykonawcy', () => {
      // 1) Weryfikacja 100% pokrycia kluczy PL -> EN w plikach tłumaczeń
      const getByPath = (obj, p) =>
        p.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
      const missingInEn = [];
      const walkKeys = (obj, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
          const key = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            walkKeys(v, key);
          } else if (getByPath(enTranslations, key) === undefined) {
            missingInEn.push(key);
          }
        }
      };
      walkKeys(plTranslations);
      expect(missingInEn).toEqual([]);
      expect(enTranslations.machines.print.licensePlateLabel).toBe('LICENSE PLATE NUMBER');
      expect(enTranslations.machines.qr.newBadge).toBe('NEW');

      // 2) Odznaka NOWY (isQrUnprintedNew) dla wygenerowanego lub zaktualizowanego i niewydrukowanego kodu QR
      const unprintedMachine = {
        id: 'veh-1',
        name: 'Renault Master Serwisowy',
        assetCategory: 'vehicle',
        licensePlate: 'GD 77889',
        internalId: 'FLOTA-01',
        regionId: 'reg-ciecie',
        qrCreatedAt: '2026-11-05T10:00:00.000Z',
        qrNeedsPrint: true,
        qrPrintedAt: null,
      };
      expect(isQrUnprintedNew(unprintedMachine)).toBe(true);

      const printedMachine = {
        ...unprintedMachine,
        id: 'veh-2',
        name: 'Fiat Ducato Serwisowy',
        licensePlate: 'GD 99112',
        qrNeedsPrint: false,
        qrPrintedAt: '2026-11-05T11:00:00.000Z',
      };
      expect(isQrUnprintedNew(printedMachine)).toBe(false);

      // Ponowna aktualizacja kodu QR po wcześniejszym wydruku znów oznacza kod jako NOWY
      const regeneratedMachine = {
        ...printedMachine,
        qrCreatedAt: '2026-11-05T12:00:00.000Z',
      };
      expect(isQrUnprintedNew(regeneratedMachine)).toBe(true);

      // 3) Karta QR pojazdu floty wyświetla "NUMER TABLICY REJESTRACYJNEJ" oraz numer tablicy (zamiast NUMER WEWNĘTRZNY UR) + odznakę NOWY
      useManagerStore.getState().setBranding({
        companyName: 'Flota Transportowa',
        industryProfile: 'fleet',
      });
      useManagerStore.getState().setMachines([unprintedMachine, printedMachine]);

      const { unmount: unmountFleetSingleQr } = render(<MachineQRCard machine={unprintedMachine} />);
      expect(screen.getByTestId('machine-qr-new-badge').textContent).toContain('NOWY');
      expect(screen.getByTestId('machine-qr-internal-id-label').textContent).toContain(
        'NUMER TABLICY REJESTRACYJNEJ'
      );
      expect(screen.getByText('GD 77889')).toBeTruthy();
      unmountFleetSingleQr();

      const { unmount: unmountFleetBulkQr } = render(<MachinesQRCodes onBack={vi.fn()} />);
      expect(screen.getByTestId(`qr-new-badge-${unprintedMachine.id}`).textContent).toContain(
        'NOWY'
      );
      expect(screen.queryByTestId(`qr-new-badge-${printedMachine.id}`)).toBeNull();
      expect(
        screen.getByTestId(`qr-card-internal-id-label-${unprintedMachine.id}`).textContent
      ).toContain('NUMER TABLICY REJESTRACYJNEJ');
      expect(screen.getAllByText('GD 77889').length).toBeGreaterThanOrEqual(1);
      unmountFleetBulkQr();

      // 4) Serwisant zewnętrzny z niestandardową rolą (zarówno po nazwie, jak i ID dokumentu roli z Firestore) widzi swoje awarie i serwisy
      useManagerStore.getState().setRoles([
        {
          id: 'role-doc-plazma',
          name: 'Serwis Zewnętrzyn Pla',
          permissions: ['tickets', 'only_assigned_tasks'],
        },
      ]);
      const externalTechUser = {
        uid: 'tech-andrzej',
        name: 'Andrzej Andrzej',
        email: 'andrzej@plazma.com.pl',
        role: 'role-doc-plazma',
      };
      const ticketForRoleName = {
        id: 't-ext-1',
        contractor: 'Serwis Zewnętrzyn Pla',
      };
      const serviceForRoleName = {
        id: 's-ext-1',
        assignedTo: 'Serwis Zewnętrzyn Pla',
      };
      const unrelatedTicket = {
        id: 't-other',
        contractor: 'Inna Firma Sp. z o.o.',
      };

      expect(isTaskAssignedToUser(ticketForRoleName, externalTechUser)).toBe(true);
      expect(isTaskAssignedToUser(serviceForRoleName, externalTechUser)).toBe(true);
      expect(isTaskAssignedToUser(unrelatedTicket, externalTechUser)).toBe(false);
    });

    it('obsługuje: (1) przycisk Cofnij/Zamknij i blokadę obcego QR w InAppTicketScanner, (2) opcjonalny GPS dla awarii samochodu oraz (3) szybkie raportowanie przebiegu/motogodzin w OperatorForm i TicketMainColumnHeader', async () => {
      const fleetVehicle = {
        id: 'veh-gps-1',
        name: 'Volkswagen Crafter Serwis',
        assetCategory: 'vehicle',
        licensePlate: 'GD 3V975',
        regionId: 'r-flota',
        currentWorkHours: 142500,
      };
      const industrialMachine = {
        id: 'mach-rbg-1',
        name: 'Prasa Hydrauliczna PH-200',
        assetCategory: 'device',
        regionId: 'r-hala',
        currentWorkHours: 3200,
      };

      useManagerStore.getState().setTenantId('crist');
      useManagerStore.getState().setBranding({
        companyName: 'CRIST S.A.',
        industryProfile: 'industrial',
      });
      useManagerStore.getState().setMachines([fleetVehicle, industrialMachine]);
      useManagerStore.getState().setRegions([
        { id: 'r-flota', name: 'Baza Floty' },
        { id: 'r-hala', name: 'Hala A' },
      ]);

      // 1) InAppTicketScanner posiada przycisk Zamknij oraz blokuje kod QR z innej firmy
      const onCloseMock = vi.fn();
      const { unmount: unmountScanner } = render(
        <MemoryRouter>
          <InAppTicketScanner onClose={onCloseMock} />
        </MemoryRouter>
      );

      const closeBtn = screen.getByTestId('inapp-scanner-close-btn');
      expect(closeBtn).toBeTruthy();
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);

      // Próba wpisania nieznanego / obcego kodu nie otwiera formularza, lecz wyświetla baner błędu
      const manualToggleBtn = screen.getByTestId('operator-manual-toggle-btn');
      fireEvent.click(manualToggleBtn);
      const plateInput = screen.getByTestId('operator-plate-input');
      fireEvent.change(plateInput, { target: { value: 'tenant=obca-firma&machine=m-obca' } });
      fireEvent.click(screen.getByTestId('operator-plate-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('inapp-scanner-error-banner')).toBeTruthy();
      });
      expect(
        screen.getByTestId('inapp-scanner-error-banner').textContent.toLowerCase()
      ).toContain('obca-firma');
      unmountScanner();

      // 2) OperatorForm dla pojazdu wyświetla szybkie raportowanie przebiegu (km) oraz opcjonalną pozycję GPS pojazdu
      const mockGeolocation = {
        getCurrentPosition: vi.fn(successCb =>
          successCb({
            coords: { latitude: 54.51889, longitude: 18.53054, accuracy: 12 },
          })
        ),
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const setSelectedMachineMock = vi.fn();
      const { unmount: unmountVehicleForm } = render(
        <OperatorForm
          machines={[fleetVehicle, industrialMachine]}
          selectedMachine={fleetVehicle}
          setSelectedMachine={setSelectedMachineMock}
          regions={[{ id: 'r-flota', name: 'Baza Floty' }]}
          handleStepChange={vi.fn()}
          isOnline={true}
          isInternal={true}
          topicsList={['Awaria silnika']}
        />
      );

      // Sekcja szybkiego raportowania przebiegu (km)
      const quickMeterCard = screen.getByTestId('operator-quick-meter-card');
      expect(quickMeterCard.textContent).toContain('Szybkie raportowanie przebiegu pojazdu (km)');
      expect(screen.getByTestId('operator-quick-meter-current-badge').textContent).toContain(
        '142500 km'
      );

      const meterInput = screen.getByTestId('operator-quick-meter-input');
      expect(meterInput.value).toBe('142500');
      fireEvent.change(meterInput, { target: { value: '142850' } });
      expect(meterInput.value).toBe('142850');

      // Sekcja opcjonalnej pozycji GPS dla samochodu
      expect(screen.getByTestId('operator-vehicle-gps-section')).toBeTruthy();
      fireEvent.click(screen.getByTestId('operator-capture-vehicle-gps-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('operator-vehicle-gps-captured')).toBeTruthy();
      });
      expect(screen.getByTestId('operator-vehicle-gps-captured').textContent).toContain(
        '54.51889, 18.53054'
      );

      // Możliwość usunięcia pobranej pozycji GPS
      fireEvent.click(screen.getByTestId('operator-clear-vehicle-gps-btn'));
      expect(screen.queryByTestId('operator-vehicle-gps-captured')).toBeNull();
      unmountVehicleForm();

      // 3) OperatorForm dla maszyny przemysłowej wyświetla szybkie raportowanie motogodzin (RBG) i NIE wyświetla sekcji GPS samochodu
      const { unmount: unmountMachineForm } = render(
        <OperatorForm
          machines={[fleetVehicle, industrialMachine]}
          selectedMachine={industrialMachine}
          setSelectedMachine={vi.fn()}
          regions={[{ id: 'r-hala', name: 'Hala A' }]}
          handleStepChange={vi.fn()}
          isOnline={true}
          isInternal={true}
          topicsList={['Wyciek oleju']}
        />
      );
      expect(screen.getByTestId('operator-quick-meter-card').textContent).toContain(
        'Szybkie raportowanie godzin pracy urządzenia (RBG)'
      );
      expect(screen.getByTestId('operator-quick-meter-current-badge').textContent).toContain(
        '3200 RBG'
      );
      expect(screen.queryByTestId('operator-vehicle-gps-section')).toBeNull();
      unmountMachineForm();

      // 4) TicketMainColumnHeader wyświetla zgłoszony stan licznika oraz pozycję GPS pojazdu z linkiem do mapy
      const { unmount: unmountHeader } = render(
        <TicketMainColumnHeader
          currentTicket={{
            id: 't-gps-1',
            machineId: 'veh-gps-1',
            machineName: 'Volkswagen Crafter Serwis',
            topic: 'Uszkodzona opona na trasie',
            status: 1,
            reportedBy: 'Jan Kierowca',
            reportedWorkHours: 142850,
            vehicleGps: { lat: 54.51889, lng: 18.53054, accuracy: 10 },
          }}
          STATUSES={{ 1: { label: 'Nowe', color: 'bg-red-100 text-red-800' } }}
          machines={[fleetVehicle]}
          regions={[{ id: 'r-flota', name: 'Baza Floty' }]}
        />
      );
      expect(screen.getByTestId('ticket-reported-meter-badge').textContent).toContain(
        '142850 km'
      );
      expect(screen.getByTestId('ticket-vehicle-gps-badge').textContent).toContain(
        '54.51889, 18.53054'
      );
      unmountHeader();
    });
  });

  describe('25. Gotowość przed pierwszą sprzedażą B2B SaaS — oficjalne logo PDF VexoNT, neutralny ekran startowy oraz bezpieczne zawieszanie dostępu (suspended)', () => {
    it('używa oficjalnego logotypu VexoNT jako FALLBACK_LOGO_BASE64 w raportach PDF', () => {
      expect(FALLBACK_LOGO_BASE64.startsWith('data:image/png;base64,iVBORw0KGgo')).toBe(true);
      expect(FALLBACK_LOGO_BASE64.length).toBe(11810);
    });

    it('wyświetla neutralny ekran startowy VexoNT bez domyślnego tenanta klienta oraz obsługuje bezpieczne zawieszanie firm (active / trial / suspended)', () => {
      useManagerStore.getState().setTenantId(null);
      expect(getCurrentTenant()).toBe('vexont');

      const { unmount: unmountLogin } = render(
        <MemoryRouter>
          <Login onLogin={vi.fn()} currentUser={null} />
        </MemoryRouter>
      );
      expect(screen.getByText(/VexoNT/i)).toBeTruthy();
      expect(screen.queryByText(/CRIST/i)).toBeNull();
      unmountLogin();

      const handleToggleStatusMock = vi.fn();
      const openEditModalMock = vi.fn();

      const sampleTenants = [
        {
          id: 'klient-aktywny',
          name: 'Zakład Produkcyjny Alfa',
          industryProfile: 'industrial',
          status: 'active',
          modules: { planned_services: true, inventory: true },
        },
        {
          id: 'klient-trial',
          name: 'Wspólnota Mieszkaniowa Beta',
          industryProfile: 'facility',
          status: 'trial',
          modules: { planned_services: true, inventory: false },
        },
        {
          id: 'klient-zawieszony',
          name: 'Serwis Floty Gamma',
          industryProfile: 'fleet',
          status: 'suspended',
          modules: { planned_services: true, fleet: true },
        },
      ];

      const { unmount: unmountTable } = render(
        <SuperAdminTenantTable
          tenantsWithTokens={sampleTenants}
          loading={false}
          openNewModal={vi.fn()}
          openEditModal={openEditModalMock}
          handleToggleStatus={handleToggleStatusMock}
        />
      );

      expect(screen.getByTestId('superadmin-status-badge-klient-aktywny').textContent).toContain(
        'Aktywny'
      );
      expect(screen.getByTestId('superadmin-status-badge-klient-trial').textContent).toContain(
        'Trial'
      );
      expect(
        screen.getByTestId('superadmin-status-badge-klient-zawieszony').textContent
      ).toContain('Zawieszony');

      const suspendBtn = screen.getByTestId('superadmin-toggle-status-klient-aktywny');
      expect(suspendBtn.textContent).toContain('Zawieś');
      fireEvent.click(suspendBtn);
      expect(handleToggleStatusMock).toHaveBeenCalledWith(sampleTenants[0]);

      const unsuspendBtn = screen.getByTestId('superadmin-toggle-status-klient-zawieszony');
      expect(unsuspendBtn.textContent).toContain('Odblokuj');
      fireEvent.click(unsuspendBtn);
      expect(handleToggleStatusMock).toHaveBeenCalledWith(sampleTenants[2]);
      unmountTable();

      // Modal edycji klienta pozwala zmienić status licencji (active / trial / suspended)
      let currentFormData = {
        id: 'klient-aktywny',
        name: 'Zakład Produkcyjny Alfa',
        industryProfile: 'industrial',
        status: 'active',
        maxUsers: 15,
        maxMachines: 100,
        modules: { planned_services: true, inventory: true, fleet: false },
      };
      const setFormDataMock = vi.fn(updater => {
        currentFormData = typeof updater === 'function' ? updater(currentFormData) : updater;
      });

      const { unmount: unmountModal } = render(
        <SuperAdminTenantModal
          isModalOpen={true}
          setIsModalOpen={vi.fn()}
          isEditing={true}
          formData={currentFormData}
          setFormData={setFormDataMock}
          handleSave={vi.fn(e => e.preventDefault())}
          fileInputRef={{ current: null }}
          processCompanyLogo={vi.fn()}
          uploadingLogo={false}
        />
      );

      const statusSelect = screen.getByTestId('superadmin-tenant-status-select');
      expect(statusSelect.value).toBe('active');
      fireEvent.change(statusSelect, { target: { value: 'suspended' } });
      expect(setFormDataMock).toHaveBeenCalled();
      expect(currentFormData.status).toBe('suspended');
      unmountModal();
    });

    it('nie przycina chmurek (MapPinTooltip) na mapie awarii i serwisów (overflow-visible na map-bounds-container oraz wyrównanie right-0 blisko prawej krawędzi)', () => {
      const mapSource = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/manager/Map.jsx'),
        'utf8'
      );
      expect(mapSource).toContain('id="map-bounds-container"');
      expect(mapSource).toContain('pointer-events-none overflow-visible');
      expect(mapSource).not.toContain('pointer-events-none overflow-hidden');

      const rightPin = {
        id: 'reg-right',
        type: 'region',
        name: 'Dok Suchy SD1',
        status: 'critical',
        xPercent: 78,
        yPercent: 52,
        machineCount: 4,
        itemCount: 1,
        hasSubmap: true,
      };

      const { container, unmount } = render(
        <MapPin
          pin={rightPin}
          mode="view"
          modeType="tickets"
          zoomScale={1}
          hoveredPin="reg-right"
          setHoveredPin={vi.fn()}
          draggingPin={null}
          tooltipPos={{ isNearTop: false, isNearLeft: false, isNearRight: true }}
          isFullscreen={false}
          handleMouseEnter={vi.fn()}
          handleMouseLeave={vi.fn()}
          handlePointerDown={vi.fn()}
          handleDeletePin={vi.fn()}
          onNavigateToTickets={vi.fn()}
          setCurrentSubmapId={vi.fn()}
        />
      );

      expect(screen.getByText('Dok Suchy SD1')).toBeTruthy();
      const tooltipEl = container.querySelector('.w-52');
      expect(tooltipEl).toBeTruthy();
      expect(tooltipEl.className).toContain('right-0');
      expect(tooltipEl.className).not.toContain('left-0');
      unmount();
    });
  });
});
