Created At: 2026-09-18T21:34:23+02:00
Completed At: 2026-09-18T21:34:23+02:00

The command exited with code 0.
Output:

  
  export default function Sidebar({
    // Nawigacja
>   currentModule = 'ur',
    activeTab,
    onTabChange,
    isSidebarOpen,
      }
    };
  
>   // Obliczenia badge'y dla modu�'u UR
    const activeTicketsCount = tickets.length;
    const criticalTicketsCount = tickets.filter(t => t.isCritical && Number(t.status) !== TICKET_STATUS.CLOSED).length;
  
>   // 2. Przedawnione serwisy (Krytyczne - termin min��' wg daty lub roboczogodzin)
    const overdueServicesCount = plannedServices.filter(s => {
      if (s.status === 'completed' || s.status === 'in_progress') return false;
      let isOverdue = false;
      return isOverdue;
    }).length;
  
>   // 3. Serwisy na najbli�sze dni (zgodnie z ustawieniem plannedWarningDays)
    const upcomingServicesCount = plannedServices.filter(s => {
      if (s.status === 'completed' || s.status === 'in_progress') return false;
      if (!s.nextDate) return false;
    const unverifiedMachinesCount = machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).length;
    const unverifiedReportersCount = reporters.filter(r => r.name && r.name.includes('(DO WERYFIKACJI)')).length;
  
>   const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance'
 || currentModule === 'master_data';
>   const isCompanyAdmin = currentModule === 'company_admin';
>   const isSystemAdmin = currentModule === 'system_admin';
  
    return (
      <>
  
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Dzwoneczek informacyjny w Panelu UR (widoczny tylko na desktopie, na mobile jest w gƈrnej belce) */}
>             {isUrModule && (
                <div className="hidden lg:block">
                  <NotificationCenter 
>                   currentModule={currentModule}
                    user={user}
                    onNavigate={onNavigate}
                    align="left"
            </div>
          </div>
  
>         {/* ZAWARTO� SIDEBARA W ZALE�NO�CI OD MODU�?U */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-5 px-3 space-y-6">
            
            {/* ========================================================================= */}
>           {/* MODU�?: PANEL AWARII / SERWIS�"W UR */}
            {/* ========================================================================= */}
>           {isUrModule && (
              <>
                {/* SEKCJA 1: AWARIE */}
                <div className="space-y-1">
                    </button>
                  </div>
  
>     {branding?.modules?.planned_services !== false && (
      <>
    {/* SEKCJA 2: SERWISY */}
                <div className="space-y-1 pt-2 border-t border-gray-800/80">
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group
 text-left ${activeTab === 'services' ? 'bg-blue-600/30 text-blue-200 font-semibold shadow-xs' : 'text-gray-300 hover:b
g-white/5 hover:text-white'}`}
                  >
                    <i className="ph ph-wrench text-xl shrink-0"></i>
>                   <span className="text-sm">Podwykonawcy / Serwisy</span>
                  </button>
  
                  <button
            )}
  
            {/* ========================================================================= */}
>           {/* MODU�?: PANEL ADMINISTRATORA FIRMY */}
            {/* ========================================================================= */}
            {isCompanyAdmin && (
              <div className="space-y-1">
                  window.location.reload(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-950/40 hover:bg-blue-900/60 active:
bg-blue-950 rounded-xl text-sm font-medium text-blue-300 hover:text-blue-200 transition-all border border-blue-900/50 c
ursor-pointer shadow-xs"
>               title="Wymu�> od�>wie�enie pami�tci podr�tcznej aplikacji"
              >
                <i className="ph ph-arrows-clockwise text-lg"></i>
>               <span>Od�>wie�</span>
              </button>
            </div>
            



