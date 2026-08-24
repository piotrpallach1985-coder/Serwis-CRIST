import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { exportToExcel } from '../../utils/reports/excelExport';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';

export default function ActionItems({ machines, user }) {
  const [items, setItems] = useState([]);
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => {
      const createdDate = safeParseDate(item.createdAt);
      const dueDate = safeParseDate(item.dueDate);
      const completedDate = safeParseDate(item.completedAt);
      return {
        'ID': item.id,
        'Data Zgłoszenia': createdDate ? createdDate.toLocaleDateString('pl-PL') : '-',
        'Maszyna': item.machineName || getMachineName(item.machineId) || '-',
        'Problem / Zadanie': item.problem || '-',
        'Wymagany Termin': dueDate ? dueDate.toLocaleDateString('pl-PL') : '-',
        'Zgłaszający': item.createdBy || '-',
        'Status': item.status === 'completed' ? 'Zrealizowane' : 'Oczekujące',
        'Zrealizował(a)': item.completedBy || '-',
        'Data Realizacji': completedDate ? completedDate.toLocaleDateString('pl-PL') : '-'
      };
    });
    exportToExcel(dataToExport, 'Tematy_do_realizacji');
  };

  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterTime, setFilterTime] = useState('all');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');

  // Regions list extracted from machines
  const regions = useMemo(() => {
    const rSet = new Map();
    machines.forEach(m => {
      if (m.regionId) rSet.set(m.regionId, { id: m.regionId, name: m.regionId }); // Simplified
    });
    return Array.from(rSet.values());
  }, [machines]);


  useEffect(() => {
    const q = query(collection(db, 'action_items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      alert('Błąd ładowania Tematów do Realizacji: ' + err.message);
      console.error(err);
    });
    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);

    let filtered = items.filter(item => {
      // 1. Status Filter
      if (filterStatus === 'pending' && item.status === 'completed') return false;
      if (filterStatus === 'completed' && item.status !== 'completed') return false;

      const machine = machines.find(m => m.id === item.machineId);

      // 2. Region Filter
      if (filterRegion && machine?.regionId !== filterRegion) return false;

      // 3. Machine Filter
      if (filterMachine && item.machineId !== filterMachine) return false;

      // 4. Time Filter
      if (filterTime !== 'all') {
        if (!item.dueDate) return false;
        const dDate = safeParseDate(item.dueDate);
        if (!dDate) return false;
        
        let isWithinTime = false;
        if (filterTime === '30' && dDate <= future30) isWithinTime = true;
        if (filterTime === '90' && dDate <= future90) isWithinTime = true;
        
        if (!isWithinTime) return false;
      }

      return true;
    });
    
    // Sort logic (optional, already sorted by createdAt desc by default, but we can keep it as is or sort by dueDate)
    return filtered.sort((a,b) => {
       const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
       const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
       return dA - dB;
    });
  }, [items, filterStatus, filterTime, filterRegion, filterMachine, machines]);

  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'Nieznana maszyna';

  const handleComplete = async (id) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten temat jako zrealizowany?')) {
      try {
        await updateDoc(doc(db, 'action_items', id), {
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: user?.name || 'Nieznany'
        });
      } catch (err) {
        console.error(err);
        alert('Błąd aktualizacji statusu');
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-clipboard-text text-2xl text-blue-600"></i>
            Tematy do Realizacji
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Akcje i problemy zgłoszone podczas serwisów planowanych
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors"
          >
            <i className="ph ph-file-xls text-lg"></i>
            Eksportuj (.xlsx)
          </button>
          <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'all' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Wszystkie</button>
          <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Oczekujące</button>
          <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'completed' ? 'bg-green-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Zrealizowane</button>
        </div>
        </div>

      </div>

      {/* FILTRY */}
      <PlannedMaintenanceFilters 
        isArchive={false}
        filterTime={filterTime} setFilterTime={setFilterTime}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterMachine={filterMachine} setFilterMachine={setFilterMachine}
        clearFilters={() => {
          setFilterTime('all');
          setFilterRegion('');
          setFilterMachine('');
          setFilterStatus('pending');
        }}
        machines={machines}
        regions={regions}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-4">Data Zgłoszenia</th>
                <th className="px-6 py-4">Maszyna</th>
                <th className="px-6 py-4">Problem / Zadanie</th>
                <th className="px-6 py-4">Wymagany Termin</th>
                <th className="px-6 py-4">Zgłaszający</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">
                    Brak tematów do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {getMachineName(item.machineId)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-md break-words">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Brak'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdBy}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'completed' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider w-fit">
                            <i className="ph ph-check-circle"></i> Zrealizowane
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            przez: <span className="font-bold text-slate-700">{item.completedBy || 'System'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            dn. {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                          <i className="ph ph-clock"></i> Oczekujące
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status !== 'completed' && (
                        <button 
                          onClick={() => handleComplete(item.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                        >
                          Zakończ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
