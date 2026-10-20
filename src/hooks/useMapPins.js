import { useMemo } from 'react';
import { TICKET_STATUS } from '../utils/constants';
import { checkServiceUrgency } from '../utils/logicHelpers';

export function isMachinePinnedOnSubmap(m, submapId, regions = []) {
  if (!m || !submapId) return false;
  const hasCoords =
    (m.xPercent !== undefined && m.xPercent !== null) ||
    (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null);
  if (!hasCoords) return false;
  if (m.regionId !== submapId) return false;
  if (m.pinnedOnMap === 'main') return false;
  if (Array.isArray(regions) && regions.length > 0) {
    const reg = regions.find(r => r.id === submapId);
    if (reg) {
      const hasMap =
        reg.mapType === 'google'
          ? Boolean(
              (reg.googleLat && reg.googleLng) ||
                (reg.googleQuery && reg.googleQuery.trim() !== '')
            )
          : Boolean(reg.mapImageUrl && reg.mapImageUrl.trim() !== '');
      if (!hasMap && m.pinnedOnMap !== 'submap') return false;
    }
  }
  return true;
}

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
  const { pinData, unpinnedData } = useMemo(() => {
    const validMachines = machines.filter(m => !m.isDeleted);

    const activeTickets =
      modeType === 'tickets'
        ? tickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED)
        : [];

    const activeServices = [];
    if (modeType === 'services') {
      plannedServices.forEach(srv => {
        if (srv.status === 'completed') return;
        const machine = validMachines.find(m => m.id === srv.machineId);
        if (!machine) return;
        const { isOverdue, isUpcoming } = checkServiceUrgency(srv, machine, plannedWarningDays);
        if (isOverdue || isUpcoming || srv.status === 'in_progress') {
          activeServices.push({ ...srv, isOverdue, isUpcoming });
        }
      });
    }

    const activeItems = modeType === 'tickets' ? activeTickets : activeServices;

    const getDescendantRegionIds = (rootId, visited = new Set()) => {
      if (!rootId || visited.has(rootId)) return [];
      visited.add(rootId);
      const children = regions.filter(r => r.parentId === rootId);
      let ids = [rootId];
      children.forEach(child => {
        ids = ids.concat(getDescendantRegionIds(child.id, visited));
      });
      return ids;
    };

    const getRegionStatusAndCount = (regionIds, filterMachinesFn = null) => {
      const regionIdSet = new Set(Array.isArray(regionIds) ? regionIds : [regionIds]);
      let regionMachines = validMachines.filter(m => regionIdSet.has(m.regionId));
      if (filterMachinesFn) {
        regionMachines = regionMachines.filter(filterMachinesFn);
      }
      const machineIdsInRegion = new Set(regionMachines.map(m => m.id));

      const itemsInRegion = activeItems.filter(item => {
        if (item.machineId && machineIdsInRegion.has(item.machineId)) return true;
        if (!item.machineId && item.regionId && regionIdSet.has(item.regionId)) return true;
        return false;
      });

      let status = 'ok';
      if (modeType === 'tickets') {
        const hasCritical = itemsInRegion.some(t => t.isCritical);
        if (hasCritical) status = 'critical';
        else if (itemsInRegion.length > 0) status = 'warning';
      } else {
        const hasOverdue = itemsInRegion.some(s => s.isOverdue);
        const hasInProgress = itemsInRegion.some(s => s.status === 'in_progress');
        const hasUpcoming = itemsInRegion.some(s => s.isUpcoming);
        if (hasOverdue) status = 'critical';
        else if (hasInProgress) status = 'in_progress';
        else if (hasUpcoming) status = 'warning';
      }

      return {
        status,
        itemCount: itemsInRegion.length,
        machineCount: regionMachines.length,
      };
    };

    const getMachineStatusAndCount = machineId => {
      const itemsForMachine = activeItems.filter(item => item.machineId === machineId);
      let status = 'ok';

      if (modeType === 'tickets') {
        const hasCritical = itemsForMachine.some(t => t.isCritical);
        if (hasCritical) status = 'critical';
        else if (itemsForMachine.length > 0) status = 'warning';
      } else {
        const hasOverdue = itemsForMachine.some(s => s.isOverdue);
        const hasInProgress = itemsForMachine.some(s => s.status === 'in_progress');
        const hasUpcoming = itemsForMachine.some(s => s.isUpcoming);
        if (hasOverdue) status = 'critical';
        else if (hasInProgress) status = 'in_progress';
        else if (hasUpcoming) status = 'warning';
      }

      return { status, itemCount: itemsForMachine.length };
    };

    const isSubmapConfigured = region => {
      if (!region) return false;
      return region.mapType === 'google'
        ? Boolean(
            (region.googleLat && region.googleLng) ||
              (region.googleQuery && region.googleQuery.trim() !== '')
          )
        : Boolean(region.mapImageUrl && region.mapImageUrl.trim() !== '');
    };

    const pins = [];

    const currentSubmapRegion = currentSubmapId
      ? regions.find(r => r.id === currentSubmapId)
      : null;
    const currentSubmapHasMap = currentSubmapId
      ? isSubmapConfigured(currentSubmapRegion)
      : true;

    const visibleRegions = currentSubmapHasMap
      ? regions.filter(reg => {
          const regParent = reg.parentId || null;
          const activeParent = currentSubmapId || null;
          return (
            regParent === activeParent &&
            ((reg.xPercent !== undefined && reg.xPercent !== null) ||
              (reg.lat !== undefined && reg.lat !== null && reg.lng !== undefined && reg.lng !== null))
          );
        })
      : [];

    visibleRegions.forEach(reg => {
      const isDragging =
        draggingPin && draggingPin.type === 'region' && draggingPin.id === reg.id;
      const x = isDragging ? draggingPin.x : reg.xPercent ?? 50;
      const y = isDragging ? draggingPin.y : reg.yPercent ?? 50;

      const descendantIds = getDescendantRegionIds(reg.id);
      const hasConfiguredMap = isSubmapConfigured(reg);
      const hasChildRegions = regions.some(r => r.parentId === reg.id);

      const excludeMachinesWithOwnPinHere = m => {
        const hasCoords =
          (m.xPercent !== undefined && m.xPercent !== null) ||
          (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null);
        if (!hasCoords) return true;
        if (!currentSubmapId) {
          return !(m.pinnedOnMap === 'main');
        }
        return !(m.regionId === currentSubmapId && m.pinnedOnMap !== 'main');
      };

      const { status, itemCount, machineCount } = getRegionStatusAndCount(
        descendantIds,
        excludeMachinesWithOwnPinHere
      );

      pins.push({
        id: reg.id,
        type: 'region',
        name: reg.name,
        description: reg.description,
        parentId: reg.parentId || null,
        xPercent: x,
        yPercent: y,
        lat: isDragging && draggingPin.lat !== undefined ? draggingPin.lat : reg.lat,
        lng: isDragging && draggingPin.lng !== undefined ? draggingPin.lng : reg.lng,
        address: reg.address || '',
        hasSubmap: hasConfiguredMap || hasChildRegions,
        hasConfiguredMap,
        status,
        itemCount,
        machineCount,
      });
    });

    const visibleMachines = !currentSubmapId
      ? validMachines.filter(
          m =>
            ((m.xPercent !== undefined && m.xPercent !== null) ||
              (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null)) &&
            (!m.regionId || m.pinnedOnMap === 'main')
        )
      : currentSubmapHasMap
      ? validMachines.filter(
          m =>
            m.regionId === currentSubmapId &&
            ((m.xPercent !== undefined && m.xPercent !== null) ||
              (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null)) &&
            m.pinnedOnMap !== 'main'
        )
      : [];

    visibleMachines.forEach(m => {
      const isDragging =
        draggingPin && draggingPin.type === 'machine' && draggingPin.id === m.id;
      const x = isDragging ? draggingPin.x : m.xPercent ?? 50;
      const y = isDragging ? draggingPin.y : m.yPercent ?? 50;
      const { status, itemCount } = getMachineStatusAndCount(m.id);

      pins.push({
        id: m.id,
        type: 'machine',
        name: m.name,
        internalId: m.internalId,
        additionalDescription: m.additionalDescription,
        xPercent: x,
        yPercent: y,
        lat: isDragging && draggingPin.lat !== undefined ? draggingPin.lat : m.lat,
        lng: isDragging && draggingPin.lng !== undefined ? draggingPin.lng : m.lng,
        address: m.address || '',
        status,
        itemCount,
      });
    });

    let unpinnedStatus = 'ok';
    let unpinnedCount = 0;
    let unpinnedMachineCount = 0;

    if (!currentSubmapId) {
      const pinnedTopRegions = new Set(
        regions
          .filter(
            r =>
              !r.parentId &&
              ((r.xPercent !== undefined && r.xPercent !== null) ||
                (r.lat !== undefined && r.lat !== null && r.lng !== undefined && r.lng !== null))
          )
          .map(r => r.id)
      );

      const coveredRegions = new Set();
      pinnedTopRegions.forEach(topId => {
        getDescendantRegionIds(topId).forEach(id => coveredRegions.add(id));
      });

      const unpinnedRegions = regions.filter(r => !coveredRegions.has(r.id));
      const unpinnedRegionIds = new Set(unpinnedRegions.map(r => r.id));

      const unpinnedMachines = validMachines.filter(m => {
        const hasPinOnMain =
          ((m.xPercent !== undefined && m.xPercent !== null) ||
            (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null)) &&
          (!m.regionId || m.pinnedOnMap === 'main');
        if (hasPinOnMain) return false;
        if (!m.regionId) return true;
        if (unpinnedRegionIds.has(m.regionId)) return true;
        return false;
      });

      unpinnedMachineCount = unpinnedMachines.length;
      const unpinnedMachineIds = new Set(unpinnedMachines.map(m => m.id));

      const unpinnedItems = activeItems.filter(item => {
        if (item.machineId && unpinnedMachineIds.has(item.machineId)) return true;
        if (!item.machineId) {
          if (!item.regionId) return true;
          if (unpinnedRegionIds.has(item.regionId)) return true;
        }
        return false;
      });

      unpinnedCount = unpinnedItems.length;

      if (modeType === 'tickets') {
        if (unpinnedItems.some(t => t.isCritical)) unpinnedStatus = 'critical';
        else if (unpinnedItems.length > 0) unpinnedStatus = 'warning';
      } else {
        if (unpinnedItems.some(s => s.isOverdue)) unpinnedStatus = 'critical';
        else if (unpinnedItems.some(s => s.status === 'in_progress'))
          unpinnedStatus = 'in_progress';
        else if (unpinnedItems.some(s => s.isUpcoming)) unpinnedStatus = 'warning';
      }
    } else {
      const pinnedChildRegions = new Set(
        currentSubmapHasMap
          ? regions
              .filter(
                r =>
                  r.parentId === currentSubmapId &&
                  ((r.xPercent !== undefined && r.xPercent !== null) ||
                    (r.lat !== undefined && r.lat !== null && r.lng !== undefined && r.lng !== null))
              )
              .map(r => r.id)
          : []
      );

      const coveredChildRegions = new Set();
      pinnedChildRegions.forEach(childId => {
        getDescendantRegionIds(childId).forEach(id => coveredChildRegions.add(id));
      });

      const allDescendantIds = getDescendantRegionIds(currentSubmapId);
      const unpinnedSubRegionIds = new Set(
        allDescendantIds.filter(
          id => id !== currentSubmapId && !coveredChildRegions.has(id)
        )
      );

      const unpinnedMachines = validMachines.filter(m => {
        if (m.regionId === currentSubmapId) {
          if (!currentSubmapHasMap) return true;
          const hasCoords =
            (m.xPercent !== undefined && m.xPercent !== null) ||
            (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null);
          return !hasCoords || m.pinnedOnMap === 'main';
        }
        return unpinnedSubRegionIds.has(m.regionId);
      });

      unpinnedMachineCount = unpinnedMachines.length;
      const unpinnedMachineIds = new Set(unpinnedMachines.map(m => m.id));

      const unpinnedItems = activeItems.filter(
        item => item.machineId && unpinnedMachineIds.has(item.machineId)
      );
      unpinnedCount = unpinnedItems.length;

      if (modeType === 'tickets') {
        if (unpinnedItems.some(t => t.isCritical)) unpinnedStatus = 'critical';
        else if (unpinnedItems.length > 0) unpinnedStatus = 'warning';
      } else {
        if (unpinnedItems.some(s => s.isOverdue)) unpinnedStatus = 'critical';
        else if (unpinnedItems.some(s => s.status === 'in_progress'))
          unpinnedStatus = 'in_progress';
        else if (unpinnedItems.some(s => s.isUpcoming)) unpinnedStatus = 'warning';
      }
    }

    return {
      pinData: pins,
      unpinnedData: {
        status: unpinnedStatus,
        unpinnedCount,
        unpinnedMachineCount,
      },
    };
  }, [
    tickets,
    plannedServices,
    modeType,
    machines,
    regions,
    plannedWarningDays,
    currentSubmapId,
    draggingPin,
  ]);

  return { pinData, unpinnedData };
}
