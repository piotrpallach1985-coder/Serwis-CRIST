import { useState, useMemo } from 'react';
import { exportToExcel } from '../utils/reports/excelExport';

/**
 * useMachines — hook do zarządzania rejestrem maszyn, filtrowaniem po nazwie i rejonie oraz eksportem.
 * 
 * @param {Array<Object>} [machines=[]] Lista maszyn z bazy danych
 * @param {Array<Object>} [regions=[]] Lista rejonów stoczni
 * @returns {Object} Stan i metody filtrowania maszyn
 */
export function useMachines(machines = [], regions = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (id) => {
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

    const buildTree = (all, parentId = null, depth = 0) => {
      const children = all
        .filter(m => parentId ? m.parentId === parentId : (!m.parentId || m.parentId === ''))
        .sort(sortFn);
      
      return children.map(m => {
        return { ...m, depth, children: buildTree(all, m.id, depth + 1) };
      });
    };

    const flattenTree = (nodes) => {
      let flat = [];
      nodes.forEach(n => {
        const hasChildren = n.children && n.children.length > 0;
        
        // If there's an active search, we temporarily force expand everything
        // so users can see the matched nested items. Otherwise, rely on expandedNodes.
        const isSearching = searchQuery.trim() !== '' || filterRegion !== '';
        const isExpanded = isSearching || expandedNodes.has(n.id);
        
        // We pass isCollapsed for the UI (so it knows which icon to show)
        flat.push({ ...n, hasChildren, isCollapsed: !isExpanded });
        
        if (hasChildren && isExpanded) {
          flat = flat.concat(flattenTree(n.children));
        }
      });
      return flat;
    };

    let flatMachines = flattenTree(buildTree(activeMachines));

    return flatMachines.filter(m => {
        const queryLower = searchQuery.toLowerCase().trim();
        const isNoRegionQuery = queryLower === 'bez rejonu';
        
        let matchName = true;
        if (isNoRegionQuery) {
          matchName = !m.regionId || m.regionId === '';
        } else if (queryLower) {
          matchName = (m.name && m.name.toLowerCase().includes(queryLower)) || 
                      (m.internalId && m.internalId.toLowerCase().includes(queryLower));
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
      'ID': m.id,
      'Nazwa Maszyny': m.name || '-',
      'Rejon': (regions.find(r => r.id === m.regionId)?.name || 'Bez rejonu'),
      'Nr Seryjny / Wewnetrzny': m.internalId || '-',
      'Obecne RBG': m.currentWorkHours || 0,
      'Zapasowy Opis': m.additionalDescription || '-'
    }));
    exportToExcel(dataToExport, 'Rejestr_Maszyn');
  };

  return {
    searchQuery, setSearchQuery,
    filterRegion, setFilterRegion,
    filteredMachines,
    handleExportExcel,
    toggleNode
  };
}
