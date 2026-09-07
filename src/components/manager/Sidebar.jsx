import { useManagerContext } from '../../context/ManagerDataContext';
import React from 'react';
import NotificationCenter from './NotificationCenter';
import { safeParseDate } from '../../utils/dateHelpers';

export default function Sidebar({
  // Nawigacja
  currentModule = 'ur',
  activeTab,
  onTabChange,
  isSidebarOpen,
  onSidebarClose,
  onGoHome,
  // Użytkownik i uprawnienia
  user,
  // Akcje
  onLogout,
  onNavigate
}) {
  const {
    tickets = [],
    machines = [],
    reporters = [],
    services = [],
    plannedServices = [],
    notifications = [],
    actionItems = [],
    roles = [],
    regions = [],
    plannedWarningDays = 30,
    branding = {}
  } = useManagerContext();

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

  // Obliczenia badge'y dla modułu UR
  const newTicketsCount = tickets.filter(t => t.status === 1 || t.status === '1').length;
  const criticalTicketsCount = tickets.filter(t => t.isCritical && t.status !== 5 && t.status !== '5').length;

  // 2. Przedawnione serwisy (Krytyczne - termin minął wg daty lub roboczogodzin)
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

  // 3. Serwisy na najbliższe dni (zgodnie z ustawieniem plannedWarningDays)
  const upcomingServicesCount = plannedServices.filter(s => {
    if (s.status === 'completed' || s.status === 'in_progress') return false;
    if (!s.nextDate) return false;
    const due = safeParseDate(s.nextDate);
    if (!due) return false;
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff <= plannedWarningDays;
  }).length;

  const openActionItemsCount = actionItems.filter(i => i.status !== 'completed').length;
  const unverifiedMachinesCount = machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).length;
  const unverifiedReportersCount = reporters.filter(r => r.name && r.name.includes('(DO WERYFIKACJI)')).length;

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
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-inner flex-shrink-0">
              {branding?.companyLogoUrl ? (
                <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                branding?.companyName?.charAt(0) || 'C'
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm sm:text-base leading-tight tracking-wide truncate">
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
            {/* Dzwoneczek informacyjny w Panelu UR (widoczny tylko na desktopie, na mobile jest w górnej belce) */}
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
            <button 
              onClick={onSidebarClose} 
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg"
              title="Zamknij menu"
            >
              <i className="ph ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        {/* ZAWARTOŚĆ SIDEBARA W ZALEŻNOŚCI OD MODUŁU */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-5 px-3 space-y-6">
          
          {/* ========================================================================= */}
          {/* MODUŁ: PANEL AWARII / SERWISÓW UR */}
          {/* ========================================================================= */}
          {isUrModule && (
            <>
              {/* SEKCJA 1: AWARIE */}
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Awarie UR</span>
                  {criticalTicketsCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                      {criticalTicketsCount} kryt.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleItemClick('dashboard_tickets')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'dashboard_tickets' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin text-xl shrink-0"></i>
                  <span className="text-sm">Mapa Awarii</span>
                </button>

                <button
                  onClick={() => handleItemClick('tickets')}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'tickets' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-list-dashes text-xl shrink-0"></i>
                    <span className="text-sm truncate">Zgłoszone awarie</span>
                  </div>
                  {newTicketsCount > 0 && (
                    <span className={`${criticalTicketsCount > 0 ? 'bg-red-600 text-white font-bold' : 'bg-yellow-400 text-slate-950 font-extrabold'} text-[10px] px-2 py-0.5 rounded-full shrink-0 shadow-xs`}>
                      {newTicketsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('archive')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'archive' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-archive text-xl shrink-0"></i>
                  <span className="text-sm">Archiwum Awarii</span>
                </button>

                <button
                  onClick={() => handleItemClick('kpi')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'kpi' ? 'bg-red-500/20 text-red-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-chart-line-up text-xl shrink-0"></i>
                  <span className="text-sm">Analiza Awarii (KPI)</span>
                </button>
              </div>

              {/* SEKCJA 2: SERWISY */}
              <div className="space-y-1 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Serwisy UR</span>
                  {overdueServicesCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                      {overdueServicesCount} kryt.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleItemClick('dashboard_planned')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'dashboard_planned' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin text-xl shrink-0"></i>
                  <span className="text-sm">Mapa Serwisów</span>
                </button>

                <button
                  onClick={() => handleItemClick('planned_maintenance')}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'planned_maintenance' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-calendar-check text-xl shrink-0"></i>
                    <span className="text-sm truncate">Lista serwisów</span>
                  </div>
                  {upcomingServicesCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                      {upcomingServicesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('action_items')}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'action_items' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-clipboard-text text-xl shrink-0"></i>
                    <span className="text-sm truncate">Tematy do realizacji</span>
                  </div>
                  {openActionItemsCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                      {openActionItemsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('archive_planned')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'archive_planned' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-archive text-xl shrink-0"></i>
                  <span className="text-sm">Archiwum serwisów</span>
                </button>
              </div>

              {/* SEKCJA 3: DANE BAZOWE */}
              <div className="space-y-1 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Dane Bazowe
                </div>

                <button
                  onClick={() => handleItemClick('machines')}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'machines' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-database text-xl shrink-0"></i>
                    <span className="text-sm truncate">Baza Urządzeń</span>
                  </div>
                  {unverifiedMachinesCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shrink-0 shadow-xs">
                      {unverifiedMachinesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleItemClick('regions')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'regions' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-map-pin-line text-xl shrink-0"></i>
                  <span className="text-sm">Rejony</span>
                </button>

                <button
                  onClick={() => handleItemClick('services')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'services' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-wrench text-xl shrink-0"></i>
                  <span className="text-sm">Podwykonawcy / Serwisy</span>
                </button>

                <button
                  onClick={() => handleItemClick('topics')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'topics' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <i className="ph ph-text-aa text-xl shrink-0"></i>
                  <span className="text-sm">Tematy Zgłoszeń</span>
                </button>

                <button
                  onClick={() => handleItemClick('reporters')}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 group text-left ${activeTab === 'reporters' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="ph ph-users text-xl shrink-0"></i>
                    <span className="text-sm truncate">Zgłaszający</span>
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
          {/* MODUŁ: PANEL ADMINISTRATORA FIRMY */}
          {/* ========================================================================= */}
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
                <span className="text-sm">Użytkownicy</span>
              </button>

              <button
                onClick={() => handleItemClick('roles')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'roles' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-shield-check text-xl shrink-0"></i>
                <span className="text-sm">Role i Uprawnienia</span>
              </button>

              <button
                onClick={() => handleItemClick('reports')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'reports' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-chart-bar text-xl shrink-0"></i>
                <span className="text-sm">Raportowanie</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODUŁ: PANEL ADMINISTRATORA PROGRAMU */}
          {/* ========================================================================= */}
          {isSystemAdmin && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Administrator Programu
              </div>

              <button
                onClick={() => handleItemClick('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'settings' ? 'bg-slate-700 text-white font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <i className="ph ph-gear-six text-xl shrink-0"></i>
                <span className="text-sm">Ustawienia & Moduły</span>
              </button>
            </div>
          )}

        </div>

        {/* STOPKA SIDEBARA — PROFIL + DWA PRZYCISKI (GŁÓWNY i WYLOGUJ) */}
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
          
          <div className="grid grid-cols-2 gap-2">
            {/* PRZYCISK GŁÓWNY (Powrót do 4 kafelków) */}
            <button 
              onClick={handleReturnHome}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 rounded-xl text-sm font-medium text-gray-200 hover:text-white transition-all border border-gray-700 cursor-pointer shadow-xs"
              title="Wróć do Pulpitu Głównego"
            >
              <i className="ph ph-house text-lg text-blue-400"></i>
              <span>Główny</span>
            </button>
            
            {/* PRZYCISK WYLOGUJ */}
            <button 
              onClick={onLogout}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 active:bg-red-950 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 transition-all border border-red-900/50 cursor-pointer shadow-xs"
              title="Wyloguj się z konta"
            >
              <i className="ph ph-sign-out text-lg"></i>
              <span>Wyloguj</span>
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}

