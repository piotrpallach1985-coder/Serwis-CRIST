import React from 'react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../shared/EmptyState';
import { safeParseDate } from '../../../utils/dateHelpers';
import { TICKET_STATUS } from '../../../utils/constants';

export default function MachineHistoryPanels({
  history,
  machine,
  machinePartsTx,
  parts,
  totalPartsCost,
  onOpenTicket,
  onOpenService
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Historia Awarii */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="ph ph-warning-circle text-red-500 text-xl"></i> 
            {t('machines.details.breakdownHistory')}
          </h3>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{history.tickets.length} {t('machines.details.ticketsCount')}</span>
        </div>
        <div className="p-0 overflow-y-auto max-h-[400px]">
          {history.tickets.length === 0 ? (
            <EmptyState title={t('machines.details.noBreakdowns')} message={t('machines.details.noBreakdownsMsg')} icon="ph-wrench" />
          ) : (
            <div className="divide-y divide-gray-100">
              {history.tickets.map(ticket => (
                <div key={ticket.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTicket && onOpenTicket(ticket.id, Number(ticket.status) === TICKET_STATUS.CLOSED, machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-800">{ticket.topic || t('machines.details.other')}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${Number(ticket.status) === TICKET_STATUS.CLOSED ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                      {Number(ticket.status) === TICKET_STATUS.CLOSED ? t('machines.details.closed') : t('machines.details.open')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{ticket.description || '-'}</div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{t('machines.details.reportedBy')}<span className="font-semibold text-gray-600">{ticket.reportedBy}</span></span>
                    <span>{ticket.createdAt ? safeParseDate(ticket.createdAt).toLocaleDateString('pl-PL') : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historia Serwisów */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="ph ph-calendar-check text-blue-500 text-xl"></i> 
            {t('machines.details.serviceHistory')}
          </h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{history.services.length} {t('machines.details.servicesCount')}</span>
        </div>
        <div className="p-0 overflow-y-auto max-h-[400px]">
          {history.services.length === 0 ? (
            <EmptyState title={t('machines.details.noServices')} message={t('machines.details.noServicesMsg')} icon="ph-calendar" />
          ) : (
            <div className="divide-y divide-gray-100">
              {history.services.map(s => (
                <div key={s.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenService && onOpenService(s.id, s.status === 'completed', machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-800">{s.name}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.status === 'completed' ? t('machines.details.completed') : t('machines.details.pending')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                    <span>{s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? t('machines.details.calendar') : t('machines.details.mixed'))}</span>
                    <span>{s.completedAt ? safeParseDate(s.completedAt).toLocaleDateString('pl-PL') : (s.nextDate ? t('machines.details.plannedDate') + safeParseDate(s.nextDate).toLocaleDateString('pl-PL') : '-')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Koszty Części */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col xl:col-span-2 mt-2 mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="ph ph-money text-emerald-500 text-xl"></i> 
            {t('machines.details.usedPartsTitle')}
          </h3>
          <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">{totalPartsCost.toFixed(2)} {t('machines.details.pln')}</span>
        </div>
        <div className="p-0 overflow-y-auto max-h-[400px]">
          {machinePartsTx.length === 0 ? (
            <EmptyState title={t('machines.details.noParts')} message={t('machines.details.noPartsMsg')} icon="ph-nut" />
          ) : (
            <div className="divide-y divide-gray-100">
              {machinePartsTx.map(tx => {
                const part = parts.find(p => p.id === tx.partId);
                return (
                <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-800">{part ? part.name : (tx.partName || t('machines.details.unknownPart'))}</div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                      {tx.totalCost ? tx.totalCost.toFixed(2) : (Math.abs(tx.quantity) * (tx.price || 0)).toFixed(2)} {t('machines.details.pln')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{t('machines.details.quantity')}<span className="font-semibold text-gray-600">{Math.abs(tx.quantity)}</span> {part?.unit || 'pcs.'} x {tx.price?.toFixed(2)} {t('machines.details.pln')}</span>
                    <span>{tx.date ? new Date(tx.date).toLocaleDateString('pl-PL') : '-'}</span>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
