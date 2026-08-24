import { exportToExcel } from '../../utils/reports/excelExport';
import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import TicketDetails from './TicketDetails';

export default function Tickets({ tickets, machines = [], user, services, isArchive, initialTicketId, onClearTicketId, initialSearchQuery, allowTicketDeletion }) {
  const handleExportExcel = () => {
    const dataToExport = filteredTickets.map(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      return {
        'ID Zgłoszenia': t.id,
        'Data Zgłoszenia': openD ? openD.toLocaleString('pl-PL') : '-',
        'Data Zamknięcia': closeD ? closeD.toLocaleString('pl-PL') : '-',
        'Maszyna': t.machineName || (machines && machines.find(m => m.id === t.machineId)?.name) || '-',
        'Temat Zgłoszenia': t.topic || '-',
        'Opis Problemu': t.description || '-',
        'Zgłaszający': t.reportedBy || '-',
        'Status': (t.status === 1 ? 'Otwarte' : t.status === 2 ? 'W trakcie' : t.status === 3 ? 'Części' : t.status === 4 ? 'Zewnętrzny' : t.status === 5 ? 'Zakończone' : 'Nieznany')
      };
    });
    exportToExcel(dataToExport, isArchive ? 'Archiwum_Awarii' : 'Zgloszenia_Awarii');
  };

  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);

  const [etr, setEtr] = useState('');
  const [filterMachine, setFilterMachine] = useState(initialSearchQuery || '');
  const [filterStatus, setFilterStatus] = useState('');

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

  // safeParseDate is now imported globally
  const calculateDuration = (createdAt, closedAt) => {
    const start = safeParseDate(createdAt);
    const end = safeParseDate(closedAt) || new Date();
    if (!start) return 'Brak danych';
    
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
  const handleUpdate = async (ticketId, newStatus, actionText, newEtr = null, photoUrls = [], noteText = '') => {
    setLoading(true);
    const ticketRef = doc(db, 'tickets', ticketId);

    try {
      const currentData = tickets.find(t => t.id === ticketId);
      if (!currentData) {
        throw new Error("Zgłoszenie nie istnieje w aktualnym widoku!");
      }
      
      const updateData = {
        history: arrayUnion({
          date: new Date().toISOString(),
          user: user.name,
          action: actionText,
          note: noteText || comment || '',
          photos: photoUrls
        })
      };

      if (photoUrls.length > 0) {
        // Appends new photos to the global ticket photos array (if it exists)
        // Since arrayUnion needs the spread operator for multiple items
        updateData.photos = arrayUnion(...photoUrls);
      }

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
      <TicketDetails
        currentTicket={currentTicket}
        setSelectedTicketId={setSelectedTicketId}
        user={user}
        services={services}
        handleUpdate={handleUpdate}
        handleDeleteTicket={handleDeleteTicket}
        handleArchiveTicket={handleArchiveTicket}
        comment={comment}
        setComment={setComment}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        etr={etr}
        setEtr={setEtr}
        loading={loading}
        allowTicketDeletion={allowTicketDeletion}
        toastConfig={toastConfig}
        setToastConfig={setToastConfig}
        confirmModalConfig={confirmModalConfig}
        setConfirmModalConfig={setConfirmModalConfig}
        STATUSES={STATUSES}
        isArchive={isArchive}
      />
    );
  }

  // Sortowanie i filtrowanie
  const sortedTickets = [...tickets].sort((a, b) => {
    const isAClosed = a.status === 5;
    const isBClosed = b.status === 5;
    if (isAClosed && !isBClosed) return 1;
    if (!isAClosed && isBClosed) return -1;

    const timeA = safeParseDate(a.createdAt)?.getTime() || 0;
    const timeB = safeParseDate(b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const filteredTickets = sortedTickets.filter(t => {
    const searchStr = filterMachine.toLowerCase();
    const matchMachine = (t.machineName?.toLowerCase() || '').includes(searchStr) || 
                         (t.department?.toLowerCase() || '').includes(searchStr) ||
                         (t.regionName?.toLowerCase() || '').includes(searchStr);
    const matchStatus = filterStatus ? String(t.status) === filterStatus : true;
    return matchMachine && matchStatus;
  });

  // Obliczenia statystyk dla Dashboardu
  const activeTickets = tickets.filter(t => t.status !== 5);
  const criticalTickets = activeTickets.filter(t => t.isCritical);
  const completedToday = tickets.filter(t => {
    if (t.status !== 5 || !t.closedAt) return false;
    const closedDate = safeParseDate(t.closedAt) || new Date(0);
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
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors"
          >
            <i className="ph ph-file-xls text-lg"></i>
            Eksportuj (.xlsx)
          </button>
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
                          {safeParseDate(ticket.createdAt)?.toLocaleDateString('pl-PL') || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {safeParseDate(ticket.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-'}
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