import { useState, useMemo } from 'react';

export default function KPIDashboard({ tickets, machines }) {
  const [period, setPeriod] = useState('all');

  const safeParseDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (period === 'all') return true;
      const createdAt = safeParseDate(t.createdAt);
      if (!createdAt) return false;
      
      const now = new Date();
      if (period === 'month') {
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }
      if (period === 'prev_month') {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return createdAt.getMonth() === prevMonth.getMonth() && createdAt.getFullYear() === prevMonth.getFullYear();
      }
      
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (period === '7') return daysDiff <= 7;
      if (period === '30') return daysDiff <= 30;
      if (period === '90') return daysDiff <= 90;
      
      return true;
    });
  }, [tickets, period]);

  // 1. Podstawowe statystyki
  const totalTickets = filteredTickets.length;
  const closedTickets = filteredTickets.filter(t => t.status === 5);
  const criticalTickets = filteredTickets.filter(t => t.isCritical);

  // 2. Obliczanie średniego czasu naprawy (MTTR) w minutach dla zakończonych
  let totalRepairTimeMinutes = 0;
  closedTickets.forEach(t => {
    if (t.createdAt && t.closedAt) {
      const start = safeParseDate(t.createdAt);
      const end = safeParseDate(t.closedAt);
      if (start && end) {
        const diffMins = Math.floor((end - start) / 60000);
        if (diffMins > 0) totalRepairTimeMinutes += diffMins;
      }
    }
  });

  const avgRepairMinutes = closedTickets.length > 0 ? Math.round(totalRepairTimeMinutes / closedTickets.length) : 0;
  const avgHours = Math.floor(avgRepairMinutes / 60);
  const avgMins = avgRepairMinutes % 60;

  // 3. Maszyny z największą liczbą awarii
  const machineFaultCounts = {};
  filteredTickets.forEach(t => {
    const mName = t.machineName || 'Nieznana maszyna';
    machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;
  });

  const sortedMachines = Object.entries(machineFaultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 najbardziej awaryjnych

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Pasek filtrów */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="font-bold text-gray-700 flex items-center gap-2">
          <i className="ph ph-funnel text-lg"></i>
          Okres analizy:
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
        >
          <option value="all">Wszystkie zgłoszenia</option>
          <option value="7">Ostatnie 7 dni</option>
          <option value="30">Ostatnie 30 dni</option>
          <option value="90">Ostatnie 90 dni</option>
          <option value="month">Obecny miesiąc</option>
          <option value="prev_month">Poprzedni miesiąc</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Kafel MTTR */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-timer"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {avgHours}g {avgMins}m
            </div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Średni czas naprawy (MTTR)</div>
          </div>
        </div>

        {/* Kafel skuteczności zamknięć */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-chart-pie-slice"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {totalTickets > 0 ? Math.round((closedTickets.length / totalTickets) * 100) : 0}%
            </div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Wskaźnik zamknięć zgłoszeń</div>
          </div>
        </div>

        {/* Kafel zgłoszeń krytycznych */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-warning-octagon"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{criticalTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Awarii krytycznych (wybrany okres)</div>
          </div>
        </div>

      </div>

      {/* Tabela awaryjności maszyn */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
          <i className="ph ph-ranking text-lg text-blue-900"></i>
          Najbardziej awaryjne maszyny (Top 5 w wybranym okresie)
        </div>
        <div className="divide-y divide-gray-100">
          {sortedMachines.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Brak danych do wygenerowania statystyk maszyn.</div>
          ) : (
            sortedMachines.map(([name, count], index) => (
              <div key={name} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-800">{name}</span>
                </div>
                <span className="bg-gray-150 px-3 py-1 rounded text-sm font-semibold text-gray-700">
                  {count} {count === 1 ? 'zgłoszenie' : (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 'zgłoszenia' : 'zgłoszeń')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}