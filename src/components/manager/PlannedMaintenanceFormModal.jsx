import React from 'react';

export default function PlannedMaintenanceFormModal({
  isModalOpen, setIsModalOpen, editingId,
  name, setName, machineId, setMachineId,
  priority, setPriority, triggerType, setTriggerType,
  calendarIntervalDays, setCalendarIntervalDays,
  nextDate, setNextDate, hoursInterval, setHoursInterval,
  targetWorkHours, setTargetWorkHours,
  estimatedDowntimeHours, setEstimatedDowntimeHours,
  estimatedManHours, setEstimatedManHours,
  requiredPersonnel, setRequiredPersonnel,
  machineStatus, setMachineStatus,
  machines, handleSaveService
}) {
  if (!isModalOpen) return null;

  return (
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
  );
}
