import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { buildTree } from '../../utils/treeHelpers';

import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../store/managerStore';
import ChecklistBuilder from '../checklists/ChecklistBuilder';
import { addPlannedService, updatePlannedService } from '../../services/plannedServices.service';
import { arrayUnion } from 'firebase/firestore';

export default function PlannedMaintenanceFormModal({
  isOpen, onClose, editingService, machines }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const parts = useManagerStore(state => state.parts || []);

  const flattenedMachines = buildTree(machines);
  

  
  const [name, setName] = useState('');
  const [machineId, setMachineId] = useState('');

  const [machineSearchName, setMachineSearchName] = useState('');
  useEffect(() => {
    if (machineId) {
      const m = machines.find(mac => mac.id === machineId);
      if (m) setMachineSearchName(m.name);
    }
  }, [machineId, machines]);

  const [priority, setPriority] = useState('NieKrytyczny');
  const [category, setCategory] = useState('preventive');
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
  const [toolsType, setToolsType] = useState('Podstawowe');
  const [specialTools, setSpecialTools] = useState('');
  const [otherTools, setOtherTools] = useState('');
  const [requiredParts, setRequiredParts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        setName(editingService.name || '');
        setMachineId(editingService.machineId || '');
        setPriority(editingService.priority || 'NieKrytyczny');
        setCategory(editingService.category || 'preventive');
        setTriggerType(editingService.triggerType || 'calendar');
        setCalendarIntervalDays(editingService.calendarIntervalDays || 30);
        
        let d = '';
        if (editingService.nextDate) {
          const dt = typeof editingService.nextDate.toDate === 'function' 
            ? editingService.nextDate.toDate() 
            : new Date(editingService.nextDate);
          if (!isNaN(dt)) d = dt.toISOString().slice(0, 10);
        }
        setNextDate(d);
        
        setHoursInterval(editingService.hoursInterval || 500);
        setTargetWorkHours(editingService.targetWorkHours || '');
        setEstimatedDowntimeHours(editingService.estimatedDowntimeHours || 4);
        setEstimatedManHours(editingService.estimatedManHours || 8);
        setRequiredPersonnel(editingService.requiredPersonnel || '');
        setMachineStatus(editingService.machineStatus || 'LOTO');
        setChecklist(editingService.checklist || []);
        setToolsType(editingService.toolsType || 'Podstawowe');
        setSpecialTools(editingService.specialTools || '');
        setOtherTools(editingService.otherTools || '');
        setRequiredParts(editingService.requiredParts || []);
      } else {
        setName('');
        setMachineId('');
        setPriority('NieKrytyczny');
        setCategory('preventive');
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
        setToolsType('Podstawowe');
        setSpecialTools('');
        setOtherTools('');
        setRequiredParts([]);
      }
    }
  }, [isOpen, editingService]);

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!name?.trim()) return alert('Błąd: Podaj nazwę / typ serwisu.');
    if (!machineId) return alert('Błąd: Wybierz maszynę.');
    if ((triggerType === 'calendar' || triggerType === 'mixed') && !nextDate) return alert('Błąd: Podaj datę planowaną.');
    if ((triggerType === 'hours' || triggerType === 'mixed') && !targetWorkHours) return alert('Błąd: Podaj próg RBG.');
    
    const selectedMachine = machines.find(m => m.id === machineId);
    const serviceData = { 
      name, machineId, machineName: selectedMachine ? selectedMachine.name : "", priority, category, triggerType, 
      estimatedDowntimeHours: Number(estimatedDowntimeHours), 
      estimatedManHours: Number(estimatedManHours), 
      requiredPersonnel, machineStatus, notified: false, 
      checklist, toolsType, specialTools, otherTools, requiredParts 
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
      user: user?.name || 'System', 
      action: editingService ? 'Zaktualizowano plan' : 'Utworzono plan', 
      note: '' 
    };
    
    serviceData.history = editingService ? arrayUnion(historyEntry) : [historyEntry];
    
    try {
      if (editingService) {
        await updatePlannedService(editingService.id, serviceData);
      } else {
        await addPlannedService(serviceData);
      }
      onClose();
    } catch (err) { 
      console.error(err); 
      alert('Błąd podczas zapisywania: ' + err.message); 
    }
  };

  const addPart = () => {
    setRequiredParts([...(requiredParts || []), { partId: '', name: '', quantity: 1, unitCost: '' }]);
  };
  const updatePart = (index, field, value) => {
    const newParts = [...(requiredParts || [])];
    if (newParts[index]) newParts[index][field] = value;
    setRequiredParts(newParts);
  };
  const removePart = (index) => {
    const newParts = [...(requiredParts || [])];
    newParts.splice(index, 1);
    setRequiredParts(newParts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <form onSubmit={handleSaveService} className="bg-white rounded-xl shadow-xl max-w-5xl w-11/12 p-6 my-8 m-auto">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">{editingService ? 'Edytuj Plan Serwisowy' : 'Nowy Plan Serwisowy'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Maszyna</label>
            
              <input 
                type="text" 
                list="machines-list" 
                placeholder="-- Wpisz lub wybierz maszynę z listy --"
                value={machineSearchName} 
                onChange={e => {
                  const val = e.target.value;
                  setMachineSearchName(val);
                  const found = flattenedMachines.find(m => m.treeName === val || m.name === val);
                  if (found) setMachineId(found.id);
                  else setMachineId('');
                }} 
                className="w-full p-2 border border-gray-300 rounded outline-none bg-white" 
              />
              <datalist id="machines-list">
                {flattenedMachines.map(m => <option key={m.id} value={m.treeName} />)}
              </datalist>

          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa / Typ serwisu</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Wymiana oleju - Serwis 500h" className="w-full p-2 border border-gray-300 rounded outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Kategoria serwisu</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
              <option value="preventive">Serwis Planowany / Prewencyjny (PM)</option>
              <option value="predictive">Serwis Diagnostyczny / Predykcyjny</option>
              <option value="bhp_audit">Przegląd Ustawowy i BHP (Audyt)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Priorytet</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
              <option value="NieKrytyczny">Standardowy (bez zatrzymania maszyny)</option>
              <option value="Krytyczny">Krytyczny (zatrzymuje linię)</option>
            </select>
          </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('planned.machine_status')}</label>
              <select value={machineStatus} onChange={e => setMachineStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
                <option value="LOTO">LOTO (Całkowicie odłączona, Lockout/Tagout)</option>
                <option value="Wyłączona">Wyłączona, ale zasilanie doprowadzone</option>
                <option value="Ruch częściowy">Dopuszczony ruch częściowy (tryb serwisowy)</option>
                <option value="Bez wpływu">Maszyna może pracować normalnie</option>
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
                  <input type="number" value={calendarIntervalDays} onChange={e => setCalendarIntervalDays(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data planowana</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
              </div>
            )}
            {(triggerType === 'hours' || triggerType === 'mixed') && (
              <div className="space-y-3 pt-3 md:pt-0">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Interwał pracy (co ile rbg)</label>
                  <input type="number" value={hoursInterval} onChange={e => setHoursInterval(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Docelowy stan licznika (rbg)</label>
                  <input type="number" value={targetWorkHours} onChange={e => setTargetWorkHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="np. 1500" />
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
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('planned.required_personnel')}</label>
            <input type="text" value={requiredPersonnel} onChange={e => setRequiredPersonnel(e.target.value)} placeholder="np. Elektryk SEP, 2x Mechanik" className="w-full p-2 border border-gray-300 rounded outline-none" />
          </div>
          </div>
        
        {/* Narzędzia i części */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* {t('planned.required_tools')} */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <i className="ph ph-wrench text-lg text-slate-500"></i> {t('planned.required_tools')}
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="toolsType" value="Podstawowe" checked={toolsType === 'Podstawowe'} onChange={() => setToolsType('Podstawowe')} />
                Podstawowe (skrzynka narzędziowa)
              </label>
              
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="toolsType" value="Specjalne" checked={toolsType === 'Specjalne'} onChange={() => setToolsType('Specjalne')} />
                  Specjalne
                </label>
                {toolsType === 'Specjalne' && (
                  <input type="text" value={specialTools} onChange={e => setSpecialTools(e.target.value)} placeholder="np. ściągacz do łożysk 150mm" className="w-full p-2 border border-slate-300 rounded text-sm ml-6 w-[calc(100%-1.5rem)] outline-none" />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="toolsType" value="Inne" checked={toolsType === 'Inne'} onChange={() => setToolsType('Inne')} />
                  Inne
                </label>
                {toolsType === 'Inne' && (
                  <input type="text" value={otherTools} onChange={e => setOtherTools(e.target.value)} placeholder="np. podnośnik 10t" className="w-full p-2 border border-slate-300 rounded text-sm ml-6 w-[calc(100%-1.5rem)] outline-none" />
                )}
              </div>
            </div>
          </div>

          {/* Wymagane części */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i className="ph ph-nut text-lg text-slate-500"></i> {t('planned.required_parts')}
                </h4>
                <button type="button" onClick={addPart} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition-colors">
                  + Dodaj część
                </button>
              </div>
              
              {(!requiredParts || requiredParts.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Brak zdefiniowanych części</p>
              ) : (
                <div className="space-y-3">
                  {requiredParts.map((part, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded shadow-sm relative pr-8">
                      <button type="button" onClick={() => removePart(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                        <i className="ph ph-trash text-lg"></i>
                      </button>
                      
                      
                        <input 
                          type="text" 
                          list="parts-list"
                          placeholder="Wpisz lub wybierz z magazynu..."
                          value={part.searchName !== undefined ? part.searchName : (part.partId && part.partId !== 'custom' ? (parts.find(x => x.id === part.partId)?.name || part.name) : part.name)}
                          onChange={e => {
                            const val = e.target.value;
                            updatePart(index, 'searchName', val);
                            const found = parts.find(p => p.name === val || `${p.name} (St: ${p.stock})` === val);
                            if (found) {
                              updatePart(index, 'partId', found.id);
                              updatePart(index, 'name', found.name);
                            } else {
                              updatePart(index, 'partId', 'custom');
                              updatePart(index, 'name', val);
                            }
                          }}
                          className="flex-1 p-1.5 border border-slate-200 rounded text-sm outline-none bg-white"
                        />
                        <datalist id="parts-list">
                          {parts.map(p => <option key={p.id} value={`${p.name} (St: ${p.stock})`} />)}
                        </datalist>

                      
                      

                      <div className="flex gap-2">
                        <input type="number" min="1" step="1" value={part.quantity || 1} onChange={e => updatePart(index, 'quantity', Number(e.target.value))} placeholder="Ilość sztuk" className="w-1/2 p-1.5 border border-slate-200 rounded text-xs outline-none" title="Ilość" />
                        <input type="number" value={part.unitCost || ''} onChange={e => updatePart(index, 'unitCost', Number(e.target.value))} placeholder="Koszt jedn. (PLN)" className="w-1/2 p-1.5 border border-slate-200 rounded text-xs outline-none" title="Koszt jedn." disabled={part.partId && part.partId !== 'custom'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        <div className="mb-6"><ChecklistBuilder steps={checklist || []} onChange={setChecklist} /></div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors">Anuluj</button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-sm">Zapisz Plan</button>
        </div>
      </form>
    </div>
  );
}

