import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, arrayUnion, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { addPlannedService, updatePlannedService, deletePlannedService, markServiceCompleted } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';
import { safeParseDate } from '../../utils/dateHelpers';
import PlannedMaintenanceList from './PlannedMaintenanceList';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';
import ChecklistExecutor from '../checklists/ChecklistExecutor';

export default function PlannedMaintenance({ machines, regions = [], user, plannedWarningDays = 30, isArchive = false }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rbgUpdateModal, setRbgUpdateModal] = useState(null);
  const [newRbgValue, setNewRbgValue] = useState('');
  const [completionModal, setCompletionModal] = useState(null);
  const [checklistResponses, setChecklistResponses] = useState({});
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [priority, setPriority] = useState('NieKrytyczny');
  const [triggerType, setTriggerType] = useState('calendar'); // calendar, hours, mixed
  const [calendarIntervalDays, setCalendarIntervalDays] = useState(30);
  const [nextDate, setNextDate] = useState('');
  const [hoursInterval, setHoursInterval] = useState(500);
  const [targetWorkHours, setTargetWorkHours] = useState('');
  const [estimatedDowntimeHours, setEstimatedDowntimeHours] = useState(4);
  const [estimatedManHours, setEstimatedManHours] = useState(8);
  const [requiredPersonnel, setRequiredPersonnel] = useState('');
  const [machineStatus, setMachineStatus] = useState('LOTO');
  const [checklist, setChecklist] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Akcje do realizacji
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  
  // Uwagi na przyszłość (szczegóły serwisu)
  const [newFutureNote, setNewFutureNote] = useState('');


  // Filtry
  const [filterTime, setFilterTime] = useState('all'); // all, 30, 90
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  
  // Kolumny
  const [columns, setColumns] = useState({
    name: true,
    machine: true,
    region: true,
    nextDate: true,
    rbg: true,
    priority: true,
    status: true,
    actions: true
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'planned_services'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getMachineName = (id) => getMachine(id)?.name || 'Nieznana maszyna';
  const getMachineRegionName = (regionId) => {
    if (!regionId) return '-';
    const found = regions.find(r => r.id === regionId || r.name === regionId);
    return found ? found.name : regionId;
  };

  // Logika Filtrówania
  const filteredServices = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);

    const filtered = services.filter(srv => {
      // Archiwum
      if (isArchive) {
        if (srv.status !== 'completed') return false;
      } else {
        if (srv.status === 'completed') return false;
      }

      const machine = getMachine(srv.machineId);
      
      // Filtr Rejon
      if (filterRegion && machine?.regionId !== filterRegion) return false;
      
      // Filtr Maszyna
      if (filterMachine && srv.machineId !== filterMachine) return false;

      // Filtrów czasie)
      if (filterTime !== 'all' && !isArchive) {
        let isWithinTime = false;
        
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (filterTime === '30' && nDate <= future30) isWithinTime = true;
          if (filterTime === '90' && nDate <= future90) isWithinTime = true;
        }
        
        if (srv.targetWorkHours && machine) {
          const rbgThreshold = (filterTime === '30' ? 30 : 90) * 8;
          if ((srv.targetWorkHours) <= rbgThreshold) {
            isWithinTime = true;
          }
        }

        if (!isWithinTime) return false;
      }

      return true;
    });
    return filtered.sort((a, b) => {
      // 1. Status: W trakcie > Czerwony (Overdue) > Żółty (Warning) > Niebieski (Normal)
      const getStatusScore = (srv) => {
        if (srv.status === 'completed') return 0;
        if (srv.status === 'in_progress') return 5;
        
        const machine = getMachine(srv.machineId);
        let isOverdue = false;
        let isWarning = false;
        const now = new Date();

        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (nDate < now) isOverdue = true;
          else {
            const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= plannedWarningDays) isWarning = true;
          }
        }
        if (srv.targetWorkHours && machine) {
          if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
          else {
            if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true;
          }
        }

        if (isOverdue) return 4;
        if (isWarning) return 3;
        return 2;
      };

      const scoreA = getStatusScore(a);
      const scoreB = getStatusScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;

      // 2. Typ wyzwalacza (RBG > Kalendarz)
      const isRbgA = (a.triggerType === 'hours' || a.triggerType === 'mixed') ? 1 : 0;
      const isRbgB = (b.triggerType === 'hours' || b.triggerType === 'mixed') ? 1 : 0;
      if (isRbgA !== isRbgB) return isRbgB - isRbgA;

      // 3. Pilność (Remaining RBG lub data wymagalności)
      if (isRbgA === 1 && isRbgB === 1) {
         const machA = getMachine(a.machineId);
         const machB = getMachine(b.machineId);
         const remA = a.targetWorkHours ? a.targetWorkHours - (machA?.currentWorkHours || 0) : Infinity;
         const remB = b.targetWorkHours ? b.targetWorkHours - (machB?.currentWorkHours || 0) : Infinity;
         if (remA !== remB) return remA - remB;
      } else {
         const dateA = a.nextDate ? new Date(a.nextDate).getTime() : Infinity;
         const dateB = b.nextDate ? new Date(b.nextDate).getTime() : Infinity;
         if (dateA !== dateB) return dateA - dateB;
      }

      // 4. Priorytet
      const isCritA = a.priority === 'Krytyczny' ? 1 : 0;
      const isCritB = b.priority === 'Krytyczny' ? 1 : 0;
      return isCritB - isCritA;
    });
  }, [services, machines, filterTime, filterRegion, filterMachine, isArchive]);

  // Lista unikalnych rejonów z maszyn, które mają serwisy
  const regionsInUse = useMemo(() => {
    const rSet = new Set();
    services.forEach(s => {
      const m = getMachine(s.machineId);
      if (m && m.regionId) rSet.add(m.regionId);
    });
    return Array.from(rSet);
  }, [services, machines]);

  const toggleColumn = (key) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setFilterTime('all');
    setFilterRegion('');
    setFilterMachine('');
  };

  const getStatusColor = (srv, machine) => {
    if (srv.status === 'completed') return 'bg-emerald-100 text-emerald-700'; // Jak w awariach "Zakończone"
    if (srv.status === 'in_progress') return 'bg-purple-100 text-purple-700'; // W trakcie
    
    let isOverdue = false;
    let isWarning = false;
    const now = new Date();

    if (srv.nextDate) {
      const nDate = safeParseDate(srv.nextDate);
      if (nDate < now) isOverdue = true;
      else {
        const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= plannedWarningDays) isWarning = true;
      }
    }
    if (srv.targetWorkHours && machine) {
      if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
      else {
        if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true;
      }
    }

    if (isOverdue) return 'bg-red-100 text-red-700';
    if (isWarning) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-50 text-blue-700'; // Domyślny kolor dla zaplanowanych
  };

  const openModalForNew = () => {
    setEditingId(null);
    setName('');
    setMachineId('');
    setPriority('NieKrytyczny');
    setTriggerType('calendar');
    setCalendarIntervalDays(30);
    setNextDate('');
    setHoursInterval(500);
    setTargetWorkHours('');
    setEstimatedDowntimeHours(4);
    setEstimatedManHours(8);
    setRequiredPersonnel('');
    setMachineStatus('LOTO');
    setChecklist([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (srv) => {
    setEditingId(srv.id);
    setName(srv.name || '');
    setMachineId(srv.machineId || '');
    setPriority(srv.priority || 'NieKrytyczny');
    setTriggerType(srv.triggerType || 'calendar');
    setCalendarIntervalDays(srv.calendarIntervalDays || 30);
    setNextDate(srv.nextDate ? safeParseDate(srv.nextDate).toISOString().slice(0,10) : '');
    setHoursInterval(srv.hoursInterval || 500);
    setTargetWorkHours(srv.targetWorkHours || '');
    setEstimatedDowntimeHours(srv.estimatedDowntimeHours || 4);
    setEstimatedManHours(srv.estimatedManHours || 8);
    setRequiredPersonnel(srv.requiredPersonnel || '');
    setMachineStatus(srv.machineStatus || 'LOTO');
    setChecklist(srv.checklist || []);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return alert('Błąd: Podaj nazwę / typ serwisu.');
    if (!machineId) return alert('Błąd: Wybierz maszynę.');
    if ((triggerType === 'calendar' || triggerType === 'mixed') && !nextDate) return alert('Błąd: Podaj datę planowaną (Kalendarz).');
    if ((triggerType === 'hours' || triggerType === 'mixed') && !targetWorkHours) return alert('Błąd: Podaj próg roboczogodzin (Roboczogodziny).');

    const serviceData = {
      name, machineId, priority, triggerType,
      estimatedDowntimeHours: Number(estimatedDowntimeHours),
      estimatedManHours: Number(estimatedManHours),
      requiredPersonnel, machineStatus, notified: false, checklist
    };

    if (triggerType === 'calendar' || triggerType === 'mixed') {
      serviceData.calendarIntervalDays = Number(calendarIntervalDays);
      serviceData.nextDate = nextDate ? new Date(nextDate) : null;
    }
    if (triggerType === 'hours' || triggerType === 'mixed') {
      serviceData.hoursInterval = Number(hoursInterval);
      serviceData.targetWorkHours = Number(targetWorkHours);
    }

    const historyEntry = {
      date: new Date().toISOString(),
      user: user.name,
      action: editingId ? 'Zaktualizowano plan' : 'Utworzono plan',
      note: ''
    };

    if (editingId) {
      serviceData.history = arrayUnion(historyEntry);
    } else {
      serviceData.history = [historyEntry];
    }

    try {
      if (editingId) await updatePlannedService(editingId, serviceData);
      else await addPlannedService(serviceData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas zapisywania: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Czy na pewno usunąć ten plan serwisowy?')) {
      await deletePlannedService(id);
    }
  };

  const handleUpdateRbg = async (e) => {
    e.preventDefault();
    if (!rbgUpdateModal) return;
    try {
      await updateMachineWorkHours(rbgUpdateModal.id, Number(newRbgValue));
      setRbgUpdateModal(null);
      setNewRbgValue('');
    } catch (err) {
      console.error(err);
      alert('Błąd aktualizacji roboczogodzin');
    }
  };

  const handleSetInProgress = async (srv) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten serwis jako "W trakcie"?')) {
      const historyEntry = {
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Zmieniono status na: W trakcie',
        note: ''
      };
      
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      
      try {
        await updatePlannedService(srv.id, {
          status: 'in_progress',
          history: newHistory
        });
      } catch (err) {
        console.error(err);
        alert('Błąd aktualizacji statusu');
      }
    }
  };

  const handleCompleteService = async (e) => {
    e.preventDefault();
    if (!completionModal) return;

    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = {
          name: completionModal.name, machineId: completionModal.machineId || '',
          priority: completionModal.priority, triggerType: completionModal.triggerType,
          estimatedDowntimeHours: completionModal.estimatedDowntimeHours,
          estimatedManHours: completionModal.estimatedManHours,
          requiredPersonnel: completionModal.requiredPersonnel,
          machineStatus: completionModal.machineStatus, notified: false,
          checklist: completionModal.checklist || []
        };

        if (completionModal.triggerType === 'calendar' || completionModal.triggerType === 'mixed') {
          nextPlanData.calendarIntervalDays = completionModal.calendarIntervalDays;
          const nextD = new Date();
          nextD.setDate(nextD.getDate() + (completionModal.calendarIntervalDays || 30));
          nextPlanData.nextDate = nextD;
        }

        if (completionModal.triggerType === 'hours' || completionModal.triggerType === 'mixed') {
          nextPlanData.hoursInterval = completionModal.hoursInterval;
          const machine = getMachine(completionModal.machineId);
          const currentH = machine?.currentWorkHours || 0;
          nextPlanData.targetWorkHours = currentH + (completionModal.hoursInterval || 500);
        }
      }

      let checklistSummary = [];
      if (completionModal.checklist && completionModal.checklist.length > 0) {
         checklistSummary = completionModal.checklist.map(step => {
            const answer = checklistResponses[step.id];
            return {
               taskName: step.taskName,
               type: step.type,
               answer: answer === undefined ? null : answer
            };
         });
      }

      const historyEntry = {
        date: new Date().toISOString(),
        user: user.name,
        action: 'Zakończono serwis',
        note: completionNotes,
        checklistSummary: checklistSummary
      };

            await markServiceCompleted(completionModal.id, {
        completedBy: user.name, notes: completionNotes,
        checklistResponses: checklistResponses, historyEntry
      }, nextPlanData);

      if (createActionItem && actionItemProblem.trim()) {
        await addDoc(collection(db, 'action_items'), {
          machineId: completionModal.machineId || '',
          plannedServiceId: completionModal.id || '',
          problem: actionItemProblem.trim(),
          dueDate: actionItemDueDate ? new Date(actionItemDueDate).toISOString() : null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: user.name || 'Nieznany'
        });
      }

      setCompletionModal(null); setCompletionNotes(''); setChecklistResponses({}); setCreateNewPlan(true);
      setCreateActionItem(false); setActionItemProblem(''); setActionItemDueDate('');
    } catch (err) {
      console.error(err);
      alert('Błąd: ' + err.message);
    }
  };

  const handleAddFutureNote = async (serviceId) => {
    if (!newFutureNote.trim()) return;
    try {
      const noteObj = {
        text: newFutureNote.trim(),
        author: user?.name || 'Nieznany',
        createdAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'planned_services', serviceId), {
        futureNotes: arrayUnion(noteObj)
      });
      setNewFutureNote('');
    } catch (err) {
      console.error(err);
      alert('Błąd dodawania notatki: ' + err.message);
    }
  };

  if (selectedServiceId) {
    const srv = services.find(s => s.id === selectedServiceId);
    if (!srv) {
      setSelectedServiceId(null);
      return null;
    }
    const machine = getMachine(srv.machineId);
    const isCompleted = srv.status === 'completed';

    return (
      <div className="space-y-6 animate-fade-in">
        <button 
          onClick={() => setSelectedServiceId(null)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all mb-4 w-fit"
        >
          <i className="ph ph-arrow-left text-lg"></i>
          Wróć do listy serwisów
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEWA KOLUMNA (Karta Serwisu) */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{srv.name}</h2>
                    <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                      <i className="ph ph-engine text-lg text-slate-400"></i>
                      {machine?.name || 'Nieznana maszyna'} ({getMachineRegionName(machine?.regionId)})
                    </div>
                  </div>
                  <div>
                    {srv.priority === 'Krytyczny' ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-red-100 flex items-center gap-1 shadow-sm"><i className="ph ph-warning"></i> KRYTYCZNY</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm">Standard</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-clock text-base"></i> Wyzwalacz</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.triggerType === 'calendar' ? 'Kalendarz' : srv.triggerType === 'hours' ? 'RBG' : 'Mieszany'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-users text-base"></i> Personel</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.requiredPersonnel || '-'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-hourglass text-base"></i> Przestój (h)</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.estimatedDowntimeHours || 0} h</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-wrench text-base"></i> Status maszyny</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.machineStatus || '-'}</div>
                  </div>
                </div>

                                <div className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="ph ph-list-checks text-xl text-blue-600"></i> Zakres prac do wykonania
                  </h3>
                  {srv.checklist && srv.checklist.length > 0 ? (
                    <ul className="space-y-3">
                      {srv.checklist.map((step, idx) => (
                        <li key={step.id} className="flex items-start gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <span className="font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{step.taskName}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              Wymagane: {step.type === 'CHECKBOX' ? 'Potwierdzenie (odhaczenie)' : step.type === 'PHOTO' ? 'Zdjęcie dokumentujące' : 'Wpisanie wartości'}
                              <span className={step.isRequired ? "text-red-500 font-medium ml-1" : "text-slate-400 ml-1"}>
                                {step.isRequired ? '(Obowiązkowe)' : '(Opcjonalne)'}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm font-medium text-slate-600 italic bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                      Przegląd według obowiązującego standardu DTR maszyny.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                  {!isCompleted && srv.status !== 'in_progress' && (
                    <button onClick={() => handleSetInProgress(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-play-circle text-xl"></i>
                      Rozpocznij Serwis
                    </button>
                  )}
                  {!isCompleted && srv.status === 'in_progress' && (
                    <>
                      {(!srv.checklist || srv.checklist.length === 0) ? (
                        <button onClick={() => setCompletionModal(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                          <i className="ph ph-check-circle text-xl"></i>
                          Zakończ Serwis
                        </button>
                      ) : (
                        <div className="w-full mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Lista Kontrolna (Wymagana do zamknięcia)</h3>
                          <ChecklistExecutor 
                            steps={srv.checklist} 
                            onComplete={(responses) => {
                              setChecklistResponses(responses);
                              setCompletionModal(srv);
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {!isCompleted && srv.status !== 'in_progress' && (<button onClick={() => openModalForEdit(srv)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300">
                    <i className="ph ph-pencil-simple text-xl"></i>
                    Edytuj</button>)}
                  <button onClick={() => {
                    handleDelete(srv.id);
                    setSelectedServiceId(null);
                  }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200">
                    <i className="ph ph-trash text-xl"></i>
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA (Historia Zdarzeń) */} \n<div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ</h4>
              
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                {srv.history && [...srv.history].reverse().map((entry, index) => (
                  <div key={index} className="relative pl-8">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-slate-800"></div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-800 text-sm">{entry.user || 'System'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(entry.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{entry.action}</div>
                    {entry.note && (
                      <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        &quot;{entry.note}&quot;
                      </div>
                    )}
                    {entry.checklistSummary && entry.checklistSummary.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lista Kontrolna (Checklista):</div>
                        {entry.checklistSummary.map((item, i) => (
                           <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="font-semibold">{item.taskName}:</span>{' '}
                             {item.type === 'CHECKBOX' ? (
                               item.answer ? '✅ Wykonano' : '❌ Pominięto'
                             ) : item.type === 'PHOTO' ? (
                               item.answer && item.answer.length > 0 ? (
                                 <div className="mt-2 flex gap-2 flex-wrap">
                                   <img 
                                       src={item.answer} 
                                       alt="załącznik" 
                                       className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                       onClick={() => setLightboxImg(item.answer)}
                                     />
                                 </div>
                               ) : 'Brak zdjęć'
                             ) : (
                               <span className="font-mono text-blue-600">{item.answer || 'Brak danych'}</span>
                             )}
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!srv.history || srv.history.length === 0) && (
                  <div className="text-sm text-slate-400 italic pl-6">Brak historii zdarzeń.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reuse existing modals for editing/completing */}
        {/* Aktualizacja RBG Modal */}
        {rbgUpdateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleUpdateRbg} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aktualizuj licznik maszyny</h3>
              <p className="text-sm text-slate-600 mb-4">{rbgUpdateModal.name}</p>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">Nowy stan licznika (rbg)</label>
                <input type="number" value={newRbgValue} onChange={e => setNewRbgValue(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min={0} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRbgUpdateModal(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold">Anuluj</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Zapisz</button>
              </div>
            </form>
          </div>
        )}

        {/* Zakończenie Serwisu Modal */}
        {completionModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleCompleteService} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Zakończ Serwis</h3>
              <p className="text-sm text-slate-600 mb-4 font-bold">{completionModal.name}</p>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">Notatki z wykonania</label>
                <textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none" rows="3" placeholder="np. Wymieniono filtr, zalano 5L oleju..." />
              </div>
              <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" id="createNewPlan" checked={createNewPlan} onChange={e => setCreateNewPlan(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <label htmlFor="createNewPlan" className="text-sm font-bold text-gray-700 cursor-pointer">Wygeneruj automatycznie kolejny termin przeglądu</label>
            </div>
            
            <div className="mb-6 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="createActionItem" checked={createActionItem} onChange={e => setCreateActionItem(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <label htmlFor="createActionItem" className="text-sm font-bold text-gray-700 cursor-pointer">Dodaj do Tematy do Realizacji</label>
              </div>
              {createActionItem && (
                <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Problem / Akcja do wykonania</label>
                    <textarea value={actionItemProblem} onChange={e => setActionItemProblem(e.target.value)} required={createActionItem} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" placeholder="Wpisz problem..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Data wymaganej realizacji</label>
                    <input type="date" value={actionItemDueDate} onChange={e => setActionItemDueDate(e.target.value)} required={createActionItem} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCompletionModal(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold">Anuluj</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm">Zatwierdź Wykonanie</button>
              </div>
            </form>
          </div>
        )}

        
        {/* Sekcja: Spostrzeżenia i Uwagi na przyszłość */}
        <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
            <i className="ph ph-lightbulb text-xl text-amber-600"></i>
            Spostrzeżenia i uwagi na przyszłość
          </h3>
          
          <div className="space-y-4 mb-6">
            {(!srv.futureNotes || srv.futureNotes.length === 0) ? (
              <p className="text-sm text-amber-700 italic">Brak zapisanych uwag.</p>
            ) : (
              srv.futureNotes.map((note, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                  <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Dodał: {note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isCompleted && (
          <div className="flex flex-col gap-2">
            <textarea 
              value={newFutureNote} 
              onChange={e => setNewFutureNote(e.target.value)} 
              className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-y" 
              rows="3" 
              placeholder="Wpisz nowe spostrzeżenia lub uwagi..." 
            />
            <div className="flex justify-end">
              <button 
                onClick={() => handleAddFutureNote(srv.id)}
                disabled={!newFutureNote.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center"
              >
                <i className="ph ph-plus-circle mr-1"></i> Zapisz uwagę
              </button>
            </div>
          </div>
          )}
        </div>

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

      {/* Lightbox for details view */}
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

  return (
    <div className="space-y-6 flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className={`ph ${isArchive ? 'ph-archive text-slate-600' : 'ph-calendar-check text-blue-600'} text-2xl`}></i>
            {isArchive ? 'Archiwum Serwisów' : 'Serwis Planowany'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isArchive ? 'Historia zakończonych prac prewencyjnych' : 'Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {!isArchive && (
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <i className="ph ph-list-dashes mr-1"></i> Lista
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <i className="ph ph-calendar-blank mr-1"></i> Kalendarz
              </button>
            </div>
          )}
          
          {!isArchive && (
            <button 
              onClick={openModalForNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <i className="ph ph-plus-circle text-lg"></i>
              Dodaj Plan
            </button>
          )}
        </div>
      </div>


      <PlannedMaintenanceFilters 
        isArchive={isArchive}
        filterTime={filterTime} setFilterTime={setFilterTime}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterMachine={filterMachine} setFilterMachine={setFilterMachine}
        clearFilters={clearFilters}
        showColumnMenu={showColumnMenu} setShowColumnMenu={setShowColumnMenu}
        columns={columns} toggleColumn={toggleColumn}
        regions={regions} machines={machines}
        
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
    
      <PlannedMaintenanceList 
        viewMode={viewMode}
        filteredServices={filteredServices}
        columns={columns}
        getMachine={getMachine}
        getStatusColor={getStatusColor}
        getMachineRegionName={getMachineRegionName}
        machines={machines}
        setSelectedServiceId={setSelectedServiceId}
        setRbgUpdateModal={setRbgUpdateModal}
        setNewRbgValue={setNewRbgValue}
      />
      </div>
  
      {/* Modal - Dodaj / Edytuj */}
      {rbgUpdateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateRbg} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Aktualizuj licznik maszyny</h3>
            <p className="text-sm text-gray-600 mb-4">{rbgUpdateModal.name}</p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nowy stan licznika (rbg)</label>
              <input type="number" value={newRbgValue} onChange={e => setNewRbgValue(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min={0} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRbgUpdateModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold">Anuluj</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Zapisz</button>
            </div>
          </form>
        </div>
      )}

      {/* Zakończenie Serwisu Modal */}
      {completionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCompleteService} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Zakończ Serwis</h3>
            <p className="text-sm text-gray-600 mb-4 font-bold">{completionModal.name}</p>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Notatki z wykonania</label>
              <textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" rows="3" placeholder="np. Wymieniono filtr, zalano 5L oleju..." />
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input type="checkbox" id="createNewPlan" checked={createNewPlan} onChange={e => setCreateNewPlan(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <label htmlFor="createNewPlan" className="text-sm font-bold text-gray-700 cursor-pointer">Wygeneruj automatycznie kolejny termin przeglądu</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCompletionModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold">Anuluj</button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm">Zatwierdź Wykonanie</button>
            </div>
          </form>
        </div>
      )}

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