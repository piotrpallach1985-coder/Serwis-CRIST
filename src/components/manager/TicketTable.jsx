import React from 'react';
import TicketMobileCard from './TicketMobileCard';
import TicketTableRow from './TicketTableRow';

export default function TicketTable({
  filteredTickets,
  currentItems,
  visibleCols,
  isArchive,
  STATUSES,
  machines,
  calculateDuration,
  openDetails,
  hasMoreLocalItems,
  setCurrentPage,
  hasMoreArchive,
  fetchArchive,
  loadingArchive
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            Brak zgłoszeń spełniających kryteria.
          </div>
        ) : (
          currentItems.map(ticket => (
            <TicketMobileCard 
              key={ticket.id} 
              ticket={ticket} 
              machines={machines} 
              STATUSES={STATUSES} 
              onOpenDetails={openDetails} 
              isArchive={isArchive} 
            />
          ))
        )}
      </div>

      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                {visibleCols.date && <th className="px-6 py-4">{isArchive ? 'Zakończono' : 'Data zgłoszenia'}</th>}
                {visibleCols.region && <th className="px-6 py-4">Miejsce (Rejon)</th>}
                {visibleCols.machine && <th className="px-6 py-4">Maszynę</th>}
                {visibleCols.bay && <th className="px-6 py-4">Przelot/Inf.</th>}
                {visibleCols.topic && <th className="px-6 py-4">Temat</th>}
                {visibleCols.reporter && <th className="px-6 py-4">Zgłaszający</th>}
                {visibleCols.status && <th className="px-6 py-4">Status</th>}
                {visibleCols.service && <th className="px-6 py-4">Przypisany Serwis</th>}
                {visibleCols.duration && <th className="px-6 py-4">Czas trwania</th>}
                <th className="px-6 py-4 w-12 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500 border-dashed border-2 border-gray-100 m-4">
                    Brak zgłoszeń spełniających kryteria.
                  </td>
                </tr>
              ) : (
                currentItems.map(ticket => (
                  <TicketTableRow 
                    key={ticket.id} 
                    ticket={ticket} 
                    visibleCols={visibleCols} 
                    STATUSES={STATUSES} 
                    machines={machines} 
                    calculateDuration={calculateDuration} 
                    onOpenDetails={openDetails} 
                    isArchive={isArchive} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {hasMoreLocalItems && (
          <div className="p-4 flex justify-center">
            <button 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="px-6 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-all shadow-sm"
            >
              Załaduj kolejne 30 (pozostało {filteredTickets.length - currentItems.length})
            </button>
          </div>
        )}
        {isArchive && hasMoreArchive && !hasMoreLocalItems && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
            <button 
              onClick={() => fetchArchive(true)} 
              disabled={loadingArchive} 
              className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded transition-colors disabled:opacity-50"
            >
              {loadingArchive ? 'Ładowanie...' : 'Załaduj więcej'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
