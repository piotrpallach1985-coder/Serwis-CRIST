import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
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
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRolesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return alert('Podaj e-mail i imię z nazwiskiem');
    if (!editingId && !password.trim()) return alert('Podaj hasło dla nowego użytkownika');
    
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
        setEmail('');
        setPassword('');
        setName('');
        setRole('admin');
        setPhone('');
      } else {
        // Tworzenie NOWEGO konta w bezpiecznym module Authentication
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), password.trim());
        const newUid = userCredential.user.uid;

        // Zapisanie roli i nazwy do bazy danych (BEZ HASŁA!)
        await setDoc(doc(db, 'users', newUid), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          phone: phone
        });

        setEmail('');
        setPassword('');
        setName('');
        setRole('admin');
        setPhone('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Ten e-mail jest już zarejestrowany w systemie.');
      } else if (err.code === 'auth/weak-password') {
        alert('Hasło jest za słabe. Musi mieć co najmniej 6 znaków.');
      } else {
        alert('Nie udało się zapisać użytkownika: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć uprawnienia tego użytkownika? Uwaga: Usunie to jego dostęp, ale samo konto logowania (Firebase Auth) musi zostać usunięte w panelu Firebase.')) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  const handleEdit = (u) => {
    setEmail(u.email);
    setPassword(''); // Hasła nie da się podejrzeć
    setName(u.name || '');
    setRole(u.role || 'admin');
    setPhone(u.phone || '');
    setEditingId(u.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
          <i className="ph ph-shield-check text-blue-600 text-2xl mt-0.5"></i>
          <div>
            <h4 className="font-bold text-blue-800 text-sm">System Bankowego Bezpieczeństwa (Firebase Auth) włączony</h4>
            <p className="text-blue-700 text-xs mt-1">Hasła są szyfrowane i niewidoczne dla nikogo. Dodając tutaj pracownika, tworzysz dla niego bezpieczne konto logowania.</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="ph ph-user-plus text-blue-600"></i>
          {editingId ? 'Edytuj Użytkownika' : 'Zarejestruj nowego użytkownika'}
        </h2>
        <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-4 items-end">
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
          {!editingId && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasło (min. 6 znaków)</label>
              <input 
                type="text" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. trudnehaslo123"
                required={!editingId}
              />
            </div>
          )}
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
          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setEmail('');
                  setPassword('');
                  setName('');
        setRole('admin');
        setPhone('');
                }}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded transition-colors"
              >
                Anuluj
              </button>
            )}
            <button disabled={loading} className="w-full sm:w-auto bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Autoryzowani użytkownicy</h3>
          <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded">
            Łącznie: {usersList.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Imię i Nazwisko</th>
                <th className="px-6 py-4">E-mail (Login)</th>
                <th className="px-6 py-4">Hasło</th>
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
                    <td className="px-6 py-4 text-green-600 font-bold text-sm">
                      <i className="ph ph-shield-check mr-1"></i>
                      Zaszyfrowane
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 
                         rolesList.find(r => r.id === u.role)?.name || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
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
