import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { addPlannedService, updatePlannedService, deletePlannedService, markServiceCompleted } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';

export default function PlannedMaintenance({ machines, regions = [], user, plannedWarningDays = 30, isArchive = false }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rbgUpdateModal, setRbgUpdateModal] = useState(null);
  const [newRbgValue, setNewRbgValue] = useState('');
  const [completionModal, setCompletionModal] = useState(null);
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
  const getMachineRegionName = (regionId) => regions.find(r => r.id === regionId)?.name || regionId || '-';

  // Logika Filtrowania
  const filteredServices = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);

    return services.filter(srv => {
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

      // Filtr Czasu (tylko pending bierze udzial w czasie)
      if (filterTime !== 'all' && !isArchive) {
        let isWithinTime = false;
        
        if (srv.nextDate) {
          const nDate = srv.nextDate.toDate ? srv.nextDate.toDate() : new Date(srv.nextDate);
          if (filterTime === '30' && nDate <= future30) isWithinTime = true;
          if (filterTime === '90' && nDate <= future90) isWithinTime = true;
        }
        
        if (srv.targetWorkHours && machine) {
          const rbgThreshold = (filterTime === '30' ? 30 : 90) * 8;
          if ((srv.targetWorkHours - machine.currentWorkHours) <= rbgThreshold) {
            isWithinTime = true;
          }
        }

        if (!isWithinTime) return false;
      }

      return true;
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
    
    let isOverdue = false;
    let isWarning = false;
    const now = new Date();

    if (srv.nextDate) {
      const nDate = srv.nextDate.toDate ? srv.nextDate.toDate() : new Date(srv.nextDate);
      if (nDate < now) isOverdue = true;
      else {
        const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= plannedWarningDays) isWarning = true;
      }
    }
    if (srv.targetWorkHours && machine) {
      if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
      else {
        if ((srv.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
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
    setIsModalOpen(true);
  };

  const openModalForEdit = (srv) => {
    setEditingId(srv.id);
    setName(srv.name || '');
    setMachineId(srv.machineId || '');
    setPriority(srv.priority || 'NieKrytyczny');
    setTriggerType(srv.triggerType || 'calendar');
    setCalendarIntervalDays(srv.calendarIntervalDays || 30);
    setNextDate(srv.nextDate ? new Date(srv.nextDate.toDate ? srv.nextDate.toDate() : srv.nextDate).toISOString().slice(0,10) : '');
    setHoursInterval(srv.hoursInterval || 500);
    setTargetWorkHours(srv.targetWorkHours || '');
    setEstimatedDowntimeHours(srv.estimatedDowntimeHours || 4);
    setEstimatedManHours(srv.estimatedManHours || 8);
    setRequiredPersonnel(srv.requiredPersonnel || '');
    setMachineStatus(srv.machineStatus || 'LOTO');
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const serviceData = {
      name, machineId, priority, triggerType,
      estimatedDowntimeHours: Number(estimatedDowntimeHours),
      estimatedManHours: Number(estimatedManHours),
      requiredPersonnel, machineStatus, notified: false
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
      alert('Błąd podczas zapisywania');
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

  const handleCompleteService = async (e) => {
    e.preventDefault();
    if (!completionModal) return;

    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = {
          name: completionModal.name, machineId: completionModal.machineId,
          priority: completionModal.priority, triggerType: completionModal.triggerType,
          estimatedDowntimeHours: completionModal.estimatedDowntimeHours,
          estimatedManHours: completionModal.estimatedManHours,
          requiredPersonnel: completionModal.requiredPersonnel,
          machineStatus: completionModal.machineStatus, notified: false
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

      const historyEntry = {
        date: new Date().toISOString(),
        user: user.name,
        action: 'Zakończono serwis',
        note: completionNotes
      };

      await markServiceCompleted(completionModal.id, {
        completedBy: user.name, notes: completionNotes, historyEntry
      }, nextPlanData);

      setCompletionModal(null); setCompletionNotes(''); setCreateNewPlan(true);
    } catch (err) {
      console.error(err);
      alert('Błąd oznaczania serwisu jako zakończony');
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
          className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2 mb-4 transition-colors"
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

                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                  {!isCompleted && (
                    <button onClick={() => setCompletionModal(srv)} className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-check-circle text-xl"></i>
                      Zakończ Serwis
                    </button>
                  )}
                  <button onClick={() => openModalForEdit(srv)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300">
                    <i className="ph ph-pencil-simple text-xl"></i>
                    Edytuj
                  </button>
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

          {/* PRAWA KOLUMNA (Historia Zdarzeń) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
              </h4>
              
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
                        "{entry.note}"
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
              <div className="mb-6 flex items-center gap-2">
                <input type="checkbox" id="createNewPlan" checked={createNewPlan} onChange={e => setCreateNewPlan(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-slate-300" />
                <label htmlFor="createNewPlan" className="text-sm font-bold text-slate-700 cursor-pointer">Wygeneruj automatycznie kolejny termin przeglądu</label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCompletionModal(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold">Anuluj</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm">Zatwierdź Wykonanie</button>
              </div>
            </form>
          </div>
        )}

        {/* Dodaj / Edytuj Plan Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <form onSubmit={handleSaveService} className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edytuj Plan Serwisowy' : 'Nowy Plan Serwisowy'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nazwa / Typ serwisu</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Wymiana oleju - Serwis 500h" className="w-full p-2 border border-slate-300 rounded outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Maszyna</label>
                  <select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none bg-white" required>
                    <option value="">-- Wybierz --</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategoria / Priorytet</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none bg-white">
                    <option value="NieKrytyczny">NieKrytyczny (w tle)</option>
                    <option value="Krytyczny">Krytyczny (zatrzymuje linię)</option>
                  </select>
                </div>
              </div>
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-800 mb-3">Typ wyzwalacza (Trigger)</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="calendar" checked={triggerType === 'calendar'} onChange={() => setTriggerType('calendar')} /> Kalendarzowy</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="hours" checked={triggerType === 'hours'} onChange={() => setTriggerType('hours')} /> Roboczogodziny</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="mixed" checked={triggerType === 'mixed'} onChange={() => setTriggerType('mixed')} /> Mieszany</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(triggerType === 'calendar' || triggerType === 'mixed') && (
                    <div className="space-y-3 border-t md:border-t-0 md:border-r border-slate-200 pt-3 md:pt-0 pr-0 md:pr-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Interwał (co ile dni)</label>
                        <input type="number" value={calendarIntervalDays} onChange={e => setCalendarIntervalDays(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm" required={triggerType === 'calendar' || triggerType === 'mixed'} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Data planowana</label>
                        <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm" required={triggerType === 'calendar' || triggerType === 'mixed'} />
                      </div>
                    </div>
                  )}
                  {(triggerType === 'hours' || triggerType === 'mixed') && (
                    <div className="space-y-3 pt-3 md:pt-0">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Interwał pracy (co ile rbg)</label>
                        <input type="number" value={hoursInterval} onChange={e => setHoursInterval(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm" required={triggerType === 'hours' || triggerType === 'mixed'} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Docelowy stan licznika (rbg)</label>
                        <input type="number" value={targetWorkHours} onChange={e => setTargetWorkHours(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm" required={triggerType === 'hours' || triggerType === 'mixed'} placeholder="np. 1500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Czas wyłączenia maszyny (h)</label>
                  <input type="number" value={estimatedDowntimeHours} onChange={e => setEstimatedDowntimeHours(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none" min={0} step="0.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pracochłonność (Roboczogodziny ludzi)</label>
                  <input type="number" value={estimatedManHours} onChange={e => setEstimatedManHours(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none" min={0} step="0.5" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Wymagany personel / kwalifikacje</label>
                  <input type="text" value={requiredPersonnel} onChange={e => setRequiredPersonnel(e.target.value)} placeholder="np. Elektryk SEP, 2x Mechanik" className="w-full p-2 border border-slate-300 rounded outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Wymagany status maszyny podczas serwisu</label>
                  <select value={machineStatus} onChange={e => setMachineStatus(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none bg-white">
                    <option value="LOTO">LOTO (Całkowicie odłączona, Lockout/Tagout)</option>
                    <option value="Wyłączona">Wyłączona, ale zasilanie doprowadzone</option>
                    <option value="Ruch częściowy">Dopuszczony ruch częściowy (tryb serwisowy)</option>
                    <option value="Bez wpływu">Maszyna może pracować normalnie</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold transition-colors">Anuluj</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-sm">Zapisz Plan</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
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
        {!isArchive && (
          <button 
            onClick={openModalForNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <i className="ph ph-plus-circle text-lg"></i>
            Dodaj Plan
          </button>
        )}
      </div>

      {/* Pasek Filtrów */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center shrink-0">
        <span className="text-sm font-bold text-slate-700 mr-2"><i className="ph ph-funnel"></i> Filtruj:</span>
        
        {!isArchive && (
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setFilterTime('all')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterTime === 'all' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>Wszystkie</button>
            <button onClick={() => setFilterTime('30')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterTime === '30' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>Najbliższe 30 dni</button>
            <button onClick={() => setFilterTime('90')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterTime === '90' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>Najbliższe 90 dni</button>
          </div>
        )}

        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Rejony</option>
          {regionsInUse.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Maszyny</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {(filterTime !== 'all' || filterRegion || filterMachine) && (
          <button onClick={clearFilters} className="text-sm text-red-600 font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
            <i className="ph ph-x"></i> Wyczyść filtr
          </button>
        )}

        <div className="ml-auto relative">
          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-lg flex items-center gap-2">
            <i className="ph ph-gear"></i> Kolumny
          </button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 text-sm">
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.name} onChange={() => toggleColumn('name')}/> Typ Serwisu</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.machine} onChange={() => toggleColumn('machine')}/> Maszyna</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.region} onChange={() => toggleColumn('region')}/> Rejon</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.nextDate} onChange={() => toggleColumn('nextDate')}/> Termin (Kalendarz)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.rbg} onChange={() => toggleColumn('rbg')}/> Termin (RBG)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.priority} onChange={() => toggleColumn('priority')}/> Priorytet</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.status} onChange={() => toggleColumn('status')}/> Status</label>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider bg-white border-b-2 border-slate-100 sticky top-0 z-10">
              <tr>
                {columns.name && <th className="px-3 sm:px-6 py-4">Typ Serwisu</th>}
                {columns.machine && <th className="px-3 sm:px-6 py-4">Maszyna</th>}
                {columns.region && <th className="px-3 sm:px-6 py-4">Rejon</th>}
                {columns.nextDate && <th className="px-3 sm:px-6 py-4">Termin</th>}
                {columns.rbg && <th className="px-3 sm:px-6 py-4">Przelot/Inf.</th>}
                {columns.priority && <th className="px-3 sm:px-6 py-4">Priorytet</th>}
                {columns.status && <th className="px-3 sm:px-6 py-4">Status</th>}
                {columns.actions && <th className="px-3 sm:px-6 py-4 text-right">Szczegóły</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-400">Brak serwisów pasujących do kryteriów.</td>
                </tr>
              ) : filteredServices.map(srv => {
                const machine = getMachine(srv.machineId);
                const isCompleted = srv.status === 'completed';
                const rowColor = getStatusColor(srv, machine);

                return (
                  <tr key={srv.id} className={`hover:bg-slate-50 transition-colors group ${isCompleted ? 'opacity-70' : ''}`}>
                    {columns.name && (
                      <td className="px-3 sm:px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm">{srv.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status maszyny: <span className="text-slate-600">{srv.machineStatus}</span></div>
                      </td>
                    )}
                    {columns.machine && (
                      <td className="px-3 sm:px-6 py-4 font-bold text-slate-800 text-sm">{machine?.name || 'Nieznana'}</td>
                    )}
                    {columns.region && (
                      <td className="px-3 sm:px-6 py-4 font-bold text-slate-600 text-sm">{getMachineRegionName(machine?.regionId)}</td>
                    )}
                    {columns.nextDate && (
                      <td className="px-3 sm:px-6 py-4">
                        {srv.triggerType === 'calendar' || srv.triggerType === 'mixed' ? (
                          <div className="text-sm">
                            <div className="font-bold text-slate-800">{srv.nextDate ? new Date(srv.nextDate.toDate ? srv.nextDate.toDate() : srv.nextDate).toLocaleDateString() : '-'}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">CO {srv.calendarIntervalDays} DNI</div>
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    )}
                    {columns.rbg && (
                      <td className="px-3 sm:px-6 py-4">
                        {srv.triggerType === 'hours' || srv.triggerType === 'mixed' ? (
                          <div className="text-sm">
                            <div className="font-bold text-slate-800">Cel: <span className="font-mono">{srv.targetWorkHours}</span></div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400">OBECNIE: <span className="font-mono">{machine?.currentWorkHours || 0}</span></span>
                              <button onClick={() => { setRbgUpdateModal(machine); setNewRbgValue(machine?.currentWorkHours || 0); }} className="text-blue-500 hover:text-blue-700 ml-1"><i className="ph ph-pencil-simple"></i></button>
                            </div>
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    )}
                    {columns.priority && (
                      <td className="px-3 sm:px-6 py-4">
                        {srv.priority === 'Krytyczny' ? <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-red-100 flex inline-flex items-center gap-1 w-max"><i className="ph ph-warning"></i> KRYTYCZNE</span> : <span className="text-slate-400 text-xs font-bold uppercase">Standard</span>}
                      </td>
                    )}
                    {columns.status && (
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${rowColor}`}>
                          {isCompleted ? 'Zakończone' : 'Oczekuje'}
                        </span>
                      </td>
                    )}
                    {columns.actions && (
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedServiceId(srv.id)}
                          className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-between w-full sm:w-auto"
                        >
                          Szczegóły <i className="ph ph-caret-right ml-2 text-slate-400"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aktualizacja RBG Modal */}
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

      {/* Dodaj / Edytuj Plan Modal (Bez zmian wizualnych, skopiowany z poprzedniej wersji) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSaveService} className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edytuj Plan Serwisowy' : 'Nowy Plan Serwisowy'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa / Typ serwisu</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Wymiana oleju - Serwis 500h" className="w-full p-2 border border-gray-300 rounded outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Maszyna</label>
                <select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white" required>
                  <option value="">-- Wybierz --</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kategoria / Priorytet</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
                  <option value="NieKrytyczny">NieKrytyczny (w tle)</option>
                  <option value="Krytyczny">Krytyczny (zatrzymuje linię)</option>
                </select>
              </div>
            </div>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-3">Typ wyzwalacza (Trigger)</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="calendar" checked={triggerType === 'calendar'} onChange={() => setTriggerType('calendar')} /> Kalendarzowy</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="hours" checked={triggerType === 'hours'} onChange={() => setTriggerType('hours')} /> Roboczogodziny</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="mixed" checked={triggerType === 'mixed'} onChange={() => setTriggerType('mixed')} /> Mieszany</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(triggerType === 'calendar' || triggerType === 'mixed') && (
                  <div className="space-y-3 border-t md:border-t-0 md:border-r border-gray-200 pt-3 md:pt-0 pr-0 md:pr-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Interwał (co ile dni)</label>
                      <input type="number" value={calendarIntervalDays} onChange={e => setCalendarIntervalDays(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" required={triggerType === 'calendar' || triggerType === 'mixed'} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Data planowana</label>
                      <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" required={triggerType === 'calendar' || triggerType === 'mixed'} />
                    </div>
                  </div>
                )}
                {(triggerType === 'hours' || triggerType === 'mixed') && (
                  <div className="space-y-3 pt-3 md:pt-0">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Interwał pracy (co ile rbg)</label>
                      <input type="number" value={hoursInterval} onChange={e => setHoursInterval(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" required={triggerType === 'hours' || triggerType === 'mixed'} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Docelowy stan licznika (rbg)</label>
                      <input type="number" value={targetWorkHours} onChange={e => setTargetWorkHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" required={triggerType === 'hours' || triggerType === 'mixed'} placeholder="np. 1500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Czas wyłączenia maszyny (h)</label>
                <input type="number" value={estimatedDowntimeHours} onChange={e => setEstimatedDowntimeHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" min={0} step="0.5" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pracochłonność (Roboczogodziny ludzi)</label>
                <input type="number" value={estimatedManHours} onChange={e => setEstimatedManHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" min={0} step="0.5" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Wymagany personel / kwalifikacje</label>
                <input type="text" value={requiredPersonnel} onChange={e => setRequiredPersonnel(e.target.value)} placeholder="np. Elektryk SEP, 2x Mechanik" className="w-full p-2 border border-gray-300 rounded outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Wymagany status maszyny podczas serwisu</label>
                <select value={machineStatus} onChange={e => setMachineStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
                  <option value="LOTO">LOTO (Całkowicie odłączona, Lockout/Tagout)</option>
                  <option value="Wyłączona">Wyłączona, ale zasilanie doprowadzone</option>
                  <option value="Ruch częściowy">Dopuszczony ruch częściowy (tryb serwisowy)</option>
                  <option value="Bez wpływu">Maszyna może pracować normalnie</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors">Anuluj</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-sm">Zapisz Plan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
