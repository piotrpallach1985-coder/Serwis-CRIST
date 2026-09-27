import React from 'react';
import DebouncedInput from './DebouncedInput';

export default function MachineFilters({
  searchQuery,
  setSearchQuery,
  filterRegion,
  setFilterRegion,
  regions,
  showDeleted,
  setShowDeleted,
  onAddMachine
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 mb-4">
      {/* GŁÓWKA LISTY (Tytuł i główna akcja) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="hidden md:block">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <i className="ph ph-engine text-blue-600"></i> Baza Maszyn
          </h2>
          <p className="text-sm text-slate-500 mt-1">Zarządzaj parkiem maszynowym i przeglądaj historię serwisów</p>
        </div>
        <button 
          onClick={onAddMachine} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
        >
          <i className="ph ph-plus text-lg"></i> Dodaj Maszynę
        </button>
      </div>

      {/* FILTRY */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="relative w-full sm:w-72">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <DebouncedInput 
            type="text" 
            placeholder="Szukaj (nazwa, nr wew)..." 
            value={searchQuery} 
            onChange={setSearchQuery} 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" 
          />
        </div>
        <div className="relative w-full sm:w-48">
          <i className="ph ph-funnel absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer transition-all"
          >
            <option value="">Wszystkie Rejony</option>
            <option value="bez_rejonu">Bez rejonu</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
