import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useManagerStore } from '../../store/managerStore';
// from 'qrcode.react';
import { safeParseDate } from '../../utils/dateHelpers';
import EmptyState from '../shared/EmptyState';
import MachineDTR from './MachineDTR';
import MachineWorkHoursModal from './MachineWorkHoursModal';
import { USER_ROLES, TICKET_STATUS } from '../../utils/constants';
import { getCurrentTenant } from '../../utils/tenantHelper';



export default function MachineDetails({ isFromQR, onScanNext, onNfcNext, machine, history, loading, onBack, onPrint, onGeneratePDF, onGenerateNewQR, regions, onEdit, onDelete, onOpenTicket, onOpenService, onViewRelatedMachine, onAddChildMachine }) {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [isWorkHoursModalOpen, setIsWorkHoursModalOpen] = useState(false);
  const regionName = regions.find(r => r.id === machine.regionId)?.name || t('machines.details.unknownRegion');
  const baseUrl = window.location.origin;
  const currentTenantId = getCurrentTenant();
    const partTransactions = useManagerStore(state => state.partTransactions || []);
  const parts = useManagerStore(state => state.parts || []);
  const tickets = useManagerStore(state => state.tickets || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  const machines = useManagerStore(state => state.machines || []);
  
  const parentMachine = machine.parentId ? machines.find(m => m.id === machine.parentId) : null;
  const childMachines = machines.filter(m => m.parentId === machine.id);
  
  
  const machinePartsTx = useMemo(() => {
    return partTransactions.filter(tx => {
      if (!["issue_planned", "issue_adhoc", "issue"].includes(tx.type)) return false;
      if (tx.machineId === machine.id) return true;
      if (tx.machineName && machine.name && tx.machineName.toLowerCase().includes(machine.name.toLowerCase())) return true;
      return false;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [partTransactions, machine.id, machine.name]);

  const totalPartsCost = useMemo(() => {
    return partTransactions.filter(tx => {
      if (!["issue_planned", "issue_adhoc", "issue"].includes(tx.type)) return false;
      if (tx.machineId === machine.id) return true;
      if (tx.referenceId) {
        if (tx.type === "issue_adhoc" || tx.type === "issue") {
          const t = tickets.find(t => t.id === tx.referenceId);
          if (t && t.machineId === machine.id) return true;
        } else if (tx.type === 'issue_planned') {
          const s = plannedServices.find(s => s.id === tx.referenceId);
          if (s && s.machineId === machine.id) return true;
        }
      }
      return false;
    }).reduce((sum, tx) => sum + Number(tx.totalCost || (Math.abs(Number(tx.quantity)) * Number(tx.price)) || 0), 0);
  }, [partTransactions, machine.id, tickets, plannedServices]);
  const qrValue = `tenant=${currentTenantId}&machine=${machine.id}`;

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full animate-fade-in relative text-[#111827]">
            <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3">
        
        {/* Górna linia na mobile: Powrót + Tytuł */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={onBack}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
            title="Powrót"
          >
            <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">{t('machines.buttons.back')}</span>
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0">{t('machines.details.title')}</h2>
        </div>

        {/* Dolna linia na mobile / Prawa strona na desktopie: Przyciski akcji */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          {onScanNext && (
            <button
              onClick={onScanNext}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
              title={t('machines.buttons.scanQrTitle')}
            >
              <i className="ph ph-qr-code text-xl md:text-lg"></i>
              <span className="hidden md:inline">{t('machines.buttons.scanQr')}</span>
            </button>
          )}
          {onNfcNext && (
            <button
              onClick={onNfcNext}
              className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
              title={t('machines.buttons.nfcTitle')}
            >
              <i className="ph ph-waves text-xl md:text-lg"></i>
              <span className="hidden md:inline">{t('machines.buttons.nfc')}</span>
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

          <button onClick={onEdit} className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-blue-200 transition-colors shrink-0" title={t('machines.buttons.edit')}>
            <i className="ph ph-pencil-simple text-xl md:text-base"></i><span className="hidden md:inline">{t('machines.buttons.edit')}</span>
          </button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-red-200 transition-colors shrink-0" title={t('machines.buttons.delete')}>
            <i className="ph ph-trash text-xl md:text-base"></i><span className="hidden md:inline">{t('machines.buttons.delete')}</span>
          </button>
          {!machine.name.includes('(DO WERYFIKACJI)') && (
            <button onClick={() => onPrint(machine)} className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-slate-300 transition-colors shrink-0" title={t('machines.buttons.printQr')}>
              <i className="ph ph-printer text-xl md:text-base"></i><span className="hidden md:inline">{t('machines.buttons.printQr')}</span>
            </button>
          )}
          <button onClick={onGeneratePDF} className="flex items-center justify-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" title={t('machines.buttons.pdfReport')}>
            <i className="ph ph-file-pdf text-xl md:text-base"></i><span className="hidden md:inline">{t('machines.buttons.pdfReport')}</span>
          </button>
        </div>

      </div>

      <div className="p-6 overflow-y-auto h-full flex flex-col gap-6">
        {/* Górna sekcja - Info i QR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <button onClick={() => setIsWorkHoursModalOpen(true)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors" title="Aktualizuj {t('machines.details.rbg')}">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
              {machine.name.includes('(DO WERYFIKACJI)') ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-2">
                    <i className="ph ph-warning"></i>
                  </div>
                  <div className="font-bold text-orange-600 text-center text-sm">{t('machines.details.needsVerification')}</div>
                  <div className="text-xs text-gray-500 text-center">
                    {t('machines.details.verificationHint')}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-gray-700">{t('machines.details.qrCodeTitle')}</div>
                  <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                    <div id={"qr-svg-" + machine.id}><QRCodeSVG value={qrValue} size={150} /></div>
                  </div>
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="text-[10px] text-gray-400 font-medium">{t('machines.details.qrDate')}{(safeParseDate(machine.updatedAt || machine.qrCreatedAt || machine.createdAt) || new Date()).toLocaleDateString('pl-PL')}</div>
                    
                  </div>
                  <div className="text-xs text-gray-400 text-center px-4 mt-1">
                    {t('machines.details.qrHint')}
                  </div>
                </>
              )}
            </div>
          </div>

        <MachineDTR 
          machine={machine} 
          user={user} 
          canManage={(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN) || (user?.permissions || []).includes('manage_dtr')} 
          canDeleteNotes={(user?.role === 'admin' || user?.role === 'superadmin') || (user?.permissions || []).includes('delete_tech_notes')}
        />

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center gap-3">
            <i className="ph ph-spinner-gap animate-spin text-4xl text-blue-500"></i>
            <span className="text-gray-500 font-medium">{t('machines.details.loadingHistory')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* {t('machines.details.breakdownHistory')} */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-warning-circle text-red-500 text-xl"></i> 
                  {t('machines.details.breakdownHistory')}
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{history.tickets.length} {t('machines.details.ticketsCount')}</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.tickets.length === 0 ? (
                  <EmptyState title={t('machines.details.noBreakdowns')} message="Nie odnotowano żadnych {t('machines.details.ticketsCount')} awarii dla tej maszyny." icon="ph-wrench" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.tickets.map(t => (
                      <div key={t.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTicket && onOpenTicket(t.id, Number(t.status) === TICKET_STATUS.CLOSED, machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{t.topic || t('machines.details.other')}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${Number(t.status) === TICKET_STATUS.CLOSED ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {Number(t.status) === TICKET_STATUS.CLOSED ? t('machines.details.closed') : t('machines.details.open')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{t.description || '-'}</div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{t('machines.details.reportedBy')}<span className="font-semibold text-gray-600">{t.reportedBy}</span></span>
                          <span>{t.createdAt ? safeParseDate(t.createdAt).toLocaleDateString('pl-PL') : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* {t('machines.details.serviceHistory')} */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-calendar-check text-blue-500 text-xl"></i> 
                  {t('machines.details.serviceHistory')}
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{history.services.length} {t('machines.details.servicesCount')}</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.services.length === 0 ? (
                  <EmptyState title="Brak {t('machines.details.servicesCount')}" message={t('machines.details.noServicesMsg')} icon="ph-calendar" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.services.map(s => (
                      <div key={s.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenService && onOpenService(s.id, s.status === 'completed', machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{s.name}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.status === 'completed' ? t('machines.details.completed') : t('machines.details.pending')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                          <span>{s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? t('machines.details.calendar') : t('machines.details.mixed'))}</span>
                          <span>{s.completedAt ? safeParseDate(s.completedAt).toLocaleDateString('pl-PL') : (s.nextDate ? t('machines.details.plannedDate') + safeParseDate(s.nextDate).toLocaleDateString('pl-PL') : '-')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              {/* Koszty Części */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col xl:col-span-2 mt-2 mb-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i className="ph ph-money text-emerald-500 text-xl"></i> 
                    {t('machines.details.usedPartsTitle')}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">{totalPartsCost.toFixed(2)} {t('machines.details.pln')}</span>
                </div>
                <div className="p-0 overflow-y-auto max-h-[400px]">
                  {machinePartsTx.length === 0 ? (
                    <EmptyState title={t('machines.details.noParts')} message={t('machines.details.noPartsMsg')} icon="ph-nut" />
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {machinePartsTx.map(tx => {
                        const part = parts.find(p => p.id === tx.partId);
                        return (
                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-gray-800">{part ? part.name : (tx.partName || t('machines.details.unknownPart'))}</div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                              {tx.totalCost ? tx.totalCost.toFixed(2) : (Math.abs(tx.quantity) * (tx.price || 0)).toFixed(2)} {t('machines.details.pln')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>{t('machines.details.quantity')}<span className="font-semibold text-gray-600">{Math.abs(tx.quantity)}</span> {part?.unit || 'pcs.'} x {tx.price?.toFixed(2)} {t('machines.details.pln')}</span>
                            <span>{tx.date ? new Date(tx.date).toLocaleDateString('pl-PL') : '-'}</span>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>
          </div>
        )}
      <MachineWorkHoursModal isOpen={isWorkHoursModalOpen} onClose={() => setIsWorkHoursModalOpen(false)} machine={machine} user={user} />
</div></div>
  );
}

MachineDetails.propTypes = {
  isFromQR: PropTypes.bool,
  onScanNext: PropTypes.func,
  onNfcNext: PropTypes.func,
  machine: PropTypes.object.isRequired,
  history: PropTypes.object,
  loading: PropTypes.bool,
  onBack: PropTypes.func,
  onPrint: PropTypes.func,
  onGeneratePDF: PropTypes.func,
  onGenerateNewQR: PropTypes.func,
  regions: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onOpenTicket: PropTypes.func,
  onOpenService: PropTypes.func,
};
