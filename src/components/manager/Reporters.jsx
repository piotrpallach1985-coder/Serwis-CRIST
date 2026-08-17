import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Reporters() {
  const [reporters, setReporters] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'reporters'), {
        name: name.trim(),
        phone: phone.trim()
      });
      setName('');
      setPhone('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, reporterName) => {
    if (window.confirm(`Czy na pewno chcesz usunąć pracownika: ${reporterName}?`)) {
      try {
        await deleteDoc(doc(db, 'reporters', id));
      } catch (err) {
        alert("Błąd podczas usuwania: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="ph ph-user-plus text-blue-600"></i>
          Dodaj Nowego Pracownika do Bazy Zgłaszających
        </h2>
        {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}
        
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Jan Kowalski" 
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer Telefonu</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 9);
                let formatted = val;
                if (val.length > 3 && val.length <= 6) {
                  formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
                } else if (val.length > 6) {
                  formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
                }
                setPhone(formatted);
              }}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. 500 600 700" 
              pattern="[0-9]{3} [0-9]{3} [0-9]{3}"
              minLength={11}
              maxLength={11}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded transition-colors whitespace-nowrap"
          >
            {loading ? 'Dodawanie...' : 'Dodaj pracownika'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Lista Pracowników Zgłaszających</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {reporters.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-4 border-b">Imię i Nazwisko</th>
                <th className="p-4 border-b">Numer Telefonu</th>
                <th className="p-4 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {reporters.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">Brak pracowników w bazie.</td>
                </tr>
              ) : (
                reporters.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800 text-base">{r.name}</td>
                    <td className="p-4 font-mono text-gray-600">{r.phone}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(r.id, r.name)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2 px-4 rounded transition-colors inline-flex items-center gap-2"
                        title="Usuń pracownika"
                      >
                        <i className="ph ph-trash"></i>
                        Usuń
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
