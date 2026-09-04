import React from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';
import Toast from './Toast';
import MachineDTR from './MachineDTR';

export default function TicketDetails({
  machines,
  currentTicket,
  setSelectedTicketId,
  user,
  services,
  handleUpdate,
  handleDeleteTicket,
  handleArchiveTicket,
  comment,
  setComment,
  selectedService,
  setSelectedService,
  etr,
  setEtr,
  loading,
  allowTicketDeletion,
  toastConfig,
  setToastConfig,
  confirmModalConfig,
  setConfirmModalConfig,
  STATUSES,
  isArchive
}) {
  const [lightboxImg, setLightboxImg] = React.useState(null);
  const [uploadedPhotos, setUploadedPhotos] = React.useState([]);
  const [uploadProgress, setUploadProgress] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  
  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  // Czas pracy
  const machine = machines?.find(m => m.id === currentTicket.machineId);

  const duration = currentTicket.closedAt && currentTicket.startedAt ? 
    ((new Date(currentTicket.closedAt) - new Date(currentTicket.startedAt))/1000/3600).toFixed(1) : 
    (currentTicket.status === 5 ? '0.0' : '-');

    return (
      <div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#111827]">
        
        <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig({ message: '', type: 'success' })} />
      
        <ConfirmModal 
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={closeConfirmModal}
        />

        {/* Górny pasek nawigacyjny z przyciskiem powrotu */}
        <div className="p-2 md:p-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <div className="flex gap-2 md:gap-4">
            
            {window.history.state?.backToMachineId && (
              <button onClick={() => { const returnId = window.history.state?.backToMachineId; if (returnId) { window.history.pushState({ module: 'master_data', tab: 'machines', openMachine: returnId }, '', '?module=master_data&tab=machines&openMachine=' + returnId); window.dispatchEvent(new PopStateEvent('popstate')); } }} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all">
                <i className="ph ph-arrow-u-up-left text-lg"></i>
                Wróć do Urządzenia
              </button>
            )}
            <button onClick={() => setSelectedTicketId(null)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all">
              <i className="ph ph-arrow-left text-lg"></i> Powrót do rejestru
            </button>
            <button onClick={() => import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-sm transition-all">
              <i className="ph ph-file-pdf text-xl text-red-600"></i> Karta PDF
            </button>
            
          </div>
        </div>

        <div className="p-4 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* LEWA KOLUMNA */}
            <div className="w-full lg:w-2/3 space-y-5">
              
              {/* Główna sekcja danych (Tytuł i szczegóły) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  {/* Statusy i Tagi */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="font-bold text-gray-400 mr-1 text-sm md:text-lg">T{currentTicket.id?.slice(0, 4).toUpperCase() || "1"}</span>
                    <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold border uppercase tracking-wider ${STATUSES[currentTicket.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {STATUSES[currentTicket.status]?.label || 'Nieznany'}
                    </span>
                    {currentTicket.isCritical && (
                      <span className="bg-red-600 animate-pulse text-white px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                        POSTÓJ MASZYNY
                      </span>
                    )}
                  </div>
                  
                  {/* Tytuł */}
                  <h2 className="text-lg md:text-2xl font-extrabold text-[#111827] mb-2 md:mb-6">{currentTicket.topic}</h2>
                  
                  {/* Podział na DANE OBIEKTU i INFORMACJE ZGŁOSZENIA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 border-t border-gray-100 pt-8">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">DANE OBIEKTU</h3>
                      <div className="font-bold text-[#111827] text-lg mb-1 flex items-center gap-2">
    {currentTicket.machineName}{!machines?.some(m => m.id === currentTicket.machineId) && <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span>}
    
  </div>
                      <div className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                        <i className="ph ph-map-pin"></i> {currentTicket.regionName || 'Brak Rejonu'} {currentTicket.bay ? ` / ${currentTicket.bay}` : ''}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">ID: {currentTicket.machineId}</div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">INFORMACJE ZGŁOSZENIA</h3>
                      <div className="font-bold text-[#111827] flex items-center gap-2 mb-1">
                        <i className="ph ph-user text-gray-400"></i> {currentTicket.reportedBy}
                      </div>
                      {currentTicket.reporterDeviceId && (
                          <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-xs bg-gray-100 p-2 rounded w-fit">
                            <i className="ph ph-device-mobile text-gray-500"></i> ID Urządzenia: #{currentTicket.reporterDeviceId}
                          </div>
                        )}
                        {currentTicket.reporterPhone && (
                        <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-sm">
                          <i className="ph ph-phone text-gray-400"></i> {currentTicket.reporterPhone}
                        </div>
                      )}
                      <div className="text-gray-500 text-sm mb-1">
                        Priorytet: <span className={currentTicket.isCritical ? "text-red-600 font-bold" : ""}>{currentTicket.isCritical ? "Wysoki" : "Standardowy"}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        Zgłoszono: {safeParseDate(currentTicket.createdAt)?.toLocaleString('pl-PL') || 'Brak daty'}
                      </div>
                      
                    </div>
                  </div>

                  {/* OPIS AWARII */}
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">OPIS AWARII</h3>
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
                    {currentTicket.description}
                  </div>
{currentTicket.photos && currentTicket.photos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Załączone zdjęcia</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentTicket.photos.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt="załącznik" 
                            className="w-24 h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => setLightboxImg(url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL DYSPOZYTORA (Akcje) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#111827] text-white p-4 px-6 flex items-center gap-3">
                  <i className="ph ph-faders text-xl"></i>
                  <h3 className="font-bold text-sm tracking-widest uppercase">
                    {user?.role === 'kierownik' ? 'PANEL KIEROWNIKA - KOMENTARZE' : 'DZIAŁ TECHNICZNY - KROKI REALIZACJI'}
                  </h3>
                </div>
                
                <div className="p-4 md:p-5 space-y-6 bg-gray-50/50">
                  
                  {/* NOWY LAYOUT - STEPPER (4 KROKI) */}
                  <div className="mt-2">
                    {[
                      { id: 1, label: 'Przyjęcie zgłoszenia' },
                        { id: 2, label: 'Wybór wykonawcy' },
                        { id: 3, label: 'Rozpoczęcie naprawy' },
                        { id: 4, label: 'Naprawa w trakcie' },
                        { id: 5, label: 'Zakończenie naprawy' }
                    ].map(step => {
                      const currentStatus = Number(currentTicket.status === 'new' ? 1 : currentTicket.status === 'closed' ? 5 : currentTicket.status);
                      const currentStepNum = currentStatus;
                      const isActive = step.id === currentStepNum;
                      const isPast = step.id < currentStepNum;

                      return (
                        <div key={step.id} className="relative flex items-start group min-h-[80px]">
                          {/* Liniowa łączówka */}
                          {step.id !== 5 && (
                            <div className="absolute left-4 top-10 bottom-[-10px] w-0.5 bg-gray-200 z-0"></div>
                          )}
                          
                          {/* Kółko z numerem */}
                          <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm mt-1 mr-4 transition-all ${isActive ? 'bg-[#111827] border-[#111827] text-white shadow-md' : isPast ? 'bg-white border-green-500 text-green-500' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {isPast ? <i className="ph ph-check font-bold"></i> : step.id}
                          </div>
                          
                          {/* Karta z treścią */}
                          <div className={`flex-1 mb-2 md:mb-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#f4f1eb] p-2 sm:p-4 shadow-sm border border-[#e8e4db]' : 'p-2 sm:p-3'}`}>
                            <h4 className={`text-sm md:text-lg transition-colors ${isActive ? 'font-extrabold text-gray-900' : isPast ? 'font-bold text-gray-500' : 'font-medium text-gray-400'}`}>
                              {step.label}
                            </h4>
                            
                            {isActive && (
                              <div className="mt-5 space-y-5 animate-fade-in">
                                
                                {/* Specyficzna akcja dla kroku */}
                                {user?.role !== 'kierownik' && (
                                  <div className="space-y-4">
                                    {step.id === 1 && (
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Weryfikacja zgłoszenia", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                          Przyjęcie zgłoszenia (Rozpocznij weryfikację)
                                        </button>
                                        {user?.role === 'admin' && (
                                          <button 
                                            disabled={loading} 
                                            onClick={() => {
                                              setConfirmModalConfig({
                                                isOpen: true,
                                                title: 'Zamknąć bez naprawy?',
                                                message: 'Czy na pewno chcesz zamknąć zgłoszenie bez wykonywania prac?',
                                                confirmText: 'Tak, zamknij',
                                                onConfirm: async () => {
                                                  closeConfirmModal();
                                                  handleUpdate(currentTicket.id, 5, "Zamknięto bez naprawy (Admin)", etr);
                                                }
                                              });
                                            }}
                                            className="bg-white border border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-amber-900 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                            title="Tylko dla Administratora: Szybkie zamknięcie"
                                          >
                                            <i className="ph ph-crown text-amber-600 text-lg"></i>
                                            Zamknij od razu (brak awarii)
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {step.id === 2 && (
                                      <div className="bg-white border border-[#e8e4db] rounded-xl p-5 shadow-sm space-y-4">
                                        <label className="block text-sm font-bold text-gray-800">Wybierz jednostkę wykonawczą (Serwis/Utrzymanie Ruchu)</label>
                                        <select 
                                          value={selectedService}
                                          onChange={(e) => setSelectedService(e.target.value)}
                                          className="w-full p-3.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none text-gray-800 transition-colors"
                                        >
                                          <option value="">-- Kto się tym zajmie? --</option>
                                          {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                        <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, "Przekazano do: " + selectedService, etr)} className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all mt-2">
                                          Zatwierdź Wykonawcę i Przejdź Dalej
                                        </button>
                                      </div>
                                    )}

                                    {step.id === 3 && (
                                        <>
                                          {currentStatus === 3 && (
                                            <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Rozpoczęto realizację (Naprawa w trakcie)", etr)} className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                              Rozpocznij Naprawę
                                            </button>
                                          )}
                                        </>
                                      )}
                                      
                                      {step.id === 4 && (
                                        <>
                                          {currentStatus === 4 && (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, "Zakończono naprawę", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                                Zakończ Naprawę
                                              </button>
                                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Cofnięto do wyboru wykonawcy", etr)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all">
                                                Zmień wykonawcę (Cofnij)
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}

                                    {step.id === 5 && !isArchive && (
                                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Wznowiono prace (awaria powróciła)", etr)} className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all mt-4">
                                          Otwórz ponownie to zgłoszenie (Awaria powróciła)
                                        </button>
                                      )}
                                  </div>
                                )}

                                {/* Admin Actions for closed/archived */}
                                {user?.role === 'admin' && step.id === 5 && (
                                  <div className="space-y-3 pt-3 border-t border-[#e8e4db]">
                                    {!isArchive && (
                                      <button 
                                        disabled={loading} 
                                        onClick={() => handleArchiveTicket(currentTicket.id)}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                      >
                                        <i className="ph ph-archive text-lg"></i>
                                        Przenieś do Archiwum
                                      </button>
                                    )}
                                    {allowTicketDeletion && (
                                      <button 
                                        disabled={loading} 
                                        onClick={() => handleDeleteTicket(currentTicket.id)}
                                        className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                      >
                                        <i className="ph ph-trash text-lg"></i>
                                        Usuń trwale z bazy
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Pole Komentarza i Zdjęć wewnątrz aktywnego kroku */}
                                {!isArchive && (
                                  <div className="pt-5 mt-5 border-t border-[#e8e4db] flex flex-col gap-4">
                                    <div className="w-full">
                                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        {user?.role === 'kierownik' ? 'TWÓJ KOMENTARZ' : 'NOTATKA / WYNIK KROKU (WIDOCZNE W HISTORII)'}
                                      </label>
                                      <textarea 
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none bg-white text-gray-800 shadow-sm transition-all" rows="3"
                                        placeholder="Opcjonalnie dodaj szczegóły..."
                                      ></textarea>
                                      
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
                                                setUploadProgress('Trwa wysyłanie...');
                                                setIsUploading(true);
                                                setUploadError(null);
                                                let newUrls = [];
                                                try {
                                                  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                  const { storage } = await import('../../firebase');
                                                  const { compressImage } = await import('../../utils/imageCompressor');
                                                  for (let i = 0; i < files.length; i++) {
                                                    const file = files[i];
                                                    const compressedFile = await compressImage(file, 2);
                                                    const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                                    const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                                    const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000));
                                                    const url = await Promise.race([uploadPromise, timeoutPromise]);
                                                    newUrls.push(url);
                                                  }
                                                  setUploadedPhotos(prev => [...(prev || []), ...newUrls]);
                                                } catch (err) {
                                                  setUploadError(err.message);
                                                } finally {
                                                  setUploadProgress('');
                                                  setIsUploading(false);
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
                                              // onChange handled same as above, react merges it visually
                                              onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                if (!files.length) return;
                                                setUploadProgress('Trwa wysyłanie...');
                                                setIsUploading(true);
                                                setUploadError(null);
                                                let newUrls = [];
                                                try {
                                                  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                  const { storage } = await import('../../firebase');
                                                  const { compressImage } = await import('../../utils/imageCompressor');
                                                  for (let i = 0; i < files.length; i++) {
                                                    const file = files[i];
                                                    const compressedFile = await compressImage(file, 2);
                                                    const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                                    const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                                    const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000));
                                                    const url = await Promise.race([uploadPromise, timeoutPromise]);
                                                    newUrls.push(url);
                                                  }
                                                  setUploadedPhotos(prev => [...(prev || []), ...newUrls]);
                                                } catch (err) {
                                                  setUploadError(err.message);
                                                } finally {
                                                  setUploadProgress('');
                                                  setIsUploading(false);
                                                }
                                              }}
                                            />
                                          </label>
                                        </div>
                                        
                                        {uploadError && <div className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-3 rounded-lg border border-red-200">BŁĄD: {uploadError}</div>}
                                        {uploadedPhotos && uploadedPhotos.length > 0 && (
                                          <div className="flex gap-2 overflow-x-auto py-2">
                                            {uploadedPhotos.map((url, i) => (
                                              <img key={i} src={url} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-pointer shadow-sm" onClick={() => setLightboxImg(url)} />
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <button 
                                        disabled={loading || isUploading || (!comment.trim() && (!uploadedPhotos || uploadedPhotos.length === 0))} 
                                        onClick={() => {
                                          handleUpdate(currentTicket.id, null, user?.role === 'kierownik' ? "Komentarz kierownika" : "Dodano notatkę", currentTicket.etr, uploadedPhotos, comment);
                                          setUploadedPhotos([]);
                                          setComment('');
                                        }} 
                                        className="mt-4 w-full text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                      >
                                        {uploadProgress ? (
                                          <><i className="ph ph-spinner animate-spin text-lg"></i> {uploadProgress}</>
                                        ) : (
                                          <><i className="ph ph-paper-plane-tilt text-lg"></i> Dodaj sam komentarz/zdjęcie (bez zmiany kroku)</>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PRAWA KOLUMNA (Historia Zdarzeń) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h4 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
                </h4>
                
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-5 pb-4">
                  {Array.isArray(currentTicket.history) && [...currentTicket.history].reverse().map((entry, index) => (
                    <div key={index} className="relative pl-8">
                      {/* Punkt na osi */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#111827]"></div>
                      
                      {/* Treść */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-[#111827] text-sm">{entry.user || 'System'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {safeParseDate(entry.date)?.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Brak daty'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{entry.action}</div>
                      {entry.note && (
                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 italic">
                          &quot;{entry.note}&quot;
                        </div>
                      )}
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {entry.photos.map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt="załącznik" 
                              className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              onClick={() => setLightboxImg(url)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      {machines?.some(m => m.id === currentTicket.machineId) && (
        <div className="mt-8">
          <MachineDTR machine={machines?.find(m => m.id === currentTicket.machineId)} canManage={user?.role === 'manager' || user?.role === 'admin'} />
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img 
            src={lightboxImg} 
            alt="Powiększenie" 
            className="max-w-full max-h-full object-contain cursor-zoom-out"
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
      </div>
    );
}