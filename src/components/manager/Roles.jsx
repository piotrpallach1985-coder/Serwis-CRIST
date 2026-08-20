import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  
  // Lista wszystkich dostępnych zakładek (uprawnień) podzielona na moduły
  const availablePermissionsGrouped = [
    {
      module: 'Awarie UR',
      permissions: [
        { id: 'dashboard_tickets', label: 'Mapa Stoczni' },
        { id: 'edit_map', label: 'Edycja Mapy' },
        { id: 'tickets', label: 'Zgłoszenia Awarii' },
        { id: 'archive', label: 'Archiwum Awarii' },
        { id: 'kpi', label: 'Analiza' }
      ]
    },
    {
      module: 'Serwis UR',
      permissions: [
        { id: 'planned_tasks', label: 'Planowane Serwisy' }
      ]
    },
    {
      module: 'Administracja',
      permissions: [
        { id: 'machines', label: 'Rejestr Maszyn' },
        { id: 'regions', label: 'Rejony' },
        { id: 'services', label: 'Podwykonawcy / Serwis' },
        { id: 'topics', label: 'Tematy Zgłoszeń' },
        { id: 'reporters', label: 'Zgłaszający' }
      ]
    }
  ];

  // Helper do płaskiej listy
  const allPermissionsFlat = availablePermissionsGrouped.flatMap(g => g.permissions);

  const [permissions, setPermissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "roles"), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleTogglePermission = (id) => {
    if (permissions.includes(id)) {
      setPermissions(permissions.filter(p => p !== id));
    } else {
      setPermissions([...permissions, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "roles", editingId), { name, permissions });
      } else {
        await addDoc(collection(db, "roles"), {
          name,
          permissions,
          createdAt: serverTimestamp()
        });
      }
      setName('');
      setPermissions([]);
      setEditingId(null);
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setPermissions(r.permissions || []);
    setEditingId(r.id);
  };

  const handleDelete = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć tę rolę? UWAGA: Użytkownicy z tą rolą stracą wszystkie dostępy!")) {
      await deleteDoc(doc(db, "roles", id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Role i Uprawnienia</h2>
          <p className="text-sm text-gray-500 mt-1">Twórz niestandardowe role i decyduj, do jakich modułów mają dostęp.</p>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa Roli <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Pracownik Serwisu Zewnętrznego"
              required
            />
          </div>

          <div className="mb-6 space-y-6">
            <label className="block text-sm font-bold text-gray-700">Dostęp do zakładek według modułów:</label>
            
            <div className="space-y-6">
              {availablePermissionsGrouped.map(group => (
                <div key={group.module} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{group.module}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.permissions.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={permissions.includes(p.id)}
                          onChange={() => handleTogglePermission(p.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              Uwaga: Zakładki &quot;Użytkownicy i Dostępy&quot;, &quot;Role i Uprawnienia&quot; oraz &quot;Ustawienia Systemu&quot; są zarezerwowane wyłącznie dla systemowego Administratora i nie można ich przydzielić do innych ról.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setName(''); setPermissions([]); }}
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
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rolę')}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Roli</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dostępne Zakładki</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{r.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {r.permissions?.map(p => {
                        const found = allPermissionsFlat.find(ap => ap.id === p);
                        return found ? (
                          <span key={p} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">
                            {found.label}
                          </span>
                        ) : null;
                      })}
                      {(!r.permissions || r.permissions.length === 0) && (
                        <span className="text-gray-400 text-sm italic">Brak dostępów</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-800 font-bold text-sm mr-4 transition-colors">
                      Edytuj
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 font-bold text-sm transition-colors">
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Brak zdefiniowanych ról. Utwórz pierwszą powyżej.
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
