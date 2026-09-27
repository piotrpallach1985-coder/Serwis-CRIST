import PropTypes from 'prop-types';
import { useManagerStore } from '../store/managerStore';
import { db } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { checkAndTriggerDueServices } from '../services/plannedServices.service';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ManagerDataProvider } from '../context/ManagerDataContext';
import { usePermissions } from '../hooks/usePermissions';
import Sidebar from './manager/Sidebar';

// Zak'adki
import HomeDashboard from './manager/HomeDashboard';
import Tickets from './manager/Tickets';
import KPIDashboard from './manager/KPIDashboard';
import PlannedKPIDashboard from './manager/PlannedKPIDashboard';
import PartsLayout from './manager/parts/PartsLayout';
import MapComponent from './manager/Map';
import Machines from './manager/Machines';
import Regions from './manager/Regions';
import Roles from './manager/Roles';
import Users from './manager/Users';
import Reports from './manager/Reports';
import Services from './manager/Services';
import Topics from './manager/Topics';
import Reporters from './manager/Reporters';
import PlannedMaintenance from './manager/PlannedMaintenance';
import ActionItems from './manager/ActionItems';
import NotificationCenter from './manager/NotificationCenter';
import SuperAdminPanel from './manager/SuperAdminPanel';

import { USER_ROLES } from '../utils/constants';

function ManagerViewInner({ user, onLogout }) {
  // --- Routing ---
    const { module: routeModule, tab: routeTab } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const currentModule = routeModule || 'home';
    const activeTab = routeTab || (currentModule === 'home' ? 'home' : 'dashboard_tickets');

    
    // Dummy setters for compatibility if used elsewhere
    const setCurrentModule = (mod) => { navigate(`/manager/${mod}/${activeTab}`); };
    const setActiveTab = (tab) => { navigate(`/manager/${currentModule}/${tab}`); };

  const handleTabChange = (tabId) => {
    navigate(`/manager/${currentModule}/${tabId}`);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [globalTicketId, setGlobalTicketId] = useState(() => searchParams.get('openTicket'));
  const [globalServiceId, setGlobalServiceId] = useState(() => searchParams.get('openService'));
  const [globalMachineId, setGlobalMachineId] = useState(() => searchParams.get('openMachine'));
  const [globalTicketSearchQuery, setGlobalTicketSearchQuery] = useState('');
  const [globalPlannedSearchQuery, setGlobalPlannedSearchQuery] = useState('');

  const clearUrlParam = (paramName) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete(paramName);
      return newParams;
    }, { replace: true, state: location.state });
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
  const partTransactions = useManagerStore(state => state.partTransactions || []);

  useEffect(() => {
    const fixLegacyParts = async () => {
      const tenantId = getCurrentTenant();
      if (!tenantId || !partTransactions || partTransactions.length === 0) return;
      const toFix = partTransactions.filter(tx => tx.referenceId && !tx.machineId && (tx.type === 'issue_adhoc' || tx.type === 'issue' || tx.type === 'issue_planned'));
      if (toFix.length === 0) return;
      for (const tx of toFix) {
        try {
          let mId = null;
          let mName = null;
          const tDoc = await getDoc(doc(db, 'tenants', tenantId, 'tickets', tx.referenceId));
          if (tDoc.exists()) {
            mId = tDoc.data().machineId;
            mName = tDoc.data().machineName;
          } else {
            const sDoc = await getDoc(doc(db, 'tenants', tenantId, 'planned_services', tx.referenceId));
            if (sDoc.exists()) {
              mId = sDoc.data().machineId;
              mName = sDoc.data().machineName;
            }
          }
          if (mId) {
            await updateDoc(doc(db, 'tenants', tenantId, 'part_transactions', tx.id), {
              machineId: mId,
              machineName: mName || null
            });
            console.log('Fixed legacy tx', tx.id);
          }
        } catch(e) {}
      }
    };
    fixLegacyParts();
  }, [partTransactions]);

  // --- Uprawnienia (hook) ---
  const { canEditPlanned, canDeletePlanned, isAdmin } = usePermissions(user, roles);

  
    // --- Nawigacja wewnątrz Menedżera ---
    const handleNavigate = (module, tab, extra = {}) => {
    const params = new URLSearchParams();
    
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
    if (extra.partId) {
      params.set('openPart', extra.partId);
    }
    
    const searchString = params.toString() ? '?' + params.toString() : '';
    navigate(`/manager/${module}/${tab}${searchString}`);
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
    if (currentModule === 'system_admin') return 'Super Panel SaaS';
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

          {/* ZAKŁADKI POZIOME DLA AWARII */}
          {['kpi', 'dashboard_tickets', 'tickets', 'archive'].includes(activeTab) && (
            <div className="lg:hidden sticky top-0 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 pb-2 bg-gray-50/90 backdrop-blur shadow-sm border-b border-gray-200 mb-4 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'kpi', label: 'KPI', icon: 'ph-chart-line-up' },
                  { id: 'dashboard_tickets', label: 'Mapa', icon: 'ph-map-pin' },
                  { id: 'tickets', label: 'Lista', icon: 'ph-list-dashes' },
                  { id: 'archive', label: 'Archiwum', icon: 'ph-archive' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate('ur', t.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide whitespace-nowrap transition-all duration-200 shadow-sm ${
                      activeTab === t.id
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`ph ${t.icon} text-lg`}></i>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ZAKŁADKI POZIOME DLA SERWISÓW PLANOWANYCH */}
          {['planned_kpi', 'dashboard_planned', 'planned_maintenance', 'action_items', 'archive_planned'].includes(activeTab) && (
            <div className="lg:hidden sticky top-0 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 pb-2 bg-gray-50/90 backdrop-blur shadow-sm border-b border-gray-200 mb-4 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'planned_kpi', label: 'KPI', icon: 'ph-chart-line-up' },
                  { id: 'dashboard_planned', label: 'Mapa', icon: 'ph-map-pin' },
                  { id: 'planned_maintenance', label: 'Lista', icon: 'ph-calendar-check' },
                  { id: 'action_items', label: 'Zadania', icon: 'ph-check-square' },
                  { id: 'archive_planned', label: 'Archiwum', icon: 'ph-archive' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate('ur', t.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide whitespace-nowrap transition-all duration-200 shadow-sm ${
                      activeTab === t.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`ph ${t.icon} text-lg`}></i>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Moduł: Awarie - mapa */}
          {activeTab === 'dashboard_tickets' && (
            <MapComponent
              modeType="tickets" user={user}
              onNavigateToTickets={(navData) => { 
                if (typeof navData === 'string') {
                  setGlobalTicketSearchQuery(navData); setActiveTab('tickets');
                } else if (navData.ticketId) {
                  handleNavigate('ur', 'tickets', { ticketId: navData.ticketId });
                } else if (navData.serviceId) {
                  handleNavigate('ur', 'planned_maintenance', { serviceId: navData.serviceId });
                } else {
                  setGlobalTicketSearchQuery(navData.name); setActiveTab('tickets');
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
                  setGlobalPlannedSearchQuery(navData); setActiveTab('planned_maintenance');
                } else if (navData.ticketId) {
                  handleNavigate('ur', 'tickets', { ticketId: navData.ticketId });
                } else if (navData.serviceId) {
                  handleNavigate('ur', 'planned_maintenance', { serviceId: navData.serviceId });
                } else {
                  setGlobalPlannedSearchQuery(navData.name); setActiveTab('planned_maintenance');
                }
              }}
            />
          )}

          {/* Awarie */}
          {activeTab === 'tickets' && (
            <Tickets
              user={user}
              initialSearchQuery={globalTicketSearchQuery}
                onClearSearchQuery={() => setGlobalTicketSearchQuery('')}
              initialTicketId={globalTicketId} onClearTicketId={() => { setGlobalTicketId(null); clearUrlParam('openTicket'); }}
            />
          )}
          {activeTab === 'archive' && (
            <Tickets
              user={user}
              isArchive={true}
              initialSearchQuery={globalTicketSearchQuery}
                onClearSearchQuery={() => setGlobalTicketSearchQuery('')}
              initialTicketId={globalTicketId} onClearTicketId={() => { setGlobalTicketId(null); clearUrlParam('openTicket'); }}
            />
          )}

          {/* Serwisy planowane */}
          {activeTab === 'planned_maintenance' && (
            <PlannedMaintenance
              user={user}
              isArchive={false}
              initialSearchQuery={globalPlannedSearchQuery}
                onClearSearchQuery={() => setGlobalPlannedSearchQuery('')}
              canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
              initialServiceId={globalServiceId} onClearServiceId={() => { setGlobalServiceId(null); clearUrlParam('openService'); }}
            />
          )}
          {activeTab === 'archive_planned' && (
            <PlannedMaintenance
              user={user}
              isArchive={true}
              initialSearchQuery={globalPlannedSearchQuery}
                onClearSearchQuery={() => setGlobalPlannedSearchQuery('')}
              canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned}
              initialServiceId={globalServiceId} onClearServiceId={() => { setGlobalServiceId(null); clearUrlParam('openService'); }}
            />
          )}

          {/* Inne */}
          {activeTab === 'action_items' && <ActionItems user={user} />}
          {activeTab === 'superadmin' && <SuperAdminPanel user={user} onNavigate={handleNavigate} />}
          {activeTab === 'kpi' && <KPIDashboard />}
          {activeTab === 'planned_kpi' && <PlannedKPIDashboard />}

          {/* Master Data */}
          {activeTab === 'machines' && (
            <Machines 
              user={user}
              initialMachineId={globalMachineId}
              onClearMachineId={() => { setGlobalMachineId(null); clearUrlParam('openMachine'); }}
              onOpenTicket={(id, isArchived, machineId) => {
                setGlobalTicketId(id);
                const targetTab = isArchived ? 'archive' : 'tickets';
                navigate(`/manager/ur/${targetTab}?openTicket=${id}`, { 
                  state: { backToMachineId: machineId || searchParams.get('openMachine') } 
                });
              }}
              onOpenService={(id, isArchived, machineId) => {
                setGlobalServiceId(id);
                const targetTab = isArchived ? 'archive_planned' : 'planned_maintenance';
                navigate(`/manager/ur/${targetTab}?openService=${id}`, { 
                  state: { backToMachineId: machineId || searchParams.get('openMachine') } 
                });
              }}
            />
          )}
          {activeTab === 'regions' && <Regions />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'reporters' && <Reporters />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'roles' && <Roles />}
                    {activeTab === 'reports' && <Reports />}
          {activeTab.startsWith('parts_') && <PartsLayout user={user} currentTab={activeTab} setActiveTab={setActiveTab} />}

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

ManagerViewInner.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func
};

ManagerView.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func
};
