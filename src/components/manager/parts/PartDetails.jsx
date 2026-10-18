import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import React, {  useState, useMemo , useEffect } from 'react';
import { useManagerStore } from '../../../store/managerStore';
import { QRCodeCanvas } from 'qrcode.react';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { safeParseDate } from '../../../utils/dateHelpers';
import PartTransactionModal from './PartTransactionModal';

export default function PartDetails({ part, onBack, onEdit }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [txMode, setTxMode] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    import('../../../hooks/usePartTransactions').then(({ fetchTransactionsForPart }) => {
      fetchTransactionsForPart(getCurrentTenant(), part.id).then(setTransactions);
    });
  }, [part.id, refreshKey]);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  const tickets = useManagerStore(state => state.tickets || []);
  const machines = useManagerStore(state => state.machines || []);

  const tenantId = getCurrentTenant();
  const qrValue = `tenant=${tenantId}&part=${part.id}`;

  const partTxs = useMemo(() => {
    return transactions
      .filter(tx => tx.partId === part.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, part.id]);

  const plannedUsage = useMemo(() => {
    return plannedServices.filter(s => 
      s.status !== 'completed' && 
      s.requiredParts && 
      s.requiredParts.some(rp => rp.partId === part.id)
    ).sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
  }, [plannedServices, part.id]);

  const reservedQty = plannedUsage.reduce((sum, s) => {
    const req = s.requiredParts.find(rp => rp.partId === part.id);
    return sum + (req ? Number(req.quantity || 0) : 0);
  }, 0);

  const available = Number(part.stock) - reservedQty;
  const isLow = available < Number(part.minStock);
  const isOut = available <= 0;

  // Obliczenia wartości zapasów
  const batches = part.batches || [];
  const totalValue = batches.reduce((sum, b) => sum + (Number(b.qty) * Number(b.price || 0)), 0);
  const avgPrice = part.stock > 0 ? (totalValue / part.stock) : (part.unitPrice || 0);
  
  // Sortowanie partii po dacie ważności (rosnąco, null na końcu)
  const sortedBatches = [...batches].sort((a, b) => {
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return new Date(a.expirationDate) - new Date(b.expirationDate);
  });

      return (
      <div className="w-full h-full flex flex-col overflow-y-auto animate-fade-in relative text-[#111827] pb-20">
        {/* ZUNIFIKOWANY GÓRNY PASEK NAWIGACYJNY */}
        <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3 mb-4 rounded-xl sm:rounded-none">
          
          {/* Lewa strona (Desktop) / Górny wiersz (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
            <button 
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
              title={t('parts.buttons.back')}
            >
              <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">{t('parts.buttons.back')}</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md">{part.name}</h2>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0 sm:mt-0.5 uppercase tracking-widest leading-none">{t('parts.details.code')} {part.code || '-'}</div>
            </div>
          </div>

          {/* Prawa strona (Desktop) / Dolny wiersz (Mobile) */}
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
            <button onClick={() => setTxMode('receive')} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" title={t('parts.buttons.receive')}>
              <i className="ph ph-plus-circle text-xl md:text-base"></i><span className="hidden md:inline">{t('parts.buttons.receive')}</span>
            </button>
            <button onClick={() => setTxMode('issue')} className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" title={t('parts.buttons.issue')}>
              <i className="ph ph-minus-circle text-xl md:text-base"></i><span className="hidden md:inline">{t('parts.buttons.issue')}</span>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
            <button onClick={onEdit} className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0" title={t('parts.buttons.edit')}>
              <i className="ph ph-pencil-simple text-xl md:text-base"></i><span className="hidden md:inline">{t('parts.buttons.edit')}</span>
            </button>
          </div>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-2 md:px-6">
        {/* INFO */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t('parts.details.general_info')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{t('parts.details.location')}</div>
                <div className="font-semibold text-slate-800 text-sm">{part.building ? part.building + ' / ' : ''}{part.location || t('parts.details.no_data')}</div>
              </div>
                              <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('parts.details.avg_price')}</div>
                  <div className="font-semibold text-slate-800 text-sm">{avgPrice.toFixed(2)} PLN</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase text-blue-500">{t('parts.details.stock_value')}</div>
                  <div className="font-black text-blue-600 text-sm">{totalValue.toFixed(2)} PLN</div>
                </div>
                                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('parts.details.created_at')}</div>
                  <div className="font-semibold text-slate-800 text-sm">{part.createdAt ? safeParseDate(part.createdAt.toDate ? part.createdAt.toDate() : part.createdAt).toLocaleDateString('pl-PL') : '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('parts.details.updated_at')}</div>
                  <div className="font-semibold text-slate-800 text-sm">{part.updatedAt ? safeParseDate(part.updatedAt.toDate ? part.updatedAt.toDate() : part.updatedAt).toLocaleDateString('pl-PL') : '-'}</div>
                </div>
            
                          </div>
              <div className="mt-6 pt-4 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <i className="ph ph-stack text-lg"></i> {t('parts.details.batches')} </div>
                {sortedBatches.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">{t('parts.details.no_batches')}</div>
                ) : (
                  <div className="space-y-2">
                    {sortedBatches.map((b, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="font-black text-slate-700">{b.qty} {part.unit || 'szt.'}</span>
                          <span className="text-slate-400 ml-2">po {Number(b.price || 0).toFixed(2)} PLN</span>
                        </div>
                        <div className={`font-bold ${b.expirationDate ? (new Date(b.expirationDate) < new Date() ? 'text-red-500' : 'text-orange-500') : 'text-slate-400'}`}>
                          {b.expirationDate ? `${t('parts.details.valid_until')} ${new Date(b.expirationDate).toLocaleDateString('pl-PL')}` : t('parts.details.no_expiration')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t('parts.details.machine_compatibility')}</div>
              <div className="flex flex-wrap gap-2">
                {part.compatibleMachines && part.compatibleMachines.length > 0 ? (
                  part.compatibleMachines.map(mid => {
                    const m = machines.find(mac => mac.id === mid);
                    return <span key={mid} className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">{m ? m.name : t('parts.details.unknown_machine')}</span>;
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">{t('parts.details.no_machines')}</span>
                )}
              </div>
            </div>
          </div>

          {/* ZAPLANOWANE ZUŻYCIE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="ph ph-calendar-check text-lg"></i> {t('parts.details.planned_usage')} </h3>
            {plannedUsage.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <i className="ph ph-check-circle text-2xl text-emerald-400 mb-2"></i>
                <p className="text-sm text-slate-500 font-medium">{t('parts.details.no_planned')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plannedUsage.map(s => {
                    const reqQty = s.requiredParts.find(rp => rp.partId === part.id)?.quantity || 0;
                    const machine = machines.find(m => m.id === s.machineId);
                    return (
                      <div key={s.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                          <div className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); if (machine) navigate('/manager/ur/machines?openMachine=' + machine.id); }} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline cursor-pointer transition-colors text-left">
      <i className="ph ph-gear"></i> {machine ? machine.name : t('parts.details.unknown_device')}
    </button>
                            <span>•</span>
                            <span>{t('parts.details.planned_date')} {safeParseDate(s.nextDate)?.toLocaleDateString('pl-PL')}</span>
                          </div>
                        </div>
                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-black text-sm">
                        {reqQty} {part.unit || 'szt.'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PRAWA KOLUMNA: STATUS & QR & HISTORIA */}
        <div className="space-y-4">
          
          {/* STAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('parts.details.stock_status')}</h3>
            
            <div className={`w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center mb-4 ${isOut ? 'border-red-500 text-red-500' : isLow ? 'border-orange-500 text-orange-500' : 'border-emerald-500 text-emerald-500'}`}>
              <div className="text-4xl font-black leading-none">{available}</div>
              <div className="text-[10px] font-bold uppercase mt-1">{t('parts.details.available')}</div>
            </div>
            
            <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t border-slate-50">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">{t('parts.details.physical')}</div>
                <div className="text-lg font-black text-slate-700">{part.stock}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">{t('parts.details.reserved')}</div>
                <div className="text-lg font-black text-orange-500">{reservedQty}</div>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-50 py-1.5 rounded-lg text-xs font-bold text-slate-500">
              {t('parts.details.min_stock')} {part.minStock}
            </div>
          </div>

          {/* QR */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('parts.details.qr_title')}</h3>
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-sm">
              <QRCodeCanvas value={qrValue} size={140} level="H" />
                <div className="mt-3 text-center">
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">DATA: {safeParseDate(part.createdAt)?.toLocaleDateString('pl-PL') || '-'}</span>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-medium px-4">
              {t('parts.details.qr_desc')}
            </p>
          </div>

          {/* AUDYT */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <i className="ph ph-clock-counter-clockwise text-base"></i> {t('parts.details.audit')} </h3>
            {partTxs.length === 0 ? (
              <div className="text-xs text-slate-400 italic text-center py-2">{t('parts.details.no_audit')}</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                {partTxs.map(tx => {
                  const isAdd = tx.type === 'receive' || tx.type === 'return';
                  const isIssue = ["issue_planned", "issue_adhoc", "issue"].includes(tx.type);
                  let mName = tx.machineName;
                  if (isIssue) {
                    if (tx.machineId) {
                      const m = machines.find(mac => mac.id === tx.machineId);
                      if (m) mName = m.name;
                    } else if (tx.referenceId) {
                      if (tx.type === "issue_adhoc" || tx.type === "issue") {
                        const tObj = tickets.find(tic => tic.id === tx.referenceId);
                        if (tObj && tObj.machineId) {
                          const m = machines.find(mac => mac.id === tObj.machineId);
                          if (m) mName = m.name;
                        }
                      } else if (tx.type === 'issue_planned') {
                        const s = plannedServices.find(srv => srv.id === tx.referenceId);
                        if (s && s.machineId) {
                          const m = machines.find(mac => mac.id === s.machineId);
                          if (m) mName = m.name;
                        }
                      }
                    }
                  }
                  const partUnit = part.unit || 'szt.';
                  return (
                    <div key={tx.id} className="py-1.5 first:pt-0 last:pb-0 text-xs">
                      <div className="flex justify-between items-center gap-2 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-bold text-slate-700 text-[11px]">
                            {tx.type === 'receive' ? t('parts.transactions.types.receive') : tx.type === 'return' ? t('parts.transactions.types.return') : tx.type === 'issue_planned' ? t('parts.transactions.types.issue_planned') : (tx.type === 'issue_adhoc' || tx.type === 'issue') ? t('parts.transactions.types.issue_adhoc') : tx.type}
                          </span>
                          {mName && (
                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50/80 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 truncate max-w-[160px]">
                              <i className="ph ph-gear text-[10px]"></i>{mName}
                            </span>
                          )}
                        </div>
                        <div className={`font-black text-xs shrink-0 ${isAdd ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isAdd ? '+' : '-'}{Math.abs(tx.quantity)} <span className="text-[10px] font-semibold">{partUnit}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center gap-2 text-[10px] text-slate-400 mt-0.5 leading-tight">
                        <span className="truncate">{safeParseDate(tx.date)?.toLocaleDateString('pl-PL')} • {tx.user}</span>
                        {isIssue && tx.totalCost > 0 && (
                          <span className="text-slate-500 font-semibold shrink-0">
                            {t('parts.details.cost')} {tx.totalCost.toFixed(2)} PLN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {txMode && (
        <PartTransactionModal part={part} mode={txMode} onClose={() => { setTxMode(null); setRefreshKey(prev => prev + 1); }} user={user} />
      )}
    </div>
  );
}


