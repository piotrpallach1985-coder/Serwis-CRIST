import { useManagerContext } from '../../context/ManagerDataContext';
import { useState, useEffect } from 'react';
import { exportToExcel } from '../../utils/reports/excelExport';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import TicketDetails from './TicketDetails';
import TicketTableRow from './TicketTableRow';
import TicketMobileCard from './TicketMobileCard';
import { useTickets } from '../../hooks/useTickets';

const STATUSES = {
  1: { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
  'new': { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
  2: { label: 'Weryfikacja UT', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  3: { label: 'Oczek. na naprawę', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  4: { label: 'Naprawa w trakcie', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  5: { label: 'Zakończone', color: 'bg-green-100 text-green-800 border-green-200' }
};

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
  if (res.length === 0 || mins > 0) res.push(`${mins}m`);
  return res.join(' ');
};

export default function Tickets({ user, isArchive, initialTicketId, onClearTicketId, initialSearchQuery }) {
  const { tickets, machines, reporters, services, plannedServices, notifications, actionItems, roles, regions, allowTicketDeletion, plannedWarningDays, branding } = useManagerContext();

  const ticketState = useTickets({ tickets, machines, regions, isArchive, initialSearchQuery });
  const { filterMachine, setFilterMachine, filterStatus, setFilterStatus, visibleCols, toggleColumn, filteredTickets, activeTickets, loadingArchive, hasMoreArchive, fetchArchive, handleExportExcel } = ticketState;

  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [etr, setEtr] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Tak' });

  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

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
          await updateDoc(doc(db, 'tickets', ticketId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (user?.name || 'System') });
          setSelectedTicketId(null);
          showToast('Zgłoszenie zostało trwale usunięte.');
        } catch (err) {
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
          const currentData = activeTickets.find(t => t.id === ticketId);
          await updateDoc(doc(db, 'tickets', ticketId), {
            isManuallyArchived: true, status: 5,
            closedAt: currentData?.closedAt || new Date().toISOString(),
            completedBy: currentData?.completedBy || user.name,
            history: arrayUnion({
              date: new Date().toISOString(),
              user: user.name,
              action: "Przeniesiono do Archiwum",
              note: "Zamknięto i przeniesiono ręcznie",
              photos: []
            })
          });
          setSelectedTicketId(null);
          showToast('Zgłoszenie pomyślnie zarchiwizowane.');
        } catch (err) {
          showToast("Nie udało się zarchiwizować zgłoszenia: " + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  const handleUpdate = async (ticketId, newStatus, actionText, newEtr = null, photoUrls = [], noteText = '') => {
    setLoading(true);
    const ticketRef = doc(db, 'tickets', ticketId);
    try {
      const currentData = activeTickets.find(t => t.id === ticketId);
      if (!currentData) throw new Error("Zgłoszenie nie istnieje w aktualnym widoku!");
      
      const updateData = {
        history: arrayUnion({
          date: new Date().toISOString(),
          user: user.name,
          action: actionText,
          note: noteText || comment || '',
          photos: photoUrls
        })
      };

      if (photoUrls.length > 0) updateData.photos = arrayUnion(...photoUrls);
      if (newStatus !== undefined) updateData.status = newStatus;
      if (newStatus === 5) {
        updateData.closedAt = new Date().toISOString();
        updateData.completedBy = user.name;
      }
      if (newStatus === 4 && (!currentData.inProgressAt || currentData.status < 4)) {
        updateData.inProgressAt = new Date().toISOString();
      }
      if (selectedService && selectedService !== currentData.assignedTo) {
        updateData.assignedTo = selectedService;
        updateData.assignedAt = new Date().toISOString();
      }
      if (newEtr !== null) updateData.etr = newEtr;

      await updateDoc(ticketRef, updateData);
      setComment('');
      setEtr('');
      showToast('Zgłoszenie zostało zaktualizowane.');
    } catch (err) {
      showToast("Błąd aktualizacji: " + err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTicketId) window.history.pushState({ ...window.history.state, internalDetails: true }, '');
  }, [selectedTicketId]);

  useEffect(() => {
    const handlePopStateForDetails = () => { if (selectedTicketId) setSelectedTicketId(null); };
    window.addEventListener('popstate', handlePopStateForDetails);
    return () => window.removeEventListener('popstate', handlePopStateForDetails);
  }, [selectedTicketId]);

  useEffect(() => {
    if (initialTicketId) {
      setSelectedTicketId(initialTicketId);
      if (onClearTicketId) onClearTicketId();
    }
  }, [initialTicketId, onClearTicketId]);

  const currentTicket = activeTickets.find(t => t.id === selectedTicketId);

  if (selectedTicketId && !currentTicket) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <span className="ml-3 text-gray-500 font-medium">Wczytywanie zgłoszenia...</span>
      </div>
    );
  }

  if (selectedTicketId && currentTicket) {
    return (
      <TicketDetails
        machines={machines}
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

  const openDetails = (ticket) => {
    setSelectedTicketId(ticket.id);
    setSelectedService(ticket.assignedTo || '');
    setEtr(ticket.etr || '');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!isArchive && (
        <div className="hidden lg:grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-6 mb-6">
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-warning-circle"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktywne</div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-siren"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.filter(t => t.isCritical).length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Krytyczne</div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-hourglass-high"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.filter(t => t.status === 3).length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Oczekujące</div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-wrench"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.filter(t => t.status === 4).length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">W Naprawie</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            <input type="text" placeholder="Szukaj (maszyna, temat)..." value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all shadow-sm" />
          </div>
          <div className="relative w-full sm:w-48">
            <i className="ph ph-funnel absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 appearance-none shadow-sm cursor-pointer">
              <option value="">Wszystkie statusy</option>
              {!isArchive && (
                <>
                  <option value="1">Otwarte (Zgłoszone)</option>
                  <option value="2">Weryfikacja UT</option>
                  <option value="3">Oczekujące na naprawę</option>
                  <option value="4">W trakcie naprawy</option>
                </>
              )}
              {isArchive && <option value="5">Zakończone</option>}
            </select>
          </div>
          {(filterMachine || filterStatus) && (
            <button
              onClick={() => { setFilterMachine(''); setFilterStatus(''); }}
              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Wyczyść wszystkie filtry"
            >
              <i className="ph ph-x text-base font-bold"></i> Usuń filtr
            </button>
          )}
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative">
            <button onClick={() => setShowColumnPicker(!showColumnPicker)} className="w-full lg:w-auto bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
              <i className="ph ph-columns text-lg"></i> Widok
            </button>
            {showColumnPicker && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
                <div className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Dostosuj kolumny</div>
                <div className="space-y-2">
                  {Object.keys(visibleCols).map(key => (
                    <label key={key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={visibleCols[key]} onChange={() => toggleColumn(key)} className="rounded text-blue-600" />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleExportExcel} className="flex-1 lg:flex-none bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
            <i className="ph ph-file-xls text-lg"></i> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">Brak zgłoszeń spełniających kryteria.</div>
        ) : (
          filteredTickets.map(ticket => (
            <TicketMobileCard key={ticket.id} ticket={ticket} machines={machines} STATUSES={STATUSES} onOpenDetails={openDetails} />
          ))
        )}
      </div>

      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                {visibleCols.date && <th className="px-6 py-4">Data zgłoszenia</th>}
                {visibleCols.region && <th className="px-6 py-4">Miejsce (Rejon)</th>}
                {visibleCols.machine && <th className="px-6 py-4">Maszynę</th>}
                {visibleCols.bay && <th className="px-6 py-4">Przelot/Inf.</th>}
                {visibleCols.topic && <th className="px-6 py-4">Temat</th>}
                {visibleCols.reporter && <th className="px-6 py-4">Zgłaszający</th>}
                {visibleCols.status && <th className="px-6 py-4">Status</th>}
                {visibleCols.service && <th className="px-6 py-4">Przypisany Serwis</th>}
                {visibleCols.duration && <th className="px-6 py-4">Czas trwania</th>}
                <th className="px-6 py-4 w-12 text-center">Akcje</th>
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
                  <TicketTableRow key={ticket.id} ticket={ticket} visibleCols={visibleCols} STATUSES={STATUSES} machines={machines} calculateDuration={calculateDuration} onOpenDetails={openDetails} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {isArchive && hasMoreArchive && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
            <button onClick={() => fetchArchive(true)} disabled={loadingArchive} className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded transition-colors disabled:opacity-50">
              {loadingArchive ? 'Ładowanie...' : 'Załaduj więcej'}
            </button>
          </div>
        )}
      </div>
      
      {toastConfig.message && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig({ message: '', type: 'success' })} />}
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </div>
  );
}

