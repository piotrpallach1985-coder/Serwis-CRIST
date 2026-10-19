import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';
import { exportToExcel } from '../../utils/reports/excelExport';
import { normalizeAuditLogDetails } from '../../services/audit.service';
import { useManagerStore } from '../../store/managerStore';

const MODULE_LABELS = {
  TICKET: 'Awarie',
  PLANNED_SERVICE: 'Serwisy Planowane',
  MACHINE: 'Maszyny',
  PART: 'Magazyn Części',
  ACTION_ITEM: 'Tematy do realizacji',
  USER: 'Użytkownicy',
  ROLE: 'Role i Uprawnienia',
  REGION: 'Rejony / Mapy'
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const machines = useManagerStore(state => state.machines);
  const tickets = useManagerStore(state => state.tickets);
  const plannedServices = useManagerStore(state => state.plannedServices);
  const actionItems = useManagerStore(state => state.actionItems);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs(false);
  }, []);

  const fetchLogs = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setHasMore(true);
    }

    try {
      let conditions = [];
      if (dateFrom) {
        conditions.push(where('timestamp', '>=', new Date(dateFrom + 'T00:00:00')));
      }
      if (dateTo) {
        conditions.push(where('timestamp', '<=', new Date(dateTo + 'T23:59:59')));
      }

      let q;
      if (isLoadMore && lastVisible) {
        q = query(
          collection(db, 'tenants', getCurrentTenant(), 'audit_logs'),
          ...conditions,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(100)
        );
      } else {
        q = query(
          collection(db, 'tenants', getCurrentTenant(), 'audit_logs'),
          ...conditions,
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snap = await getDocs(q);
      const newLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (isLoadMore) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      setLastVisible(snap.docs[snap.docs.length - 1]);
      if (newLogs.length < 100) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Błąd pobierania logów:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const storeSnapshot = { machines, tickets, plannedServices, actionItems };

  const handleExport = () => {
    const dataForExport = logs.map(log => {
      const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
      return {
        'Data i czas': date.toLocaleString('pl-PL'),
        'Użytkownik': log.userName,
        'Akcja': log.action,
        'Moduł': MODULE_LABELS[log.entityType] || log.entityType,
        'Szczegóły': normalizeAuditLogDetails(log, storeSnapshot),
        'ID Obiektu': log.entityId || ''
      };
    });
    exportToExcel(dataForExport, 'Dziennik_Zdarzen_Audit_Trail', 'Zdarzenia');
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(false);
  };

  const executeClear = () => {
    setDateFrom('');
    setDateTo('');
    setTimeout(() => fetchLogs(false), 50);
  };

  return (
    <div className="p-6 max-w-full mx-auto 2xl:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <i className="ph ph-scroll text-blue-600 text-3xl"></i> {t("dashboards.audit.title")}
          </h1>
          <p className="text-slate-500 mt-1">Śledzenie operacji w systemie (wymóg ISO 55000).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchLogs(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
            <i className="ph ph-arrows-clockwise"></i> Odśwież
          </button>
          <button onClick={handleExport} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium shadow-sm">
            <i className="ph ph-file-xls"></i> Eksportuj Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data od</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data do</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-bold text-sm">
              {t("dashboards.audit.filter_btn")}
            </button>
            {(dateFrom || dateTo) && (
              <button type="button" onClick={executeClear} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-sm">
                Wyczyść
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingState message={t("dashboards.audit.loading")} />
        ) : logs.length === 0 ? (
          <EmptyState title={t("dashboards.audit.empty_title")} message={t("dashboards.audit.empty_msg")} icon="ph-scroll" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Data</th>
                    <th className="p-4 font-bold">Użytkownik</th>
                    <th className="p-4 font-bold">{t("dashboards.audit.col_action")}</th>
                    <th className="p-4 font-bold">Moduł</th>
                    <th className="p-4 font-bold">Szczegóły</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => {
                    const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
                    const formattedDetails = normalizeAuditLogDetails(log, storeSnapshot);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                          {date.toLocaleString('pl-PL')}
                        </td>
                        <td className="p-4 text-sm text-slate-600 font-semibold flex items-center gap-2">
                          <i className="ph ph-user-circle text-lg text-slate-400"></i>
                          {log.userName}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                          {MODULE_LABELS[log.entityType] || log.entityType}
                        </td>
                        <td className="p-4 text-xs text-slate-600 max-w-[800px] whitespace-normal break-words leading-relaxed">
                          {formattedDetails}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
                <button 
                  onClick={() => fetchLogs(true)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loadingMore ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-caret-down"></i>}
                  {loadingMore ? 'Ładowanie...' : 'Pokaż starsze zdarzenia'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
