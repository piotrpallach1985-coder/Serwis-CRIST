import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Users() {
  const [usersList, setUsersList] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('operator');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim()) return alert('Podaj e-mail, hasło i imię z nazwiskiem');
    
    setLoading(true);
    try {
      const newUserRef = doc(collection(db, 'users'));
      setDoc(newUserRef, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        role: role
      }).catch(err => console.error(err));
      
      setEmail('');
      setPassword('');
      setName('');
      setRole('operator');
    } catch (error) {
      console.error('Błąd dodawania użytkownika:', error);
      alert('Nie udało się dodać użytkownika.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika ze spisu autoryzowanego dostępu?')) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="ph ph-user-plus text-blue-600"></i>
          Zarejestruj nowego użytkownika
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
            <input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. trudnehaslo123"
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
              <option value="operator">Operator (Zgłaszający)</option>
              <option value="manager">Dyspozytor UT (Zarządzający)</option>
              <option value="admin">Administrator (Pełen dostęp)</option>
            </select>
          </div>
          <button disabled={loading} className="w-full sm:w-auto bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50">
            {loading ? 'Dodawanie...' : 'Zapisz'}
          </button>
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
                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">{u.password || '---'}</td>
                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded text-xs">Administrator</span>
                      ) : u.role === 'manager' ? (
                        <span className="bg-purple-100 text-purple-800 font-bold px-2 py-1 rounded text-xs">Dyspozytor UT</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-xs">Operator</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Usuń dostęp"
                      >
                        <i className="ph ph-trash text-lg"></i>
                      </button>
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
