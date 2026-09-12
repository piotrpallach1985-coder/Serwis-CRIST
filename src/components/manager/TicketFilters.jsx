import React from 'react';
import DebouncedInput from './DebouncedInput';
import { safe } from "../../utils/safeRender";

export default function TicketFilters({
  filterMachine, setFilterMachine,
  filterStatus, setFilterStatus,
  filterRegion, setFilterRegion,
  filterMachineId, setFilterMachineId,
  filterTime, setFilterTime,
  isArchive,
  regions,
  machines,
  onClearSearchQuery
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full relative z-[50]">
      <div className="relative w-full sm:w-64 shrink-0">
        <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
        <DebouncedInput
          type="text"
          placeholder="Szukaj (temat, opis)..."
          value={filterMachine}
          onChange={setFilterMachine}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all shadow-sm"
        />
      </div>

      <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 shrink-0 w-full sm:w-auto">
        <option value="">Wszystkie rejony</option>
        {regions.map(r => (
          <option key={r.id || r.name} value={r.id || r.name}>{safe(r.name)}</option>
        ))}
      </select>

      <select value={filterMachineId} onChange={(e) => setFilterMachineId(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 shrink-0 w-full sm:w-auto">
        <option value="">Wszystkie maszyny</option>
        {machines
          .filter(m => filterRegion ? m.regionId === filterRegion : true)
          .map(m => (
          <option key={m.id} value={m.id}>{safe(m.name)}</option>
        ))}
      </select>

      {isArchive && (
        <input
          type="month"
          value={filterTime === 'all' ? '' : filterTime}
          onChange={(e) => setFilterTime(e.target.value || 'all')}
          className="w-full sm:w-48 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm shrink-0"
          title="Filtruj po miesiącu wykonania"
        />
      )}

      {!isArchive && (
        <div className="relative w-full sm:w-48 shrink-0">
          <i className="ph ph-funnel absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 appearance-none shadow-sm cursor-pointer"
          >
            <option value="">Wszystkie statusy</option>
            <option value="1">Otwarte (Zgłoszone)</option>
            <option value="2">Weryfikacja UT</option>
            <option value="3">Oczekujące na naprawę</option>
            <option value="4">W trakcie naprawy</option>
          </select>
        </div>
      )}

      {(filterMachine || filterStatus || filterRegion || filterMachineId || (filterTime !== 'all')) && (
        <button
          onClick={() => {
            setFilterMachine('');
            setFilterStatus('');
            setFilterRegion('');
            setFilterMachineId('');
            setFilterTime('all');
            if (onClearSearchQuery) onClearSearchQuery();
          }}
          className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          title="Wyczyść wszystkie filtry"
        >
          <i className="ph ph-x text-base font-bold"></i> Usuń filtr
        </button>
      )}
    </div>
  );
}
