import { useMemo } from 'react';
import { TICKET_STATUS } from '../utils/constants';
import { checkServiceUrgency } from '../utils/logicHelpers';

const LEGACY_AUTO_SUBMAP_NAME_RE =
  /^(Parter\s*\/\s*(Poziom|Podmapa)\s*\d+|Piętro\s*\d+\s*\/\s*Podmapa\s*\d+)$/i;

function normalizeSubmapName(rawName, index) {
  const trimmed = String(rawName || '').trim();
  if (!trimmed || LEGACY_AUTO_SUBMAP_NAME_RE.test(trimmed)) {
    return `Podmapa ${index + 1}`;
  }
  return trimmed;
}

export function getRegionSubmaps(region) {
  if (!region) return [];
  if (Array.isArray(region.submaps) && region.submaps.length > 0) {
    return region.submaps.map((sub, idx) => {
      const mType = sub.mapType === 'google' ? 'google' : 'image';
      const isConfigured =
        sub.submapConfigured !== false &&
        (mType === 'google'
          ? Boolean(
              sub.submapConfigured === true ||
                (sub.googleLat && sub.googleLng) ||
                (sub.googleQuery && String(sub.googleQuery).trim() !== '')
            )
          : Boolean(sub.mapImageUrl && String(sub.mapImageUrl).trim() !== ''));
      return {
        id: sub.id || (idx === 0 ? 'default' : `sub_${idx + 1}`),
        name: normalizeSubmapName(sub.name, idx),
        mapType: mType,
        mapImageUrl: sub.mapImageUrl || '',
        googleQuery: sub.googleQuery || region.address || '',
        googleLat: Number(sub.googleLat ?? region.googleLat ?? region.lat) || 54.5364,
        googleLng: Number(sub.googleLng ?? region.googleLng ?? region.lng) || 18.5469,
        googleZoom: Number(sub.googleZoom ?? region.googleZoom) || 17,
        googleMapStyle: sub.googleMapStyle || region.googleMapStyle || 'k',
        defaultZoom: Number(sub.defaultZoom) || 1,
        defaultPanX: Number(sub.defaultPanX) || 0,
        defaultPanY: Number(sub.defaultPanY) || 0,
        submapConfigured: isConfigured,
      };
    });
  }

  return [];
}

export function isRegionMapConfigured(region) {
  if (!region) return false;
  const regSubmaps = getRegionSubmaps(region);
  if (regSubmaps.length > 0) {
    return regSubmaps.some(s => s.submapConfigured);
  }
  if (region.submapConfigured === false) return false;
  const hasDirectGoogle =
    region.mapType === 'google' &&
    Boolean(
      region.submapConfigured === true ||
        (region.googleLat && region.googleLng) ||
        (region.googleQuery && String(region.googleQuery).trim() !== '')
    );
  const hasDirectImage = Boolean(region.mapImageUrl && String(region.mapImageUrl).trim() !== '');
  return hasDirectGoogle || hasDirectImage;
}

export function doesEntityBelongToSubmapTab(entity, submaps = [], activeTabId = null) {
  if (!entity) return false;
  if (!Array.isArray(submaps) || submaps.length <= 1) return true;
  const resolvedTabId = activeTabId || submaps[0]?.id || 'default';
  const activeIdx = submaps.findIndex(s => s.id === resolvedTabId);
  const isFirstTab = activeIdx <= 0;
  const otherTabIds = new Set(
    submaps.filter((_, idx) => idx !== Math.max(0, activeIdx)).map(s => s.id)
  );
  if (isFirstTab) {
    return !entity.submapTabId || entity.submapTabId === resolvedTabId || !otherTabIds.has(entity.submapTabId);
  }
  return entity.submapTabId === resolvedTabId;
}

export function isMachinePinnedOnSubmap(m, submapId, regions = [], submapTabId = null) {
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
      const regSubmaps = getRegionSubmaps(reg);
      const hasMap = isRegionMapConfigured(reg);
      if (!hasMap && m.pinnedOnMap !== 'submap') return false;
      if (submapTabId && regSubmaps.length > 0) {
        return doesEntityBelongToSubmapTab(m, regSubmaps, submapTabId);
      }
    }
  }
  return true;
}

export function useMapPins({
  tickets = [],
  plannedServices = [],
  modeType = 'tickets',
  machines = [],
  regions = [],
  plannedWarningDays = 7,
  currentSubmapId = null,
  currentSubmapTabId = null,
  draggingPin = null,
} = {}) {
  const { pinData, unpinnedData, submapTabs } = useMemo(() => {
    const safeMachines = Array.isArray(machines) ? machines : [];
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const safePlannedServices = Array.isArray(plannedServices) ? plannedServices : [];
    const safeRegions = Array.isArray(regions) ? regions : [];

    const validMachines = safeMachines.filter(m => !m.isDeleted);

    const activeTickets =
      modeType === 'tickets'
        ? safeTickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED)
        : [];

    const activeServices = [];
    if (modeType === 'services' || modeType === 'planned_maintenance') {
      safePlannedServices.forEach(srv => {
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
      const children = safeRegions.filter(r => r.parentId === rootId);
      let ids = [rootId];
      children.forEach(child => {
        ids = ids.concat(getDescendantRegionIds(child.id, visited));
      });
      return ids;
    };

    const computeItemsStatus = itemsList => {
      let status = 'ok';
      if (modeType === 'tickets') {
        if (itemsList.some(t => t.isCritical)) status = 'critical';
        else if (itemsList.length > 0) status = 'warning';
      } else {
        if (itemsList.some(s => s.isOverdue)) status = 'critical';
        else if (itemsList.some(s => s.status === 'in_progress')) status = 'in_progress';
        else if (itemsList.some(s => s.isUpcoming)) status = 'warning';
      }
      return status;
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

      const status = computeItemsStatus(itemsInRegion);

      return {
        status,
        itemCount: itemsInRegion.length,
        itemIds: itemsInRegion.map(i => i.id),
        machineCount: regionMachines.length,
      };
    };

    const getMachineStatusAndCount = machineId => {
      const itemsForMachine = activeItems.filter(item => item.machineId === machineId);
      const status = computeItemsStatus(itemsForMachine);

      return {
        status,
        itemCount: itemsForMachine.length,
        itemIds: itemsForMachine.map(i => i.id),
      };
    };

    const isSubmapConfigured = region => isRegionMapConfigured(region);

    const computeSubmapTabsWithStats = region => {
      if (!region) return [];
      const rawTabs = getRegionSubmaps(region);
      if (rawTabs.length === 0) return [];
      const regMachines = validMachines.filter(
        m =>
          m.regionId === region.id &&
          m.pinnedOnMap !== 'main' &&
          ((m.xPercent !== undefined && m.xPercent !== null) ||
            (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null))
      );
      return rawTabs.map(tab => {
        const tabMachines = regMachines.filter(m =>
          doesEntityBelongToSubmapTab(m, rawTabs, tab.id)
        );
        const tabMachineIds = new Set(tabMachines.map(m => m.id));
        const tabItems = activeItems.filter(item => item.machineId && tabMachineIds.has(item.machineId));
        return {
          ...tab,
          machineCount: tabMachines.length,
          itemCount: tabItems.length,
          itemIds: tabItems.map(i => i.id),
          status: computeItemsStatus(tabItems),
        };
      });
    };

    const pins = [];

    const currentSubmapRegion = currentSubmapId
      ? safeRegions.find(r => r.id === currentSubmapId)
      : null;
    const currentRegionTabs = currentSubmapRegion
      ? computeSubmapTabsWithStats(currentSubmapRegion)
      : [];
    const resolvedActiveTab =
      (currentSubmapTabId && currentRegionTabs.find(t => t.id === currentSubmapTabId)) ||
      currentRegionTabs[0] ||
      null;

    const currentSubmapHasMap = currentSubmapId
      ? Boolean(resolvedActiveTab ? resolvedActiveTab.submapConfigured : isSubmapConfigured(currentSubmapRegion))
      : true;

    const visibleRegions = currentSubmapHasMap
      ? safeRegions.filter(reg => {
          const regParent = reg.parentId || null;
          const activeParent = currentSubmapId || null;
          const hasPinCoords =
            (reg.xPercent !== undefined && reg.xPercent !== null) ||
            (reg.lat !== undefined && reg.lat !== null && reg.lng !== undefined && reg.lng !== null);
          if (regParent !== activeParent || !hasPinCoords) return false;
          if (currentSubmapId && currentRegionTabs.length > 1 && resolvedActiveTab) {
            return doesEntityBelongToSubmapTab(reg, currentRegionTabs, resolvedActiveTab.id);
          }
          return true;
        })
      : [];

    visibleRegions.forEach(reg => {
      const isDragging =
        draggingPin && draggingPin.type === 'region' && draggingPin.id === reg.id;
      const x = isDragging ? (draggingPin.xPercent ?? draggingPin.x ?? reg.xPercent ?? 50) : (reg.xPercent ?? 50);
      const y = isDragging ? (draggingPin.yPercent ?? draggingPin.y ?? reg.yPercent ?? 50) : (reg.yPercent ?? 50);

      const descendantIds = getDescendantRegionIds(reg.id);
      const regTabs = computeSubmapTabsWithStats(reg);
      const hasConfiguredMap = isSubmapConfigured(reg);
      const hasChildRegions = safeRegions.some(r => r.parentId === reg.id);

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

      const { status, itemCount, itemIds, machineCount } = getRegionStatusAndCount(
        descendantIds,
        excludeMachinesWithOwnPinHere
      );

      pins.push({
        id: reg.id,
        type: 'region',
        name: reg.name,
        description: reg.description,
        parentId: reg.parentId || null,
        submapTabId: reg.submapTabId || null,
        xPercent: x,
        yPercent: y,
        lat: isDragging && draggingPin.lat !== undefined ? draggingPin.lat : reg.lat,
        lng: isDragging && draggingPin.lng !== undefined ? draggingPin.lng : reg.lng,
        address: reg.address || '',
        hasSubmap: hasConfiguredMap || hasChildRegions,
        hasConfiguredMap,
        submaps: regTabs.filter(s => s.submapConfigured),
        status,
        itemCount,
        itemIds,
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
      ? validMachines.filter(m => {
          const hasPinCoords =
            (m.xPercent !== undefined && m.xPercent !== null) ||
            (m.lat !== undefined && m.lat !== null && m.lng !== undefined && m.lng !== null);
          if (m.regionId !== currentSubmapId || !hasPinCoords || m.pinnedOnMap === 'main') {
            return false;
          }
          if (currentRegionTabs.length > 1 && resolvedActiveTab) {
            return doesEntityBelongToSubmapTab(m, currentRegionTabs, resolvedActiveTab.id);
          }
          return true;
        })
      : [];

    visibleMachines.forEach(m => {
      const isDragging =
        draggingPin && draggingPin.type === 'machine' && draggingPin.id === m.id;
      const x = isDragging ? (draggingPin.xPercent ?? draggingPin.x ?? m.xPercent ?? 50) : (m.xPercent ?? 50);
      const y = isDragging ? (draggingPin.yPercent ?? draggingPin.y ?? m.yPercent ?? 50) : (m.yPercent ?? 50);
      const { status, itemCount, itemIds } = getMachineStatusAndCount(m.id);

      pins.push({
        id: m.id,
        type: 'machine',
        name: m.name,
        internalId: m.internalId,
        additionalDescription: m.additionalDescription,
        submapTabId: m.submapTabId || null,
        xPercent: x,
        yPercent: y,
        lat: isDragging && draggingPin.lat !== undefined ? draggingPin.lat : m.lat,
        lng: isDragging && draggingPin.lng !== undefined ? draggingPin.lng : m.lng,
        address: m.address || '',
        status,
        itemCount,
        itemIds,
      });
    });

    let unpinnedStatus = 'ok';
    let unpinnedCount = 0;
    let unpinnedMachineCount = 0;
    let unpinnedItemIds = [];

    if (!currentSubmapId) {
      const pinnedTopRegions = new Set(
        safeRegions
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

      const unpinnedRegions = safeRegions.filter(r => !coveredRegions.has(r.id));
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
      unpinnedItemIds = unpinnedItems.map(i => i.id);
      unpinnedStatus = computeItemsStatus(unpinnedItems);
    } else {
      const anySubmapConfiguredOnRegion = isSubmapConfigured(currentSubmapRegion);
      const pinnedChildRegions = new Set(
        anySubmapConfiguredOnRegion
          ? safeRegions
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
          if (!anySubmapConfiguredOnRegion) return true;
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
      unpinnedItemIds = unpinnedItems.map(i => i.id);
      unpinnedStatus = computeItemsStatus(unpinnedItems);
    }

    return {
      pinData: pins,
      unpinnedData: {
        status: unpinnedStatus,
        unpinnedCount,
        unpinnedMachineCount,
        itemIds: unpinnedItemIds,
      },
      submapTabs: currentRegionTabs,
    };
  }, [
    tickets,
    plannedServices,
    modeType,
    machines,
    regions,
    plannedWarningDays,
    currentSubmapId,
    currentSubmapTabId,
    draggingPin,
  ]);

  return { displayPins: pinData, pinData, unpinnedData, submapTabs };
}
