import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MachineForm({ isOpen, onClose, editingMachine, regions, onSaved, onError }) {
  const [name, setName] = useState('');
  const [bay, setBay] = useState('');
  const [regionId, setRegionId] = useState('');
  const [internalId, setInternalId] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingMachine) {
      setName(editingMachine.name || '');
      setBay(editingMachine.bay || '');
      setRegionId(editingMachine.regionId || '');
      setInternalId(editingMachine.internalId || '');
      setAdditionalDescription(editingMachine.additionalDescription || '');
    } else {
      setName('');
      setBay('');
      setRegionId('');
      setInternalId('');
      setAdditionalDescription('');
    }
  }, [editingMachine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !regionId) return;
    setLoading(true);
    try {
      if (editingMachine) {
        let n = name.trim();
        if (n.includes('(DO WERYFIKACJI)')) {
          n = n.replace('(DO WERYFIKACJI)', '').trim();
        }
        await updateDoc(doc(db, 'machines', editingMachine.id), {
          name: n,
          bay: bay.trim(),
          regionId,
          internalId: internalId.trim(),
          additionalDescription: additionalDescription.trim()
        });
        onSaved('Zaktualizowano maszynę');
      } else {
        await addDoc(collection(db, 'machines'), {
          name: name.trim(),
          bay: bay.trim(),
          regionId,
          internalId: internalId.trim(),
          additionalDescription: additionalDescription.trim(),
          isDeleted: false,
          currentWorkHours: 0
        });
        onSaved('Maszyna została dodana pomyślnie.');
      }
      onClose();
    } catch (err) {
      onError('Wystąpił błąd: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
            {editingMachine ? 'Edytuj maszynę' : 'Dodaj nową maszynę i wygeneruj kod QR'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rejon / Numer Hali</label>
                <select value={regionId} onChange={e => setRegionId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white" required>
                  <option value="">-- Wybierz Rejon --</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Przelot / Inf. dodatkowa (Opcjonalnie)</label>
                <input type="text" value={bay} onChange={(e) => setBay(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Przelot 2 / Magazyn" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Numer wew. UR (Opcjonalnie)</label>
                <input type="text" value={internalId} onChange={(e) => setInternalId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. UR-123" />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa maszyny</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Suwnica S-01" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dodatkowy opis awaryjny (Opcjonalnie)</label>
              <textarea value={additionalDescription} onChange={(e) => setAdditionalDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none resize-y min-h-[80px]" placeholder="Opis pomocniczy widoczny dla pracowników..."></textarea>
              <p className="text-xs text-gray-400 mt-1">Ten opis będzie widoczny pod nazwą maszyny, może pomóc w dokładniejszej identyfikacji.</p>
            </div>
            {editingMachine && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-yellow-800 text-sm">
                <p className="font-bold"><i className="ph ph-warning-circle mr-1"></i> Uwaga dotycząca kodów QR</p>
                <p>Jeśli zmieniasz nazwę maszyny, stary, wydrukowany kod QR (naklejka) będzie miał nieaktualny napis. Pamiętaj, aby po zapisaniu zmian wygenerować i wydrukować <strong>nowy kod QR</strong>!</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onClose}
                className="bg-gray-100 text-gray-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anuluj
              </button>
              <button disabled={loading} type="submit" className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 min-w-[150px] shadow-sm">
                {loading ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-check font-bold"></i>}
                {editingMachine ? 'Zapisz zmiany' : 'Dodaj maszynę'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
