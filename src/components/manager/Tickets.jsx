import { useManagerStore } from '../../store/managerStore';
import { useState, useEffect, useCallback } from 'react';
import { exportToExcel } from '../../utils/reports/excelExport';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import TicketDetails from './TicketDetails';
import TicketFilters from './TicketFilters';
import ErrorBoundary from '../ErrorBoundary';
import TicketTable from './TicketTable';
import TicketTableRow from './TicketTableRow';
import TicketMobileCard from './TicketMobileCard';
import { useTickets } from '../../hooks/useTickets';
import DebouncedInput from './DebouncedInput';
import { safe } from "../../utils/safeRender";
import { useToast } from '../../hooks/useToast';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { TICKET_STATUS } from '../../utils/constants';

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

export default function Tickets({ user, isArchive, initialTicketId, onClearTicketId, initialSearchQuery, onClearSearchQuery }) {
  const { tickets, machines, reporters, services, plannedServices, notifications, actionItems, roles, regions, allowTicketDeletion, plannedWarningDays, branding } = useManagerStore();

  const ticketState = useTickets({ tickets, machines, regions, isArchive, initialSearchQuery });
  const { filterMachine, setFilterMachine, filterStatus, setFilterStatus, filterRegion, setFilterRegion, filterMachineId, setFilterMachineId, filterTime, setFilterTime, visibleCols, toggleColumn, filteredTickets, activeTickets, loadingArchive, hasMoreArchive, fetchArchive, handleExportExcel } = ticketState;

  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMachine, filterStatus, filterRegion, filterMachineId, filterTime]);

  const currentItems = filteredTickets.slice(0, currentPage * itemsPerPage);
  const hasMoreLocalItems = currentItems.length < filteredTickets.length;
  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [etr, setEtr] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const { toastConfig, showToast, hideToast } = useToast();
  const { confirmConfig: confirmModalConfig, showConfirm, hideConfirm: closeConfirmModal, setConfirmConfig: setConfirmModalConfig } = useConfirmModal();

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
      if (!currentData) throw new Error("Zgłoszenie nie istnieje w systemie!");
      
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
      if (newStatus !== undefined && newStatus !== null) updateData.status = newStatus;
      if (Number(newStatus) === TICKET_STATUS.CLOSED) {
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
      if (Number(newStatus) === TICKET_STATUS.CLOSED) {
        setSelectedTicketId(null);
        if (onClearTicketId) onClearTicketId();
      }
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

  const openDetails = useCallback((ticket) => {
    setSelectedTicketId(ticket.id);
    setSelectedService(ticket.assignedTo || '');
    setEtr(ticket.etr || '');
  }, []);

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
      <ErrorBoundary>
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
        showToast={showToast}
        showConfirm={showConfirm}
        STATUSES={STATUSES}
        isArchive={isArchive}
      />
      </ErrorBoundary>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!isArchive && (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 max-w-2xl">
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
              <i className="ph ph-warning-circle"></i>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{safe(activeTickets.length)}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Aktywne awarie</div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
              <i className="ph ph-siren"></i>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{activeTickets.filter(t => t.isCritical).length}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Awarie krytyczne</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <TicketFilters
          filterMachine={filterMachine} setFilterMachine={setFilterMachine}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterRegion={filterRegion} setFilterRegion={setFilterRegion}
          filterMachineId={filterMachineId} setFilterMachineId={setFilterMachineId}
          filterTime={filterTime} setFilterTime={setFilterTime}
          isArchive={isArchive}
          regions={regions}
          machines={machines}
          onClearSearchQuery={onClearSearchQuery}
        />
        
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative w-full lg:w-auto hidden lg:block">
              <button onClick={() => setShowColumnPicker(!showColumnPicker)} className="w-full lg:w-auto bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                <i className="ph ph-columns text-lg"></i> Widok
            </button>
            {showColumnPicker && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] p-4">
                <div className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Dostosuj kolumny</div>
                <div className="space-y-2">
                  {Object.keys(visibleCols).map(key => {
                    const COL_LABELS = {
                      date: isArchive ? 'Zakończono / Zgłoszono' : 'Data zgłoszenia',
                      region: 'Miejsce (Rejon)',
                      machine: 'Maszyna',
                      bay: 'Przelot/Inf.',
                      topic: 'Temat',
                      reporter: 'Zgłaszający',
                      status: 'Status',
                      service: 'Przypisany serwis',
                      duration: 'Czas trwania'
                    };
                    return (
                      <label key={key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={visibleCols[key]} onChange={() => toggleColumn(key)} className="rounded text-blue-600" />
                        {COL_LABELS[key] || key}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleExportExcel} className="flex-1 lg:flex-none bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
            <i className="ph ph-file-xls text-lg"></i> Excel
          </button>
        </div>
      </div>

            <TicketTable 
        filteredTickets={filteredTickets}
        currentItems={currentItems}
        visibleCols={visibleCols}
        isArchive={isArchive}
        STATUSES={STATUSES}
        machines={machines}
        calculateDuration={calculateDuration}
        openDetails={openDetails}
        hasMoreLocalItems={hasMoreLocalItems}
        setCurrentPage={setCurrentPage}
        hasMoreArchive={hasMoreArchive}
        fetchArchive={fetchArchive}
        loadingArchive={loadingArchive}
      />
      
      {toastConfig.show && <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />}
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </div>
  );
}

