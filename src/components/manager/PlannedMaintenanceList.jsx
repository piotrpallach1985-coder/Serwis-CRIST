import React from 'react';
import ServiceCalendar from './ServiceCalendar';
import { safeParseDate } from '../../utils/dateHelpers';

export default function PlannedMaintenanceList({
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
                  {columns.nextDate && <th className="px-6 py-4">Termin</th>}
                  {columns.rbg && <th className="px-6 py-4">Termin (RBG)</th>}
                  {columns.priority && <th className="px-6 py-4">Priorytet</th>}
                  {columns.status && <th className="px-6 py-4">Status</th>}
                  {columns.actions && <th className="px-6 py-4 w-12 text-center">Akcje</th>}
</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-400">Brak serwisów pasujących do kryteriów.</td>
                  </tr>
                ) : filteredServices.map(srv => {
                  const machine = getMachine(srv.machineId);
                  const isCompleted = srv.status === 'completed';
                  const rowColor = getStatusColor(srv, machine);
  const isOverdue = (() => {
    if (srv.status === 'completed') return false;
    if ((srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && srv.nextDate) {
      const parsedDate = safeParseDate(srv.nextDate);
      if (parsedDate && parsedDate < new Date()) return true;
    }
    if ((srv.triggerType === 'hours' || srv.triggerType === 'mixed') && srv.targetWorkHours) {
      if ((machine?.currentWorkHours || 0) >= srv.targetWorkHours) return true;
    }
    return false;
  })();
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
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{machine?.name || <>{srv.machineName || 'Nieznana'} <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span></>}</td>
                      )}
                      {columns.region && (
                        <td className="px-6 py-4 font-bold text-slate-600 text-sm">{getMachineRegionName(machine?.regionId)}</td>
                      )}
                      {columns.nextDate && (
                        <td className="px-6 py-4">
                          {srv.triggerType === 'calendar' || srv.triggerType === 'mixed' ? (
                            <div className="text-sm">
                              <div className="font-bold text-slate-800">{srv.nextDate ? safeParseDate(srv.nextDate).toLocaleDateString() : '-'}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">CO {srv.calendarIntervalDays} DNI</div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
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
                          {isCritical ? <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border flex inline-flex items-center gap-1 w-max ${showRedCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><i className="ph ph-warning"></i> KRYTYCZNE</span> : <span className="text-slate-400 text-xs font-bold uppercase">Standard</span>}
                        </td>
                      )}
                      {columns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rowColor}`}>
                            {isCompleted ? 'Zako\u0144czone' : srv.status === 'in_progress' ? 'W trakcie' : (isOverdue ? 'Przekroczony' : 'Oczekuje')}
                          </span>
                        </td>
                      )}
                      {columns.actions && (
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-1 group-hover:border-blue-300 group-hover:text-blue-600">
                              <i className="ph ph-caret-right"></i> Szczegóły
                            </button>
                          </td>
                        )}
</tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-4 mt-2 p-2">
            {filteredServices.length === 0 ? (
              <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak serwisów pasujących do kryteriów.</div>
            ) : filteredServices.map(srv => {
              const machine = getMachine(srv.machineId);
              const isCompleted = srv.status === 'completed';
              const rowColor = getStatusColor(srv, machine);

              const isOverdue = (() => {
                      if (srv.status === 'completed') return false;
                      if ((srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && srv.nextDate) {
                        const parsedDate = safeParseDate(srv.nextDate);
      if (parsedDate && parsedDate < new Date()) return true;
                      }
                      if ((srv.triggerType === 'hours' || srv.triggerType === 'mixed') && srv.targetWorkHours) {
                        if ((machine?.currentWorkHours || 0) >= srv.targetWorkHours) return true;
                      }
                      return false;
                    })();
                    const isCritical = srv.priority === 'Krytyczny';
                    const showRedCritical = false;
return (
<div key={srv.id} onClick={() => setSelectedServiceId(srv.id)} className={`cursor-pointer bg-white p-4 pt-6 rounded-xl shadow-sm border flex flex-col relative hover:bg-slate-50 transition-colors ${showRedCritical ? 'border-red-500 border-l-4' : 'border-slate-200'}`}>
{isCritical && (
<div className={`absolute top-0 right-0 text-white px-2.5 py-1 ${showRedCritical ? "bg-red-500" : "bg-gray-400"} rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm`}>
Wysoki
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
                      {machine?.name || <>{srv.machineName || 'Nieznana maszyna'} <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span></>}
                    </div>
                    
                  </div>
                  
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100 cursor-pointer" onClick={() => setSelectedServiceId(srv.id)}>
                      <div className="flex flex-col gap-1">
                        {(srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            {srv.nextDate ? safeParseDate(srv.nextDate).toLocaleDateString('pl-PL') : '-'}
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
                          Zakończone
                        </div>
                      ) : (
                        <div className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${rowColor}`}>
                          {srv.status === 'in_progress' ? 'W trakcie' : (isOverdue ? 'Przekroczony' : 'Oczekuje')}
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
