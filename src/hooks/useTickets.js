import { useState, useEffect, useMemo } from 'react';
import { exportToExcel } from '../utils/reports/excelExport';
import { collection, query, where, orderBy, limit, getDocs, startAfter, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { safeParseDate } from '../utils/dateHelpers';
import { TICKET_STATUS, TICKET_STATUS_LABELS } from '../utils/constants';

const DEFAULT_COLS = {
  date: true,
  region: true,
  machine: true,
  bay: true,
  topic: true,
  reporter: true,
  status: true,
  service: true,
  duration: true,
};

/**
 * useTickets — hook zarządzający listą zgłoszeń awarii, filtrowaniem, widocznością kolumn i archiwum.
 * 
 * @param {Object} params Parametry wejściowe hooka
 * @param {Array<Object>} [params.tickets=[]] Lista aktywnych zgłoszeń pobranych w czasie rzeczywistym
 * @param {Array<Object>} [params.machines=[]] Baza urządzeń (do uzupełniania nazw maszyn)
 * @param {Array<Object>} [params.regions=[]] Baza rejonów/lokalizacji
 * @param {boolean} [params.isArchive=false] Czy widok dotyczy wyłącznie zamkniętych zgłoszeń z archiwum
 * @param {string} [params.initialSearchQuery=''] Wstępna fraza wyszukiwania (np. przekazana z mapy)
 * @returns {Object} Stan i akcje obsługi zgłoszeń
 */
export function useTickets({ tickets = [], machines = [], regions = [], isArchive = false, initialSearchQuery = '' }) {
  const [internalArchive, setInternalArchive] = useState([]);
  const [lastArchiveDoc, setLastArchiveDoc] = useState(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);

  const [filterMachine, setFilterMachine] = useState(initialSearchQuery || '');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('ticket_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLS;
    } catch {
      return DEFAULT_COLS;
    }
  });

  useEffect(() => {
    if (isArchive) {
      fetchArchive(false);
    }
  }, [isArchive]);

  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== '') {
      setFilterMachine(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const toggleColumn = (key) => {
    setVisibleCols(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ticket_columns', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchArchive = async (loadMore = false) => {
    if (loadingArchive || (!hasMoreArchive && loadMore)) return;
    setLoadingArchive(true);
    try {
      let q = query(
        collection(db, 'tickets'),
        where('status', '==', TICKET_STATUS.CLOSED),
        orderBy('closedAt', 'desc'),
        limit(50)
      );
      if (loadMore && lastArchiveDoc) {
        q = query(
          collection(db, 'tickets'),
          where('status', '==', TICKET_STATUS.CLOSED),
          orderBy('closedAt', 'desc'),
          startAfter(lastArchiveDoc),
          limit(50)
        );
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const newTickets = docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted);
      
      if (loadMore) {
        setInternalArchive(prev => {
          const combined = [...prev, ...newTickets];
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
      } else {
        setInternalArchive(newTickets);
      }
      
      setLastArchiveDoc(docs[docs.length - 1] || null);
      setHasMoreArchive(docs.length === 50);
    } catch (err) {
      console.error("Błąd pobierania archiwum:", err);
    }
    setLoadingArchive(false);
  };

  const activeTicketsArray = isArchive ? internalArchive : tickets;

  const filteredTickets = useMemo(() => {
    return activeTicketsArray
      .filter(t => !t.isDeleted)
      .filter(t => {
        if (!filterMachine) return true;
        const q = filterMachine.toLowerCase().trim();
        if (!q) return true;

        const mach = (t.machineName || '').toLowerCase();
        const top = (t.topic || '').toLowerCase();
        const rep = (t.reportedBy || '').toLowerCase();
        const reg = (t.regionName || '').toLowerCase();

        // Znajdź maszynę w bazie danych po ID lub po nazwie (w tym z/bez dopisku DO WERYFIKACJI)
        const machObj = (machines || []).find(m => {
          if (m.id === t.machineId) return true;
          if (!m.name) return false;
          const cleanM = m.name.toLowerCase().replace(/\s*\(do weryfikacji\)/gi, '').trim();
          const cleanT = mach.replace(/\s*\(do weryfikacji\)/gi, '').trim();
          return m.name.toLowerCase() === mach || (cleanM && cleanM === cleanT);
        });
        const machName = machObj ? machObj.name.toLowerCase() : '';

        // Znajdź rejon maszyny lub zgłoszenia
        const regId = t.regionId || machObj?.regionId;
        const regObj = regId ? (regions || []).find(r => r.id === regId || r.name.toLowerCase() === regId.toLowerCase()) : null;
        const regName = regObj ? regObj.name.toLowerCase() : '';

        // Specjalna obsługa filtrów "Bez rejonu" oraz "Bez pineski" z mapy
        if (q === 'bez rejonu') {
          return !regId && !regObj && (!reg || reg === 'bez rejonu' || reg === '-');
        }
        if (q === 'bez pineski') {
          return !machObj || machObj.xPercent == null || machObj.yPercent == null;
        }

        // Sprawdzenie powiązania z rejonem
        const isRegionMatch = reg && (reg.includes(q) || q.includes(reg));
        const isRegObjMatch = regName && (regName.includes(q) || q.includes(regName));

        // Sprawdzenie powiązania z maszyną
        const isMachMatch = mach && (mach.includes(q) || q.includes(mach));
        const isMachObjMatch = machName && (machName.includes(q) || q.includes(machName));

        // Sprawdzenie powiązania z tematem lub zgłaszającym
        const isTopicMatch = top && (top.includes(q) || q.includes(top));
        const isRepMatch = rep && (rep.includes(q) || q.includes(rep));

        return isRegionMatch || isRegObjMatch || isMachMatch || isMachObjMatch || isTopicMatch || isRepMatch;
      })
      .filter(t => filterStatus === '' || t.status === Number(filterStatus))
      .sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [activeTicketsArray, filterMachine, filterStatus, machines, regions]);

  const handleExportExcel = () => {
    const dataToExport = filteredTickets.map(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      return {
        'ID Zgłoszenia': t.id,
        'Data Zgłoszenia': openD ? openD.toLocaleString('pl-PL') : '-',
        'Data Zamknięcia': closeD ? closeD.toLocaleString('pl-PL') : '-',
        'Maszyna': (machines && machines.find(m => m.id === t.machineId)?.name) || ((t.machineName || '-') + ' (maszyna usunięta)'),
        'Temat Zgłoszenia': t.topic || '-',
        'Opis Problemu': t.description || '-',
        'Zgłaszający': t.reportedBy || '-',
        'Status': TICKET_STATUS_LABELS[t.status] || 'Nieznany'
      };
    });
    exportToExcel(dataToExport, isArchive ? 'Archiwum_Awarii' : 'Zgloszenia_Awarii');
  };

  return {
    filterMachine, setFilterMachine,
    filterStatus, setFilterStatus,
    visibleCols, toggleColumn,
    filteredTickets,
    activeTickets: activeTicketsArray,
    loadingArchive, hasMoreArchive, fetchArchive,
    handleExportExcel
  };
}
