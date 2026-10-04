import { useTranslation } from 'react-i18next';
import EmptyState from '../shared/EmptyState';
import React, { useMemo } from 'react';
import { usePagination } from '../../hooks/usePagination';
import ServiceCalendar from './ServiceCalendar';
import { safeParseDate } from '../../utils/dateHelpers';
import { checkServiceUrgency } from '../../utils/logicHelpers';
import { SERVICE_STATUS } from '../../utils/constants';

export default function PlannedMaintenanceList({
  isArchive,
  viewMode,
  filteredServices,
  columns,
  getMachine,
  getStatusColor,
  getMachineRegionName,
  machines,
  setSelectedServiceId,
  setRbgUpdateModal,
  setNewRbgValue
}) {
  const { t } = useTranslation();
  const { currentItems, hasMore, loadMore } = usePagination(filteredServices, 30, [filteredServices]);

  return (
    <>
      {viewMode === 'calendar' ? (
        <div className="p-2 sm:p-4">
          <ServiceCalendar services={filteredServices} machines={machines} onSelectService={setSelectedServiceId} />
        </div>
      ) : (
        <div className="flex-1">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-white border-b-2 border-slate-100 sticky top-0 z-10">
                <tr>
                  {columns.name && <th className="px-6 py-4">Typ Serwisu</th>}
                  {columns.machine && <th className="px-6 py-4">Maszyna</th>}
                  {columns.region && <th className="px-6 py-4">Rejon</th>}
                  {columns.nextDate && <th className="px-6 py-4">{isArchive ? 'Zakończono' : 'Termin'}</th>}
                  {columns.rbg && <th className="px-6 py-4">Termin (RBG)</th>}
                  {columns.priority && <th className="px-6 py-4">Priorytet</th>}
                  {columns.status && <th className="px-6 py-4">Status</th>}
                  {columns.actions && <th className="px-6 py-4 w-12 text-center">Akcje</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-0"><EmptyState title={t('planned.empty_title')} message={t('planned.empty_message')} icon="ph-calendar-x" /></td>
                  </tr>
                ) : currentItems.map(srv => {
                  const machine = getMachine(srv.machineId);
                  const isCompleted = srv.status === SERVICE_STATUS.COMPLETED;
                  const rowColor = getStatusColor(srv, machine);
  const { isOverdue } = checkServiceUrgency(srv, machine, 30);
  const isCritical = srv.priority === 'Krytyczny';
  const showRedCritical = false;

                  return (
                    <tr key={srv.id} className={`hover:bg-slate-50 transition-colors group ${isCompleted ? 'opacity-70' : ''}`}>
                      {columns.name && (
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{srv.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status maszyny: <span className="text-slate-600">{srv.machineStatus}</span></div>
                        </td>
                      )}
                      {columns.machine && (
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{machine?.name || <>{srv.machineName || 'Nieznana'} <span className="text-red-500 font-bold ml-1">{t('planned.machine_deleted')}</span></>}</td>
                      )}
                      {columns.region && (
                        <td className="px-6 py-4 font-bold text-slate-600 text-sm">{getMachineRegionName(machine?.regionId)}</td>
                      )}
                      {columns.nextDate && (
                        <td className="px-6 py-4">
                          {isArchive ? (
                            <div className="text-sm font-bold text-slate-800">
                              {srv.completedAt ? safeParseDate(srv.completedAt)?.toLocaleDateString('pl-PL') || '-' : '-'}
                            </div>
                          ) : (srv.triggerType === 'calendar' || srv.triggerType === 'mixed' ? (
                              <div className="text-sm">
                                <div className="font-bold text-slate-800">{srv.nextDate ? safeParseDate(srv.nextDate)?.toLocaleDateString('pl-PL') || '-' : '-'}</div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">CO {srv.calendarIntervalDays} DNI</div>
                            </div>
                          ) : <span className="text-slate-300">-</span>)}
                        </td>
                      )}
                      {columns.rbg && (
                        <td className="px-6 py-4">
                          {srv.triggerType === 'hours' || srv.triggerType === 'mixed' ? (
                            <div className="text-sm">
                              <div className="font-bold text-slate-800">Cel: <span className="font-mono">{srv.targetWorkHours}</span></div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400">OBECNIE: <span className="font-mono">{machine?.currentWorkHours || 0}</span></span>
                                {srv.status !== 'completed' && <button onClick={() => { setRbgUpdateModal(machine); setNewRbgValue(machine?.currentWorkHours || 0); }} className="text-blue-500 hover:text-blue-700 ml-1"><i className="ph ph-pencil-simple"></i></button>}
                              </div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      )}
                      {columns.priority && (
                        <td className="px-6 py-4">
                          {isCritical ? <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border flex inline-flex items-center gap-1 w-max ${showRedCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><i className="ph ph-warning"></i> {t('planned.critical').toUpperCase()}</span> : <span className="text-slate-400 text-xs font-bold uppercase">{t('planned.standard')}</span>}
                        </td>
                      )}
                      {columns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rowColor}`}>
                            {isCompleted ? 'Zako\u0144czone' : srv.status === SERVICE_STATUS.IN_PROGRESS ? t('planned.status_in_progress') : (isOverdue ? t('planned.status_overdue') : t('planned.status_pending'))}
                          </span>
                        </td>
                      )}
                      {columns.actions && (
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm ml-auto">
                                {t('planned.details_btn')} <i className="ph ph-caret-right font-bold"></i>
                              </button>
                          </td>
                        )}
</tr>
                  );
                })}
              </tbody></table>
    {hasMore && (
      <div className="p-4 flex justify-center border-t border-gray-100 bg-gray-50">
        <button 
          onClick={loadMore} 
          className="px-6 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-all"
        >
          {t('planned.load_more')}  {filteredServices.length - currentItems.length})
        </button>
      </div>
    )}
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-4 mt-2 p-2">
            {filteredServices.length === 0 ? (
              <EmptyState title={t('planned.empty_title')} message={t('planned.empty_message')} icon="ph-calendar-x" />
            ) : currentItems.map(srv => {
              const machine = getMachine(srv.machineId);
              const isCompleted = srv.status === SERVICE_STATUS.COMPLETED;
              const rowColor = getStatusColor(srv, machine);

              const { isOverdue } = checkServiceUrgency(srv, machine, 30);
                    const isCritical = srv.priority === 'Krytyczny';
                    const showRedCritical = false;
return (
<div key={srv.id} onClick={() => setSelectedServiceId(srv.id)} className={`cursor-pointer bg-white p-4 pt-6 rounded-xl shadow-sm border flex flex-col relative hover:bg-slate-50 transition-colors ${showRedCritical ? 'border-red-500 border-l-4' : 'border-slate-200'}`}>
{isCritical && (
<div className={`absolute top-0 right-0 text-white px-2.5 py-1 ${showRedCritical ? "bg-red-500" : "bg-gray-400"} rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm`}>
{t('planned.high')}
</div>
)}
                  <div className="flex justify-between items-start mb-1">
                    <div className="pr-20">
                      <h4 className="font-bold text-slate-800 text-[15px]">{srv.name}</h4>
                      <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{getMachineRegionName(machine?.regionId)}</div>
                    </div>
                    
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <i className="ph ph-engine text-slate-400 text-base"></i>
                      {machine?.name || <>{srv.machineName || t('planned.unknown_machine')} <span className="text-red-500 font-bold ml-1">{t('planned.machine_deleted')}</span></>}
                    </div>
                    
                  </div>
                  
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100 cursor-pointer">
                      <div className="flex flex-col gap-1">
                        {isArchive ? (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                            {t('planned.completed_date')} {srv.completedAt ? safeParseDate(srv.completedAt)?.toLocaleDateString('pl-PL') || '-' : '-'}
                          </span>
                        ) : (srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <i className="ph ph-calendar text-blue-500 mr-1.5"></i>
                            {srv.nextDate ? safeParseDate(srv.nextDate)?.toLocaleDateString('pl-PL') || '-' : '-'}
                          </span>
                        )}
                        {(srv.triggerType === 'hours' || srv.triggerType === 'mixed') && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            {srv.targetWorkHours} RBG <span className="opacity-50">({machine?.currentWorkHours || 0})</span>
                          </span>
                        )}
                      </div>
                      
                      {isCompleted ? (
                        <div className="border border-green-500 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-green-50">
                          {t('planned.status_completed')}
                        </div>
                      ) : (
                        <div className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${rowColor}`}>
                          {srv.status === SERVICE_STATUS.IN_PROGRESS ? t('planned.status_in_progress') : (isOverdue ? t('planned.status_overdue') : t('planned.status_pending'))}
                        </div>
                      )}
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}


