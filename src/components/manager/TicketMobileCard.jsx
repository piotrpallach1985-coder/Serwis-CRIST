import React from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import { safe } from '../../utils/safeRender';

const TicketMobileCard = React.memo(function TicketMobileCard({ ticket, machines, STATUSES, onOpenDetails, isArchive }) {
  const targetDate = isArchive ? ticket.closedAt : ticket.createdAt;
  const dt = safeParseDate(targetDate);
  const dateStr = dt ? dt.toLocaleDateString('pl-PL') : '-';
  const timeStr = dt ? dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '-';
  
  const statusObj = STATUSES[ticket.status || 1] || { label: 'Nieznany', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  const statusLabel = statusObj.label;
  const statusColor = statusObj.color;

  return (
    <div 
      onClick={() => onOpenDetails(ticket)}
      className={`bg-white rounded-xl border-l-4 shadow-sm p-4 cursor-pointer relative transition-all active:scale-[0.98] ${ticket.isCritical ? 'border-red-500' : 'border-blue-500'} border-t border-r border-b border-gray-200`}
    >
      {ticket.isCritical && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
          KRYTYCZNE
        </div>
      )}
      
      <div className="flex justify-between items-start mb-1 pr-6">
        <h3 className="font-bold text-[#003366] text-base leading-tight">
          {safe(ticket.machineName, 'Nieznana Maszyna')}
          {!machines?.some(m => m.id === ticket.machineId) && <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span>}
        </h3>
        <i className="ph ph-caret-right text-gray-400 absolute right-4 top-1/2 -translate-y-1/2"></i>
      </div>
      
      <div className="text-sm text-gray-600 mb-1">
        Rejon: <span className="font-medium text-gray-800">{safe(ticket.regionName, '-')}</span>
      </div>
      
      <div className="text-sm text-gray-600 mb-1 line-clamp-1">
        Temat: {safe(ticket.topic)}
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500 flex flex-col">
          <span>{dateStr}</span>
          <span className="font-medium">{timeStr}</span>
        </div>
        
        <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border tracking-wider ${statusColor}`}>
          {statusLabel}
        </div>
      </div>
    </div>
  );
});
export default TicketMobileCard;