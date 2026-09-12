import React from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import { safe } from '../../utils/safeRender';

const TicketTableRow = React.memo(function TicketTableRow({ ticket, visibleCols, STATUSES, machines, calculateDuration, onOpenDetails, isArchive }) {
  return (
    <tr className="hover:bg-blue-50/30 transition-colors group">
      {visibleCols.date && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="font-bold text-gray-800">
            {isArchive 
              ? (safeParseDate(ticket.closedAt)?.toLocaleDateString('pl-PL') || '-')
              : (safeParseDate(ticket.createdAt)?.toLocaleDateString('pl-PL') || '-')}
          </div>
          <div className="text-xs text-gray-500">
            {isArchive
              ? (safeParseDate(ticket.closedAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-')
              : (safeParseDate(ticket.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-')}
          </div>
        </td>
      )}
      {visibleCols.region && (
        <td className="px-6 py-4 text-gray-800 font-medium">
          {safe(ticket.regionName, '-')}
        </td>
      )}
      {visibleCols.machine && (
        <td className="px-6 py-4 font-bold text-[#111827]">
          {safe(ticket.machineName)}{!machines?.some(m => m.id === ticket.machineId) && <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span>}
        </td>
      )}
      {visibleCols.bay && (
        <td className="px-6 py-4 text-xs text-gray-500">
          {safe(ticket.bay, '-')}
        </td>
      )}
      {visibleCols.topic && (
        <td className="px-6 py-4">
          <div className="font-medium text-gray-800 max-w-[150px] truncate" title={safe(ticket.topic)}>{safe(ticket.topic)}</div>
          {ticket.isCritical && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
              <i className="ph ph-siren"></i> KRYTYCZNE
            </div>
          )}
        </td>
      )}
      {visibleCols.reporter && (
        <td className="px-6 py-4 text-xs">
          <div className="font-bold text-gray-800">{safe(ticket.reportedBy, 'Nieznany')}</div>
          <div className="text-gray-500 font-mono">{safe(ticket.reporterPhone)}</div>
        </td>
      )}
      {visibleCols.status && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STATUSES[ticket.status || 1]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {STATUSES[ticket.status || 1]?.label || 'Nieznany'}
          </span>
        </td>
      )}
      {visibleCols.service && (
        <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-[120px] truncate" title={safe(ticket.assignedTo, 'Brak')}>
          {ticket.assignedTo ? safe(ticket.assignedTo) : <span className="text-gray-400 italic">Brak przypisania</span>}
        </td>
      )}
      {visibleCols.duration && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-xs text-gray-600 flex items-center gap-1 font-mono">
            <i className="ph ph-clock text-gray-400"></i> {calculateDuration(ticket.createdAt, ticket.closedAt)}
          </div>
        </td>
      )}
      <td className="px-6 py-4">
        <button 
          onClick={() => onOpenDetails(ticket)}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-1 group-hover:border-blue-300 group-hover:text-blue-600"
        >
          <i className="ph ph-caret-right"></i> Szczegóły
        </button>
      </td>
    </tr>
  );
});
export default TicketTableRow;
