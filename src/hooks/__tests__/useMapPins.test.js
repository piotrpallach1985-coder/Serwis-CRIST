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
});
