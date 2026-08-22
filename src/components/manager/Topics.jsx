import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'topics'), (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return alert('Podaj treść tematu');
    
    setLoading(true);
    try {
      if (editingId) {
        import('firebase/firestore').then(({ updateDoc }) => {
          updateDoc(doc(db, 'topics', editingId), { text: newTopic.trim() });
        });
      } else {
        const newTopicRef = doc(collection(db, 'topics'));
        setDoc(newTopicRef, {
          text: newTopic.trim(),
        }).catch(err => console.error(err));
      }
      setNewTopic('');
      setEditingId(null);
    } catch (error) {
      console.error('Błąd dodawania tematu:', error);
      alert('Nie udało się dodać tematu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten temat z listy podpowiedzi?')) {
      await deleteDoc(doc(db, 'topics', id));
    }
  };

  const handleEdit = (t) => {
    setNewTopic(t.text);
    setEditingId(t.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dodajemy domyślne tematy, jeśli baza jest zupełnie pusta
  const handleSeedDefaults = async () => {
    const defaults = [
      "Awaria elektryczna / Brak zasilania",
      "Wyciek oleju / Awaria hydrauliki",
      "Problem z pneumatyką",
      "Uszkodzenie mechaniczne elementu",
      "Błąd sterownika / elektroniki",
      "Wymiana części eksploatacyjnych"
    ];
    for (const text of defaults) {
      const newDocRef = doc(collection(db, 'topics'));
      setDoc(newDocRef, { text }).catch(err => console.error(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="ph ph-plus-circle text-blue-600"></i>
          {editingId ? 'Edytuj temat podpowiedzi' : 'Dodaj nowy temat do podpowiedzi'}
        </h2>
        <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Treść zgłoszenia (Temat)</label>
            <input 
              type="text" 
              value={newTopic} 
              onChange={e => setNewTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Przepalona żarówka"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setNewTopic(''); }}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded transition-colors"
              >
                Anuluj
              </button>
            )}
            <button disabled={loading} className="w-full sm:w-auto bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50">
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz' : 'Dodaj temat')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Lista Zapisanych Tematów</h3>
          {topics.length === 0 && (
            <button onClick={handleSeedDefaults} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-200 transition-colors">
              Wgraj domyślne tematy
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-100">
          {topics.length === 0 ? (
            <li className="p-8 text-center text-gray-500">Brak zapisanych tematów. Wgraj domyślne lub dodaj własny.</li>
          ) : (
            topics.map(t => (
              <li key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <span className="font-medium text-gray-800">{t.text}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(t)}
                    className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors font-medium text-sm"
                  >
                    Edytuj
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                    title="Usuń"
                  >
                    <i className="ph ph-trash text-lg"></i>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
