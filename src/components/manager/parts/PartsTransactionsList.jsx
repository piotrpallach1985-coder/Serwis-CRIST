import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo, useEffect } from 'react';
import { useManagerStore } from '../../../store/managerStore';
import { useNavigate } from 'react-router-dom';
import { safeParseDate } from '../../../utils/dateHelpers';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import PartsIssueReceive from './PartsIssueReceive';
import { fixLegacyTransactions } from '../../../services/parts.service';
import { usePartTransactions } from '../../../hooks/usePartTransactions';

export default function PartsTransactionsList({ onManualIssue }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const parts = useManagerStore((state) => state.parts || []);
  const { transactions: partTransactions, loading, hasMore, fetchTransactions } = usePartTransactions();
  const machines = useManagerStore((state) => state.machines || []);
  const tickets = useManagerStore(state => state.tickets || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  

  useEffect(() => {
    // FIX LEGACY TRANSACTIONS - jednorazowe sprawdzenie i naprawa transakcji bez machineId
    const fixLegacy = async () => {
      const tenantId = getCurrentTenant();
      if (!tenantId) return;
      
      await fixLegacyTransactions(tenantId, partTransactions);
    };
    fixLegacy();
  }, [partTransactions]);

  
  const getMachineName = (tx) => {
    if (tx.machineId) {
      const m = machines.find(mac => mac.id === tx.machineId);
      if (m) return m.name;
    }
    if (tx.referenceId) {
      if (tx.type === "issue_adhoc" || tx.type === "issue") {
        const t = tickets.find(tic => tic.id === tx.referenceId);
        if (t && t.machineId) {
          const m = machines.find(mac => mac.id === t.machineId);
          if (m) return m.name;
        }
      } else if (tx.type === 'issue_planned') {
        const s = plannedServices.find(srv => srv.id === tx.referenceId);
        if (s && s.machineId) {
          const m = machines.find(mac => mac.id === s.machineId);
          if (m) return m.name;
        }
      }
    }
    return tx.machineName || '';
  };

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const itemsPerPage = 30;

  const filteredTransactions = useMemo(() => {
    return partTransactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all') {
          if (typeFilter === 'remanent') {
            if (tx.type !== 'issue_adhoc' && tx.type !== 'issue') return false;
            if (tx.referenceId || tx.machineId || tx.machineName) return false;
          } else if (typeFilter === 'issue_adhoc') {
            if (tx.type !== 'issue_adhoc' && tx.type !== 'issue') return false;
            if (!tx.referenceId && !tx.machineId && !tx.machineName) return false;
          } else if (tx.type !== typeFilter) {
            return false;
          }
        }
        
        // Date filter
        const txDate = safeParseDate(tx.date);
        if (dateFrom && txDate) {
          const from = new Date(dateFrom);
          if (txDate < from) return false;
        }
        if (dateTo && txDate) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (txDate > to) return false;
        }

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const part = parts.find((p) => p.id === tx.partId);
          const partName = part?.name?.toLowerCase() || '';
          const machineName = getMachineName(tx).toLowerCase();
          const userName = tx.user?.toLowerCase() || '';
          
          if (!partName.includes(q) && !machineName.includes(q) && !userName.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = safeParseDate(a.date);
        const dateB = safeParseDate(b.date);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });
  }, [partTransactions, typeFilter, dateFrom, dateTo, search, parts, machines]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentData = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTypeName = (tx) => {
    if (tx.type === 'receive') return t('parts.transactions.types.receive');
    if (tx.type === 'return') return t('parts.transactions.types.return');
    if (tx.type === 'issue_planned') return t('parts.transactions.types.issue_planned');
    if (tx.type === 'issue_adhoc' || tx.type === 'issue') return t('parts.transactions.types.issue_adhoc');
    return tx.type;
  };

  const getTypeStyle = (type) => {
    if (type === 'receive' || type === 'return') {
      return 'text-green-600 bg-green-50';
    }
    return 'text-red-600 bg-red-50';
  };

  const getQtyStyle = (type) => {
    if (type === 'receive' || type === 'return') {
      return 'text-green-600 font-semibold';
    }
    return 'text-red-600 font-semibold';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="ph ph-list-numbers text-blue-500"></i> {t('parts.tx_list.title')} </h2>
        </div>
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <i className="ph ph-hand-coins"></i> {t('parts.tx_list.add_tx')} </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 border-b border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('parts.tx_list.type_label')}</label>
          <select 
            value={typeFilter} 
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('parts.tx_list.all')}</option>
            <option value="receive">{t('parts.transactions.types.receive')}</option>
            <option value="issue_planned">{t('parts.transactions.types.issue_planned')}</option>
            <option value="issue_adhoc">{t('parts.transactions.types.issue_adhoc')}</option>
            <option value="remanent">{t('parts.tx_list.remanent')}</option>
            <option value="return">{t('parts.transactions.types.return')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('parts.tx_list.search_label')}</label>
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-3 top-2.5 text-gray-400"></i>
            <input 
              type="text" 
              placeholder={t('parts.tx_list.search_placeholder')} 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border-gray-300 border p-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('parts.tx_list.date_from')}</label>
          <input 
            type="date" 
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('parts.tx_list.date_to')}</label>
          <input 
            type="date" 
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="w-full flex-1">
        {/* MOBILE VIEW */}
        <div className="md:hidden flex flex-col gap-2 p-2">
          {currentData.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">{t('parts.tx_list.no_tx')}</div>
          ) : (
            currentData.map(tx => {
              const part = parts.find(p => p.id === tx.partId);
              let icon = 'ph-arrows-left-right text-gray-500';
              let bg = 'bg-gray-100';
              let textType = 'Nieznany';
              let qtyColor = 'text-gray-900';
              let sign = '';
              
              if (tx.type === 'receive') {
                icon = 'ph-arrow-down-left text-green-600';
                bg = 'bg-green-100';
                textType = t('parts.transactions.types.receive');
                qtyColor = 'text-green-600';
                sign = '+';
              } else if (tx.type.startsWith('issue')) {
                icon = 'ph-arrow-up-right text-red-600';
                bg = 'bg-red-100';
                textType = tx.type === 'issue_planned' ? t('parts.transactions.types.issue_planned') : t('parts.transactions.types.issue_adhoc');
                qtyColor = 'text-red-600';
                sign = '-';
              } else if (tx.type === 'return') {
                icon = 'ph-arrow-u-down-left text-blue-600';
                bg = 'bg-blue-100';
                textType = t('parts.transactions.types.return');
                qtyColor = 'text-blue-600';
                sign = '+';
              }

              return (
                <div key={tx.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
                        <i className={`ph ${icon} text-lg`}></i>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{textType}</div>
                        <div className="text-[10px] text-gray-400">{safeParseDate(tx.date)?.toLocaleString('pl-PL')}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-black ${qtyColor}`}>
                      {sign}{Math.abs(tx.quantity)} <span className="text-xs font-medium">{part?.unit || 'szt.'}</span>
                    </div>
                  </div>
                  <div 
                      className={"mt-3 text-sm font-bold " + (part ? 'text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-blue-300 decoration-dashed underline-offset-4' : 'text-slate-800')}
                      onClick={() => part && navigate('/manager/ur/parts_inventory?openPart=' + tx.partId)}
                    >
                      {part?.name || t('parts.tx_list.unknown_part')}
                    </div>
                  {(tx.machineId || tx.machineName) && (
                    <div 
                      className={"mt-1 text-xs text-blue-600 font-semibold flex items-center gap-1 " + (tx.machineId ? 'cursor-pointer hover:text-blue-800 underline decoration-blue-300 decoration-dashed underline-offset-2' : '')}
                      onClick={() => tx.machineId && navigate('/manager/ur/machines?openMachine=' + tx.machineId)}
                    >
                      <i className="ph ph-gear"></i> {machines.find(m => m.id === tx.machineId)?.name || tx.machineName}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between items-center text-xs">
                    <span className="text-gray-500"><i className="ph ph-user"></i> {tx.user}</span>
                    {tx.totalCost > 0 && <span className="font-semibold text-gray-700">{tx.totalCost.toFixed(2)} PLN</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block overflow-x-auto flex-1 rounded-t-none">
          <table className="w-full text-left border-collapse min-w-[800px] bg-white">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-3 font-medium">{t('parts.tx_list.date')}</th>
                <th className="p-3 font-medium">{t('parts.tx_list.type')}</th>
                <th className="p-3 font-medium">{t('parts.tx_list.part')}</th>
                <th className="p-3 font-medium text-right">{t('parts.tx_list.qty')}</th>
                <th className="p-3 font-medium text-right">{t('parts.tx_list.cost')}</th>
                <th className="p-3 font-medium">{t('parts.tx_list.machine')}</th>
                <th className="p-3 font-medium">{t('parts.tx_list.user')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentData.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500 italic">{t('parts.tx_list.no_tx')}</td></tr>
              ) : (
                currentData.map(tx => {
                  const part = parts.find(p => p.id === tx.partId);
                  
                  let icon = 'ph-arrows-left-right text-gray-500';
                  let bg = 'bg-gray-100';
                  let textType = 'Nieznany';
                  let qtyColor = 'text-gray-900';
                  let sign = '';
                  
                  if (tx.type === 'receive') {
                    icon = 'ph-arrow-down-left text-green-600';
                    bg = 'bg-green-100';
                    textType = t('parts.transactions.types.receive');
                    qtyColor = 'text-green-600';
                    sign = '+';
                  } else if (tx.type.startsWith('issue')) {
                    icon = 'ph-arrow-up-right text-red-600';
                    bg = 'bg-red-100';
                    textType = tx.type === 'issue_planned' ? t('parts.transactions.types.issue_planned') : t('parts.transactions.types.issue_adhoc');
                    qtyColor = 'text-red-600';
                    sign = '-';
                  } else if (tx.type === 'return') {
                    icon = 'ph-arrow-u-down-left text-blue-600';
                    bg = 'bg-blue-100';
                    textType = t('parts.transactions.types.return');
                    qtyColor = 'text-blue-600';
                    sign = '+';
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                        {safeParseDate(tx.date)?.toLocaleString('pl-PL')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                            <i className={`ph ${icon} text-xs`}></i>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{textType}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-semibold text-gray-800">
                          <div 
                            className={part ? 'text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-blue-300 decoration-dashed underline-offset-4' : ''}
                            onClick={() => part && navigate('/manager/ur/parts_inventory?openPart=' + tx.partId)}
                          >
                            {part?.name || <span className="text-gray-400 italic">Nieznana część</span>}
                          </div>
                        </td>
                      <td className={`p-3 text-right font-black ${qtyColor}`}>
                        {sign}{Math.abs(tx.quantity)} <span className="text-xs font-medium text-gray-500">{part?.unit || 'szt.'}</span>
                      </td>
                      <td className="p-3 text-right text-sm font-medium text-gray-700">
                        {tx.totalCost ? tx.totalCost.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {(tx.machineId || tx.machineName) ? (
                          <div 
                              className={"flex items-center gap-1.5 text-blue-600 font-medium " + (tx.machineId ? 'cursor-pointer hover:text-blue-800 underline decoration-blue-300 decoration-dashed underline-offset-4' : '')}
                              onClick={() => tx.machineId && navigate('/manager/ur/machines?openMachine=' + tx.machineId)}
                            >
                              <i className="ph ph-gear"></i>
                              {machines.find(m => m.id === tx.machineId)?.name || tx.machineName}
                            </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {tx.user}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-xl">
          <p className="text-sm text-gray-500">
            {t('parts.tx_list.page')} <span className="font-medium text-gray-900">{currentPage}</span> {t('parts.tx_list.of')} <span className="font-medium text-gray-900">{totalPages}</span>
            <span className="ml-2 text-gray-400">({t('parts.tx_list.entries').replace('{total}', filteredTransactions.length)})</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Poprzednia
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </div>

      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative my-8 animate-fade-in flex flex-col">
            <button onClick={() => setIsIssueModalOpen(false)} className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                <i className="ph ph-x font-bold text-lg"></i>
              </button>
            <div className="p-0 sm:p-2 max-h-[80vh] overflow-y-auto">
              <PartsIssueReceive user={user} onComplete={() => setIsIssueModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
