import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeParseDate } from '../../../utils/dateHelpers';

export default function MachineInfoCard({
  machine,
  parentMachine,
  childMachines,
  regions,
  regionName,
  totalPartsCost,
  setIsWorkHoursModalOpen,
  onViewRelatedMachine,
  onAddChildMachine,
  parts
}) {
  const { t } = useTranslation();

  return (
    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col gap-2">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
          <i className="ph ph-engine"></i>
        </div>
        <div>
          {parentMachine && (
            <div 
              onClick={() => onViewRelatedMachine && onViewRelatedMachine(parentMachine)}
              className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-0.5 cursor-pointer hover:text-blue-800 hover:underline w-fit"
            >
              <i className="ph ph-arrow-u-up-left"></i> {t('machines.details.parentMachine')}{parentMachine.name}
            </div>
          )}
          <h1 className="text-2xl font-black text-gray-900">{machine.name}</h1>
          <div className="text-gray-400 font-mono text-sm">{t('machines.details.id')}{machine.id}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">{t('machines.details.regionLabel')}</div>
          <div className="font-semibold text-gray-800 text-base">{regionName}</div>
          {regions.find(r => r.id === machine.regionId)?.mapImageUrl && (
            <a href={regions.find(r => r.id === machine.regionId).mapImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center gap-1 hover:underline mt-0.5">
              <i className="ph ph-map-trifold"></i> {t('machines.details.submap')}
            </a>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">{t('machines.details.internalIdLabel')}</div>
          <div className="font-semibold text-gray-800 text-base">{machine.internalId || '-'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">{t('machines.details.workHoursLabel')}</div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-800 text-base">{machine.currentWorkHours || 0} {t('machines.details.rbg')}</div>
            <button onClick={() => setIsWorkHoursModalOpen(true)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors" title={`Aktualizuj ${t('machines.details.rbg')}`}>
              <i className="ph ph-pencil-simple"></i>
            </button>
          </div>
          {machine.workHoursHistory && machine.workHoursHistory.length > 0 && (
            <div className="text-[10px] text-gray-400 mt-0.5">{t('machines.details.lastUpdate')}{safeParseDate([...machine.workHoursHistory].sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date)?.toLocaleDateString('pl-PL')}</div>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">{t('machines.details.additionalDescriptionLabel')}</div>
          <div className="font-semibold text-gray-800 text-sm max-w-full break-words">{machine.additionalDescription || '-'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">{t('machines.details.partsCostLabel')}</div>
          <div className="font-semibold text-red-600 text-base">{totalPartsCost.toFixed(2)} {t('machines.details.pln')}</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('machines.details.childMachinesTitle')}</div>
          <button 
            onClick={() => onAddChildMachine && onAddChildMachine(machine.id)}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <i className="ph ph-plus-circle"></i> {t('machines.buttons.add')}
          </button>
        </div>
        {childMachines.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {childMachines.map(child => (
              <li 
                key={child.id} 
                onClick={() => onViewRelatedMachine && onViewRelatedMachine(child)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 p-2 rounded border border-gray-100 cursor-pointer transition-colors"
              >
                <i className="ph ph-gear text-blue-500 text-lg"></i>
                {child.name}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-400 italic">{t('machines.details.noChildMachines')}</div>
        )}
      </div>

      {/* KOMPATYBILNE CZĘŚCI (BOM) */}
      {(() => {
        const compatibleParts = parts.filter(p => p.compatibleMachines && p.compatibleMachines.includes(machine.id));
        if (compatibleParts.length === 0) return null;
        return (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('machines.details.bomTitle')}</div>
            <ul className="flex flex-col gap-2">
              {compatibleParts.map(part => (
                <li 
                  key={part.id} 
                  className="flex items-center justify-between text-sm font-semibold text-gray-700 bg-emerald-50/50 p-2 rounded border border-emerald-100"
                >
                  <div className="flex items-center gap-2">
                    <i className="ph ph-nut text-emerald-600 text-lg"></i>
                    <div>
                      <div className="text-gray-800">{part.name}</div>
                      {part.code && <div className="text-xs text-gray-500 font-mono">{part.code}</div>}
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200 text-gray-600">
                    {t('machines.details.stock')}<span className={part.stock > 0 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>{part.stock} {part.unit || 'pcs.'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}
