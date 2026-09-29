import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import TicketMobileCard from './TicketMobileCard';
import DataTable from '../shared/DataTable';
import { safeParseDate } from '../../utils/dateHelpers';
import { safe } from '../../utils/safeRender';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const columns = useMemo(() => [
    {
      header: isArchive ? t('tickets.cols.date_archive') : t('tickets.cols.date_active'),
      accessor: 'date',
      hidden: !visibleCols.date,
      render: (ticket) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-slate-800">
            {isArchive 
              ? (safeParseDate(ticket.closedAt)?.toLocaleDateString('pl-PL') || '-')
              : (safeParseDate(ticket.createdAt)?.toLocaleDateString('pl-PL') || '-')}
          </div>
          <div className="text-xs text-slate-500">
            {isArchive
              ? (safeParseDate(ticket.closedAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-')
              : (safeParseDate(ticket.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-')}
          </div>
        </div>
      )
    },
    {
      header: t('tickets.cols.region'),
      accessor: 'regionName',
      hidden: !visibleCols.region,
      render: (t) => <span className="text-slate-800 font-medium">{safe(t.regionName, '-')}</span>
    },
    {
      header: t('tickets.cols.machine'),
      accessor: 'machineName',
      hidden: !visibleCols.machine,
      render: (ticket) => (
        <span className="font-bold text-[#111827]">
          {safe(ticket.machineName)}{!machines?.some(m => m.id === ticket.machineId) && <span className="text-red-500 font-bold ml-1">{t('tickets.table.deleted_machine')}</span>}
        </span>
      )
    },
    {
      header: t('tickets.cols.bay'),
      accessor: 'bay',
      hidden: !visibleCols.bay,
      render: (t) => <span className="text-xs text-slate-500">{safe(t.bay, '-')}</span>
    },
    {
      header: t('tickets.cols.topic'),
      accessor: 'topic',
      hidden: !visibleCols.topic,
      render: (ticket) => (
        <>
          <div className="font-medium text-slate-800 max-w-[150px] truncate" title={safe(ticket.topic)}>{safe(ticket.topic)}</div>
          {ticket.isCritical && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
              <i className="ph ph-siren"></i> {t('tickets.table.critical')}
            </div>
          )}
        </>
      )
    },
    {
      header: t('tickets.cols.reporter'),
      accessor: 'reportedBy',
      hidden: !visibleCols.reporter,
      render: (ticket) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800">{safe(ticket.reportedBy, t('tickets.table.unknown_reporter'))}</div>
          {ticket.reporterType && <div className="text-slate-500 mt-0.5">{ticket.reporterType}</div>}
        </div>
      )
    },
    {
      header: t('tickets.cols.status'),
      accessor: 'status',
      hidden: !visibleCols.status,
      render: (ticket) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${STATUSES[ticket.status]?.color || 'bg-slate-100 text-slate-800'}`}>
          {STATUSES[ticket.status]?.label || t('tickets.statuses.unknown')}
        </span>
      )
    },
    {
      header: t('tickets.cols.service'),
      accessor: 'assignedTo',
      hidden: !visibleCols.service,
      render: (ticket) => (
        <div className="text-sm font-medium text-slate-600 max-w-[120px] truncate" title={safe(ticket.assignedTo, t('tickets.duration.no_data'))}>
          {ticket.assignedTo ? safe(ticket.assignedTo) : <span className="text-slate-400 italic">{t('tickets.table.no_service')}</span>}
        </div>
      )
    },
    {
      header: t('tickets.cols.duration'),
      accessor: 'duration',
      hidden: !visibleCols.duration,
      render: (ticket) => {
        const durationStr = calculateDuration(ticket.createdAt, ticket.closedAt, t);
        return <span className="text-xs font-bold text-slate-800">{durationStr}</span>;
      }
    },
    {
      header: t('tickets.actions.details'),
      accessor: 'actions',
      align: 'right',
      render: (ticket) => (
        <button 
          onClick={(e) => { e.stopPropagation(); openDetails(ticket); }} 
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm"
        >
          {t('tickets.actions.details')} <i className="ph ph-caret-right font-bold"></i>
        </button>
      )
    }
  ], [visibleCols, isArchive, STATUSES, machines, calculateDuration, openDetails]);

  return (
    <div className="w-full">
      <DataTable 
        data={currentItems}
        columns={columns}
        emptyMessage={t('tickets.table.empty')}
        onRowClick={(ticket) => openDetails(ticket)}
        renderMobileCard={(ticket) => (
          <TicketMobileCard 
            key={ticket.id} 
            ticket={ticket} 
            machines={machines} 
            STATUSES={STATUSES} 
            onOpenDetails={openDetails} 
            isArchive={isArchive} 
          />
        )}
      />
      
      {/* Pagination Controls */}
      {hasMoreLocalItems && (
        <div className="p-4 flex justify-center mt-4">
          <button 
            onClick={() => setCurrentPage(p => p + 1)} 
            className="px-6 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-all shadow-sm"
          >
            {t('tickets.table.load_more')}{filteredTickets.length - currentItems.length})
          </button>
        </div>
      )}
      {isArchive && hasMoreArchive && !hasMoreLocalItems && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-center mt-4 rounded-b-xl">
          <button 
            onClick={() => fetchArchive(true)} 
            disabled={loadingArchive} 
            className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded transition-colors disabled:opacity-50"
          >
            {loadingArchive ? t('tickets.table.loading') : t('tickets.table.load_archive')}
          </button>
        </div>
      )}
    </div>
  );
}

TicketTable.propTypes = {
  filteredTickets: PropTypes.array.isRequired,
  currentItems: PropTypes.array.isRequired,
  visibleCols: PropTypes.object.isRequired,
  isArchive: PropTypes.bool,
  STATUSES: PropTypes.object.isRequired,
  machines: PropTypes.array,
  calculateDuration: PropTypes.func.isRequired,
  openDetails: PropTypes.func.isRequired,
  hasMoreLocalItems: PropTypes.bool,
  setCurrentPage: PropTypes.func.isRequired,
  hasMoreArchive: PropTypes.bool,
  fetchArchive: PropTypes.func.isRequired,
  loadingArchive: PropTypes.bool
};
