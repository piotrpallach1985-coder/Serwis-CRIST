import React from 'react';
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
  if (hoveredPin !== 'unpinned_items') return null;

  return (
    <div className="absolute right-[110%] top-0 w-44 md:w-56 bg-slate-900/95 backdrop-blur-md text-white p-2 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-[60] animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="font-black text-[10px] md:text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
        <i className="ph ph-push-pin text-slate-400"></i>
        {currentSubmapId ? 'Bez pineski' : 'Bez rejonu'}
      </div>
      <div className="mt-1 md:mt-3 space-y-1 md:space-y-2 mb-2 md:mb-4">
        <div className="flex justify-between items-center text-[9px] md:text-xs">
          <span className="text-slate-400">Stan:</span>
          {unpinnedData.status === PIN_STATUS.CRITICAL ? (<span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? 'ZALEGŁOŚCI' : 'AWARIA KRYTYCZNA'}</span>) : unpinnedData.status === PIN_STATUS.IN_PROGRESS ? (<span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> Serwis w trakcie</span>) : unpinnedData.status === PIN_STATUS.WARNING ? (<span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? 'Zbliża się serwis' : 'Usterka'}</span>) : (<span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? 'Brak pilnych' : 'Gotowe'}</span>)}
        </div>
        <div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">Maszynę w rejonie:</span><span className="font-bold">{unpinnedData.unpinnedMachineCount}</span></div>
        <div className="flex justify-between items-center text-[9px] md:text-xs"><span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : 'Aktywne zgłoszenia:'}</span><span className="font-bold">{unpinnedData.unpinnedCount}</span></div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button onClick={(e) => { 
          e.stopPropagation(); 
          if (isFullscreen) document.exitFullscreen?.(); 
          setHoveredPin(null); 
          if (onNavigateToTickets) {
            if (unpinnedData.unpinnedCount === 1 && unpinnedData.itemIds?.length === 1) {
              if (modeType === 'planned_maintenance') {
                onNavigateToTickets({ name: currentSubmapId ? 'Bez pineski' : 'Bez rejonu', serviceId: unpinnedData.itemIds[0] });
              } else {
                onNavigateToTickets({ name: currentSubmapId ? 'Bez pineski' : 'Bez rejonu', ticketId: unpinnedData.itemIds[0] });
              }
            } else {
              onNavigateToTickets(currentSubmapId ? 'Bez pineski' : 'Bez rejonu');
            }
          }
        }} className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-[9px] md:text-xs transition-colors flex items-center justify-center gap-2`}>
          {modeType === 'planned_maintenance' ? 'Przejdż do serwisów' : 'Przejdż do awarii'} <i className="ph ph-arrow-right"></i>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 border-[6px] border-transparent border-l-slate-900/95 pointer-events-none"></div>
    </div>
  );
}
