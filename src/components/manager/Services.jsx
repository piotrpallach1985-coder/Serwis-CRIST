import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Services({ services }) {
  const [newService, setNewService] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      await addDoc(collection(db, 'services'), { 
        name: newService.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim()
      });
      setNewService('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
    } catch (error) {
      console.error("Błąd dodawania serwisu:", error);
    }
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Dodaj Dział Serwisu</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Osoba kontaktowa (Imię i Nazwisko)" 
              value={contactName} 
              onChange={e => setContactName(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="email" 
              placeholder="Adres e-mail" 
              value={contactEmail} 
              onChange={e => setContactEmail(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="text" 
              placeholder="Numer telefonu" 
              value={contactPhone} 
              onChange={e => setContactPhone(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
          </div>
          <button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded font-medium w-full md:w-auto md:self-end">
            Dodaj
          </button>
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
              <button 
                onClick={() => handleDelete(s.id, s.name)}
                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors shrink-0"
                title="Usuń dział"
              >
                <i className="ph ph-trash text-xl"></i>
              </button>
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