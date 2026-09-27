import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { useManagerStore } from '../../../store/managerStore';

export default function PartForm({ part, onClose, user }) {
  const isEditing = !!part;
  const machines = useManagerStore(state => state.machines || []);
  
  const regions = useManagerStore(state => state.regions || []);
  const [building, setBuilding] = useState(part?.building || '');
  const [name, setName] = useState(part?.name || '');
  const [code, setCode] = useState(part?.code || '');
  const [stock, setStock] = useState(part?.stock || 0);
  const [minStock, setMinStock] = useState(part?.minStock || 0);
  const [location, setLocation] = useState(part?.location || '');
  const [unit, setUnit] = useState(part?.unit || 'szt.');
  const [unitPrice, setUnitPrice] = useState(part?.unitPrice || 0);
  const [expirationDate, setExpirationDate] = useState(part?.expirationDate || '');
  const [compatibleMachines, setCompatibleMachines] = useState(part?.compatibleMachines || []);
  const [machineSearch, setMachineSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const tenantId = getCurrentTenant();
      const numStock = Number(stock);
      let payload = {
        name: name.trim(),
        code: code.trim(),
        minStock: Number(minStock),
        location: location.trim(),
        building: building.trim(),
        compatibleMachines,
        updatedAt: serverTimestamp(),
      };

      if (!isEditing) {
        payload.stock = numStock;
        payload.unitPrice = Number(unitPrice);
        payload.expirationDate = expirationDate || null;
        if (numStock > 0) {
          payload.batches = [{
            qty: numStock,
            price: Number(unitPrice),
            date: new Date().toISOString(),
            expirationDate: expirationDate || null
          }];
        }
      }

      if (isEditing) {
        const ref = doc(db, 'tenants', tenantId, 'parts', part.id);
        await updateDoc(ref, payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.qrCreatedAt = serverTimestamp();
        await addDoc(collection(db, 'tenants', tenantId, 'parts'), payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Błąd zapisu części");
    } finally {
      setLoading(false);
    }
  };

  const toggleMachine = (mid) => {
    if (compatibleMachines.includes(mid)) {
      setCompatibleMachines(compatibleMachines.filter(id => id !== mid));
    } else {
      setCompatibleMachines([...compatibleMachines, mid]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl shrink-0">
          <h2 className="text-xl font-extrabold text-gray-800">
            {isEditing ? 'Edytuj Część Zapasową' : 'Dodaj Nową Część'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="part-form" onSubmit={handleSubmit} className="space-y-6 pb-32">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nazwa części *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kod magazynowy *</label>
                <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
              </div>
            </div>

                          {isEditing && (
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                  <i className="ph ph-info text-lg"></i>
                  Stan fizyczny, cena oraz data ważności są zarządzane przez Dostawy i Wydania (FIFO).
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fizyczny Stan *</label>
                    <input type="number" min="0" step="1" required value={stock} onChange={e => setStock(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jednostka (J.M.)</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold bg-white">
                    <option value="szt.">sztuk (szt.)</option>
                    <option value="kg">kilogramów (kg)</option>
                    <option value="L">litrów (L)</option>
                    <option value="m">metrów bieżących (m)</option>
                    <option value="m2">metrów kwadratowych (m2)</option>
                    <option value="opak.">opakowań (opak.)</option>
                    <option value="kpl.">kompletów (kpl.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stan Minimalny *</label>
                  <input type="number" min="0" step="1" required value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" />
                </div>
                {!isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cena jedn. (PLN) {Number(stock) > 0 ? '*' : '(Opcjonalnie)'}</label>
                    <input type="number" min="0" step="0.01" required={Number(stock) > 0} value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Budynek Magazynowy</label>
                  <input 
                    type="text" 
                    list="regions-list" 
                    placeholder="Wybierz lub wpisz..." 
                    value={building} 
                    onChange={e => setBuilding(e.target.value)} 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
                  />
                  <datalist id="regions-list">
                    {regions.map(r => <option key={r.id} value={r.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lokalizacja (Piętro/Regał/Półka)</label>
                  <input type="text" placeholder="np. P315/R12" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                </div>
                {!isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data ważności</label>
                    <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Kompatybilne Maszyny</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {compatibleMachines.map(mid => {
                    const m = machines.find(mac => mac.id === mid);
                    if (!m) return null;
                    return (
                      <span key={mid} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-blue-100">
                        {m.name}
                        <button type="button" onClick={() => toggleMachine(mid)} className="hover:text-blue-900 transition-colors">
                          <i className="ph ph-x"></i>
                        </button>
                      </span>
                    );
                  })}
                </div>
                
                <div className="relative">
                  <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Wyszukaj i dodaj maszynę..."
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto pb-4">
                      {machines.filter(m => !compatibleMachines.includes(m.id) && m.name.toLowerCase().includes(machineSearch.toLowerCase())).length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Brak wyników</div>
                      ) : (
                        machines
                          .filter(m => !compatibleMachines.includes(m.id) && m.name.toLowerCase().includes(machineSearch.toLowerCase()))
                          .map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleMachine(m.id)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-semibold text-gray-700 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between"
                            >
                              <span>{m.name}</span>
                              <i className="ph ph-plus text-blue-600"></i>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
              Anuluj
            </button>
            <button form="part-form" type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
              {loading ? 'Zapisywanie...' : (isEditing ? 'Zapisz Część' : 'Dodaj Część')}
            </button>
          </div>
        </div>
      </div>
  );
}