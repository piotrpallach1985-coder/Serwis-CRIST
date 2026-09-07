import React, { useState, useEffect } from 'react';
import { useManagerContext } from '../../context/ManagerDataContext';
import { usePermissions } from '../../hooks/usePermissions';
import QRScannerModal from '../shared/QRScannerModal';
import { safeParseDate } from '../../utils/dateHelpers';

export default function HomeDashboard({ setActiveTab, setCurrentModule, user, onLogout }) {
  const {
    tickets = [],
    plannedServices = [],
    roles = [],
    branding = {},
  } = useManagerContext();

  const { isAdmin, canManageUsers, canManageRoles, canViewReports } = usePermissions(user, roles);

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scanner') === 'true') {
      setIsScanning(true);
      const newUrl = window.location.pathname + '?module=home&tab=home';
      window.history.replaceState({ module: 'home', tab: 'home' }, '', newUrl);
    }
  }, []);

  const handleScanSuccess = (machineId) => {
    setIsScanning(false);
    setCurrentModule('ur');
    setActiveTab('machines');
    const newUrl = `?module=ur&tab=machines&openMachine=${machineId}`;
    window.history.pushState(
      { module: 'ur', tab: 'machines', openMachine: machineId },
      '',
      newUrl
    );
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { module: 'ur', tab: 'machines', openMachine: machineId }
    }));
  };

  const navigateToModule = (moduleName, defaultTab) => {
    setCurrentModule(moduleName);
    setActiveTab(defaultTab);
    const newUrl = `?module=${moduleName}&tab=${defaultTab}`;
    window.history.pushState({ module: moduleName, tab: defaultTab }, '', newUrl);
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { module: moduleName, tab: defaultTab }
    }));
  };

  // Statystyki operacyjne dla kafelka UR
  const activeTicketsCount = tickets.filter(t => t.status !== 5 && t.status !== '5').length;
  const criticalTicketsCount = tickets.filter(t => t.isCritical && t.status !== 5 && t.status !== '5').length;
  const overdueServicesCount = plannedServices.filter(s => {
    if (s.status === 'completed' || s.status === 'in_progress') return false;
    if (!s.nextDate) return false;
    const nDate = safeParseDate(s.nextDate);
    return nDate && nDate < new Date();
  }).length;

  const canAccessCompanyAdmin = isAdmin || canManageUsers || canManageRoles || canViewReports;
  const canAccessProgramAdmin = isAdmin;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-800">
      {/* GÓRNY PASEK PULPITU GŁÓWNEGO */}
      <header className="bg-transparent text-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {branding?.appLogoUrl ? (
            <img src={branding.appLogoUrl} alt="VexoNT Logo" className="h-8 sm:h-10 object-contain" />
          ) : (
            <div className="font-black text-2xl tracking-tight text-blue-900 flex items-center">
              Vexo<span className="text-blue-600">NT</span>
            </div>
          )}
        </div>

        {/* Profil i wylogowanie */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.name || 'Użytkownik'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.role || 'Operator'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-colors border border-red-200 cursor-pointer"
              title="Wyloguj się"
            >
              <i className="ph ph-sign-out text-base"></i>
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          )}
        </div>
      </header>

      {/* MODAL SKANERA QR */}
      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title="Skaner Kodów QR Maszyny"
        subtitle="Skieruj aparat na tabliczkę QR urządzenia, aby przejść do karty technicznej."
      />

      {/* GŁÓWNA ZAWARTOŚĆ — 4 KAFELKI */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="text-center mb-6 sm:mb-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-md mb-3 sm:mb-4 border border-slate-200">
            {branding?.companyLogoUrl ? (
              <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-3xl sm:text-4xl">{branding?.companyName?.charAt(0) || 'C'}</span>
            )}
          </div>
          <h1 className="font-extrabold text-lg sm:text-2xl leading-tight tracking-wide text-slate-900">
            {branding?.companyName || 'CRIST S.A.'}
          </h1>
          <p className="text-[10px] sm:text-sm text-blue-600 uppercase tracking-widest font-bold mb-4 sm:mb-6">
            {branding?.systemSubtitle || 'MAINTENANCE SYSTEM'}
          </p>
          
          <h2 className="text-base sm:text-3xl font-black text-slate-800 tracking-tight">
            Wybierz moduł do pracy
          </h2>
        </div>

        {/* SIATKA 4 KAFELKÓW (2 kolumny mobile, 4 desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl">
          
          {/* SKANER QR DLA MASZYN */}
          <button
            type="button"
            onClick={() => setIsScanning(true)}
            className="group relative flex flex-col items-center justify-center sm:justify-between p-4 sm:p-7 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 text-center cursor-pointer min-h-[140px] sm:min-h-[250px] transform hover:-translate-y-1"
          >
            <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <i className="ph ph-qr-code"></i>
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 leading-tight">
                Skaner QR
              </h3>
              <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                Zeskanuj kod z tabliczki znamionowej na hali, aby od razu otworzyć kartę maszyny i dokumenty DTR.
              </p>
            </div>

            <div className="hidden sm:flex w-full pt-3 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 mt-auto">
              <span>Uruchom aparat</span>
              <i className="ph ph-camera text-sm"></i>
            </div>
          </button>

          {/* PANEL AWARII / SERWISÓW UR */}
          <button
            type="button"
            onClick={() => navigateToModule('ur', 'dashboard_tickets')}
            className="group relative flex flex-col items-center justify-center sm:justify-between p-4 sm:p-7 bg-white rounded-2xl border-2 border-slate-200 hover:border-red-500 shadow-sm hover:shadow-xl transition-all duration-200 text-center cursor-pointer min-h-[140px] sm:min-h-[250px] transform hover:-translate-y-1"
          >
            <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto bg-red-50 text-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <i className="ph ph-wrench"></i>
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 leading-tight">
                Panel UR
              </h3>
              <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                Awarie bieżące, prewencja, harmonogramy przeglądów oraz baza techniczna zakładu.
              </p>
            </div>

            <div className="hidden sm:flex w-full pt-3 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-red-600 group-hover:text-red-700 mt-auto">
              <span>Otwórz Panel UR</span>
              <i className="ph ph-arrow-right text-sm"></i>
            </div>
          </button>

          {/* PANEL ADMINISTRATORA FIRMY */}
          {canAccessCompanyAdmin ? (
            <button
              type="button"
              onClick={() => navigateToModule('company_admin', 'users')}
              className="group relative flex flex-col items-center justify-center sm:justify-between p-4 sm:p-7 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all duration-200 text-center cursor-pointer min-h-[140px] sm:min-h-[250px] transform hover:-translate-y-1"
            >
              <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto bg-purple-50 text-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <i className="ph ph-users-three"></i>
                </div>
                <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 leading-tight">
                  Administrator
                </h3>
                <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                  Użytkownicy, przypisywanie ról, uprawnienia i raporty audytowe dla dyrekcji.
                </p>
              </div>

              <div className="hidden sm:flex w-full pt-3 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-purple-600 group-hover:text-purple-700 mt-auto">
                <span>Zarządzaj firmą</span>
                <i className="ph ph-arrow-right text-sm"></i>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 sm:p-7 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center opacity-60 min-h-[140px] sm:min-h-[250px]">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-200 text-slate-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl mb-2 sm:mb-3">
                <i className="ph ph-lock"></i>
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-500 mb-1 leading-tight">
                Administrator
              </h3>
              <p className="hidden sm:block text-xs text-slate-400 mt-2">Brak uprawnień do tego modułu.</p>
            </div>
          )}

          {/* PANEL ADMINISTRATORA PROGRAMU */}
          {canAccessProgramAdmin ? (
            <button
              type="button"
              onClick={() => navigateToModule('system_admin', 'settings')}
              className="group relative flex flex-col items-center justify-center sm:justify-between p-4 sm:p-7 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-200 text-center cursor-pointer min-h-[140px] sm:min-h-[250px] transform hover:-translate-y-1"
            >
              <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto bg-slate-100 text-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
                  <i className="ph ph-gear-six"></i>
                </div>
                <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 leading-tight">
                  Administrator programu
                </h3>
                <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                  Ustawienia globalne aplikacji, branding, logo, przełączniki modułów i integracje.
                </p>
              </div>

              <div className="hidden sm:flex w-full pt-3 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-slate-900 mt-auto">
                <span>Ustawienia systemu</span>
                <i className="ph ph-arrow-right text-sm"></i>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 sm:p-7 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center opacity-60 min-h-[140px] sm:min-h-[250px]">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-200 text-slate-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl mb-2 sm:mb-3">
                <i className="ph ph-lock"></i>
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-500 mb-1 leading-tight">
                Administrator programu
              </h3>
              <p className="hidden sm:block text-xs text-slate-400 mt-2">Dostępny tylko dla Administratora Technicznego.</p>
            </div>
          )}

        </div>
      </main>

      {/* STOPKA PULPITU */}
      <footer className="py-4 text-center text-[10px] sm:text-xs font-medium text-slate-400 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        VexoNT • System Obsługi Awarii & Serwisu
      </footer>
    </div>
  );
}
