import React, { useState } from 'react';
import { generateKPIReportPDF } from '../../../utils/reports/pdfKPIReport';
import { safeParseDate } from '../../../utils/dateHelpers';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function KPIReportPanel({ machines }) {
  const [reportPeriod, setReportPeriod] = useState('30'); // '30', '90', 'all'
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // Pobieranie wszystkich danych na żądanie (w tym zamkniętych awarii)
      const ticketsSnap = await getDocs(collection(db, 'tickets'));
      const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
      
      const plannedSnap = await getDocs(collection(db, 'planned_services'));
      const plannedServices = plannedSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.isDeleted);

      const now = new Date();
      let filteredTickets = tickets;
      let filteredServices = plannedServices;
      let title = 'Wszystkie dane historyczne';

      if (reportPeriod !== 'all') {
        const days = parseInt(reportPeriod, 10);
        const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        filteredTickets = tickets.filter(t => {
          const d = safeParseDate(t.closedAt || t.createdAt);
          return d && d >= pastDate;
        });
        
        filteredServices = plannedServices.filter(s => {
          const d = safeParseDate(s.completedAt || s.createdAt);
          return d && d >= pastDate;
        });

        title = `Ostatnie ${days} dni`;
      }

      await generateKPIReportPDF(filteredTickets, filteredServices, machines, title);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas generowania raportu PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i className="ph ph-file-pdf text-red-600 text-2xl"></i>
          Raport KPI (PDF)
        </h2>
        <p className="text-sm text-gray-500 max-w-2xl mt-1">
          Wizualny raport podsumowujący statystyki, MTTR (Średni czas naprawy), czasy reakcji i statusy serwisów dla zarządu.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Okres:</label>
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="border-gray-300 rounded-md text-sm shadow-sm focus:border-red-500 focus:ring-red-500 bg-gray-50 p-1.5"
          >
            <option value="30">Ostatnie 30 dni</option>
            <option value="90">Ostatnie 90 dni</option>
            <option value="all">Od początku (Wszystko)</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
        >
          {loading ? (
            <>
              <i className="ph ph-spinner animate-spin text-lg"></i> Pobieranie z bazy...
            </>
          ) : (
            <>
              <i className="ph ph-download-simple text-lg"></i> Generuj PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
