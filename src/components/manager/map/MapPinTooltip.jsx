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
  onOpenSubmap,
  onSetupSubmap,
  setHoveredPin,
}) {
  const { t } = useTranslation();
  const parallelSubmaps = Array.isArray(pin.submaps) ? pin.submaps : [];

  const openRegionSubmap = (submapTabId = null) => {
    if (onOpenSubmap) {
      onOpenSubmap(pin.id, submapTabId);
    } else {
      setCurrentSubmapId(pin.id);
    }
    setHoveredPin(null);
  };

  return (
    <div
      className={`absolute ${tooltipPosClass} w-52 md:w-64 bg-slate-900/95 backdrop-blur-md text-white p-2.5 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-50 animate-fade-in`}
      onMouseEnter={() => handleMouseEnter(pin.id)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="mb-1 pb-2 border-b border-slate-700">
        <div className="font-black text-[10px] md:text-sm flex items-center gap-2">
          <i className={`ph ${pin.type === 'machine' ? 'ph-engine' : 'ph-map-pin'} text-slate-400 shrink-0`}></i>
          <span className="truncate">{pin.name}</span>
        </div>
        {pin.address && (
          <div className="text-[9px] md:text-[10px] text-emerald-300 font-medium mt-1 line-clamp-2 flex items-start gap-1">
            <i className="ph ph-navigation-arrow shrink-0 mt-0.5"></i>
            <span>{pin.address}</span>
          </div>
        )}
      </div>
      <div className="mt-1 md:mt-2.5 space-y-1 md:space-y-1.5 mb-2 md:mb-3.5">
        <div className="flex justify-between items-center text-[9px] md:text-xs">
          <span className="text-slate-400">{t('map_component.state')}</span>
          {pin.status === PIN_STATUS.CRITICAL ? (
            <span className="font-bold text-red-400 flex items-center gap-1">
              <i className="ph ph-siren animate-pulse"></i>{' '}
              {modeType === 'planned_maintenance' ? t('map_component.backlog') : t('map_component.critical_fault')}
            </span>
          ) : pin.status === PIN_STATUS.IN_PROGRESS ? (
            <span className="font-bold text-blue-400 flex items-center gap-1">
              <i className="ph ph-wrench animate-pulse"></i> {t('map_component.service_in_progress')}
            </span>
          ) : pin.status === PIN_STATUS.WARNING ? (
            <span className="font-bold text-amber-400">
              {modeType === 'planned_maintenance' ? t('map_component.approaching_service') : t('map_component.fault')}
            </span>
          ) : (
            <span className="font-bold text-emerald-400">
              {modeType === 'planned_maintenance' ? t('map_component.no_urgent') : t('map_component.ready')}
            </span>
          )}
        </div>
        {pin.type === 'region' && (
          <div className="flex justify-between items-center text-[9px] md:text-xs">
            <span className="text-slate-400">
              {t('map_component.machines_in_region', 'Urządzeń w miejscu montażu:')}
            </span>
            <span className="font-bold">{pin.machineCount}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[9px] md:text-xs">
          <span className="text-slate-400">
            {modeType === 'planned_maintenance'
              ? t('map_component.pending_services', 'Zaległe/Oczekujące serwisy:')
              : t('map_component.active_tickets')}
          </span>
          <span className="font-bold">{pin.itemCount}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={(e) => {
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
          }}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 md:py-2 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-center gap-2"
        >
          <i className="ph ph-list-magnifying-glass text-sm md:text-base"></i> {t('map_component.browse')}
        </button>

        {pin.type === 'region' && (
          parallelSubmaps.length > 1 ? (
            <div className="space-y-1.5 pt-1 border-t border-slate-700/80">
              <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Podmapy / Piętra ({parallelSubmaps.length}):</span>
              </div>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                {parallelSubmaps.map(sub => {
                  const dotColor =
                    sub.status === PIN_STATUS.CRITICAL
                      ? 'bg-red-500 animate-pulse'
                      : sub.status === PIN_STATUS.IN_PROGRESS
                        ? 'bg-blue-400'
                        : sub.status === PIN_STATUS.WARNING
                          ? 'bg-amber-400'
                          : 'bg-emerald-400';
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRegionSubmap(sub.id);
                      }}
                      className="w-full bg-blue-600/90 hover:bg-blue-600 text-white font-bold py-1.5 px-2.5 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                        <i className="ph ph-stack text-xs shrink-0"></i>
                        <span className="truncate">{sub.name}</span>
                      </span>
                      {sub.itemCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900/70 text-[9px] font-extrabold shrink-0">
                          {sub.itemCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : pin.hasSubmap ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRegionSubmap(parallelSubmaps[0]?.id || null);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 md:py-2 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-center gap-2"
            >
              <i className="ph ph-map-trifold text-sm md:text-base"></i>{' '}
              <span>
                {t('map_component.open_region_map', 'Otwórz podmapę')}
                {parallelSubmaps.length === 1 &&
                parallelSubmaps[0].name &&
                parallelSubmaps[0].name !== 'Podmapa 1'
                  ? ` (${parallelSubmaps[0].name})`
                  : ''}
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSetupSubmap) {
                  onSetupSubmap(pin.id);
                } else {
                  openRegionSubmap(null);
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 md:py-2 rounded-lg text-[9px] md:text-xs transition-colors shadow flex items-center justify-center gap-2"
            >
              <i className="ph ph-map-trifold text-sm md:text-base"></i>{' '}
              {t('map_component.setup_region_map', 'Ustaw mapę rejonu')}
            </button>
          )
        )}
      </div>
      <div className={`absolute w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 ${arrowClass}`}></div>
    </div>
  );
}
