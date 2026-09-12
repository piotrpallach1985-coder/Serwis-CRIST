import { useManagerStore } from '../store/managerStore';
import { checkAndTriggerDueServices } from '../services/plannedServices.service';
import { useState, useEffect } from 'react';
import { ManagerDataProvider } from '../context/ManagerDataContext';
import { usePermissions } from '../hooks/usePermissions';
import Sidebar from './manager/Sidebar';

// Zakładki
import HomeDashboard from './manager/HomeDashboard';
import Tickets from './manager/Tickets';
import KPIDashboard from './manager/KPIDashboard';
import MapComponent from './manager/Map';
import Machines from './manager/Machines';
import Regions from './manager/Regions';
import Roles from './manager/Roles';
import Users from './manager/Users';
import Settings from './manager/Settings';
import Reports from './manager/Reports';
import Services from './manager/Services';
import Topics from './manager/Topics';
import Reporters from './manager/Reporters';
import PlannedMaintenance from './manager/PlannedMaintenance';
import ActionItems from './manager/ActionItems';
import NotificationCenter from './manager/NotificationCenter';
import { USER_ROLES } from '../utils/constants';

function ManagerViewInner({ user, onLogout }) {
  // --- Routing ---
  const [currentModule, setCurrentModule] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get('module') || 'home';
    if (m === 'tickets' || m === 'planned_maintenance' || m === 'master_data') return 'ur';
    return m;
  });
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get('module') || 'home';
    const t = p.get('tab');
    if (t) return t;
    if (m === 'home') return 'home';
    if (m === 'company_admin') return 'users';
    if (m === 'system_admin') return 'settings';
    return 'dashboard_tickets';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [globalTicketId, setGlobalTicketId] = useState(() => new URLSearchParams(window.location.search).get('openTicket'));
  const [globalServiceId, setGlobalServiceId] = useState(() => new URLSearchParams(window.location.search).get('openService'));
  const [globalMachineId, setGlobalMachineId] = useState(() => new URLSearchParams(window.location.search).get('openMachine'));
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const clearUrlParam = (paramName) => {
    const p = new URLSearchParams(window.location.search);
    if (p.has(paramName)) {
      p.delete(paramName);
      const newUrl = window.location.pathname + (p.toString() ? '?' + p.toString() : '');
      window.history.replaceState(window.history.state, '', newUrl);
    }
  };

  // --- Dane z Firebase (context) ---
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

  // --- Uprawnienia (hook) ---
  const { canEditPlanned, canDeletePlanned, isAdmin } = usePermissions(user, roles);

  // --- Popstate (przycisk Wstecz) ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('module', currentModule);
    urlParams.set('tab', activeTab);
    window.history.replaceState({ tab: activeTab, module: currentModule }, '', '?' + urlParams.toString());

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      let mod = p.get('module') || 'home';
      if (mod === 'tickets' || mod === 'planned_maintenance' || mod === 'master_data') mod = 'ur';
      const t = p.get('tab') || (mod === 'home' ? 'home' : 'dashboard_tickets');
      const openTicket = p.get('openTicket');
      const openService = p.get('openService');
      const openMachine = p.get('openMachine');
      if (mod) setCurrentModule(mod);
      if (t) setActiveTab(t);
      if (openTicket) setGlobalTicketId(openTicket);
      if (openService) setGlobalServiceId(openService);
      if (openMachine) setGlobalMachineId(openMachine);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Weryfikacja terminów serwisów (po pierwszym załadowaniu maszyn) ---
  useEffect(() => {
    if (machines.length > 0 && user?.role !== USER_ROLES.OPERATOR) {
      const machinesMap = machines.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {});
      checkAndTriggerDueServices(machinesMap);
    }
  }, [machines.length]);

  // --- Tab change z URL sync ---
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setGlobalSearchQuery('');
    window.history.pushState({ tab: tabId, module: currentModule }, '', `?module=${currentModule}&tab=${tabId}`);
  };

  // --- Nawigacja z powiadomień i kafelków ---
  const handleNavigate = (module, tab, extra = {}) => {
    setCurrentModule(module);
    setActiveTab(tab);
    
    const params = new URLSearchParams();
    params.set('module', module);
    params.set('tab', tab);
    
    if (extra.ticketId) {
      setGlobalTicketId(extra.ticketId);
      params.set('openTicket', extra.ticketId);
    }
    if (extra.serviceId) {
      setGlobalServiceId(extra.serviceId);
      params.set('openService', extra.serviceId);
    }
    if (extra.machineId) {
      setGlobalMachineId(extra.machineId);
      params.set('openMachine', extra.machineId);
    }
    
    window.history.pushState({ module, tab, ...extra }, '', '?' + params.toString());
  };

  // --- Widok Pulpitu Głównego (Home) — bez paska bocznego ---
  if (currentModule === 'home' || activeTab === 'home') {
    return (
      <HomeDashboard 
        setActiveTab={setActiveTab} 
        setCurrentModule={setCurrentModule} 
        user={user} 
        onLogout={onLogout} 
      />
    );
  }

  const getModuleTitle = () => {
    if (currentModule === 'ur') return 'Panel Awarii i Serwisu';
    if (currentModule === 'company_admin') return 'Administrator Firmy';
    if (currentModule === 'system_admin') return 'Administrator Programu';
    return 'System CMMS';
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* === SIDEBAR === */}
      <div className="flex flex-col flex-shrink-0 h-full relative z-[300]">
        <Sidebar
          currentModule={currentModule}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isSidebarOpen={isSidebarOpen}
          onSidebarClose={() => setIsSidebarOpen(false)}
          onGoHome={() => handleNavigate('home', 'home')}
          user={user}
          onLogout={onLogout}
          onNavigate={handleNavigate}
        />
      </div>

      {/* === GŁÓWNA TREŚĆ === */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* MOBILNA GÓRNA BELKA (widoczna tylko na ekranach < lg) */}
        <div className="lg:hidden bg-[#1B253B] text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-gray-800 shrink-0 z-[200]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Otwórz menu"
            >
              <i className="ph ph-list text-2xl"></i>
            </button>
            <span className="font-bold text-sm truncate max-w-[160px] sm:max-w-none">
              {getModuleTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Przycisk Główny powrotu do 4 kafelków */}
            <button
              onClick={() => handleNavigate('home', 'home')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
              title="Wróć do Pulpitu Głównego"
            >
              <i className="ph ph-house text-base"></i>
              <span className="hidden sm:inline">Pulpit</span>
            </button>

            {/* Dzwoneczek w module UR */}
            {currentModule === 'ur' && (
              <NotificationCenter
                currentModule={currentModule}
                user={user}
                onNavigate={handleNavigate}
                align="right"
                tickets={tickets}
                plannedServices={plannedServices}
                machines={machines}
                reporters={reporters}
                actionItems={actionItems}
                notifications={notifications}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-50 pb-20 lg:pb-6 flex flex-col">

          {/* Moduł: Awarie - mapa */}
          {activeTab === 'dashboard_tickets' && (
            <MapComponent
              modeType="tickets" user={user}
              onNavigateToTickets={(navData) => { 
                if (typeof navData === 'string') {
                  setGlobalSearchQuery(navData); setActiveTab('tickets');
                } else if (navData.ticketId) {
                  handleNavigate('ur', 'tickets', { ticketId: navData.ticketId });
                } else if (navData.serviceId) {
                  handleNavigate('ur', 'planned_maintenance', { serviceId: navData.serviceId });
                } else {
                  setGlobalSearchQuery(navData.name); setActiveTab('tickets');
                }
              }}
            />
          )}

          {/* Moduł: Serwisy - mapa */}
          {activeTab === 'dashboard_planned' && (
            <MapComponent
              modeType="planned_maintenance" user={user}
              onNavigateToTickets={(navData) => { 
                if (typeof navData === 'string') {
                  setGlobalSearchQuery(navData); setActiveTab('planned_maintenance');
                } else if (navData.ticketId) {
                  handleNavigate('ur', 'tickets', { ticketId: navData.ticketId });
                } else if (navData.serviceId) {
                  handleNavigate('ur', 'planned_maintenance', { serviceId: navData.serviceId });
                } else {
                  setGlobalSearchQuery(navData.name); setActiveTab('planned_maintenance');
                }
              }}
            />
          )}

          {/* Awarie */}
          {activeTab === 'tickets' && (
            <Tickets
              user={user}
              initialSearchQuery={globalSearchQuery}
              onClearSearchQuery={() => setGlobalSearchQuery('')}
              initialTicketId={globalTicketId} onClearTicketId={() => { setGlobalTicketId(null); clearUrlParam('openTicket'); }}
            />
          )}
          {activeTab === 'archive' && (
            <Tickets
              user={user}
              isArchive={true}
              initialSearchQuery={globalSearchQuery}
              onClearSearchQuery={() => setGlobalSearchQuery('')}
              initialTicketId={globalTicketId} onClearTicketId={() => { setGlobalTicketId(null); clearUrlParam('openTicket'); }}
            />
          )}

          {/* Serwisy planowane */}
          {activeTab === 'planned_maintenance' && (
            <PlannedMaintenance
              user={user}
              isArchive={false}
              initialSearchQuery={globalSearchQuery}
              onClearSearchQuery={() => setGlobalSearchQuery('')}
              canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
              initialServiceId={globalServiceId} onClearServiceId={() => { setGlobalServiceId(null); clearUrlParam('openService'); }}
            />
          )}
          {activeTab === 'archive_planned' && (
            <PlannedMaintenance
              user={user}
              isArchive={true}
              initialSearchQuery={globalSearchQuery}
              onClearSearchQuery={() => setGlobalSearchQuery('')}
              canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
              initialServiceId={globalServiceId} onClearServiceId={() => { setGlobalServiceId(null); clearUrlParam('openService'); }}
            />
          )}

          {/* Inne */}
          {activeTab === 'action_items' && <ActionItems user={user} />}
          {activeTab === 'kpi' && <KPIDashboard />}

          {/* Master Data */}
          {activeTab === 'machines' && (
            <Machines 
              user={user}
              initialMachineId={globalMachineId}
              onClearMachineId={() => { setGlobalMachineId(null); clearUrlParam('openMachine'); }}
              onOpenTicket={(id, isArchived, machineId) => {
                setGlobalTicketId(id);
                setCurrentModule('ur');
                setActiveTab(isArchived ? 'archive' : 'tickets');
                window.history.pushState(
                  { module: 'ur', tab: isArchived ? 'archive' : 'tickets', openTicket: id, backToMachineId: machineId || window.history.state?.openMachine },
                  '', `?module=ur&tab=${isArchived ? 'archive' : 'tickets'}&openTicket=${id}`
                );
              }}
              onOpenService={(id, isArchived, machineId) => {
                setGlobalServiceId(id);
                setCurrentModule('ur');
                setActiveTab(isArchived ? 'archive_planned' : 'planned_maintenance');
                window.history.pushState(
                  { module: 'ur', tab: isArchived ? 'archive_planned' : 'planned_maintenance', openService: id, backToMachineId: machineId || window.history.state?.openMachine },
                  '', `?module=ur&tab=${isArchived ? 'archive_planned' : 'planned_maintenance'}&openService=${id}`
                );
              }}
            />
          )}
          {activeTab === 'regions' && <Regions />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'reporters' && <Reporters />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'roles' && <Roles />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'reports' && <Reports />}

        </div>
      </main>

    </div>
  );
}

export default function ManagerView(props) {
  return (
    <ManagerDataProvider>
      <ManagerViewInner {...props} />
    </ManagerDataProvider>
  );
}
