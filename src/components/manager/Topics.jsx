import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import DictationButton from '../shared/DictationButton';
import { addTopic, updateTopic, checkTopicInUse } from '../../services/dictionary.service';

export default function Topics() {
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants', getCurrentTenant(), 'topics'), (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return alert('Podaj treść tematu');
    
    setLoading(true);
    try {
      if (editingId) {
        updateDoc(doc(db, 'tenants', getCurrentTenant(), 'topics', editingId), { text: newTopic.trim() });
      } else {
        const newTopicRef = doc(collection(db, 'tenants', getCurrentTenant(), 'topics'));
        setDoc(newTopicRef, {
          text: newTopic.trim(),
        }).catch(err => console.error(err));
      }
      setNewTopic('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (error) {
      console.error('Błąd dodawania tematu:', error);
      alert('Nie udało się dodać tematu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten temat z listy podpowiedzi?')) {
      await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'topics', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
    }
  };

  const handleEdit = (t) => {
    setNewTopic(t.text);
    setEditingId(t.id);
    setIsFormOpen(true);
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
      const newDocRef = doc(collection(db, 'tenants', getCurrentTenant(), 'topics'));
      setDoc(newDocRef, { text }).catch(err => console.error(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">{t("admin.topics.title")}</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">{t("admin.topics.subtitle")}</p>
        </div>
        <button onClick={() => { setEditingId(null); setNewTopic(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> {t("admin.topics.add_topic")}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <i className="ph ph-chat-text text-blue-600"></i>
                {editingId ? t("admin.topics.edit_topic") : t("admin.topics.add_new_topic")}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.topics.topic_content")}</label>
            <div className="relative">
              <input 
                type="text" 
                value={newTopic} 
                onChange={e => setNewTopic(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                placeholder="np. Przepalona żarówka"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DictationButton onResult={(text) => setNewTopic(prev => prev ? prev + ' ' + text : text)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setNewTopic(''); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                    {loading ? t('admin.topics.saving') : (editingId ? t('admin.topics.save') : t('admin.topics.add_topic'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">{t("admin.topics.saved_topics_list")}</h3>
          {topics.length === 0 && (
            <button onClick={handleSeedDefaults} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-200 transition-colors">
              {t("admin.topics.load_defaults")}
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-100 p-2 md:p-0 flex flex-col gap-2 md:block">
          {topics.length === 0 ? (
            <li className="p-8 text-center text-gray-500">{t("admin.topics.empty_list")}</li>
          ) : (
            topics.map(topic => (
              <li key={topic.id} className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hover:bg-gray-50 border border-gray-200 md:border-0 rounded-xl md:rounded-none bg-white">
                <span className="font-medium text-gray-800">{topic.text}</span>
                <div className="flex justify-end gap-1.5 mt-2 md:mt-0 border-t md:border-t-0 border-gray-100 pt-2 md:pt-0 w-full md:w-auto">
                    <button onClick={() => handleEdit(topic)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded-lg md:rounded transition-colors flex-1 md:flex-none justify-center flex items-center gap-1 text-xs md:text-sm">
                      <i className="ph ph-pencil-simple"></i> {t("admin.users.edit")}
                    </button>
                    <button onClick={() => handleDelete(topic.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded-lg md:rounded transition-colors flex-1 md:flex-none justify-center flex items-center gap-1 text-xs md:text-sm">
                      <i className="ph ph-trash"></i> {t("admin.users.delete")}
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
