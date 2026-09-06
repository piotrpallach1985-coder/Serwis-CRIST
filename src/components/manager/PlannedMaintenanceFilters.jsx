import React from 'react';

export default function PlannedMaintenanceFilters({
  isArchive,
  filterTime, setFilterTime,
  filterRegion, setFilterRegion,
  filterMachine, setFilterMachine,
  searchQuery = '', setSearchQuery,
  clearFilters,
  showColumnMenu, setShowColumnMenu,
  columns, toggleColumn,
  regions, machines,
  viewMode, setViewMode
}) {
  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center shrink-0">
        <div className="relative w-full sm:w-64">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <input
            type="text"
            placeholder="Szukaj (maszyna, serwis)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all shadow-sm"
          />
        </div>

        {!isArchive && (
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setFilterTime('all')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === 'all' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Wszystkie</button>
            <button onClick={() => setFilterTime('30')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === '30' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Najbliższe 30 dni</button>
            <button onClick={() => setFilterTime('90')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === '90' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Najbliższe 90 dni</button>
          </div>
        )}

        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Rejony</option>
          {regions.map(r => <option key={r.id || r.name} value={r.id || r.name}>{r.name}</option>)}
        </select>

        <select value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Maszyny</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {(filterTime !== 'all' || filterRegion || filterMachine || searchQuery) && (
          <button onClick={clearFilters} className="text-sm text-red-600 font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
            <i className="ph ph-x"></i> Wyczyść filtry
          </button>
        )}

        <div className="ml-auto relative">
          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-lg flex items-center gap-2">
            <i className="ph ph-gear"></i> Kolumny
          </button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 text-sm">
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.name} onChange={() => toggleColumn('name')}/> Typ Serwisu</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.machine} onChange={() => toggleColumn('machine')}/> Maszyna</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.region} onChange={() => toggleColumn('region')}/> Rejon</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.nextDate} onChange={() => toggleColumn('nextDate')}/> Termin (Kalendarz)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.rbg} onChange={() => toggleColumn('rbg')}/> Termin (RBG)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.priority} onChange={() => toggleColumn('priority')}/> Priorytet</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.status} onChange={() => toggleColumn('status')}/> Status</label>
            </div>
          )}
        </div>
      </div>

      
    </>
  );
}
