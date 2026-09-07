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

function matchesMachineName(ticketMachName, machineName) {
  if (!ticketMachName || !machineName) return false;
  const tClean = ticketMachName.toLowerCase().replace(/\s*\(do weryfikacji\)/gi, '').trim();
  const mClean = machineName.toLowerCase().replace(/\s*\(do weryfikacji\)/gi, '').trim();
  return tClean === mClean;
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
      // Zidentyfikuj maszyny, które mają własną, samodzielną pinezkę na mapie głównej
      const pinnedMainMachineIds = new Set(
        machines
          .filter(m => {
            if (m.xPercent == null || m.yPercent == null) return false;
            const reg = regions.find(r => r.id === m.regionId);
            return m.pinnedOnMap === 'main' || (!m.pinnedOnMap && (!reg || !reg.mapImageUrl));
          })
          .map(m => m.id)
      );

      // MAPA GŁÓWNA — Rejony
      regions.forEach(region => {
        if (region.xPercent == null || region.yPercent == null) return;

        let status = 'ok';
        let count = 0;
        const regionMachines = machines.filter(m => m.regionId === region.id);
        const regionMachineIds = regionMachines.map(m => m.id);

        if (modeType === 'tickets') {
          // Zgłoszenia przypisane do rejonu lub do maszyn w tym rejonie, które NIE mają własnej pinezki na mapie głównej
          const activeTickets = tickets.filter(t => {
            if (t.status === 5 || t.status === '5') return false;

            // Jeśli maszyna ma już własną pinezkę bezpośrednio na mapie głównej, nie dublujemy w rejonie
            if (pinnedMainMachineIds.has(t.machineId)) return false;

            // Sprawdzamy powiązanie z rejonem: po ID, po nazwie, po maszynie
            if (t.regionId === region.id) return true;
            if (t.regionName && region.name && t.regionName.trim().toLowerCase() === region.name.trim().toLowerCase()) return true;
            if (regionMachineIds.includes(t.machineId)) return true;
            if (regionMachines.some(m => matchesMachineName(t.machineName, m.name))) return true;

            return false;
          });

          if (activeTickets.length > 0) {
            status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          }
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => {
            if (p.status !== 'pending' && p.status !== 'in_progress') return false;
            if (pinnedMainMachineIds.has(p.machineId)) return false;

            if (p.regionId === region.id) return true;
            if (regionMachineIds.includes(p.machineId)) return true;
            if (regionMachines.some(m => matchesMachineName(p.machineName, m.name))) return true;

            return false;
          });

          activePlans.forEach(p => {
            const machine = machines.find(m => m.id === p.machineId);
            const svcState = getServiceStatus(p, machine, plannedWarningDays, now);
            status = applyServiceStatus(status, svcState, p.status);
          });
          count = activePlans.length;
        }

        pins.push({
          id: region.id,
          type: 'region',
          name: region.name,
          xPercent: region.xPercent,
          yPercent: region.yPercent,
          status,
          itemCount: count,
          machineCount: regionMachineIds.length,
          hasSubmap: !!region.mapImageUrl
        });
      });

      // MAPA GŁÓWNA — Maszyny mające pinezkę na mapie głównej
      machines.forEach(machine => {
        if (!pinnedMainMachineIds.has(machine.id)) return;

        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t =>
            (t.machineId === machine.id || matchesMachineName(t.machineName, machine.name)) &&
            t.status !== 5 && t.status !== '5'
          );
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
          const activeTickets = tickets.filter(t =>
            (t.machineId === machine.id || matchesMachineName(t.machineName, machine.name)) &&
            t.status !== 5 && t.status !== '5'
          );
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

    if (currentSubmapId === null) {
      // MAPA GŁÓWNA: "Bez rejonu"
      const unpinnedMachines = machines.filter(m => !m.regionId);
      const unpinnedMachineIds = new Set(unpinnedMachines.map(m => m.id));

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => {
          if (t.status === 5 || t.status === '5') return false;
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
          if (t.status === 5 || t.status === '5') return false;
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
