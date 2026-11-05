import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useManagerStore } from '../../store/managerStore';

import EmptyState from '../shared/EmptyState';
import DictationButton from '../shared/DictationButton';
import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToActionItems,
  updateActionItem,
  addActionItem,
} from '../../services/tickets.service';
import { safeParseDate } from '../../utils/dateHelpers';
import { exportToExcel } from '../../utils/reports/excelExport';
import { ACTION_ITEM_STATUS, ACTION_ITEM_STATUS_LABELS } from '../../utils/constants';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';
import { usePermissions } from '../../hooks/usePermissions';
import {
  filterMachinesForFieldTechnician,
  isTaskAssignedToUser,
} from '../../utils/fieldServiceHelpers';

export default function ActionItems() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const rawMachines = useManagerStore(state => state.machines) || [];
  const tickets = useManagerStore(state => state.tickets) || [];
  const plannedServices = useManagerStore(state => state.plannedServices) || [];
  const roles = useManagerStore(state => state.roles) || [];
  const storeServices = useManagerStore(state => state.services) || [];
  const storeActionItems = useManagerStore(state => state.actionItems) || [];
  const contractorOptions = roles.length > 0 ? roles : storeServices;
  const regions = useManagerStore(state => state.regions);
  const { onlyAssignedTasks } = usePermissions(user, roles);

  const machines = useMemo(
    () =>
      filterMachinesForFieldTechnician(
        rawMachines,
        tickets,
        plannedServices,
        user,
        onlyAssignedTasks
      ),
    [rawMachines, tickets, plannedServices, user, onlyAssignedTasks]
  );
  const allowedMachineIds = useMemo(() => new Set(machines.map(m => m.id)), [machines]);

  const [localItems, setItems] = useState([]);
  const items = localItems.length > 0 ? localItems : storeActionItems;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMachineId, setNewMachineId] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [savingNewItem, setSavingNewItem] = useState(false);

  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => {
      const createdDate = safeParseDate(item.createdAt);
      const dueDate = safeParseDate(item.dueDate);
      const completedDate = safeParseDate(item.completedAt);
      const itemContractor = item.assignedService || item.contractor || item.assignedTo || '-';
      return {
        ID: item.id,
        [t('admin.action_items.created_date')]: createdDate
          ? createdDate.toLocaleDateString('pl-PL')
          : '-',
        [t('admin.action_items.machine')]:
          item.machineName || getMachineName(item.machineId) || '-',
        [t('admin.action_items.problem_task')]: item.problem || '-',
        [t('admin.action_items.contractor', 'Wykonawca')]: itemContractor,
        [t('admin.action_items.required_date')]: dueDate
          ? dueDate.toLocaleDateString('pl-PL')
          : '-',
        [t('admin.action_items.reporter')]: item.createdBy || '-',
        [t('admin.action_items.status')]: ACTION_ITEM_STATUS_LABELS[item.status] || item.status,
        [t('admin.action_items.completed')]: item.completedBy || '-',
        [t('admin.action_items.created_date')]: completedDate
          ? completedDate.toLocaleDateString('pl-PL')
          : '-',
      };
    });
    exportToExcel(dataToExport, 'Tematy_do_realizacji');
  };

  const [filterStatus, setFilterStatus] = useState(ACTION_ITEM_STATUS.PENDING);
  const [filterTime, setFilterTime] = useState('all');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToActionItems(
      snapshotDocs => {
        setItems(snapshotDocs.filter(item => !item.isDeleted));
        setLoading(false);
      },
      err => {
        alert('Błąd ładowania Tematów do Realizacji: ' + err.message);
        console.error(err);
        setLoading(false);
      },
      err => {
        console.debug('Listener detached:', err.code);
      }
    );
    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const future30 = new Date();
    future30.setDate(now.getDate() + 30);
    const future90 = new Date();
    future90.setDate(now.getDate() + 90);

    const filtered = items.filter(item => {
      if (
        onlyAssignedTasks &&
        !allowedMachineIds.has(item.machineId) &&
        !isTaskAssignedToUser(item, user)
      ) {
        return false;
      }

      // 1. Status Filter
      if (filterStatus === ACTION_ITEM_STATUS.PENDING && item.status === ACTION_ITEM_STATUS.COMPLETED)
        return false;
      if (
        filterStatus === ACTION_ITEM_STATUS.COMPLETED &&
        item.status !== ACTION_ITEM_STATUS.COMPLETED
      )
        return false;

      const machine =
        rawMachines.find(m => m.id === item.machineId) ||
        machines.find(m => m.id === item.machineId) ||
        {};

      // 2. Region Filter
      if (filterRegion && machine?.regionId !== filterRegion) return false;

      // 3. Machine Filter
      if (filterMachine && item.machineId !== filterMachine) return false;

      // Zapytanie wyszukiwania
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const titleMatch = item.problem?.toLowerCase().includes(queryLower);
        const machineMatch = machine?.name?.toLowerCase().includes(queryLower);
        const contractorVal = (
          item.assignedService ||
          item.contractor ||
          item.assignedTo ||
          ''
        ).toLowerCase();
        const contractorMatch = contractorVal.includes(queryLower);
        if (!titleMatch && !machineMatch && !contractorMatch) return false;
      }

      // 4. Time Filter
      if (filterTime !== 'all') {
        if (!item.dueDate) return false;
        const dDate = safeParseDate(item.dueDate);
        if (!dDate) return false;

        let isWithinTime = false;
        if (filterTime === '30' && dDate <= future30) isWithinTime = true;
        if (filterTime === '90' && dDate <= future90) isWithinTime = true;

        if (!isWithinTime) return false;
      }

      return true;
    });

    // Logika sortowania (domyślnie po dacie dodania)
    return filtered.sort((a, b) => {
      if (
        filterStatus === ACTION_ITEM_STATUS.COMPLETED ||
        filterStatus === ACTION_ITEM_STATUS.CANCELLED
      ) {
        const dA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dB - dA;
      }

      const dA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
      return dA - dB;
    });
  }, [
    items,
    filterStatus,
    filterTime,
    filterRegion,
    filterMachine,
    rawMachines,
    machines,
    searchQuery,
    onlyAssignedTasks,
    allowedMachineIds,
    user,
  ]);

  const getMachineName = id =>
    rawMachines.find(m => m.id === id)?.name ||
    machines.find(m => m.id === id)?.name ||
    t('admin.action_items.unknown_machine');

  const handleStatusChange = async (id, newStatus) => {
    let confirmMsg = '';
    if (newStatus === ACTION_ITEM_STATUS.COMPLETED)
      confirmMsg = 'Czy na pewno chcesz oznaczyć ten temat jako zrealizowany?';
    if (newStatus === ACTION_ITEM_STATUS.CANCELLED)
      confirmMsg = 'Czy na pewno chcesz anulować ten temat?';

    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
      const updateData = { status: newStatus };
      if (
        newStatus === ACTION_ITEM_STATUS.COMPLETED ||
        newStatus === ACTION_ITEM_STATUS.CANCELLED
      ) {
        updateData.completedAt = new Date().toISOString();
        updateData.completedBy = user?.name || 'Nieznany';
      }
      await updateActionItem(id, updateData);
    } catch (err) {
      console.error(err);
      alert('Błąd aktualizacji statusu');
    }
  };

  const handleContractorChange = async (id, newContractor) => {
    try {
      const updateData = {
        assignedService: newContractor,
        contractor: newContractor,
        assignedTo: newContractor,
      };
      setItems(prev => {
        const base = prev.length > 0 ? prev : storeActionItems;
        return base.map(it => (it.id === id ? { ...it, ...updateData } : it));
      });
      await updateActionItem(id, updateData);
    } catch (err) {
      console.error(err);
      alert('Błąd przypisywania wykonawcy');
    }
  };

  const handleCreateActionItem = async e => {
    e.preventDefault();
    if (!newProblem.trim()) return;
    setSavingNewItem(true);
    try {
      const selectedMac = rawMachines.find(m => m.id === newMachineId);
      await addActionItem({
        machineId: newMachineId || '',
        machineName: selectedMac?.name || '',
        problem: newProblem.trim(),
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        assignedService: newContractor || '',
        contractor: newContractor || '',
        assignedTo: newContractor || '',
        status: ACTION_ITEM_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'Nieznany',
      });
      setIsAddModalOpen(false);
      setNewMachineId('');
      setNewProblem('');
      setNewDueDate('');
      setNewContractor('');
    } catch (err) {
      console.error(err);
      alert('Błąd zapisu tematu: ' + err.message);
    } finally {
      setSavingNewItem(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <i className="ph ph-clipboard-text text-2xl text-blue-600"></i>
            {t('admin.action_items.title')}
          </h2>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 leading-tight">
            {t('admin.action_items.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {!onlyAssignedTasks && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <i className="ph ph-plus text-base"></i>
              {t('admin.action_items.add_btn', 'Dodaj temat')}
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-green-200 transition-colors"
          >
            <i className="ph ph-file-xls text-lg"></i>
            {t('admin.action_items.export_excel')}
          </button>
          <div className="flex bg-slate-100 rounded-lg p-1 overflow-x-auto max-w-full hide-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 shadow-md text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('admin.action_items.filter_all')}
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 shadow-md text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('admin.action_items.filter_pending')}
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 shadow-md text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('admin.action_items.filter_completed')}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DODAWANIA NOWEGO TEMATU DO REALIZACJI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <i className="ph ph-clipboard-text text-blue-600 text-xl"></i>
                {t('admin.action_items.add_modal_title', 'Nowy Temat do Realizacji')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleCreateActionItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('admin.action_items.machine', 'Urządzenie')}
                </label>
                <select
                  value={newMachineId}
                  onChange={e => setNewMachineId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">
                    {t('admin.action_items.select_machine', '-- Wybierz urządzenie --')}
                  </option>
                  {rawMachines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.internalId ? `(${m.internalId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('admin.action_items.problem_task', 'Problem / Zadanie')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newProblem}
                    onChange={e => setNewProblem(e.target.value)}
                    placeholder={t(
                      'admin.action_items.problem_placeholder',
                      'np. Wymiana paska napędowego, przegląd instalacji...'
                    )}
                    className="w-full p-2.5 pr-12 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <DictationButton
                      onResult={text => setNewProblem(prev => (prev ? prev + ' ' + text : text))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('admin.action_items.contractor', 'Wykonawca')}
                </label>
                <select
                  value={newContractor}
                  onChange={e => setNewContractor(e.target.value)}
                  data-testid="new-action-item-contractor-select"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">
                    {t('admin.action_items.no_contractor', '-- Wybierz wykonawcę --')}
                  </option>
                  {contractorOptions.map(r => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('admin.action_items.required_date', 'Wymagany Termin')}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + days);
                        setNewDueDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      +{days} dni
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('admin.action_items.cancel', 'Anuluj')}
                </button>
                <button
                  type="submit"
                  disabled={savingNewItem}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('admin.action_items.save', 'Zapisz temat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTRY */}
      <PlannedMaintenanceFilters
        isArchive={false}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterTime={filterTime}
        setFilterTime={setFilterTime}
        filterRegion={filterRegion}
        setFilterRegion={setFilterRegion}
        filterMachine={filterMachine}
        setFilterMachine={setFilterMachine}
        clearFilters={() => {
          setSearchQuery('');
          setFilterTime('all');
          setFilterRegion('');
          setFilterMachine('');
          setFilterStatus('pending');
        }}
        machines={machines}
        regions={regions}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <div className="lg:hidden flex flex-col gap-1.5 p-2">
            {filteredItems.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title={t('admin.action_items.no_items_title')}
                  message={t('admin.action_items.no_items_desc')}
                  icon="ph-clipboard-text"
                />
              </div>
            ) : (
              filteredItems.map(item => {
                const dueDate = item.dueDate
                  ? typeof item.dueDate.toDate === 'function'
                    ? item.dueDate.toDate()
                    : new Date(item.dueDate)
                  : null;
                const createdDate = item.createdAt
                  ? typeof item.createdAt.toDate === 'function'
                    ? item.createdAt.toDate()
                    : new Date(item.createdAt)
                  : null;
                const isCompleted = item.status === ACTION_ITEM_STATUS.COMPLETED;
                const machineName = item.machineName || getMachineName(item.machineId);
                const currentContractor =
                  item.assignedService || item.contractor || item.assignedTo || '';

                return (
                  <div
                    key={item.id}
                    className={`bg-white p-3 rounded-xl shadow-sm border flex flex-col relative ${
                      isCompleted ? 'border-green-500 border-l-4' : 'border-blue-500 border-l-4'
                    }`}
                  >
                    {isCompleted && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white px-2.5 py-1 rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm">
                        {t('admin.action_items.completed')}
                      </div>
                    )}
                    {!isCompleted && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white px-2.5 py-1 rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm">
                        {t('admin.action_items.filter_pending')}
                      </div>
                    )}

                    <div className="pt-2">
                      <h4 className="font-bold text-[#002b5e] text-lg leading-tight mb-1">
                        {machineName || t('admin.action_items.no_machine')}
                      </h4>
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        {item.problem || t('admin.action_items.no_desc')}
                      </p>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <i className="ph ph-calendar-blank"></i>{' '}
                          {t('admin.action_items.reported_at')}
                          {createdDate ? createdDate.toLocaleDateString('pl-PL') : '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ph ph-warning-circle"></i>{' '}
                          {t('admin.action_items.due_date')}
                          {dueDate ? dueDate.toLocaleDateString('pl-PL') : '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ph ph-user"></i> {t('admin.action_items.reported_by')}
                          {item.createdBy || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <select
                        value={currentContractor}
                        disabled={onlyAssignedTasks}
                        onChange={e => handleContractorChange(item.id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1.5 rounded outline-none border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-70"
                      >
                        <option value="">
                          {t('admin.action_items.no_contractor', '-- Wybierz wykonawcę --')}
                        </option>
                        {contractorOptions.map(r => (
                          <option key={r.id || r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1.5 rounded outline-none border transition-colors cursor-pointer ${
                          item.status === ACTION_ITEM_STATUS.COMPLETED
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : item.status === ACTION_ITEM_STATUS.IN_PROGRESS
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.status === ACTION_ITEM_STATUS.CANCELLED
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value={ACTION_ITEM_STATUS.PENDING}>
                          {t('admin.action_items.status_pending')}
                        </option>
                        <option value={ACTION_ITEM_STATUS.IN_PROGRESS}>
                          {t('admin.action_items.status_in_progress')}
                        </option>
                        <option value={ACTION_ITEM_STATUS.COMPLETED}>
                          {t('admin.action_items.status_confirm_completed')}
                        </option>
                        <option value={ACTION_ITEM_STATUS.CANCELLED}>
                          {t('admin.action_items.status_cancelled')}
                        </option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <table className="hidden lg:table w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-4">{t('admin.action_items.created_date')}</th>
                <th className="px-6 py-4">{t('admin.action_items.machine')}</th>
                <th className="px-6 py-4">{t('admin.action_items.problem_task')}</th>
                <th className="px-6 py-4">{t('admin.action_items.contractor', 'Wykonawca')}</th>
                <th className="px-6 py-4">{t('admin.action_items.required_date')}</th>
                <th className="px-6 py-4">{t('admin.action_items.reporter')}</th>
                <th className="px-6 py-4">{t('admin.action_items.status')}</th>
                <th className="px-6 py-4 text-right">{t('admin.action_items.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-0">
                    <EmptyState
                      title={t('admin.action_items.no_items_title')}
                      message={t('admin.action_items.no_items_desc')}
                      icon="ph-clipboard-text"
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const currentContractor =
                    item.assignedService || item.contractor || item.assignedTo || '';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.machineName || getMachineName(item.machineId)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 max-w-md break-words">
                        {item.problem}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={currentContractor}
                          disabled={onlyAssignedTasks}
                          data-testid={`action-item-contractor-${item.id}`}
                          onChange={e => handleContractorChange(item.id, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg outline-none border border-slate-200 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer disabled:bg-slate-50 disabled:cursor-default"
                        >
                          <option value="">
                            {t('admin.action_items.no_contractor', '-- Wybierz wykonawcę --')}
                          </option>
                          {contractorOptions.map(r => (
                            <option key={r.id || r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString()
                          : t('admin.action_items.none')}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.createdBy}</td>
                      <td className="px-6 py-4">
                        {item.status === ACTION_ITEM_STATUS.COMPLETED ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider w-fit">
                              <i className="ph ph-check-circle"></i>{' '}
                              {t('admin.action_items.completed')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {t('admin.action_items.by')}
                              <span className="font-bold text-slate-700">
                                {item.completedBy || 'System'}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t('admin.action_items.on_day')}
                              {item.completedAt
                                ? new Date(item.completedAt).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                            <i className="ph ph-clock"></i> {t('admin.action_items.filter_pending')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1.5 rounded outline-none border transition-colors cursor-pointer ${
                            item.status === ACTION_ITEM_STATUS.COMPLETED
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : item.status === ACTION_ITEM_STATUS.IN_PROGRESS
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.status === ACTION_ITEM_STATUS.CANCELLED
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value={ACTION_ITEM_STATUS.PENDING}>
                            {t('admin.action_items.status_pending')}
                          </option>
                          <option value={ACTION_ITEM_STATUS.IN_PROGRESS}>
                            {t('admin.action_items.status_in_progress')}
                          </option>
                          <option value={ACTION_ITEM_STATUS.COMPLETED}>
                            {t('admin.action_items.status_confirm_completed')}
                          </option>
                          <option value={ACTION_ITEM_STATUS.CANCELLED}>
                            {t('admin.action_items.status_cancelled')}
                          </option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
