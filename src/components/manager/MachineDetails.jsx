import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { safeParseDate } from '../../utils/dateHelpers';
import MachineDTR from './MachineDTR';


export default function MachineDetails({ machine, user, history, loading, onBack, onPrint, onGeneratePDF, regions, onEdit, onDelete }) {
  const regionName = regions.find(r => r.id === machine.regionId)?.name || 'Nieznany rejon';
  const baseUrl = window.location.origin + window.location.pathname;
  const qrValue = `${baseUrl}?machine=${machine.id}`;

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full animate-fade-in relative text-[#111827]">
      <div className="bg-white border-b border-gray-200 p-2 md:px-6 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm"
            title="Powrót"
          >
            <i className="ph ph-arrow-left text-lg"></i> Powrót
          </button>
          <h2 className="text-sm md:text-xl font-bold text-gray-800">Szczegóły Maszyny</h2>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={onEdit} className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg font-bold text-sm border border-blue-200 transition-colors" title="Edytuj">
<i className="ph ph-pencil-simple text-lg md:text-base"></i><span className="hidden md:inline">Edytuj</span>
</button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg font-bold text-sm border border-red-200 transition-colors" title="Usuń">
<i className="ph ph-trash text-lg md:text-base"></i><span className="hidden md:inline">Usuń</span>
</button>
          {!machine.name.includes('(DO WERYFIKACJI)') && (
            <button onClick={() => onPrint(machine.id, machine.name)} className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg font-bold text-sm border border-slate-300 transition-colors" title="Drukuj QR">
<i className="ph ph-printer text-lg md:text-base"></i><span className="hidden md:inline">Drukuj QR</span>
</button>
          )}
          <button onClick={onGeneratePDF} className="flex items-center justify-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg font-bold text-sm shadow-md transition-colors" title="Raport PDF">
<i className="ph ph-file-pdf text-lg md:text-base"></i><span className="hidden md:inline">Raport PDF</span>
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
                <h1 className="text-2xl font-black text-gray-900">{machine.name}</h1>
                <div className="text-gray-400 font-mono text-sm">ID: {machine.id}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Rejon / Miejsce</div>
                <div className="font-semibold text-gray-800 text-base">{regionName}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Numer Wewnętrzny</div>
                <div className="font-semibold text-gray-800 text-base">{machine.internalId || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Stan Licznika</div>
                <div className="font-semibold text-gray-800 text-base">{machine.currentWorkHours || 0} RBG</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">Dodatkowy Opis</div>
                <div className="font-semibold text-gray-800 text-sm max-w-full break-words">{machine.additionalDescription || '-'}</div>
              </div>
            </div>
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
                  <div className="text-xs text-gray-400 text-center px-4">
                    Operatorzy mogą zeskanować ten kod, aby szybko zgłosić awarię tej maszyny.
                  </div>
                </>
              )}
            </div>
          </div>

        <MachineDTR machine={machine} canManage={user?.role === 'admin' || (user?.permissions || []).includes('manage_dtr')} />

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
                  <div className="p-6 text-center text-gray-400 text-sm italic">Brak zgłoszeń awarii dla tej maszyny.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.tickets.map(t => (
                      <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{t.topic || 'Inne'}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${t.status === 5 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {t.status === 5 ? 'Zamknięte' : 'Otwarte'}
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
                  <div className="p-6 text-center text-gray-400 text-sm italic">Brak zrealizowanych lub zaplanowanych serwisów.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.services.map(s => (
                      <div key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
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
          </div>
        )}
      </div>
    </div>
  );
}
