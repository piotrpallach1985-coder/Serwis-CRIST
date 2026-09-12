import { useManagerStore } from '../../store/managerStore';
import React, { useState, useEffect } from 'react';

import { usePermissions } from '../../hooks/usePermissions';
import QRScannerModal from '../shared/QRScannerModal';
import { safeParseDate } from '../../utils/dateHelpers';
import { TICKET_STATUS } from '../../utils/constants';

export default function HomeDashboard({ setActiveTab, setCurrentModule, user, onLogout }) {
  const tickets = useManagerStore(state => state.tickets) || [];
  const machines = useManagerStore(state => state.machines) || [];
  const plannedServices = useManagerStore(state => state.plannedServices) || [];
  const roles = useManagerStore(state => state.roles) || [];
  const isArchive = useManagerStore(state => state.isArchive);
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays);
  const branding = useManagerStore(state => state.branding);

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
  const activeTicketsCount = tickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED).length;
  const criticalTicketsCount = tickets.filter(t => t.isCritical && Number(t.status) !== TICKET_STATUS.CLOSED).length;
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
        {/* Lewy róg: Logo Aplikacji */}
        <div className="flex items-center gap-3">
          <img src={branding?.appLogoUrl || '/pwa-192x192.jpg'} alt="App Logo" className="h-16 sm:h-24 object-contain rounded-lg" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-colors border border-red-200 cursor-pointer shadow-sm"
              title="Wyloguj się"
            >
              <i className="ph ph-sign-out text-base sm:text-lg"></i>
              <span>Wyloguj</span>
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
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 max-w-[1400px] mx-auto w-full animate-fade-in">
        <div className="text-center mb-6 sm:mb-10 flex flex-col items-center">
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-lg mb-3 sm:mb-5 border border-slate-100">
            {branding?.companyLogoUrl ? (
              <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-2 sm:p-3" />
            ) : (
              <span className="text-4xl sm:text-5xl">{branding?.companyName?.charAt(0) || 'C'}</span>
            )}
          </div>
          <h1 className="font-black text-xl sm:text-3xl leading-tight tracking-wide text-slate-900">
            {branding?.companyName || 'CRIST S.A.'}
          </h1>
          <p className="text-[11px] sm:text-sm text-blue-600 uppercase tracking-widest font-bold mb-4 sm:mb-8">
            {branding?.systemSubtitle || 'MAINTENANCE SYSTEM'}
          </p>
          
          <h2 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tight">
            Wybierz moduł do pracy
          </h2>
        </div>

        {/* SIATKA 4 KAFELKÓW (2 kolumny mobile, 4 desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 w-full max-w-6xl">
          
          {/* SKANER QR DLA MASZYN */}
          <button
            type="button"
            onClick={() => setIsScanning(true)}
            className="group relative flex flex-col items-center justify-center sm:justify-between p-5 sm:p-8 bg-white rounded-3xl border border-slate-100 hover:border-blue-400 shadow-md hover:shadow-2xl transition-all duration-300 text-center cursor-pointer min-h-[160px] sm:min-h-[280px] transform hover:-translate-y-2"
          >
            <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-24 sm:h-24 mx-auto bg-blue-50/80 text-blue-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <i className="ph ph-qr-code"></i>
              </div>
              <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">
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
            className="group relative flex flex-col items-center justify-center sm:justify-between p-5 sm:p-8 bg-white rounded-3xl border border-slate-100 hover:border-red-400 shadow-md hover:shadow-2xl transition-all duration-300 text-center cursor-pointer min-h-[160px] sm:min-h-[280px] transform hover:-translate-y-2"
          >
            <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-24 sm:h-24 mx-auto bg-red-50/80 text-red-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-6 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <i className="ph ph-wrench"></i>
              </div>
              <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">
                Panel UR
              </h3>
              <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                Awarie bieżące, prewencja, harmonogramy przeglądów oraz baza techniczna zakładu.
              </p>
            </div>

            <div className="hidden sm:flex w-full pt-4 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-red-600 group-hover:text-red-700 mt-auto">
              <span>Otwórz Panel UR</span>
              <i className="ph ph-arrow-right text-sm"></i>
            </div>
          </button>

          {/* PANEL ADMINISTRATORA FIRMY */}
          {canAccessCompanyAdmin ? (
            <button
              type="button"
              onClick={() => navigateToModule('company_admin', 'users')}
              className="group relative flex flex-col items-center justify-center sm:justify-between p-5 sm:p-8 bg-white rounded-3xl border border-slate-100 hover:border-purple-400 shadow-md hover:shadow-2xl transition-all duration-300 text-center cursor-pointer min-h-[160px] sm:min-h-[280px] transform hover:-translate-y-2"
            >
              <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
                <div className="w-14 h-14 sm:w-24 sm:h-24 mx-auto bg-purple-50/80 text-purple-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <i className="ph ph-users-three"></i>
                </div>
                <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">
                  Administrator
                </h3>
                <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                  Użytkownicy, przypisywanie ról, uprawnienia i raporty audytowe dla dyrekcji.
                </p>
              </div>

              <div className="hidden sm:flex w-full pt-4 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-purple-600 group-hover:text-purple-700 mt-auto">
                <span>Zarządzaj firmą</span>
                <i className="ph ph-arrow-right text-sm"></i>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center opacity-60 min-h-[160px] sm:min-h-[280px]">
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-200 text-slate-400 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-4xl mb-3 sm:mb-5">
                <i className="ph ph-lock"></i>
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-500 mb-1 leading-tight tracking-tight">
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
              className="group relative flex flex-col items-center justify-center sm:justify-between p-5 sm:p-8 bg-white rounded-3xl border border-slate-100 hover:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 text-center cursor-pointer min-h-[160px] sm:min-h-[280px] transform hover:-translate-y-2"
            >
              <div className="my-auto py-1 sm:py-2 flex flex-col items-center">
                <div className="w-14 h-14 sm:w-24 sm:h-24 mx-auto bg-slate-100/80 text-slate-700 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-6 group-hover:scale-110 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
                  <i className="ph ph-gear-six"></i>
                </div>
                <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mb-1 leading-tight tracking-tight">
                  Admin Programu
                </h3>
                <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 px-2 mt-2">
                  Ustawienia globalne aplikacji, branding, logo, przełączniki modułów i integracje.
                </p>
              </div>

              <div className="hidden sm:flex w-full pt-4 border-t border-slate-100 items-center justify-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-slate-900 mt-auto">
                <span>Ustawienia systemu</span>
                <i className="ph ph-arrow-right text-sm"></i>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center opacity-60 min-h-[160px] sm:min-h-[280px]">
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-200 text-slate-400 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-4xl mb-3 sm:mb-5">
                <i className="ph ph-lock"></i>
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-500 mb-1 leading-tight tracking-tight">
                Admin Programu
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
