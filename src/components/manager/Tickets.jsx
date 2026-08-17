import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

export default function Tickets({ tickets, machines = [], user, services, isArchive, initialTicketId, onClearTicketId, initialSearchQuery }) {
  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);

  const [etr, setEtr] = useState('');
  const [filterMachine, setFilterMachine] = useState(initialSearchQuery || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const [confirmModalConfig, setConfirmModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    confirmText: 'Tak'
  });

  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  // Domyślne kolumny tabeli
  const DEFAULT_COLS = {
    date: true,
    region: true,
    machine: true,
    bay: true,
    topic: true,
    reporter: true,
    status: true,
    service: true,
    duration: true,
  };

  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('ticket_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLS;
    } catch (e) {
      return DEFAULT_COLS;
    }
  });

  const toggleColumn = (key) => {
    setVisibleCols(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ticket_columns', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (snap) => {
      if (snap.exists() && snap.data().allowTicketDeletion !== undefined) {
        setAllowTicketDeletion(snap.data().allowTicketDeletion);
      }
    });
    return () => unsub();
  }, []);

  const handleDeleteTicket = (ticketId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Usunąć zgłoszenie?',
      message: 'Czy na pewno chcesz BEZPOWROTNIE USUNĄĆ to zgłoszenie z bazy?',
      confirmText: 'Tak, usuń',
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          await deleteDoc(doc(db, 'tickets', ticketId));
          setSelectedTicketId(null);
          showToast('Zgłoszenie zostało trwale usunięte.');
        } catch (err) {
          console.error("Błąd usuwania zgłoszenia:", err);
          showToast("Nie udało się usunąć zgłoszenia: " + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  const handleArchiveTicket = (ticketId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Zarchiwizować zgłoszenie?',
      message: 'Czy na pewno chcesz przenieść to zgłoszenie do Archiwum?',
      confirmText: 'Tak, archiwizuj',
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          await updateDoc(doc(db, 'tickets', ticketId), {
            isManuallyArchived: true,
            closedAt: new Date().toISOString()
          });
          setSelectedTicketId(null);
          showToast('Zgłoszenie pomyślnie zarchiwizowane.');
        } catch (err) {
          console.error("Błąd archiwizacji zgłoszenia:", err);
          showToast("Nie udało się zarchiwizować zgłoszenia: " + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  // Nasłuchiwanie na zmiany globalnego filtru z mapy
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setFilterMachine(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Handle external selection
  useEffect(() => {
    if (initialTicketId) {
      setSelectedTicketId(initialTicketId);
      if (onClearTicketId) onClearTicketId(); // clear it so it doesn't get stuck
    }
  }, [initialTicketId, onClearTicketId]);

  const STATUSES = {
    1: { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
    'new': { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
    2: { label: 'Weryfikacja UT', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    3: { label: 'Wybór wykonawcy', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    4: { label: 'W realizacji', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    5: { label: 'Zakończone', color: 'bg-green-100 text-green-800 border-green-200' }
  };

  const calculateDuration = (createdAt, closedAt) => {
    if (!createdAt) return 'Brak danych';
    const start = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const end = closedAt ? (closedAt.toDate ? closedAt.toDate() : new Date(closedAt)) : new Date();
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / 1440);
    const hours = Math.floor((diffMins % 1440) / 60);
    const mins = diffMins % 60;

    let res = [];
    if (days > 0) res.push(`${days}d`);
    if (hours > 0) res.push(`${hours}g`);
    res.push(`${mins}m`);
    return res.join(' ');
  };

  // Bezpieczna aktualizacja (zmieniona z transakcji na updateDoc dla wsparcia offline)
  const handleUpdate = async (ticketId, newStatus, actionText, newEtr = null) => {
    setLoading(true);
    const ticketRef = doc(db, 'tickets', ticketId);

    try {
      const currentData = tickets.find(t => t.id === ticketId);
      if (!currentData) {
        throw new Error("Zgłoszenie nie istnieje w aktualnym widoku!");
      }
      
      // Przygotowanie danych do update'u
      const updateData = {
        history: arrayUnion({
          date: new Date().toISOString(),
          user: user.name,
          action: actionText,
          note: comment || ''
        })
      };

      if (newEtr !== null && newEtr !== undefined) {
        updateData.etr = newEtr;
      }

      if (newStatus !== null) {
        updateData.status = newStatus;
        if (newStatus === 5) {
          updateData.closedAt = serverTimestamp();
        } else if (newStatus !== 5 && isArchive) {
          updateData.closedAt = null;
        }
      }

      if (selectedService !== '') {
        updateData.assignedTo = selectedService;
      } else if (selectedService === '' && currentData.assignedTo) {
        // Jeśli wyczyszczono serwis
        updateData.assignedTo = currentData.assignedTo;
      }

      // Wykonanie zapisu asynchronicznie (bez blokowania)
      updateDoc(ticketRef, updateData).then(() => {
        showToast('Zgłoszenie zostało zaktualizowane.');
      }).catch(error => {
        console.error("Błąd aktualizacji w tle:", error);
        showToast('Błąd aktualizacji: ' + error.message, 'error');
      });

      // Zamiast zamykać, zostajemy w widoku (selectedTicketId pozostaje)
      setComment('');
      setLoading(false); // Odblokowujemy interfejs natychmiast
    } catch (error) {
      console.error("Błąd aktualizacji zgłoszenia:", error);
      showToast('Nie udało się zapisać zmian. Błąd: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const currentTicket = selectedTicketId ? (tickets.find(t => t.id === selectedTicketId) || (isArchive ? tickets.find(t => t.id === selectedTicketId) : null)) : null;

  // Pełny widok szczegółów zgłoszenia
  if (selectedTicketId && currentTicket) {
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
          <button onClick={() => setSelectedTicketId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors">
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
                        Zgłoszono: {currentTicket.createdAt?.toDate ? currentTicket.createdAt.toDate().toLocaleString('pl-PL') : new Date(currentTicket.createdAt).toLocaleString('pl-PL')}
                      </div>
                      {currentTicket.etr && (
                        <div className="text-orange-600 font-bold text-sm mt-2">
                          ETR: {currentTicket.etr}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OPIS AWARII */}
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">OPIS AWARII</h3>
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-6 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
                    {currentTicket.description}
                  </div>
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
                  {currentTicket.history && [...currentTicket.history].reverse().map((entry, idx) => {
                    const isVerification = entry.action.includes('Weryfikacja') && !entry.action.includes('Zgłoszenie awarii');
                    const isAssignment = entry.action.includes('Przekazano do przypisania') || entry.action.includes('Wyboru Wykonawcy');
                    const isStartWork = entry.action.includes('Rozpoczęto realizację');
                    const isFinish = entry.action.includes('Zakończono');
                    
                    if (isVerification || isAssignment || isStartWork || isFinish) {
                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm opacity-75">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                              <i className="ph ph-check-circle text-green-600 text-lg"></i>
                              {entry.action}
                            </span>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {new Date(entry.date).toLocaleString('pl-PL')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Wykonał(a): <span className="font-bold text-gray-700">{entry.user}</span></div>
                          {entry.note && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded italic border border-gray-100">
                              Komentarz: "{entry.note}"
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}

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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Notatka */}
                        <div className={user?.role === 'kierownik' ? 'col-span-1 md:col-span-2' : ''}>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            {user?.role === 'kierownik' ? 'TWÓJ KOMENTARZ (WIDOCZNY W HISTORII)' : ((currentTicket.status === 1 || currentTicket.status === 'new') ? "KOMENTARZ Z WERYFIKACJI" : "DODATKOWA NOTATKA")}
                          </label>
                          <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 shadow-sm" rows="2"
                            placeholder="Wpisz komentarz..."
                          ></textarea>
                          <button 
                            disabled={loading || !comment.trim()} 
                            onClick={() => handleUpdate(currentTicket.id, null, user?.role === 'kierownik' ? "Komentarz kierownika" : "Dodano notatkę", currentTicket.etr)} 
                            className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                          >
                            Zapisz komentarz
                          </button>
                        </div>

                        {/* ETR */}
                        {user?.role !== 'kierownik' && (
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ORIENTACYJNY CZAS NAPRAWY (ETR)</label>
                            <input 
                              type="text"
                              value={etr}
                              onChange={(e) => setEtr(e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 shadow-sm"
                              placeholder="np. 2 godziny (opcjonalnie)"
                            />
                            <button 
                              disabled={loading || !etr.trim()} 
                              onClick={() => {
                                handleUpdate(currentTicket.id, null, "Zaktualizowano szacowany czas (ETR)", etr);
                                setEtr('');
                              }} 
                              className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                            >
                              Zapisz ETR
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Przyciski Akcji (zmienny wariant) */}
                  <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                    {user?.role !== 'kierownik' && (currentTicket.status === 1 || currentTicket.status === 'new') && (
                      <>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Weryfikacja zgłoszenia", etr)} className="flex-1 min-w-[200px] bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
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
                      <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, "Przekazano do: " + selectedService, etr)} className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                        Zatwierdź Wykonawcę i Przejdź Dalej
                      </button>
                    )}

                    {user?.role !== 'kierownik' && currentTicket.status === 3 && (
                      <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Rozpoczęto realizację", etr)} className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
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
                  {currentTicket.history && [...currentTicket.history].reverse().map((entry, index) => (
                    <div key={index} className="relative pl-8">
                      {/* Punkt na osi */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#111827]"></div>
                      
                      {/* Treść */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-[#111827] text-sm">{entry.user || 'System'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {new Date(entry.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{entry.action}</div>
                      {entry.note && (
                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 italic">
                          "{entry.note}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Sortowanie i filtrowanie
  const sortedTickets = [...tickets].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  const filteredTickets = sortedTickets.filter(t => {
    const searchStr = filterMachine.toLowerCase();
    const matchMachine = (t.machineName?.toLowerCase() || '').includes(searchStr) || 
                         (t.department?.toLowerCase() || '').includes(searchStr) ||
                         (t.regionName?.toLowerCase() || '').includes(searchStr);
    const matchStatus = filterStatus ? t.status.toString() === filterStatus : true;
    return matchMachine && matchStatus;
  });

  // Obliczenia statystyk dla Dashboardu
  const activeTickets = tickets.filter(t => t.status !== 5);
  const criticalTickets = activeTickets.filter(t => t.isCritical);
  const completedToday = tickets.filter(t => {
    if (t.status !== 5 || !t.closedAt) return false;
    const closedDate = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
    const today = new Date();
    return closedDate.toDateString() === today.toDateString();
  });

  // Jeśli brak wybranego zgłoszenia, pokaż widok tabelaryczny
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Statystyki Dashboard (tylko w widoku głównym) */}
      {!isArchive && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-6">
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-warning-circle"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktywne</div>
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-siren"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{criticalTickets.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Krytyczne</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-check-circle"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{completedToday.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Zakończone</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-engine"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{machines.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maszyn</div>
            </div>
          </div>
        </div>
      )}

      {/* Pasek filtrów i opcji */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Szukaj po maszynie, dziale lub zgłaszającym..." 
              value={filterMachine}
              onChange={e => setFilterMachine(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          {!isArchive && (
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[200px]"
            >
              <option value="">Wszystkie statusy</option>
              <option value="1">1 - Zgłoszone</option>
              <option value="2">2 - Weryfikacja UT</option>
              <option value="3">3 - Wybór wykonawcy</option>
              <option value="4">4 - W realizacji</option>
            </select>
          )}

          {/* Przycisk czyszczenia filtrów */}
          <button
            onClick={() => {
              setFilterMachine('');
              setFilterStatus('');
            }}
            disabled={!filterMachine && !filterStatus}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm rounded-lg border border-red-200 transition-colors whitespace-nowrap"
            title="Wyczyść wszystkie filtry wyszukiwania"
          >
            <i className="ph ph-funnel-x text-lg"></i>
            Wyczyść filtry
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Przycisk Dostosuj Kolumny */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-gray-300 transition-colors"
            >
              <i className="ph ph-[#111827] ph-columns text-base"></i>
              Dostosuj kolumny
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in">
                <div className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span>Widoczne Kolumny</span>
                  <button onClick={() => setShowColumnPicker(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="ph ph-x text-sm"></i>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.date} onChange={() => toggleColumn('date')} className="rounded text-blue-600" />
                    Data zgłoszenia
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.region} onChange={() => toggleColumn('region')} className="rounded text-blue-600" />
                    Miejsce (Rejon)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.machine} onChange={() => toggleColumn('machine')} className="rounded text-blue-600" />
                    Maszyna
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.bay} onChange={() => toggleColumn('bay')} className="rounded text-blue-600" />
                    Przelot / Inf. dodatkowa
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.topic} onChange={() => toggleColumn('topic')} className="rounded text-blue-600" />
                    Temat zgłoszenia
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.reporter} onChange={() => toggleColumn('reporter')} className="rounded text-blue-600" />
                    Zgłaszający (Kto zgłosił)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.status} onChange={() => toggleColumn('status')} className="rounded text-blue-600" />
                    Status
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.service} onChange={() => toggleColumn('service')} className="rounded text-blue-600" />
                    Przypisany Serwis
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.duration} onChange={() => toggleColumn('duration')} className="rounded text-blue-600" />
                    Czas trwania
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm font-bold text-gray-500">
            Zgłoszeń: {filteredTickets.length}
          </div>
        </div>
      </div>

      {/* Tabela zgłoszeń */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                {visibleCols.date && <th className="px-6 py-4">Data zgłoszenia</th>}
                {visibleCols.region && <th className="px-6 py-4">Miejsce (Rejon)</th>}
                {visibleCols.machine && <th className="px-6 py-4">Maszyna</th>}
                {visibleCols.bay && <th className="px-6 py-4">Przelot/Inf.</th>}
                {visibleCols.topic && <th className="px-6 py-4">Temat</th>}
                {visibleCols.reporter && <th className="px-6 py-4">Zgłaszający</th>}
                {visibleCols.status && <th className="px-6 py-4">Status</th>}
                {visibleCols.service && <th className="px-6 py-4">Przypisany Serwis</th>}
                {visibleCols.duration && <th className="px-6 py-4">Czas trwania</th>}
                <th className="px-6 py-4 text-right">Szczegóły</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500 border-dashed border-2 border-gray-100 m-4">
                    Brak zgłoszeń spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                    {visibleCols.date && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">
                          {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString('pl-PL') : new Date(ticket.createdAt).toLocaleDateString('pl-PL')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : new Date(ticket.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    )}
                    
                    {visibleCols.region && (
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {ticket.regionName || '-'}
                      </td>
                    )}

                    {visibleCols.machine && (
                      <td className="px-6 py-4 font-bold text-[#111827]">
                        {ticket.machineName}
                      </td>
                    )}

                    {visibleCols.bay && (
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {ticket.bay || '-'}
                      </td>
                    )}

                    {visibleCols.topic && (
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 max-w-[150px] truncate" title={ticket.topic}>{ticket.topic}</div>
                        {ticket.isCritical && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
                            <i className="ph ph-siren"></i> KRYTYCZNE
                          </div>
                        )}
                      </td>
                    )}

                    {visibleCols.reporter && (
                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-gray-800">{ticket.reportedBy || 'Nieznany'}</div>
                        <div className="text-gray-500 font-mono">{ticket.reporterPhone || ''}</div>
                      </td>
                    )}

                    {visibleCols.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STATUSES[ticket.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {STATUSES[ticket.status]?.label || 'Nieznany'}
                        </span>
                      </td>
                    )}

                    {visibleCols.service && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-[120px] truncate" title={ticket.assignedTo || 'Brak'}>
                        {ticket.assignedTo ? ticket.assignedTo : <span className="text-gray-400 italic">Brak przypisania</span>}
                      </td>
                    )}

                    {visibleCols.duration && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 flex items-center gap-1 font-mono">
                          <i className="ph ph-clock text-gray-400"></i> {calculateDuration(ticket.createdAt, ticket.closedAt)}
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setSelectedTicketId(ticket.id); setSelectedService(ticket.assignedTo || ''); setEtr(ticket.etr || ''); }}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-2 group-hover:border-blue-300 group-hover:text-blue-600"
                      >
                        Szczegóły
                        <i className="ph ph-caret-right"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}