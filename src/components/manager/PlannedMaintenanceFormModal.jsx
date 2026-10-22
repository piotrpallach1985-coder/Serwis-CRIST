import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { buildTree } from '../../utils/treeHelpers';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../store/managerStore';
import ChecklistBuilder from '../checklists/ChecklistBuilder';
import { addPlannedService, updatePlannedService } from '../../services/plannedServices.service';
import { arrayUnion } from 'firebase/firestore';

export default function PlannedMaintenanceFormModal({
  isOpen,
  onClose,
  editingService,
  machines,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const parts = useManagerStore(state => state.parts || []);
  const services = useManagerStore(state => state.services || []);
  const branding = useManagerStore(state => state.branding || {});
  const industryProfile = branding?.industryProfile || 'industrial';

  const flattenedMachines = buildTree(machines);

  const defaultCategoryByProfile =
    industryProfile === 'facility'
      ? 'ckob_annual'
      : industryProfile === 'hvac'
      ? 'fgas_leak_check'
      : 'preventive';

  const defaultMachineStatusByProfile =
    industryProfile === 'facility'
      ? 'Bez wpływu'
      : industryProfile === 'hvac'
      ? 'Tryb serwisowy HVAC'
      : 'LOTO';

  const defaultIntervalDaysByProfile =
    industryProfile === 'facility' || industryProfile === 'hvac' ? 365 : 30;

  const [name, setName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [assignedService, setAssignedService] = useState('');

  const [machineSearchName, setMachineSearchName] = useState('');
  useEffect(() => {
    if (machineId) {
      const m = machines.find(mac => mac.id === machineId);
      if (m) setMachineSearchName(m.name);
    } else {
      setMachineSearchName('');
    }
  }, [machineId, machines]);

  const [priority, setPriority] = useState('NieKrytyczny');
  const [category, setCategory] = useState(defaultCategoryByProfile);
  const [triggerType, setTriggerType] = useState('calendar');
  const [calendarIntervalDays, setCalendarIntervalDays] = useState(defaultIntervalDaysByProfile);
  const [nextDate, setNextDate] = useState('');
  const [hoursInterval, setHoursInterval] = useState(500);
  const [targetWorkHours, setTargetWorkHours] = useState('');
  const [estimatedDowntimeHours, setEstimatedDowntimeHours] = useState(
    industryProfile === 'facility' ? 0 : 4
  );
  const [estimatedManHours, setEstimatedManHours] = useState(
    industryProfile === 'facility' || industryProfile === 'hvac' ? 2 : 8
  );
  const [requiredPersonnel, setRequiredPersonnel] = useState('');
  const [machineStatus, setMachineStatus] = useState(defaultMachineStatusByProfile);
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
        setAssignedService(editingService.assignedService || editingService.assignedTo || '');
        setPriority(editingService.priority || 'NieKrytyczny');
        setCategory(editingService.category || defaultCategoryByProfile);
        setTriggerType(editingService.triggerType || 'calendar');
        setCalendarIntervalDays(
          editingService.calendarIntervalDays || defaultIntervalDaysByProfile
        );

        let d = '';
        if (editingService.nextDate) {
          const dt =
            typeof editingService.nextDate.toDate === 'function'
              ? editingService.nextDate.toDate()
              : new Date(editingService.nextDate);
          if (!isNaN(dt)) d = dt.toISOString().slice(0, 10);
        }
        setNextDate(d);

        setHoursInterval(editingService.hoursInterval || 500);
        setTargetWorkHours(editingService.targetWorkHours || '');
        setEstimatedDowntimeHours(
          editingService.estimatedDowntimeHours !== undefined
            ? editingService.estimatedDowntimeHours
            : 4
        );
        setEstimatedManHours(editingService.estimatedManHours || 8);
        setRequiredPersonnel(editingService.requiredPersonnel || '');
        setMachineStatus(editingService.machineStatus || defaultMachineStatusByProfile);
        setChecklist(editingService.checklist || []);
        setToolsType(editingService.toolsType || 'Podstawowe');
        setSpecialTools(editingService.specialTools || '');
        setOtherTools(editingService.otherTools || '');
        setRequiredParts(editingService.requiredParts || []);
      } else {
        setName('');
        setMachineId('');
        setAssignedService('');
        setPriority('NieKrytyczny');
        setCategory(defaultCategoryByProfile);
        setTriggerType('calendar');
        setCalendarIntervalDays(defaultIntervalDaysByProfile);
        setNextDate('');
        setHoursInterval(500);
        setTargetWorkHours('');
        setEstimatedDowntimeHours(industryProfile === 'facility' ? 0 : 4);
        setEstimatedManHours(industryProfile === 'facility' || industryProfile === 'hvac' ? 2 : 8);
        setRequiredPersonnel('');
        setMachineStatus(defaultMachineStatusByProfile);
        setChecklist([]);
        setToolsType('Podstawowe');
        setSpecialTools('');
        setOtherTools('');
        setRequiredParts([]);
      }
    }
  }, [isOpen, editingService, industryProfile]);

  const handleSaveService = async e => {
    e.preventDefault();
    if (!name?.trim()) return alert('Błąd: Podaj nazwę / typ serwisu.');
    if (!machineId) return alert('Błąd: Wybierz urządzenie.');
    if ((triggerType === 'calendar' || triggerType === 'mixed') && !nextDate)
      return alert('Błąd: Podaj datę planowaną.');
    if ((triggerType === 'hours' || triggerType === 'mixed') && !targetWorkHours)
      return alert('Błąd: Podaj próg RBG.');

    const selectedMachine = machines.find(m => m.id === machineId);
    const serviceData = {
      name,
      machineId,
      machineName: selectedMachine ? selectedMachine.name : '',
      assignedService: assignedService || null,
      priority,
      category,
      triggerType,
      estimatedDowntimeHours: Number(estimatedDowntimeHours),
      estimatedManHours: Number(estimatedManHours),
      requiredPersonnel,
      machineStatus,
      notified: false,
      checklist,
      toolsType,
      specialTools,
      otherTools,
      requiredParts,
    };

    if (triggerType === 'calendar' || triggerType === 'mixed') {
      serviceData.calendarIntervalDays = Number(calendarIntervalDays);
      serviceData.nextDate = nextDate ? new Date(nextDate) : null;
    } else {
      serviceData.calendarIntervalDays = null;
      serviceData.nextDate = null;
    }
    if (triggerType === 'hours' || triggerType === 'mixed') {
      serviceData.hoursInterval = Number(hoursInterval);
      serviceData.targetWorkHours = Number(targetWorkHours);
    } else {
      serviceData.hoursInterval = null;
      serviceData.targetWorkHours = null;
    }

    const historyEntry = {
      date: new Date().toISOString(),
      user: user?.name || 'System',
      action: editingService ? 'Zaktualizowano plan' : 'Utworzono plan',
      note: '',
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
    setRequiredParts([
      ...(requiredParts || []),
      { partId: '', name: '', quantity: 1, unitCost: '' },
    ]);
  };
  const updatePart = (index, field, value) => {
    const newParts = [...(requiredParts || [])];
    if (newParts[index]) newParts[index][field] = value;
    setRequiredParts(newParts);
  };
  const removePart = index => {
    const newParts = [...(requiredParts || [])];
    newParts.splice(index, 1);
    setRequiredParts(newParts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <form
        onSubmit={handleSaveService}
        className="bg-white rounded-xl shadow-xl max-w-5xl w-11/12 p-6 my-8 m-auto"
      >
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {editingService ? 'Edytuj Plan Serwisowy' : 'Nowy Plan Serwisowy'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Urządzenie</label>
              <input
                type="text"
                list="machines-list"
                data-testid="planned-service-device-input"
                placeholder="-- Wpisz lub wybierz urządzenie z listy --"
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
                {flattenedMachines.map(m => (
                  <option key={m.id} value={m.treeName} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Dedykowany Serwis / Wykonawca
              </label>
              <select
                value={assignedService}
                onChange={e => setAssignedService(e.target.value)}
                data-testid="planned-service-contractor-select"
                className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
              >
                <option value="">-- Dowolny / Przypisz później --</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                    {s.licenseNumber ? ` (${s.licenseNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Nazwa / Typ serwisu
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                industryProfile === 'facility'
                  ? 'np. Roczny przegląd instalacji elektrycznej i kominowej (art. 62 PB)'
                  : industryProfile === 'hvac'
                  ? 'np. Okresowa kontrola szczelności F-Gaz i czyszczenie wymiennika'
                  : 'np. Wymiana oleju - Serwis 500h'
              }
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Kategoria serwisu
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              data-testid="planned-service-category-select"
              className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
            >
              {industryProfile === 'facility' ? (
                <>
                  <option value="ckob_annual">
                    Przegląd roczny okresowy (art. 62 ust. 1 pkt 1 PB - c-KOB)
                  </option>
                  <option value="ckob_five_year">
                    Przegląd 5-letni kompleksowy i elektryczny (art. 62 ust. 1 pkt 2 PB)
                  </option>
                  <option value="ckob_semi_annual">
                    Przegląd półroczny wielkopowierzchniowy &gt;2000 m² (maj / listopad)
                  </option>
                  <option value="gas_chimney">
                    Przegląd instalacji gazowej i przewodów kominowych
                  </option>
                  <option value="fire_safety">
                    Przegląd PPOŻ / SSP / Oddymianie / Hydranty
                  </option>
                  <option value="preventive">
                    Konserwacja bieżąca / Serwis instalacji budynku
                  </option>
                  <option value="bhp_audit">Przegląd Ustawowy UDT / Dźwigi / BHP</option>
                </>
              ) : industryProfile === 'hvac' ? (
                <>
                  <option value="fgas_leak_check">
                    Obowiązkowa próba szczelności F-Gaz / CRO (Rozp. UE 2024/573)
                  </option>
                  <option value="seasonal_service">
                    Przegląd sezonowy / Czyszczenie i dezynfekcja (Wiosna / Jesień)
                  </option>
                  <option value="warranty_review">
                    Przegląd gwarancyjny producenta (Pompa ciepła / Chiller / VRF)
                  </option>
                  <option value="preventive">
                    Konserwacja prewencyjna i wymiana filtrów (Centrala AHU)
                  </option>
                  <option value="bhp_audit">
                    Kontrola UDT urządzeń ciśnieniowych / Audyt energetyczny
                  </option>
                </>
              ) : (
                <>
                  <option value="preventive">Serwis Planowany / Prewencyjny (PM)</option>
                  <option value="predictive">Serwis Diagnostyczny / Predykcyjny</option>
                  <option value="bhp_audit">Przegląd Ustawowy i BHP (Audyt)</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Priorytet</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              data-testid="planned-service-priority-select"
              className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
            >
              {industryProfile === 'facility' ? (
                <>
                  <option value="NieKrytyczny">
                    Standardowy (Konserwacja planowa bez utrudnień dla lokatorów)
                  </option>
                  <option value="Krytyczny">
                    Krytyczny / Ustawowy (Termin ustawowy c-KOB / Bezpieczeństwo obiektu)
                  </option>
                </>
              ) : industryProfile === 'hvac' ? (
                <>
                  <option value="NieKrytyczny">
                    Standardowy (Przegląd serwisowy / Gwarancyjny)
                  </option>
                  <option value="Krytyczny">
                    Krytyczny (Ustawowy termin CRO F-Gaz / Chłodzenie krytyczne)
                  </option>
                </>
              ) : (
                <>
                  <option value="NieKrytyczny">Standardowy (bez zatrzymania urządzenia)</option>
                  <option value="Krytyczny">Krytyczny (zatrzymuje linię)</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Wymagany status urządzenia
            </label>
            <select
              value={machineStatus}
              onChange={e => setMachineStatus(e.target.value)}
              data-testid="planned-service-status-select"
              className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
            >
              {industryProfile === 'facility' ? (
                <>
                  <option value="Bez wpływu">
                    Normalna eksploatacja budynku (bez utrudnień)
                  </option>
                  <option value="Dostęp do lokali">
                    Wymagane powiadomienie mieszkańców / dostęp do lokali
                  </option>
                  <option value="Czasowe wyłączenie instalacji">
                    Czasowe wyłączenie instalacji (prąd / woda / gaz / winda)
                  </option>
                  <option value="Wyłączenie strefy">
                    Wygrodzenie strefy / części wspólnej budynku
                  </option>
                  <option value="LOTO">
                    Całkowite odłączenie zasilania rozdzielnicy / kotłowni (LOTO)
                  </option>
                </>
              ) : industryProfile === 'hvac' ? (
                <>
                  <option value="Tryb serwisowy HVAC">
                    Tryb serwisowy / Odzysk czynnika (układ wyłączony)
                  </option>
                  <option value="Praca pod obciążeniem">
                    Praca pod obciążeniem (pomiary ciśnień i temperatur)
                  </option>
                  <option value="LOTO">
                    Odłączenie zasilania elektrycznego agregatu (LOTO)
                  </option>
                  <option value="Bez wpływu">
                    Normalna praca układu (czyszczenie / wymiana filtrów)
                  </option>
                </>
              ) : (
                <>
                  <option value="LOTO">LOTO (Całkowicie odłączone, Lockout/Tagout)</option>
                  <option value="Wyłączona">Wyłączone, ale zasilanie doprowadzone</option>
                  <option value="Ruch częściowy">
                    Dopuszczony ruch częściowy (tryb serwisowy)
                  </option>
                  <option value="Bez wpływu">Urządzenie może pracować normalnie</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-800 mb-3">
            Typ wyzwalacza (Trigger)
          </label>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="trigger"
                value="calendar"
                checked={triggerType === 'calendar'}
                onChange={() => setTriggerType('calendar')}
              />
              {industryProfile === 'facility'
                ? 'Kalendarzowy / Ustawowy (c-KOB art. 62 PB)'
                : industryProfile === 'hvac'
                ? 'Kalendarzowy (Okresowy CRO / Gwarancja)'
                : 'Kalendarzowy'}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="trigger"
                value="hours"
                checked={triggerType === 'hours'}
                onChange={() => setTriggerType('hours')}
              />
              {industryProfile === 'hvac'
                ? 'Godziny pracy sprężarki / agregatu (RBG)'
                : industryProfile === 'facility'
                ? 'Licznikowy (Godziny pracy dźwigu / kotła)'
                : 'Roboczogodziny'}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="trigger"
                value="mixed"
                checked={triggerType === 'mixed'}
                onChange={() => setTriggerType('mixed')}
              />
              {industryProfile === 'hvac'
                ? 'Mieszany (Kalendarz lub Godziny pracy)'
                : 'Mieszany'}
            </label>
          </div>
          {(triggerType === 'calendar' || triggerType === 'mixed') &&
            (industryProfile === 'facility' || industryProfile === 'hvac') && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Szybki interwał:</span>
                {industryProfile === 'facility' ? (
                  <>
                    {[
                      { label: 'Półroczny (180 dni)', days: 180 },
                      { label: 'Roczny (365 dni - art. 62.1.1)', days: 365 },
                      { label: '5-letni (1825 dni - art. 62.1.2)', days: 1825 },
                    ].map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setCalendarIntervalDays(preset.days)}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                          Number(calendarIntervalDays) === preset.days
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Co 3 mies. (90 dni - ≥500t CO2e)', days: 90 },
                      { label: 'Co 6 mies. (180 dni - 50-500t CO2e)', days: 180 },
                      { label: 'Co 12 mies. (365 dni - 5-50t CO2e)', days: 365 },
                    ].map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setCalendarIntervalDays(preset.days)}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                          Number(calendarIntervalDays) === preset.days
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-white text-cyan-800 border-cyan-300 hover:bg-cyan-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(triggerType === 'calendar' || triggerType === 'mixed') && (
              <div className="space-y-3 border-t md:border-t-0 md:border-r border-gray-200 pt-3 md:pt-0 pr-0 md:pr-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Interwał (co ile dni)
                  </label>
                  <input
                    type="number"
                    value={calendarIntervalDays}
                    onChange={e => setCalendarIntervalDays(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data planowana
                  </label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={e => setNextDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}
            {(triggerType === 'hours' || triggerType === 'mixed') && (
              <div className="space-y-3 pt-3 md:pt-0">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Interwał pracy (co ile rbg)
                  </label>
                  <input
                    type="number"
                    value={hoursInterval}
                    onChange={e => setHoursInterval(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Docelowy stan licznika (rbg)
                  </label>
                  <input
                    type="number"
                    value={targetWorkHours}
                    onChange={e => setTargetWorkHours(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="np. 1500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Czas wyłączenia urządzenia (h)
            </label>
            <input
              type="number"
              value={estimatedDowntimeHours}
              onChange={e => setEstimatedDowntimeHours(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded outline-none"
              min={0}
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Pracochłonność (Roboczogodziny ludzi)
            </label>
            <input
              type="number"
              value={estimatedManHours}
              onChange={e => setEstimatedManHours(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded outline-none"
              min={0}
              step="0.5"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('planned.required_personnel')}
            </label>
            <input
              type="text"
              value={requiredPersonnel}
              onChange={e => setRequiredPersonnel(e.target.value)}
              placeholder={
                industryProfile === 'facility'
                  ? 'np. Uprawnienia budowlane (PIIB), Mistrz kominiarski, Elektryk SEP D+E'
                  : industryProfile === 'hvac'
                  ? 'np. Serwisant F-Gaz (UDT), Chłodnik'
                  : 'np. Elektryk SEP, 2x Mechanik'
              }
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
        </div>

        {/* Narzędzia i części */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <i className="ph ph-wrench text-lg text-slate-500"></i> {t('planned.required_tools')}
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="toolsType"
                  value="Podstawowe"
                  checked={toolsType === 'Podstawowe'}
                  onChange={() => setToolsType('Podstawowe')}
                />
                Podstawowe (skrzynka narzędziowa)
              </label>

              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="toolsType"
                    value="Specjalne"
                    checked={toolsType === 'Specjalne'}
                    onChange={() => setToolsType('Specjalne')}
                  />
                  Specjalne
                </label>
                {toolsType === 'Specjalne' && (
                  <input
                    type="text"
                    value={specialTools}
                    onChange={e => setSpecialTools(e.target.value)}
                    placeholder="np. miernik instalacji Sonel / detektor F-Gaz / anemometr"
                    className="w-full p-2 border border-slate-300 rounded text-sm ml-6 w-[calc(100%-1.5rem)] outline-none"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="toolsType"
                    value="Inne"
                    checked={toolsType === 'Inne'}
                    onChange={() => setToolsType('Inne')}
                  />
                  Inne
                </label>
                {toolsType === 'Inne' && (
                  <input
                    type="text"
                    value={otherTools}
                    onChange={e => setOtherTools(e.target.value)}
                    placeholder="np. podnośnik koszowy"
                    className="w-full p-2 border border-slate-300 rounded text-sm ml-6 w-[calc(100%-1.5rem)] outline-none"
                  />
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
              <button
                type="button"
                onClick={addPart}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition-colors"
              >
                + Dodaj część
              </button>
            </div>

            {!requiredParts || requiredParts.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Brak zdefiniowanych części
              </p>
            ) : (
              <div className="space-y-3">
                {requiredParts.map((part, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded shadow-sm relative pr-8"
                  >
                    <button
                      type="button"
                      onClick={() => removePart(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                    >
                      <i className="ph ph-trash text-lg"></i>
                    </button>

                    <input
                      type="text"
                      list="parts-list"
                      placeholder="Wpisz lub wybierz z magazynu..."
                      value={
                        part.searchName !== undefined
                          ? part.searchName
                          : part.partId && part.partId !== 'custom'
                          ? parts.find(x => x.id === part.partId)?.name || part.name
                          : part.name
                      }
                      onChange={e => {
                        const val = e.target.value;
                        updatePart(index, 'searchName', val);
                        const found = parts.find(
                          p => p.name === val || `${p.name} (St: ${p.stock})` === val
                        );
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
                      {parts.map(p => (
                        <option key={p.id} value={`${p.name} (St: ${p.stock})`} />
                      ))}
                    </datalist>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={part.quantity || 1}
                        onChange={e => updatePart(index, 'quantity', Number(e.target.value))}
                        placeholder="Ilość sztuk"
                        className="w-1/2 p-1.5 border border-slate-200 rounded text-xs outline-none"
                        title="Ilość"
                      />
                      <input
                        type="number"
                        value={part.unitCost || ''}
                        onChange={e => updatePart(index, 'unitCost', Number(e.target.value))}
                        placeholder="Koszt jedn. (PLN)"
                        className="w-1/2 p-1.5 border border-slate-200 rounded text-xs outline-none"
                        title="Koszt jedn."
                        disabled={part.partId && part.partId !== 'custom'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <ChecklistBuilder steps={checklist || []} onChange={setChecklist} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Zapisz Plan
          </button>
        </div>
      </form>
    </div>
  );
}
