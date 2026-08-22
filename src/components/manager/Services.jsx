import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Services({ services }) {
  const [newService, setNewService] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [editingId, setEditingId] = useState(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć dział "${name}" z bazy danych?\n(Historia powiązanych z nim napraw pozostanie nienaruszona)`)) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (error) {
        console.error('Błąd usuwania serwisu:', error);
        alert('Nie udało się usunąć serwisu.');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edytuj Dział Serwisu' : 'Dodaj Dział Serwisu'}</h3>
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
          <div className="flex justify-end gap-2">
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setNewService('');
                  setContactName('');
                  setContactEmail('');
                  setContactPhone('');
                }}
                className="px-6 py-3 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded font-medium transition-colors"
              >
                Anuluj
              </button>
            )}
            <button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded font-medium lg:w-48">
              {editingId ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
          Dostępne jednostki przypisania
        </div>
        <ul className="divide-y divide-gray-100">
          {services.map(s => (
            <li key={s.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <i className="ph ph-wrench"></i>
                </div>
                <span className="font-bold text-gray-800">{s.name}</span>
              </div>
              <div className="text-sm text-gray-600 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.contactName && <div><i className="ph ph-user mr-1 text-gray-400"></i> {s.contactName}</div>}
                {s.contactPhone && <div><i className="ph ph-phone mr-1 text-gray-400"></i> {s.contactPhone}</div>}
                {s.contactEmail && <div><i className="ph ph-envelope-simple mr-1 text-gray-400"></i> {s.contactEmail}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleEdit(s)}
                  className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors font-medium text-sm"
                >
                  Edytuj
                </button>
                <button 
                  onClick={() => handleDelete(s.id, s.name)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                  title="Usuń dział"
                >
                  <i className="ph ph-trash text-xl"></i>
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