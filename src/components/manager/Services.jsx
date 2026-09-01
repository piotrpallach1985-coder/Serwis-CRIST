import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Services({ services }) {
  const [newService, setNewService] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').substring(0, 9);
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handlePhoneChange = (e) => {
    setContactPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), {
          name: newService.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim()
        });
      } else {
        await addDoc(collection(db, 'services'), { 
          name: newService.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim()
        });
      }
      setNewService('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisywania serwisu:", error);
    }
  };

  const handleEdit = (s) => {
    setNewService(s.name);
    setContactName(s.contactName || '');
    setContactEmail(s.contactEmail || '');
    setContactPhone(s.contactPhone || '');
    setEditingId(s.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć dział "${name}" z bazy danych?\n(Historia powiązanych z nim napraw pozostanie nienaruszona)`)) {
      try {
        await updateDoc(doc(db, 'services', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      } catch (error) {
        console.error('Błąd usuwania serwisu:', error);
        alert('Nie udało się usunąć serwisu.');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Podwykonawcy / Serwis</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj dostępnymi jednostkami, do których można przypisać awarię</p>
        </div>
        <button onClick={() => { setEditingId(null); setNewService(''); setContactName(''); setContactEmail(''); setContactPhone(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Serwis
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800">
                {editingId ? 'Edytuj Serwis / Podwykonawcę' : 'Dodaj Serwis / Podwykonawcę'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <input 
              type="text" 
              placeholder="Nazwa działu (np. Elektrycy)" 
              value={newService} 
              onChange={e => setNewService(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
              required 
            />
            <input 
              type="text" 
              placeholder="Osoba kontaktowa (Opcjonalnie)" 
              value={contactName} 
              onChange={e => setContactName(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="email" 
              placeholder="Adres e-mail (Opcjonalnie)" 
              value={contactEmail} 
              onChange={e => setContactEmail(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="tel" 
              placeholder="Telefon (np. 123 456 789)" 
              value={contactPhone} 
              onChange={handlePhoneChange} 
              pattern="^(\d{3}\s?){3}$"
              title="Wymagane 9 cyfr"
              className="p-3 border rounded outline-none focus:border-blue-900" 
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setNewService('');
                  setContactName('');
                  setContactEmail('');
                  setContactPhone('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
              >
                Anuluj
              </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors min-w-[120px]">
              {editingId ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
          Dostępne jednostki przypisania
        </div>
        <ul className="divide-y divide-gray-100 p-2 md:p-0 flex flex-col gap-2 md:block">
          {services.map(s => (
            <li key={s.id} className="p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border border-gray-200 md:border-0 rounded-xl md:rounded-none bg-white">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <i className="ph ph-wrench"></i>
                </div>
                <span className="font-bold text-gray-800">{s.name}</span>
              </div>
              <div className="text-sm text-gray-600 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><i className="ph ph-user mr-1 text-gray-400"></i> {s.contactName || '-'}</div>
                <div><i className="ph ph-phone mr-1 text-gray-400"></i> {s.contactPhone || '-'}</div>
                <div><i className="ph ph-envelope-simple mr-1 text-gray-400"></i> {s.contactEmail || '-'}</div>
              </div>
              <div className="flex justify-end gap-1.5 mt-2 md:mt-0 border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
                  <button onClick={() => handleEdit(s)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs">
                    <i className="ph ph-pencil-simple"></i> Edytuj
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs">
                    <i className="ph ph-trash"></i> Usuń
                  </button>
                </div>
            </li>
          ))}
          {services.length === 0 && (
            <li className="p-4 text-gray-500 text-center">Brak zdefiniowanych serwisów.</li>
          )}
        </ul>
      </div>
    </div>
  );
}