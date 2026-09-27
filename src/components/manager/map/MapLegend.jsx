import React from 'react';
import { TICKET_STATUS, SERVICE_STATUS } from '../../../utils/constants';
import { safeParseDate } from '../../../utils/dateHelpers';
import MapUnpinnedPanel from './MapUnpinnedPanel';

export default function MapLegend({
  mode,
  modeType,
  currentSubmapId,
  machines,
  tickets,
  plannedServices,
  unpinnedData,
  hoveredPin,
  setHoveredPin,
  handleMouseEnter,
  handleMouseLeave,
  onNavigateToTickets,
  isFullscreen
}) {
  if (mode !== 'view') return null;

  const getUnpinnedColor = () => { if (unpinnedData.status === 'critical') return 'text-red-500'; if (unpinnedData.status === 'in_progress') return 'text-blue-500'; if (unpinnedData.status === 'warning') return 'text-amber-500'; return 'text-emerald-500'; };
  const getUnpinnedBgColor = () => { if (unpinnedData.status === 'critical') return 'text-red-500/80'; if (unpinnedData.status === 'in_progress') return 'text-blue-500/80'; if (unpinnedData.status === 'warning') return 'text-amber-500/80'; return 'text-emerald-500/80'; };
  const getUnpinnedPulse = () => unpinnedData.status === 'critical' || unpinnedData.status === 'in_progress' ? 'animate-pulse' : '';

  if (modeType === 'tickets') {
    return (
      <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[220px] scale-[0.65] lg:scale-100 origin-top-right">
        <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">{currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Awarii'}</div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Wszystkie maszyny</span><span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span></div>
        <div className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors" onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)} onMouseLeave={handleMouseLeave} onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}>
          <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> {currentSubmapId ? 'Bez pineski' : 'Bez rejonu'}</span>
          <span className={`font-bold text-lg ${getUnpinnedBgColor()}`}>{unpinnedData.unpinnedMachineCount}</span>
          <MapUnpinnedPanel 
            hoveredPin={hoveredPin} 
            unpinnedData={unpinnedData} 
            currentSubmapId={currentSubmapId} 
            modeType={modeType} 
            isFullscreen={isFullscreen} 
            setHoveredPin={setHoveredPin} 
            onNavigateToTickets={onNavigateToTickets} 
          />
        </div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Zgłoszone awarie</span><span className="font-bold text-lg text-amber-400">{currentSubmapId ? tickets.filter(t => t.regionId === currentSubmapId && Number(t.status) !== TICKET_STATUS.CLOSED).length : tickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED).length}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Krytyczne</span><span className="font-bold text-lg text-rose-500">{currentSubmapId ? tickets.filter(t => t.regionId === currentSubmapId && t.isCritical && Number(t.status) !== TICKET_STATUS.CLOSED).length : tickets.filter(t => t.isCritical && Number(t.status) !== TICKET_STATUS.CLOSED).length}</span></div>
      </div>
    );
  }

  if (modeType === 'planned_maintenance') {
    return (
      <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[240px] scale-[0.65] lg:scale-100 origin-top-right">
        <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">{currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Serwisów'}</div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Wszystkie maszyny</span><span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span></div>
        <div className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors" onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)} onMouseLeave={handleMouseLeave} onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}>
          <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> {currentSubmapId ? 'Bez pineski' : 'Bez rejonu'}</span>
          <span className={`font-bold text-lg ${getUnpinnedBgColor()}`}>{unpinnedData.unpinnedMachineCount}</span>
          <MapUnpinnedPanel 
            hoveredPin={hoveredPin} 
            unpinnedData={unpinnedData} 
            currentSubmapId={currentSubmapId} 
            modeType={modeType} 
            isFullscreen={isFullscreen} 
            setHoveredPin={setHoveredPin} 
            onNavigateToTickets={onNavigateToTickets} 
          />
        </div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Planowane (30 dni)</span><span className="font-bold text-lg text-amber-400">{(() => { const now = new Date(); return plannedServices.filter(srv => { if (srv.status === SERVICE_STATUS.COMPLETED || srv.status === SERVICE_STATUS.IN_PROGRESS) return false; const machine = machines.find(m => m.id === srv.machineId); if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false; if (srv.nextDate && safeParseDate(srv.nextDate) < now) return false; if (srv.nextDate) { const diffDays = Math.ceil(Math.abs(safeParseDate(srv.nextDate) - now) / (1000 * 60 * 60 * 24)); if (diffDays <= 30) return true; } if (srv.targetWorkHours && machine && !( machine.currentWorkHours >= srv.targetWorkHours) && srv.hoursInterval && (srv.targetWorkHours - machine.currentWorkHours) <= 30 * 8) return true; return false; }).length; })()}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">Przekroczone / Pilne</span><span className="font-bold text-lg text-rose-500">{(() => { const now = new Date(); return plannedServices.filter(srv => { if (srv.status === SERVICE_STATUS.COMPLETED || srv.status === SERVICE_STATUS.IN_PROGRESS) return false; const machine = machines.find(m => m.id === srv.machineId); if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false; if (srv.nextDate && safeParseDate(srv.nextDate) < now) return true; if (srv.targetWorkHours && machine && machine.currentWorkHours >= srv.targetWorkHours) return true; return false; }).length; })()}</span></div>
      </div>
    );
  }

  return null;
}
