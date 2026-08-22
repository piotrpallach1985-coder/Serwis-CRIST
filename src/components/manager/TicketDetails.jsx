import React from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import Toast from './Toast';

export default function TicketDetails({

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
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <button onClick={() => setSelectedTicketId(null)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all">
            <i className="ph ph-arrow-left text-lg"></i> Powrót do rejestru
          </button>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* LEWA KOLUMNA */}
            <div className="w-full lg:w-2/3 space-y-8">
              
              {/* Główna sekcja danych (Tytuł i szczegóły) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  {/* Statusy i Tagi */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="font-bold text-gray-400 mr-2 text-lg">T{currentTicket.id?.slice(0, 4).toUpperCase() || "1"}</span>
                    <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider ${STATUSES[currentTicket.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {STATUSES[currentTicket.status]?.label || 'Nieznany'}
                    </span>
                    {currentTicket.isCritical && (
                      <span className="bg-red-600 animate-pulse text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                        POSTÓJ MASZYNY
                      </span>
                    )}
                  </div>
                  
                  {/* Tytuł */}
                  <h2 className="text-3xl font-extrabold text-[#111827] mb-8">{currentTicket.topic}</h2>
                  
                  {/* Podział na DANE OBIEKTU i INFORMACJE ZGŁOSZENIA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-gray-100 pt-8">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">DANE OBIEKTU</h3>
                      <div className="font-bold text-[#111827] text-lg mb-1">{currentTicket.machineName}</div>
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
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-6 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
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
                
                <div className="p-6 md:p-8 space-y-6 bg-gray-50/50">
                  
                  {/* POKAZYWANIE ZAMKNIĘTYCH KROKÓW (Historia Kroków) */}
                  {Array.isArray(currentTicket.history) && [...currentTicket.history].reverse().map((entry, idx) => {
                    const act = entry.action || '';
                    const isVerification = act.includes('Weryfikacja') && !act.includes('Zgłoszenie awarii');
                    const isAssignment = act.includes('Przekazano do przypisania') || act.includes('Wyboru Wykonawcy');
                    const isStartWork = act.includes('Rozpoczęto realizację');
                    const isFinish = act.includes('Zakończono');
                    
                    if (isVerification || isAssignment || isStartWork || isFinish) {
                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm opacity-75">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                              <i className="ph ph-check-circle text-green-600 text-lg"></i>
                              {entry.action}
                            </span>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {safeParseDate(entry.date)?.toLocaleString('pl-PL') || 'Brak daty'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Wykonał(a): <span className="font-bold text-gray-700">{entry.user}</span></div>
                          {entry.note && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded italic border border-gray-100">
                              Komentarz: &quot;{entry.note}&quot;
                            </div>
                          )}
                          {entry.photos && entry.photos.length > 0 && (
                            <div className="mt-3 flex gap-2 flex-wrap">
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
                      );
                    }
                    return null;
                  })}

                  {currentTicket.status !== 5 && (<>
                  {/* FORMULARZ DLA BIEŻĄCEGO KROKU */}
                  <div className="bg-blue-50/50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                    {user?.role !== 'kierownik' && (
                      <h4 className="font-bold text-blue-900 mb-6 flex items-center gap-2">
                        <i className="ph ph-arrow-circle-right text-xl"></i>
                        Oczekująca akcja: {(currentTicket.status === 1 || currentTicket.status === 'new') ? "Weryfikacja/potwierdzenie awarii" : currentTicket.status === 2 ? "Wybór wykonawcy" : currentTicket.status === 3 ? "Rozpoczęcie pracy" : currentTicket.status === 4 ? "Zakończenie" : ""}
                      </h4>
                    )}
                    
                    <div className="space-y-6">
                      {/* Przypisanie serwisanta - POKAŻ TYLKO GDY STATUS 2 lub 3 (wybór wykonawcy) */}
                      {user?.role !== 'kierownik' && currentTicket.status === 2 && (
                        <div className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm">
                          <label className="block text-sm font-bold text-blue-900 mb-3">Wybierz jednostkę wykonawczą</label>
                          <select 
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full p-3.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-colors"
                          >
                            <option value="">-- Kto się tym zajmie? --</option>
                            {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="flex flex-col gap-6 w-full">
                        {/* Notatka */}
                        <div className="w-full">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            {user?.role === 'kierownik' ? 'TWÓJ KOMENTARZ (WIDOCZNY W HISTORII)' : ((currentTicket.status === 1 || currentTicket.status === 'new') ? "KOMENTARZ Z WERYFIKACJI" : "DODATKOWA NOTATKA")}
                          </label>
                          <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 shadow-sm" rows="4"
                            placeholder="Wpisz komentarz..."
                          ></textarea>
                          
                          <div className="mt-2 space-y-2">
                            
                            <div className="flex gap-2">
                              <label className="flex-1 text-center cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-300">
                                <i className="ph ph-image text-lg"></i> Z Galerii
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
                                      for (let i = 0; i < files.length; i++) {
                                        const file = files[i];
                                        const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                        const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                        const uploadPromise = uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
                                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
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
                              <label className="flex-1 text-center cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-300">
                                <i className="ph ph-camera text-lg"></i> Aparat
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files);
                                    if (!files.length) return;
                                    setUploadProgress('Trwa wysyłanie...');
                                    setIsUploading(true);
                                    setUploadError(null);
                                    let newUrls = [];
                                    try {
                                      for (let i = 0; i < files.length; i++) {
                                        const file = files[i];
                                        const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                        const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                        const uploadPromise = uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
                                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
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
                            {uploadError && <div className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-2 rounded border border-red-200">BŁĄD: {uploadError}</div>}
                            {uploadedPhotos && uploadedPhotos.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto py-1">
                                {uploadedPhotos.map((url, i) => (
                                  <img key={i} src={url} alt="preview" className="w-12 h-12 object-cover rounded border border-gray-300 cursor-pointer" onClick={() => setLightboxImg(url)} />
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
                            className="mt-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {uploadProgress ? uploadProgress : 'Zapisz komentarz'}
                          </button>
                        </div>

                        
                      </div>
                    </div>
                  </div>

                  </>)}
                  {/* Przyciski Akcji (zmienny wariant) */}
                  <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                    {user?.role !== 'kierownik' && (currentTicket.status === 1 || currentTicket.status === 'new') && (
                      <>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Weryfikacja zgłoszenia", etr)} className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                          Przyjęcie zgłoszenia
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
                            className="bg-amber-50 border border-amber-300 hover:bg-amber-100 disabled:opacity-50 text-amber-900 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                            title="Tylko dla Administratora: Szybkie zamknięcie małej usterki"
                          >
                            <i className="ph ph-crown text-amber-600 text-lg"></i>
                            Zamknij od razu (brak awarii)
                          </button>
                        )}
                      </>
                    )}
                    
                    {user?.role !== 'kierownik' && currentTicket.status === 2 && (
                      <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, "Przekazano do: " + selectedService, etr)} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                        Zatwierdź Wykonawcę i Przejdź Dalej
                      </button>
                    )}

                    {user?.role !== 'kierownik' && currentTicket.status === 3 && (
                      <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Rozpoczęto realizację", etr)} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                        Rozpocznij Realizację Prac
                      </button>
                    )}

                    {user?.role !== 'kierownik' && currentTicket.status === 4 && (
                      <div className="w-full flex gap-4">
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, "Zakończono naprawę", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                          Zakończ Prace (Oznacz jako gotowe)
                        </button>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Cofnięto do wyboru wykonawcy", etr)} className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                          Zmień wykonawcę (Cofnij)
                        </button>
                      </div>
                    )}
                    {user?.role !== 'kierownik' && currentTicket.status === 5 && (
                      <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Wznowiono prace (awaria wróciła)", etr)} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                        Otwórz ponownie to zgłoszenie
                      </button>
                    )}

                    {user?.role === 'admin' && !isArchive && (
                      <button 
                        disabled={loading} 
                        onClick={() => handleArchiveTicket(currentTicket.id)}
                        className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="ph ph-archive text-lg"></i>
                        Przenieś to zgłoszenie do Archiwum
                      </button>
                    )}

                    {user?.role === 'admin' && allowTicketDeletion && (
                      <button 
                        disabled={loading} 
                        onClick={() => handleDeleteTicket(currentTicket.id)}
                        className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="ph ph-trash text-lg"></i>
                        Usuń to zgłoszenie z bazy (Czyszczenie wpisu)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PRAWA KOLUMNA (Historia Zdarzeń) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
                </h4>
                
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
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