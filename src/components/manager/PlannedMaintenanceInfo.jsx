import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeParseDate } from '../../utils/dateHelpers';

export default function PlannedMaintenanceInfo({ srv, machine, parts, actualPartsUsed, getMachineRegionName, regions }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Nagłówek serwisu */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-2xl font-black text-slate-800">{srv.name}</h2>
            <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
              <i className="ph ph-engine text-lg text-slate-400"></i>
              {machine?.name || <>{srv.machineName || 'Nieznana maszyna'} <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span></>}
              {' '}({getMachineRegionName(machine?.regionId)})
              {(regions || []).find(r => r.id === machine?.regionId)?.mapImageUrl && (
                <a href={(regions || []).find(r => r.id === machine?.regionId).mapImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2 inline-flex items-center gap-1">
                  <i className="ph ph-map-trifold"></i> Podmapa
                </a>
              )}
            </div>
          </div>
          <div>
            {srv.priority === 'Krytyczny' ? (
              <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-red-100 flex items-center gap-1 shadow-sm">
                <i className="ph ph-warning"></i> KRYTYCZNY
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm">Standard</span>
            )}
          </div>
        </div>

        {/* Parametry */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-clock text-base"></i> Wyzwalacz</div>
            <div className="font-bold text-slate-800 text-sm">{srv.triggerType === 'calendar' ? 'Kalendarz' : srv.triggerType === 'hours' ? 'RBG' : 'Mieszany'}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-calendar-blank text-base"></i> Termin / RBG</div>
            <div className="font-bold text-slate-800 text-sm">
              {srv.triggerType === 'calendar' ? (srv.nextDate ? safeParseDate(srv.nextDate)?.toLocaleDateString() || '-' : '-') :
               srv.triggerType === 'hours' ? (srv.targetWorkHours ? `${srv.targetWorkHours} rbg` : '-') :
               `${srv.nextDate ? safeParseDate(srv.nextDate)?.toLocaleDateString() || '-' : '-'} / ${srv.targetWorkHours ? srv.targetWorkHours + ' rbg' : '-'}`}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-users text-base"></i> Personel</div>
            <div className="font-bold text-slate-800 text-sm">{srv.requiredPersonnel || '-'}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-hourglass text-base"></i> Przestój (h)</div>
            <div className="font-bold text-slate-800 text-sm">{srv.estimatedDowntimeHours || 0} h</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-wrench text-base"></i> Status maszyny</div>
            <div className="font-bold text-slate-800 text-sm">{srv.machineStatus || '-'}</div>
          </div>
        </div>

        {/* Wymagane narzędzia i części */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="ph ph-wrench text-xl text-slate-500"></i> Wymagane narzędzia
            </h3>
            <div className="text-sm text-slate-800">
              {srv.toolsType === 'Specjalne' ? (
                <p><span className="font-bold">Specjalne:</span> {srv.specialTools || '-'}</p>
              ) : srv.toolsType === 'Inne' ? (
                <p><span className="font-bold">Inne:</span> {srv.otherTools || '-'}</p>
              ) : (
                <p className="font-bold">Podstawowe (skrzynka narzędziowa)</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="ph ph-nut text-xl text-slate-500"></i> Wymagane części
            </h3>
            {srv.requiredParts && srv.requiredParts.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 mb-2">PLANOWANE ZUŻYCIE</h4>
                <ul className="space-y-2">
                  {srv.requiredParts.map((part, idx) => {
                    const partUnit = parts.find(p => p.id === part.partId)?.unit || part.unit || 'szt.';
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm bg-white p-2 border border-slate-100 rounded">
                        <span className="font-bold text-slate-800">{part.name || '-'}</span>
                        <div className="flex gap-4 text-xs text-slate-500 font-medium">
                          <span>Ilość: {part.quantity || 1} {partUnit}</span>
                          <span>Koszt plan.: {part.unitCost ? (part.quantity * part.unitCost).toFixed(2) + ' PLN' : '-'}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic mb-4">Brak zdefiniowanych części planowanych.</p>
            )}
            
            {actualPartsUsed && actualPartsUsed.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-blue-600 mb-2 mt-4 pt-4 border-t border-slate-200">FAKTYCZNIE POBRANE</h4>
                <ul className="space-y-2">
                  {actualPartsUsed.map((tx, idx) => {
                    const foundPart = parts.find(p => p.id === tx.partId);
                    const pName = foundPart?.name || 'Nieznana część';
                    const pUnit = foundPart?.unit || tx.unit || 'szt.';
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm bg-blue-50/50 p-2 border border-blue-100 rounded">
                        <span className="font-bold text-slate-800">{pName}</span>
                        <div className="flex gap-4 text-xs text-slate-600 font-medium">
                          <span>Pobrano: {Math.abs(tx.quantity)} {pUnit} ({tx.user || t('planned.system')})</span>
                          <span>Koszt: {tx.totalCost ? tx.totalCost.toFixed(2) + ' PLN' : (Math.abs(tx.quantity) * tx.price).toFixed(2) + ' PLN'}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Zakres prac / Checklista */}
        <div className="mb-4 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="ph ph-list-checks text-xl text-blue-600"></i> Zakres prac do wykonania
          </h3>
          {srv.checklist && srv.checklist.length > 0 ? (
            <ul className="space-y-1">
              {srv.checklist.map((step, idx) => (
                <li key={step.id} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-1.5 px-2 rounded-md border border-slate-200 shadow-sm">
                  <span className="font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{step.taskName}</div>
                    <div className="text-xs text-slate-500">
                      Wymagane: {step.type === 'CHECKBOX' ? 'Potwierdzenie (odhaczenie)' : step.type === 'PHOTO' ? 'Zdjęcie dokumentujące' : 'Wpisanie wartości'}
                      <span className={step.isRequired ? "text-red-500 font-medium ml-1" : "text-slate-400 ml-1"}>
                        {step.isRequired ? '(Obowiązkowe)' : '(Opcjonalne)'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm font-medium text-slate-600 italic bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
              Przegląd według obowiązującego standardu DTR maszyny.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
