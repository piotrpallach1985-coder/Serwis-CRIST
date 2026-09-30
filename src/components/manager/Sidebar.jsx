import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useManagerStore } from '../../store/managerStore';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import NotificationCenter from './NotificationCenter';
import { safeParseDate } from '../../utils/dateHelpers';
import { TICKET_STATUS } from '../../utils/constants';

export default function Sidebar({
  // Nawigacja
  currentModule = 'ur',
  activeTab,
  onTabChange,
  isSidebarOpen,
  onSidebarClose,
  onGoHome,
  // Użytkownik i uprawnienia
  // Akcje
  onLogout,
  onNavigate
}) {
  const { user } = useAuth();
  const [saasTenants, setSaasTenants] = useState([]);

  useEffect(() => {
    if (currentModule === 'system_admin' && user?.role === 'superadmin') {
      const unsub = onSnapshot(collection(db, 'tenant_registry'), (snap) => {
         setSaasTenants(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(t => t.id !== '_global_settings_'));
      });
      return () => unsub();
    }
  }, [currentModule, user]);

  const tickets = useManagerStore(state => state.tickets) || [];
  const machines = useManagerStore(state => state.machines) || [];
  const reporters = useManagerStore(state => state.reporters) || [];
  const services = useManagerStore(state => state.services) || [];
  const plannedServices = useManagerStore(state => state.plannedServices) || [];
  const notifications = useManagerStore(state => state.notifications) || [];
  const actionItems = useManagerStore(state => state.actionItems) || [];
  const roles = useManagerStore(state => state.roles) || [];
  const regions = useManagerStore(state => state.regions) || [];
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays) || 30;
  const branding = useManagerStore(state => state.branding) || {};
  const parts = useManagerStore(state => state.parts) || [];

  const hasLowStockAlarm = React.useMemo(() => {
    if (!parts || parts.length === 0) return false;
    
    // O(S) - pre-calculate total reserved for each part
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
    
    // O(P) - check against stock
    return parts.some(p => {
      const reserved = reservedMap.get(p.id) || 0;
      const currentStock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 0;
      return (currentStock - reserved) <= minStock;
    });
  }, [parts, plannedServices]);

  const unverifiedMachinesCount = machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).length;
  const unverifiedReportersCount = reporters.filter(r => r.name && r.name.includes('(DO WERYFIKACJI)')).length;

  const { t, i18n } = useTranslation();

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024 && onSidebarClose) {
      onSidebarClose();
    }
  };

  const handleReturnHome = () => {
    if (onGoHome) {
      onGoHome();
    } else if (onNavigate) {
      onNavigate('home', 'home');
    }
    if (window.innerWidth < 1024 && onSidebarClose) {
      onSidebarClose();
    }
  };

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

  const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data';
  const isCompanyAdmin = currentModule === 'company_admin';
  const isSystemAdmin = currentModule === 'system_admin';

  return (
    <>
      {/* Tło przyciemniające na mobile */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onSidebarClose}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 z-[200] w-72 h-full bg-[#1B253B] text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* NAGŁÓWEK SIDEBARA */}
        <div className="flex-shrink-0 h-20 bg-[#161f30] px-5 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-inner flex-shrink-0">
              {isSystemAdmin ? (
                <i className="ph ph-crown text-2xl text-yellow-600"></i>
              ) : branding?.companyLogoUrl ? (
                <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                branding?.companyName?.charAt(0) || 'C'
              )}
            </div>
            
            <div className="overflow-hidden">
              <div className="font-bold text-sm sm:text-base leading-tight tracking-wide truncate text-white">
                {branding?.companyName || 'CRIST S.A.'}
              </div>
              <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold truncate">
                {isUrModule && 'PANEL AWARII & SERWISU'}
                {isCompanyAdmin && 'ADMINISTRATOR FIRMY'}
                {isSystemAdmin && 'ADMINISTRATOR PROGRAMU'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Dzwoneczek informacyjny w Panelu UR */}
            {isUrModule && (
              <div className="hidden lg:block">
                <NotificationCenter 
                  currentModule={currentModule}
                  user={user}
                  onNavigate={onNavigate}
                  align="left"
                  tickets={tickets}
                  plannedServices={plannedServices}
                  machines={machines}
                  reporters={reporters}
                  actionItems={actionItems}
                  notifications={notifications}
                />
              </div>
            )}
            
            <button onClick={onSidebarClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-auto">
              <i className="ph ph-x text-xl"></i>
            </button>
          </div>
        </div>

        {/* GŁÓWNA LISTA NAWIGACYJNA (SCROLLOWANA) */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-5">
          
          {isUrModule && (
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

              {/* SEKCJA: MAGAZYN CZĘŚCI ZAPASOWYCH */}
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
          )}

          {/* ========================================================================= */}
          {/* MODUŁ: PANEL ADMINISTRATORA FIRMY (SaaS) */}
          {/* ========================================================================= */}
          {isSystemAdmin && (
            <div className="space-y-1 mt-4 px-3">
              <div className="px-3 py-1.5 text-[11px] font-bold text-yellow-500 uppercase tracking-wider mb-1">
                Lista Firm (SaaS)
              </div>
              {saasTenants.map(tenantItem => (
                 <button
                  key={tenantItem.id}
                  onClick={() => {
                     useManagerStore.getState().setTenantId(t.id);
                     onNavigate('home', 'home');
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  <i className="ph ph-buildings text-xl shrink-0"></i>
                  <span className="text-sm">{tenantItem.name || t.id}</span>
                </button>
              ))}
            </div>
          )}

          {isCompanyAdmin && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">
                Administracja Firmy
              </div>

              <button
                onClick={() => handleItemClick('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'users' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-users-three text-xl shrink-0"></i>
                <span className="text-sm">{t("sidebar.users_menu")}</span>
              </button>

              <button
                onClick={() => handleItemClick('roles')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'roles' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-shield-check text-xl shrink-0"></i>
                <span className="text-sm">{t("sidebar.roles_permissions_menu")}</span>
              </button>

              <button
                onClick={() => handleItemClick('reports')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'reports' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-chart-bar text-xl shrink-0"></i>
                <span className="text-sm">{t("sidebar.reporting_menu")}</span>
              </button>

              <button
                onClick={() => handleItemClick('audit')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'audit' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-scroll text-xl shrink-0"></i>
                <span className="text-sm">{t("sidebar.audit_logs_menu")}</span>
              </button>


              <button
                onClick={() => handleItemClick('ai_stats')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'ai_stats' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-brain text-xl shrink-0"></i>
                <span className="text-sm">{t("sidebar.ai_usage_menu")}</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STOPKA SIDEBARA */}
        {/* ========================================================================= */}
        <div className="flex-shrink-0 bg-[#121927] border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3.5 px-1">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-bold text-white truncate">{user?.name || 'Użytkownik'}</div>
              <div className="text-xs text-blue-400 font-medium truncate capitalize">{user?.role || 'Brak roli'}</div>
            </div>
          </div>
          
          {user?.role === 'superadmin' && (
            <button
              onClick={() => onNavigate('system_admin', 'superadmin')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-yellow-950/40 hover:bg-yellow-900/60 active:bg-yellow-950 rounded-xl text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-all border border-yellow-900/50 cursor-pointer shadow-xs mb-2"
              title="Zarządzanie systemem SaaS"
            >
              <i className="ph ph-crown text-lg"></i>
              <span>{t("sidebar.saas_management_menu")}</span>
            </button>
          )}

          <div className="flex flex-col gap-2 mb-2">
            <button
              onClick={handleReturnHome}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer shadow-xs"
              title="Wróć do ekranu głównego"
            >
              <i className="ph ph-house text-lg text-blue-400"></i>
              <span>{t("sidebar.main_menu")}</span>
            </button>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 active:bg-red-950 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 transition-all border border-red-900/50 cursor-pointer shadow-xs"
            title="Wyloguj się z konta"
          >
            <i className="ph ph-sign-out text-lg"></i>
            <span>{t("sidebar.logout_menu")}</span>
          </button>
        </div>
      
      {/* Language Switcher */}
      <div className="p-4 mt-auto border-t border-white/5">
        <button 
          onClick={() => i18n.changeLanguage((i18n.language || 'pl').startsWith('pl') ? 'en' : 'pl')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <div className="flex items-center gap-2">
            <i className="ph ph-globe text-lg"></i>
            <span>{t('sidebar.language')}</span>
          </div>
          <span className="font-bold text-xs bg-black/30 px-2 py-1 rounded">
            {(i18n.language || 'pl').startsWith('pl') ? 'PL' : 'EN'}
          </span>
        </button>
      </div>
      
    </aside>

    </>
  );
}
