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
                  {columns.actions && <th className="px-6 py-4 text-right">Szczegóły</th>}
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

                  return (
                    <tr key={srv.id} className={`hover:bg-slate-50 transition-colors group ${isCompleted ? 'opacity-70' : ''}`}>
                      {columns.name && (
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{srv.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status maszyny: <span className="text-slate-600">{srv.machineStatus}</span></div>
                        </td>
                      )}
                      {columns.machine && (
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{machine?.name || 'Nieznana'}</td>
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
                                <button onClick={() => { setRbgUpdateModal(machine); setNewRbgValue(machine?.currentWorkHours || 0); }} className="text-blue-500 hover:text-blue-700 ml-1"><i className="ph ph-pencil-simple"></i></button>
                              </div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      )}
                      {columns.priority && (
                        <td className="px-6 py-4">
                          {srv.priority === 'Krytyczny' ? <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-red-100 flex inline-flex items-center gap-1 w-max"><i className="ph ph-warning"></i> KRYTYCZNE</span> : <span className="text-slate-400 text-xs font-bold uppercase">Standard</span>}
                        </td>
                      )}
                      {columns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rowColor}`}>
                            {isCompleted ? 'Zakończone' : srv.status === 'in_progress' ? 'W trakcie' : 'Oczekuje'}
                          </span>
                        </td>
                      )}
                      {columns.actions && (
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-2 group-hover:border-blue-300 group-hover:text-blue-600">
                            Szczegóły
                            <i className="ph ph-caret-right"></i>
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

              return (
                <div key={srv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-20">
                      <h4 className="font-bold text-slate-800 text-[15px]">{srv.name}</h4>
                      <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{getMachineRegionName(machine?.regionId)}</div>
                    </div>
                    <span className={`absolute top-4 right-4 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${rowColor}`}>
                      {isCompleted ? 'Zakończone' : srv.status === 'in_progress' ? 'W trakcie' : 'Oczekuje'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <i className="ph ph-engine text-slate-400 text-base"></i>
                      {machine?.name || 'Nieznana maszyna'}
                    </div>
                    {srv.priority === 'Krytyczny' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 w-max px-2 py-1 rounded border border-red-100"><i className="ph ph-warning"></i> KRYTYCZNY</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      {(srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && (
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <i className="ph ph-calendar-blank text-slate-400"></i>
                          {srv.nextDate ? safeParseDate(srv.nextDate).toLocaleDateString() : '-'}
                        </span>
                      )}
                      {(srv.triggerType === 'hours' || srv.triggerType === 'mixed') && (
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <i className="ph ph-hourglass text-slate-400"></i>
                          Cel: {srv.targetWorkHours} <span className="text-slate-400 font-normal">({machine?.currentWorkHours || 0})</span>
                        </span>
                      )}
                    </div>
                    <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-2 group-hover:border-blue-300 group-hover:text-blue-600">
                      Szczegóły
                      <i className="ph ph-caret-right"></i>
                    </button>
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
