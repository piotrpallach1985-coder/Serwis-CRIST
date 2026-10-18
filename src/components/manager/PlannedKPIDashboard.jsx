import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis } from 'recharts';
import { fetchServerPlannedKPIStats } from '../../services/kpi.service';
import { useTileLayout } from '../../hooks/useTileLayout';
import CustomizableTileGrid, { TileLayoutButton } from '../shared/CustomizableTileGrid';

export default function PlannedKPIDashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30');
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPI = async () => {
      setLoading(true);
      try {
        const data = await fetchServerPlannedKPIStats(period);
        setKpiData(data);
      } catch (err) {
        console.error('Planned KPI fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPI();
  }, [period]);

  const {
    totalServicesCount = 0,
    completedCount = 0,
    overdueCount = 0,
    onTimePercentage = 0,
    typeCounts = { calendar: 0, hours: 0, mixed: 0 },
    trendData = [],
  } = kpiData || {};

  const typeChartData = [
    { name: t('planned.dashboard.types.calendar', 'Kalendarz'), value: typeCounts.calendar || 0, color: '#3b82f6' },
    { name: t('planned.dashboard.types.hours', 'Motogodziny'), value: typeCounts.hours || 0, color: '#f59e0b' },
    { name: t('planned.dashboard.types.mixed', 'Mieszane'), value: typeCounts.mixed || 0, color: '#10b981' },
  ].filter(d => d.value > 0);

  const tiles = useMemo(
    () => [
      {
        id: 'planned_kpi_summary',
        title: 'Podsumowanie wskaźników serwisów',
        icon: 'ph-gauge',
        defaultColSpan: 12,
        render: () => (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-6">
              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-wrench"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">
                    {totalServicesCount}
                  </div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    {t('planned.dashboard.stats.total', 'Wszystkich')}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-check-circle"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">
                    {completedCount}
                  </div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    {t('planned.dashboard.stats.completed', 'Wykonane')}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-clock-countdown"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">
                    {overdueCount}
                  </div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    {t('planned.dashboard.stats.overdue', 'Po terminie')}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 p-2 lg:p-5 rounded-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 text-center lg:text-left">
                <div className="w-8 h-8 lg:w-14 lg:h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg lg:text-3xl shrink-0">
                  <i className="ph ph-chart-line-up"></i>
                </div>
                <div>
                  <div className="text-lg lg:text-3xl font-bold text-gray-800 leading-tight">
                    {onTimePercentage}%
                  </div>
                  <div className="text-[9px] lg:text-sm font-medium text-gray-500 uppercase tracking-wider lg:tracking-wide leading-tight">
                    {t('planned.dashboard.stats.onTimePercentage', 'Terminowość')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'planned_kpi_types',
        title: t('planned.dashboard.charts.typeDistribution', 'Podział wg wyzwalacza'),
        icon: 'ph-chart-pie-slice',
        defaultColSpan: 6,
        render: () => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i className="ph ph-chart-pie-slice text-lg text-indigo-600"></i>
              {t('planned.dashboard.charts.typeDistribution', 'Podział wg wyzwalacza')}
            </h3>
            <div className="h-64 w-full">
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {t('planned.dashboard.noData', 'Brak danych')}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'planned_kpi_trend',
        title: t('planned.dashboard.charts.trend', 'Trend Wykonywania (Ilość w czasie)'),
        icon: 'ph-chart-line-up',
        defaultColSpan: 6,
        render: () => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i className="ph ph-chart-line-up text-lg text-indigo-600"></i>
              {t('planned.dashboard.charts.trend', 'Trend Wykonywania (Ilość w czasie)')}
            </h3>
            <div className="h-64 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={value => [value, t('planned.dashboard.stats.completed')]} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {t('planned.dashboard.noDataPeriod', 'Brak danych (Ostatnie 30 dni)')}
                </div>
              )}
            </div>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalServicesCount, completedCount, overdueCount, onTimePercentage, typeChartData, trendData, t]
  );

  const tileLayout = useTileLayout('kpi_planned', tiles);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <i className="ph ph-calendar-check text-indigo-300"></i>{' '}
            {t('planned.dashboard.title', 'KPI Serwisów Planowanych')}
          </h1>
          <p className="text-indigo-100 text-sm lg:text-base opacity-90">
            {t('planned.dashboard.subtitle', 'Statystyki generowane na bieżąco na serwerze')}
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
            onChange={e => setPeriod(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full sm:w-auto cursor-pointer text-sm font-semibold"
          >
            <option value="7" className="text-gray-800">
              {t('planned.dashboard.periods.7days', 'Ostatnie 7 dni')}
            </option>
            <option value="30" className="text-gray-800">
              {t('planned.dashboard.periods.30days', 'Ostatnie 30 dni')}
            </option>
            <option value="90" className="text-gray-800">
              {t('planned.dashboard.periods.90days', 'Ostatnie 90 dni')}
            </option>
            <option value="all" className="text-gray-800">
              {t('planned.dashboard.periods.all', 'Cały okres')}
            </option>
          </select>
        </div>
      </div>

      <CustomizableTileGrid tiles={tiles} layoutState={tileLayout} />
    </div>
  );
}
