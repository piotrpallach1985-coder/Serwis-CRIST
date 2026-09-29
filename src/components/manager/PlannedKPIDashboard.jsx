import { useManagerStore } from '../../store/managerStore';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeParseDate } from '../../utils/dateHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { savePdfWithPrompt } from '../../utils/pdfHelper';
import { fetchHistoricServices } from '../../services/kpi.service';

export default function PlannedKPIDashboard() {
  const { t } = useTranslation();
  const machines = useManagerStore(state => state.machines);
  const plannedServices = useManagerStore(state => state.plannedServices);
  const regions = useManagerStore(state => state.regions);
  
  const [period, setPeriod] = useState('7');
  const [historicServices, setHistoricServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoric = async () => {
      setLoading(true);
      try {
        const docs = await fetchHistoricServices();
        setHistoricServices(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoric();
  }, []);

  const allServices = useMemo(() => [...plannedServices, ...historicServices], [plannedServices, historicServices]);

  const kpiData = useMemo(() => {
    const now = new Date();
    const daysToSubtract = parseInt(period, 10);
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    const relevant = allServices.filter(s => {
      const cDate = safeParseDate(s.createdAt);
      const compDate = safeParseDate(s.completedAt);
      const nextDate = safeParseDate(s.nextDate);
      return (cDate && cDate >= startDate) || 
             (compDate && compDate >= startDate) || 
             (nextDate && nextDate >= startDate);
    });

    const active = relevant.filter(s => s.status !== 'completed');
    const completed = relevant.filter(s => s.status === 'completed');
    const overdue = active.filter(s => {
      const date = safeParseDate(s.nextDate);
      return date && date < now;
    });

    // Czas realizacji (od nextDate do completionDate)
    let totalTime = 0;
    let completedWithTime = 0;
    completed.forEach(s => {
       if (s.nextDate && s.completedAt) {
         const start = safeParseDate(s.nextDate);
         const end = safeParseDate(s.completedAt);
         if (start && end) {
           const hours = (end - start) / (1000 * 60 * 60);
           if (hours > 0) {
             totalTime += hours;
             completedWithTime++;
           }
         }
       }
    });
    const avgTime = completedWithTime > 0 ? (totalTime / completedWithTime).toFixed(1) : 0;

    // Po regionach
    const byRegion = {};
    relevant.forEach(s => {
       const rId = s.regionId || machines.find(m => m.id === s.machineId)?.regionId || 'unknown';
       const rName = regions.find(r => r.id === rId)?.name || 'Nieznany rejon';
       if (!byRegion[rName]) byRegion[rName] = 0;
       byRegion[rName]++;
    });
    const regionChart = Object.keys(byRegion).map(k => ({ name: k, value: byRegion[k] }));

    // W czasie
    const timelineObj = {};
    const getSortKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    for (let i = daysToSubtract; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const strKey = getSortKey(d);
      const label = d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
      timelineObj[strKey] = { name: label, Zrealizowane: 0, Zaplanowane: 0 };
    }

    relevant.forEach(s => {
      if (s.status === 'completed') {
        const d = safeParseDate(s.completedAt);
        if (d) {
          const strKey = getSortKey(d);
          if (timelineObj[strKey]) timelineObj[strKey].Zrealizowane++;
        }
      }
      const pD = safeParseDate(s.nextDate);
      if (pD) {
        const strKey = getSortKey(pD);
        if (timelineObj[strKey]) timelineObj[strKey].Zaplanowane++;
      }
    });
    const timelineChart = Object.values(timelineObj);

    return {
       total: relevant.length,
       active: active.length,
       completed: completed.length,
       overdue: overdue.length,
       avgTime,
       regionChart,
       timelineChart
    };

  }, [allServices, period, regions, machines]);

  const generatePDF = async () => {
    const reportElement = document.getElementById('planned-kpi-report');
    if (!reportElement) return;

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Raport Serwisów Prewencyjnych", 14, 15);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 22);
      pdf.text(`Okres: Ostatnie ${period} dni`, 14, 27);
      
      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);
      
      savePdfWithPrompt(pdf, `Raport_Serwisow_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Błąd PDF:", error);
    }
  };

  if (loading) {
     return <div className="p-8 text-center text-gray-500 animate-pulse font-medium">Ładowanie archiwalnych serwisów...</div>;
  }

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 animate-fade-in relative text-[#111827]">
      <div className="bg-white border-b border-gray-200 p-4 md:px-6 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-20 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <i className="ph ph-chart-line-up text-blue-600"></i>
            {t('planned.kpi_title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t('planned.kpi_subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="7">{t('planned.last_7_days')}</option>
            <option value="30">{t('planned.last_30_days')}</option>
            <option value="90">{t('planned.last_90_days')}</option>
            <option value="365">{t('planned.last_year')}</option>
          </select>
          <button 
            onClick={generatePDF}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 justify-center"
          >
            <i className="ph ph-file-pdf text-lg"></i>
            {t('planned.generate_pdf')}
          </button>
        </div>
      </div>

      <div id="planned-kpi-report" className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full bg-[#f8f9fa]">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('planned.total_services')}</span>
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><i className="ph ph-list-dashes text-lg"></i></div>
            </div>
            <div className="relative z-10 text-3xl font-black text-slate-800">{kpiData.total}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('planned.completed')}</span>
              <div className="bg-green-100 p-2 rounded-lg text-green-600"><i className="ph ph-check-circle text-lg"></i></div>
            </div>
            <div className="relative z-10 text-3xl font-black text-slate-800">{kpiData.completed}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('planned.overdue')}</span>
              <div className="bg-red-100 p-2 rounded-lg text-red-600"><i className="ph ph-warning-circle text-lg"></i></div>
            </div>
            <div className="relative z-10 text-3xl font-black text-slate-800">{kpiData.overdue}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Średni czas zewłoki</span>
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><i className="ph ph-clock text-lg"></i></div>
            </div>
            <div className="relative z-10 text-3xl font-black text-slate-800">{kpiData.avgTime} <span className="text-sm text-slate-500 font-medium">{t('planned.hours')}</span></div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><i className="ph ph-calendar-blank text-blue-500"></i> {t('planned.completed_vs_planned')}</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData.timelineChart} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '3 3' }}
                  />
                  <Line type="monotone" dataKey={t('planned.completed')} stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey={t('planned.planned')} stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><i className="ph ph-map-pin text-blue-500"></i> {t('planned.services_by_region')}</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {kpiData.regionChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kpiData.regionChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {kpiData.regionChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 font-medium">{t('planned.no_data')}</div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
