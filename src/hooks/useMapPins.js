import { useMemo } from 'react';
import { safeParseDate } from '../utils/dateHelpers';
import { TICKET_STATUS } from '../utils/constants';

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

function matchesMachineName(ticketMachName, machineName) {
  if (!ticketMachName || !machineName) return false;
  const tClean = ticketMachName.toLowerCase().replace(/\s*\(do weryfikacji\)/gi, '').trim();
  const mClean = machineName.toLowerCase().replace(/\s*\(do weryfikacji\)/gi, '').trim();
  return tClean === mClean;
}

/**
 * Zwraca zbiór ID danego rejonu oraz wszystkich jego podrejonów (wielopoziomowo, z ochroną przed cyklami).
 */
function getRegionTreeIds(rootRegionId, regions) {
  const result = new Set([rootRegionId]);
  const queue = [rootRegionId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    regions.forEach(r => {
      if (!r.isDeleted && r.parentId === currentId && !result.has(r.id)) {
        result.add(r.id);
        queue.push(r.id);
      }
    });
  }
  return result;
}

function regionHasOwnMap(region, regions) {
  if (!region) return false;
  if (region.mapImageUrl) return true;
  if (region.mapType === 'google' && region.googleQuery) return true;
  if (regions.some(r => !r.isDeleted && r.parentId === region.id)) return true;
  return false;
}

/**
 * useMapPins — Hook obliczający listę pinezek do wyświetlenia na mapie.
 * Obsługuje Mapę Główną oraz wielopoziomowe podmapy (podmapy w podmapach).
 *
 * @returns {{ pinData, displayPins, unpinnedData }}
 */
export function useMapPins({
  tickets,
  plannedServices,
  modeType,
  machines: allMachines,
  regions,
  plannedWarningDays,
  currentSubmapId,
  draggingPin,
}) {
  const machines = useMemo(() => allMachines.filter(m => (!m.parentId || m.parentId === "") && !m.isDeleted), [allMachines]);
  const activeRegions = useMemo(() => regions.filter(r => !r.isDeleted), [regions]);

  const pinData = useMemo(() => {
    const pins = [];
    const now = new Date();

    const buildRegionPin = (region, excludedMachineIds = new Set()) => {
      let status = 'ok';
      let count = 0;
      let itemIds = [];

      const treeRegionIds = getRegionTreeIds(region.id, activeRegions);
      const treeRegionNames = new Set(
        activeRegions
          .filter(r => treeRegionIds.has(r.id) && r.name)
          .map(r => r.name.trim().toLowerCase())
      );
      const regionMachines = machines.filter(m => treeRegionIds.has(m.regionId));
      const regionMachineIds = new Set(regionMachines.map(m => m.id));

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => {
          if (Number(t.status) === TICKET_STATUS.CLOSED) return false;
          if (excludedMachineIds.has(t.machineId)) return false;

          if (treeRegionIds.has(t.regionId)) return true;
          if (t.regionName && treeRegionNames.has(t.regionName.trim().toLowerCase())) return true;
          if (regionMachineIds.has(t.machineId)) return true;
          if (regionMachines.some(m => matchesMachineName(t.machineName, m.name))) return true;

          return false;
        });

        if (activeTickets.length > 0) {
          status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        }
        count = activeTickets.length;
        itemIds = activeTickets.map(t => t.id);
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => {
          if (p.status !== 'pending' && p.status !== 'in_progress') return false;
          if (excludedMachineIds.has(p.machineId)) return false;

          if (treeRegionIds.has(p.regionId)) return true;
          if (regionMachineIds.has(p.machineId)) return true;
          if (regionMachines.some(m => matchesMachineName(p.machineName, m.name))) return true;

          return false;
        });

        activePlans.forEach(p => {
          const machine = machines.find(m => m.id === p.machineId);
          const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
          status = applyServiceStatus(status, svcState, p.status);
        });
        count = activePlans.length;
        itemIds = activePlans.map(p => p.id);
      }

      return {
        id: region.id,
        type: 'region',
        name: region.name,
        xPercent: region.xPercent,
        yPercent: region.yPercent,
        status,
        itemCount: count,
        itemIds,
        machineCount: regionMachines.length,
        hasSubmap: true,
        hasConfiguredMap: regionHasOwnMap(region, activeRegions),
      };
    };

    const buildMachinePin = (machine) => {
      let status = 'ok';
      let count = 0;
      let itemIds = [];

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t =>
          (t.machineId === machine.id || matchesMachineName(t.machineName, machine.name)) &&
          Number(t.status) !== TICKET_STATUS.CLOSED
        );
        if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        count = activeTickets.length;
        itemIds = activeTickets.map(t => t.id);
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
        activePlans.forEach(p => {
          const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
          status = applyServiceStatus(status, svcState, p.status);
        });
        count = activePlans.length;
        itemIds = activePlans.map(p => p.id);
      }

      return {
        id: machine.id,
        type: 'machine',
        name: machine.name,
        xPercent: machine.xPercent,
        yPercent: machine.yPercent,
        status,
        itemCount: count,
        itemIds,
      };
    };

    if (currentSubmapId === null) {
      // Zidentyfikuj maszyny, które mają własną, samodzielną pinezkę na mapie głównej
      const pinnedMainMachineIds = new Set(
        machines
          .filter(m => {
            if (m.xPercent == null || m.yPercent == null) return false;
            const reg = activeRegions.find(r => r.id === m.regionId);
            return m.pinnedOnMap === 'main' || (!m.pinnedOnMap && (!reg || !regionHasOwnMap(reg, activeRegions)));
          })
          .map(m => m.id)
      );

      // MAPA GŁÓWNA — Rejony główne (bez parentId)
      activeRegions.forEach(region => {
        if (region.parentId) return;
        if (region.xPercent == null || region.yPercent == null) return;
        pins.push(buildRegionPin(region, pinnedMainMachineIds));
      });

      // MAPA GŁÓWNA — Maszyny mające pinezkę na mapie głównej
      machines.forEach(machine => {
        if (!pinnedMainMachineIds.has(machine.id)) return;
        pins.push(buildMachinePin(machine));
      });
    } else {
      // PODMAPA — Podrejony przypisane do bieżącej podmapy (podmapy w podmapach)
      activeRegions.forEach(subRegion => {
        if (subRegion.parentId !== currentSubmapId) return;
        if (subRegion.xPercent == null || subRegion.yPercent == null) return;
        pins.push(buildRegionPin(subRegion));
      });

      // PODMAPA — Maszyny z tego rejonu
      machines.forEach(machine => {
        if (machine.regionId !== currentSubmapId || machine.xPercent == null || machine.yPercent == null) return;
        pins.push(buildMachinePin(machine));
      });
    }

    return pins;
  }, [tickets, plannedServices, modeType, machines, activeRegions, plannedWarningDays, currentSubmapId]);

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

    if (currentSubmapId === null) {
      // MAPA GŁÓWNA: "Bez rejonu"
      const unpinnedMachines = machines.filter(m => !m.regionId);

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => {
          if (Number(t.status) === TICKET_STATUS.CLOSED) return false;
          if (t.regionId) return false;
          const reg = (t.regionName || '').toLowerCase().trim();
          if (reg && reg !== 'bez rejonu' && reg !== '-') return false;
          const machObj = machines.find(m => m.id === t.machineId || matchesMachineName(t.machineName, m.name));
          if (machObj && machObj.regionId) return false;
          return true;
        });
        if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        unpinnedCount = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => {
          if (p.status !== 'pending' && p.status !== 'in_progress') return false;
          if (p.regionId) return false;
          const machObj = machines.find(m => m.id === p.machineId);
          if (machObj && machObj.regionId) return false;
          return true;
        });
        activePlans.forEach(p => {
          const machine = machines.find(m => m.id === p.machineId);
          const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
          status = applyServiceStatus(status, svcState, p.status);
        });
        unpinnedCount = activePlans.length;
      }

      return { status, unpinnedCount, unpinnedMachineCount: unpinnedMachines.length };
    } else {
      // PODMAPA: "Bez pineski" w bieżącym rejonie
      const unpinnedMachines = machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null));
      const unpinnedMachineIds = new Set(unpinnedMachines.map(m => m.id));

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => {
          if (Number(t.status) === TICKET_STATUS.CLOSED) return false;
          const isThisRegion = t.regionId === currentSubmapId || unpinnedMachineIds.has(t.machineId);
          if (!isThisRegion) return false;
          const machObj = machines.find(m => m.id === t.machineId || matchesMachineName(t.machineName, m.name));
          if (machObj && machObj.xPercent != null && machObj.yPercent != null) return false;
          return true;
        });
        if (activeTickets.length > 0) status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        unpinnedCount = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => {
          if (p.status !== 'pending' && p.status !== 'in_progress') return false;
          const machObj = machines.find(m => m.id === p.machineId);
          if (!machObj || machObj.regionId !== currentSubmapId) return false;
          return machObj.xPercent == null || machObj.yPercent == null;
        });
        activePlans.forEach(p => {
          const machine = machines.find(m => m.id === p.machineId);
          const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
          status = applyServiceStatus(status, svcState, p.status);
        });
        unpinnedCount = activePlans.length;
      }

      return { status, unpinnedCount, unpinnedMachineCount: unpinnedMachines.length };
    }
  }, [tickets, plannedServices, modeType, machines, currentSubmapId, plannedWarningDays]);

  return { pinData, displayPins, unpinnedData };
}
