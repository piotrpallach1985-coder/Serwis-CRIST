import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';
import { safeParseDate } from '../dateHelpers';

export const generateAuditorReport = async () => {
  try {
    const reportData = {};

    // Helper to fetch collection
    const fetchCol = async (colName) => {
      const snap = await getDocs(collection(db, colName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const tickets = await fetchCol('tickets');
    const machines = await fetchCol('machines');
    const planned = await fetchCol('planned_services');
    const actions = await fetchCol('action_items');

    const machineMap = machines.reduce((acc, m) => { acc[m.id] = m.name; return acc; }, {});
    
    // Formatting Tickets
    const ticketRows = tickets.map(t => {
      const isDeleted = t.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(t.createdAt);
      const closed = safeParseDate(t.closedAt);
      const deleted = safeParseDate(t.deletedAt);
      
      let historyStr = '';
      if (t.history && t.history.length > 0) {
        historyStr = t.history.map(h => `[${safeParseDate(h.date)?.toLocaleString('pl-PL')}] ${h.user}: ${h.action} - ${h.note || ''}`).join(' | ');
      }

      return {
        'ID Zgłoszenia': t.id,
        'Maszyna (Nazwa)': machineMap[t.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': t.machineId,
        'Temat': t.topic || '-',
        'Opis': t.description || '-',
        'Status': t.status === 5 ? 'Zamknięte' : (t.status === 2 ? 'W trakcie' : 'Otwarte'),
        'Zgłaszający': t.reportedBy || '-',
        'Urządzenie zgłaszającego': t.reporterDevice || '-',
        'Zakończone przez': t.completedBy || '-',
        'Data Zgłoszenia': created ? created.toLocaleString('pl-PL') : '-',
        'Data Zamknięcia': closed ? closed.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': t.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-',
        'Pełna Historia Akcji': historyStr
      };
    });

    // Formatting Planned Services
    const plannedRows = planned.map(p => {
      const isDeleted = p.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(p.createdAt);
      const deleted = safeParseDate(p.deletedAt);
      
      let execStr = '';
      if (p.executions && p.executions.length > 0) {
        execStr = p.executions.map(e => `[${safeParseDate(e.date)?.toLocaleString('pl-PL')}] ${e.user}: ${e.note || 'Zrealizowano'}`).join(' | ');
      }

      return {
        'ID Serwisu': p.id,
        'Maszyna (Nazwa)': machineMap[p.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': p.machineId,
        'Nazwa Serwisu': p.name || '-',
        'Typ wyzwalacza': p.triggerType || '-',
        'Wykonawca': p.completedBy || '-',
        'Data Dodania': created ? created.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': p.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-',
        'Historia Wykonań': execStr
      };
    });

    
    // Formatting Action Items (Uwagi/Tematy do realizacji)
    const actionRows = actions.map(a => {
      const isDeleted = a.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(a.createdAt);
      const closed = safeParseDate(a.completedAt);
      const deleted = safeParseDate(a.deletedAt);
      
      return {
        'ID Tematu': a.id,
        'Maszyna (Nazwa)': machineMap[a.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': a.machineId,
        'Opis Problemu': a.problem || '-',
        'Termin (Wymagany)': a.dueDate ? safeParseDate(a.dueDate)?.toLocaleDateString('pl-PL') : '-',
        'Status': a.status === 'completed' ? 'Wykonano' : 'Otwarte',
        'Zakończone przez': a.completedBy || '-',
        'Data Zgłoszenia': created ? created.toLocaleString('pl-PL') : '-',
        'Data Wykonania': closed ? closed.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': a.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-'
      };
    });

    // Formatting Machines
    const machineRows = machines.map(m => {
      const isDeleted = m.isDeleted ? 'TAK' : 'NIE';
      const deleted = safeParseDate(m.deletedAt);
      return {
        'ID Maszyny': m.id,
        'Nazwa': m.name || '-',
        'Kod QR': m.qrCode || '-',
        'Rejon': m.regionName || '-',
        'Aktualne RBG': m.currentWorkHours || 0,
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': m.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-'
      };
    });

    const wb = XLSX.utils.book_new();
    
    if (ticketRows.length > 0) {
      const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
      XLSX.utils.book_append_sheet(wb, wsTickets, "Awarie i Historia");
    }
    
    if (plannedRows.length > 0) {
      const wsPlanned = XLSX.utils.json_to_sheet(plannedRows);
      XLSX.utils.book_append_sheet(wb, wsPlanned, "Serwisy Planowane");
    }
    
    
    if (actionRows.length > 0) {
      const wsActions = XLSX.utils.json_to_sheet(actionRows);
      XLSX.utils.book_append_sheet(wb, wsActions, "Tematy do realizacji");
    }

    if (machineRows.length > 0) {
      const wsMachines = XLSX.utils.json_to_sheet(machineRows);
      XLSX.utils.book_append_sheet(wb, wsMachines, "Maszyny");
    }

    XLSX.writeFile(wb, `Raport_Audytorski_CRIST_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error("Błąd generowania raportu audytorskiego:", error);
    throw error;
  }
};
