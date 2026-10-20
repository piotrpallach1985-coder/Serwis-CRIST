import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMapPins } from '../useMapPins';

describe('useMapPins', () => {
  const regions = [
    { id: 'gp510', name: 'Plac Gp-510', xPercent: 50, yPercent: 50, mapImageUrl: '' },
    { id: 'hala_a', name: 'Hala A', xPercent: 20, yPercent: 30, mapImageUrl: 'https://example.com/hala_a.jpg' }
  ];

  it('aggregates unverified critical failure into region pin even if region has no submap', () => {
    const machines = [
      {
        id: 'mach_dzwig21',
        name: 'Dźwig 21 (DO WERYFIKACJI)',
        regionId: 'gp510',
        xPercent: null,
        yPercent: null
      }
    ];

    const tickets = [
      {
        id: 't1',
        machineId: 'mach_dzwig21',
        machineName: 'Dźwig 21',
        regionId: 'gp510',
        regionName: 'Plac Gp-510',
        isCritical: true,
        status: 1
      }
    ];

    const { result } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions,
        plannedWarningDays: 7,
        currentSubmapId: null,
        draggingPin: null
      })
    );

    const gp510Pin = result.current.pinData.find(p => p.id === 'gp510');
    expect(gp510Pin).toBeDefined();
    expect(gp510Pin.status).toBe('critical');
    expect(gp510Pin.itemCount).toBe(1);
    expect(gp510Pin.machineCount).toBe(1);
  });

  it('does not duplicate ticket on region pin if machine has its own pin on main map', () => {
    const machines = [
      {
        id: 'mach_plazma1',
        name: 'Plazma 1',
        regionId: 'gp510',
        xPercent: 55,
        yPercent: 55,
        pinnedOnMap: 'main'
      }
    ];

    const tickets = [
      {
        id: 't2',
        machineId: 'mach_plazma1',
        machineName: 'Plazma 1',
        regionId: 'gp510',
        isCritical: true,
        status: 1
      }
    ];

    const { result } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions,
        plannedWarningDays: 7,
        currentSubmapId: null,
        draggingPin: null
      })
    );

    const gp510Pin = result.current.pinData.find(p => p.id === 'gp510');
    expect(gp510Pin.itemCount).toBe(0);
    expect(gp510Pin.status).toBe('ok');

    const machPin = result.current.pinData.find(p => p.id === 'mach_plazma1');
    expect(machPin).toBeDefined();
    expect(machPin.status).toBe('critical');
    expect(machPin.itemCount).toBe(1);
  });

  it('correctly calculates unpinnedData for machines and tickets without region', () => {
    const machines = [
      { id: 'm_unassigned', name: 'Piła taśmowa', regionId: '', xPercent: null, yPercent: null }
    ];

    const tickets = [
      {
        id: 't3',
        machineId: 'm_unassigned',
        machineName: 'Piła taśmowa',
        regionId: '',
        regionName: '',
        isCritical: false,
        status: 1
      }
    ];

    const { result } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions,
        plannedWarningDays: 7,
        currentSubmapId: null,
        draggingPin: null
      })
    );

    expect(result.current.unpinnedData.unpinnedMachineCount).toBe(1);
    expect(result.current.unpinnedData.unpinnedCount).toBe(1);
    expect(result.current.unpinnedData.status).toBe('warning');
  });

  it('supports multi-level submaps (submaps inside submaps) and recursive status aggregation', () => {
    const hierarchicalRegions = [
      { id: 'osiedle_1', name: 'Osiedle Słoneczne', parentId: null, xPercent: 40, yPercent: 40, mapType: 'google', googleQuery: 'Gdańsk, Słoneczna 1' },
      { id: 'budynek_a', name: 'Budynek A', parentId: 'osiedle_1', xPercent: 25, yPercent: 35, mapType: 'google', googleQuery: 'Gdańsk, Słoneczna 1A' },
      { id: 'klatka_1', name: 'Klatka 1', parentId: 'budynek_a', xPercent: 60, yPercent: 60, mapImageUrl: 'https://example.com/klatka1.png' }
    ];

    const machines = [
      { id: 'winda_1', name: 'Winda osobowa K1', regionId: 'klatka_1', xPercent: 50, yPercent: 50 }
    ];

    const tickets = [
      {
        id: 't_deep',
        machineId: 'winda_1',
        machineName: 'Winda osobowa K1',
        regionId: 'klatka_1',
        isCritical: true,
        status: 1
      }
    ];

    // 1. Widok Mapy Głównej (currentSubmapId = null) -> widać tylko 'osiedle_1' zezagregowanym alarmem krytycznym z 3. poziomu!
    const { result: mainResult } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions: hierarchicalRegions,
        plannedWarningDays: 7,
        currentSubmapId: null,
        draggingPin: null
      })
    );

    expect(mainResult.current.pinData).toHaveLength(1);
    const osiedlePin = mainResult.current.pinData[0];
    expect(osiedlePin.id).toBe('osiedle_1');
    expect(osiedlePin.status).toBe('critical');
    expect(osiedlePin.itemCount).toBe(1);
    expect(osiedlePin.machineCount).toBe(1);
    expect(osiedlePin.hasSubmap).toBe(true);
    expect(osiedlePin.hasConfiguredMap).toBe(true);

    // 2. Widok Podmapy 1. poziomu ('osiedle_1') -> widać pinezkę podrejonu 'budynek_a' ze zagregowanym alarmem z 'klatka_1'
    const { result: sub1Result } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions: hierarchicalRegions,
        plannedWarningDays: 7,
        currentSubmapId: 'osiedle_1',
        draggingPin: null
      })
    );

    expect(sub1Result.current.pinData).toHaveLength(1);
    const budynekPin = sub1Result.current.pinData[0];
    expect(budynekPin.id).toBe('budynek_a');
    expect(budynekPin.type).toBe('region');
    expect(budynekPin.status).toBe('critical');
    expect(budynekPin.itemCount).toBe(1);
    expect(budynekPin.machineCount).toBe(1);

    // 3. Widok Podmapy 3. poziomu ('klatka_1') -> widać bezpośrednio maszynę 'winda_1'
    const { result: sub2Result } = renderHook(() =>
      useMapPins({
        tickets,
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions: hierarchicalRegions,
        plannedWarningDays: 7,
        currentSubmapId: 'klatka_1',
        draggingPin: null
      })
    );

    expect(sub2Result.current.pinData).toHaveLength(1);
    expect(sub2Result.current.pinData[0].id).toBe('winda_1');
    expect(sub2Result.current.pinData[0].type).toBe('machine');
    expect(sub2Result.current.pinData[0].status).toBe('critical');
  });

  it('does not show pins on a submap that has no configured map (BRAK MAPY), even if it has child regions', () => {
    const testRegions = [
      { id: 'sd2', name: 'SD2', xPercent: 30, yPercent: 40, mapImageUrl: '' },
      { id: 'przegroda_a', name: 'Przegroda A', parentId: 'sd2', xPercent: 25, yPercent: 25, mapImageUrl: '' }
    ];
    const machines = [
      { id: 'm1', name: 'Maszyna przypięta na głównej', regionId: 'sd2', xPercent: 55, yPercent: 35, pinnedOnMap: 'main' },
      { id: 'm2', name: 'Maszyna legacy bez podmapy', regionId: 'sd2', xPercent: 60, yPercent: 40 },
      { id: 'm3', name: 'Maszyna bez pinezki', regionId: 'sd2', xPercent: null, yPercent: null }
    ];

    const { result } = renderHook(() =>
      useMapPins({
        tickets: [],
        plannedServices: [],
        modeType: 'tickets',
        machines,
        regions: testRegions,
        plannedWarningDays: 7,
        currentSubmapId: 'sd2',
        draggingPin: null
      })
    );

    expect(result.current.pinData).toHaveLength(0);
    expect(result.current.displayPins).toHaveLength(0);
    expect(result.current.unpinnedData.unpinnedMachineCount).toBe(3);
  });

  it('exposes displayPins alias for Map.jsx and supports modeType="planned_maintenance"', () => {
    const machines = [
      {
        id: 'm_srv',
        name: 'Suwnica S1',
        regionId: 'gp510',
        xPercent: 40,
        yPercent: 40,
        pinnedOnMap: 'main',
        currentWorkHours: 120,
      },
    ];
    const plannedServices = [
      {
        id: 'srv_1',
        machineId: 'm_srv',
        status: 'pending',
        triggerType: 'hours',
        targetWorkHours: 100,
      },
    ];

    const { result } = renderHook(() =>
      useMapPins({
        tickets: [],
        plannedServices,
        modeType: 'planned_maintenance',
        machines,
        regions,
        plannedWarningDays: 7,
        currentSubmapId: null,
        draggingPin: { id: 'm_srv', type: 'machine', xPercent: 75, yPercent: 80 },
      })
    );

    expect(Array.isArray(result.current.displayPins)).toBe(true);
    expect(result.current.displayPins).toBe(result.current.pinData);
    const machPin = result.current.displayPins.find(p => p.id === 'm_srv');
    expect(machPin).toBeDefined();
    expect(machPin.status).toBe('critical');
    expect(machPin.itemCount).toBe(1);
    expect(machPin.itemIds).toEqual(['srv_1']);
    expect(machPin.xPercent).toBe(75);
    expect(machPin.yPercent).toBe(80);
  });
});
