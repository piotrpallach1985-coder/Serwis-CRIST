import { useAuth } from '../../../hooks/useAuth';
import React, { useState } from 'react';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { issueOrReceivePart } from '../../../services/parts.service';

export default function PartTransactionModal({ part, mode, onClose }) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState(part.unitPrice || 0);
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (qtyNum <= 0) {
      alert("Ilość musi być większa od zera.");
      return;
    }

    setLoading(true);
    try {
      const tenantId = getCurrentTenant();
      await issueOrReceivePart({
        tenantId,
        partId: part.id,
        mode,
        quantity: qtyNum,
        unitPrice,
        expirationDate,
        user,
        selectedMachine: null
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-8 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <h2 className="text-xl font-extrabold text-gray-800">
            {mode === 'receive' ? 'Dodaj Dostawę' : 'Remanent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="text-sm font-bold text-slate-500 uppercase">Część</div>
            <div className="text-lg font-black text-slate-800">{part.name}</div>
            <div className="text-xs text-slate-400">Aktualny stan: {part.stock}</div>
          </div>
          <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ilość sztuk *</label>
              <input type="number" min="1" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-black text-xl" />
            </div>
            {mode === 'receive' && (
              <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cena dostawy (PLN) *</label>
                <input type="number" min="0" step="0.01" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Ważności Partii (Opcj.)</label>
                <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold" />
              </div>
              </>
            )}
          </form>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
            Anuluj
          </button>
          <button form="tx-form" type="submit" disabled={loading} className={`px-6 py-2.5 rounded-xl font-bold text-white transition-colors shadow-md ${mode === 'receive' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
            {loading ? 'Przetwarzanie...' : mode === 'receive' ? 'Dodaj Dostawę' : 'Remanent'}
          </button>
        </div>
      </div>
    </div>
  );
}
