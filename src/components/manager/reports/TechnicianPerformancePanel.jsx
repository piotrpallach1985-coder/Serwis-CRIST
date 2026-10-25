import React, { useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { useManagerStore } from '../../../store/managerStore';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import { safeParseDate } from '../../../utils/dateHelpers';
import {
  calculateWorkAndTravelMetrics,
  filterTasksForFieldTechnician,
} from '../../../utils/fieldServiceHelpers';

export default function TechnicianPerformancePanel({
  tickets: propTickets = null,
  plannedServices: propPlannedServices = null,
  machines: propMachines = null,
  regions: propRegions = null,
  services: propServices = null,
}) {
  const { user } = useAuth();
  const { onlyAssignedTasks } = usePermissions();

  const storeTickets = useManagerStore(state => state.tickets || []);
  const storePlannedServices = useManagerStore(state => state.plannedServices || []);
  const storeMachines = useManagerStore(state => state.machines || []);
  const storeRegions = useManagerStore(state => state.regions || []);
  const storeServices = useManagerStore(state => state.services || []);

  const [fetchedArchiveTickets, setFetchedArchiveTickets] = useState(null);
  const [fetchedArchivePlanned, setFetchedArchivePlanned] = useState(null);
  const [loadingArchive, setLoadingArchive] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const rawTickets = fetchedArchiveTickets || propTickets || storeTickets;
  const rawPlanned = fetchedArchivePlanned || propPlannedServices || storePlannedServices;

  const effectiveTickets = useMemo(
    () => filterTasksForFieldTechnician(rawTickets, user, onlyAssignedTasks),
    [rawTickets, user, onlyAssignedTasks]
  );
  const effectivePlanned = useMemo(
    () => filterTasksForFieldTechnician(rawPlanned, user, onlyAssignedTasks),
    [rawPlanned, user, onlyAssignedTasks]
  );
  const effectiveMachines = propMachines || storeMachines;
  const effectiveRegions = propRegions || storeRegions;
  const effectiveServices = propServices || storeServices;

  const handleLoadFullHistory = async () => {
    setLoadingArchive(true);
    try {
      const tenantId = getCurrentTenant();
      const [tSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'tenants', tenantId, 'tickets')),
        getDocs(collection(db, 'tenants', tenantId, 'planned_services')),
      ]);
      setFetchedArchiveTickets(
        tSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.isDeleted)
      );
      setFetchedArchivePlanned(
        pSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.isDeleted)
      );
    } catch (err) {
      console.error('Błąd pobierania pełnego archiwum do zestawienia serwisantów:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const machineMap = useMemo(() => {
    const map = new Map();
    (effectiveMachines || []).forEach(m => {
      if (m?.id) map.set(m.id, m);
    });
    return map;
  }, [effectiveMachines]);

  const regionMap = useMemo(() => {
    const map = new Map();
    (effectiveRegions || []).forEach(r => {
      if (r?.id) map.set(r.id, r);
    });
    return map;
  }, [effectiveRegions]);

  const resolveRegionInfo = (task, machineObj) => {
    let rawRegionId = task?.regionId || machineObj?.regionId || '';
    let rawRegionName = task?.regionName || machineObj?.regionName || '';

    // Dziedziczenie rejonu (budynku) z maszyny nadrzędnej (parentId), jeśli urządzenie podrzędne nie ma własnego regionId
    if (!rawRegionId && machineObj?.parentId) {
      const visited = new Set([machineObj.id]);
      let parentM = machineMap.get(machineObj.parentId);
      while (parentM && !visited.has(parentM.id)) {
        visited.add(parentM.id);
        if (parentM.regionId) {
          rawRegionId = parentM.regionId;
          if (!rawRegionName && parentM.regionName) rawRegionName = parentM.regionName;
          break;
        }
        if (!rawRegionName && parentM.regionName) {
          rawRegionName = parentM.regionName;
        }
        parentM = parentM.parentId ? machineMap.get(parentM.parentId) : null;
      }
    }

    const regObj = rawRegionId ? regionMap.get(rawRegionId) : null;
    if (regObj) {
      return { regionId: regObj.id, regionName: regObj.name };
    }
    if (rawRegionId === 'main_map') {
      return { regionId: 'main_map', regionName: 'Mapa Główna' };
    }
    const fallbackName = rawRegionName.trim();
    if (fallbackName) {
      const byName = (effectiveRegions || []).find(r => r.name === fallbackName);
      return {
        regionId: byName?.id || `name_${fallbackName}`,
        regionName: fallbackName,
      };
    }
    return {
      regionId: 'unassigned',
      regionName: 'Nieprzypisany budynek / rejon',
    };
  };

  const allNormalizedTasks = useMemo(() => {
    const items = [];

    (effectiveTickets || []).forEach(ticket => {
      if (!ticket || ticket.isDeleted) return;
      const machineObj = machineMap.get(ticket.machineId) || null;
      const metrics = calculateWorkAndTravelMetrics(
        ticket,
        machineObj,
        effectiveRegions,
        effectiveMachines
      );
      const technician =
        (
          ticket.assignedTo ||
          ticket.assignedService ||
          ticket.completedBy ||
          'Nieprzypisany'
        ).trim() || 'Nieprzypisany';

      const { regionId, regionName } = resolveRegionInfo(ticket, machineObj);

      const refDate = safeParseDate(
        ticket.closedAt ||
          ticket.workStartedAt ||
          ticket.inProgressAt ||
          ticket.travelStartedAt ||
          ticket.createdAt
      );
      const monthKey = refDate
        ? `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
        : '';

      const gpsVerification =
        metrics.endGpsVerification.status !== 'no_worker_gps'
          ? metrics.endGpsVerification
          : metrics.startGpsVerification;

      const hasAlert = Boolean(
        metrics.isTimeInflated ||
          metrics.isSuspiciouslyShort ||
          gpsVerification.status === 'off_site'
      );

      items.push({
        id: `ticket_${ticket.id}`,
        rawId: ticket.id,
        taskType: 'ticket',
        typeLabel: 'Awaria',
        title: ticket.topic || 'Zgłoszenie awarii',
        machineName: machineObj?.name || ticket.machineName || 'Nieznane urządzenie',
        regionId,
        regionName,
        technician,
        refDate,
        monthKey,
        statusLabel:
          Number(ticket.status) === 5 || ticket.status === 'closed'
            ? 'Zakończona'
            : Number(ticket.status) === 4
            ? 'W trakcie'
            : 'Oczekująca',
        metrics,
        gpsVerification,
        hasAlert,
      });
    });

    (effectivePlanned || []).forEach(srv => {
      if (!srv || srv.isDeleted) return;
      const isExecutedOrStarted =
        srv.status === 'completed' ||
        srv.status === 'in_progress' ||
        Boolean(
          srv.travelStartedAt ||
            srv.workStartedAt ||
            srv.manHours != null ||
            srv.completionDetails?.manHours != null ||
            srv.completedGps ||
            srv.completionDetails?.completedGps
        );
      if (!isExecutedOrStarted) return;

      const machineObj = machineMap.get(srv.machineId) || null;
      const metrics = calculateWorkAndTravelMetrics(
        srv,
        machineObj,
        effectiveRegions,
        effectiveMachines
      );
      const technician =
        (
          srv.assignedService ||
          srv.assignedTo ||
          srv.completedBy ||
          srv.completionDetails?.completedBy ||
          'Nieprzypisany'
        ).trim() || 'Nieprzypisany';

      const { regionId, regionName } = resolveRegionInfo(srv, machineObj);

      const refDate = safeParseDate(
        srv.completedAt ||
          srv.completionDetails?.completedAt ||
          srv.workStartedAt ||
          srv.inProgressAt ||
          srv.travelStartedAt ||
          srv.createdAt
      );
      const monthKey = refDate
        ? `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
        : '';

      const gpsVerification =
        metrics.endGpsVerification.status !== 'no_worker_gps'
          ? metrics.endGpsVerification
          : metrics.startGpsVerification;

      const hasAlert = Boolean(
        metrics.isTimeInflated ||
          metrics.isSuspiciouslyShort ||
          gpsVerification.status === 'off_site'
      );

      items.push({
        id: `srv_${srv.id}`,
        rawId: srv.id,
        taskType: 'planned_service',
        typeLabel: 'Serwis planowany',
        title: srv.name || 'Przegląd okresowy',
        machineName: machineObj?.name || srv.machineName || 'Nieznane urządzenie',
        regionId,
        regionName,
        technician,
        refDate,
        monthKey,
        statusLabel: srv.status === 'completed' ? 'Zakończony' : 'W trakcie',
        metrics,
        gpsVerification,
        hasAlert,
      });
    });

    return items.sort((a, b) => (b.refDate?.getTime() || 0) - (a.refDate?.getTime() || 0));
  }, [effectiveTickets, effectivePlanned, machineMap, regionMap, effectiveRegions, effectiveMachines]);

  const availableMonths = useMemo(() => {
    const set = new Set();
    allNormalizedTasks.forEach(item => {
      if (item.monthKey) set.add(item.monthKey);
    });
    return Array.from(set).sort().reverse();
  }, [allNormalizedTasks]);

  const availableTechnicians = useMemo(() => {
    const set = new Set();
    (effectiveServices || []).forEach(s => {
      if (s?.name) set.add(s.name.trim());
    });
    allNormalizedTasks.forEach(item => {
      if (item.technician) set.add(item.technician);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [effectiveServices, allNormalizedTasks]);

  const availableRegions = useMemo(() => {
    const map = new Map();
    (effectiveRegions || []).forEach(r => {
      if (r?.id && r?.name) map.set(r.id, r.name);
    });
    allNormalizedTasks.forEach(item => {
      if (item.regionId && item.regionName && !map.has(item.regionId)) {
        map.set(item.regionId, item.regionName);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [effectiveRegions, allNormalizedTasks]);

  // Zbiór ID wybranego budynku/rejonu wraz ze wszystkimi jego podrejonami (klatki, kondygnacje, kotłownie)
  const selectedRegionIdsSet = useMemo(() => {
    if (selectedRegionId === 'all') return null;
    const allowed = new Set([selectedRegionId]);
    let added = true;
    while (added) {
      added = false;
      (effectiveRegions || []).forEach(r => {
        if (r?.id && r?.parentId && allowed.has(r.parentId) && !allowed.has(r.id)) {
          allowed.add(r.id);
          added = true;
        }
      });
    }
    return allowed;
  }, [selectedRegionId, effectiveRegions]);

  const filteredTasks = useMemo(() => {
    return allNormalizedTasks.filter(item => {
      if (selectedPeriod !== 'all' && item.monthKey !== selectedPeriod) return false;
      if (selectedTechnician !== 'all' && item.technician !== selectedTechnician) return false;
      if (selectedRegionIdsSet && !selectedRegionIdsSet.has(item.regionId)) return false;
      if (onlyAnomalies && !item.hasAlert) return false;
      return true;
    });
  }, [allNormalizedTasks, selectedPeriod, selectedTechnician, selectedRegionIdsSet, onlyAnomalies]);

  // TABELA 1: Ranking i weryfikacja serwisantów / konserwatorów
  const technicianRanking = useMemo(() => {
    const map = new Map();

    filteredTasks.forEach(item => {
      const key = item.technician || 'Nieprzypisany';
      if (!map.has(key)) {
        map.set(key, {
          technician: key,
          totalTasks: 0,
          ticketsCount: 0,
          servicesCount: 0,
          travelSamples: 0,
          totalTravelMinutes: 0,
          totalStopwatchHours: 0,
          multiDayCount: 0,
          totalDeclaredHours: 0,
          comparedTasksCount: 0,
          totalComparedStopwatchHours: 0,
          totalComparedDeclaredHours: 0,
          inflatedTasksCount: 0,
          suspiciousShortCount: 0,
          alertsCount: 0,
          onSiteCount: 0,
          offSiteCount: 0,
        });
      }

      const row = map.get(key);
      row.totalTasks += 1;
      if (item.taskType === 'ticket') row.ticketsCount += 1;
      else row.servicesCount += 1;

      const m = item.metrics;
      if (m.travelDurationMinutes !== null) {
        row.travelSamples += 1;
        row.totalTravelMinutes += m.travelDurationMinutes;
      }

      if (m.stopwatchWorkHours !== null) {
        if (m.isMultiDayOrPaused) {
          row.multiDayCount += 1;
        } else {
          row.totalStopwatchHours = Number(
            (row.totalStopwatchHours + m.stopwatchWorkHours).toFixed(2)
          );
        }
      }

      if (m.declaredManHours !== null) {
        row.totalDeclaredHours = Number(
          (row.totalDeclaredHours + m.declaredManHours).toFixed(2)
        );
      }

      if (
        m.stopwatchWorkHours !== null &&
        m.declaredManHours !== null &&
        !m.isMultiDayOrPaused
      ) {
        row.comparedTasksCount += 1;
        row.totalComparedStopwatchHours = Number(
          (row.totalComparedStopwatchHours + m.stopwatchWorkHours).toFixed(2)
        );
        row.totalComparedDeclaredHours = Number(
          (row.totalComparedDeclaredHours + m.declaredManHours).toFixed(2)
        );
      }

      if (m.isTimeInflated) row.inflatedTasksCount += 1;
      if (m.isSuspiciouslyShort) row.suspiciousShortCount += 1;
      if (item.hasAlert) row.alertsCount += 1;

      if (item.gpsVerification.status === 'on_site') {
        row.onSiteCount += 1;
      } else if (item.gpsVerification.status === 'off_site') {
        row.offSiteCount += 1;
      }
    });

    return Array.from(map.values())
      .map(r => {
        const avgTravelMinutes =
          r.travelSamples > 0 ? Math.round(r.totalTravelMinutes / r.travelSamples) : null;
        const totalTravelHours = Number((r.totalTravelMinutes / 60).toFixed(2));
        const discrepancyBalanceHours =
          r.comparedTasksCount > 0
            ? Number(
                (r.totalComparedDeclaredHours - r.totalComparedStopwatchHours).toFixed(2)
              )
            : null;
        const totalGpsChecked = r.onSiteCount + r.offSiteCount;
        const gpsCompliancePercent =
          totalGpsChecked > 0 ? Math.round((r.onSiteCount / totalGpsChecked) * 100) : null;
        return {
          ...r,
          avgTravelMinutes,
          totalTravelHours,
          discrepancyBalanceHours,
          gpsCompliancePercent,
        };
      })
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }, [filteredTasks]);

  // TABELA 2: Zbiorcze rozliczenie czasu pracy na budynki / wspólnoty / rejony
  const regionSettlements = useMemo(() => {
    const map = new Map();

    filteredTasks.forEach(item => {
      const key = item.regionId || 'unassigned';
      if (!map.has(key)) {
        map.set(key, {
          regionId: key,
          regionName: item.regionName || 'Nieprzypisany budynek / rejon',
          totalInterventions: 0,
          ticketsCount: 0,
          servicesCount: 0,
          totalTravelMinutes: 0,
          totalStopwatchHours: 0,
          totalDeclaredHours: 0,
          comparedCount: 0,
          comparedStopwatchHours: 0,
          comparedDeclaredHours: 0,
          onSiteCount: 0,
          offSiteCount: 0,
        });
      }

      const row = map.get(key);
      row.totalInterventions += 1;
      if (item.taskType === 'ticket') row.ticketsCount += 1;
      else row.servicesCount += 1;

      const m = item.metrics;
      if (m.travelDurationMinutes !== null) {
        row.totalTravelMinutes += m.travelDurationMinutes;
      }
      if (m.stopwatchWorkHours !== null && !m.isMultiDayOrPaused) {
        row.totalStopwatchHours = Number(
          (row.totalStopwatchHours + m.stopwatchWorkHours).toFixed(2)
        );
      }
      if (m.declaredManHours !== null) {
        row.totalDeclaredHours = Number(
          (row.totalDeclaredHours + m.declaredManHours).toFixed(2)
        );
      }
      if (
        m.stopwatchWorkHours !== null &&
        m.declaredManHours !== null &&
        !m.isMultiDayOrPaused
      ) {
        row.comparedCount += 1;
        row.comparedStopwatchHours = Number(
          (row.comparedStopwatchHours + m.stopwatchWorkHours).toFixed(2)
        );
        row.comparedDeclaredHours = Number(
          (row.comparedDeclaredHours + m.declaredManHours).toFixed(2)
        );
      }
      if (item.gpsVerification.status === 'on_site') row.onSiteCount += 1;
      else if (item.gpsVerification.status === 'off_site') row.offSiteCount += 1;
    });

    return Array.from(map.values())
      .map(r => {
        const totalTravelHours = Number((r.totalTravelMinutes / 60).toFixed(2));
        const discrepancyHours =
          r.comparedCount > 0
            ? Number((r.comparedDeclaredHours - r.comparedStopwatchHours).toFixed(2))
            : null;
        const totalGpsChecked = r.onSiteCount + r.offSiteCount;
        const gpsCompliancePercent =
          totalGpsChecked > 0 ? Math.round((r.onSiteCount / totalGpsChecked) * 100) : null;
        return {
          ...r,
          totalTravelHours,
          discrepancyHours,
          gpsCompliancePercent,
        };
      })
      .sort((a, b) => b.totalInterventions - a.totalInterventions);
  }, [filteredTasks]);

  const handleExportExcel = async () => {
    setExportingXlsx(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const summaryRows = technicianRanking.map(r => ({
        'Serwisant / Konserwator / Firma': r.technician,
        'Liczba zleceń (Łącznie)': r.totalTasks,
        'Awarie': r.ticketsCount,
        'Przeglądy / Serwisy': r.servicesCount,
        'Śr. czas dojazdu (min)': r.avgTravelMinutes !== null ? r.avgTravelMinutes : '-',
        'Łączny czas dojazdu (h)': r.totalTravelHours,
        'Czas na obiekcie wg Stopera (h)': r.totalStopwatchHours,
        'Zadeklarowane RBG (h)': r.totalDeclaredHours,
        'Bilans / Zawyżenie RBG (h)':
          r.discrepancyBalanceHours !== null ? r.discrepancyBalanceHours : '-',
        '% Zgodności GPS na obiekcie':
          r.gpsCompliancePercent !== null ? `${r.gpsCompliancePercent}%` : '-',
        'GPS Na miejscu': r.onSiteCount,
        'GPS POZA OBIEKTEM': r.offSiteCount,
        'Liczba alertów (RBG / GPS / <5 min)': r.alertsCount,
      }));

      const regionRows = regionSettlements.map(r => ({
        'Budynek / Osiedle (Rejon)': r.regionName,
        'Liczba interwencji (Łącznie)': r.totalInterventions,
        'Awarie': r.ticketsCount,
        'Przeglądy okresowe c-KOB': r.servicesCount,
        'Łączny czas dojazdów (min)': r.totalTravelMinutes,
        'Łączny czas dojazdów (h)': r.totalTravelHours,
        'Rzeczywisty czas pracy na budynku (Stoper h)': r.totalStopwatchHours,
        'Zadeklarowane RBG do rozliczenia (h)': r.totalDeclaredHours,
        'Różnica / Nadwyżka RBG (h)': r.discrepancyHours !== null ? r.discrepancyHours : '-',
        '% Weryfikacji GPS na budynku':
          r.gpsCompliancePercent !== null ? `${r.gpsCompliancePercent}%` : '-',
      }));

      const detailRows = filteredTasks.map(item => ({
        'Data': item.refDate ? item.refDate.toLocaleString('pl-PL') : '-',
        'Typ zlecenia': item.typeLabel,
        'Zadanie / Temat': item.title,
        'Budynek / Osiedle (Rejon)': item.regionName,
        'Urządzenie / Instalacja': item.machineName,
        'Serwisant / Konserwator': item.technician,
        'Status': item.statusLabel,
        'Start dojazdu': item.metrics.travelStartedAt
          ? safeParseDate(item.metrics.travelStartedAt)?.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            }) || '-'
          : '-',
        'Start pracy': item.metrics.workStartedAt
          ? safeParseDate(item.metrics.workStartedAt)?.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            }) || '-'
          : '-',
        'Koniec pracy': item.metrics.completedAt
          ? safeParseDate(item.metrics.completedAt)?.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            }) || '-'
          : '-',
        'Czas dojazdu (min)':
          item.metrics.travelDurationMinutes !== null
            ? item.metrics.travelDurationMinutes
            : '-',
        'Czas pracy Stoper (min)':
          item.metrics.stopwatchWorkMinutes !== null
            ? item.metrics.stopwatchWorkMinutes
            : '-',
        'Czas pracy Stoper (h)':
          item.metrics.stopwatchWorkHours !== null ? item.metrics.stopwatchWorkHours : '-',
        'Zadeklarowane RBG (h)':
          item.metrics.declaredManHours !== null ? item.metrics.declaredManHours : '-',
        'Odchyłka RBG vs Stoper (h)':
          item.metrics.discrepancyHours !== null ? item.metrics.discrepancyHours : '-',
        'Flaga nadwyżki RBG (>15 min)': item.metrics.isTimeInflated ? 'TAK' : 'NIE',
        'Flaga przeglądu < 5 min': item.metrics.isSuspiciouslyShort ? 'TAK' : 'NIE',
        'Weryfikacja GPS': item.gpsVerification.label,
        'Odległość od obiektu (m)':
          item.gpsVerification.distanceMeters !== null
            ? item.gpsVerification.distanceMeters
            : '-',
      }));

      const wsSummary = XLSX.utils.json_to_sheet(
        summaryRows.length > 0
          ? summaryRows
          : [{ Informacja: 'Brak danych dla wybranych filtrów' }]
      );
      const wsRegions = XLSX.utils.json_to_sheet(
        regionRows.length > 0
          ? regionRows
          : [{ Informacja: 'Brak rozliczeń budynków dla wybranych filtrów' }]
      );
      const wsDetails = XLSX.utils.json_to_sheet(
        detailRows.length > 0
          ? detailRows
          : [{ Informacja: 'Brak zleceń dla wybranych filtrów' }]
      );

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Porownanie_Serwisantow');
      XLSX.utils.book_append_sheet(wb, wsRegions, 'Rozliczenie_Budynkow');
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Szczegoly_Zlecen_GPS_RBG');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `VexoNT_Weryfikacja_Czasu_GPS_i_Budynkow_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Błąd eksportu zestawienia serwisantów do Excela:', err);
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <div
      data-testid="technician-performance-panel"
      className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-5 min-w-0"
    >
      {/* Nagłówek i przyciski akcji */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <i className="ph ph-users-three text-indigo-600 text-2xl shrink-0"></i>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Ewidencja Czasu Pracy (Stoper vs RBG), Dojazdów, Geofencing GPS i Rozliczenie Budynków
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
              Czysta matematyka • Haversine GPS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Zestawienie porównawcze serwisantów i konserwatorów nieruchomości, rozliczenie czasu na
            poszczególne budynki/wspólnoty (rejony) oraz weryfikacja obecności GPS w promieniu 300 m.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadFullHistory}
            disabled={loadingArchive}
            data-testid="load-full-tech-history-btn"
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i
              className={`ph ${
                loadingArchive ? 'ph-spinner animate-spin' : 'ph-database'
              } text-base`}
            ></i>
            <span>
              {loadingArchive ? 'Wczytywanie...' : 'Wczytaj pełne archiwum z bazy'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingXlsx}
            data-testid="export-tech-performance-xlsx-btn"
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-3.5 rounded-xl text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ph ph-file-xls text-base"></i>
            <span>
              {exportingXlsx ? 'Eksportowanie...' : 'Eksportuj zestawienie (.xlsx)'}
            </span>
          </button>
        </div>
      </div>

      {/* Pasek filtrów */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
            Okres rozliczeniowy
          </label>
          <select
            data-testid="tech-perf-period-select"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Cały dostępny okres</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                Miesiąc: {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
            Serwisant / Konserwator
          </label>
          <select
            data-testid="tech-perf-technician-select"
            value={selectedTechnician}
            onChange={e => setSelectedTechnician(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Wszyscy serwisanci / wykonawcy</option>
            {availableTechnicians.map(tech => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
            Budynek / Osiedle / Rejon
          </label>
          <select
            data-testid="tech-perf-region-select"
            value={selectedRegionId}
            onChange={e => setSelectedRegionId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Wszystkie budynki / rejony</option>
            {availableRegions.map(reg => (
              <option key={reg.id} value={reg.id}>
                {reg.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="w-full flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-lg cursor-pointer select-none font-bold text-slate-700 hover:bg-amber-50/40 transition-colors">
            <input
              type="checkbox"
              data-testid="tech-perf-anomalies-checkbox"
              checked={onlyAnomalies}
              onChange={e => setOnlyAnomalies(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
            />
            <span>Tylko z alertem (RBG / GPS / &lt;5m)</span>
          </label>
        </div>
      </div>

      {/* TABELA 1: ZBIORCZY RANKING I PORÓWNANIE SERWISANTÓW / KONSERWATORÓW */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <i className="ph ph-chart-bar text-indigo-600 text-base"></i>
          <span>1. Ranking i Weryfikacja Serwisantów / Konserwatorów (Porównanie)</span>
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table
            data-testid="tech-performance-summary-table"
            className="w-full text-left border-collapse text-xs"
          >
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Serwisant / Konserwator</th>
                <th className="py-2.5 px-3 text-center">Liczba zleceń</th>
                <th className="py-2.5 px-3 text-center">Dojazdy (Śr. / Łącznie)</th>
                <th className="py-2.5 px-3 text-center">Czas wg Stopera</th>
                <th className="py-2.5 px-3 text-center">Zadeklarowane RBG</th>
                <th className="py-2.5 px-3 text-center">Bilans / Zawyżenie RBG</th>
                <th className="py-2.5 px-3 text-center">% Zgodności GPS</th>
                <th className="py-2.5 px-3 text-center">Alerty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {technicianRanking.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Brak zleceń spełniających wybrane kryteria filtrowania.
                  </td>
                </tr>
              ) : (
                technicianRanking.map(row => {
                  const hasPositiveDiscrepancy =
                    row.discrepancyBalanceHours !== null && row.discrepancyBalanceHours > 0.25;
                  return (
                    <tr
                      key={row.technician}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        {row.technician}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-extrabold text-slate-800">{row.totalTasks}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {row.ticketsCount} aw. / {row.servicesCount} przegl.
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.avgTravelMinutes !== null ? (
                          <div>
                            <span className="font-bold text-slate-800">
                              {row.avgTravelMinutes} min
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              łącznie {row.totalTravelHours} h
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {row.totalStopwatchHours} h
                        {row.multiDayCount > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            (+{row.multiDayCount} wielodniowe)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-blue-700">
                        {row.totalDeclaredHours} h
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.discrepancyBalanceHours !== null ? (
                          <span
                            className={`inline-block font-extrabold px-2 py-0.5 rounded border text-[11px] ${
                              hasPositiveDiscrepancy
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {row.discrepancyBalanceHours > 0 ? '+' : ''}
                            {row.discrepancyBalanceHours} h
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {row.inflatedTasksCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                            ⚠️ {row.inflatedTasksCount} zlec. z nadwyżką
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.gpsCompliancePercent !== null && (
                          <div className="font-extrabold text-slate-800 mb-0.5">
                            {row.gpsCompliancePercent}% zgodności
                          </div>
                        )}
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold">
                          <span
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded"
                            title="Potwierdzono na obiekcie (≤ 300 m)"
                          >
                            ✓ {row.onSiteCount} na miejscu
                          </span>
                          {row.offSiteCount > 0 && (
                            <span
                              className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded"
                              title="Odczyt GPS powyżej 300 m od obiektu"
                            >
                              ⚠️ {row.offSiteCount} poza!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.alertsCount > 0 ? (
                          <span className="inline-block bg-red-100 text-red-800 border border-red-300 font-extrabold px-2 py-0.5 rounded-full text-[11px]">
                            🚨 {row.alertsCount}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">0 (OK)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABELA 2: ZBIORCZE ROZLICZENIE CZASU PRACY NA BUDYNKI / WSPÓLNOTY / REJONY */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <i className="ph ph-buildings text-amber-600 text-base"></i>
          <span>
            2. Zbiorcze Rozliczenie Czasu Pracy na Budynki / Wspólnoty / Rejony (
            {regionSettlements.length})
          </span>
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table
            data-testid="tech-performance-regions-table"
            className="w-full text-left border-collapse text-xs"
          >
            <thead>
              <tr className="bg-amber-50/70 text-amber-950 font-extrabold uppercase text-[10px] border-b border-amber-200">
                <th className="py-2.5 px-3">Budynek / Osiedle (Rejon)</th>
                <th className="py-2.5 px-3 text-center">Liczba interwencji</th>
                <th className="py-2.5 px-3 text-center">Łączny czas dojazdów</th>
                <th className="py-2.5 px-3 text-center">Czas pracy na budynku (Stoper)</th>
                <th className="py-2.5 px-3 text-center">Zadeklarowane RBG do rozliczenia</th>
                <th className="py-2.5 px-3 text-center">Różnica (Nadwyżka RBG)</th>
                <th className="py-2.5 px-3 text-center">% Weryfikacji GPS na budynku</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regionSettlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-5 text-center text-slate-400 italic">
                    Brak danych rozliczeniowych dla budynków/rejonów.
                  </td>
                </tr>
              ) : (
                regionSettlements.map(reg => (
                  <tr key={reg.regionId} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">
                      <i className="ph ph-map-pin text-amber-600 mr-1"></i>
                      {reg.regionName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-extrabold text-slate-800">
                        {reg.totalInterventions}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {reg.ticketsCount} aw. / {reg.servicesCount} przegl. c-KOB
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {reg.totalTravelMinutes > 0
                        ? `${reg.totalTravelMinutes} min (${reg.totalTravelHours} h)`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {reg.totalStopwatchHours} h
                    </td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-blue-700">
                      {reg.totalDeclaredHours} h
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {reg.discrepancyHours !== null ? (
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded border text-[11px] ${
                            reg.discrepancyHours > 0.25
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {reg.discrepancyHours > 0 ? '+' : ''}
                          {reg.discrepancyHours} h
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {reg.gpsCompliancePercent !== null ? (
                        <span
                          className={
                            reg.gpsCompliancePercent >= 80
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }
                        >
                          {reg.gpsCompliancePercent}% ({reg.onSiteCount}/
                          {reg.onSiteCount + reg.offSiteCount})
                        </span>
                      ) : (
                        <span className="text-slate-400">Brak odczytów GPS</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABELA 3: SZCZEGÓŁOWY DZIENNIK WYJAZDÓW I WERYFIKACJI ZLECEŃ */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <i className="ph ph-list-magnifying-glass text-indigo-600 text-base"></i>
          <span>
            3. Szczegółowy Dziennik Wyjazdów i Weryfikacji Zleceń ({filteredTasks.length})
          </span>
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
          <table
            data-testid="tech-performance-details-table"
            className="w-full text-left border-collapse text-xs"
          >
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Data / Godziny</th>
                <th className="py-2.5 px-3">Zlecenie / Budynek / Urządzenie</th>
                <th className="py-2.5 px-3">Serwisant / Konserwator</th>
                <th className="py-2.5 px-3 text-center">Dojazd</th>
                <th className="py-2.5 px-3 text-center">Stoper (Praca)</th>
                <th className="py-2.5 px-3 text-center">Zadeklarowane RBG</th>
                <th className="py-2.5 px-3 text-center">Odchyłka RBG</th>
                <th className="py-2.5 px-3">Geofencing GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Brak zleceń do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredTasks.slice(0, 100).map(item => {
                  const m = item.metrics;
                  const gpsVer = item.gpsVerification;
                  const gpsBadgeClass =
                    gpsVer.status === 'on_site'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : gpsVer.status === 'off_site'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200';

                  const startWorkTimeStr = m.workStartedAt
                    ? safeParseDate(m.workStartedAt)?.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;
                  const endWorkTimeStr = m.completedAt
                    ? safeParseDate(m.completedAt)?.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div>{item.refDate ? item.refDate.toLocaleDateString('pl-PL') : '-'}</div>
                        {(startWorkTimeStr || endWorkTimeStr) && (
                          <div className="text-[10px] text-slate-400">
                            {startWorkTimeStr || '?'} → {endWorkTimeStr || '?'}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-800">{item.title}</div>
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-indigo-700">{item.typeLabel}</span> ·{' '}
                          <span className="font-semibold text-amber-800">{item.regionName}</span> ·{' '}
                          {item.machineName}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">{item.technician}</td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-700">
                        {m.travelDurationMinutes !== null ? `${m.travelDurationMinutes} min` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-700">
                        <div>
                          {m.stopwatchWorkMinutes !== null
                            ? `${m.stopwatchWorkMinutes} min (${m.stopwatchWorkHours} h)`
                            : '-'}
                        </div>
                        {m.isSuspiciouslyShort && (
                          <span
                            data-testid="tech-detail-suspiciously-short-badge"
                            className="inline-block mt-0.5 bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold"
                          >
                            🚨 Przegląd &lt; 5 min!
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700">
                        {m.declaredManHours !== null ? `${m.declaredManHours} h` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {m.discrepancyHours !== null ? (
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded border text-[11px] ${
                              m.isTimeInflated
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {m.isTimeInflated ? '⚠️ ' : ''}
                            {m.discrepancyHours > 0 ? '+' : ''}
                            {m.discrepancyHours} h
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded border text-[11px] ${gpsBadgeClass}`}
                        >
                          {gpsVer.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
