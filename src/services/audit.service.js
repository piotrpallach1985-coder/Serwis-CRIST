import { db, auth } from '../firebase';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { useManagerStore } from '../store/managerStore';

const TICKET_STATUS_MAP = {
  '0': 'Nowe',
  '1': 'Przyjęcie zgłoszenia',
  '2': 'Wybór wykonawcy',
  '3': 'Rozpoczęcie naprawy',
  '4': 'Naprawa w trakcie',
  '5': 'Zakończone'
};

const PLANNED_SERVICE_STATUS_MAP = {
  'pending': 'Oczekujące',
  'in_progress': 'Rozpoczęto serwis',
  'completed': 'Zakończone'
};

const FIELD_TRANSLATION_MAP = {
  status: 'Status',
  priority: 'Priorytet',
  assignedTo: 'Wykonawca',
  assignedService: 'Wykonawca',
  assignedAt: 'Data przypisania',
  inProgressAt: 'Rozpoczęto naprawę',
  currentStep: 'Etap realizacji',
  machineId: 'Maszyna',
  machineName: 'Maszyna',
  regionId: 'Rejon',
  parentId: 'Urządzenie nadrzędne',
  internalId: 'Nr wewnętrzny',
  bay: 'Hala/Przelot',
  name: 'Nazwa',
  description: 'Opis',
  topic: 'Temat',
  reportedBy: 'Zgłaszający',
  etr: 'Planowany czas zakończenia (ETR)',
  isManuallyArchived: 'Przeniesiono do archiwum',
  targetWorkHours: 'RBG Docelowe',
  currentWorkHours: 'Licznik RBG',
  nextDate: 'Następna Data',
  category: 'Kategoria',
  triggerType: 'Typ wyzwalacza',
  stock: 'Stan magazynowy',
  minStock: 'Stan minimalny',
  unit: 'Jednostka',
  dtrFiles: 'Pliki DTR',
  techNotes: 'Notatki techniczne',
  checklistResponses: 'Checklista',
  completionNotes: 'Notatka końcowa',
  problem: 'Problem',
  dueDate: 'Termin realizacji',
  clientSignerName: 'Podpisał (Klient)',
  address: 'Adres GPS',
  contactPerson: 'Klient / Kontakt',
  contactPhone: 'Telefon klienta',
  accessNotes: 'Dostęp / Kod domofonu',
  inspectionCategory: 'Kategoria c-KOB',
  refrigerantType: 'Czynnik chłodniczy',
  refrigerantChargeKg: 'Ilość czynnika (kg)',
  co2EquivalentTons: 'Ekwiwalent CO2 (t)',
  requiresCroCard: 'Wymóg karty CRO',
  gpsLat: 'Szerokość GPS',
  gpsLng: 'Długość GPS',
  inspectorLicense: 'Nr uprawnień kontrolującego',
  licenseNumber: 'Nr uprawnień / kwalifikacji',
  ckobEntered: 'Wpisano do rządowego c-KOB',
  ckobEnteredAt: 'Data wpisu c-KOB',
  ckobEnteredBy: 'Wprowadził do c-KOB',
  buildingType: 'Rodzaj i funkcja obiektu',
  constructionYear: 'Rok oddania do użytkowania',
  usableAreaM2: 'Powierzchnia użytkowa (m²)',
  cubatureM3: 'Kubatura (m³)',
  floorsCount: 'Liczba kondygnacji',
  hasAsbestos: 'Wyroby zawierające azbest',
  pinbAuthority: 'Właściwy organ PINB',
  legalTitleDoc: 'Tytuł prawny / KW',
  additionalDescription: 'Dodatkowy opis',
  travelStartedAt: 'Rozpoczęto dojazd',
  travelStartGps: 'GPS startu dojazdu',
  workStartedAt: 'Rozpoczęto pracę na miejscu',
  workStartGps: 'GPS startu pracy',
  completedGps: 'GPS zakończenia pracy',
  manHours: 'Zadeklarowane RBG (h)',
  actualManHours: 'Zadeklarowane RBG (h)',
  assetCategory: 'Typ zasobu (Urządzenie/Pojazd)',
  counterUnit: 'Jednostka licznika (km/RBG)',
  licensePlate: 'Nr rejestracyjny',
  vinNumber: 'Numer VIN',
  firstRegistrationDate: 'Data pierwszej rejestracji',
  fuelType: 'Rodzaj paliwa / napędu',
  techInspectionDate: 'Ważność badania SKP',
  insuranceExpiryDate: 'Ważność polisy OC/AC',
  assignedDriver: 'Przypisany kierowca',
  productionYear: 'Rok produkcji',
  engineSpec: 'Silnik (pojemność / moc)',
  tireSeason: 'Aktualne opony',
  tireSize: 'Rozmiar opon',
  policyNumber: 'Nr polisy OC/AC',
  assistancePhone: 'Telefon Assistance 24h',
  hasTowbar: 'Hak holowniczy i DMC',
  ownershipType: 'Własność / Leasing / Karta paliwowa',
  udtOrExtinguisherDate: 'Ważność UDT / Tachograf / Gaśnica'
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z?$/;

const formatIsoString = (valStr) => {
  if (!ISO_DATE_REGEX.test(valStr)) return valStr;
  const d = new Date(valStr);
  if (isNaN(d.getTime())) return valStr;
  return d.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStoreState = () => (typeof useManagerStore?.getState === 'function' ? (useManagerStore.getState() || {}) : {});

const resolveMachineNameFromState = (machineId, fallbackName, customState = null) => {
  if (fallbackName && fallbackName !== 'Nieznana') return fallbackName;
  if (!machineId) return fallbackName || '';
  const state = customState || getStoreState();
  const found = (state.machines || []).find(m => m.id === machineId);
  return found?.name || fallbackName || '';
};

export const formatDetails = (details, action, entityType, customState = null) => {
  if (typeof details === 'string') return details;
  if (!details || typeof details !== 'object') return '';
  
  let prefix = '';
  if (action === 'UPDATE') {
    prefix = 'Aktualizacja: ';
  } else if (action === 'CREATE') {
    prefix = 'Utworzono: ';
  } else if (action === 'DELETE') {
    prefix = 'Usunięto: ';
  }

  const state = customState || getStoreState();
  const parts = [];
  const skipKeys = [
    'updatedAt', 'createdAt', 'history', 'timestamp', 'deletedAt',
    'isDeleted', 'lastActive', 'closedAt', 'completedBy', 'batches',
    'clientSignature', 'completionDetails'
  ];
  
  for (const [key, value] of Object.entries(details)) {
    if (skipKeys.includes(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;

    let valStr = '';
    if (typeof value === 'boolean') {
      valStr = value ? 'Tak' : 'Nie';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) valStr = `${value.length} poz.`;
      else if (value && typeof value.toDate === 'function') {
        valStr = formatIsoString(value.toDate().toISOString());
      } else if (
        value &&
        typeof value.lat === 'number' &&
        typeof value.lng === 'number'
      ) {
        valStr = `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`;
      } else {
        continue;
      }
    } else {
      valStr = String(value).trim();
      if (!valStr) continue;
    }

    if (key === 'machineId') {
      const mName = resolveMachineNameFromState(valStr, '', state);
      if (mName) valStr = mName;
    } else if (key === 'regionId') {
      const reg = (state.regions || []).find(r => r.id === valStr);
      if (reg?.name) valStr = reg.name;
    } else if (key === 'parentId') {
      const parentMach = (state.machines || []).find(m => m.id === valStr);
      if (parentMach?.name) valStr = parentMach.name;
    } else if (entityType === 'TICKET' && key === 'status') {
      if (TICKET_STATUS_MAP[valStr]) valStr = TICKET_STATUS_MAP[valStr];
    } else if (entityType === 'PLANNED_SERVICE' && key === 'status') {
      if (PLANNED_SERVICE_STATUS_MAP[valStr]) valStr = PLANNED_SERVICE_STATUS_MAP[valStr];
    } else {
      valStr = formatIsoString(valStr);
    }

    const keyName = FIELD_TRANSLATION_MAP[key] || key;
    if (valStr.length > 60) valStr = valStr.substring(0, 60) + '...';
    parts.push(`${keyName}: ${valStr}`);
  }
  
  if (parts.length === 0) return prefix + 'Zmiana statusu / danych systemowych';
  return prefix + parts.join(', ');
};

/**
 * Normalizuje zapisane wcześniej w bazie (historyczne) opisy logów audytowych,
 * tłumacząc surowe pola techniczne (np. inProgressAt, puste ETR:) oraz rozwiązując
 * nazwę maszyny z pamięci podręcznej jeśli w logu zapisano "[Maszyna: Nieznana]".
 */
export const normalizeAuditLogDetails = (log, storeState = null) => {
  if (!log || !log.details) return '-';
  let text = String(log.details);
  const state = storeState || getStoreState();

  // 1. Rozwiąż "[Maszyna: Nieznana]" lub ", Maszyna: Nieznana]" na podstawie entityId
  if (text.includes('Maszyna: Nieznana') && log.entityId) {
    let resolvedMachineName = '';
    if (log.entityType === 'MACHINE') {
      resolvedMachineName = (state.machines || []).find(m => m.id === log.entityId)?.name || '';
    } else if (log.entityType === 'TICKET') {
      const t = (state.tickets || []).find(item => item.id === log.entityId);
      if (t) resolvedMachineName = t.machineName || (state.machines || []).find(m => m.id === t.machineId)?.name || '';
    } else if (log.entityType === 'PLANNED_SERVICE') {
      const s = (state.plannedServices || []).find(item => item.id === log.entityId);
      if (s) resolvedMachineName = s.machineName || (state.machines || []).find(m => m.id === s.machineId)?.name || '';
    } else if (log.entityType === 'ACTION_ITEM') {
      const a = (state.actionItems || []).find(item => item.id === log.entityId);
      if (a) resolvedMachineName = a.machineName || (state.machines || []).find(m => m.id === a.machineId)?.name || '';
    }

    if (resolvedMachineName) {
      text = text.replace(/Maszyna:\s*Nieznana/g, `Maszyna: ${resolvedMachineName}`);
    } else {
      text = text
        .replace(/\[Maszyna:\s*Nieznana\]\s*/g, '')
        .replace(/,\s*Maszyna:\s*Nieznana/g, '');
    }
  }

  // 2. Napraw historyczny błąd mapowania statusu 4 ("Status: Zakończone, inProgressAt:")
  if (text.includes('Status: Zakończone') && text.includes('inProgressAt:')) {
    text = text.replace('Status: Zakończone', 'Status: Naprawa w trakcie');
  }

  // 3. Przetłumacz surowe klucze z historycznych logów
  text = text
    .replace(/\binProgressAt:\s*/g, 'Rozpoczęto naprawę: ')
    .replace(/\bassignedAt:\s*/g, 'Data przypisania: ')
    .replace(/\bassignedService:\s*/g, 'Wykonawca: ')
    .replace(/\bcurrentStep:\s*/g, 'Etap realizacji: ')
    .replace(/\bcurrentWorkHours:\s*/g, 'Licznik RBG: ');

  // 4. Sformatuj surowe daty ISO wewnątrz tekstu
  text = text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z?/g, (match) => formatIsoString(match));

  // 5. Usuń puste pola na końcu lub w środku (np. ", ETR:", ", ETR: Brak")
  text = text
    .replace(/,\s*ETR:\s*(?=,|$)/g, '')
    .replace(/\bETR:\s*,\s*/g, '')
    .replace(/,\s*Planowany czas zakończenia \(ETR\):\s*(?=,|$)/g, '');

  return text.trim() || '-';
};

export const logAudit = async (action, entityType, entityId, details = '') => {
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId || auth?.currentUser?.isAnonymous) return;

    let contextStr = '';
    if (entityId) {
      let collectionName = '';
      if (entityType === 'TICKET') collectionName = 'tickets';
      else if (entityType === 'MACHINE') collectionName = 'machines';
      else if (entityType === 'PART') collectionName = 'parts';
      else if (entityType === 'PLANNED_SERVICE') collectionName = 'planned_services';
      else if (entityType === 'ACTION_ITEM') collectionName = 'action_items';

      if (collectionName) {
        try {
          const state = getStoreState();
          let data = null;
          
          if (entityType === 'TICKET' && state.tickets) data = state.tickets.find(t => t.id === entityId);
          else if (entityType === 'MACHINE' && state.machines) data = state.machines.find(m => m.id === entityId);
          else if (entityType === 'PART' && state.parts) data = state.parts.find(p => p.id === entityId);
          else if (entityType === 'PLANNED_SERVICE' && state.plannedServices) data = state.plannedServices.find(s => s.id === entityId);
          else if (entityType === 'ACTION_ITEM' && state.actionItems) data = state.actionItems.find(a => a.id === entityId);

          if (!data && typeof details === 'object' && details !== null) {
            data = details;
          }

          if (!data) {
            const docSnap = await getDoc(doc(db, 'tenants', tenantId, collectionName, entityId));
            if (docSnap.exists()) data = docSnap.data();
          }

          if (data) {
            const resolvedMachine = resolveMachineNameFromState(
              data.machineId || (typeof details === 'object' ? details?.machineId : null),
              data.machineName
            );

            if (entityType === 'TICKET') {
              contextStr = resolvedMachine ? `[Maszyna: ${resolvedMachine}] ` : '';
            } else if (entityType === 'MACHINE') {
              const mName = data.name || resolveMachineNameFromState(entityId);
              contextStr = mName ? `[Maszyna: ${mName}] ` : '';
            } else if (entityType === 'PART') {
              contextStr = data.name ? `[Część: ${data.name}] ` : '';
            } else if (entityType === 'PLANNED_SERVICE') {
              const srvName = data.name || 'Serwis';
              contextStr = resolvedMachine
                ? `[Serwis: ${srvName}, Maszyna: ${resolvedMachine}] `
                : `[Serwis: ${srvName}] `;
            } else if (entityType === 'ACTION_ITEM') {
              const mNamePart = resolvedMachine ? `, Maszyna: ${resolvedMachine}` : '';
              contextStr = `[Temat: ${data.problem ? data.problem.substring(0, 25) : '...'}${mNamePart}] `;
            }
          }
        } catch (e) {
          console.warn('Could not fetch audit context', e);
        }
      }
    }

    const user = auth.currentUser;
    let finalDetails = typeof details === 'string' 
      ? details 
      : formatDetails(details, action, entityType);
      
    if (contextStr && !finalDetails.includes(contextStr.trim())) {
      finalDetails = contextStr + finalDetails;
    }

    await addDoc(collection(db, 'tenants', tenantId, 'audit_logs'), {
      timestamp: serverTimestamp(),
      userId: user ? user.uid : 'public',
      userName: user ? (user.displayName || user.email || 'Użytkownik') : 'Zgłaszający ze skanera',
      action,
      entityType,
      entityId,
      details: finalDetails,
    });
  } catch (err) {
    console.error("Błąd zapisu Audit Log:", err);
  }
};
