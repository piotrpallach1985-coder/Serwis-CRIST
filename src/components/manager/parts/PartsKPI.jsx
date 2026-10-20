import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../../store/managerStore';

export default function PartsKPI() {
  const { t } = useTranslation();
  const parts = useManagerStore(state => state.parts || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);

  const stats = useMemo(() => {
    const totalIndices = parts.length;
    let lowStock = 0;
    let outOfStock = 0;
    let totalReservedItems = 0;
    let totalValue = 0;

    parts.forEach(p => {
      let reserved = 0;
      plannedServices.filter(s => s.status !== 'completed').forEach(s => {
        if (s.requiredParts) {
          const req = s.requiredParts.find(rp => rp.partId === p.id);
          if (req) reserved += Number(req.quantity || 0);
        }
      });
      const available = Number(p.stock) - reserved;

      if (available <= 0) outOfStock++;
      else if (available < Number(p.minStock)) lowStock++;

      totalReservedItems += reserved;
      totalValue += Number(p.stock) * Number(p.unitPrice || 0);
    });

    return { totalIndices, lowStock, outOfStock, totalReservedItems, totalValue };
  }, [parts, plannedServices]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {t('parts.kpi_view.title', 'Status Magazynu / KPI')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('parts.kpi_view.subtitle', 'Podsumowanie stanów magazynowych na podstawie fizycznych ilości oraz aktywnych rezerwacji.')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <i className="ph ph-archive-box text-3xl"></i>
          </div>
          <div className="text-3xl font-black text-slate-800">{stats.totalIndices}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {t('parts.kpi_view.total_indices', 'Liczba Indeksów')}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4 relative">
            <i className="ph ph-warning-circle text-3xl"></i>
            {stats.lowStock > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>}
          </div>
          <div className="text-3xl font-black text-slate-800">{stats.lowStock}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {t('parts.kpi_view.low_stock', 'Niski Stan Magazynowy')}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mb-4 relative">
            <i className="ph ph-calendar-check text-3xl"></i>
          </div>
          <div className="text-3xl font-black text-slate-800">
            {stats.totalReservedItems} <span className="text-lg text-slate-400">{t('machines.details.pcs', 'szt.')}</span>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {t('parts.kpi_view.reserved_services', 'Zarezerwowane (Serwisy)')}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 relative">
            <i className="ph ph-x-circle text-3xl"></i>
            {stats.outOfStock > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
          </div>
          <div className="text-3xl font-black text-slate-800">{stats.outOfStock}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {t('parts.kpi_view.out_of_stock', 'Brak Na Stanie (0 szt)')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {t('parts.kpi_view.estimated_value', 'Szacowana Wartość Magazynu (wg fizycznych stanów)')}
          </h3>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats.totalValue.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
          </div>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
          <i className="ph ph-coins text-2xl"></i>
        </div>
      </div>
    </div>
  );
}
