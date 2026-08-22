import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';

export default function ActionItems({ machines, user }) {
  const [items, setItems] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'action_items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      alert('Błąd ładowania Tematów do Realizacji: ' + err.message);
      console.error(err);
    });
    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (showCompleted) return item.status === 'completed';
      return item.status !== 'completed';
    });
  }, [items, showCompleted]);

  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'Nieznana maszyna';

  const handleComplete = async (id) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten temat jako zrealizowany?')) {
      try {
        await updateDoc(doc(db, 'action_items', id), {
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: user?.name || 'Nieznany'
        });
      } catch (err) {
        console.error(err);
        alert('Błąd aktualizacji statusu');
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-clipboard-text text-2xl text-blue-600"></i>
            Tematy do Realizacji
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Akcje i problemy zgłoszone podczas serwisów planowanych
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700">
            <input 
              type="checkbox" 
              checked={showCompleted} 
              onChange={e => setShowCompleted(e.target.checked)} 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
            />
            Pokaż zrealizowane
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-4">Data Zgłoszenia</th>
                <th className="px-6 py-4">Maszyna</th>
                <th className="px-6 py-4">Problem / Zadanie</th>
                <th className="px-6 py-4">Wymagany Termin</th>
                <th className="px-6 py-4">Zgłaszający</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">
                    Brak tematów do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {getMachineName(item.machineId)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-md break-words">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Brak'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdBy}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                          <i className="ph ph-check-circle"></i> Zrealizowane
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                          <i className="ph ph-clock"></i> Oczekujące
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status !== 'completed' && (
                        <button 
                          onClick={() => handleComplete(item.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                        >
                          Zakończ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
