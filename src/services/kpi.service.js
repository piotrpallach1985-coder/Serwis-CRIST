import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { TICKET_STATUS } from '../utils/constants';
import { getCurrentTenant } from '../utils/tenantHelper';
import { safeParseDate } from '../utils/dateHelpers';
import { checkServiceUrgency } from '../utils/logicHelpers';

export const fetchHistoricalTickets = async () => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return [];
  const q = query(collection(db, 'tenants', tenantId, 'tickets'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(x => !x.isDeleted && Number(x.status) === TICKET_STATUS.CLOSED);
};

export const fetchHistoricServices = async () => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return [];
  const qArchive = query(
    collection(db, 'tenants', tenantId, 'planned_services'),
    where('status', '==', 'completed')
  );
  const snap = await getDocs(qArchive);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted);
};

export const fetchServerKPIStats = async (period) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;
  const getKPIStats = httpsCallable(functions, 'getKPIStats');
  const result = await getKPIStats({ tenantId, period });
  return result.data;
};

export const fetchServerPlannedKPIStats = async (period) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;
  const getPlannedKPIStats = httpsCallable(functions, 'getPlannedKPIStats');
  const result = await getPlannedKPIStats({ tenantId, period });
  return result.data;
};

/**
 * Oblicza wskaźniki KPI awarii bezpośrednio z kolekcji Firestore dzierżawcy
 * (odporne na brak pola isDeleted w dokumentach).
 */
export const computeClientKPIStats = async (period = 'all', machinesList = []) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;

  const snap = await getDocs(collection(db, 'tenants', tenantId, 'tickets'));
  const allTickets = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(t => t.isDeleted !== true);

  const now = new Date();
  let startDate = null;
  if (period && period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  let totalTickets = 0;
  let closedTicketsCount = 0;
  let criticalTicketsCount = 0;
  let totalRepairTimeMinutes = 0;
  let repairedWithTimeCount = 0;
  const machineFaultCounts = {};
  const statusCounts = {};
  const trendMap = {};

  allTickets.forEach(t => {
    const createdAt = safeParseDate(t.createdAt) || safeParseDate(t.updatedAt) || new Date();
    if (startDate && createdAt < startDate) return;

    totalTickets++;
    if (t.isCritical) criticalTicketsCount++;

    const statusNum = Number(t.status) || 1;
    statusCounts[statusNum] = (statusCounts[statusNum] || 0) + 1;

    if (statusNum === TICKET_STATUS.CLOSED || t.status === 'closed') {
      closedTicketsCount++;
      const closedAt = safeParseDate(t.closedAt);
      const startRef = safeParseDate(t.startedAt) || createdAt;
      if (closedAt && startRef) {
        const diffMins = (closedAt - startRef) / (1000 * 60);
        if (diffMins > 0) {
          totalRepairTimeMinutes += diffMins;
          repairedWithTimeCount++;
        }
      }
    }

    const machineObj = machinesList.find(m => m.id === t.machineId);
    const mName = machineObj?.name || t.machineName || 'Nieznana maszyna';
    machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;

    const dateKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(createdAt.getDate()).padStart(2, '0')}`;
    trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
  });

  const avgRepairMinutes =
    repairedWithTimeCount > 0 ? Math.round(totalRepairTimeMinutes / repairedWithTimeCount) : 0;

  const topMachines = Object.entries(machineFaultCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const trendData = Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    totalTickets,
    closedTicketsCount,
    criticalTicketsCount,
    avgRepairMinutes,
    topMachines,
    statusCounts,
    trendData,
    rawTotalAllTime: allTickets.length,
  };
};

/**
 * Oblicza wskaźniki KPI serwisów planowanych bezpośrednio z kolekcji Firestore dzierżawcy
 * (uwzględnia zarówno aktywne serwisy, archiwalne, jak i wpisy wykonania w historii cykli).
 */
export const computeClientPlannedKPIStats = async (
  period = 'all',
  machinesList = [],
  plannedWarningDays = 7
) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;

  const snap = await getDocs(collection(db, 'tenants', tenantId, 'planned_services'));
  const allServices = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.isDeleted !== true);

  const now = new Date();
  let startDate = null;
  if (period && period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  let totalServicesCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let onTimeCount = 0;
  let totalDelayDays = 0;

  const machineServiceCounts = {};
  const typeCounts = { calendar: 0, hours: 0, mixed: 0 };
  const trendMap = {};

  allServices.forEach(s => {
    const machineObj = machinesList.find(m => m.id === s.machineId);
    const mName = machineObj?.name || s.machineName || 'Nieznana maszyna';
    const isCompletedDoc = s.status === 'completed' || Number(s.status) === 5;

    // 1. Zliczanie historycznych wykonań zapisanych w tablicy s.history (dla serwisów cyklicznych)
    const historyEntries = Array.isArray(s.history) ? s.history : [];
    const completionEntries = historyEntries.filter(
      h =>
        h &&
        typeof h.action === 'string' &&
        (h.action.includes('Zakończono') ||
          h.action.includes('rozliczono') ||
          h.action.includes('Wykonano serwis'))
    );

    if (!isCompletedDoc && completionEntries.length > 0) {
      completionEntries.forEach(entry => {
        const entryDate = safeParseDate(entry.date);
        if (!entryDate) return;
        if (startDate && entryDate < startDate) return;

        completedCount++;
        onTimeCount++;
        const dateKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(entryDate.getDate()).padStart(2, '0')}`;
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      });
    }

    // 2. Zliczanie samego dokumentu serwisu
    const refDate =
      safeParseDate(s.completedAt) ||
      safeParseDate(s.createdAt) ||
      safeParseDate(s.updatedAt) ||
      safeParseDate(s.nextDate);

    // Aktywne serwisy zawsze wchodzą do puli zaplanowanych; zamknięte filtrujemy wg okresu
    if (isCompletedDoc && startDate && refDate && refDate < startDate) {
      return;
    }

    totalServicesCount++;
    machineServiceCounts[mName] = (machineServiceCounts[mName] || 0) + 1;

    const tType = s.triggerType || 'calendar';
    typeCounts[tType] = (typeCounts[tType] || 0) + 1;

    if (isCompletedDoc) {
      completedCount++;
      let delayed = false;
      const expected = safeParseDate(s.nextDate);
      const actual = safeParseDate(s.completedAt) || refDate;
      if (expected && actual && actual > expected) {
        delayed = true;
        const diffDays = (actual - expected) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) totalDelayDays += diffDays;
      }
      if (delayed) {
        overdueCount++;
      } else {
        onTimeCount++;
      }

      if (actual) {
        const dateKey = `${actual.getFullYear()}-${String(actual.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(actual.getDate()).padStart(2, '0')}`;
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }
    } else {
      // Aktywny serwis — sprawdź czy jest po terminie
      const { isOverdue } = checkServiceUrgency(s, machineObj, plannedWarningDays);
      if (isOverdue) {
        overdueCount++;
      }
      // Dodaj datę do wykresu trendu jeśli brak jeszcze wpisów wykonania
      const schedDate = safeParseDate(s.nextDate) || refDate;
      if (schedDate && completionEntries.length === 0) {
        const dateKey = `${schedDate.getFullYear()}-${String(schedDate.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(schedDate.getDate()).padStart(2, '0')}`;
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }
    }
  });

  const avgDelayDays = overdueCount > 0 ? (totalDelayDays / overdueCount).toFixed(1) : 0;
  const onTimePercentage =
    completedCount > 0
      ? Math.round((onTimeCount / completedCount) * 100)
      : totalServicesCount > 0
      ? Math.round(((totalServicesCount - overdueCount) / totalServicesCount) * 100)
      : 100;

  const topMachines = Object.entries(machineServiceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const trendData = Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    totalServicesCount,
    completedCount,
    overdueCount,
    onTimeCount,
    avgDelayDays,
    onTimePercentage,
    topMachines,
    typeCounts,
    trendData,
    rawTotalAllTime: allServices.length,
  };
};
