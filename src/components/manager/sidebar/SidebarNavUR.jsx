import React from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../../store/managerStore';
import { safeParseDate } from '../../../utils/dateHelpers';
import { TICKET_STATUS } from '../../../utils/constants';

export default function SidebarNavUR({ activeTab, handleItemClick, branding }) {
  const { t } = useTranslation();
  
  const tickets = useManagerStore(state => state.tickets) || [];
  const machines = useManagerStore(state => state.machines) || [];
  const reporters = useManagerStore(state => state.reporters) || [];
  const plannedServices = useManagerStore(state => state.plannedServices) || [];
  const actionItems = useManagerStore(state => state.actionItems) || [];
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays) || 30;
  const parts = useManagerStore(state => state.parts) || [];

  const hasLowStockAlarm = React.useMemo(() => {
    if (!parts || parts.length === 0) return false;
    const reservedMap = new Map();
    if (plannedServices && plannedServices.length > 0) {
      for (const service of plannedServices) {
        if (service.status !== 'completed' && service.requiredParts) {
          for (const req of service.requiredParts) {
            if (req.partId) {
              const qty = Number(req.quantity) || 0;
              reservedMap.set(req.partId, (reservedMap.get(req.partId) || 0) + qty);
            }
          }
        }
      }
    }
    return parts.some(p => {
      const reserved = reservedMap.get(p.id) || 0;
      const currentStock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 0;
      return (currentStock - reserved) <= minStock;
    });
  }, [parts, plannedServices]);

  const unverifiedMachinesCount = machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).length;
  const unverifiedReportersCount = reporters.filter(r => r.name && r.name.includes('(DO WERYFIKACJI)')).length;
  const activeTicketsCount = tickets.length;
  const criticalTicketsCount = tickets.filter(t => t.isCritical && Number(t.status) !== TICKET_STATUS.CLOSED).length;
  
  const overdueServicesCount = plannedServices.filter(s => {
    if (s.status === 'completed' || s.status === 'in_progress') return false;
    let isOverdue = false;
    const machine = machines.find(m => m.id === s.machineId);
    if (s.nextDate) {
      const nDate = safeParseDate(s.nextDate);
      if (nDate && nDate < new Date()) isOverdue = true;
    }
    if (s.targetWorkHours && machine) {
      if (machine.currentWorkHours >= s.targetWorkHours) isOverdue = true;
    }
    return isOverdue;
  }).length;
  
  const upcomingServicesCount = plannedServices.filter(s => {
    if (s.status === 'completed' || s.status === 'in_progress') return false;
    if (!s.nextDate) return false;
    const due = safeParseDate(s.nextDate);
    if (!due) return false;
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff <= plannedWarningDays;
  }).length;
  
  const inProgressServicesCount = plannedServices.filter(s => s.status === 'in_progress').length;
  const totalActionableServicesCount = upcomingServicesCount + inProgressServicesCount;
  const openActionItemsCount = actionItems.filter(i => i.status !== 'completed').length;

  return (
    <>
{/* SEKCJA 1: AWARIE */}
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t("sidebar.section_tickets")}</span>
                  {criticalTicketsCount > 0 && (
                    <span className="bg-red-600/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-500/30">
                      {criticalTicketsCount} kryt.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleItemClick('kpi')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'kpi' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-chart-line-up text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.dashboard_kpi")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('dashboard_tickets')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'dashboard_tickets' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.map")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('tickets')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'tickets' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-list-dashes text-xl shrink-0"></i>
                    <span className="text-sm truncate">{t("sidebar.active_tickets")}</span>
                  </div>
                  {activeTicketsCount > 0 && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs ${criticalTicketsCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
                      {activeTicketsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('archive')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'archive' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-archive text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.archive_tickets_menu")}</span>
                </button>

                
              </div>

              {/* SEKCJA 2: SERWISY */}
              <div className="space-y-1 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t("sidebar.section_services")}</span>
                  {overdueServicesCount > 0 && (
                    <span className="bg-red-600/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-500/30 animate-pulse">
                      {overdueServicesCount} kryt.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleItemClick('planned_kpi')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'planned_kpi' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-chart-line-up text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.services_kpi")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('dashboard_planned')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'dashboard_planned' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.services_map")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('planned_maintenance')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'planned_maintenance' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-calendar-check text-xl shrink-0"></i>
                    <span className="text-sm truncate">{t("sidebar.services_list")}</span>
                  </div>
                  {totalActionableServicesCount > 0 && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs ${overdueServicesCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-600 text-white'}`}>
                      {totalActionableServicesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('action_items')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'action_items' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-clipboard-text text-xl shrink-0"></i>
                    <span className="text-sm truncate">{t("sidebar.action_items_menu")}</span>
                  </div>
                  {openActionItemsCount > 0 && (
                    <span className="bg-amber-600/40 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {openActionItemsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('archive_planned')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'archive_planned' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-archive text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.archive_services_menu")}</span>
                </button>
                
              </div>

              {/* SEKCJA: MAGAZYN CZÄĹšCI ZAPASOWYCH */}
              {branding?.modules?.inventory !== false && (
                <div className="space-y-1 pt-2 border-t border-gray-800/80">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    <span>{t("sidebar.warehouse_parts_menu")}</span>
                  </div>
                  
                  <button
                    onClick={() => handleItemClick('parts_kpi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'parts_kpi' ? 'bg-emerald-600/30 text-emerald-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <i className="ph ph-chart-pie-slice text-xl shrink-0"></i>
                    <span className="text-sm">{t("sidebar.kpi_status_menu")}</span>
                  </button>
                  
                  <button
                    onClick={() => handleItemClick('parts_inventory')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'parts_inventory' ? 'bg-emerald-600/30 text-emerald-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <i className="ph ph-archive-box text-xl shrink-0"></i>
                      <span className="text-sm truncate">{t("sidebar.warehouse_base_menu")}</span>
                    </div>
                    {hasLowStockAlarm && (
                      <span className="bg-red-500 w-2.5 h-2.5 rounded-full animate-pulse shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleItemClick('parts_transactions')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'parts_transactions' ? 'bg-emerald-600/30 text-emerald-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <i className="ph ph-arrows-left-right text-xl shrink-0"></i>
                    <span className="text-sm">{t("sidebar.warehouse_operations_menu")}</span>
                  </button>
                  
                  <button
                    onClick={() => handleItemClick('parts_qr')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'parts_qr' ? 'bg-emerald-600/30 text-emerald-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <i className="ph ph-qr-code text-xl shrink-0"></i>
                    <span className="text-sm">{t("sidebar.qr_summary_menu")}</span>
                  </button>
                </div>
              )}

              {/* SEKCJA 3: DANE BAZOWE */}
              <div className="space-y-1 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Dane Bazowe
                </div>

                <button
                  onClick={() => handleItemClick('machines')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'machines' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-database text-xl shrink-0"></i>
                    <span className="text-sm truncate">{t("sidebar.equipment_base_menu")}</span>
                  </div>
                  {unverifiedMachinesCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shrink-0 shadow-xs">
                      {unverifiedMachinesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('regions')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'regions' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin-line text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.regions_menu")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('services')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'services' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-wrench text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.subcontractors_menu")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('topics')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'topics' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-text-aa text-xl shrink-0"></i>
                  <span className="text-sm">{t("sidebar.ticket_topics_menu")}</span>
                </button>

                <button
                  onClick={() => handleItemClick('reporters')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'reporters' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-users text-xl shrink-0"></i>
                    <span className="text-sm truncate">{t("sidebar.reporters_menu")}</span>
                  </div>
                  {unverifiedReportersCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shrink-0 shadow-xs">
                      {unverifiedReportersCount}
                    </span>
                  )}
                </button>
              </div>
            
</>
  );
}
