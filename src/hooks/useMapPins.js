import { useMemo } from 'react';
import { safeParseDate } from '../utils/dateHelpers';

/**
 * Oblicza status (ok/warning/critical/in_progress) dla jednego serwisu planowego.
 */
function getServiceStatus(p, machine, plannedWarningDays, now) {
  const state = { isOverdue: false, isWarning: false };
  if (p.nextDate) {
    const nextDate = safeParseDate(p.nextDate);
    if (nextDate < now) state.isOverdue = true;
    else {
      const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= plannedWarningDays) state.isWarning = true;
    }
  }
  if (p.targetWorkHours && machine) {
    if (machine.currentWorkHours >= p.targetWorkHours) state.isOverdue = true;
    else if (p.hoursInterval && (p.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) state.isWarning = true;
  }
  return state;
}

/**
 * Aktualizuje zbiorczy status pinezki na podstawie jednego planu serwisowego.
 */
function applyServiceStatus(currentStatus, serviceState, serviceOriginalStatus) {
  if (serviceOriginalStatus === 'in_progress') return 'in_progress';
  if (serviceState.isOverdue && currentStatus !== 'in_progress') return 'critical';
  if (currentStatus !== 'critical' && currentStatus !== 'in_progress' && serviceState.isWarning) return 'warning';
  return currentStatus;
}

/**
 * useMapPins — Hook obliczający listę pinezek do wyświetlenia na mapie.
 * Wyciągnięty z Map.jsx (linie 222–405).
 *
 * @returns {{ pinData, displayPins, unpinnedData }}
 */
export function useMapPins({
  tickets,
  plannedServices,
  modeType,
  machines,
  regions,
  plannedWarningDays,
  currentSubmapId,
  draggingPin,
}) {
  const pinData = useMemo(() => {
    const pins = [];
    const now = new Date();

    if (currentSubmapId === null) {
      // MAPA GŁÓWNA — Rejony
      regions.forEach(region => {
        if (region.xPercent == null || region.yPercent == null) return;

        let status = 'ok';
        let count = 0;
        const regionMachineIds = machines.filter(m => m.regionId === region.id).map(m => m.id);
        const submapMachineIds = machines.filter(m => {
          if (m.regionId !== region.id) return false;
          const isPinnedOnMain = m.pinnedOnMap === 'main' || (!m.pinnedOnMap && (!region || !region.mapImageUrl));
          return !isPinnedOnMain;
        }).map(m => m.id);

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => submapMachineIds.includes(t.machineId) && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => submapMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
          activePlans.forEach(p => {
            const machine = machines.find(m => m.id === p.machineId);
            const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
            status = applyServiceStatus(status, svcState, p.status);
          });
          count = activePlans.length;
        }

        pins.push({ id: region.id, type: 'region', name: region.name, xPercent: region.xPercent, yPercent: region.yPercent, status, itemCount: count, machineCount: regionMachineIds.length, hasSubmap: !!region.mapImageUrl });
      });

      // MAPA GŁÓWNA — Maszyny bez submapy
      machines.forEach(machine => {
        if (machine.xPercent == null || machine.yPercent == null) return;
        const region = regions.find(r => r.id === machine.regionId);
        const isPinnedOnMain = machine.pinnedOnMap === 'main' || (!machine.pinnedOnMap && (!region || !region.mapImageUrl));
        if (!isPinnedOnMain) return;

        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
          activePlans.forEach(p => {
            const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
            status = applyServiceStatus(status, svcState, p.status);
          });
          count = activePlans.length;
        }

        pins.push({ id: machine.id, type: 'machine', name: machine.name, xPercent: machine.xPercent, yPercent: machine.yPercent, status, itemCount: count });
      });
    } else {
      // PODMAPA — Tylko maszyny z tego rejonu
      machines.forEach(machine => {
        if (machine.regionId !== currentSubmapId || machine.xPercent == null || machine.yPercent == null) return;

        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
          activePlans.forEach(p => {
            const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
            status = applyServiceStatus(status, svcState, p.status);
          });
          count = activePlans.length;
        }

        pins.push({ id: machine.id, type: 'machine', name: machine.name, xPercent: machine.xPercent, yPercent: machine.yPercent, status, itemCount: count });
      });
    }

    return pins;
  }, [tickets, plannedServices, modeType, machines, regions, plannedWarningDays, currentSubmapId]);

  // Nakłada podgląd drag-and-drop
  const displayPins = useMemo(() => {
    if (!draggingPin) return pinData;
    return pinData.map(p =>
      (p.id === draggingPin.id && p.type === draggingPin.type)
        ? { ...p, xPercent: draggingPin.xPercent, yPercent: draggingPin.yPercent }
        : p
    );
  }, [pinData, draggingPin]);

  // Dane dla bloku "Bez rejonu" / "Bez pineski"
  const unpinnedData = useMemo(() => {
    let status = 'ok';
    let unpinnedCount = 0;
    const now = new Date();

    let unpinnedMachineIds;
    if (currentSubmapId === null) {
      unpinnedMachineIds = machines.filter(m => !m.regionId && (m.xPercent == null || m.yPercent == null)).map(m => m.id);
    } else {
      unpinnedMachineIds = machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null)).map(m => m.id);
    }

    if (unpinnedMachineIds.length > 0) {
      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => unpinnedMachineIds.includes(t.machineId) && t.status !== 5 && t.status !== '5');
        if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        unpinnedCount = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => unpinnedMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
        activePlans.forEach(p => {
          const machine = machines.find(m => m.id === p.machineId);
          const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
          status = applyServiceStatus(status, svcState, p.status);
        });
        unpinnedCount = activePlans.length;
      }
    }

    return { status, unpinnedCount, unpinnedMachineCount: unpinnedMachineIds.length };
  }, [tickets, plannedServices, modeType, machines, currentSubmapId, plannedWarningDays]);

  return { pinData, displayPins, unpinnedData };
}
