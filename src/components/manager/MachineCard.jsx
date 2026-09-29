import PropTypes from 'prop-types';
﻿import React from 'react';

export default function MachineCard({ machine, regions, onClick, onPrintQR, onShowQR, handleCopyNfc }) {
  return (
    <div 
      onClick={() => onClick(machine)}
      className={"bg-white rounded-xl shadow-sm border p-4 cursor-pointer relative transition-all active:scale-[0.98] " + (machine.name?.includes('(DO WERYFIKACJI)') ? 'border-orange-300' : 'border-gray-200 hover:border-blue-400')}
    >
      {machine.name?.includes('(DO WERYFIKACJI)') && (
        <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[9px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl tracking-wider">
          WERYFIKACJA
        </div>
      )}
      
      <div className="pt-1">
        <h4 
          className="font-bold text-[#002b5e] text-base leading-tight mb-1 flex items-center gap-1.5" 
          style={{ marginLeft: `${(machine.depth || 0) * 1}rem` }}
          onClick={(e) => { 
            if (machine.hasChildren) { 
              e.stopPropagation(); 
              toggleNode(machine.id); 
            }
          }}
        >
          {(machine.depth > 0) && <i className="ph ph-arrow-elbow-down-right text-gray-400"></i>}
          {machine.hasChildren && (
            <button className="text-gray-500 hover:text-blue-600 focus:outline-none flex items-center justify-center w-6 h-6 rounded hover:bg-blue-50 transition-colors">
              <i className={`ph ${machine.isCollapsed ? 'ph-caret-right' : 'ph-caret-down'}`}></i>
            </button>
          )}
          <span className={machine.hasChildren ? 'cursor-pointer hover:text-blue-600' : ''}>{machine.name}</span>
        </h4>
        <p className="text-xs font-mono text-gray-400 mb-1">ID: {machine.id}</p>
        
        <div className="text-sm font-semibold text-slate-700 mb-2">
          Nr wew: {machine.internalId || '-'}
        </div>
        
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-1"><i className="ph ph-map-pin"></i> Rejon: {regions.find(r => r.id === machine.regionId)?.name || '-'}</div>
          <div className="flex items-center gap-1"><i className="ph ph-door-open"></i> Hala/Przelot: {machine.bay || '-'}</div>
          <div className="flex items-center gap-1"><i className="ph ph-hourglass"></i> RBG: {machine.currentWorkHours || 0}</div>
        </div>
        {handleCopyNfc && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopyNfc(machine); }} 
            className="mt-3 w-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-purple-600 font-bold text-xs py-1.5 rounded flex justify-center items-center gap-1.5 transition-colors"
          >
            <i className="ph ph-link"></i> Kopiuj ID NFC
          </button>
        )}
      </div>
    </div>
  );
}

MachineCard.propTypes = {
  machine: PropTypes.object.isRequired,
  regions: PropTypes.array.isRequired,
  onClick: PropTypes.func,
  onPrintQR: PropTypes.func,
  onShowQR: PropTypes.func,
  handleCopyNfc: PropTypes.func,
};
