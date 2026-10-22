import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useManagerStore } from '../../store/managerStore';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { exportToExcel } from '../../utils/reports/excelExport';
import { updateTicket, deleteTicket } from '../../services/tickets.service';
import { arrayUnion, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import TicketDetails from './TicketDetails';
import TicketFilters from './TicketFilters';
import ErrorBoundary from '../ErrorBoundary';
import TicketTable from './TicketTable';

import TicketMobileCard from './TicketMobileCard';
import { useTickets } from '../../hooks/useTickets';
import { usePagination } from '../../hooks/usePagination';
import { usePermissions } from '../../hooks/usePermissions';
import {
  filterTasksForFieldTechnician,
  filterMachinesForFieldTechnician,
} from '../../utils/fieldServiceHelpers';
import DebouncedInput from './DebouncedInput';
import { safe } from '../../utils/safeRender';
import { useToast } from '../../hooks/useToast';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { TICKET_STATUS } from '../../utils/constants';
import { getTicketStatusConfig } from '../../utils/statusConfigs';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useTranslation } from 'react-i18next';

const STATUSES = (t) => getTicketStatusConfig(t);

const calculateDuration = (createdAt, closedAt, t) => {
  const start = safeParseDate(createdAt);
  const end = safeParseDate(closedAt) || new Date();
  if (!start) return t('tickets.duration.no_data');
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

export default function Tickets({ isArchive, initialTicketId, onClearTicketId, initialSearchQuery, onClearSearchQuery }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tickets, machines, reporters, services, plannedServices, notifications, actionItems, roles, regions, allowTicketDeletion, plannedWarningDays, branding } = useManagerStore();
  const { onlyAssignedTasks } = usePermissions(user, roles);

  const scopedTickets = useMemo(
    () => filterTasksForFieldTechnician(tickets, user, onlyAssignedTasks),
    [tickets, user, onlyAssignedTasks]
  );
  const scopedMachines = useMemo(
    () =>
      filterMachinesForFieldTechnician(
        machines,
        tickets,
        plannedServices,
        user,
        onlyAssignedTasks
      ),
    [machines, tickets, plannedServices, user, onlyAssignedTasks]
  );

  const ticketState = useTickets({
    tickets: scopedTickets,
    machines: scopedMachines,
    regions,
    isArchive,
    initialSearchQuery,
    user,
    onlyAssignedTasks,
  });
  const { filterMachine, setFilterMachine, filterStatus, setFilterStatus, filterRegion, setFilterRegion, filterMachineId, setFilterMachineId, filterTime, setFilterTime, visibleCols, toggleColumn, filteredTickets, activeTickets, loadingArchive, hasMoreArchive, fetchArchive, handleExportExcel } = ticketState;

  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
  const [recentlyClosedTicket, setRecentlyClosedTicket] = useState(null);
  const { currentItems, hasMore: hasMoreLocalItems, setCurrentPage, loadMore } = usePagination(filteredTickets, 30, [filterMachine, filterStatus, filterRegion, filterMachineId, filterTime]);
  const criticalTicketsCount = useMemo(() => activeTickets.filter(t => t.isCritical).length, [activeTickets]);
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
      title: t('tickets.messages.delete_title'),
      message: t('tickets.messages.delete_desc'),
      confirmText: t('tickets.messages.delete_confirm'),
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          await deleteTicket(ticketId, user?.name);
          setSelectedTicketId(null);
          showToast(t('tickets.messages.deleted_success'));
        } catch (err) {
          showToast(t('tickets.messages.delete_error') + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  const handleArchiveTicket = (ticketId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: t('tickets.messages.archive_title'),
      message: t('tickets.messages.archive_desc'),
      confirmText: t('tickets.messages.archive_confirm'),
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          const currentData = activeTickets.find(t => t.id === ticketId) || (recentlyClosedTicket?.id === ticketId ? recentlyClosedTicket : null);
          const closedAtStr = currentData?.closedAt || new Date().toISOString();
          const completedByStr = currentData?.completedBy || user.name;
          const historyItem = {
            date: new Date().toISOString(),
            user: user.name,
            action: t('tickets.history.moved_to_archive'),
            note: t('tickets.history.closed_manually'),
            photos: []
          };
          await updateTicket(ticketId, {
            isManuallyArchived: true, status: 5,
            closedAt: closedAtStr,
            completedBy: completedByStr,
            history: arrayUnion(historyItem)
          });
          if (currentData) {
            setRecentlyClosedTicket({
              ...currentData,
              isManuallyArchived: true,
              status: 5,
              closedAt: closedAtStr,
              completedBy: completedByStr,
              history: [...(currentData.history || []), historyItem]
            });
          }
          showToast(t('tickets.messages.archived_success'));
        } catch (err) {
          showToast(t('tickets.messages.archive_error') + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  const handleUpdate = async (
    ticketId,
    newStatus,
    actionText,
    newEtr = null,
    photoUrls = [],
    noteText = '',
    extraData = null
  ) => {
    setLoading(true);
    try {
      const currentData = activeTickets.find(t => t.id === ticketId) || (recentlyClosedTicket?.id === ticketId ? recentlyClosedTicket : null);
      if (!currentData) throw new Error(t('tickets.messages.no_ticket'));

      const historyItem = {
        date: new Date().toISOString(),
        user: user.name,
        action: actionText,
        note: noteText || comment || '',
        photos: photoUrls,
        ...(extraData?.fGasProtocol ? { fGasProtocol: extraData.fGasProtocol } : {}),
        ...(extraData?.completedGps ? { completedGps: extraData.completedGps } : {}),
        ...(extraData?.clientSignerName ? { clientSignerName: extraData.clientSignerName } : {}),
        ...(extraData?.inspectorLicense ? { inspectorLicense: extraData.inspectorLicense } : {}),
      };

      const updateData = {
        history: arrayUnion(historyItem)
      };

      if (extraData && typeof extraData === 'object') {
        if (extraData.completedGps !== undefined) updateData.completedGps = extraData.completedGps;
        if (extraData.fGasProtocol !== undefined) updateData.fGasProtocol = extraData.fGasProtocol;
        if (extraData.clientSignature !== undefined)
          updateData.clientSignature = extraData.clientSignature;
        if (extraData.clientSignerName !== undefined)
          updateData.clientSignerName = extraData.clientSignerName;
        if (extraData.inspectorLicense !== undefined)
          updateData.inspectorLicense = extraData.inspectorLicense;
      }

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

      await updateTicket(ticketId, updateData);
      setComment('');
      setEtr('');
      showToast(t('tickets.messages.update_success'));
      if (Number(newStatus) === TICKET_STATUS.CLOSED) {
        setRecentlyClosedTicket({
          ...currentData,
          ...(extraData || {}),
          status: TICKET_STATUS.CLOSED,
          closedAt: updateData.closedAt,
          completedBy: updateData.completedBy,
          assignedTo: updateData.assignedTo || currentData.assignedTo,
          history: [...(currentData.history || []), historyItem],
          photos: photoUrls.length > 0 ? [...(currentData.photos || []), ...photoUrls] : (currentData.photos || [])
        });
      } else if (newStatus !== undefined && newStatus !== null) {
        setRecentlyClosedTicket(null);
      }
    } catch (err) {
      showToast(t('tickets.messages.update_error') + err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTicketId && selectedTicketId !== initialTicketId) { window.history.pushState({ ...window.history.state, internalDetails: true }, ''); }
    if (!selectedTicketId) setRecentlyClosedTicket(null);
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

  const currentTicket = activeTickets.find(t => t.id === selectedTicketId) || (recentlyClosedTicket?.id === selectedTicketId ? recentlyClosedTicket : null);

  const openDetails = useCallback((ticket) => {
    setSelectedTicketId(ticket.id);
    setSelectedService(ticket.assignedTo || '');
    setEtr(ticket.etr || '');
  }, []);

  const renderContent = () => {
    if (selectedTicketId && !currentTicket) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-500 font-medium">{t('tickets.messages.loading')}</span>
        </div>
      );
    }

    if (selectedTicketId && currentTicket) {
      return (
        <ErrorBoundary>
          <TicketDetails
            machines={scopedMachines}
            currentTicket={currentTicket}
            setSelectedTicketId={setSelectedTicketId}
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
            STATUSES={STATUSES(t)}
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
                <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{t('tickets.active_tickets_count')}</div>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
                <i className="ph ph-siren"></i>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-bold text-gray-800 leading-none">{criticalTicketsCount}</div>
                <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{t('tickets.critical_tickets_count')}</div>
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
            machines={scopedMachines}
            onClearSearchQuery={onClearSearchQuery}
          />

          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative w-full lg:w-auto hidden lg:block">
              <button onClick={() => setShowColumnPicker(!showColumnPicker)} className="w-full lg:w-auto bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                <i className="ph ph-columns text-lg"></i> {t('tickets.view')}
              </button>
              {showColumnPicker && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] p-4">
                  <div className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{t('tickets.customize_columns')}</div>
                  <div className="space-y-2">
                    {Object.keys(visibleCols).map(key => {
                      const COL_LABELS = {
                        date: isArchive ? t('tickets.cols.date_archive') : t('tickets.cols.date_active'),
                        region: t('tickets.cols.region'),
                        machine: t('tickets.cols.machine'),
                        bay: t('tickets.cols.bay'),
                        topic: t('tickets.cols.topic'),
                        reporter: t('tickets.cols.reporter'),
                        status: t('tickets.cols.status'),
                        service: t('tickets.cols.service'),
                        duration: t('tickets.cols.duration')
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
          </div>
        </div>

        <TicketTable
          filteredTickets={filteredTickets}
          currentItems={currentItems}
          visibleCols={visibleCols}
          isArchive={isArchive}
          STATUSES={STATUSES(t)}
          machines={scopedMachines}
          calculateDuration={(createdAt, closedAt, t_arg) => calculateDuration(createdAt, closedAt, t_arg || t)}
          openDetails={openDetails}
          hasMoreLocalItems={hasMoreLocalItems}
          setCurrentPage={setCurrentPage}
          hasMoreArchive={hasMoreArchive}
          fetchArchive={fetchArchive}
          loadingArchive={loadingArchive}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {toastConfig.show && <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />}
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </>
  );
}

Tickets.propTypes = {
  isArchive: PropTypes.bool,
  initialTicketId: PropTypes.string,
  onClearTicketId: PropTypes.func,
  initialSearchQuery: PropTypes.string,
  onClearSearchQuery: PropTypes.func,
};
