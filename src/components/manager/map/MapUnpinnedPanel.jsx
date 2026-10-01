import React from 'react';
import { useTranslation } from 'react-i18next';
import { PIN_STATUS } from '../../../utils/constants';

export default function MapUnpinnedPanel({
  hoveredPin,
  unpinnedData,
  currentSubmapId,
  modeType,
  isFullscreen,
  setHoveredPin,
  onNavigateToTickets
}) {
  const { t } = useTranslation();

  if (hoveredPin !== 'unpinned_items') return null;

  return (
    <div className="absolute right-[110%] top-0 w-44 md:w-56 bg-slate-900/95 backdrop-blur-md text-white p-2 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-[60] animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="font-black text-[10px] md:text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
        <i className="ph ph-push-pin text-slate-400"></i>
        {currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region')}
      </div>
      <div className="mt-1 md:mt-3 space-y-1 md:space-y-2 mb-2 md:mb-4">
        <div className="flex justify-between items-center text-[9px] md:text-xs">
          <span className="text-slate-400">{t('map_component.state')}</span>
          {unpinnedData.status === PIN_STATUS.CRITICAL ? (<span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? t('map_component.backlog') : t('map_component.critical_fault')}</span>) : unpinnedData.status === PIN_STATUS.IN_PROGRESS ? (<span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> {t('map_component.service_in_progress')}</span>) : unpinnedData.status === PIN_STATUS.WARNING ? (<span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? t('map_component.approaching_service') : t('map_component.fault')}</span>) : (<span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? t('map_component.no_urgent') : t('map_component.ready')}</span>)}
        </div>
        <div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">{t('map_component.machines_in_region')}</span><span className="font-bold">{unpinnedData.unpinnedMachineCount}</span></div>
        <div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">{modeType === 'planned_maintenance' ? t('map_component.overdue_pending_services') : t('map_component.active_tickets')}</span><span className="font-bold">{unpinnedData.unpinnedCount}</span></div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button onClick={(e) => { 
          e.stopPropagation(); 
          if (isFullscreen) document.exitFullscreen?.(); 
          setHoveredPin(null); 
          if (onNavigateToTickets) {
            if (unpinnedData.unpinnedCount === 1 && unpinnedData.itemIds?.length === 1) {
              if (modeType === 'planned_maintenance') {
                onNavigateToTickets({ name: currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region'), serviceId: unpinnedData.itemIds[0] });
              } else {
                onNavigateToTickets({ name: currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region'), ticketId: unpinnedData.itemIds[0] });
              }
            } else {
              onNavigateToTickets(currentSubmapId ? t('map_component.unpinned_items') : t('map_component.unassigned_region'));
            }
          }
        }} className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-[9px] md:text-xs transition-colors flex items-center justify-center gap-2`}>
          {modeType === 'planned_maintenance' ? t('map_component.go_to_services') : t('map_component.go_to_tickets')} <i className="ph ph-arrow-right"></i>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 border-[6px] border-transparent border-l-slate-900/95 pointer-events-none"></div>
    </div>
  );
}
