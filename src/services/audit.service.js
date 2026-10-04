import { db, auth } from '../firebase';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { useManagerStore } from '../store/managerStore';

const TICKET_STATUS_MAP = {
  '0': 'Nowe',
  '1': 'W przypisaniu',
  '2': 'W toku (Rozpoczęto)',
  '3': 'Wstrzymane',
  '4': 'Zakończone',
  '5': 'Zarchiwizowane'
};

const PLANNED_SERVICE_STATUS_MAP = {
  'pending': 'Oczekujące',
  'in_progress': 'Rozpoczęto serwis',
  'completed': 'Zakończone'
};

const FIELD_TRANSLATION_MAP = {
  status: 'Status',
  priority: 'Priorytet',
  assignedTo: 'Przypisany',
  machineId: 'Maszyna',
  name: 'Nazwa',
  description: 'Opis',
  etr: 'ETR',
  isManuallyArchived: 'Archiwizacja',
  targetWorkHours: 'RBG Docelowe',
  nextDate: 'Następna Data',
  category: 'Kategoria',
  triggerType: 'Typ'
};

const formatDetails = (details, action, entityType) => {
  if (typeof details === 'string') return details;
  if (!details || typeof details !== 'object') return '';
  
  let prefix = '';
  if (action === 'UPDATE') {
    prefix = 'Aktualizacja: ';
  } else if (action === 'CREATE') {
    prefix = 'Utworzono z: ';
  }

  const parts = [];
  const skipKeys = ['updatedAt', 'createdAt', 'history', 'timestamp', 'deletedAt', 'isDeleted', 'lastActive', 'closedAt', 'completedBy'];
  
  for (const [key, value] of Object.entries(details)) {
    if (skipKeys.includes(key)) continue;
    let valStr = '';
    if (value === null) valStr = 'Brak';
    else if (typeof value === 'object') {
      if (Array.isArray(value)) valStr = `[${value.length} elem.]`;
      else if (value && typeof value.toDate === 'function') valStr = value.toDate().toISOString().slice(0, 16).replace('T', ' ');
      else valStr = '{Obiekt}';
    } else {
      valStr = String(value);
    }

    // Decode statuses for TICKET
    if (entityType === 'TICKET' && key === 'status') {
      if (TICKET_STATUS_MAP[valStr]) valStr = TICKET_STATUS_MAP[valStr];
    }
    
    // Decode status for PLANNED_SERVICE
    if (entityType === 'PLANNED_SERVICE' && key === 'status') {
       if (PLANNED_SERVICE_STATUS_MAP[valStr]) valStr = PLANNED_SERVICE_STATUS_MAP[valStr];
    }
    
    // Polish translation for common keys to make it more readable
    let keyName = key;
    if (FIELD_TRANSLATION_MAP[key]) keyName = FIELD_TRANSLATION_MAP[key];

    if (valStr.length > 50) valStr = valStr.substring(0, 50) + '...';
    parts.push(`${keyName}: ${valStr}`);
  }
  
  if (parts.length === 0) return prefix + 'Drobne zmiany systemowe';
  return prefix + parts.join(', ');
};

export const logAudit = async (action, entityType, entityId, details = '') => {
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) return;

    // Fetch entity context
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
          const state = useManagerStore.getState();
          let data = null;
          
          if (entityType === 'TICKET' && state.tickets) data = state.tickets.find(t => t.id === entityId);
          else if (entityType === 'MACHINE' && state.machines) data = state.machines.find(m => m.id === entityId);
          else if (entityType === 'PART' && state.parts) data = state.parts.find(p => p.id === entityId);
          else if (entityType === 'PLANNED_SERVICE' && state.plannedServices) data = state.plannedServices.find(s => s.id === entityId);
          else if (entityType === 'ACTION_ITEM' && state.actionItems) data = state.actionItems.find(a => a.id === entityId);

          // Fallback to Firestore read ONLY if not found in memory
          if (!data) {
            const docSnap = await getDoc(doc(db, 'tenants', tenantId, collectionName, entityId));
            if (docSnap.exists()) data = docSnap.data();
          }

          if (data) {
            if (entityType === 'TICKET') {
              contextStr = `[Maszyna: ${data.machineName || 'Nieznana'}] `;
            } else if (entityType === 'MACHINE') {
              contextStr = `[Maszyna: ${data.name || 'Nieznana'}] `;
            } else if (entityType === 'PART') {
              contextStr = `[Cz: ${data.name || 'Nieznana'}] `;
            } else if (entityType === 'PLANNED_SERVICE') {
              contextStr = `[Serwis: ${data.name || 'Nieznany'}, Maszyna: ${data.machineName || 'Nieznana'}] `;
            } else if (entityType === 'ACTION_ITEM') {
               const mName = data.machineName ? `Maszyna: ${data.machineName}` : '';
               contextStr = `[Temat: ${data.problem ? data.problem.substring(0, 20) : '...'} ${mName}] `;
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
      
    // Always prepend contextStr if it exists and isn't already inside the string
    if (contextStr && !finalDetails.includes(contextStr)) {
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
