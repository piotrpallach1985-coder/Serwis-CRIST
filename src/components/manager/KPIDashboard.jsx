import { useManagerStore } from '../../store/managerStore';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { TICKET_STATUS } from '../../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';


export default function KPIDashboard() {
  const tickets = useManagerStore(state => state.tickets);
  const machines = useManagerStore(state => state.machines);
  const reporters = useManagerStore(state => state.reporters);
  const services = useManagerStore(state => state.services);
  const plannedServices = useManagerStore(state => state.plannedServices);
  const notifications = useManagerStore(state => state.notifications);
  const actionItems = useManagerStore(state => state.actionItems);
  const roles = useManagerStore(state => state.roles);
  const regions = useManagerStore(state => state.regions);
  const allowTicketDeletion = useManagerStore(state => state.allowTicketDeletion);
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays);
  const branding = useManagerStore(state => state.branding);

  const [period, setPeriod] = useState('7');

  const [historicalTickets, setHistoricalTickets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'tickets'));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted && x.status === TICKET_STATUS.CLOSED);
        setHistoricalTickets(docs);
      } catch (err) {
        console.error("Błąd pobierania historii KPI:", err);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, []);

  const allTicketsForKPI = useMemo(() => {
    // Combine active tickets (passed via props) with historical closed tickets
    const activeMap = new Map(tickets.map(t => [t.id, t]));
    historicalTickets.forEach(t => {
      if (!activeMap.has(t.id)) activeMap.set(t.id, t);
    });
    return Array.from(activeMap.values());
  }, [tickets, historicalTickets]);

  const filteredTickets = useMemo(() => {
    return allTicketsForKPI.filter(t => {
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
  }, [allTicketsForKPI, period]);

  // 1. Podstawowe statystyki
  const totalTickets = filteredTickets.length;
  const closedTickets = filteredTickets.filter(t => t.status === TICKET_STATUS.CLOSED);
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

  const sortedMachines = Object.entries(machineFaultCounts).sort((a, b) => b[1] - a[1]);
  const topMachinesData = sortedMachines.slice(0, 5).map(([name, count]) => ({ name, count })).reverse();

  // 4. Status zgłoszeń (Pie Chart)
  const statusCounts = filteredTickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  
  const statusData = [
    { name: 'Otwarte', value: statusCounts[TICKET_STATUS.OPEN] || 0, color: '#f43f5e' },
    { name: 'W trakcie', value: statusCounts[TICKET_STATUS.IN_PROGRESS] || 0, color: '#f59e0b' },
    { name: 'Zamknięte', value: statusCounts[TICKET_STATUS.CLOSED] || 0, color: '#10b981' },
  ].filter(s => s.value > 0);

  // 5. Trend (Line Chart)
  const trendData = useMemo(() => {
    const counts = {};
    filteredTickets.forEach(t => {
      const date = safeParseDate(t.createdAt);
      if (!date) return;
      const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count })).slice(-10);
  }, [filteredTickets]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      
      {/* Header i Filtry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard KPI</h2>
        <div className="flex items-center gap-3">
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
      </div>

      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6">
        
        {/* Kafel: Wszystkie Zgłoszenia */}
        <div className="bg-white p-2 lg:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
          <div className="w-8 h-8 lg:w-14 lg:h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
            <i className="ph ph-files"></i>
          </div>
          <div>
            <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{totalTickets}</div>
            <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">Ilość zgłoszeń</div>
          </div>
        </div>

        {/* Kafel zgłoszeń krytycznych */}
        <div className="bg-white p-2 lg:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
          <div className="w-8 h-8 lg:w-14 lg:h-14 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
            <i className="ph ph-warning-octagon"></i>
          </div>
          <div>
            <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{criticalTickets.length}</div>
            <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">Awarii krytycznych</div>
          </div>
        </div>

        {/* Kafel: Zgłoszenia zamknięte */}
        <div className="bg-white p-2 lg:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
          <div className="w-8 h-8 lg:w-14 lg:h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
            <i className="ph ph-check-circle"></i>
          </div>
          <div>
            <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{closedTickets.length}</div>
            <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">Zgłoszeń zamkniętych</div>
          </div>
        </div>

        {/* Kafel MTTR */}
        <div className="bg-white p-2 lg:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
          <div className="w-8 h-8 lg:w-14 lg:h-14 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
            <i className="ph ph-timer"></i>
          </div>
          <div>
            <div className="text-base lg:text-2xl font-bold text-gray-800 leading-tight">
              {avgHours}g {avgMins}m
            </div>
            <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">Średni czas (MTTR)</div>
          </div>
        </div>

        {/* Kafel skuteczności zamknięć */}
        <div className="bg-white p-2 lg:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
          <div className="w-8 h-8 lg:w-14 lg:h-14 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
            <i className="ph ph-chart-pie-slice"></i>
          </div>
          <div>
            <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">
              {totalTickets > 0 ? Math.round((closedTickets.length / totalTickets) * 100) : 0}%
            </div>
            <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">Wskaźnik zamknięć</div>
          </div>
        </div>

      </div>


      {/* WYKRESY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Wykres - Najbardziej awaryjne maszyny */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="ph ph-chart-bar text-lg text-blue-600"></i>
            Top 5 Najbardziej Awaryjnych Maszyn
          </h3>
          <div className="h-64 w-full">
            {topMachinesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMachinesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [value, 'Awarie']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Brak danych</div>
            )}
          </div>
        </div>

        {/* Wykres - Status zgłoszeń */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="ph ph-chart-pie-slice text-lg text-blue-600"></i>
            Status Zgłoszeń
          </h3>
          <div className="h-64 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Brak danych</div>
            )}
          </div>
        </div>
        
        {/* Wykres - Trend Zgłoszeń */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 lg:col-span-2">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="ph ph-chart-line-up text-lg text-blue-600"></i>
            Trend Zgłoszeń (Ilość awarii w czasie)
          </h3>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [value, 'Awarie']} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Brak danych</div>
            )}
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
            sortedMachines.slice(0, 5).map(([name, count], index) => (
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
