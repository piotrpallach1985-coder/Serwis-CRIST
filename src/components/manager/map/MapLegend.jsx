import React from 'react';
import { useTranslation } from 'react-i18next';
import { TICKET_STATUS, SERVICE_STATUS } from '../../../utils/constants';
import { safeParseDate } from '../../../utils/dateHelpers';
import MapUnpinnedPanel from './MapUnpinnedPanel';

function getSubmapTreeIds(rootId, regions = []) {
  if (!rootId) return null;
  const set = new Set([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const curr = queue.shift();
    regions.forEach(r => {
      if (!r.isDeleted && r.parentId === curr && !set.has(r.id)) {
        set.add(r.id);
        queue.push(r.id);
      }
    });
  }
  return set;
}

export default function MapLegend({
  mode,
  modeType,
  currentSubmapId,
  regions = [],
  machines: rawMachines = [],
  tickets = [],
  plannedServices = [],
  unpinnedData,
  hoveredPin,
  setHoveredPin,
  handleMouseEnter,
  handleMouseLeave,
  onNavigateToTickets,
  isFullscreen
}) {
  const { t } = useTranslation();

  if (mode !== 'view') return null;

  const machines = rawMachines.filter(m => (!m.parentId || m.parentId === '') && !m.isDeleted);
  const submapTreeIds = getSubmapTreeIds(currentSubmapId, regions);
  const submapMachineIds = submapTreeIds
    ? new Set(machines.filter(m => submapTreeIds.has(m.regionId)).map(m => m.id))
    : null;

  const getUnpinnedColor = () => { if (unpinnedData.status === 'critical') return 'text-red-500'; if (unpinnedData.status === 'in_progress') return 'text-blue-500'; if (unpinnedData.status === 'warning') return 'text-amber-500'; return 'text-emerald-500'; };
  const getUnpinnedBgColor = () => { if (unpinnedData.status === 'critical') return 'text-red-500/80'; if (unpinnedData.status === 'in_progress') return 'text-blue-500/80'; if (unpinnedData.status === 'warning') return 'text-amber-500/80'; return 'text-emerald-500/80'; };
  const getUnpinnedPulse = () => unpinnedData.status === 'critical' || unpinnedData.status === 'in_progress' ? 'animate-pulse' : '';

  if (modeType === 'tickets') {
    const matchesSubmapTicket = (tItem) => {
      if (!submapTreeIds) return true;
      return submapTreeIds.has(tItem.regionId) || (submapMachineIds && submapMachineIds.has(tItem.machineId));
    };

    return (
      <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[220px] scale-[0.65] lg:scale-100 origin-top-right">
        <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">{currentSubmapId ? t('map_component.stats_region') : t('map_component.stats_tickets')}</div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.all_machines')}</span><span className="font-bold text-lg">{submapTreeIds ? machines.filter(m => submapTreeIds.has(m.regionId)).length : machines.length}</span></div>
        <div className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors" onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)} onMouseLeave={handleMouseLeave} onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}>
          <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> {currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region')}</span>
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
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.reported_tickets')}</span><span className="font-bold text-lg text-amber-400">{tickets.filter(tItem => matchesSubmapTicket(tItem) && Number(tItem.status) !== TICKET_STATUS.CLOSED).length}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.critical')}</span><span className="font-bold text-lg text-rose-500">{tickets.filter(tItem => matchesSubmapTicket(tItem) && tItem.isCritical && Number(tItem.status) !== TICKET_STATUS.CLOSED).length}</span></div>
      </div>
    );
  }

  if (modeType === 'planned_maintenance') {
    return (
      <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[240px] scale-[0.65] lg:scale-100 origin-top-right">
        <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">{currentSubmapId ? t('map_component.stats_region') : t('map_component.stats_services')}</div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.all_machines')}</span><span className="font-bold text-lg">{submapTreeIds ? machines.filter(m => submapTreeIds.has(m.regionId)).length : machines.length}</span></div>
        <div className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors" onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)} onMouseLeave={handleMouseLeave} onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}>
          <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> {currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region')}</span>
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
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.planned_30d')}</span><span className="font-bold text-lg text-amber-400">{(() => { const now = new Date(); return plannedServices.filter(srv => { if (srv.status === SERVICE_STATUS.COMPLETED || srv.status === SERVICE_STATUS.IN_PROGRESS) return false; const machine = machines.find(m => m.id === srv.machineId); if (submapTreeIds && (!machine || !submapTreeIds.has(machine.regionId))) return false; if (srv.nextDate && safeParseDate(srv.nextDate) < now) return false; if (srv.nextDate) { const diffDays = Math.ceil(Math.abs(safeParseDate(srv.nextDate) - now) / (1000 * 60 * 60 * 24)); if (diffDays <= 30) return true; } if (srv.targetWorkHours && machine && !( machine.currentWorkHours >= srv.targetWorkHours) && srv.hoursInterval && (srv.targetWorkHours - machine.currentWorkHours) <= 30 * 8) return true; return false; }).length; })()}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-[10px] md:text-sm font-medium text-slate-300">{t('map_component.overdue_urgent')}</span><span className="font-bold text-lg text-rose-500">{(() => { const now = new Date(); return plannedServices.filter(srv => { if (srv.status === SERVICE_STATUS.COMPLETED || srv.status === SERVICE_STATUS.IN_PROGRESS) return false; const machine = machines.find(m => m.id === srv.machineId); if (submapTreeIds && (!machine || !submapTreeIds.has(machine.regionId))) return false; if (srv.nextDate && safeParseDate(srv.nextDate) < now) return true; if (srv.targetWorkHours && machine && machine.currentWorkHours >= srv.targetWorkHours) return true; return false; }).length; })()}</span></div>
      </div>
    );
  }

  return null;
}
