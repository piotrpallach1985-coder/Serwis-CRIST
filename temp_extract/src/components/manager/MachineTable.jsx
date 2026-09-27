import React from 'react';
import MachineCard from './MachineCard';

export default function MachineTable({
  filteredMachines,
  currentItems,
  regions,
  handleViewMachine
}) {
  return (
    <div className="p-4 md:p-6 overflow-x-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:hidden">
        {filteredMachines.length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">Brak maszyn spełniających kryteria.</div>
        ) : (
          currentItems.map(m => (
            <MachineCard key={m.id} machine={m} regions={regions} onClick={handleViewMachine} />
          ))
        )}
      </div>
      <table className="w-full text-left hidden lg:table border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm">
            <th className="px-6 py-3 border-b">Nazwa Maszyny</th>
            <th className="px-6 py-3 border-b">Nr wew. / Opis</th>
            <th className="px-6 py-3 border-b">Rejon / Hala</th>
            <th className="px-6 py-3 border-b text-right">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filteredMachines.length === 0 ? (
            <tr><td colSpan="4" className="p-6 text-center text-gray-500">Brak maszyn spełniających kryteria.</td></tr>
          ) : (
            currentItems.map(m => (
              <tr key={m.id} className={"border-b border-gray-100 transition-colors " + (m.name.includes('(DO WERYFIKACJI)') ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-blue-50')}>
                <td className="p-4">
                  <div className="font-semibold text-gray-800 text-base">{m.name}</div>
                  <div className="text-xs font-mono text-gray-400 mt-1">ID: {m.id}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-700">{m.internalId || '-'}</div>
                  {m.additionalDescription && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{m.additionalDescription}</div>}
                </td>
                <td className="p-4 text-gray-600">
                  {regions.find(r => r.id === m.regionId)?.name || '-'}
                  {m.bay && ` / ${m.bay}`}
                </td>
                <td className="p-4">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => handleViewMachine(m)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm">
                      Szczegóły <i className="ph ph-caret-right"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
