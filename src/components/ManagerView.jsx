import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Importy zakładek
import Dashboard from './manager/Dashboard';
import Tickets from './manager/Tickets';
import KPIDashboard from './manager/KPIDashboard';
import MapComponent from './manager/Map';

// Importy dla Master Data (konfiguracja)
import Machines from './manager/Machines';
import Regions from './manager/Regions';
import Roles from './manager/Roles';
import Users from './manager/Users';
import Settings from './manager/Settings';
import Services from './manager/Services';
import Topics from './manager/Topics';
import Reporters from './manager/Reporters';
import PlannedMaintenance from './manager/PlannedMaintenance';

export default function ManagerView({ user, onLogout, onSwitchView }) {
  const [currentModule, setCurrentModule] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('module') || 'tickets';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('module') || 'tickets';
    return params.get('tab') || (m === 'planned_maintenance' ? 'dashboard_planned' : (m === 'master_data' ? 'machines' : 'dashboard_tickets'));
  });

  const [globalTicketId, setGlobalTicketId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Obsługa przycisku "Wstecz" przeglądarki (Popstate)
  useEffect(() => {
    window.history.replaceState({ tab: activeTab, module: currentModule }, '', `?module=${currentModule}&tab=${activeTab}`);
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.module) setCurrentModule(e.state.module);
        if (e.state.tab) setActiveTab(e.state.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.history.pushState({ tab: tabId, module: currentModule }, '', `?module=${currentModule}&tab=${tabId}`);
  };

  // Stany na dane z chmury
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [services, setServices] = useState([]);
  const [plannedServices, setPlannedServices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [archiveDelayDays, setArchiveDelayDays] = useState(14);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Stany dla powiadomień (dzwoneczek)
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Pobieranie danych z Firebase (Real-time)
  useEffect(() => {
    const qTickets = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPlanned = onSnapshot(collection(db, 'planned_services'), (snapshot) => {
      setPlannedServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Nasłuchiwanie powiadomień dla użytkownika
    const qNotifications = query(
      collection(db, 'notifications'), 
      orderBy('createdAt', 'desc')
    );
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.archiveDelayDays !== undefined) {
          setArchiveDelayDays(data.archiveDelayDays);
        }
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });

    return () => {
      unsubTickets();
      unsubMachines();
      unsubServices();
      unsubPlanned();
      unsubNotifications();
      unsubRoles();
      unsubRegions();
      unsubSettings();
    };
  }, []);

  // Weryfikacja zbliżających się przeglądów (uruchamiana raz po pobraniu maszyn)
  useEffect(() => {
    if (machines.length > 0 && user.role !== 'operator') {
      import('../services/plannedServices.service').then(m => {
        const machinesMap = machines.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        m.checkAndTriggerDueServices(machinesMap);
      });
    }
  }, [machines.length]); // Tylko kiedy zmieni się ilośc maszyn lub po załadowaniu


  // Oznaczanie powiadomienia jako przeczytane
  const markAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Błąd aktualizacji powiadomienia:", error);
    }
  };

  const relevantNotifications = notifications.filter(n => {
    if (currentModule === 'tickets') return !!n.ticketId;
    if (currentModule === 'planned_maintenance') return n.linkTo === 'planned_maintenance';
    return true;
  });

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  let workItems = [];
  if (currentModule === 'tickets') {
    workItems = [
      { id: 'dashboard_tickets', label: 'Mapa Stoczni', icon: 'ph-map-trifold' },
      { id: 'tickets', label: 'Zgłoszenia Awarii', icon: 'ph-warning-circle' },
      { id: 'archive', label: 'Archiwum Awarii', icon: 'ph-archive' },
      { id: 'kpi', label: 'Wskaźniki KPI', icon: 'ph-chart-line-up' }
    ];
  } else if (currentModule === 'planned_maintenance') {
    workItems = [
      { id: 'dashboard_planned', label: 'Mapa Serwisów', icon: 'ph-map-trifold' },
      { id: 'planned_maintenance', label: 'Serwis Planowany', icon: 'ph-calendar-check' },
      { id: 'archive_planned', label: 'Archiwum Serwisów', icon: 'ph-archive' }
    ];
  } else if (currentModule === 'master_data') {
    workItems = [
      { id: 'machines', label: 'Baza Maszyn', icon: 'ph-engine' },
      { id: 'regions', label: 'Rejony na stoczni', icon: 'ph-map-pin' },
      { id: 'services', label: 'Podwykonawcy / Serwis', icon: 'ph-wrench' },
      { id: 'topics', label: 'Tematy Zgłoszeń', icon: 'ph-text-aa' },
      { id: 'reporters', label: 'Zgłaszający', icon: 'ph-user-list' }
    ];
    if (user.role === 'admin') {
      workItems.push({ id: 'users', label: 'Użytkownicy', icon: 'ph-users' });
      workItems.push({ id: 'roles', label: 'Role i Uprawnienia', icon: 'ph-shield-check' });
      workItems.push({ id: 'settings', label: 'Ustawienia', icon: 'ph-gear' });
    }
  }

  const dataItems = [];

  // Filtrowanie zakładek na podstawie roli
  let visibleWorkItems = workItems;
  let visibleDataItems = dataItems;

  if (user.role !== 'admin') {
    const userRoleDoc = roles.find(r => r.id === user.role);
    const perms = userRoleDoc?.permissions || [];
    visibleWorkItems = workItems.filter(item => perms.includes(item.id));
    visibleDataItems = dataItems.filter(item => perms.includes(item.id));
  }

  // Zabezpieczenie przed niewłaściwą zakładką
  useEffect(() => {
    const validTabIds = [...visibleWorkItems, ...visibleDataItems].map(item => item.id);
    if (validTabIds.length > 0 && !validTabIds.includes(activeTab)) {
      setActiveTab(validTabIds[0]);
    }
  }, [currentModule, activeTab, visibleWorkItems, visibleDataItems]);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Menu Boczne */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-0 -translate-x-full'} 
        md:translate-x-0 md:static fixed inset-y-0 left-0 z-50 bg-[#111827] text-gray-300 transition-all duration-300 ease-in-out flex flex-col no-print overflow-hidden border-r border-gray-800 shadow-xl`}
      >
        <div className="p-6 bg-[#0f172a] min-w-[288px] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <i className="ph ph-buildings text-3xl text-white"></i>
            <div>
              <div className="font-extrabold text-xl tracking-wider text-white leading-none">CRIST S.A.</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">DYSPOZYTORNIA UR</div>
            </div>
          </div>
          <button className="md:hidden absolute top-6 right-6 text-gray-400" onClick={() => setIsSidebarOpen(false)}>
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>

        <nav className="flex-1 py-8 overflow-y-auto min-w-[288px]">
          {/* Sekcja BIEŻĄCA PRACA */}
          <div className="px-6 mb-3">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BIEŻĄCA PRACA</h3>
          </div>
          <ul className="mb-8 space-y-1 px-3">
            {visibleWorkItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    handleTabChange(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-[#1f2937] text-white shadow-sm' 
                      : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                  }`}
                >
                  <i className={`ph ${item.icon} text-lg`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {visibleDataItems.length > 0 && (
            <>
              <div className="px-6 mb-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BAZA DANYCH</h3>
              </div>
              <ul className="space-y-1 px-3">
                {visibleDataItems.map(item => (
                  <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setGlobalSearchQuery('');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-[#1f2937] text-white shadow-sm' 
                      : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                  }`}
                >
                  <i className={`ph ${item.icon} text-lg`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          </>
          )}
        </nav>

        <div className="p-6 bg-[#0f172a] min-w-[288px] border-t border-gray-800 space-y-2">
          <button 
            onClick={() => {
              // Wróć do portalu (strony logowania) odświeżając stan
              window.location.href = window.location.origin + window.location.pathname;
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg transition-colors shadow-sm mb-2"
          >
            <i className="ph ph-squares-four text-xl"></i>
            Wróć do Portalu
          </button>
        </div>
      </aside>

      {/* Główna zawartość */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
            >
              <i className="ph ph-list text-2xl"></i>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">
              {workItems.find(m => m.id === activeTab)?.label || dataItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          {/* DZWONECZEK POWIADOMIEŃ */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              <i className="ph ph-bell text-2xl"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Rozwijane okno powiadomień */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                  <span className="font-bold text-sm">Powiadomienia systemowe</span>
                  <span className="text-xs bg-blue-900 px-2 py-0.5 rounded">{unreadCount} nowych</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {relevantNotifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Brak powiadomień</div>
                  ) : (
                    relevantNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.ticketId) {
                            setGlobalTicketId(n.ticketId);
                            setActiveTab('tickets');
                            setIsNotificationsOpen(false);
                          } else if (n.linkTo === 'planned_maintenance') {
                            setActiveTab('planned_maintenance');
                            setIsNotificationsOpen(false);
                          }
                        }}
                        className={`p-4 transition-colors cursor-pointer flex gap-3 items-start ${n.read ? 'bg-white opacity-60' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.isCritical ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          <i className={`ph ${n.isCritical ? 'ph-siren' : 'ph-info'} text-lg`}></i>
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-gray-800 mb-0.5">{n.title}</div>
                          <div className="text-gray-600 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            {n.createdAt ? new Date(n.createdAt.toDate ? n.createdAt.toDate() : n.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Przed chwilą'}
                          </div>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          {activeTab === 'dashboard_tickets' && (
            <MapComponent 
              tickets={tickets} 
              plannedServices={[]}
              modeType="tickets"
              machines={machines} 
              regions={regions} 
              user={user} 
              onNavigateToTickets={(query) => {
                setGlobalSearchQuery(query);
                setActiveTab('tickets');
              }}
            />
          )}
          {activeTab === 'dashboard_planned' && (
            <MapComponent 
              tickets={[]} 
              plannedServices={plannedServices}
              modeType="planned_maintenance"
              machines={machines} 
              regions={regions} 
              user={user} 
              plannedWarningDays={plannedWarningDays}
              onNavigateToTickets={() => {
                setActiveTab('planned_maintenance');
              }}
            />
          )}
          {activeTab === 'tickets' && <Tickets machines={machines} initialSearchQuery={globalSearchQuery} tickets={tickets.filter(t => {
            if (t.isManuallyArchived) return false; // Ukryj w bieżących jeśli zarchiwizowano ręcznie
            if (t.status !== 5) return true;
            if (!t.closedAt) return true; // Jeśli brak daty zamknięcia, pokaż w bieżących
            const closedDate = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
            const daysDiff = (new Date() - closedDate) / (1000 * 60 * 60 * 24);
            return daysDiff < archiveDelayDays;
          })} user={user} services={services} initialTicketId={globalTicketId} onClearTicketId={() => setGlobalTicketId(null)} />}
          {activeTab === 'archive' && <Tickets tickets={tickets.filter(t => {
            if (t.isManuallyArchived) return true; // Pokaż w archiwum jeśli zarchiwizowano ręcznie przez admina
            if (t.status !== 5) return false;
            if (!t.closedAt) return false;
            const closedDate = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
            const daysDiff = (new Date() - closedDate) / (1000 * 60 * 60 * 24);
            return daysDiff >= archiveDelayDays;
          })} user={user} services={services} isArchive={true} />}
          {activeTab === 'planned_maintenance' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={false} />}
          {activeTab === 'archive_planned' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={true} />}
          {activeTab === 'kpi' && <KPIDashboard tickets={tickets} machines={machines} />}

          {/* Master Data */}
          {activeTab === 'machines' && <Machines />}
          {activeTab === 'regions' && <Regions />}
          {activeTab === 'services' && <Services services={services} />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'reporters' && <Reporters />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'roles' && <Roles />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}