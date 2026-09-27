import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '../../firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Inicjalizacja dodatkowej instancji Firebase Auth tylko do tworzenia kont,
// aby nie wylogowało aktualnie zalogowanego Managera
let secondaryApp;
const apps = getApps();
const existingApp = apps.find(app => app.name === 'SecondaryApp');
if (existingApp) {
  secondaryApp = existingApp;
} else {
  secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
}
const secondaryAuth = getAuth(secondaryApp);

export default function Users() {
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRolesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return alert('Podaj e-mail i imię z nazwiskiem');
    setLoading(true);
    try {
      if (editingId) {
        // Zmiana nazwy/roli istniejącego usera
        await updateDoc(doc(db, 'users', editingId), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          phone: phone
        });
        setEditingId(null);
        setIsFormOpen(false);
        setEmail('');
        
        setName('');
        setRole('admin');
        setPhone('');
      } else {
        // Tworzenie NOWEGO konta w bezpiecznym module Authentication
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), Math.random().toString(36).slice(-10) + "Aa1!");
        const newUid = userCredential.user.uid;

        // Zapisanie roli i nazwy do bazy danych (BEZ HASŁA!)
        await setDoc(doc(db, 'users', newUid), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          phone: phone
        });

        setEmail('');
        
        setName('');
        setRole('admin');
        setPhone('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Ten e-mail jest już zarejestrowany w systemie.'); } else {
        alert('Nie udało się zapisać użytkownika: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć uprawnienia tego użytkownika? Uwaga: Usunie to jego dostęp, ale samo konto logowania (Firebase Auth) musi zostać usunięte w panelu Firebase.')) {
      await updateDoc(doc(db, 'users', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
    }
  };

  const handleEdit = (u) => {
    setEmail(u.email);
     // Hasła nie da się podejrzeć
    setName(u.name || '');
    setRole(u.role || 'admin');
    setPhone(u.phone || '');
    setEditingId(u.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Użytkownicy (Konta dostępowe)</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj autoryzowanymi użytkownikami systemu (logowanie, aplikacja)</p>
        </div>
        <button onClick={() => { setEditingId(null); setEmail('');  setName(''); setRole('admin'); setPhone(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
          <i className="ph ph-plus text-lg"></i> Dodaj Użytkownika
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[10000] pb-24 md:pb-4 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
                <i className="ph ph-shield-check text-blue-600"></i>
                {editingId ? 'Edytuj Użytkownika' : 'Zarejestruj nowego użytkownika'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <i className="ph ph-info text-blue-600 text-xl mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-blue-800 text-sm">System Bezpieczeństwa (Firebase Auth)</h4>
                  <p className="text-blue-700 text-xs mt-1">Hasła są szyfrowane. Tworząc pracownika, nadajesz mu dostęp do platformy.</p>
                </div>
              </div>
              <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Jan Kowalski"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres e-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. jan@crist.pl"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer telefonu</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => {
                let val = e.target.value.replace(/[^\d]/g, '');
                if (val.length > 3) val = val.slice(0,3) + ' ' + val.slice(3);
                if (val.length > 7) val = val.slice(0,7) + ' ' + val.slice(7);
                if (val.length > 11) val = val.slice(0, 11);
                setPhone(val);
              }}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="xxx xxx xxx"
              pattern="\d{3} \d{3} \d{3}"
              title="Format: xxx xxx xxx"
              required
            />
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Uprawnienia</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="admin">Pełny Administrator (Systemowa)</option>
              {rolesList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100 w-full">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setEmail('');
                      
                      setName('');
                      setRole('admin');
                      setPhone('');
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Autoryzowani użytkownicy</h3>
          <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded">
            Łącznie: {usersList.length}
          </span>
        </div>
        <div className="overflow-x-auto">
<div className="lg:hidden flex flex-col gap-1.5 p-2">
    {usersList.length === 0 ? (
      <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak danych.</div>
    ) : (
      usersList.map(item => (
        
<div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col">
  <div className="flex items-center gap-1.5 mb-2">
    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
      {(item.name || 'U').charAt(0).toUpperCase()}
    </div>
    <div>
      <h4 className="font-bold text-[#002b5e] text-base">{item.name || 'Brak imienia'}</h4>
      <p className="text-xs text-gray-500">{item.email}</p>
    </div>
  </div>
  <div className="text-sm space-y-1 mb-1">
    <div className="flex items-center gap-1.5"><i className="ph ph-phone text-gray-400"></i> {item.phone || '-'}</div>
    <div className="flex items-center gap-1.5"><i className="ph ph-shield-check text-gray-400"></i> Rola: <span className="font-bold">{item.role === 'admin' ? 'Administrator' : (rolesList.find(r => r.id === item.role)?.name || item.role)}</span></div>
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
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Imię i Nazwisko</th>
                <th className="px-6 py-4">E-mail (Login)</th>
                
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rola</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Brak użytkowników. Dodaj pierwszego powyżej.
                  </td>
                </tr>
              ) : (
                usersList.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    
                      <td className="px-6 py-4 text-gray-600">{u.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 
                         rolesList.find(r => r.id === u.role)?.name || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                      >
                        <i className="ph ph-pencil-simple"></i>
                        Edytuj
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                        title="Usuń"
                      >
                        <i className="ph ph-trash"></i>
                        Usuń
                      </button>
                    </div>
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
