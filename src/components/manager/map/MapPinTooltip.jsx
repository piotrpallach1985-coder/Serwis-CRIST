import React from 'react';
import { useTranslation } from 'react-i18next';
import { PIN_STATUS } from '../../../utils/constants';

export default function MapPinTooltip({
  pin,
  modeType,
  tooltipPosClass,
  arrowClass,
  isFullscreen,
  handleMouseEnter,
  handleMouseLeave,
  onNavigateToTickets,
  setCurrentSubmapId,
  setHoveredPin
}) {
  const { t } = useTranslation();
  return (
    <div className={`absolute ${tooltipPosClass} w-44 md:w-56 bg-slate-900/95 backdrop-blur-md text-white p-2 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-50 animate-fade-in`} onMouseEnter={() => handleMouseEnter(pin.id)} onMouseLeave={handleMouseLeave}>
      <div className="font-black text-[10px] md:text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
        <i className={`ph ${pin.type === 'machine' ? 'ph-engine' : 'ph-map-pin'} text-slate-400`}></i>
        {pin.name}
      </div>
      <div className="mt-1 md:mt-3 space-y-1 md:space-y-2 mb-2 md:mb-4">
        <div className="flex justify-between items-center text-[9px] md:text-xs">
          <span className="text-slate-400">{t('map_component.state')}</span>
          {pin.status === PIN_STATUS.CRITICAL ? (<span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? t('map_component.backlog') : t('map_component.critical_fault')}</span>) : pin.status === PIN_STATUS.IN_PROGRESS ? (<span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> {t('map_component.service_in_progress')}</span>) : pin.status === PIN_STATUS.WARNING ? (<span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? t('map_component.approaching_service') : t('map_component.fault')}</span>) : (<span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? t('map_component.no_urgent') : t('map_component.ready')}</span>)}
        </div>
        {pin.type === 'region' && (<div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">Maszyn w rejonie:</span><span className="font-bold">{pin.machineCount}</span></div>)}
        <div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : t('map_component.active_tickets')}</span><span className="font-bold">{pin.itemCount}</span></div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button onClick={(e) => { 
          e.stopPropagation(); 
          if (isFullscreen && document.exitFullscreen) document.exitFullscreen(); 
          if (pin.itemCount === 1 && pin.itemIds?.length === 1) {
            if (modeType === 'planned_maintenance') {
              onNavigateToTickets({ name: pin.name, serviceId: pin.itemIds[0] });
            } else {
              onNavigateToTickets({ name: pin.name, ticketId: pin.itemIds[0] });
            }
          } else {
            onNavigateToTickets(pin.name);
          }
        }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 md:py-2.5 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-center gap-2">
          <i className="ph ph-list-magnifying-glass text-sm md:text-base"></i> {t('map_component.browse')}
        </button>
        {pin.type === 'region' && pin.hasSubmap && (
          <button onClick={(e) => { e.stopPropagation(); setCurrentSubmapId(pin.id); setHoveredPin(null); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 md:py-2.5 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-center gap-2">
            <i className="ph ph-map-trifold text-sm md:text-base"></i> {t('map_component.open_region_map')}
          </button>
        )}
      </div>
      <div className={`absolute w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 ${arrowClass}`}></div>
    </div>
  );
}
