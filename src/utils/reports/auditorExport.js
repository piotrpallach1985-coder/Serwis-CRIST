import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../dateHelpers';
import { TICKET_STATUS_LABELS, ACTION_ITEM_STATUS_LABELS } from '../constants';
import {
  filterTasksForFieldTechnician,
  filterMachinesForFieldTechnician,
  isTaskAssignedToUser,
  calculateWorkAndTravelMetrics,
} from '../fieldServiceHelpers';

const applyWorksheetFormatting = (ws, rows) => {
  if (!ws || !rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map(key => {
    const isHistoryCol = key.includes('Historia') || key.includes('Opis');
    return { wch: isHistoryCol ? 65 : Math.max(18, key.length + 4) };
  });

  Object.keys(ws).forEach(cellRef => {
    if (cellRef.startsWith('!')) return;
    const cell = ws[cellRef];
    if (cell && typeof cell === 'object') {
      cell.s = {
        ...(cell.s || {}),
        alignment: { vertical: 'top', wrapText: true }
      };
    }
  });
};

export const generateAuditorReport = async (
  tenantId,
  user = null,
  onlyAssignedTasks = false
) => {
  const XLSX = await import('xlsx');

  try {
    // Helper to fetch collection
    const fetchCol = async (colName) => {
      const snap = await getDocs(collection(db, 'tenants', tenantId, colName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const rawTickets = await fetchCol('tickets');
    const rawMachines = await fetchCol('machines');
    const rawPlanned = await fetchCol('planned_services');
    const rawActions = await fetchCol('action_items');
    let rawRegions = [];
    try {
      rawRegions = await fetchCol('regions');
    } catch {
      rawRegions = [];
    }

    const tickets = filterTasksForFieldTechnician(rawTickets, user, onlyAssignedTasks);
    const planned = filterTasksForFieldTechnician(rawPlanned, user, onlyAssignedTasks);
    const machines = filterMachinesForFieldTechnician(
      rawMachines,
      rawTickets,
      rawPlanned,
      user,
      onlyAssignedTasks
    );
    const hasDedicatedScope = Boolean(
      onlyAssignedTasks ||
        user?.assignedService ||
        (Array.isArray(user?.dedicatedServices) && user.dedicatedServices.length > 0)
    );
    const allowedMachineIds = new Set(machines.map(m => m.id));
    const actions = hasDedicatedScope
      ? rawActions.filter(
          a => allowedMachineIds.has(a.machineId) || isTaskAssignedToUser(a, user)
        )
      : rawActions;

    const machineMap = machines.reduce((acc, m) => { acc[m.id] = m.name; return acc; }, {});
    const machineObjMap = machines.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});
    
    // Formatting Tickets
    const ticketRows = tickets.map(t => {
      const isDeleted = t.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(t.createdAt);
      const closed = safeParseDate(t.closedAt);
      const deleted = safeParseDate(t.deletedAt);
      const metrics = calculateWorkAndTravelMetrics(t, machineObjMap[t.machineId] || null, rawRegions);
      const gpsVer =
        metrics.endGpsVerification.status !== 'no_worker_gps'
          ? metrics.endGpsVerification
          : metrics.startGpsVerification;
      
      let historyStr = '';
      if (t.history && t.history.length > 0) {
        historyStr = t.history
          .map(h => `[${safeParseDate(h.date)?.toLocaleString('pl-PL') || '-'}] ${h.user || 'System'}: ${h.action || ''}${h.note ? ' - ' + h.note : ''}`)
          .join('\r\n');
      }

      return {
        'ID Zgłoszenia': t.id,
        'Maszyna (Nazwa)': machineMap[t.machineId] || t.machineName || 'Nieznana (Usunięta)',
        'Maszyna ID': t.machineId,
        'Temat': t.topic || '-',
        'Opis': t.description || '-',
        'Status': TICKET_STATUS_LABELS[t.status] || 'Nieznany',
        'Zgłaszający': t.reportedBy || '-',
        'Urządzenie zgłaszającego': t.reporterDevice || '-',
        'Zakończone przez': t.completedBy || t.assignedTo || '-',
        'Czas dojazdu (min)': metrics.travelDurationMinutes !== null ? metrics.travelDurationMinutes : '-',
        'Czas pracy Stoper (h)': metrics.stopwatchWorkHours !== null ? metrics.stopwatchWorkHours : '-',
        'Zadeklarowane RBG (h)': metrics.declaredManHours !== null ? metrics.declaredManHours : '-',
        'Odchyłka RBG vs Stoper (h)': metrics.discrepancyHours !== null ? metrics.discrepancyHours : '-',
        'Weryfikacja GPS': gpsVer.label,
        'Odległość GPS (m)': gpsVer.distanceMeters !== null ? gpsVer.distanceMeters : '-',
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
      const metrics = calculateWorkAndTravelMetrics(p, machineObjMap[p.machineId] || null, rawRegions);
      const gpsVer =
        metrics.endGpsVerification.status !== 'no_worker_gps'
          ? metrics.endGpsVerification
          : metrics.startGpsVerification;
      
      const historyLines = [];
      if (Array.isArray(p.history) && p.history.length > 0) {
        p.history.forEach(h => {
          historyLines.push(`[${safeParseDate(h.date)?.toLocaleString('pl-PL') || '-'}] ${h.user || 'System'}: ${h.action || ''}${h.note ? ' - ' + h.note : ''}`);
        });
      }
      if (Array.isArray(p.executions) && p.executions.length > 0) {
        p.executions.forEach(e => {
          historyLines.push(`[${safeParseDate(e.date)?.toLocaleString('pl-PL') || '-'}] ${e.user || 'System'}: ${e.note || 'Zrealizowano'}`);
        });
      }
      const execStr = historyLines.join('\r\n');

      return {
        'ID Serwisu': p.id,
        'Maszyna (Nazwa)': machineMap[p.machineId] || p.machineName || 'Nieznana (Usunięta)',
        'Maszyna ID': p.machineId,
        'Nazwa Serwisu': p.name || '-',
        'Typ wyzwalacza': p.triggerType || '-',
        'Wykonawca': p.completedBy || p.assignedService || '-',
        'Czas dojazdu (min)': metrics.travelDurationMinutes !== null ? metrics.travelDurationMinutes : '-',
        'Czas pracy Stoper (h)': metrics.stopwatchWorkHours !== null ? metrics.stopwatchWorkHours : '-',
        'Zadeklarowane RBG (h)': metrics.declaredManHours !== null ? metrics.declaredManHours : '-',
        'Odchyłka RBG vs Stoper (h)': metrics.discrepancyHours !== null ? metrics.discrepancyHours : '-',
        'Weryfikacja GPS': gpsVer.label,
        'Odległość GPS (m)': gpsVer.distanceMeters !== null ? gpsVer.distanceMeters : '-',
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
        'Status': ACTION_ITEM_STATUS_LABELS[a.status] || a.status,
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
      applyWorksheetFormatting(wsTickets, ticketRows);
      XLSX.utils.book_append_sheet(wb, wsTickets, "Awarie i Historia");
    }
    
    if (plannedRows.length > 0) {
      const wsPlanned = XLSX.utils.json_to_sheet(plannedRows);
      applyWorksheetFormatting(wsPlanned, plannedRows);
      XLSX.utils.book_append_sheet(wb, wsPlanned, "Serwisy Planowane");
    }
    
    if (actionRows.length > 0) {
      const wsActions = XLSX.utils.json_to_sheet(actionRows);
      applyWorksheetFormatting(wsActions, actionRows);
      XLSX.utils.book_append_sheet(wb, wsActions, "Tematy do realizacji");
    }

    if (machineRows.length > 0) {
      const wsMachines = XLSX.utils.json_to_sheet(machineRows);
      applyWorksheetFormatting(wsMachines, machineRows);
      XLSX.utils.book_append_sheet(wb, wsMachines, "Maszyny");
    }

    if (!onlyAssignedTasks) {
      const techStatsMap = new Map();
      const accumulateTask = (task, isTicket) => {
        if (!task || task.isDeleted) return;
        const techName =
          (
            task.assignedTo ||
            task.assignedService ||
            task.completedBy ||
            task.completionDetails?.completedBy ||
            'Nieprzypisany'
          ).trim() || 'Nieprzypisany';
        if (!techStatsMap.has(techName)) {
          techStatsMap.set(techName, {
            'Serwisant / Wykonawca': techName,
            'Liczba zleceń (Łącznie)': 0,
            'Awarie': 0,
            'Serwisy planowane': 0,
            'Łączny czas dojazdu (min)': 0,
            'Czas pracy wg Stopera (h)': 0,
            'Zadeklarowane RBG (h)': 0,
            'Zlecenia z nadwyżką RBG (>15m)': 0,
            'GPS Na miejscu (<=300m)': 0,
            'GPS POZA OBIEKTEM': 0,
          });
        }
        const entry = techStatsMap.get(techName);
        entry['Liczba zleceń (Łącznie)'] += 1;
        if (isTicket) entry['Awarie'] += 1;
        else entry['Serwisy planowane'] += 1;

        const m = calculateWorkAndTravelMetrics(task, machineObjMap[task.machineId] || null, rawRegions);
        if (m.travelDurationMinutes !== null) {
          entry['Łączny czas dojazdu (min)'] += m.travelDurationMinutes;
        }
        if (m.stopwatchWorkHours !== null && !m.isMultiDayOrPaused) {
          entry['Czas pracy wg Stopera (h)'] = Number(
            (entry['Czas pracy wg Stopera (h)'] + m.stopwatchWorkHours).toFixed(2)
          );
        }
        if (m.declaredManHours !== null) {
          entry['Zadeklarowane RBG (h)'] = Number(
            (entry['Zadeklarowane RBG (h)'] + m.declaredManHours).toFixed(2)
          );
        }
        if (m.isTimeInflated) {
          entry['Zlecenia z nadwyżką RBG (>15m)'] += 1;
        }
        const gpsVer =
          m.endGpsVerification.status !== 'no_worker_gps'
            ? m.endGpsVerification
            : m.startGpsVerification;
        if (gpsVer.status === 'on_site') entry['GPS Na miejscu (<=300m)'] += 1;
        else if (gpsVer.status === 'off_site') entry['GPS POZA OBIEKTEM'] += 1;
      };

      tickets.forEach(t => accumulateTask(t, true));
      planned.forEach(p => accumulateTask(p, false));

      const techVerificationRows = Array.from(techStatsMap.values());
      if (techVerificationRows.length > 0) {
        const wsTech = XLSX.utils.json_to_sheet(techVerificationRows);
        applyWorksheetFormatting(wsTech, techVerificationRows);
        XLSX.utils.book_append_sheet(wb, wsTech, "Weryfikacja Serwisantow");
      }
    }

    XLSX.writeFile(wb, `Raport_Audytorski_VexoNT_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error("Błąd generowania raportu audytorskiego:", error);
    throw error;
  }
};
