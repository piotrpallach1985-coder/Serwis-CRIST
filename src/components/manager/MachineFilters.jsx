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
    <div className="bg-gray-50 border-b border-gray-200 p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative w-full sm:w-72">
          <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <DebouncedInput 
            type="text" 
            placeholder="Szukaj (nazwa, nr wew)..." 
            value={searchQuery} 
            onChange={setSearchQuery} 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all shadow-sm" 
          />
        </div>
        <div className="relative w-full sm:w-48">
          <i className="ph ph-funnel absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 appearance-none shadow-sm cursor-pointer"
          >
            <option value="">Wszystkie Rejony</option>
            <option value="bez_rejonu">Bez rejonu</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={showDeleted} 
            onChange={(e) => setShowDeleted(e.target.checked)} 
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
          />
          Pokaż usunięte
        </label>
        <button 
          onClick={onAddMachine} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <i className="ph ph-plus text-lg"></i> Dodaj Maszynę
        </button>
      </div>
    </div>
  );
}
