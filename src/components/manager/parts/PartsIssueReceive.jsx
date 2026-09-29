import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useManagerStore } from '../../../store/managerStore';
import QRScannerModal from '../../shared/QRScannerModal';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { issueOrReceivePart } from '../../../services/parts.service';

export default function PartsIssueReceive({ onComplete }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const parts = useManagerStore(state => state.parts || []);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  
  const [mode, setMode] = useState('issue');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineSearch, setMachineSearch] = useState('');
  const machines = useManagerStore(state => state.machines || []);

  const handleScan = (text) => {
    try {
      setIsScannerOpen(false);
      const urlParams = new URLSearchParams(text.includes('?') ? text.split('?')[1] : text);
      const partId = urlParams.get('part') || text;
      const found = parts.find(p => p.id === partId);
      if (found) {
        setSelectedPart(found);
        setUnitPrice(found.unitPrice || 0);
        setQuantity('');
      } else {
        alert(t('parts.alerts.not_found') + partId);
      }
    } catch (err) {
      alert(t('parts.alerts.scan_error'));
    }
  };

  const handleManualSelect = (p) => {
    setSelectedPart(p);
    setUnitPrice(p.unitPrice || 0);
    setQuantity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPart) return;
    const qtyNum = Number(quantity);
    if (qtyNum <= 0) {
      alert(t('parts.alerts.qty_zero'));
      return;
    }
    
    if (mode === 'issue' && !selectedMachine) {
      alert(t('parts.alerts.select_device'));
      return;
    }

    setLoading(true);
    try {
      const tenantId = getCurrentTenant();
      await issueOrReceivePart({
        tenantId,
        partId: selectedPart.id,
        mode,
        quantity: qtyNum,
        unitPrice,
        expirationDate,
        user,
        selectedMachine
      });

      alert(mode === 'receive' ? t('parts.alerts.received') : t('parts.alerts.issued'));
      if (onComplete) onComplete();
      setSelectedPart(null);
      setQuantity('');
      setExpirationDate('');
      setSelectedMachine(null);
    } catch (err) {
      console.error(err);
      alert(t('parts.alerts.op_error') + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(p => {
    if (!searchQuery) return false; // pokaż tylko jak szuka
    const q = searchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
  }).slice(0, 5); // max 5 wyników ręcznych

  return (
    <div className="w-full space-y-4 pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('parts.issue_receive.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('parts.issue_receive.subtitle')}</p>
        </div>
        <button onClick={() => setIsScannerOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-qr-code text-xl"></i> {t('parts.buttons.scan_qr')} </button>
      </div>

      {!selectedPart && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('parts.issue_receive.manual_search')}</label>
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input
              type="text"
              placeholder={t('parts.issue_receive.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
            />
          </div>
          
            <div className="mt-4 flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 rounded-xl border border-slate-100 bg-white p-2 shadow-inner">
              {filteredParts.length === 0 ? (
                <div className="text-sm text-slate-500 p-2">{t('parts.list.no_results_title')}</div>
              ) : (
                filteredParts.slice(0, 20).map(p => (
                  <div key={p.id} onClick={() => handleManualSelect(p)} className="p-3 bg-slate-50 border border-slate-100 hover:border-blue-500 rounded-xl cursor-pointer transition-colors flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-slate-800 group-hover:text-blue-600">{p.name}</div>
                      <div className="text-xs text-slate-400">{t('parts.details.code')} {p.code || '-'}</div>
                    </div>
                    <div className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                      {t('parts.issue_receive.in_stock')} {p.stock}
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      )}

      {selectedPart && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in relative overflow-hidden">
          <button onClick={() => setSelectedPart(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full">
            <i className="ph ph-x"></i>
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              <i className="ph ph-nut"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedPart.name}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t('parts.issue_receive.current_stock')} <span className="text-blue-600">{selectedPart.stock} szt.</span></p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => { setMode('issue'); setQuantity(''); setExpirationDate(''); setSelectedMachine(null); }} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${mode === 'issue' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph ph-minus-circle mr-2 text-red-500"></i> {t('parts.issue_receive.btn_issue')} </button>
            <button onClick={() => { setMode('receive'); setQuantity(''); setExpirationDate(''); setSelectedMachine(null); }} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${mode === 'receive' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph ph-plus-circle mr-2 text-emerald-500"></i> {t('parts.issue_receive.btn_receive')} </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('parts.issue_receive.qty')}</label>
                <input 
                  type="number" min="1" step="1" required 
                  value={quantity} onChange={e => setQuantity(e.target.value)} 
                  className="w-full p-4 text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                />
              </div>
              {mode === 'issue' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('parts.issue_receive.device_project')}</label>
                  <div className="relative">
                    <i className="ph ph-gear absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                      type="text"
                      placeholder={t('parts.issue_receive.search_device')}
                      value={selectedMachine ? selectedMachine.name : machineSearch}
                      onChange={(e) => { setMachineSearch(e.target.value); setSelectedMachine(null); }}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    />
                    {machineSearch && !selectedMachine && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {machines.filter(m => m.name.toLowerCase().includes(machineSearch.toLowerCase())).slice(0, 5).map(m => (
                          <button key={m.id} type="button" onClick={() => { setSelectedMachine(m); setMachineSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-semibold border-b border-slate-50 last:border-0">
                            {m.name}
                          </button>
                        ))}
                        {machines.filter(m => m.name.toLowerCase().includes(machineSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-400">Brak wyników</div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedMachine && (
                    <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold w-fit">
                      <i className="ph ph-gear"></i> {selectedMachine.name}
                      <button type="button" onClick={() => setSelectedMachine(null)} className="ml-2 hover:text-blue-900"><i className="ph ph-x"></i></button>
                    </div>
                  )}
                </div>
              )}
              {mode === 'receive' && (
                <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('parts.issue_receive.new_price')}</label>
                  <input 
                    type="number" min="0" step="0.01" required 
                    value={unitPrice} onChange={e => setUnitPrice(e.target.value)} 
                    className="w-full p-4 text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-2">{t('parts.issue_receive.new_price_desc')} ({selectedPart.unitPrice || 0} PLN).</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('parts.issue_receive.expiration')}</label>
                  <input 
                    type="date" 
                    value={expirationDate} onChange={e => setExpirationDate(e.target.value)} 
                    className="w-full p-4 text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-2">{t('parts.issue_receive.expiration_desc')}</p>
                </div>
                </>
              )}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-md transition-all ${loading ? 'opacity-50' : ''} ${mode === 'receive' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
              {loading ? t('parts.issue_receive.processing') : mode === 'receive' ? `${t('parts.issue_receive.confirm_receive')} (+${quantity || 0})` : `${t('parts.issue_receive.confirm_issue')} (-${quantity || 0})`}
            </button>
          </form>
        </div>
      )}

      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScan}
          title={t('parts.buttons.scan_qr')}
        />
      )}
    </div>
  );
}
