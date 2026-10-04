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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="bg-[#111827] text-white p-4 px-6 flex items-center gap-3">
        <i className="ph ph-faders text-xl"></i>
        <h3 className="font-bold text-sm tracking-widest uppercase">
          DZIAŁ TECHNICZNY - KROKI REALIZACJI
        </h3>
      </div>
      
      <div className="p-4 md:p-5 space-y-6 bg-gray-50/50">
        <div className="mt-2">
          {[
            { id: 1, label: 'Wyczekujący (Do weryfikacji)' },
            { id: 2, label: 'Realizacja serwisu (W trakcie)' },
            { id: 3, label: 'Zakończony' }
          ].map(step => {
            let currentStepNum = 1;
            if (srv.status === 'in_progress') currentStepNum = 2;
            else if (isCompleted || srv.status === 'completed') currentStepNum = 3;
            
            const isActive = step.id === currentStepNum;
            const isPast = step.id < currentStepNum;

            return (
              <div key={step.id} className="relative flex items-start group min-h-[80px]">
                {/* Liniowa łączówka */}
                {step.id !== 3 && (
                  <div className="absolute left-4 top-10 bottom-[-10px] w-0.5 bg-gray-200 z-0"></div>
                )}
                
                {/* Kółko z numerem */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm mt-3 mr-4 transition-all ${isActive ? 'bg-[#111827] border-[#111827] text-white shadow-md' : isPast ? 'bg-white border-green-500 text-green-500' : 'bg-white border-gray-200 text-gray-300'}`}>
                  {isPast ? <i className="ph ph-check font-bold"></i> : step.id}
                </div>
                
                {/* Karta z treścią */}
                <div className={`flex-1 mb-2 md:mb-4 rounded-xl transition-all duration-300 relative z-0 ${isActive ? 'bg-[#f4f1eb] py-4 pr-4 pl-[3.5rem] sm:pl-[4rem] shadow-sm border border-[#e8e4db] -ml-[3rem] -mt-1' : 'py-3 pr-3'}`}>
                  <h4 className={`text-sm md:text-lg transition-colors ${isActive ? 'font-extrabold text-gray-900' : isPast ? 'font-bold text-gray-500' : 'font-medium text-gray-400'}`}>
                    {step.label}
                  </h4>
                  
                  {isActive && (
                    <div className="mt-5 space-y-5 animate-fade-in">
                      
                      <div className="space-y-4">
                        {step.id === 1 && !isCompleted && srv.status !== 'in_progress' && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => setServiceInProgressAction(srv, user)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                              <i className="ph ph-play-circle text-xl"></i> Rozpocznij Serwis
                            </button>
                          </div>
                        )}
                        
                        {!isCompleted && srv.status !== 'completed' && (
                          <div className="mt-8 pt-4 border-t border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dodaj notatkę / wynik kroku (Opcjonalnie)</label>
                            <div className="relative mb-3">
                              <textarea 
                                value={timelineNote}
                                onChange={(e) => setTimelineNote(e.target.value)}
                                disabled={isTimelineUploading}
                                className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none bg-white text-gray-800 shadow-sm transition-all" rows="3"
                                placeholder="Opcjonalnie dodaj szczegóły..."
                              ></textarea>
                              <div className="absolute bottom-3 right-3">
                                <DictationButton onResult={(text) => setTimelineNote(prev => prev ? prev + ' ' + text : text)} />
                              </div>
                            </div>
                            
                            <div className="mt-3 space-y-3">
                              <div className="flex gap-2">
                                <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm">
                                  <i className="ph ph-image text-lg text-slate-500"></i> Dodaj zdjęcie
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files);
                                      if (!files.length) return;
                                      setTimelineUploadProgress('Trwa wysyłanie...');
                                      setIsTimelineUploading(true);
                                      setTimelineUploadError(null);
                                      let newUrls = [];
                                      try {
                                        for (let i = 0; i < files.length; i++) {
                                          const compressedFile = await compressImage(files[i], 2);
                                          const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                          const fileRef = ref(storage, `tenants/${getCurrentTenant()}/planned_services/${srv.id}/${fileName}`);
                                          const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000));
                                          const url = await Promise.race([uploadPromise, timeoutPromise]);
                                          newUrls.push(url);
                                        }
                                        setTimelinePhotos(prev => [...(prev || []), ...newUrls]);
                                      } catch (err) {
                                        setTimelineUploadError(err.message);
                                      } finally {
                                        setTimelineUploadProgress('');
                                        setIsTimelineUploading(false);
                                      }
                                    }}
                                  />
                                </label>
                                <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm sm:hidden">
                                  <i className="ph ph-camera text-lg text-slate-500"></i> Aparat
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      setTimelineUploadProgress('Trwa wysyłanie...');
                                      setIsTimelineUploading(true);
                                      setTimelineUploadError(null);
                                      try {
                                        const compressedFile = await compressImage(file, 2);
                                        const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                        const fileRef = ref(storage, `tenants/${getCurrentTenant()}/planned_services/${srv.id}/${fileName}`);
                                        const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000));
                                        const url = await Promise.race([uploadPromise, timeoutPromise]);
                                        setTimelinePhotos(prev => [...(prev || []), url]);
                                      } catch (err) {
                                        setTimelineUploadError(err.message);
                                      } finally {
                                        setTimelineUploadProgress('');
                                        setIsTimelineUploading(false);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              
                              {timelinePhotos && timelinePhotos.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                  {timelinePhotos.map((url, idx) => (
                                    <div key={idx} className="relative group">
                                      <img src={url} alt={`Załącznik ${idx+1}`} className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                                      <button 
                                        onClick={() => setTimelinePhotos(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <i className="ph ph-x text-xs"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {isTimelineUploading && (
                                <div className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-2">
                                  <i className="ph ph-spinner-gap animate-spin text-lg"></i> {timelineUploadProgress}
                                </div>
                              )}
                              {timelineUploadError && (
                                <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                                  <i className="ph ph-warning-circle text-lg"></i> Błąd: {timelineUploadError}
                                </div>
                              )}

                              <button 
                                disabled={isTimelineUploading || (!timelineNote.trim() && (!timelinePhotos || timelinePhotos.length === 0))} 
                                onClick={() => {
                                  onAddFutureNote(srv.id, timelineNote, timelinePhotos, () => {
                                    setTimelineNote('');
                                    setTimelinePhotos([]);
                                  });
                                }} 
                                className="w-full bg-[#111827] hover:bg-black text-white px-4 py-3 rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isTimelineUploading ? (
                                  <><i className="ph ph-spinner-gap animate-spin text-lg"></i> Wysyłanie...</>
                                ) : (
                                  <><i className="ph ph-paper-plane-tilt text-lg"></i> Zapisz notatkę/zdjęcie</>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={onOpenPartModal}
                                className="w-full mt-3 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-package text-lg"></i> Pobierz część poza planową listą
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {step.id === 2 && !isCompleted && srv.status === 'in_progress' && (
                          <div className="flex flex-col gap-4">
                            {(!srv.checklist || srv.checklist.length === 0) ? (
                              <button onClick={() => setServiceToComplete(srv)} className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                                <i className="ph ph-check-circle text-xl"></i> Zakończ Serwis
                              </button>
                            ) : (
                              <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Lista Kontrolna (Wymagana do zamknięcia)</h3>
                                <ChecklistExecutor
                                  steps={srv.checklist}
                                  onComplete={(responses) => {
                                    setServiceToComplete({ ...srv, responses });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Additional Buttons (Edit/Delete) at the bottom of the timeline panel */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 mt-2">
          {!isCompleted && srv.status !== 'in_progress' && canEditPlanned && (
            <button onClick={() => onEdit(srv)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300">
              <i className="ph ph-pencil-simple text-xl"></i> {t("admin.users.edit")}
            </button>
          )}
          {canDeletePlanned && (!isArchive || allowTicketDeletion) && (
            <button onClick={() => { onDelete(srv.id); onBack(); }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200">
              <i className="ph ph-trash text-xl"></i> {t('planned.delete_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
