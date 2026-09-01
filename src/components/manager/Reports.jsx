import React, { useState, useEffect } from 'react';
import { generateAuditorReport } from '../../utils/reports/auditorExport';
import KPIReportPanel from './reports/KPIReportPanel';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Reports({ tickets, plannedServices, machines }) {
  const [loading, setLoading] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleGenerateAuditorReport = async () => {
    setLoading(true);
    try {
      await generateAuditorReport();
    } catch (err) {
      alert('Błąd podczas generowania raportu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveWarningDays = async (val) => {
    try {
      await setDoc(doc(db, "settings", "general"), {
        plannedWarningDays: parseInt(val, 10)
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Raportowanie oraz Ustawienia</h2>
          <p className="text-gray-500 mt-2">Dostęp do zaawansowanych raportów operacyjnych, zrzutów bazy danych oraz ustawień.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Panel PDF */}
        <KPIReportPanel machines={machines} />

        {/* Raport Audytorski */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="ph ph-file-xls text-blue-600 text-2xl"></i>
              Pełny Raport Audytorski (Baza Danych)
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              Kompletny zrzut awarii, serwisów i maszyn (wraz z usuniętymi obiektami). Idealny dla audytorów ISO, na wypadek kontroli wewnętrznej lub do analizy w Excelu.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAuditorReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
            >
              {loading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-lg"></i> Generowanie...
                </>
              ) : (
                <>
                  <i className="ph ph-download-simple text-lg"></i> Pobierz XLSX
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Ostrzeżenia Serwisu Planowanego (przeniesione z Ustawień) */}
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <i className="ph ph-warning-circle text-amber-600 text-2xl"></i>
              Ostrzeżenia Serwisu Planowanego
            </h2>
            <p className="text-sm text-amber-800 max-w-2xl mt-1">
              Pinezki na mapie będą podświetlone na żółto, gdy zbliża się termin przeglądu. Ustaw z jakim wyprzedzeniem system ma zacząć ostrzegać.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-sm">
            <input 
              type="number" 
              value={plannedWarningDays}
              onChange={(e) => {
                setPlannedWarningDays(e.target.value);
                saveWarningDays(e.target.value);
              }}
              min="1"
              max="365"
              className="w-20 font-bold text-amber-900 border-b-2 border-amber-300 focus:outline-none focus:border-amber-600 bg-transparent text-center"
            />
            <span className="text-amber-700 font-bold text-sm">Dni wcześniej</span>
          </div>
        </div>

      </div>
    </div>
  );
}
