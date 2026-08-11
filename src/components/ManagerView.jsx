import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Importy zakładek
import Dashboard from './manager/Dashboard';
import Tickets from './manager/Tickets';
import Machines from './manager/Machines';
import Services from './manager/Services';
import KPIDashboard from './manager/KPIDashboard';
import Topics from './manager/Topics';
import Users from './manager/Users';

export default function ManagerView({ user, onLogout, onSwitchView }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalTicketId, setGlobalTicketId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stany na dane z chmury
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [services, setServices] = useState([]);
  
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

    // Nasłuchiwanie powiadomień dla użytkownika
    const qNotifications = query(
      collection(db, 'notifications'), 
      orderBy('createdAt', 'desc')
    );
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTickets();
      unsubMachines();
      unsubServices();
      unsubNotifications();
    };
  }, []);

  // Oznaczanie powiadomienia jako przeczytane
  const markAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Błąd aktualizacji powiadomienia:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const workItems = [
    { id: 'dashboard', label: 'Pulpit główny', icon: 'ph-squares-four' },
    { id: 'tickets', label: 'Rejestr awarii', icon: 'ph-list-dashes' },
    { id: 'kpi', label: 'Wskaźniki KPI', icon: 'ph-chart-line-up' },
    { id: 'archive', label: 'Archiwum zgłoszeń', icon: 'ph-archive' },
  ];

  const dataItems = [
    { id: 'machines', label: 'Rejestr maszyn (QR)', icon: 'ph-engine' },
    { id: 'services', label: 'Podwykonawcy / Serwis', icon: 'ph-wrench' },
    { id: 'topics', label: 'Tematy Zgłoszeń', icon: 'ph-text-aa' },
    { id: 'users', label: 'Użytkownicy i Dostępy', icon: 'ph-users' },
  ];

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
            {workItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
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

          {/* Sekcja BAZA DANYCH */}
          <div className="px-6 mb-3">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BAZA DANYCH</h3>
          </div>
          <ul className="space-y-1 px-3">
            {dataItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
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
        </nav>

        <div className="p-6 bg-[#0f172a] min-w-[288px] border-t border-gray-800 space-y-2">
          {onSwitchView && (
            <button 
              onClick={onSwitchView}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-4 py-3 rounded-lg transition-colors shadow-sm"
            >
              <i className="ph ph-qr-code text-xl"></i>
              Panel Operatora
            </button>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm font-medium px-4 py-2"
          >
            <i className="ph ph-sign-out text-lg"></i>
            Wyloguj się
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
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Brak powiadomień</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.ticketId) {
                            setGlobalTicketId(n.ticketId);
                            setActiveTab('tickets');
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
          {activeTab === 'dashboard' && <Dashboard tickets={tickets} machines={machines} />}
          {activeTab === 'tickets' && <Tickets tickets={tickets.filter(t => t.status !== 5)} user={user} services={services} initialTicketId={globalTicketId} onClearTicketId={() => setGlobalTicketId(null)} />}
          {activeTab === 'archive' && <Tickets tickets={tickets.filter(t => t.status === 5)} user={user} services={services} isArchive={true} />}
          {activeTab === 'machines' && <Machines machines={machines} />}
          {activeTab === 'services' && <Services services={services} />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'kpi' && <KPIDashboard tickets={tickets} machines={machines} />}
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