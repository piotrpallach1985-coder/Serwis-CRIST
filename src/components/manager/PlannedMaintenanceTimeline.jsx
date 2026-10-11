import { getCurrentTenant } from '../../utils/tenantHelper';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompressor';
import DictationButton from '../shared/DictationButton';
import ChecklistExecutor from '../checklists/ChecklistExecutor';

export default function PlannedMaintenanceTimeline({
  srv,
  isCompleted,
  user,
  setServiceInProgressAction,
  setServicePendingAction,
  onAddFutureNote,
  setServiceToComplete,
  onEdit,
  onDelete,
  onOpenPartModal,
  canEditPlanned,
  canDeletePlanned,
  isArchive,
  allowTicketDeletion,
  onBack
}) {
  const { t } = useTranslation();
  const [timelineNote, setTimelineNote] = useState('');
  const [timelinePhotos, setTimelinePhotos] = useState([]);
  const [timelineUploadProgress, setTimelineUploadProgress] = useState('');
  const [isTimelineUploading, setIsTimelineUploading] = useState(false);
  const [timelineUploadError, setTimelineUploadError] = useState(null);
  const [timelineSuccessMsg, setTimelineSuccessMsg] = useState(null);
  
  // Pozwala na swobodne przeglądanie kroków przez technika
  const [selectedStepOverride, setSelectedStepOverride] = useState(null);

  // Określenie aktualnego kroku według statusu
  let naturalStepNum = 1;
  if (srv.status === 'in_progress') naturalStepNum = 2;
  else if (isCompleted || srv.status === 'completed') naturalStepNum = 3;

  const currentStepNum = selectedStepOverride !== null ? selectedStepOverride : naturalStepNum;

  // Obsługa dodawania zdjęć
  const handlePhotoSelect = async (files) => {
    if (!files || files.length === 0) return;
    setIsTimelineUploading(true);
    setTimelineUploadProgress(t('tickets.details.uploading') || 'Przetwarzanie zdjęć...');
    setTimelineUploadError(null);
    setTimelineSuccessMsg(null);
    try {
      const uploadedUrls = [];
      for (const f of files) {
        const compressed = await compressImage(f, 2);
        const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `tenants/${getCurrentTenant()}/maintenance_logs/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }
      setTimelinePhotos(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Photo upload error:', err);
      setTimelineUploadError('Błąd wgrywania zdjęcia: ' + err.message);
    } finally {
      setIsTimelineUploading(false);
      setTimelineUploadProgress('');
    }
  };

  // Zapisanie notatki / zdjęć do historii
  const handleSaveNote = async () => {
    if (!timelineNote.trim() && timelinePhotos.length === 0) return;
    setIsTimelineUploading(true);
    setTimelineUploadProgress('Zapisywanie wpisu...');
    setTimelineUploadError(null);
    setTimelineSuccessMsg(null);
    try {
      if (onAddFutureNote) {
        await onAddFutureNote(srv.id, timelineNote, timelinePhotos);
      }
      setTimelineNote('');
      setTimelinePhotos([]);
      setTimelineSuccessMsg('Notatka została pomyślnie zapisana!');
      setTimeout(() => setTimelineSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Save note error:', err);
      setTimelineUploadError('Błąd zapisu: ' + err.message);
    } finally {
      setIsTimelineUploading(false);
      setTimelineUploadProgress('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="bg-[#111827] text-white p-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="ph ph-faders text-xl text-blue-400"></i>
          <h3 className="font-bold text-sm tracking-widest uppercase">
            DZIAŁ TECHNICZNY - KROKI REALIZACJI
          </h3>
        </div>
        <div className="text-xs text-slate-300 font-mono">
          Status: <span className="font-bold uppercase text-white">{srv.status === 'in_progress' ? 'W trakcie' : srv.status === 'completed' ? 'Zakończony' : 'Oczekujący'}</span>
        </div>
      </div>
      
      <div className="p-4 md:p-6 space-y-6 bg-gray-50/50">
        <div className="space-y-4">
          {[
            { id: 1, label: '1. Wyczekujący (Do weryfikacji)' },
            { id: 2, label: '2. Realizacja serwisu (W trakcie)' },
            { id: 3, label: '3. Zakończony i rozliczony' }
          ].map(step => {
            const isActualStatus = step.id === naturalStepNum;
            const isSelected = step.id === currentStepNum;
            const isPast = step.id < naturalStepNum;

            return (
              <div key={step.id} className="relative flex items-start group">
                {/* Liniowa łączówka pionowa */}
                {step.id !== 3 && (
                  <div className={`absolute left-4 top-10 bottom-[-16px] w-0.5 z-0 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
                
                {/* Kółko z numerem - klikalne do zmiany widoku kroku */}
                <button
                  type="button"
                  onClick={() => setSelectedStepOverride(step.id === currentStepNum ? null : step.id)}
                  className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm mt-3 mr-4 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#111827] border-[#111827] text-white shadow-md scale-105' 
                      : isPast 
                        ? 'bg-white border-green-500 text-green-600 hover:bg-green-50' 
                        : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                  title="Kliknij, aby rozwinąć ten krok"
                >
                  {isPast ? <i className="ph ph-check font-bold text-base"></i> : step.id}
                </button>
                
                {/* Karta kroku */}
                <div className={`flex-1 rounded-xl transition-all duration-300 border ${
                  isSelected 
                    ? 'bg-[#f4f1eb] p-4 sm:p-5 shadow-sm border-[#e8e4db]' 
                    : 'bg-white p-3.5 border-gray-200 hover:border-gray-300'
                }`}>
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setSelectedStepOverride(step.id === currentStepNum ? null : step.id)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm md:text-base transition-colors ${
                        isSelected 
                          ? 'font-extrabold text-gray-900' 
                          : isPast 
                            ? 'font-bold text-gray-600' 
                            : 'font-medium text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      {isActualStatus && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                          Aktywny status
                        </span>
                      )}
                    </div>
                    <i className={`ph ${isSelected ? 'ph-caret-up' : 'ph-caret-down'} text-gray-400`}></i>
                  </div>
                  
                  {/* Treść rozwiniętego kroku */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4 animate-fade-in">
                      
                      {/* === PRZYCISKI AKCJI STATUSU === */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Krok 1: Wyczekujący */}
                        {step.id === 1 && (
                          <>
                            {srv.status !== 'in_progress' && !isCompleted && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (setServiceInProgressAction) {
                                    await setServiceInProgressAction(srv, user);
                                    setSelectedStepOverride(2);
                                  }
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-play-circle text-xl"></i> Rozpocznij Serwis (W trakcie)
                              </button>
                            )}
                            {!isCompleted && srv.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => setServiceToComplete && setServiceToComplete(srv)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-check-circle text-xl"></i> Zakończ Serwis (Rozlicz)
                              </button>
                            )}
                          </>
                        )}

                        {/* Krok 2: Realizacja serwisu */}
                        {step.id === 2 && (
                          <>
                            {!isCompleted && srv.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => setServiceToComplete && setServiceToComplete(srv)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-check-circle text-xl"></i> Zakończ Serwis (Rozlicz)
                              </button>
                            )}
                            {srv.status === 'in_progress' && setServicePendingAction && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm('Czy na pewno chcesz cofnąć status serwisu do "Oczekujący"?')) {
                                    await setServicePendingAction(srv, user);
                                    setSelectedStepOverride(1);
                                  }
                                }}
                                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-arrow-counter-clockwise text-lg"></i> Cofnij do Oczekujący
                              </button>
                            )}
                          </>
                        )}

                        {/* Krok 3: Zakończony */}
                        {step.id === 3 && (
                          <>
                            {isCompleted || srv.status === 'completed' ? (
                              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                <i className="ph ph-check-circle text-xl text-emerald-600 shrink-0"></i>
                                <span>Serwis został pomyślnie zrealizowany i zarchiwizowany w historii.</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setServiceToComplete && setServiceToComplete(srv)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-check-circle text-xl"></i> Zakończ i Rozlicz Serwis
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Lista kontrolna dla kroku 2 (jeśli zdefiniowana w serwisie) */}
                      {step.id === 2 && srv.checklist && srv.checklist.length > 0 && !isCompleted && srv.status !== 'completed' && (
                        <div className="w-full bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mt-4">
                          <h4 className="text-base font-bold mb-3 text-slate-800 border-b pb-2 flex items-center gap-2">
                            <i className="ph ph-clipboard-text text-blue-600"></i>
                            Lista Kontrolna (Checklista do wykonania)
                          </h4>
                          <ChecklistExecutor
                            steps={srv.checklist}
                            onComplete={(responses) => {
                              if (setServiceToComplete) {
                                setServiceToComplete({ 
                                  ...srv, 
                                  checklistResponses: responses, 
                                  responses 
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* === FORMULARZ DODAWANIA NOTATEK I ZDJĘĆ === */}
                      {!isCompleted && srv.status !== 'completed' && (
                        <div className="pt-3 border-t border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Dodaj notatkę lub zdjęcie z prac:</span>
                            <span className="text-gray-400 font-normal lowercase">AI Whisper + Notatka</span>
                          </label>
                          
                          <div className="relative mb-3">
                            <textarea
                              value={timelineNote}
                              onChange={(e) => {
                                setTimelineNote(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              disabled={isTimelineUploading}
                              className="w-full p-3.5 pr-12 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none text-sm bg-white shadow-sm transition-all min-h-[75px]"
                              rows="2"
                              placeholder="Wpisz treść notatki lub użyj mikrofonu..."
                            ></textarea>
                            <div className="absolute right-3 bottom-3">
                              <DictationButton 
                                onResult={(text) => setTimelineNote(prev => prev ? prev + ' ' + text : text)} 
                              />
                            </div>
                          </div>

                          {/* Podgląd wybranych zdjęć */}
                          {timelinePhotos.length > 0 && (
                            <div className="mb-3 p-2 bg-white rounded-lg border border-slate-200">
                              <div className="text-xs font-bold text-slate-600 mb-2 flex justify-between items-center">
                                <span>Załączone zdjęcia ({timelinePhotos.length}):</span>
                                <button
                                  type="button"
                                  onClick={() => setTimelinePhotos([])}
                                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                                >
                                  <i className="ph ph-trash"></i> Usuń wszystkie
                                </button>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {timelinePhotos.map((url, idx) => (
                                  <div key={idx} className="relative group">
                                    <img 
                                      src={url} 
                                      alt="załącznik" 
                                      className="w-14 h-14 object-cover rounded-lg border border-gray-300 shadow-sm" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setTimelinePhotos(prev => prev.filter((_, i) => i !== idx))}
                                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                                      title="Usuń to zdjęcie"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Przyciski dodawania zdjęć */}
                          <div className="flex gap-2 mb-3">
                            <label className="flex-1 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center">
                              <i className="ph ph-image text-lg text-slate-500"></i> Dodaj zdjęcie
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                className="hidden"
                                disabled={isTimelineUploading}
                                onChange={(e) => handlePhotoSelect(Array.from(e.target.files))}
                              />
                            </label>

                            <label className="flex-1 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center">
                              <i className="ph ph-camera text-lg text-slate-500"></i> Aparat
                              <input 
                                type="file" 
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                disabled={isTimelineUploading}
                                onChange={(e) => handlePhotoSelect(Array.from(e.target.files))}
                              />
                            </label>
                          </div>

                          {timelineUploadError && (
                            <p className="text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs mb-3 text-center font-medium">
                              {timelineUploadError}
                            </p>
                          )}

                          {timelineSuccessMsg && (
                            <p className="text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200 text-xs mb-3 text-center font-bold">
                              ✓ {timelineSuccessMsg}
                            </p>
                          )}

                          <button 
                            type="button"
                            disabled={isTimelineUploading || (!timelineNote.trim() && timelinePhotos.length === 0)}
                            onClick={handleSaveNote}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                          >
                            {isTimelineUploading ? (
                              <><i className="ph ph-spinner-gap animate-spin text-xl"></i> {timelineUploadProgress || "Wysyłanie..."}</>
                            ) : (
                              <><i className="ph ph-paper-plane-tilt text-xl"></i> Zapisz notatkę/zdjęcie</>
                            )}
                          </button>

                          {/* Pobranie części z magazynu */}
                          {onOpenPartModal && (
                            <button
                              type="button"
                              onClick={onOpenPartModal}
                              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <i className="ph ph-package text-lg"></i> Pobierz część z magazynu do serwisu
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Dolne przyciski edycji i usunięcia */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 mt-2">
          {!isCompleted && srv.status !== 'in_progress' && canEditPlanned && (
            <button 
              type="button"
              onClick={() => onEdit(srv)} 
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300"
            >
              <i className="ph ph-pencil-simple text-xl"></i> {t("admin.users.edit")}
            </button>
          )}
          {canDeletePlanned && (!isArchive || allowTicketDeletion) && (
            <button 
              type="button"
              onClick={() => { onDelete(srv.id); onBack(); }} 
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-3.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200"
            >
              <i className="ph ph-trash text-xl"></i> {t('planned.delete_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
