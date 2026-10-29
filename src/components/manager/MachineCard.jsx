import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import React from 'react';
import { isVehicleAsset } from '../../utils/fieldServiceHelpers';

export default function MachineCard({ machine, regions, onClick, onPrintQR, onShowQR, handleCopyNfc, toggleNode }) {
  const { t } = useTranslation();
  const isVehicle = isVehicleAsset(machine);

  return (
    <div 
      onClick={() => onClick(machine)}
      className={"bg-white rounded-xl shadow-sm border p-4 cursor-pointer relative transition-all active:scale-[0.98] " + (machine.name?.includes('(DO WERYFIKACJI)') ? 'border-orange-300' : 'border-gray-200 hover:border-blue-400')}
    >
      {machine.name?.includes('(DO WERYFIKACJI)') && (
        <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[9px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl tracking-wider">
          {t('machines.card.verification')}
        </div>
      )}
      
      <div className="pt-1">
        <h4 
          className="font-bold text-[#002b5e] text-base leading-tight mb-1 flex items-center gap-1.5" 
          style={{ marginLeft: `${(machine.depth || 0) * 1}rem` }}
          onClick={(e) => { 
            if (machine.hasChildren && toggleNode) { 
              e.stopPropagation(); 
              toggleNode(machine.id); 
            }
          }}
        >
          {(machine.depth > 0) && <i className="ph ph-arrow-elbow-down-right text-gray-400"></i>}
          {machine.hasChildren && (
            <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 focus:outline-none flex items-center justify-center w-6 h-6 rounded transition-colors shadow-sm">
              <i className={`ph ${machine.isCollapsed ? 'ph-caret-right' : 'ph-caret-down'}`}></i>
            </button>
          )}
          <span className={machine.hasChildren ? 'cursor-pointer hover:text-blue-600' : ''}>{machine.name}</span>
          {machine.licensePlate && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-bold">
              {machine.licensePlate}
            </span>
          )}
        </h4>
        <p className="text-xs font-mono text-gray-400 mb-1">{t('machines.card.id')}{machine.id}</p>
        
        <div className="text-sm font-semibold text-slate-700 mb-2">
          {t('machines.card.internalId')}{machine.internalId || '-'}
        </div>
        
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-1">
            <i className="ph ph-map-pin"></i> {t('machines.card.region')}
            {machine.regionId === 'main_map'
              ? isVehicle
                ? t('machines.form.wholeCompanyRegion', 'Cała Firma')
                : t('machines.form.mainMapRegion', 'Mapa Główna')
              : regions.find(r => r.id === machine.regionId)?.name || '-'}
          </div>
          <div className="flex items-center gap-1"><i className="ph ph-door-open"></i> {t('machines.card.bay')}{machine.bay || '-'}</div>
          <div className="flex items-center gap-1">
            <i className={`ph ${machine.counterUnit === 'km' || isVehicle ? 'ph-gauge' : 'ph-hourglass'}`}></i>{' '}
            {machine.counterUnit === 'km' || isVehicle
              ? `Przebieg: ${machine.currentWorkHours || 0} km`
              : `${t('machines.card.rbg')}${machine.currentWorkHours || 0}`}
          </div>
        </div>
        {handleCopyNfc && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopyNfc(machine); }} 
            className="mt-3 w-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-purple-600 font-bold text-xs py-1.5 rounded flex justify-center items-center gap-1.5 transition-colors"
          >
            <i className="ph ph-link"></i> {t('machines.card.copyNfc')}
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
  toggleNode: PropTypes.func,
};
