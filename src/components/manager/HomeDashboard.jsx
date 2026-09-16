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
  const [scannerMode, setScannerMode] = useState('qr');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scanner') === 'true') {
      setIsScanning(true);
      const newUrl = window.location.pathname + '?module=home&tab=home';
      window.history.replaceState({ module: 'home', tab: 'home' }, '', newUrl);
    }
  }, []);

  const handleScanSuccess = (machineId, rawQr) => {
      setIsScanning(false);
      
      const targetMachine = machines.find(m => 
        m.id === machineId || 
        (m.qrCode && (m.qrCode === machineId || m.qrCode === rawQr)) || 
        (m.internalId && m.internalId.toLowerCase() === machineId.toLowerCase())
      );
      
      if (!targetMachine) {
        alert('Nie znaleziono zeskanowanej maszyny w bazie tej firmy.');
        return;
      }

      setCurrentModule('ur');
    setActiveTab('machines');
    const newUrl = `?module=ur&tab=machines&openMachine=${targetMachine.id}`;
      window.history.pushState(
        { module: 'ur', tab: 'machines', openMachine: targetMachine.id },
        '',
        newUrl
      );
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { module: 'ur', tab: 'machines', openMachine: targetMachine.id }
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
          <img src={branding?.appLogoUrl || './pwa-192x192.jpg'} alt="App Logo" className="h-16 sm:h-24 object-contain rounded-lg" />
        </div>

        {/* Profil i wylogowanie */}
        <div className="flex items-center gap-3 sm:gap-4">
            {user?.role === 'superadmin' && (
              <button
                type="button"
                onClick={() => navigateToModule('system_admin', 'superadmin')}
                className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-yellow-950 font-bold px-4 py-2 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 border border-yellow-400/50"
              >
                <i className="ph ph-crown text-xl"></i>
                Zarządzanie SaaS
              </button>
            )}
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
        mode={scannerMode}
        title={scannerMode === 'qr' ? "Skaner Kodów QR" : "Odczyt NFC"}
        subtitle={scannerMode === 'qr' ? "Skieruj aparat na kod QR, aby otworzyć maszynę." : "Zbliż telefon do naklejki NFC maszyny."}
      />

      {/* GŁÓWNA ZAWARTOŚĆ — 4 KAFELKI */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 max-w-[1400px] mx-auto w-full animate-fade-in">
          <div className="text-center mb-6 sm:mb-10 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center font-bold text-[#1f3f88] overflow-hidden shadow-lg mb-3 sm:mb-5 border border-slate-100 p-3">
              {branding?.companyLogoUrl ? (
                <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center">
                  <i className="ph-fill ph-hexagon text-3xl sm:text-5xl"></i>
                  <span className="font-black text-[10px] sm:text-sm mt-1 tracking-widest">CRIST</span>
                </div>
              )}
            </div>
            <h1 className="font-black text-xl sm:text-3xl leading-tight tracking-wide text-slate-900 mb-1">
              {branding?.companyName || 'CRIST S.A.'}
            </h1>
            <p className="text-[11px] sm:text-sm text-[#1b5fcc] uppercase tracking-widest font-bold mb-4 sm:mb-8">
              {branding?.systemSubtitle || 'DYSPOZYTORNIA UR'}
            </p>
            
            <h2 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tight">
              Wybierz moduł do pracy
            </h2>
          </div>
  
          {/* SIATKA 3 KAFELKÓW (Zgodna ze zrzutem ekranu) */}
          <div className="w-full max-w-md sm:max-w-4xl mx-auto px-2">
              <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                
                {/* SKANER QR */}
                <button
                  type="button"
                  onClick={() => { setScannerMode('qr'); setIsScanning(true); }}
                  className="w-[calc(50%-0.5rem)] sm:w-1/3 group relative flex flex-col items-center justify-center p-5 sm:p-8 bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-[#1b5fcc] to-[#3a7dfc] text-white rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mb-3 sm:mb-5 shadow-md group-hover:scale-105 transition-transform">
                    <i className="ph ph-qr-code text-3xl sm:text-5xl"></i>
                  </div>
                  <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                    Skaner QR
                  </h3>
                </button>

                {/* SKANER NFC */}
                <button
                  type="button"
                  onClick={() => { setScannerMode('nfc'); setIsScanning(true); }}
                  className="w-[calc(50%-0.5rem)] sm:w-1/3 group relative flex flex-col items-center justify-center p-5 sm:p-8 bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 hover:border-purple-400 shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-[#6b21a8] to-[#a855f7] text-white rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mb-3 sm:mb-5 shadow-md group-hover:scale-105 transition-transform">
                    <i className="ph ph-waves text-3xl sm:text-5xl"></i>
                  </div>
                  <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                    Odczyt NFC
                  </h3>
                </button>
    
                {/* PANEL UR */}
                <button
                  type="button"
                  onClick={() => navigateToModule('ur', 'dashboard_tickets')}
                  className="w-[calc(50%-0.5rem)] sm:w-1/3 group relative flex flex-col items-center justify-center p-5 sm:p-8 bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 hover:border-orange-400 shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto border-[3px] sm:border-[4px] border-[#ed6d24] text-[#ed6d24] rounded-full flex items-center justify-center mb-3 sm:mb-5 shadow-sm group-hover:scale-105 group-hover:bg-[#ed6d24] group-hover:text-white transition-all">
                    <i className="ph ph-wrench text-3xl sm:text-5xl"></i>
                  </div>
                  <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                    Panel UR
                  </h3>
                </button>
    
              </div>
              
              {/* ADMINISTRATOR (Wyśrodkowany na dole) */}
            <div className="flex justify-center">
              {canAccessCompanyAdmin ? (
                <button
                  type="button"
                  onClick={() => navigateToModule('company_admin', 'users')}
                  className="w-1/2 min-w-[160px] sm:w-1/3 group relative flex flex-col items-center justify-center p-5 sm:p-8 bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 hover:border-[#0948b3] shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[260px] transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-[#eef2f6] text-[#0948b3] rounded-2xl sm:rounded-[1.75rem] flex items-center justify-center mb-3 sm:mb-6 group-hover:scale-105 transition-transform shadow-sm">
                    <div className="relative flex items-center justify-center">
                      <i className="ph ph-desktop text-3xl sm:text-5xl"></i>
                      <i className="ph-fill ph-gear absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 text-base sm:text-2xl text-slate-700"></i>
                    </div>
                  </div>
                  <h3 className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Administrator
                  </h3>
                </button>
              ) : (
                <div className="w-1/2 min-w-[160px] sm:w-1/3 flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-50 rounded-3xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center opacity-60 aspect-square sm:aspect-auto sm:min-h-[260px]">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-slate-200 text-slate-400 rounded-2xl sm:rounded-[1.75rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-6">
                    <i className="ph ph-lock"></i>
                  </div>
                  <h3 className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Brak Dostępu
                  </h3>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* STOPKA PULPITU */}
      <footer className="py-4 text-center text-[10px] sm:text-xs font-medium text-slate-400 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        VexoNT • System Obsługi Awarii & Serwisu
      </footer>
    </div>
  );
}
