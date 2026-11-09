// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import {
  hasIfcCoordinates,
  normalizeIfcUnit,
  applyIfcMapConversion,
  isPuwg2000CoordinatePair,
  puwg2000ToWgs84,
  wgs84ToPuwg2000,
  ifcToMapPercent,
  resolveSubmapByIfcElevation,
  resolveMachineMapPosition,
} from '../ifcCoordinatesHelper';
import { useMapPins, isMachinePinnedOnSubmap } from '../../hooks/useMapPins';
import { autoDetectColumnMapping, prepareMachinesImportPreview } from '../bulkImportHelper';
import MachineForm from '../../components/manager/MachineForm';
import Regions from '../../components/manager/Regions';
import { useManagerStore } from '../../store/managerStore';
import { updateRegion } from '../../services/dictionary.service';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock('../../firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('../../services/machines.service', () => ({
  addMachine: vi.fn().mockResolvedValue({ id: 'new-ifc-mach' }),
  updateMachine: vi.fn().mockResolvedValue({}),
  updateMapSettings: vi.fn().mockResolvedValue({}),
  subscribeToMapSettings: vi.fn(() => () => {}),
}));

vi.mock('../../services/dictionary.service', () => ({
  addRegion: vi.fn().mockResolvedValue({ id: 'new-reg' }),
  updateRegion: vi.fn().mockResolvedValue({}),
  checkRegionInUse: vi.fn().mockResolvedValue({ inUse: false, count: 0 }),
}));

describe('Obsługa współrzędnych BIM / IFC (ISO 16739) — Etap 1 + 3', () => {
  describe('1. Silnik matematyczny ifcCoordinatesHelper.js', () => {
    it('poprawnie rozpoznaje obecność współrzędnych IFC i konwertuje jednostki (mm / cm / m)', () => {
      expect(hasIfcCoordinates({ ifcX: 120.5, ifcY: 45.2 })).toBe(true);
      expect(hasIfcCoordinates({ ifcX: 0, ifcY: 0 })).toBe(true);
      expect(hasIfcCoordinates({ ifcX: '', ifcY: null })).toBe(false);
      expect(hasIfcCoordinates({})).toBe(false);

      expect(normalizeIfcUnit(15000, 'mm')).toBeCloseTo(15, 4);
      expect(normalizeIfcUnit(250, 'cm')).toBeCloseTo(2.5, 4);
      expect(normalizeIfcUnit(12.5, 'm')).toBeCloseTo(12.5, 4);
    });

    it('realizuje transformację IFC4 IfcMapConversion (przesunięcie, skala i obrót XAxisAbscissa/XAxisOrdinate)', () => {
      // Obrót o 90 stopni przeciwnie do wskazówek zegara: cos(90)=0, sin(90)=1 -> XAxisAbscissa=0, XAxisOrdinate=1
      const converted = applyIfcMapConversion(10, 5, 3, {
        eastings: 6535000,
        northings: 6045000,
        orthogonalHeight: 2.5,
        xAxisAbscissa: 0,
        xAxisOrdinate: 1,
        scale: 1.0,
      });

      // E = 6535000 + (10*0 - 5*1) = 6534995
      // N = 6045000 + (10*1 + 5*0) = 6045010
      // H = 2.5 + 3 = 5.5
      expect(converted.easting).toBeCloseTo(6534995, 3);
      expect(converted.northing).toBeCloseTo(6045010, 3);
      expect(converted.elevation).toBeCloseTo(5.5, 3);
    });

    it('dwukierunkowo przelicza układ geodezyjny PUWG 2000 (Strefa 6 — EPSG:2177 Gdynia) <-> GPS WGS84', () => {
      // Współrzędne rejonu stoczni w Gdyni
      const gdyniaLat = 54.5364;
      const gdyniaLng = 18.5469;

      const puwg = wgs84ToPuwg2000(gdyniaLat, gdyniaLng);
      expect(puwg).not.toBeNull();
      expect(puwg.zone).toBe(6);
      expect(isPuwg2000CoordinatePair(puwg.northing, puwg.easting)).toBe(true);
      expect(isPuwg2000CoordinatePair(puwg.easting, puwg.northing)).toBe(true);

      // Odwrotna transformacja zarówno dla kolejności (Northing, Easting) jak i (Easting, Northing)
      const backFromNE = puwg2000ToWgs84(puwg.northing, puwg.easting);
      const backFromEN = puwg2000ToWgs84(puwg.easting, puwg.northing);

      expect(backFromNE.lat).toBeCloseTo(gdyniaLat, 4);
      expect(backFromNE.lng).toBeCloseTo(gdyniaLng, 4);
      expect(backFromEN.lat).toBeCloseTo(gdyniaLat, 4);
      expect(backFromEN.lng).toBeCloseTo(gdyniaLng, 4);
    });

    it('przelicza współrzędne IFC na procenty mapy 2D (Bounding Box, 2 punkty narożne oraz 3-punktowa macierz afiniczna)', () => {
      // 1) Bounding Box (Hala 200m x 100m)
      const bboxCal = { minX: 0, maxX: 200, minY: 0, maxY: 100 };
      const pCenter = ifcToMapPercent(100, 50, bboxCal);
      expect(pCenter).toEqual({ xPercent: 50, yPercent: 50 });

      // Punkt u góry hali w CAD (Y=80m z 100m) to 20% od górnej krawędzi obrazu (invertY domyślnie true)
      const pTopRight = ifcToMapPercent(150, 80, bboxCal);
      expect(pTopRight).toEqual({ xPercent: 75, yPercent: 20 });

      // 2) Kalibracja 2 punktami referencyjnymi (Anchor Points)
      const twoPointCal = {
        anchors: [
          { ifcX: 0, ifcY: 0, xPercent: 10, yPercent: 90 },
          { ifcX: 100, ifcY: 50, xPercent: 90, yPercent: 10 },
        ],
      };
      expect(ifcToMapPercent(50, 25, twoPointCal)).toEqual({ xPercent: 50, yPercent: 50 });

      // 3) Kalibracja 3 punktami referencyjnymi (Macierz afiniczna dla rzutu obróconego / izometrycznego)
      const threePointCal = {
        anchors: [
          { ifcX: 0, ifcY: 0, xPercent: 20, yPercent: 80 },
          { ifcX: 100, ifcY: 0, xPercent: 80, yPercent: 60 },
          { ifcX: 0, ifcY: 100, xPercent: 40, yPercent: 20 },
        ],
      };
      // Dla środka (50, 50): x% = 20 + 0.5*(80-20) + 0.5*(40-20) = 60%, y% = 80 + 0.5*(60-80) + 0.5*(20-80) = 40%
      expect(ifcToMapPercent(50, 50, threePointCal)).toEqual({ xPercent: 60, yPercent: 40 });
    });

    it('automatycznie dobiera poziom podmapy po IfcBuildingStorey lub rzędnej wysokości Z oraz szanuje ręczne przesunięcie pinezki', () => {
      const submaps = [
        { id: 'level_0', name: 'Poziom 0.00', ifcStorey: 'Poziom 0', ifcMinZ: -1, ifcMaxZ: 5 },
        { id: 'level_crane', name: 'Pomost Suwnic', ifcStorey: 'Pomost +12m', ifcMinZ: 5.01, ifcMaxZ: 20 },
      ];

      expect(resolveSubmapByIfcElevation({ ifcZ: 1.5 }, submaps)).toBe('level_0');
      expect(resolveSubmapByIfcElevation({ ifcZ: 12.0 }, submaps)).toBe('level_crane');
      expect(resolveSubmapByIfcElevation({ ifcStorey: 'Pomost +12m' }, submaps)).toBe('level_crane');

      // Maszyna z ręcznie ustawionym xPercent/yPercent zachowuje ręczną pozycję mimo obecności współrzędnych IFC
      const regionWithCal = {
        id: 'reg-k1',
        ifcCalibration: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
      };
      const manualOverridePos = resolveMachineMapPosition(
        { ifcX: 20, ifcY: 20, xPercent: 88, yPercent: 77 },
        regionWithCal
      );
      expect(manualOverridePos.xPercent).toBe(88);
      expect(manualOverridePos.yPercent).toBe(77);
      expect(manualOverridePos.isIfcPositioned).toBe(false);
    });
  });

  describe('2. Integracja z useMapPins.js — automatyczne pozycjonowanie maszyn z BIM na rzutach i poziomach', () => {
    it('automatycznie wyświetla maszynę z współrzędnymi IFC na właściwej zakładce poziomu i wylicza jej pozycję na mapie', () => {
      const regions = [
        {
          id: 'reg-hala-k1',
          name: 'Hala K1',
          mapType: 'image',
          mapImageUrl: 'https://example.com/hala-k1.png',
          xPercent: 40,
          yPercent: 40,
          ifcCalibration: { minX: 0, maxX: 200, minY: 0, maxY: 100 },
          submaps: [
            {
              id: 'tab_ground',
              name: 'Posadzka 0.00',
              mapType: 'image',
              mapImageUrl: 'https://example.com/hala-k1-0.png',
              ifcMinZ: -2,
              ifcMaxZ: 6,
            },
            {
              id: 'tab_crane',
              name: 'Suwnice +12.00',
              mapType: 'image',
              mapImageUrl: 'https://example.com/hala-k1-12.png',
              ifcMinZ: 6.01,
              ifcMaxZ: 25,
            },
          ],
        },
      ];

      const machines = [
        {
          id: 'm-welder',
          name: 'Półautomat spawalniczy Kemppi',
          regionId: 'reg-hala-k1',
          ifcGlobalId: '2O2Fr$t4X7Zf8NOew3FLOH',
          ifcX: 50,
          ifcY: 25,
          ifcZ: 0.5, // Posadzka -> tab_ground
        },
        {
          id: 'm-crane',
          name: 'Suwnica pomostowa 50T',
          regionId: 'reg-hala-k1',
          ifcGlobalId: '3vB2$9t4X7Zf8NOew3AAAA',
          ifcX: 150,
          ifcY: 75,
          ifcZ: 12.5, // Suwnice -> tab_crane
        },
      ];

      expect(isMachinePinnedOnSubmap(machines[0], 'reg-hala-k1', regions, 'tab_ground')).toBe(true);
      expect(isMachinePinnedOnSubmap(machines[0], 'reg-hala-k1', regions, 'tab_crane')).toBe(false);
      expect(isMachinePinnedOnSubmap(machines[1], 'reg-hala-k1', regions, 'tab_crane')).toBe(true);

      // Sprawdzenie pinData na poziomie Posadzki (tab_ground)
      const { result: groundResult } = renderHook(() =>
        useMapPins({
          machines,
          regions,
          tickets: [],
          currentSubmapId: 'reg-hala-k1',
          currentSubmapTabId: 'tab_ground',
        })
      );
      expect(groundResult.current.pinData).toHaveLength(1);
      expect(groundResult.current.pinData[0].id).toBe('m-welder');
      expect(groundResult.current.pinData[0].xPercent).toBe(25);
      expect(groundResult.current.pinData[0].yPercent).toBe(75);
      expect(groundResult.current.pinData[0].isIfcPositioned).toBe(true);
      expect(groundResult.current.unpinnedData.unpinnedMachineCount).toBe(0);

      // Sprawdzenie pinData na poziomie Suwnic (tab_crane)
      const { result: craneResult } = renderHook(() =>
        useMapPins({
          machines,
          regions,
          tickets: [],
          currentSubmapId: 'reg-hala-k1',
          currentSubmapTabId: 'tab_crane',
        })
      );
      expect(craneResult.current.pinData).toHaveLength(1);
      expect(craneResult.current.pinData[0].id).toBe('m-crane');
      expect(craneResult.current.pinData[0].xPercent).toBe(75);
      expect(craneResult.current.pinData[0].yPercent).toBe(25);
    });
  });

  describe('3. Masowy Import Excel / COBie oraz nieinwazyjna sekcja IFC w MachineForm', () => {
    it('importuje kolumny IFC (IfcGlobalId, X, Y, Z, Kondygnacja), rozpoznaje duplikaty po IfcGlobalId i przelicza PUWG 2000 na GPS', () => {
      const puwgGdynia = wgs84ToPuwg2000(54.5364, 18.5469);
      const rawRows = [
        {
          'Nazwa urządzenia': 'Suwnica Bramowa 500T (Zaktualizowana nazwa z BIM)',
          'Miejsce montażu': 'Stocznia Główna',
          IfcGlobalId: '2O2Fr$t4X7Zf8NOew3FLOH',
          'Współrzędna X': String(puwgGdynia.northing),
          'Współrzędna Y': String(puwgGdynia.easting),
          'Rzędna Z': '42.5',
          'Kondygnacja BIM': 'Nabrzeże Główne',
        },
      ];

      const existingMachines = [
        {
          id: 'existing-gantry',
          name: 'Stara nazwa suwnicy',
          regionId: 'reg-yard',
          ifcGlobalId: '2O2Fr$t4X7Zf8NOew3FLOH',
        },
      ];
      const existingRegions = [{ id: 'reg-yard', name: 'Stocznia Główna' }];

      const columnMap = autoDetectColumnMapping(Object.keys(rawRows[0]), 'machines');
      const parsed = prepareMachinesImportPreview(rawRows, columnMap, {
        existingMachines,
        existingRegions,
        duplicateStrategy: 'update',
      });

      expect(parsed.summary.updateCount).toBe(1);
      const row = parsed.rows[0];
      expect(row.existingId).toBe('existing-gantry');
      expect(row.payload.ifcGlobalId).toBe('2O2Fr$t4X7Zf8NOew3FLOH');
      expect(row.payload.ifcZ).toBe(42.5);
      expect(row.payload.ifcStorey).toBe('Nabrzeże Główne');
      expect(row.payload.lat).toBeCloseTo(54.5364, 4);
      expect(row.payload.lng).toBeCloseTo(18.5469, 4);
    });

    it('ukrywa sekcję BIM / IFC domyślnie w MachineForm (dla klientów bez BIM) i rozwija ją na żądanie lub przy edycji obiektu IFC', () => {
      const { unmount } = render(
        <MachineForm
          isOpen={true}
          onClose={vi.fn()}
          editingMachine={null}
          regions={[{ id: 'r1', name: 'Hala A' }]}
          onSaved={vi.fn()}
          onError={vi.fn()}
        />
      );

      // Domyślnie sekcja jest zwinięta — brak zaśmiecania formularza
      expect(screen.queryByTestId('machine-ifc-section')).toBeNull();

      // Po kliknięciu przycisku sekcja się rozwija
      fireEvent.click(screen.getByTestId('machine-ifc-toggle-btn'));
      expect(screen.getByTestId('machine-ifc-section')).toBeTruthy();
      expect(screen.getByTestId('machine-ifc-global-id-input')).toBeTruthy();
      unmount();
    });

    it('obsługuje Etap 2 w Regions.jsx — zwijana sekcja Kalibracji BIM / IFC (poziomy Z, Bounding Box oraz punkty narożne)', async () => {
      useManagerStore.setState({
        regions: [
          {
            id: 'reg-k1',
            name: 'Hala K1',
            description: 'Hala Kadłubowa',
            mapType: 'image',
            mapImageUrl: 'https://example.com/hala-k1.png',
            submapConfigured: true,
            submaps: [
              {
                id: 'default',
                name: 'Posadzka 0.00',
                mapType: 'image',
                mapImageUrl: 'https://example.com/hala-k1.png',
                submapConfigured: true,
              },
            ],
          },
        ],
        machines: [],
        branding: { industryProfile: 'industrial' },
      });

      const { unmount } = render(<Regions />);

      // Klikamy Edytuj dla Hali K1 (drugi przycisk Edytuj, bo pierwszy to Mapa Główna)
      const editButtons = screen.getAllByText(/admin\.regions\.edit|Edytuj/i);
      fireEvent.click(editButtons[1]);

      // Domyślnie panel kalibracji IFC jest zwinięty
      expect(screen.queryByTestId('region-ifc-calibration-panel')).toBeNull();

      // Rozwijamy sekcję Kalibracji BIM / IFC
      fireEvent.click(screen.getByTestId('region-ifc-calibration-toggle'));
      expect(screen.getByTestId('region-ifc-calibration-panel')).toBeTruthy();

      // Uzupełniamy kondygnację, zakres Z oraz Bounding Box hali
      fireEvent.change(screen.getByTestId('submap-ifc-storey-input'), {
        target: { value: 'Poziom 0.00' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-minz-input'), {
        target: { value: '-1' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-maxz-input'), {
        target: { value: '6' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-minx-input'), {
        target: { value: '0' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-maxx-input'), {
        target: { value: '240' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-miny-input'), {
        target: { value: '0' },
      });
      fireEvent.change(screen.getByTestId('submap-ifc-maxy-input'), {
        target: { value: '80' },
      });

      // Zapisujemy formularz rejonu
      fireEvent.click(screen.getByText('Zapisz zmiany'));

      expect(updateRegion).toHaveBeenCalledWith(
        'reg-k1',
        expect.objectContaining({
          ifcCalibration: expect.objectContaining({
            minX: 0,
            maxX: 240,
            minY: 0,
            maxY: 80,
          }),
          submaps: expect.arrayContaining([
            expect.objectContaining({
              ifcStorey: 'Poziom 0.00',
              ifcMinZ: -1,
              ifcMaxZ: 6,
            }),
          ]),
        })
      );
      unmount();
    });
  });
});
