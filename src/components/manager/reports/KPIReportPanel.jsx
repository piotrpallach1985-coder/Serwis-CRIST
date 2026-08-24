import React, { useState } from 'react';
import { generateKPIReportPDF } from '../../../utils/reports/pdfKPIReport';
import { safeParseDate } from '../../../utils/dateHelpers';

export default function KPIReportPanel({ tickets, plannedServices, machines }) {
  const [reportPeriod, setReportPeriod] = useState('30'); // '30', '90', 'all'

  const handleDownloadPDF = () => {
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

    generateKPIReportPDF(filteredTickets, filteredServices, machines, title);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i className="ph ph-file-pdf text-red-600 text-2xl"></i>
          Raportowanie Zarządcze
        </h2>
        <p className="text-sm text-gray-500">Wygeneruj podsumowanie MTTR i statystyk awaryjności</p>
      </div>

      <div className="flex items-center gap-3">
        <select 
          value={reportPeriod} 
          onChange={e => setReportPeriod(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="30">Ostatnie 30 dni</option>
          <option value="90">Ostatnie 90 dni</option>
          <option value="all">Od początku systemu</option>
        </select>

        <button 
          onClick={handleDownloadPDF}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm"
        >
          <i className="ph ph-download-simple text-lg"></i>
          Pobierz PDF
        </button>
      </div>
    </div>
  );
}
