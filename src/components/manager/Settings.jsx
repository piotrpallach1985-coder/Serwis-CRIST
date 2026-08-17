import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Settings() {
  const [archiveDelayDays, setArchiveDelayDays] = useState(14);
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.archiveDelayDays !== undefined) {
          setArchiveDelayDays(data.archiveDelayDays);
        }
        if (data.allowTicketDeletion !== undefined) {
          setAllowTicketDeletion(data.allowTicketDeletion);
        }
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, "settings", "general"), {
        archiveDelayDays: parseInt(archiveDelayDays, 10),
        allowTicketDeletion: allowTicketDeletion,
        plannedWarningDays: parseInt(plannedWarningDays, 10)
      }, { merge: true });
      setSuccessMsg('Ustawienia zostały zapisane!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Błąd zapisu ustawień:", error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Ustawienia Systemu</h2>
          <p className="text-sm text-gray-500 mt-1">Konfiguracja globalnych parametrów aplikacji.</p>
        </div>
      </div>

      <div className="p-6">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center gap-2">
            <i className="ph ph-check-circle text-xl"></i>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-xl space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 mb-2">Automatyczna Archiwizacja</h3>
            <p className="text-sm text-blue-800 mb-4">
              Zgłoszenia ze statusem "Zakończono" będą wyświetlane w Rejestrze Awarii przez określoną liczbę dni. 
              Po tym czasie znikną z głównej tabeli i będą dostępne tylko w Archiwum Zgłoszeń.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Czas do archiwizacji (w dniach)
              </label>
              <input
                type="number"
                min="0"
                value={archiveDelayDays}
                onChange={(e) => setArchiveDelayDays(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-lg p-5">
            <h3 className="font-bold text-red-900 mb-2">Czyszczenie Wpisów i Uprawnienia</h3>
            <p className="text-sm text-red-800 mb-4">
              Włączenie tej opcji pozwala osobom posiadającym rolę **Administratora** na trwałe usuwanie wybranych wpisów z Rejestru Awarii oraz Archiwum.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={allowTicketDeletion}
                onChange={(e) => setAllowTicketDeletion(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
              <span className="font-bold text-gray-800 text-sm">Zezwalaj Administratorowi na usuwanie zgłoszeń (Czyszczenie bazy)</span>
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-5">
            <h3 className="font-bold text-amber-900 mb-2">Ostrzeżenia Serwisu Planowanego</h3>
            <p className="text-sm text-amber-800 mb-4">
              Pinezki na mapie będą podświetlone na żółto, gdy zbliża się termin przeglądu.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Ostrzegaj na ile dni przed terminem:
              </label>
              <input
                type="number"
                min="0"
                value={plannedWarningDays}
                onChange={(e) => setPlannedWarningDays(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i className="ph ph-floppy-disk text-xl"></i>
            {loading ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
          </button>
        </form>
      </div>
    </div>
  );
}
