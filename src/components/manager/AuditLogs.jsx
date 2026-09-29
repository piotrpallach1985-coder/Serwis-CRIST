import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { safeParseDate } from '../../utils/dateHelpers';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'tenants', getCurrentTenant(), 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Błąd pobierania logów:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <i className="ph ph-scroll text-blue-600 text-3xl"></i>
            Dziennik Zdarzeń (Audit Trail)
          </h1>
          <p className="text-slate-500 mt-1">Śledzenie ostatnich 100 operacji w systemie (wymóg ISO).</p>
        </div>
        <button onClick={fetchLogs} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
          <i className="ph ph-arrows-clockwise"></i> Odśwież
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingState message="Ładowanie dziennika zdarzeń..." />
        ) : logs.length === 0 ? (
          <EmptyState title="Dziennik pusty" message="Brak zarejestrowanych zdarzeń w systemie." icon="ph-scroll" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold">Użytkownik</th>
                  <th className="p-4 font-bold">Akcja</th>
                  <th className="p-4 font-bold">Moduł</th>
                  <th className="p-4 font-bold">Szczegóły</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => {
                  const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
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
                      <td className="p-4 text-sm font-medium text-slate-700">
                        {log.entityType}
                      </td>
                      <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
