import { useState, useMemo } from 'react';
import { exportToExcel } from '../utils/reports/excelExport';
import { normalizeLicensePlate, isVehicleAsset } from '../utils/fieldServiceHelpers';

/**
 * useMachines — hook do zarządzania rejestrem maszyn/pojazdów, filtrowaniem po nazwie, nr rej., VIN, kierowcy i rejonie oraz eksportem.
 *
 * @param {Array<Object>} [machines=[]] Lista maszyn z bazy danych
 * @param {Array<Object>} [regions=[]] Lista rejonów / miejsc montażu
 * @returns {Object} Stan i metody filtrowania maszyn
 */
export function useMachines(machines = [], regions = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = id => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const filteredMachines = useMemo(() => {
    const activeMachines = machines.filter(m => !m.isDeleted);

    const sortFn = (a, b) => {
      const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
      const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
      if (aVerify && !bVerify) return -1;
      if (!aVerify && bVerify) return 1;
      return (a.name || '').localeCompare(b.name || '');
    };

    const byId = new Set(activeMachines.map(m => m.id));
    const childrenByParent = new Map();
    activeMachines.forEach(m => {
      const pKey =
        m.parentId && byId.has(m.parentId) && m.parentId !== m.id ? m.parentId : '__root__';
      if (!childrenByParent.has(pKey)) childrenByParent.set(pKey, []);
      childrenByParent.get(pKey).push(m);
    });
    childrenByParent.forEach(list => list.sort(sortFn));

    const visited = new Set();
    const buildTree = (parentId = null, depth = 0) => {
      const pKey = parentId || '__root__';
      const children = childrenByParent.get(pKey) || [];
      const result = [];
      for (const m of children) {
        if (visited.has(m.id)) continue;
        visited.add(m.id);
        result.push({
          ...m,
          depth,
          children: buildTree(m.id, depth + 1),
        });
      }
      return result;
    };

    const flattenTree = nodes => {
      let flat = [];
      nodes.forEach(n => {
        const hasChildren = n.children && n.children.length > 0;
        const isSearching = searchQuery.trim() !== '' || filterRegion !== '';
        const isExpanded = isSearching || expandedNodes.has(n.id);

        flat.push({ ...n, hasChildren, isCollapsed: !isExpanded });

        if (hasChildren && isExpanded) {
          flat = flat.concat(flattenTree(n.children));
        }
      });
      return flat;
    };

    const flatMachines = flattenTree(buildTree(null, 0));

    return flatMachines.filter(m => {
      const queryLower = searchQuery.toLowerCase().trim();
      const normPlateQuery = normalizeLicensePlate(searchQuery);
      const isNoRegionQuery = queryLower === 'bez rejonu';

      let matchName = true;
      if (isNoRegionQuery) {
        matchName = !m.regionId || m.regionId === '';
      } else if (queryLower) {
        const matchByPlate =
          m.licensePlate &&
          (m.licensePlate.toLowerCase().includes(queryLower) ||
            (normPlateQuery.length >= 2 &&
              normalizeLicensePlate(m.licensePlate).includes(normPlateQuery)));
        const matchByVin =
          m.vinNumber &&
          (m.vinNumber.toLowerCase().includes(queryLower) ||
            (normPlateQuery.length >= 3 &&
              normalizeLicensePlate(m.vinNumber).includes(normPlateQuery)));
        const matchByDriver =
          m.assignedDriver && m.assignedDriver.toLowerCase().includes(queryLower);

        matchName =
          Boolean(m.name && m.name.toLowerCase().includes(queryLower)) ||
          Boolean(m.internalId && m.internalId.toLowerCase().includes(queryLower)) ||
          Boolean(matchByPlate) ||
          Boolean(matchByVin) ||
          Boolean(matchByDriver);
      }

      let matchRegion = true;
      if (filterRegion === 'bez_rejonu') {
        matchRegion = !m.regionId || m.regionId === '';
      } else if (filterRegion) {
        matchRegion = m.regionId === filterRegion;
      }

      return matchName && matchRegion;
    });
  }, [machines, searchQuery, filterRegion, expandedNodes]);

  const handleExportExcel = () => {
    const dataToExport = filteredMachines.map(m => ({
      ID: m.id,
      'Nazwa Urządzenia / Pojazdu': m.name || '-',
      'Nr Rejestracyjny': m.licensePlate || '-',
      'Numer VIN': m.vinNumber || '-',
      'Data 1. Rejestracji': m.firstRegistrationDate || '-',
      'Rok prod. / Silnik': [m.productionYear, m.engineSpec].filter(Boolean).join(' • ') || '-',
      Opony: [m.tireSeason, m.tireSize].filter(Boolean).join(' • ') || '-',
      'Polisa / Assistance': [m.policyNumber, m.assistancePhone].filter(Boolean).join(' • ') || '-',
      'Hak / DMC': m.hasTowbar || '-',
      'Własność / Karta paliwowa': m.ownershipType || '-',
      Rejon:
        m.regionId === 'main_map'
          ? isVehicleAsset(m)
            ? 'Cała Firma'
            : 'Mapa Główna'
          : regions.find(r => r.id === m.regionId)?.name || 'Bez rejonu',
      'Nr Seryjny / Wewnętrzny': m.internalId || '-',
      'Stan Licznika': `${m.currentWorkHours || 0} ${m.counterUnit === 'km' ? 'km' : 'RBG'}`,
      'Badanie SKP': m.techInspectionDate || '-',
      'Polisa OC/AC': m.insuranceExpiryDate || '-',
      'UDT / Tachograf / Gaśnica': m.udtOrExtinguisherDate || '-',
      'Kierowca / Opiekun': m.assignedDriver || '-',
      'Dodatkowy Opis': m.additionalDescription || '-',
    }));
    exportToExcel(dataToExport, 'Rejestr_Urzadzen_i_Floty');
  };

  return {
    searchQuery,
    setSearchQuery,
    filterRegion,
    setFilterRegion,
    filteredMachines,
    handleExportExcel,
    toggleNode,
  };
}
