import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useOperatorForm } from '../hooks/useOperatorForm';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';
import DictationButton from './shared/DictationButton';
import Toast from './manager/Toast';
import { collection, doc, setDoc, serverTimestamp, getDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { savePhotoToIndexedDB } from '../utils/offlineStorage';
import { db, storage } from '../firebase';

export default function OperatorForm({
  machines = [],
  selectedMachine,
  setSelectedMachine,
  regions,
  initialMachineId,
  handleStepChange,
  isOnline,
  topicsList,
  reportersList,
  stopLiveScanner,
  isInternal
}) {
  const branding = useManagerStore(state => state.branding);
  const storeTenantId = useManagerStore(state => state.tenantId);
  const tenantId = storeTenantId || getCurrentTenant();
  const user = useManagerStore(state => state.user);
  // Ignore default branding if tenant is different (for unlogged users who don't fetch branding)
  const companyName = branding?.companyName ? branding.companyName : tenantId.toUpperCase();
  const {
    topicMode, setTopicMode,
    topic, setTopic,
    description, setDescription,
    reporterName, setReporterName,
    reporterPhone, setReporterPhone,
    isCritical, setIsCritical,
    loading,
    errorMsg,
    pendingPhotos,
    uploadProgress,
    acceptedRodo, setAcceptedRodo,
    toastConfig, hideToast,
    submitLoading, submitProgress,
    handleSubmit, handleFilesSelected
  } = useOperatorForm({ machines, selectedMachine, setSelectedMachine, regions, handleStepChange, isOnline, isInternal });

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm font-bold flex items-center gap-3">
          <i className="ph ph-warning-circle text-2xl"></i>
          {errorMsg}
        </div>
      )}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Karta szczegółów wybranej maszyny */}
            <div className="bg-blue-50/70 p-5 border-b border-blue-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  
                  {/* Lewa strona: Nazwa / Input */}
                  <div className="flex-1 w-full flex flex-col items-start gap-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded inline-block mb-1">
                        Zgłoszenie dla urządzenia
                      </span>
                      {!user && <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded inline-block mb-1 ml-2">Firma: {companyName}</span>}
                    {selectedMachine.id === 'manual' ? (
                        <div className="mt-1 flex flex-col gap-2 w-full">
                          {machines && machines.length > 0 && (
                            <select
                              data-testid="operator-form-machine-select"
                              value=""
                              onChange={e => {
                                const chosen = machines.find(m => m.id === e.target.value);
                                if (chosen) {
                                  setSelectedMachine(chosen);
                                }
                              }}
                              className="w-full p-2.5 border border-blue-300 rounded-lg font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-900 bg-white"
                            >
                              <option value="">
                                -- Wybierz istniejące urządzenie / pojazd z listy (lub wpisz poniżej) --
                              </option>
                              {[...machines]
                                .filter(m => !m.isDeleted)
                                .sort((a, b) =>
                                  String(a.name || '').localeCompare(String(b.name || ''), 'pl', {
                                    numeric: true,
                                    sensitivity: 'base',
                                  })
                                )
                                .map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                    {m.licensePlate ? ` [${m.licensePlate}]` : ''}
                                    {m.internalId ? ` (${m.internalId})` : ''}
                                  </option>
                                ))}
                            </select>
                          )}
                          <input 
      type="text" 
      value={selectedMachine.name || ''} 
      onChange={(e) => setSelectedMachine({...selectedMachine, name: e.target.value})} 
      className="w-full p-2 border border-blue-300 rounded font-bold text-lg focus:outline-none focus:border-blue-900 bg-white" 
      placeholder="Wpisz lub wybierz urządzenie..." 
      autoFocus
      list="manual-machine-list"
    />
    <datalist id="manual-machine-list">
        {machines?.map(m => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
                          <select
                            value={selectedMachine.regionId || ''}
                            onChange={(e) => setSelectedMachine({...selectedMachine, regionId: e.target.value})}
                            className="w-full p-2 border border-blue-300 rounded font-medium text-sm text-slate-700 focus:outline-none focus:border-blue-900 bg-white"
                          >
                            <option value="">-- Nieokreślony --</option>
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="font-black text-2xl sm:text-3xl text-slate-800 break-words mt-1 w-full leading-tight pr-2">
                          {selectedMachine.name}
                        </div>
                      )}
                  </div>
                  
                  {/* Prawa strona: Przycisk Inna Maszyna / Powrót */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                    {selectedMachine.id !== "manual" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMachine({ 
                            id: "manual", 
                            name: "", 
                            regionId: selectedMachine.regionId || "" 
                          });
                        }}
                        className="flex items-center justify-center gap-2 text-sm text-yellow-900 bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-500 font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap"
                      >
                        <i className="ph ph-pencil-simple text-xl"></i>
                        <span>Inne Urządzenie</span>
                      </button>
                    )}
                    
                    
                    <button 
                        type="button"
                        onClick={() => {
                          if(stopLiveScanner) stopLiveScanner();
                          setSelectedMachine(null);
                          handleStepChange('scan');
                        }} 
                        className="flex items-center justify-center gap-2 text-white hover:text-white font-bold text-sm bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap"
                      >
                        <i className="ph ph-arrow-left text-lg"></i> {'Powrót'}
                      </button>
                    </div>
                </div>

              {selectedMachine.id !== 'manual' && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Miejsce montażu / Rejon:</span>
                    <div className="font-bold text-slate-800">
                      {regions.find(r => r.id === selectedMachine.regionId)?.name || 'Nieokreślono'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Informacja dodatkowa:</span>
                    <div className="font-bold text-slate-800">
                      {selectedMachine.bay || 'Brak'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isOnline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 mb-0 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="ph ph-wifi-slash text-yellow-500 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-bold">
                      Brak połączenia z siecią (Offline)
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Możesz bezpiecznie wypełnić i wysłać formularz. Zgłoszenie zostanie zapisane w pamięci urządzenia i zsynchronizowane automatycznie, gdy tylko odzyskasz zasięg.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!isInternal && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Numer telefonu (Opcjonalnie)
                </label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    let formatted = val;
                    if (val.length > 3 && val.length <= 6) {
                      formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
                    } else if (val.length > 6) {
                      formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
                    }
                    setReporterPhone(formatted);
                  }}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="np. 500 600 700"
                  pattern="[0-9]{3} [0-9]{3} [0-9]{3}"
                  minLength={11}
                  maxLength={11}
                />
              </div>
            )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Co się stało? (Temat)</label>
                {topicMode === 'select' ? (
                  <select
                    value={(topicsList || []).includes(topic) ? topic : ''}
                    onChange={(e) => {
                      if (e.target.value === 'manual') {
                        setTopicMode('manual');
                        setTopic('');
                      } else {
                        setTopic(e.target.value);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none bg-white text-gray-800"
                    required
                  >
                    <option value="" disabled>Wybierz z podpowiedzi...</option>
                    
                      <option value="manual" className="font-bold text-blue-900">+ Wpisz własny temat...</option>
                    {(topicsList || []).map((topicItem, i) => <option key={i} value={topicItem}>{topicItem}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)} 
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
                      placeholder="Wpisz własny temat..."
                      required 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setTopicMode('select');
                        setTopic('');
                      }}
                      className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                      title="Wróć do listy"
                    >
                      <i className="ph ph-x text-lg"></i>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis problemu</label>
                <div className="relative">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded h-32 resize-none focus:ring-2 focus:ring-blue-900 outline-none" required></textarea>
                    <div className="absolute bottom-3 right-3">
                      <DictationButton 
                        onResult={(text) => setDescription(prev => prev ? prev + ' ' + text : text)} 
                      />
                    </div>
                  </div>
              </div>
              <label className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded cursor-pointer transition-colors hover:bg-red-100">
                <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                <span className="text-red-900 font-medium">Maszyna jest całkowicie unieruchomiona (Krytyczne)</span>
              </label>
              {/* Zdjęcia */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ph ph-camera text-blue-900 text-lg"></i>
                  Załącz zdjęcia (opcjonalnie)
                </h3>
                <div className="space-y-3">
                  
                  {uploadProgress && <div className="text-sm font-bold text-blue-600 mb-2">{uploadProgress}</div>}
                  <div className="flex gap-2">
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-image text-xl"></i> Galeria
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden"
                        onChange={handleFilesSelected}
                      />
                    </label>
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-camera text-xl"></i> Aparat
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFilesSelected}
                      />
                    </label>
                  </div>
                  {pendingPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {pendingPhotos.map((p, i) => (
                        <div key={i} className="relative w-20 h-20 shrink-0 border border-gray-300 rounded overflow-hidden">
                          <img src={p.preview} alt="preview" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              
              
  <button 
                type="submit" 
                disabled={loading || submitLoading} 
                className={`w-full font-bold py-4 rounded text-lg transition-colors flex items-center justify-center gap-2 ${
                  (loading || submitLoading) ? 'bg-blue-400 text-white cursor-not-allowed' : 
                  !isOnline ? 'bg-orange-500 hover:bg-orange-600 text-white' : 
                  'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {(loading || submitLoading) ? (
                  (uploadProgress || submitProgress) ? (uploadProgress || submitProgress) : <><i className="ph ph-spinner animate-spin text-2xl"></i> Zapisywanie...</>
                ) : !isOnline ? (
                  <><i className="ph ph-wifi-slash text-xl"></i> Oczekuję na zasięg...</>
                ) : (
                  <><i className="ph ph-paper-plane-tilt text-xl"></i> Wyślij zgłoszenie</>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Administratorem danych przetwarzanych w celu obsługi zgłoszenia serwisowego jest zarządzający zakładem ({companyName}). Funkcja dyktowania głosu (AI voice to text) wykorzystuje modele sztucznej inteligencji.
              </p>
            </form>
          </div>
      {toastConfig && toastConfig.show && <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />}
    </div>
  );
}

OperatorForm.propTypes = {
  machines: PropTypes.array,
  selectedMachine: PropTypes.object,
  setSelectedMachine: PropTypes.func.isRequired,
  regions: PropTypes.array,
  initialMachineId: PropTypes.string,
  handleStepChange: PropTypes.func.isRequired,
  isOnline: PropTypes.bool.isRequired,
  topicsList: PropTypes.array,
  reportersList: PropTypes.array,
  stopLiveScanner: PropTypes.func
};
