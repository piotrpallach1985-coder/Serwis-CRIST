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
        { id: 'dashboard_planned', label: 'Mapa Serwisów' },
        { id: 'planned_maintenance', label: 'Planowane Serwisy' },
        { id: 'archive_planned', label: 'Archiwum Serwisów' },
        { id: 'edit_planned', label: 'Edycja Serwisów Planowanych' },
        { id: 'delete_planned', label: 'Usuwanie Serwisów Planowanych' }
      ]
    },
    {
      module: 'Administracja',
      permissions: [
        { id: 'machines', label: 'Rejestr Urządzeń' },
        { id: 'regions', label: 'Rejony' },
        { id: 'services', label: 'Podwykonawcy / Serwis' },
        { id: 'topics', label: 'Tematy Zgłoszeń' },
        { id: 'reporters', label: 'Zgłaszający' },
        { id: 'users', label: 'Użytkownicy' },
        { id: 'roles', label: 'Role i Uprawnienia' },
        { id: 'reports', label: 'Raportowanie' },
        { id: 'manage_dtr', label: 'Zarządzanie plikami DTR' }
      ]
    },
      {
        module: 'Powiadomienia Push',
        permissions: [
          { id: 'push_new_critical', label: 'Nowe Awarie Krytyczne' },
          { id: 'push_new_all', label: 'Wszystkie Nowe Awarie' },
          { id: 'push_status_updates', label: 'Zmiany statusów powiązanych zgłoszeń' },
          { id: 'push_new_comments', label: 'Nowe komentarze w powiązanych zgłoszeniach' },
          { id: 'push_planned_services', label: 'Powiadomienia o zbliżających się serwisach' }
        ]
      }
    ];

  

  // Helper do płaskiej listy
  const allPermissionsFlat = availablePermissionsGrouped.flatMap(g => g.permissions);

  const [permissions, setPermissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });

  useEffect(() => {
    const unsubMod = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    const unsub = onSnapshot(collection(db, "roles"), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => { unsub(); unsubMod(); };
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
        setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setPermissions(r.permissions || []);
    setEditingId(r.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć tę rolę? UWAGA: Użytkownicy z tą rolą stracą wszystkie dostępy!")) {
      await updateDoc(doc(db, "roles", id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: 'System' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Role i Uprawnienia</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj dostępem do różnych części aplikacji dla grup pracowników.</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setPermissions([]); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
          <i className="ph ph-plus text-lg"></i> Dodaj Rolę
        </button>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-[10000] pb-24 md:pb-4 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
                  <i className="ph ph-shield-star text-blue-600"></i>
                  {editingId ? 'Edytuj Rolę' : 'Dodaj nową rolę i ustawienia'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              {availablePermissionsGrouped.filter(g => {
              if (g.module === 'Awarie UR' && !modSettings.enableTickets) return false;
              if (g.module === 'Serwis UR' && !modSettings.enablePlanned) return false;
              return true;
            }).map(group => (
                <div key={group.module} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-2">{group.module}</h3>
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

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setPermissions([]); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm transition-colors min-w-[150px]"
                  >
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rolę')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        <div className="overflow-x-auto">
<div className="lg:hidden flex flex-col gap-1.5 p-2">
    {roles.length === 0 ? (
      <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak danych.</div>
    ) : (
      roles.map(item => (
        
<div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col">
  <h4 className="font-bold text-[#002b5e] text-base mb-1">{item.name || 'Bez nazwy'}</h4>
  <div className="text-xs text-gray-500 mb-1 font-bold uppercase">Dostępne zakładki:</div>
  <div className="flex flex-wrap gap-1 mb-1">
    {(item.permissions || []).map(p => {
       const tabLabel = ['dashboard_tickets','dashboard_planned','tickets','planned_maintenance','action_items','machines','regions','services','users','roles','settings','reports','archive','archive_planned'].includes(p) ? p : p;
       return <span key={p} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-blue-100">{tabLabel}</span>;
    })}
  </div>
  <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
    <button onClick={() => { handleEdit(item); }} className="p-2 bg-gray-100 text-gray-700 rounded-lg flex-1 font-bold text-xs"><i className="ph ph-pencil-simple"></i> Edytuj</button>
    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs w-10"><i className="ph ph-trash"></i></button>
  </div>
</div>

      ))
    )}
  </div>
  <table className="w-full text-left hidden lg:table border-collapse hidden lg:table">
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
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleEdit(r)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                          <i className="ph ph-pencil-simple"></i> Edytuj
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                          <i className="ph ph-trash"></i> Usuń
                        </button>
                      </div>
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
