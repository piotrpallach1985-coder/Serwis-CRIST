import { useManagerStore } from '../../store/managerStore';
import { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { computeClientKPIStats, fetchServerKPIStats } from '../../services/kpi.service';
import { getTicketStatusConfig } from '../../utils/statusConfigs';
import { useTileLayout } from '../../hooks/useTileLayout';
import CustomizableTileGrid, { TileLayoutButton } from '../shared/CustomizableTileGrid';

export default function KPIDashboard() {
  const machines = useManagerStore(state => state.machines || []);
  const [period, setPeriod] = useState('30');
  const [kpiStats, setKpiStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const didAutoFallbackRef = useRef(false);

  useEffect(() => {
    let active = true;
    const fetchKPIs = async () => {
      setLoadingHistory(true);
      try {
        // Najpierw obliczamy dokładne statystyki bezpośrednio z kolekcji Firestore (z cache + serwer)
        let data = await computeClientKPIStats(period, machines);

        // Jeśli w domyślnym okresie 30 dni nie ma zgłoszeń, a w bazie istnieją starsze zgłoszenia, przełącz na 'all'
        if (
          active &&
          !didAutoFallbackRef.current &&
          period === '30' &&
          data &&
          data.totalTickets === 0 &&
          data.rawTotalAllTime > 0
        ) {
          didAutoFallbackRef.current = true;
          setPeriod('all');
          return;
        }

        if (!data) {
          data = await fetchServerKPIStats(period);
        }
        if (active) setKpiStats(data);
      } catch (err) {
        console.error('Błąd pobierania KPI:', err);
      } finally {
        if (active) setLoadingHistory(false);
      }
    };
    fetchKPIs();
    return () => {
      active = false;
    };
  }, [period, machines]);

  const totalTickets = kpiStats?.totalTickets || 0;
  const closedTicketsCount = kpiStats?.closedTicketsCount || 0;
  const criticalTicketsCount = kpiStats?.criticalTicketsCount || 0;
  const avgRepairMinutes = kpiStats?.avgRepairMinutes || 0;

  const avgHours = Math.floor(avgRepairMinutes / 60);
  const avgMins = avgRepairMinutes % 60;

  const topMachinesData = kpiStats?.topMachines || [];

  const ticketStatuses = getTicketStatusConfig();
  const statusData = Object.entries(kpiStats?.statusCounts || {})
    .map(([status, count]) => {
      const config = ticketStatuses[status] || { label: 'Inne', hex: '#ccc' };
      return {
        name: config.label,
        value: count,
        color: config.hex,
      };
    })
    .filter(d => d.value > 0);

  const trendData = kpiStats?.trendData || [];

  const tiles = useMemo(
    () => [
      {
        id: 'kpi_summary',
        title: 'Podsumowanie wskaźników KPI',
        icon: 'ph-gauge',
        defaultColSpan: 12,
        render: () => (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-6">
              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-ticket"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{totalTickets}</div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    Ilość zgłoszeń
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-warning-circle"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{criticalTicketsCount}</div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    Awarii krytycznych
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-check-circle"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">{closedTicketsCount}</div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    Zgłoszeń zamkniętych
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-timer"></i>
                </div>
                <div>
                  <div className="text-base lg:text-2xl font-bold text-gray-800 leading-tight">
                    {avgHours}g {avgMins}m
                  </div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    Średni czas (MTTR)
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'kpi_top_machines',
        title: 'Top 5 Najbardziej Awaryjnych Maszyn',
        icon: 'ph-chart-bar',
        defaultColSpan: 6,
        render: () => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i className="ph ph-chart-bar text-lg text-blue-600"></i>
              Top 5 Najbardziej Awaryjnych Maszyn
            </h3>
            <div className="h-64 w-full">
              {topMachinesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topMachinesData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={value => [value, 'Awarie']} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">Brak danych</div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'kpi_status_pie',
        title: 'Status Zgłoszeń',
        icon: 'ph-chart-pie-slice',
        defaultColSpan: 6,
        render: () => (
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
                      isAnimationActive={false}
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
        ),
      },
      {
        id: 'kpi_trend',
        title: 'Trend Zgłoszeń (Ilość awarii w czasie)',
        icon: 'ph-chart-line-up',
        defaultColSpan: 12,
        render: () => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
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
                    <Tooltip formatter={value => [value, 'Awarie']} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Brak danych w wybranym okresie
                </div>
              )}
            </div>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalTickets, criticalTicketsCount, closedTicketsCount, avgHours, avgMins, topMachinesData, statusData, trendData]
  );

  const tileLayout = useTileLayout('kpi_tickets', tiles);

  if (loadingHistory) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl min-w-0 mx-auto space-y-6 pb-20">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mb-1 sm:mb-2 flex items-center gap-2.5 sm:gap-3 break-words">
            <i className="ph ph-chart-line-up text-blue-300 shrink-0"></i> Dashboard KPI (Awarie)
          </h1>
          <p className="text-blue-100 text-sm lg:text-base opacity-90">
            Statystyki awarii, czasy reakcji (MTTR) i rozkład zgłoszeń
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <TileLayoutButton
            isEditing={tileLayout.isEditing}
            setIsEditing={tileLayout.setIsEditing}
            resetLayout={tileLayout.resetLayout}
          />
          <select
            value={period}
            onChange={e => {
              didAutoFallbackRef.current = true;
              setPeriod(e.target.value);
            }}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto cursor-pointer text-sm font-semibold"
          >
            <option value="7" className="text-gray-800">Ostatnie 7 dni</option>
            <option value="30" className="text-gray-800">Ostatnie 30 dni</option>
            <option value="90" className="text-gray-800">Ostatnie 90 dni</option>
            <option value="all" className="text-gray-800">Od początku</option>
          </select>
        </div>
      </div>

      <CustomizableTileGrid tiles={tiles} layoutState={tileLayout} />
    </div>
  );
}
