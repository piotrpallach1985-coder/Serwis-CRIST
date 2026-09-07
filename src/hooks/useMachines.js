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

  const filteredMachines = useMemo(() => {
    return machines
      .filter(m => !m.isDeleted)
      .filter(m => {
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
      })
      .sort((a, b) => {
        const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
        const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
        if (aVerify && !bVerify) return -1;
        if (!aVerify && bVerify) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [machines, searchQuery, filterRegion]);

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
    handleExportExcel
  };
}
