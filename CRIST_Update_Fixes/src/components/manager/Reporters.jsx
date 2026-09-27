import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Reporters() {
  const [reporters, setReporters] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim()
      };
      if (editingId) {
        await updateDoc(doc(db, 'reporters', editingId), payload);
      } else {
        await addDoc(collection(db, 'reporters'), payload);
      }
      setName('');
      setPhone('');
      setPosition('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, reporterName) => {
    if (window.confirm(`Czy na pewno chcesz usunąć pracownika: ${reporterName}?`)) {
      try {
        await updateDoc(doc(db, 'reporters', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      } catch (err) {
        alert("Błąd podczas usuwania: " + err.message);
      }
    }
  };

  const handleEdit = (r) => {
    setName(r.name);
    setPhone(r.phone);
    setPosition(r.position || '');
    setEditingId(r.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const sortedReporters = [...reporters].sort((a, b) => {
    const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
    const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
    if (aVerify && !bVerify) return -1;
    if (!aVerify && bVerify) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Pracownicy Zgłaszający</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj bazą osób zgłaszających awarie</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setPhone(''); setPosition(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
          <i className="ph ph-plus text-lg"></i> Dodaj Pracownika
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
                <i className="ph ph-user-plus text-blue-600"></i>
                {editingId ? 'Edytuj Pracownika' : 'Dodaj Nowego Pracownika'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              {error && <div className="mb-2 text-red-600 bg-red-50 p-3 rounded border border-red-100 font-bold">{error}</div>}
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Stanowisko</label>
            <input 
              type="text" 
              value={position} 
              onChange={(e) => setPosition(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Operator suwnicy" 
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
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100 w-full">
            <button 
              type="button" 
              onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setPhone(''); setPosition(''); }}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors min-w-[150px]"
            >
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj pracownika')}
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Lista Pracowników Zgłaszających</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {reporters.length}</span>
        </div>
        <div className="overflow-x-auto">
          
<div className="lg:hidden flex flex-col gap-1.5 p-2">
  {sortedReporters.length === 0 ? (
    <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak danych.</div>
  ) : (
    sortedReporters.map(item => {
    const isVerifying = (item.name || '').includes('(DO WERYFIKACJI)');
    return (
    <div key={item.id} className={`bg-white p-3 rounded-xl shadow-sm border flex flex-col relative ${isVerifying ? 'border-orange-500 border-l-4 bg-orange-50/50' : 'border-slate-200 border-l-4 border-l-[#002b5e]'}`}>
      {isVerifying && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white px-2.5 py-1 rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm">
          WERYFIKACJA
        </div>
      )}
        <h4 className="font-bold text-[#002b5e] text-base mb-1">{item.name || 'Bez nazwy'}</h4>
        <div className="text-sm space-y-1 mb-1">
          <div className="flex items-center gap-1.5"><i className="ph ph-briefcase text-gray-400"></i> {item.position || '-'}</div>
          <div className="flex items-center gap-1.5"><i className="ph ph-phone text-gray-400"></i> <span className="font-mono">{item.phone || '-'}</span></div>
        </div>
        <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
          <button onClick={() => handleEdit(item)} className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex-1 font-bold text-xs flex items-center justify-center gap-1"><i className="ph ph-pencil-simple"></i> Edytuj</button>
          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs w-10 flex items-center justify-center"><i className="ph ph-trash"></i></button>
        </div>
      </div>
      );
    })
  )}
</div>
<table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-4 border-b">Imię i Nazwisko</th>
                <th className="p-4 border-b">Stanowisko</th>
                <th className="p-4 border-b">Numer Telefonu</th>
                <th className="p-4 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {sortedReporters.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">Brak pracowników w bazie.</td>
                </tr>
              ) : (
                sortedReporters.map(r => (
    <tr key={r.id} className={"border-b border-gray-100 transition-colors " + ((r.name || '').includes('(DO WERYFIKACJI)') ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-blue-50')}>
                    <td className="p-4 font-semibold text-gray-800 text-base">{r.name}</td>
                    <td className="p-4 text-gray-700">{r.position || '-'}</td>
                    <td className="p-4 font-mono text-gray-600">{r.phone}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button 
                          onClick={() => handleEdit(r)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-2 px-4 rounded transition-colors inline-flex items-center gap-1.5"
                        >
                          <i className="ph ph-pencil-simple"></i>
                          Edytuj
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id, r.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2 px-4 rounded transition-colors inline-flex items-center gap-1.5"
                          title="Usuń pracownika"
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
