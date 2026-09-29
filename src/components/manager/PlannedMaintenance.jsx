import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useManagerStore } from '../../store/managerStore';

import { useState, useEffect, useMemo, useRef } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { fetchArchiveServices, addPlannedService, updatePlannedService, deletePlannedService, markServiceCompleted } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';
import { safeParseDate } from '../../utils/dateHelpers';
import { exportToExcel } from '../../utils/reports/excelExport';

import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import PlannedMaintenanceList from './PlannedMaintenanceList';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';
import PlannedMaintenanceDetails from './PlannedMaintenanceDetails';
import PlannedMaintenanceRbgModal from './PlannedMaintenanceRbgModal';
import PlannedMaintenanceCompletionModal from './PlannedMaintenanceCompletionModal';
import TicketPartUsageModal from './tickets/TicketPartUsageModal';
import { getCurrentTenant } from '../../utils/tenantHelper';


/**
 * Komponent zarządzający widokiem Serwisów Planowanych (Planned Maintenance).
 * Odpowiada za wyświetlanie listy serwisów, filtrowanie, paginację 
 * oraz obsługę operacji CRUD i statusów (np. zmiana na 'in_progress', usuwanie).
 * 
 * @component
 * @param {Object} props - Właściwości komponentu
 * @param {Object} props.user - Aktualnie zalogowany użytkownik
 * @param {boolean} [props.isArchive=false] - Czy komponent działa w trybie Archiwum
 * @param {boolean} [props.canEditPlanned=true] - Czy użytkownik ma uprawnienia do edycji
 * @param {boolean} [props.canDeletePlanned=true] - Czy użytkownik ma uprawnienia do usuwania
 * @param {string} [props.initialServiceId] - Opcjonalny ID serwisu do otwarcia przy montowaniu (np. z linku lub powiadomienia)
 * @param {Function} [props.onClearServiceId] - Funkcja czyszcząca ID z parametrów URL po otwarciu
 * @param {string} [props.initialSearchQuery] - Początkowe słowo kluczowe wyszukiwania (np. nazwa maszyny po kliknięciu z mapy)
 * @param {Function} [props.onClearSearchQuery] - Callback do wyczyszczenia globalnego zapytania po zainicjowaniu
 * @returns {JSX.Element} Widok listy serwisów lub szczegółów konkretnego serwisu
 */
export default function PlannedMaintenance({
  isArchive = false,
  canEditPlanned = true,
  canDeletePlanned = true,
  initialServiceId,
  onClearServiceId,
  initialSearchQuery = '',
  onClearSearchQuery }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const plannedServices = useManagerStore(state => state.plannedServices);
  const machines = useManagerStore(state => state.machines);
  const regions = useManagerStore(state => state.regions);
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays);
  const allowTicketDeletion = useManagerStore(state => state.allowTicketDeletion);

  // --- Dane ---
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [internalArchive, setInternalArchive] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);
  const lastArchiveDocRef = useRef(null);

  // --- Filtrowanie ---
  const [filterTime, setFilterTime] = useState('all');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [viewMode, setViewMode] = useState('list');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState({ name: true, machine: true, region: true, trigger: true, nextDate: true, rbg: true, priority: true, status: true, actions: true });

  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== '') {
      setSearchQuery(initialSearchQuery);
      const q = initialSearchQuery.toLowerCase().trim();
      const foundReg = regions.find(r => r.id === initialSearchQuery || (r.name && r.name.toLowerCase().includes(q)));
      if (foundReg) setFilterRegion(foundReg.id || foundReg.name);
      const foundMach = machines.find(m => m.id === initialSearchQuery || (m.name && m.name.toLowerCase().includes(q)));
      if (foundMach) setFilterMachine(foundMach.id);
    }
  }, [initialSearchQuery, regions, machines]);

  useEffect(() => {
    if (isArchive) {
      setInternalArchive([]);
      setHasMoreArchive(true);
      fetchArchive(false);
    } else {
      setServicesLoaded(true);
    }
  }, [isArchive]);

  const fetchArchive = async (loadMore = false) => {
    if (loadingArchive || (!hasMoreArchive && loadMore)) return;
    setLoadingArchive(true);
    try {
      const snapshot = await fetchArchiveServices(loadMore ? lastArchiveDocRef.current : null, 100);
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.isDeleted && item.status === 'completed');
      if (snapshot.docs.length > 0) lastArchiveDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.docs.length < 50) setHasMoreArchive(false);
      setInternalArchive(prev => loadMore ? [...prev, ...fetched] : fetched);
      setServicesLoaded(true);
    } catch (err) {
      console.error('Blad pobierania archiwum serwisow:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const services = isArchive ? internalArchive : plannedServices;

  // --- Helpery ---
  const getMachine = (id) => machines.find(m => m.id === id);
  const getMachineName = (id) => getMachine(id)?.name || 'Nieznana maszyna';
  const getMachineRegionName = (regionId) => {
    if (!regionId) return '-';
    const found = regions.find(r => r.id === regionId || r.name === regionId);
    return found ? found.name : regionId;
  };

  const clearFilters = () => { 
    setFilterTime('all'); 
    setFilterRegion(''); 
    setFilterMachine(''); 
    setSearchQuery(''); 
    if (onClearSearchQuery) onClearSearchQuery();
  };
  const toggleColumn = (key) => setColumns(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredServices = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);
    const filtered = services.filter(srv => {
      if (isArchive) { if (srv.status !== 'completed') return false; }
      else { if (srv.status === 'completed') return false; }
      const machine = getMachine(srv.machineId);
      const regName = getMachineRegionName(machine?.regionId);
      const machName = getMachineName(srv.machineId);

      if (filterRegion && machine?.regionId !== filterRegion && regName !== filterRegion) return false;
      if (filterMachine && srv.machineId !== filterMachine) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        if (q === 'bez rejonu') {
          if (machine?.regionId || (regName && regName !== '-' && regName !== 'Bez rejonu')) return false;
        } else if (q === 'bez pineski') {
          if (machine && machine.xPercent != null && machine.yPercent != null) return false;
        } else {
          const matchesName = srv.name && srv.name.toLowerCase().includes(q);
          const matchesMach = machName && (machName.toLowerCase().includes(q) || q.includes(machName.toLowerCase()));
          const matchesReg = regName && (regName.toLowerCase().includes(q) || q.includes(regName.toLowerCase()));
          if (!matchesName && !matchesMach && !matchesReg) return false;
        }
      }

            if (filterTime !== 'all' && !isArchive) {
        let isWithinTime = false;
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (filterTime === '30' && nDate <= future30) isWithinTime = true;
          if (filterTime === '90' && nDate <= future90) isWithinTime = true;
        }
        if (srv.targetWorkHours && machine) {
          const rbgThreshold = (filterTime === '30' ? 30 : 90) * 8;
          if (srv.targetWorkHours <= rbgThreshold) isWithinTime = true;
        }
        if (!isWithinTime) return false;
      }
      if (filterTime !== 'all' && isArchive) {
        // filterTime is in YYYY-MM format
        if (!srv.completedAt) return false;
        const compDate = safeParseDate(srv.completedAt);
        if (!compDate) return false;
        const yyyy = compDate.getFullYear().toString();
        const mm = (compDate.getMonth() + 1).toString().padStart(2, '0');
        if (`${yyyy}-${mm}` !== filterTime) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      if (isArchive) {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      }
      const getStatusScore = (srv) => {
        if (srv.status === 'completed') return 0;
        if (srv.status === 'in_progress') return 5;
        const machine = getMachine(srv.machineId);
        let isOverdue = false, isWarning = false;
        const now = new Date();
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (nDate < now) isOverdue = true;
          else { const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24)); if (diffDays <= plannedWarningDays) isWarning = true; }
        }
        if (srv.targetWorkHours && machine) {
          if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
          else { if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true; }
        }
        if (isOverdue) return 4; if (isWarning) return 3; return 2;
      };
      const scoreA = getStatusScore(a), scoreB = getStatusScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      const isRbgA = (a.triggerType === 'hours' || a.triggerType === 'mixed') ? 1 : 0;
      const isRbgB = (b.triggerType === 'hours' || b.triggerType === 'mixed') ? 1 : 0;
      if (isRbgA !== isRbgB) return isRbgB - isRbgA;
      if (isRbgA === 1 && isRbgB === 1) {
        const machA = getMachine(a.machineId), machB = getMachine(b.machineId);
        const remA = a.targetWorkHours ? a.targetWorkHours - (machA?.currentWorkHours || 0) : Infinity;
        const remB = b.targetWorkHours ? b.targetWorkHours - (machB?.currentWorkHours || 0) : Infinity;
        if (remA !== remB) return remA - remB;
      } else {
        const dateA = a.nextDate ? new Date(a.nextDate).getTime() : Infinity;
        const dateB = b.nextDate ? new Date(b.nextDate).getTime() : Infinity;
        if (dateA !== dateB) return dateA - dateB;
      }
      const isCritA = a.priority === t('planned.critical') ? 1 : 0, isCritB = b.priority === t('planned.critical') ? 1 : 0;
      return isCritB - isCritA;
    });
  }, [services, machines, regions, filterTime, filterRegion, filterMachine, searchQuery, isArchive, plannedWarningDays]);

  const getStatusColor = (srv, machine) => {
    if (srv.status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (srv.status === 'in_progress') return 'bg-purple-100 text-purple-700';
    let isOverdue = false, isWarning = false;
    const now = new Date();
    if (srv.nextDate) { const nDate = safeParseDate(srv.nextDate); if (nDate < now) isOverdue = true; else { const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24)); if (diffDays <= plannedWarningDays) isWarning = true; } }
    if (srv.targetWorkHours && machine) { if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true; else { if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true; } }
    if (isOverdue) return 'bg-red-100 text-red-700';
    if (isWarning) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-50 text-blue-700';
  };

  // --- Nawigacja ---
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || null);

  useEffect(() => {
    if (selectedServiceId) window.history.pushState({ ...window.history.state, internalDetails: true }, '');
  }, [selectedServiceId]);

  useEffect(() => {
    const handlePopState = () => { if (selectedServiceId) setSelectedServiceId(null); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedServiceId]);

  useEffect(() => {
    if (initialServiceId && servicesLoaded && !selectedServiceId) {
      setSelectedServiceId(initialServiceId);
      if (onClearServiceId) onClearServiceId();
    }
  }, [initialServiceId, servicesLoaded, selectedServiceId]);

  // --- Stan modali ---
  const [rbgUpdateModal, setRbgUpdateModal] = useState(null);
  const [newRbgValue, setNewRbgValue] = useState('');
  const [serviceToComplete, setServiceToComplete] = useState(null);
  const [partUsageModalSrv, setPartUsageModalSrv] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // --- Stan formularza ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // --- Handlery CRUD ---
  const openModalForNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (srv) => {
    setEditingService(srv);
    setIsModalOpen(true);
  };


  const handleDelete = async (id) => {
    if (confirm('Czy na pewno usunąć ten plan serwisowy?')) await deletePlannedService(id);
  };

  const handleUpdateRbg = async (e) => {
    e.preventDefault();
    if (!rbgUpdateModal) return;
    try { await updateMachineWorkHours(rbgUpdateModal.id, Number(newRbgValue)); setRbgUpdateModal(null); setNewRbgValue(''); }
    catch (err) { console.error(err); alert('Błąd aktualizacji roboczogodzin'); }
  };

  const handleAddNote = async (srv, noteText) => {
    const historyEntry = { date: new Date().toISOString(), user: user?.name || 'System', action: 'Dodano notatkę', note: noteText };
    const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
    try { await updatePlannedService(srv.id, { history: newHistory }); }
    catch (err) { console.error(err); alert('Błąd dodawania notatki'); }
  };

  const handleSetInProgress = async (srv) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten serwis jako "W trakcie"?')) {
      const historyEntry = { date: new Date().toISOString(), user: user?.name || 'System', action: 'Zmieniono status na: W trakcie', note: '' };
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      try { await updatePlannedService(srv.id, { status: 'in_progress', history: newHistory }); }
      catch (err) { console.error(err); alert('Błąd aktualizacji statusu'); }
    }
  };


  const handleAddFutureNote = async (serviceId, noteText, photos = [], onDone) => {
    if (!noteText?.trim() && (!photos || photos.length === 0)) return;
    try {
      const historyEntry = { 
         date: new Date().toISOString(), 
         user: user?.name || 'Nieznany', 
         action: 'Dodano notatkę', 
         note: noteText ? noteText.trim() : '', 
         photos: photos || [] 
      };
      
      await updatePlannedService(serviceId, { 
         history: arrayUnion(historyEntry) 
      });
      if (onDone) onDone();
    } catch (err) { console.error(err); alert(t('planned.note_add_error') + ' ' + err.message); }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredServices.map(s => {
      const targetDate = safeParseDate(s.nextDate);
      return {
        [t('planned.excel_id')]: s.id, [t('planned.excel_name')]: s.name || '-', 'Maszynę': getMachine(s.machineId)?.name || ((s.machineName || '-') + ' (maszyna usunięta)'),
        [t('planned.excel_priority')]: s.priority === t('planned.critical') ? t('planned.critical') : t('planned.standard'),
        [t('planned.excel_trigger')]: s.triggerType === 'hours' ? t('planned.trigger_rbg') : (s.triggerType === 'calendar' ? t('planned.trigger_calendar') : t('planned.trigger_mixed')),
        [t('planned.excel_date')]: targetDate ? targetDate.toLocaleDateString('pl-PL') : '-',
        [t('planned.excel_rbg')]: s.targetWorkHours || '-',
        [t('planned.excel_status')]: s.status === 'completed' ? t('planned.status_completed') : (s.status === 'in_progress' ? t('planned.status_in_progress') : t('planned.status_pending')),
        [t('planned.excel_history')]: (s.history || []).map(h => `[${new Date(h.date).toLocaleDateString()}] ${h.user}: ${h.action}`).join(' | ')
      };
    });
    exportToExcel(dataToExport, isArchive ? 'Archiwum_Serwisow' : 'Planowane_Serwisy');
  };

  // --- Widok szczegółowy ---
  if (selectedServiceId) {
    const srv = services.find(s => s.id === selectedServiceId);
    if (!srv) { setSelectedServiceId(null); return null; }
    const machine = getMachine(srv.machineId);
    return (
      <>
        <PlannedMaintenanceDetails
        srv={srv} machine={machine} isArchive={isArchive} allowTicketDeletion={allowTicketDeletion}
        canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
        getMachineRegionName={getMachineRegionName} machines={machines} regions={regions}
        onBack={() => window.history.back()}
        onDelete={handleDelete} onSetInProgress={handleSetInProgress}
        onUpdateRbg={handleUpdateRbg}
        onAddNote={handleAddNote} onAddFutureNote={handleAddFutureNote}
        onEdit={openModalForEdit}
        onAddPart={(srv) => setPartUsageModalSrv(srv)}
        rbgUpdateModal={rbgUpdateModal} setRbgUpdateModal={setRbgUpdateModal}
        newRbgValue={newRbgValue} setNewRbgValue={setNewRbgValue}
        serviceToComplete={serviceToComplete} setServiceToComplete={setServiceToComplete}
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingService={editingService}
      />
        <TicketPartUsageModal
          isOpen={!!partUsageModalSrv}
          onClose={() => setPartUsageModalSrv(null)}
          ticketId={partUsageModalSrv?.id}
          onPartUsed={(msg) => handleAddFutureNote(partUsageModalSrv?.id, msg, [], () => {})}
        />
      </>
    );
  }

  // --- Widok listy ---
      return (
      <div className="space-y-6 flex flex-col">
        {/* ZUNIFIKOWANY NAGŁÓWEK LISTY */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 mb-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <i className={`ph ${isArchive ? 'ph-archive text-slate-600' : 'ph-calendar-check text-blue-600'}`}></i>
                {isArchive ? t('planned.archive_title') : t('planned.main_title')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isArchive ? t('planned.archive_subtitle') : t('planned.main_subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button onClick={handleExportExcel} className="w-full sm:w-auto bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-lg font-bold border border-green-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                <i className="ph ph-file-xls text-lg"></i> {t('planned.export_excel')}
              </button>
              {!isArchive && (
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                <i className="ph ph-list-dashes mr-1"></i> {t('planned.view_list')}
              </button>
              <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                <i className="ph ph-calendar-blank mr-1"></i> {t('planned.view_calendar')}
              </button>
            </div>
          )}
          {!isArchive && (
            <button onClick={openModalForNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0">
              <i className="ph ph-plus-circle text-lg"></i> {t('planned.add_plan')}
            </button>
          )}
        </div>
      </div>

      <PlannedMaintenanceFilters
        isArchive={isArchive}
        filterTime={filterTime} setFilterTime={setFilterTime}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterMachine={filterMachine} setFilterMachine={setFilterMachine}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        clearFilters={clearFilters}
        showColumnMenu={showColumnMenu} setShowColumnMenu={setShowColumnMenu}
        columns={columns} toggleColumn={toggleColumn}
        regions={regions} machines={machines}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
        <PlannedMaintenanceList isArchive={isArchive}
          viewMode={viewMode} filteredServices={filteredServices} columns={columns}
          getMachine={getMachine} getStatusColor={getStatusColor} getMachineRegionName={getMachineRegionName}
          machines={machines} setSelectedServiceId={setSelectedServiceId}
          setRbgUpdateModal={setRbgUpdateModal} setNewRbgValue={setNewRbgValue}
        />
        {isArchive && hasMoreArchive && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
            <button onClick={() => fetchArchive(true)} disabled={loadingArchive} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
              {loadingArchive ? t('planned.loading') : t('planned.load_older')}
            </button>
          </div>
        )}
      </div>

      {/* Modals dla widoku listy */}
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal} newRbgValue={newRbgValue} setNewRbgValue={setNewRbgValue}
        onSubmit={handleUpdateRbg} onClose={() => setRbgUpdateModal(null)}
      />
      <TicketPartUsageModal
        isOpen={!!partUsageModalSrv}
        onClose={() => setPartUsageModalSrv(null)}
        ticketId={partUsageModalSrv?.id}
        onPartUsed={(msg) => handleAddFutureNote(partUsageModalSrv?.id, msg, [], () => {})}
      />
      <PlannedMaintenanceCompletionModal
        isOpen={!!serviceToComplete}
        onClose={() => setServiceToComplete(null)}
        serviceToComplete={serviceToComplete}
        />
      <PlannedMaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingService={editingService}
        machines={machines}
        />
    </div>
  );
}

PlannedMaintenance.propTypes = {
  isArchive: PropTypes.bool,
  canEditPlanned: PropTypes.bool,
  canDeletePlanned: PropTypes.bool,
  initialServiceId: PropTypes.string,
  onClearServiceId: PropTypes.func,
  initialSearchQuery: PropTypes.string,
  onClearSearchQuery: PropTypes.func
};
