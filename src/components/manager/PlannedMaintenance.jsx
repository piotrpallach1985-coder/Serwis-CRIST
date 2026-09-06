import { useManagerContext } from '../../context/ManagerDataContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getDocs, startAfter, where, limit, collection, query, orderBy, arrayUnion, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { addPlannedService, updatePlannedService, deletePlannedService, markServiceCompleted } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';
import { safeParseDate } from '../../utils/dateHelpers';
import { exportToExcel } from '../../utils/reports/excelExport';

import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import PlannedMaintenanceList from './PlannedMaintenanceList';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';
import PlannedMaintenanceDetails from './PlannedMaintenanceDetails';
import PlannedMaintenanceRbgModal from './PlannedMaintenanceRbgModal';
import PlannedMaintenanceCompletionModal from './PlannedMaintenanceCompletionModal';

export default function PlannedMaintenance({
  user,
  isArchive = false,
  canEditPlanned = true,
  canDeletePlanned = true,
  initialServiceId,
  onClearServiceId,
  initialSearchQuery = '',
}) {
  const { plannedServices, machines, regions, plannedWarningDays, allowTicketDeletion } = useManagerContext();

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
      let q = query(collection(db, 'planned_services'), orderBy('createdAt', 'desc'), limit(100));
      if (loadMore && lastArchiveDocRef.current) {
        q = query(collection(db, 'planned_services'), orderBy('createdAt', 'desc'), startAfter(lastArchiveDocRef.current), limit(100));
      }
      const snapshot = await getDocs(q);
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

  const clearFilters = () => { setFilterTime('all'); setFilterRegion(''); setFilterMachine(''); setSearchQuery(''); };
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
        const matchesName = srv.name && srv.name.toLowerCase().includes(q);
        const matchesMach = machName && (machName.toLowerCase().includes(q) || q.includes(machName.toLowerCase()));
        const matchesReg = regName && (regName.toLowerCase().includes(q) || q.includes(regName.toLowerCase()));
        if (!matchesName && !matchesMach && !matchesReg) return false;
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
      return true;
    });
    return filtered.sort((a, b) => {
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
      const isCritA = a.priority === 'Krytyczny' ? 1 : 0, isCritB = b.priority === 'Krytyczny' ? 1 : 0;
      return isCritB - isCritA;
    });
  }, [services, machines, filterTime, filterRegion, filterMachine, isArchive]);

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
  const [completionModal, setCompletionModal] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  const [checklistResponses, setChecklistResponses] = useState({});
  const [lightboxImg, setLightboxImg] = useState(null);

  // --- Stan formularza ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [priority, setPriority] = useState('NieKrytyczny');
  const [triggerType, setTriggerType] = useState('calendar');
  const [calendarIntervalDays, setCalendarIntervalDays] = useState(30);
  const [nextDate, setNextDate] = useState('');
  const [hoursInterval, setHoursInterval] = useState(500);
  const [targetWorkHours, setTargetWorkHours] = useState('');
  const [estimatedDowntimeHours, setEstimatedDowntimeHours] = useState(4);
  const [estimatedManHours, setEstimatedManHours] = useState(8);
  const [requiredPersonnel, setRequiredPersonnel] = useState('');
  const [machineStatus, setMachineStatus] = useState('LOTO');
  const [checklist, setChecklist] = useState([]);

  // --- Handlery CRUD ---
  const openModalForNew = () => {
    setEditingId(null); setName(''); setMachineId(''); setPriority('NieKrytyczny'); setTriggerType('calendar');
    setCalendarIntervalDays(30); setNextDate(''); setHoursInterval(500); setTargetWorkHours('');
    setEstimatedDowntimeHours(4); setEstimatedManHours(8); setRequiredPersonnel(''); setMachineStatus('LOTO'); setChecklist([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (srv) => {
    setEditingId(srv.id); setName(srv.name || ''); setMachineId(srv.machineId || ''); setPriority(srv.priority || 'NieKrytyczny');
    setTriggerType(srv.triggerType || 'calendar'); setCalendarIntervalDays(srv.calendarIntervalDays || 30);
    setNextDate(srv.nextDate ? safeParseDate(srv.nextDate).toISOString().slice(0, 10) : '');
    setHoursInterval(srv.hoursInterval || 500); setTargetWorkHours(srv.targetWorkHours || '');
    setEstimatedDowntimeHours(srv.estimatedDowntimeHours || 4); setEstimatedManHours(srv.estimatedManHours || 8);
    setRequiredPersonnel(srv.requiredPersonnel || ''); setMachineStatus(srv.machineStatus || 'LOTO'); setChecklist(srv.checklist || []);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!name?.trim()) return alert('Błąd: Podaj nazwę / typ serwisu.');
    if (!machineId) return alert('Błąd: Wybierz maszynę.');
    if ((triggerType === 'calendar' || triggerType === 'mixed') && !nextDate) return alert('Błąd: Podaj datę planowaną.');
    if ((triggerType === 'hours' || triggerType === 'mixed') && !targetWorkHours) return alert('Błąd: Podaj próg RBG.');
    const serviceData = { name, machineId, priority, triggerType, estimatedDowntimeHours: Number(estimatedDowntimeHours), estimatedManHours: Number(estimatedManHours), requiredPersonnel, machineStatus, notified: false, checklist };
    if (triggerType === 'calendar' || triggerType === 'mixed') { serviceData.calendarIntervalDays = Number(calendarIntervalDays); serviceData.nextDate = nextDate ? new Date(nextDate) : null; }
    if (triggerType === 'hours' || triggerType === 'mixed') { serviceData.hoursInterval = Number(hoursInterval); serviceData.targetWorkHours = Number(targetWorkHours); }
    const historyEntry = { date: new Date().toISOString(), user: user.name, action: editingId ? 'Zaktualizowano plan' : 'Utworzono plan', note: '' };
    serviceData.history = editingId ? arrayUnion(historyEntry) : [historyEntry];
    try {
      if (editingId) await updatePlannedService(editingId, serviceData);
      else await addPlannedService(serviceData);
      setIsModalOpen(false);
    } catch (err) { console.error(err); alert('Błąd podczas zapisywania: ' + err.message); }
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

  const handleCompleteService = async (e) => {
    e.preventDefault();
    if (!completionModal) return;
    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = { name: completionModal.name, machineId: completionModal.machineId || '', priority: completionModal.priority, triggerType: completionModal.triggerType, estimatedDowntimeHours: completionModal.estimatedDowntimeHours, estimatedManHours: completionModal.estimatedManHours, requiredPersonnel: completionModal.requiredPersonnel, machineStatus: completionModal.machineStatus, notified: false, checklist: completionModal.checklist || [], futureNotes: completionModal.futureNotes || [] };
        if (completionModal.triggerType === 'calendar' || completionModal.triggerType === 'mixed') { nextPlanData.calendarIntervalDays = completionModal.calendarIntervalDays; const nextD = new Date(); nextD.setDate(nextD.getDate() + (completionModal.calendarIntervalDays || 30)); nextPlanData.nextDate = nextD; }
        if (completionModal.triggerType === 'hours' || completionModal.triggerType === 'mixed') { nextPlanData.hoursInterval = completionModal.hoursInterval; const machine = getMachine(completionModal.machineId); const currentH = machine?.currentWorkHours || 0; nextPlanData.targetWorkHours = currentH + (completionModal.hoursInterval || 500); }
      }
      let checklistSummary = [];
      if (completionModal.checklist?.length > 0) checklistSummary = completionModal.checklist.map(step => ({ taskName: step.taskName, type: step.type, answer: checklistResponses[step.id] === undefined ? null : checklistResponses[step.id] }));
      const historyEntry = { date: new Date().toISOString(), user: user.name, action: 'Zakończono serwis', note: completionNotes, checklistSummary };
      await markServiceCompleted(completionModal.id, { completedBy: user.name, notes: completionNotes, checklistResponses, historyEntry }, nextPlanData);
      if (createActionItem && actionItemProblem.trim()) {
        await addDoc(collection(db, 'action_items'), { machineId: completionModal.machineId || '', plannedServiceId: completionModal.id || '', problem: actionItemProblem.trim(), dueDate: actionItemDueDate ? new Date(actionItemDueDate).toISOString() : null, status: 'pending', createdAt: new Date().toISOString(), createdBy: user.name || 'Nieznany' });
      }
      setCompletionModal(null); setCompletionNotes(''); setChecklistResponses({}); setCreateNewPlan(true); setCreateActionItem(false); setActionItemProblem(''); setActionItemDueDate('');
    } catch (err) { console.error(err); alert('Błąd: ' + err.message); }
  };

  const handleAddFutureNote = async (serviceId, noteText, onDone) => {
    if (!noteText?.trim()) return;
    try {
      const noteObj = { text: noteText.trim(), author: user?.name || 'Nieznany', createdAt: new Date().toISOString() };
      await updateDoc(doc(db, 'planned_services', serviceId), { futureNotes: arrayUnion(noteObj) });
      if (onDone) onDone();
    } catch (err) { console.error(err); alert('Błąd dodawania notatki: ' + err.message); }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredServices.map(s => {
      const targetDate = safeParseDate(s.nextDate);
      return {
        'ID Serwisu': s.id, 'Nazwa Serwisu': s.name || '-', 'Maszynę': getMachine(s.machineId)?.name || ((s.machineName || '-') + ' (maszyna usunięta)'),
        'Priorytet': s.priority === 'Krytyczny' ? 'Krytyczny' : 'Standard',
        'Typ Wyzwalacza': s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Kalendarz' : 'Mieszany'),
        'Data Wykonania/Oczekiwana': targetDate ? targetDate.toLocaleDateString('pl-PL') : '-',
        'Cel RBG': s.targetWorkHours || '-',
        'Status': s.status === 'completed' ? 'Zakończony' : (s.status === 'in_progress' ? 'W trakcie' : 'Oczekujący'),
        'Historia': (s.history || []).map(h => `[${new Date(h.date).toLocaleDateString()}] ${h.user}: ${h.action}`).join(' | ')
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
      <PlannedMaintenanceDetails
        srv={srv} machine={machine} user={user}
        isArchive={isArchive} allowTicketDeletion={allowTicketDeletion}
        canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
        getMachineRegionName={getMachineRegionName} machines={machines}
        onBack={() => setSelectedServiceId(null)}
        onDelete={handleDelete} onSetInProgress={handleSetInProgress}
        onComplete={handleCompleteService} onUpdateRbg={handleUpdateRbg}
        onAddNote={handleAddNote} onAddFutureNote={handleAddFutureNote}
        onEdit={openModalForEdit}
        rbgUpdateModal={rbgUpdateModal} setRbgUpdateModal={setRbgUpdateModal}
        newRbgValue={newRbgValue} setNewRbgValue={setNewRbgValue}
        completionModal={completionModal} setCompletionModal={setCompletionModal}
        completionNotes={completionNotes} setCompletionNotes={setCompletionNotes}
        createNewPlan={createNewPlan} setCreateNewPlan={setCreateNewPlan}
        createActionItem={createActionItem} setCreateActionItem={setCreateActionItem}
        actionItemProblem={actionItemProblem} setActionItemProblem={setActionItemProblem}
        actionItemDueDate={actionItemDueDate} setActionItemDueDate={setActionItemDueDate}
        checklistResponses={checklistResponses} setChecklistResponses={setChecklistResponses}
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingId={editingId}
        name={name} setName={setName} machineId={machineId} setMachineId={setMachineId}
        priority={priority} setPriority={setPriority} triggerType={triggerType} setTriggerType={setTriggerType}
        calendarIntervalDays={calendarIntervalDays} setCalendarIntervalDays={setCalendarIntervalDays}
        nextDate={nextDate} setNextDate={setNextDate} hoursInterval={hoursInterval} setHoursInterval={setHoursInterval}
        targetWorkHours={targetWorkHours} setTargetWorkHours={setTargetWorkHours}
        estimatedDowntimeHours={estimatedDowntimeHours} setEstimatedDowntimeHours={setEstimatedDowntimeHours}
        estimatedManHours={estimatedManHours} setEstimatedManHours={setEstimatedManHours}
        requiredPersonnel={requiredPersonnel} setRequiredPersonnel={setRequiredPersonnel}
        machineStatus={machineStatus} setMachineStatus={setMachineStatus}
        checklist={checklist} setChecklist={setChecklist}
        handleSaveService={handleSaveService}
      />
    );
  }

  // --- Widok listy ---
  return (
    <div className="space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className={`ph ${isArchive ? 'ph-archive text-slate-600' : 'ph-calendar-check text-blue-600'} text-2xl`}></i>
            {isArchive ? 'Archiwum Serwisów' : 'Serwis Planowany'}
          </h2>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 leading-tight">
            {isArchive ? 'Historia zakończonych prac prewencyjnych' : 'Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button onClick={handleExportExcel} className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors shrink-0">
            <i className="ph ph-file-xls text-lg"></i> Eksportuj (.xlsx)
          </button>
          {!isArchive && (
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                <i className="ph ph-list-dashes mr-1"></i> Lista
              </button>
              <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                <i className="ph ph-calendar-blank mr-1"></i> Kalendarz
              </button>
            </div>
          )}
          {!isArchive && (
            <button onClick={openModalForNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0">
              <i className="ph ph-plus-circle text-lg"></i> Dodaj Plan
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
        <PlannedMaintenanceList
          viewMode={viewMode} filteredServices={filteredServices} columns={columns}
          getMachine={getMachine} getStatusColor={getStatusColor} getMachineRegionName={getMachineRegionName}
          machines={machines} setSelectedServiceId={setSelectedServiceId}
          setRbgUpdateModal={setRbgUpdateModal} setNewRbgValue={setNewRbgValue}
        />
        {isArchive && hasMoreArchive && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
            <button onClick={() => fetchArchive(true)} disabled={loadingArchive} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
              {loadingArchive ? 'Wczytywanie...' : 'Wczytaj starsze serwisy'}
            </button>
          </div>
        )}
      </div>

      {/* Modals dla widoku listy */}
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal} newRbgValue={newRbgValue} setNewRbgValue={setNewRbgValue}
        onSubmit={handleUpdateRbg} onClose={() => setRbgUpdateModal(null)}
      />
      <PlannedMaintenanceCompletionModal
        completionModal={completionModal}
        completionNotes={completionNotes} setCompletionNotes={setCompletionNotes}
        createNewPlan={createNewPlan} setCreateNewPlan={setCreateNewPlan}
        createActionItem={createActionItem} setCreateActionItem={setCreateActionItem}
        actionItemProblem={actionItemProblem} setActionItemProblem={setActionItemProblem}
        actionItemDueDate={actionItemDueDate} setActionItemDueDate={setActionItemDueDate}
        onSubmit={handleCompleteService} onClose={() => setCompletionModal(null)}
      />
      <PlannedMaintenanceFormModal
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingId={editingId}
        name={name} setName={setName} machineId={machineId} setMachineId={setMachineId}
        priority={priority} setPriority={setPriority} triggerType={triggerType} setTriggerType={setTriggerType}
        calendarIntervalDays={calendarIntervalDays} setCalendarIntervalDays={setCalendarIntervalDays}
        nextDate={nextDate} setNextDate={setNextDate} hoursInterval={hoursInterval} setHoursInterval={setHoursInterval}
        targetWorkHours={targetWorkHours} setTargetWorkHours={setTargetWorkHours}
        estimatedDowntimeHours={estimatedDowntimeHours} setEstimatedDowntimeHours={setEstimatedDowntimeHours}
        estimatedManHours={estimatedManHours} setEstimatedManHours={setEstimatedManHours}
        requiredPersonnel={requiredPersonnel} setRequiredPersonnel={setRequiredPersonnel}
        machineStatus={machineStatus} setMachineStatus={setMachineStatus}
        checklist={checklist} setChecklist={setChecklist}
        machines={machines} handleSaveService={handleSaveService}
      />
    </div>
  );
}

