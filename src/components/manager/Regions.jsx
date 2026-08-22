import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubRegions = onSnapshot(collection(db, "regions"), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMachines = onSnapshot(collection(db, "machines"), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubRegions();
      unsubMachines();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "regions", editingId), { 
          name: name.trim(), 
          description: description.trim() 
        });
      } else {
        await addDoc(collection(db, "regions"), {
          name: name.trim(),
          description: description.trim(),
          createdAt: serverTimestamp()
        });
      }
      setName('');
      setDescription('');
      setEditingId(null);
    } catch (error) {
      console.error("Błąd zapisu:", error);
      alert("Błąd podczas zapisu: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setDescription(r.description || '');
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const machinesQuery = query(collection(db, 'machines'), where('regionId', '==', id));
      const machinesSnapshot = await getDocs(machinesQuery);
      
      if (!machinesSnapshot.empty) {
        alert(`Nie można usunąć tego rejonu, ponieważ jest on przypisany do ${machinesSnapshot.size} maszyn. Zmień rejon w przypisanych maszynach przed usunięciem.`);
        return;
      }
      
      if (confirm("Czy na pewno chcesz usunąć ten rejon?")) {
        await deleteDoc(doc(db, "regions", id));
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas usuwania rejonu');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Rejony (Miejsca)</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj rejonami stoczni używanymi w systemie.</p>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa Rejonu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Hala K3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Opis (opcjonalnie)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Główna hala montażowa"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setName(''); setDescription(''); }}
                className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded font-bold transition-colors"
              >
                Anuluj
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rejon')}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Rejonu</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Opis</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Maszyny w rejonie</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regions.map(r => {
                const regionMachines = machines.filter(m => m.regionId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{r.name || 'Bez nazwy'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {regionMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {regionMachines.map(m => (
                            <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Brak przypisanych maszyn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-800 font-bold text-sm mr-4 transition-colors">
                        Edytuj
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 font-bold text-sm transition-colors">
                        Usuń
                      </button>
                    </td>
                  </tr>
                );
              })}
              {regions.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Brak zdefiniowanych rejonów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
