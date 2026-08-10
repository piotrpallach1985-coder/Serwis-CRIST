import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Tickets({ tickets, user, services, isArchive, initialTicketId, onClearTicketId }) {
  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);

  const [etr, setEtr] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Handle external selection
  useEffect(() => {
    if (initialTicketId) {
      setSelectedTicketId(initialTicketId);
      if (onClearTicketId) onClearTicketId(); // clear it so it doesn't get stuck
    }
  }, [initialTicketId, onClearTicketId]);

  const STATUSES = {
    1: { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
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
      updateDoc(ticketRef, updateData).catch(error => {
        console.error("Błąd aktualizacji w tle:", error);
      });

      // Zamiast zamykać, zostajemy w widoku (selectedTicketId pozostaje)
      setComment('');
      setLoading(false); // Odblokowujemy interfejs natychmiast
    } catch (error) {
      console.error("Błąd aktualizacji zgłoszenia:", error);
      alert('Nie udało się zapisać zmian. Błąd: ' + error.message);
      setLoading(false);
    }
  };

  const currentTicket = selectedTicketId ? (tickets.find(t => t.id === selectedTicketId) || (isArchive ? tickets.find(t => t.id === selectedTicketId) : null)) : null;

  // Pełny widok szczegółów zgłoszenia
  if (selectedTicketId && currentTicket) {
    return (
      <div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#1f2937]">
        
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
                        <i className="ph ph-map-pin"></i> {currentTicket.department || 'Brak Działu'}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">ID: {currentTicket.machineId}</div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">INFORMACJE ZGŁOSZENIA</h3>
                      <div className="font-bold text-[#111827] flex items-center gap-2 mb-2">
                        <i className="ph ph-user text-gray-400"></i> {currentTicket.reportedBy}
                      </div>
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
                  <h3 className="font-bold text-sm tracking-widest uppercase">PANEL DYSPOZYTORA - KROKI REALIZACJI</h3>
                </div>
                
                <div className="p-6 md:p-8 space-y-6 bg-gray-50/50">
                  
                  {/* POKAZYWANIE ZAMKNIĘTYCH KROKÓW (Historia Kroków) */}
                  {currentTicket.history && [...currentTicket.history].reverse().map((entry, idx) => {
                    // Szukamy tylko głównych zdarzeń zmieniających status
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
                    <h4 className="font-bold text-blue-900 mb-6 flex items-center gap-2">
                      <i className="ph ph-arrow-circle-right text-xl"></i>
                      Oczekująca akcja: {currentTicket.status === 1 ? "Weryfikacja/potwierdzenie awarii" : currentTicket.status === 2 ? "Wybór wykonawcy" : currentTicket.status === 3 ? "Rozpoczęcie pracy" : currentTicket.status === 4 ? "Zakończenie" : ""}
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Przypisanie serwisanta - POKAŻ TYLKO GDY STATUS 2 lub 3 (wybór wykonawcy) */}
                      {currentTicket.status === 2 && (
                        <div className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm">
                          <label className="block text-sm font-bold text-blue-900 mb-3">Wybierz jednostkę wykonawczą</label>
                          <select 
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full p-3.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-colors"
                          >
                            <option value="">-- Kto się tym zajmie? --</option>
                            {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            <option value="Serwis Zewnętrzny">Serwis Zewnętrzny</option>
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Notatka */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                            {currentTicket.status === 1 ? "KOMENTARZ Z WERYFIKACJI" : "DODATKOWA NOTATKA"}
                          </label>
                          <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 shadow-sm" rows="2"
                            placeholder="Wpisz uwagi techniczne..."
                          ></textarea>
                        </div>

                        {/* ETR */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ORIENTACYJNY CZAS NAPRAWY (ETR)</label>
                          <input 
                            type="text"
                            value={etr}
                            onChange={(e) => setEtr(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 shadow-sm"
                            placeholder="np. 2 godziny (opcjonalnie)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Przyciski Akcji (zmienny wariant) */}
                  <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                    {currentTicket.status === 1 && (
                      <>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Weryfikacja zgłoszenia", etr)} className="flex-1 min-w-[200px] bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                          Przyjęcie zgłoszenia
                        </button>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, "Zakończono (Tylko restart)", etr)} className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                          Zamknij od razu (brak awarii)
                        </button>
                      </>
                    )}
                    
                    {currentTicket.status === 2 && (
                      <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, "Przekazano do: " + selectedService, etr)} className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                        Zatwierdź Wykonawcę i Przejdź Dalej
                      </button>
                    )}

                    {currentTicket.status === 3 && (
                      <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Rozpoczęto realizację", etr)} className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                        Rozpocznij Realizację Prac
                      </button>
                    )}

                    {currentTicket.status === 4 && (
                      <div className="w-full flex gap-4">
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, "Zakończono naprawę", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors">
                          Zakończ Prace (Oznacz jako gotowe)
                        </button>
                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Cofnięto do wyboru wykonawcy", etr)} className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                          Zmień wykonawcę (Cofnij)
                        </button>
                      </div>
                    )}

                    <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, null, "Zaktualizowano dane", etr)} className="w-full bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                      {loading ? 'Zapisywanie...' : 'Zapisz tylko notatkę / dane'}
                    </button>
                    
                    {currentTicket.status === 5 && (
                      <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Wznowiono prace (awaria wróciła)", etr)} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors">
                        Otwórz ponownie to zgłoszenie
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
    const matchMachine = t.machineName?.toLowerCase().includes(filterMachine.toLowerCase()) || 
                         t.department?.toLowerCase().includes(filterMachine.toLowerCase());
    const matchStatus = filterStatus ? t.status.toString() === filterStatus : true;
    return matchMachine && matchStatus;
  });

  // Jeśli brak wybranego zgłoszenia, pokaż widok tabelaryczny
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Pasek filtrów */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Szukaj po maszynie lub dziale..." 
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
        </div>
        <div className="text-sm font-bold text-gray-500">
          Zgłoszeń: {filteredTickets.length}
        </div>
      </div>

      {/* Tabela zgłoszeń */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Data i Czas trwania</th>
                <th className="px-6 py-4">Maszyna / Dział</th>
                <th className="px-6 py-4">Temat Zgłoszenia</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Przypisany Serwis</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 border-dashed border-2 border-gray-100 m-4">
                    Brak zgłoszeń spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-800">
                        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString('pl-PL') : new Date(ticket.createdAt).toLocaleString('pl-PL')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <i className="ph ph-clock"></i> Trwa: {calculateDuration(ticket.createdAt, ticket.closedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#111827]">{ticket.machineName}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.department ? `Hala: ${ticket.department}` : ''} {ticket.bay ? ` | Przelot: ${ticket.bay}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 max-w-xs truncate" title={ticket.topic}>{ticket.topic}</div>
                      {ticket.isCritical && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
                          <i className="ph ph-siren"></i> KRYTYCZNE
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUSES[ticket.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUSES[ticket.status]?.label || 'Nieznany'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700 flex items-center gap-1">
                        <i className="ph ph-wrench"></i> {ticket.assignedTo || 'Nieprzypisane'}
                      </div>
                      {ticket.etr && (
                        <div className="text-xs text-orange-600 font-bold mt-1">
                          ETR: {ticket.etr}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => { setSelectedTicketId(ticket.id); setSelectedService(ticket.assignedTo || ''); setEtr(ticket.etr || ''); }}
                        className="bg-white border border-gray-300 hover:border-blue-500 text-blue-900 hover:text-blue-700 font-bold py-2 px-4 rounded shadow-sm transition-all text-xs flex items-center gap-2 ml-auto"
                      >
                        <i className="ph ph-magnifying-glass-plus text-lg"></i> Szczegóły
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