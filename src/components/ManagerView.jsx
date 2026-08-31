import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Importy zakładek
import Dashboard from './manager/Dashboard';
import HomeDashboard from './manager/HomeDashboard';
import Tickets from './manager/Tickets';
import KPIDashboard from './manager/KPIDashboard';
import MapComponent from './manager/Map';

// Importy dla Master Data (konfiguracja)
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

export default function ManagerView({ user, onLogout, onSwitchView }) {
  const [currentModule, setCurrentModule] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('module') || 'home';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('module') || 'home';
    return params.get('tab') || (m === 'home' ? 'home' : (m === 'planned_maintenance' ? 'dashboard_planned' : (m === 'master_data' ? 'machines' : 'dashboard_tickets')));
  });

  const [globalTicketId, setGlobalTicketId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Obsługa przycisku "Wstecz" przeglądarki (Popstate)
  useEffect(() => {
    window.history.replaceState({ tab: activeTab, module: currentModule }, '', `?module=${currentModule}&tab=${activeTab}`);
    
    const handlePopState = (e) => {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module');
      const t = params.get('tab');
      if (mod) setCurrentModule(mod);
      if (t) setActiveTab(t);
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
  const [actionItems, setActionItems] = useState([]);

  const [branding, setBranding] = useState({
    companyName: 'CRIST S.A.',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    companyLogoUrl: '',
    appLogoUrl: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBranding(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsub();
  }, []);

  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const safeParseDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };
  
  // Stany dla powiadomień (dzwoneczek)
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Pobieranie danych z Firebase (Real-time)
  useEffect(() => {
    const qTickets = query(collection(db, 'tickets'), where('status', 'in', [1,2,3,4]));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPlanned = onSnapshot(collection(db, 'planned_services'), (snapshot) => {
      setPlannedServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Nasłuchiwanie powiadomień dla użytkownika
    const qNotifications = collection(db, 'notifications');
    const unsubNotifications = onSnapshot(qNotifications, async (snapshot) => {
      const now = new Date();
      const notifs = [];
      const docsToDelete = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const d = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
        if (!isNaN(d.getTime()) && (now - d) / (1000 * 60 * 60 * 24) > 7) {
          docsToDelete.push(docSnap.id);
        } else {
          notifs.push({ id: docSnap.id, ...data });
        }
      });

    const unsubActionItems = onSnapshot(collection(db, 'action_items'), (snapshot) => {
      setActionItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted));
    });
      
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
        return timeB - timeA;
      });
      notifs.sort((a,b) => {
  const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
  const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
  return tb - ta;
});
setNotifications(notifs);
      
      if (docsToDelete.length > 0) {
        try {
          const { writeBatch, doc } = await import('firebase/firestore');
          const batch = writeBatch(db);
          docsToDelete.forEach(id => {
            batch.delete(doc(db, 'notifications', id));
          });
          await batch.commit();
        } catch (e) {
          console.error('Błąd podczas usuwania starych powiadomień:', e);
        }
      }
    });

    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.allowTicketDeletion !== undefined) {
          setAllowTicketDeletion(data.allowTicketDeletion);
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
    if (notifId && notifId.toString().startsWith('dyn_')) return;
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Błąd aktualizacji powiadomienia:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie widoczne powiadomienia?")) {
      try {
        import('firebase/firestore').then(async ({ writeBatch, doc }) => {
          const batch = writeBatch(db);
          relevantNotifications.forEach(n => {
            batch.delete(doc(db, 'notifications', n.id));
          });
          await batch.commit();
        });
      } catch (err) {
        console.error("Błąd usuwania", err);
      }
    }
  };

  const relevantNotifications = [];

  // Dynamiczne powiadomienia z nowo dodanych awarii (status 1)
  if (currentModule === 'tickets') {
    tickets.filter(t => t.status !== 5 && t.status !== '5').forEach(t => {
      relevantNotifications.push({
        id: 'dyn_ticket_' + t.id,
        title: t.isCritical ? "KRYTYCZNA AWARIA!" : "Nowe zgłoszenie awarii",
        message: 'Maszyna: ' + (t.machineName || 'Nieznana') + ' - ' + (t.topic || 'Inne'),
        isCritical: t.isCritical,
        read: false,
        ticketId: t.id,
        createdAt: { toDate: () => safeParseDate(t.createdAt) || new Date() },
        isDynamic: true
      });
    });
  }

  // Indywidualne powiadomienia dla przedawnionych serwisow
  if (currentModule === 'planned_maintenance') {
    const now = new Date();
    plannedServices.forEach(srv => {
      if (srv.status === 'completed' || srv.status === 'in_progress') return;
      
      let isOverdue = false;
      const machine = machines.find(m => m.id === srv.machineId);
      
      if (srv.nextDate) {
        const nDate = safeParseDate(srv.nextDate);
        if (nDate && nDate < now) isOverdue = true;
      }
      
      if (srv.targetWorkHours && machine) {
        if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
      }

      if (isOverdue) {
        relevantNotifications.push({
          id: 'dyn_srv_' + srv.id,
          title: "PRZEKROCZONY TERMIN SERWISU!",
          message: 'Maszyna: ' + (machine?.name || 'Nieznana') + ' - ' + srv.name,
          isCritical: true,
          read: false,
          linkTo: 'planned_maintenance',
          createdAt: { toDate: () => safeParseDate(srv.nextDate) || new Date() },
          isDynamic: true
        });
      }
    });

    // Zbiorcze powiadomienie dla tematow do realizacji
    let openActionItems = 0;
    actionItems.forEach(item => {
      if (item.status !== 'completed') {
        openActionItems++;
      }
    });

    if (openActionItems > 0) {
      relevantNotifications.push({
        id: 'dyn_action_grouped',
        title: "TEMATY DO REALIZACJI",
        message: 'Liczba tematow do realizacji: ' + openActionItems,
        isCritical: true,
        read: false,
        linkTo: 'action_items',
        createdAt: { toDate: () => new Date() },
        isDynamic: true
      });
    }
  }

  
  // Oryginalne powiadomienia (np. inne systemowe)
  notifications.forEach(n => {
    if (n.ticketId) return; // Mamy dynamiczne
    if (n.linkTo === 'planned_maintenance') return; // Mamy dynamiczne
    relevantNotifications.push(n);
  });

  // Sortowanie dynamicznych + bazowych
  relevantNotifications.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
    return (timeB || 0) - (timeA || 0);
  });

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  let workItems = [];
  if (currentModule === 'tickets') {
    workItems = [
      { id: 'dashboard_tickets', label: 'Mapa Stoczni', icon: 'ph-map-trifold' },
      { id: 'tickets', label: 'Zgłoszenia Awarii', icon: 'ph-warning-circle' },
      { id: 'archive', label: 'Archiwum Awarii', icon: 'ph-archive' },
      { id: 'kpi', label: 'Analiza', icon: 'ph-chart-line-up' }
    ];
  } else if (currentModule === 'planned_maintenance') {
    workItems = [
      { id: 'dashboard_planned', label: 'Mapa Serwisów', icon: 'ph-map-trifold' },
      { id: 'planned_maintenance', label: 'Serwis Planowany', icon: 'ph-calendar-check' },
      { id: 'action_items', label: 'Tematy do Realizacji', icon: 'ph-clipboard-text' },
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
      workItems.push({ id: 'reports', label: 'Raportowanie & Ustawienia', icon: 'ph-chart-bar' });
      workItems.push({ id: 'settings', label: 'Administrator Programu', icon: 'ph-gear' });
    }
  }

  const dataItems = [];

  let visibleWorkItems = workItems;
  let visibleDataItems = dataItems;

  if (user.role !== 'admin') {
    const userRoleDoc = roles.find(r => r.id === user.role);
    const perms = userRoleDoc?.permissions || [];
    const canEditPlanned = user.role === 'admin' || perms.includes('edit_planned');
    const canDeletePlanned = user.role === 'admin' || perms.includes('delete_planned');
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

  
  const userRoleForPerms = roles.find(r => r.id === user.role);
  const allUserPerms = userRoleForPerms?.permissions || [];
  const canEditPlanned = user.role === 'admin' || allUserPerms.includes('edit_planned');
  const canDeletePlanned = user.role === 'admin' || allUserPerms.includes('delete_planned');

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Menu Boczne */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-0 -translate-x-full'} 
        lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-[9999] bg-[#111827] text-gray-300 transition-all duration-300 ease-in-out flex flex-col no-print overflow-hidden border-r border-gray-800 shadow-xl`}
      >
        <div className="p-6 bg-[#0f172a] min-w-[288px] border-b border-gray-800">

          <div className="flex items-center gap-3">
            {branding.companyLogoUrl ? (
              <img src={branding.companyLogoUrl} alt="Company Logo" className="max-h-12 max-w-[48px] object-contain rounded-xl overflow-hidden bg-white p-0.5" />
            ) : (
              <i className="ph ph-buildings text-3xl text-white"></i>
            )}
            <div>
              <div className="font-extrabold text-xl tracking-wider text-white leading-none">{branding.companyName}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{branding.systemSubtitle}</div>
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

        <div className="p-6 pb-12 bg-[#0f172a] min-w-[288px] border-t border-gray-800 space-y-2">
          <button 
            onClick={() => {
              // Wróć do portalu
              window.history.pushState({ module: '' }, '', window.location.pathname);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-3 rounded-lg transition-colors shadow-sm mb-2"
          >
            <i className="ph ph-squares-four text-xl"></i>
            Wróć do Panelu UR
          </button>
        </div>

        </aside>


      {/* Główna zawartość */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-[#002b5e] lg:bg-white text-white lg:text-gray-800 p-4 flex justify-between items-center sticky top-0 z-[1000] lg:border-b lg:border-gray-200 lg:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 lg:bg-blue-100 lg:text-blue-700 text-white rounded-full flex items-center justify-center font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-lg font-bold lg:hidden">{user?.name || 'Portal'}</span>
            <span className="hidden lg:block font-semibold text-xl">
              {workItems.find(m => m.id === activeTab)?.label || dataItems.find(m => m.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex gap-4 text-2xl items-center">
            {/* Przycisk menu dla desktopu */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
            >
              <i className="ph ph-list"></i>
            </button>

            {/* DZWONECZEK POWIADOMIEŃ */}
          {currentModule !== 'master_data' && (
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-white lg:text-gray-600 hover:bg-white/10 lg:hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
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
                                setIsNotificationsOpen(false);
                                setCurrentModule('tickets');
                                setActiveTab('tickets');
                                window.history.pushState({ module: 'tickets', tab: 'tickets' }, '', '?module=tickets&tab=tickets');
                              } else if (n.linkTo === 'planned_maintenance') {
                                setIsNotificationsOpen(false);
                                setCurrentModule('planned_maintenance');
                                setActiveTab('planned_maintenance');
                                window.history.pushState({ module: 'planned_maintenance', tab: 'planned_maintenance' }, '', '?module=planned_maintenance&tab=planned_maintenance');
                              } else if (n.linkTo === 'action_items') {
                                  setIsNotificationsOpen(false);
                                  setCurrentModule('planned_maintenance');
                                  setActiveTab('action_items');
                                  window.history.pushState({ module: 'planned_maintenance', tab: 'action_items' }, '', '?module=planned_maintenance&tab=action_items');
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
                              {safeParseDate(n.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || 'Przed chwilą'}
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
          )}
        </div></header>

        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-50 pb-24 lg:pb-6">
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
          {activeTab === 'home' && <HomeDashboard setActiveTab={setActiveTab} setCurrentModule={setCurrentModule} user={user} />}
          {activeTab === 'tickets' && <Tickets machines={machines} initialSearchQuery={globalSearchQuery} tickets={tickets} user={user} services={services} allowTicketDeletion={allowTicketDeletion} initialTicketId={globalTicketId} onClearTicketId={() => setGlobalTicketId(null)} />}
          {activeTab === 'archive' && <Tickets tickets={[]} user={user} services={services} allowTicketDeletion={allowTicketDeletion} isArchive={true} />}
          {activeTab === 'planned_maintenance' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={false} allowTicketDeletion={allowTicketDeletion} canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned} />}
          {activeTab === 'archive_planned' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={true} allowTicketDeletion={allowTicketDeletion} canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned} />}
          {activeTab === 'action_items' && <ActionItems machines={machines} user={user} />}
          {activeTab === 'kpi' && <KPIDashboard tickets={tickets} machines={machines} plannedServices={plannedServices} />}

          {/* Master Data */}
          {activeTab === 'machines' && <Machines tickets={tickets} plannedServices={plannedServices} />}
          {activeTab === 'regions' && <Regions />}
          {activeTab === 'services' && <Services services={services} />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'reporters' && <Reporters />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'roles' && <Roles />}
          {activeTab === 'settings' && <Settings />}
            {activeTab === 'reports' && <Reports tickets={tickets} plannedServices={plannedServices} machines={machines} />}
        </div>
      </main>

            {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* BOTTOM NAVIGATION FOR MOBILE (PZU STYLE) */}
      {currentModule !== 'home' && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-[68px] z-[9997] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] pb-1">
        
        {/* Renderuj pierwsze 4 zakładki dynamicznie dla danego modułu */}
        {[...workItems, ...dataItems].slice(0, 4).map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => { handleTabChange(item.id); }}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-[#002b5e]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <i className={`ph ${isActive ? 'ph-fill ' : ''}${item.icon} text-2xl mb-0.5`}></i>
              <span className="text-[10px] font-bold text-center leading-tight line-clamp-1">{item.label}</span>
            </button>
          );
        })}

        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center w-16 h-full transition-colors text-gray-400 hover:text-gray-600"
        >
          <i className="ph ph-dots-three-circle text-2xl mb-0.5"></i>
          <span className="text-[10px] font-bold">Więcej</span>
        </button>
      </nav>
      )}
    </div>
  );
}