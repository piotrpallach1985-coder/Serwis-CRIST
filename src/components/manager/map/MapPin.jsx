
import React from 'react';
import { PIN_STATUS } from '../../../utils/constants';
import MapPinTooltip from './MapPinTooltip';

export default function MapPin({
  pin,
  mode,
  modeType,
  zoomScale,
  hoveredPin,
  setHoveredPin,
  draggingPin,
  tooltipPos,
  isFullscreen,
  handleMouseEnter,
  handleMouseLeave,
  handlePointerDown,
  handleDeletePin,
  onNavigateToTickets,
  setCurrentSubmapId
}) {
  const isHovered = hoveredPin === pin.id;
  const isDraggingThis = draggingPin?.id === pin.id;
  
  let bgColor = 'bg-emerald-500', ringColor = 'ring-emerald-500/40', isCritical = false, isInProgress = false;
  if (pin.status === PIN_STATUS.CRITICAL) { bgColor = 'bg-red-500'; ringColor = 'ring-red-500/50'; isCritical = true; }
  else if (pin.status === PIN_STATUS.IN_PROGRESS) { bgColor = 'bg-blue-500'; ringColor = 'ring-blue-500/50'; isInProgress = true; }
  else if (pin.status === PIN_STATUS.WARNING) { bgColor = 'bg-amber-500'; ringColor = 'ring-amber-500/40'; }

  const { isNearTop, isNearLeft, isNearRight } = tooltipPos || { isNearTop: false, isNearLeft: false, isNearRight: false };
  let tooltipPosClass = 'bottom-full left-1/2 -translate-x-1/2 mb-4';
  let arrowClass = 'top-full left-1/2 -translate-x-1/2 border-t-slate-900/95';
  if (isNearTop) { tooltipPosClass = 'top-full left-1/2 -translate-x-1/2 mt-4'; arrowClass = 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95'; }
  if (isNearLeft) { tooltipPosClass = isNearTop ? 'top-full left-0 mt-4' : 'bottom-full left-0 mb-4'; arrowClass = isNearTop ? 'bottom-full left-4 border-b-slate-900/95' : 'top-full left-4 border-t-slate-900/95'; }
  else if (isNearRight) { tooltipPosClass = isNearTop ? 'top-full right-0 mt-4' : 'bottom-full right-0 mb-4'; arrowClass = isNearTop ? 'bottom-full right-4 border-b-slate-900/95' : 'top-full right-4 border-t-slate-900/95'; }

  return (
    <div
      className={`absolute group/pin ${isDraggingThis ? 'z-[60]' : (isHovered ? 'z-[50]' : 'z-20')} pointer-events-auto ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%`, transform: `translate(-50%, -50%) scale(${1 / zoomScale})`, transformOrigin: 'center center' }}
      onClick={(e) => { e.stopPropagation(); if (mode === 'view') { if (hoveredPin !== pin.id) handleMouseEnter(pin.id, e); else setHoveredPin(null); } }}
      onMouseEnter={(e) => handleMouseEnter(pin.id, e)}
      onMouseLeave={handleMouseLeave}
      onPointerDown={(e) => handlePointerDown(e, pin)}
    >
      <div className="absolute -inset-2 bg-transparent"></div>
      {isCritical && !isDraggingThis && (<div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>)}
      {isInProgress && !isDraggingThis && (<div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>)}

      <div className={`relative ${pin.type === 'region' && pin.hasSubmap ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-md' : 'w-3 h-3 sm:w-4 sm:h-4 rounded-full'} flex items-center justify-center border-2 border-white shadow-lg transition-all duration-300 ${bgColor} ring-4 ${ringColor} ${isHovered || isDraggingThis ? 'scale-150' : 'scale-100'}`}></div>

      {mode === 'edit' && !isDraggingThis && (
        <button onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); handleDeletePin(pin.id, pin.type); }} className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:bg-red-700 hover:scale-110 z-30 pointer-events-auto" title="Usuń z mapy">
          <i className="ph ph-x text-[9px] md:text-xs font-bold"></i>
        </button>
      )}

      {isHovered && mode === 'view' && (
        <MapPinTooltip 
          pin={pin}
          modeType={modeType}
          tooltipPosClass={tooltipPosClass}
          arrowClass={arrowClass}
          isFullscreen={isFullscreen}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          onNavigateToTickets={onNavigateToTickets}
          setCurrentSubmapId={setCurrentSubmapId}
          setHoveredPin={setHoveredPin}
        />
      )}
    </div>
  );
}
