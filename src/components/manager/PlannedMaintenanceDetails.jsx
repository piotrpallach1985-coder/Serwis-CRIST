import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompressor';
import DictationButton from '../shared/DictationButton';
import { useLocation, useNavigate } from 'react-router-dom';
import MachineDTR from './MachineDTR';
import PlannedMaintenanceHistory from './PlannedMaintenanceHistory';
import ChecklistExecutor from '../checklists/ChecklistExecutor';
import PlannedMaintenanceRbgModal from './PlannedMaintenanceRbgModal';
import PlannedMaintenanceCompletionModal from './PlannedMaintenanceCompletionModal';
import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import { USER_ROLES } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';
import { safeParseDate } from '../../utils/dateHelpers';

/**
 * PlannedMaintenanceDetails — Widok szczegółowy jednego serwisu planowego.
 * Wyciągnięty z PlannedMaintenance.jsx (linie 479–835).
 */
export default function PlannedMaintenanceDetails({

  srv,
  machine,
  isArchive,
  allowTicketDeletion,
  canEditPlanned,
  canDeletePlanned,
  getMachineRegionName,
  machines,
  regions = [],
  // Akcje
  onBack,
  onDelete,
  onSetInProgress,
  onComplete,
  onUpdateRbg,
  onAddNote,
  onAddFutureNote,
  onEdit,
  onAddPart,
  // Stan modali (przekazywany z góry)
  rbgUpdateModal, setRbgUpdateModal,
  newRbgValue, setNewRbgValue,
  serviceToComplete, setServiceToComplete,
  isModalOpen, setIsModalOpen,
  editingService }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const branding = useManagerStore(state => state.branding);
  const partTransactions = useManagerStore(state => state.partTransactions || []);
  const parts = useManagerStore(state => state.parts || []);
  
  const actualPartsUsed = useMemo(() => {
    return partTransactions.filter(tx => tx.referenceId === srv.id && (tx.type === 'issue_planned' || tx.type === 'issue_adhoc'));
  }, [partTransactions, srv.id]);

  const [lightboxImg, setLightboxImg] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showRbgModal, setShowRbgModal] = useState(false);
  const [newFutureNote, setNewFutureNote] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [timelinePhotos, setTimelinePhotos] = useState([]);
  const [timelineUploadProgress, setTimelineUploadProgress] = useState('');
  const [isTimelineUploading, setIsTimelineUploading] = useState(false);
  const [timelineUploadError, setTimelineUploadError] = useState(null);

  const isCompleted = srv.status === 'completed';

  const handleAddNoteLocal = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await onAddNote(srv, newNote.trim());
      setNewNote('');
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto animate-fade-in relative text-[#111827]">
      {/* ZUNIFIKOWANY GÓRNY PASEK NAWIGACYJNY */}
      <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3 mb-6">
        
        {/* Lewa strona (Desktop) / Górny wiersz (Mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => {
              if (location.state?.backToMachineId) {
                navigate(`/manager/master_data/machines?openMachine=${location.state.backToMachineId}`);
              } else {
                onBack();
              }
            }}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
            title="Powrót"
          >
            <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">Powrót</span>
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md">Szczegóły Serwisu</h2>
        </div>

        {/* Prawa strona (Desktop) / Dolny wiersz (Mobile) */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          <button 
            onClick={() => import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, machine))}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
            title="Raport PDF"
          >
            <i className="ph ph-file-pdf text-xl md:text-base"></i><span className="hidden md:inline">Raport PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-2 sm:px-4 md:px-6 pb-6">
        {/* LEWA KOLUMNA */}
        <div className="w-full lg:w-3/4 space-y-6">
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
                  {/* Narzędzia */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
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

                  {/* Części */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <i className="ph ph-nut text-xl text-slate-500"></i> Wymagane części
                    </h3>
                    {srv.requiredParts && srv.requiredParts.length > 0 ? (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 mb-2">PLANOWANE ZUŻYCIE</h4>
                        <ul className="space-y-2">
                          {srv.requiredParts.map((part, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm bg-white p-2 border border-slate-100 rounded">
                              <span className="font-bold text-slate-800">{part.name || '-'}</span>
                              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                                <span>Ilość: {part.quantity || 1}</span>
                                <span>Koszt plan.: {part.unitCost ? (part.quantity * part.unitCost).toFixed(2) + ' PLN' : '-'}</span>
                              </div>
                            </li>
                          ))}
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
                            const pName = parts.find(p => p.id === tx.partId)?.name || 'Nieznana część';
                            return (
                              <li key={idx} className="flex justify-between items-center text-sm bg-blue-50/50 p-2 border border-blue-100 rounded">
                                <span className="font-bold text-slate-800">{pName}</span>
                                <div className="flex gap-4 text-xs text-slate-600 font-medium">
                                  <span>Pobrano: {Math.abs(tx.quantity)} ({tx.user || t('planned.system')})</span>
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
              <div className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="ph ph-list-checks text-xl text-blue-600"></i> Zakres prac do wykonania
                </h3>
                {srv.checklist && srv.checklist.length > 0 ? (
                  <ul className="space-y-3">
                    {srv.checklist.map((step, idx) => (
                      <li key={step.id} className="flex items-start gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <span className="font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{step.taskName}</div>
                          <div className="text-xs text-slate-500 mt-1">
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
            {/* Nowy Panel Kroki Realizacji (jak w awariach) */}
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
                                    <button onClick={() => onSetInProgress(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
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
                                                const fileRef = ref(storage, `planned_services/${srv.id}/${fileName}`);
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
                                          multiple 
                                          accept="image/*"
                                          capture="environment"
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
                                                const fileRef = ref(storage, `planned_services/${srv.id}/${fileName}`);
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
                                    </div>
                                    
                                    {timelineUploadError && <div className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-3 rounded-lg border border-red-200">BŁĄD: {timelineUploadError}</div>}
                                    {timelinePhotos && timelinePhotos.length > 0 && (
                                      <div className="flex gap-2 overflow-x-auto py-2">
                                        {timelinePhotos.map((url, i) => (
                                          <img key={i} src={url} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-pointer shadow-sm" onClick={() => setLightboxImg(url)} />
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2 mt-4">
                                    <button type="button" onClick={() => onAddPart(srv)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-blue-200 shadow-sm">
                                      <i className="ph ph-nut text-lg"></i> Pobierz Część
                                    </button>
                                    <button 
                                      disabled={isTimelineUploading || (!timelineNote.trim() && (!timelinePhotos || timelinePhotos.length === 0))} 
                                      onClick={() => {
                                        onAddFutureNote(srv.id, timelineNote, timelinePhotos, () => {
                                           setTimelinePhotos([]);
                                           setTimelineNote('');
                                        });
                                      }} 
                                      className="flex-1 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {timelineUploadProgress ? (
                                        <><i className="ph ph-spinner animate-spin text-lg"></i> {timelineUploadProgress}</>
                                      ) : (
                                        <><i className="ph ph-paper-plane-tilt text-lg"></i> Zapisz notatkę/zdjęcie</>
                                      )}
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
          </div>
          {/* PRAWA KOLUMNA — Historia */}
        <PlannedMaintenanceHistory srv={srv} setLightboxImg={setLightboxImg} />
      </div>

      {/* Modals */}
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal}
        newRbgValue={newRbgValue}
        setNewRbgValue={setNewRbgValue}
        onSubmit={onUpdateRbg}
        onClose={() => setRbgUpdateModal(null)}
      />

      <PlannedMaintenanceCompletionModal
        isOpen={!!serviceToComplete}
        onClose={() => setServiceToComplete(null)}
        serviceToComplete={serviceToComplete}
        user={user}
      />

      <PlannedMaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingService={editingService}
        machines={machines}
        user={user}
      />

      <MachineDTR machine={machines.find(m => m.id === srv?.machineId)} user={user} canManage={user?.role === 'manager' || (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN)} canDeleteNotes={(user?.role === 'admin' || user?.role === 'superadmin') || (user?.permissions || []).includes('delete_tech_notes')} />

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Powiększenie" className="max-w-full max-h-full object-contain cursor-zoom-out" />
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2" onClick={() => setLightboxImg(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}

PlannedMaintenanceDetails.propTypes = {
  srv: PropTypes.object.isRequired,
  machine: PropTypes.object,
  isArchive: PropTypes.bool,
  allowTicketDeletion: PropTypes.bool,
  canEditPlanned: PropTypes.bool,
  canDeletePlanned: PropTypes.bool,
  getMachineRegionName: PropTypes.func,
  machines: PropTypes.array,
  regions: PropTypes.array,
  onBack: PropTypes.func,
  onDelete: PropTypes.func,
  onSetInProgress: PropTypes.func,
  onComplete: PropTypes.func,
  onUpdateRbg: PropTypes.func,
  onAddNote: PropTypes.func,
  onAddFutureNote: PropTypes.func,
  onEdit: PropTypes.func,
  rbgUpdateModal: PropTypes.object,
  setRbgUpdateModal: PropTypes.func,
  newRbgValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setNewRbgValue: PropTypes.func,
  serviceToComplete: PropTypes.object,
  setServiceToComplete: PropTypes.func,
  isModalOpen: PropTypes.bool,
  setIsModalOpen: PropTypes.func,
  editingService: PropTypes.object
};
