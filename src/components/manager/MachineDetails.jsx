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



export default function MachineDetails({ isFromQR, onScanNext, onNfcNext, machine, history, loading, onBack, onPrint, onGeneratePDF, onGenerateNewQR, regions, onEdit, onDelete, onOpenTicket, onOpenService }) {
  const { user } = useAuth();
  const [isWorkHoursModalOpen, setIsWorkHoursModalOpen] = useState(false);
  const regionName = regions.find(r => r.id === machine.regionId)?.name || 'Nieznany rejon';
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
            <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">Powrót</span>
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0">Szczegóły Maszyny</h2>
        </div>

        {/* Dolna linia na mobile / Prawa strona na desktopie: Przyciski akcji */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          {onScanNext && (
            <button
              onClick={onScanNext}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
              title="Skanuj kod QR maszyny"
            >
              <i className="ph ph-qr-code text-xl md:text-lg"></i>
              <span className="hidden md:inline">Skanuj QR</span>
            </button>
          )}
          {onNfcNext && (
            <button
              onClick={onNfcNext}
              className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
              title="Odczytaj NFC maszyny"
            >
              <i className="ph ph-waves text-xl md:text-lg"></i>
              <span className="hidden md:inline">NFC</span>
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

          <button onClick={onEdit} className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-blue-200 transition-colors shrink-0" title="Edytuj">
            <i className="ph ph-pencil-simple text-xl md:text-base"></i><span className="hidden md:inline">Edytuj</span>
          </button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-red-200 transition-colors shrink-0" title="Usuń">
            <i className="ph ph-trash text-xl md:text-base"></i><span className="hidden md:inline">Usuń</span>
          </button>
          {!machine.name.includes('(DO WERYFIKACJI)') && (
            <button onClick={() => onPrint(machine)} className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-slate-300 transition-colors shrink-0" title="Drukuj QR">
              <i className="ph ph-printer text-xl md:text-base"></i><span className="hidden md:inline">Drukuj QR</span>
            </button>
          )}
          <button onClick={onGeneratePDF} className="flex items-center justify-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" title="Raport PDF">
            <i className="ph ph-file-pdf text-xl md:text-base"></i><span className="hidden md:inline">Raport PDF</span>
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
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-0.5">
                    <i className="ph ph-arrow-u-up-left"></i> Podzespół urządzenia: {parentMachine.name}
                  </div>
                )}
                <h1 className="text-2xl font-black text-gray-900">{machine.name}</h1>
                <div className="text-gray-400 font-mono text-sm">ID: {machine.id}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Rejon / Miejsce</div>
                <div className="font-semibold text-gray-800 text-base">{regionName}</div>
                {regions.find(r => r.id === machine.regionId)?.mapImageUrl && (
                  <a href={regions.find(r => r.id === machine.regionId).mapImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center gap-1 hover:underline mt-0.5">
                    <i className="ph ph-map-trifold"></i> Podmapa
                  </a>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Numer Wewnętrzny</div>
                <div className="font-semibold text-gray-800 text-base">{machine.internalId || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Stan Licznika</div>
                <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800 text-base">{machine.currentWorkHours || 0} RBG</div>
                    <button onClick={() => setIsWorkHoursModalOpen(true)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors" title="Aktualizuj RBG">
                      <i className="ph ph-pencil-simple"></i>
                    </button>
                  </div>
                  {machine.workHoursHistory && machine.workHoursHistory.length > 0 && (
                    <div className="text-[10px] text-gray-400 mt-0.5">Ost. akt: {safeParseDate([...machine.workHoursHistory].sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date)?.toLocaleDateString('pl-PL')}</div>
                  )}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Dodatkowy Opis</div>
                <div className="font-semibold text-gray-800 text-sm max-w-full break-words">{machine.additionalDescription || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Koszt Części (TCO)</div>
                <div className="font-semibold text-red-600 text-base">{totalPartsCost.toFixed(2)} PLN</div>
              </div>
            </div>
            
            {childMachines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Podzespoły (Drzewo aktywów)</div>
                <ul className="flex flex-col gap-2">
                  {childMachines.map(child => (
                    <li key={child.id} className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                      <i className="ph ph-gear text-blue-500 text-lg"></i>
                      {child.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
              {machine.name.includes('(DO WERYFIKACJI)') ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-2">
                    <i className="ph ph-warning"></i>
                  </div>
                  <div className="font-bold text-orange-600 text-center text-sm">Maszyna Wymaga Weryfikacji</div>
                  <div className="text-xs text-gray-500 text-center">
                    Aby wygenerować kod QR dla operatorów, użyj przycisku <b>Edytuj</b>, uzupełnij brakujące dane (np. lokalizację, numer wewnętrzny), usuń dopisek "(DO WERYFIKACJI)" z nazwy i zapisz.
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-gray-700">Kod QR Maszyny</div>
                  <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                    <div id={"qr-svg-" + machine.id}><QRCodeSVG value={qrValue} size={150} /></div>
                  </div>
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="text-[10px] text-gray-400 font-medium">Data kodu (ost. edycja): {(safeParseDate(machine.updatedAt || machine.qrCreatedAt || machine.createdAt) || new Date()).toLocaleDateString('pl-PL')}</div>
                    
                  </div>
                  <div className="text-xs text-gray-400 text-center px-4 mt-1">
                    Operatorzy mogą zeskanować ten kod, aby szybko zgłosić awarię tej maszyny.
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
            <span className="text-gray-500 font-medium">Ładowanie historii z bazy...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Historia Awarii */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-warning-circle text-red-500 text-xl"></i> 
                  Historia Awarii
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{history.tickets.length} zgłoszeń</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.tickets.length === 0 ? (
                  <EmptyState title="Brak awarii" message="Nie odnotowano żadnych zgłoszeń awarii dla tej maszyny." icon="ph-wrench" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.tickets.map(t => (
                      <div key={t.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTicket && onOpenTicket(t.id, Number(t.status) === TICKET_STATUS.CLOSED, machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{t.topic || 'Inne'}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${Number(t.status) === TICKET_STATUS.CLOSED ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {Number(t.status) === TICKET_STATUS.CLOSED ? 'Zamknięte' : 'Otwarte'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{t.description || '-'}</div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Zgłaszający: <span className="font-semibold text-gray-600">{t.reportedBy}</span></span>
                          <span>{t.createdAt ? safeParseDate(t.createdAt).toLocaleDateString('pl-PL') : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Historia Serwisów */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-calendar-check text-blue-500 text-xl"></i> 
                  Historia Serwisów
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{history.services.length} serwisów</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.services.length === 0 ? (
                  <EmptyState title="Brak serwisów" message="Nie zaplanowano jeszcze żadnych przeglądów dla tej maszyny." icon="ph-calendar" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.services.map(s => (
                      <div key={s.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenService && onOpenService(s.id, s.status === 'completed', machine.id); }} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{s.name}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.status === 'completed' ? 'Zakończony' : 'W trakcie/Oczekujący'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                          <span>{s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Czasowy' : 'Mieszany')}</span>
                          <span>{s.completedAt ? safeParseDate(s.completedAt).toLocaleDateString('pl-PL') : (s.nextDate ? 'Planowane: ' + safeParseDate(s.nextDate).toLocaleDateString('pl-PL') : '-')}</span>
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
                    Zużyte Części Zapasowe
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">{totalPartsCost.toFixed(2)} PLN</span>
                </div>
                <div className="p-0 overflow-y-auto max-h-[400px]">
                  {machinePartsTx.length === 0 ? (
                    <EmptyState title="Brak części" message="Nie wydano jeszcze żadnych części dla tej maszyny." icon="ph-nut" />
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {machinePartsTx.map(tx => {
                        const part = parts.find(p => p.id === tx.partId);
                        return (
                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-gray-800">{part ? part.name : (tx.partName || 'Nieznana część')}</div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                              {tx.totalCost ? tx.totalCost.toFixed(2) : (Math.abs(tx.quantity) * (tx.price || 0)).toFixed(2)} PLN
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Ilość: <span className="font-semibold text-gray-600">{Math.abs(tx.quantity)}</span> {part?.unit || 'szt.'} x {tx.price?.toFixed(2)} PLN</span>
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
