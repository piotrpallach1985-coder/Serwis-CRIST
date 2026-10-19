import { useAuth } from '../../../hooks/useAuth';
import React, { useState } from 'react';
import { useManagerStore } from '../../../store/managerStore';
import QRScannerModal from '../../shared/QRScannerModal';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getCurrentTenant } from '../../../utils/tenantHelper';

export default function TicketPartUsageModal({ isOpen, onClose, ticketId, onPartUsed }) {
  const { user } = useAuth();
  const parts = useManagerStore(state => state.parts || []);
  const tickets = useManagerStore(state => state.tickets || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  const ticket = tickets.find(t => t.id === ticketId) || plannedServices.find(s => s.id === ticketId) || {};
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredParts = parts.filter(p => 
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.code?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    const aCompatible = ticket?.machineId && a.compatibleMachines?.includes(ticket.machineId) ? 1 : 0;
    const bCompatible = ticket?.machineId && b.compatibleMachines?.includes(ticket.machineId) ? 1 : 0;
    return bCompatible - aCompatible;
  }).slice(0, 10);

  const handleScan = (text) => {
    try {
      setIsScannerOpen(false);
      const urlParams = new URLSearchParams(text.includes('?') ? text.split('?')[1] : text);
      const partId = urlParams.get('part') || text;
      const found = parts.find(p => p.id === partId);
      if (found) {
        setSelectedPart(found);
      } else {
        alert("Nie znaleziono części o kodzie: " + partId);
      }
    } catch (err) {
      alert("Błąd skanowania kodu QR.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPart) return;
    const qtyNum = Number(quantity);
    if (qtyNum <= 0) return alert("Ilość musi być > 0");

    setLoading(true);
    try {
      const tenantId = getCurrentTenant();
      const partRef = doc(db, 'tenants', tenantId, 'parts', selectedPart.id);
      const txRef = doc(collection(db, 'tenants', tenantId, 'part_transactions'));
      
      let finalCost = 0;

      await runTransaction(db, async (transaction) => {
        const partDoc = await transaction.get(partRef);
        if (!partDoc.exists()) throw new Error("Część nie istnieje.");
        
                const currentStock = Number(partDoc.data().stock || 0);
        
        if (qtyNum > currentStock) {
          throw new Error(`Brak wystarczającej ilości w magazynie (Dostępne: ${currentStock})`);
        }
        
        let currentBatches = partDoc.data().batches || [];
        if (currentBatches.length === 0 && currentStock > 0) {
           currentBatches = [{ qty: currentStock, price: Number(partDoc.data().unitPrice || 0), date: new Date().toISOString(), expirationDate: partDoc.data().expirationDate || null }];
        }

        const newStock = currentStock - qtyNum;
        let remainingToIssue = qtyNum;
        let totalCost = 0;
        let issueDetails = [];
        let newBatches = [...currentBatches];
        
        while (remainingToIssue > 0 && newBatches.length > 0) {
          let oldestBatch = newBatches[0];
          if (oldestBatch.qty <= remainingToIssue) {
            totalCost += oldestBatch.qty * oldestBatch.price;
            issueDetails.push({ qty: oldestBatch.qty, price: oldestBatch.price });
            remainingToIssue -= oldestBatch.qty;
            newBatches.shift();
          } else {
            totalCost += remainingToIssue * oldestBatch.price;
            issueDetails.push({ qty: remainingToIssue, price: oldestBatch.price });
            oldestBatch.qty -= remainingToIssue;
            remainingToIssue = 0;
          }
        }
        
        finalCost = totalCost;
        const avgPrice = qtyNum > 0 ? (totalCost / qtyNum) : 0;

        transaction.update(partRef, { stock: newStock, batches: newBatches });
        
        transaction.set(txRef, {
          partId: selectedPart.id,
          type: ticket.triggerType ? 'issue_planned' : 'issue_adhoc',
          quantity: -qtyNum,
          price: avgPrice,
          totalCost: totalCost,
          issueDetails: issueDetails,
          date: new Date().toISOString(),
          user: user?.name || 'Nieznany (App)',
          referenceId: ticketId,
          machineId: ticket?.machineId || null,
          machineName: ticket?.machineName || null,
                                  createdAt: serverTimestamp()
        });
      });

      const { logAudit } = await import('../../../services/audit.service');
      logAudit('ISSUE', 'PART', selectedPart.id, {
        partName: selectedPart.name,
        quantity: -qtyNum,
        totalCost: finalCost,
        referenceId: ticketId
      });

      const partUnit = selectedPart.unit || 'szt.';
      alert(`Pobrano ${qtyNum} ${partUnit}: ${selectedPart.name}`);
      const costText = finalCost > 0 ? ` (Wartość: ${finalCost.toLocaleString('pl-PL')} PLN)` : '';
      const message = `Pobrano z magazynu: ${selectedPart.name} (${qtyNum} ${partUnit})${costText}`;
      
      const txData = {
        partId: selectedPart.id,
        partName: selectedPart.name,
        unit: partUnit,
        quantity: qtyNum,
        unitPrice: finalCost > 0 ? (finalCost / qtyNum) : 0,
        totalCost: finalCost,
        type: 'issue_planned',
        referenceId: ticketId,
        createdAt: new Date()
      };

      if (onPartUsed) {
        onPartUsed(message, txData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Błąd: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <i className="ph ph-qr-code text-xl text-blue-600"></i> Pobierz Część
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {!selectedPart ? (
            <div className="text-center space-y-4">
                <p className="text-sm text-slate-500 font-medium">Zeskanuj kod QR lub wyszukaj część na liście, aby dodać ją do serwisu.</p>
                <button onClick={() => setIsScannerOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg">
                  <i className="ph ph-camera text-2xl"></i> Skanuj QR
                </button>
                
                <div className="relative mt-4 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lub wpisz nazwę / kod</label>
                  <div className="relative">
                    <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                    <input
                      type="text"
                      placeholder="Wyszukaj z listy..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-inner max-h-48 overflow-y-auto">
                      {filteredParts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 italic">Brak wyników</div>
                      ) : (
                        filteredParts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPart(p); setSearchQuery(''); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-50 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                {p.name}
                                {ticket?.machineId && p.compatibleMachines?.includes(ticket.machineId) && (
                                  <i className="ph ph-check-circle text-green-500" title="Kompatybilna część"></i>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400">KOD: {p.code || '-'}</div>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">Stan: {p.stock} {p.unit || 'szt.'}</span>
                          </button>
                        ))
                      )}
                    </div>
                </div>
              </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
                <i className="ph ph-nut"></i>
              </div>
              <h4 className="font-black text-lg text-slate-800 leading-tight">{selectedPart.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase">Aktualny stan: {selectedPart.stock} {selectedPart.unit || 'szt.'}</p>
              
              <div className="pt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ilość do pobrania ({selectedPart.unit || 'szt.'})</label>
                <div className="flex items-center justify-center gap-4">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xl flex items-center justify-center">-</button>
                  <input type="number" min="0.1" step="any" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-20 text-center text-2xl font-black text-slate-800 bg-transparent border-b-2 border-blue-600 outline-none" />
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xl flex items-center justify-center">+</button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg disabled:opacity-50">
                {loading ? 'Przetwarzanie...' : 'POTWIERDŹ ZUŻYCIE'}
              </button>
              <button type="button" onClick={() => setSelectedPart(null)} className="w-full mt-2 text-sm text-slate-500 font-bold py-2 hover:text-slate-800">
                Skanuj inną
              </button>
            </form>
          )}
        </div>
      </div>
      
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScan}
          title="Skanuj Kod QR Części"
        />
      )}
    </div>
  );
}
