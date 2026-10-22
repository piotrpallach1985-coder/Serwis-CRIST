import { useAuth } from '../../hooks/useAuth';
import { useManagerStore } from '../../store/managerStore';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { usePermissions } from '../../hooks/usePermissions';
import QRScannerModal from '../shared/QRScannerModal';
import {
  parseQrPayload,
  PART_QR_IN_MACHINE_SCANNER_MSG,
} from '../../services/qrAccess.service';

export default function HomeDashboard({ onLogout }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const machines = useManagerStore(state => state.machines) || [];
  const parts = useManagerStore(state => state.parts) || [];
  const roles = useManagerStore(state => state.roles) || [];
  const branding = useManagerStore(state => state.branding);

  const { isAdmin, canManageUsers, canManageRoles, canViewReports, canAccessCompanyAdmin, canAccessTab } =
    usePermissions(user, roles);

  const [isScanning, setIsScanning] = useState(false);
  const [isScannerSelectOpen, setIsScannerSelectOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('qr');

  const currentLang = (i18n.language || 'pl').startsWith('pl') ? 'pl' : 'en';
  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'pl' ? 'en' : 'pl');
  };

  useEffect(() => {
    if (searchParams.get('scanner') === 'true') {
      setIsScanning(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleScanSuccess = (machineId, rawQr) => {
    setIsScanning(false);

    const parsed = parseQrPayload(rawQr || machineId);
    const candidateId = parsed.partId || parsed.machineId || String(machineId || '').trim();
    const matchedPart = parts.find(
      p => p.id === candidateId || (p.code && p.code === candidateId)
    );
    if (parsed.isPartQr || matchedPart) {
      alert(t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG));
      return;
    }

    const resolvedMachineId = parsed.machineId || String(machineId || '').trim();
    const targetMachine = machines.find(
      m =>
        m.id === resolvedMachineId ||
        m.id === machineId ||
        (m.qrCode && (m.qrCode === resolvedMachineId || m.qrCode === machineId || m.qrCode === rawQr)) ||
        (m.internalId &&
          (m.internalId.toLowerCase() === resolvedMachineId.toLowerCase() ||
            m.internalId.toLowerCase() === String(machineId || '').toLowerCase()))
    );

    if (!targetMachine) {
      alert('Nie znaleziono zeskanowanej maszyny w bazie tej firmy.');
      return;
    }

    navigate(`/manager/ur/machines?openMachine=${targetMachine.id}`);
  };

  const navigateToModule = (moduleName, defaultTab) => {
    navigate(`/manager/${moduleName}/${defaultTab}`);
  };

  const firstAdminTab =
    ['users', 'roles', 'reports', 'audit', 'ai_stats'].find(tab => canAccessTab(tab)) || 'users';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-800">
      {/* GÓRNY PASEK PULPITU GŁÓWNEGO */}
      <header className="bg-transparent text-slate-800 px-3 sm:px-8 py-3.5 flex items-center justify-between gap-2">
        {/* Lewy róg: Logo Aplikacji */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={branding?.appLogoUrl || './pwa-192x192.jpg'}
            alt="App Logo"
            className="h-12 sm:h-20 object-contain rounded-lg"
          />
        </div>

        {/* Profil, język i wylogowanie */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {user?.role === 'superadmin' && (
            <button
              type="button"
              onClick={() => navigateToModule('system_admin', 'superadmin')}
              className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-yellow-950 font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 border border-yellow-400/50 cursor-pointer"
            >
              <i className="ph ph-crown text-base sm:text-xl"></i>
              <span>{t('sidebar.saas_management_menu', 'Zarządzanie SaaS')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors text-xs font-bold cursor-pointer"
            title={t('sidebar.language', 'Język / Language')}
          >
            <i className="ph ph-globe text-base text-blue-600"></i>
            <span className={currentLang === 'pl' ? 'text-blue-600 font-black' : 'text-slate-400'}>
              PL
            </span>
            <span className="text-slate-300">/</span>
            <span className={currentLang === 'en' ? 'text-blue-600 font-black' : 'text-slate-400'}>
              EN
            </span>
          </button>
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.name || 'Użytkownik'}</span>
            <span className="text-[10px] text-slate-500 capitalize">
              {user?.role || 'Operator'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-colors border border-red-200 cursor-pointer shadow-xs"
              title={t('login.logout', 'Wyloguj')}
            >
              <i className="ph ph-sign-out text-base sm:text-lg"></i>
              <span className="hidden xs:inline">{t('login.logout', 'Wyloguj')}</span>
            </button>
          )}
        </div>
      </header>

      {isScannerSelectOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-10 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsScannerSelectOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 cursor-pointer"
            >
              <i className="ph ph-x text-xl"></i>
            </button>
            <h2 className="text-xl sm:text-2xl font-black text-center mb-6 text-slate-800">
              {t('login.select_scan_method', 'Wybierz metodę skanowania')}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsScannerSelectOpen(false);
                  setScannerMode('qr');
                  setIsScanning(true);
                }}
                className="flex-1 py-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <i className="ph ph-qr-code text-5xl"></i>
                {t('login.camera_qr', 'Kamera (QR)')}
              </button>
              <button
                onClick={() => {
                  setIsScannerSelectOpen(false);
                  setScannerMode('nfc');
                  setIsScanning(true);
                }}
                className="flex-1 py-6 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <i className="ph ph-waves text-5xl"></i>
                {t('login.contactless_nfc', 'Zbliżeniowo (NFC)')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SKANERA QR */}
      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        mode={scannerMode}
        title={scannerMode === 'qr' ? 'Skaner Kodów QR' : 'Odczyt NFC'}
        subtitle={
          scannerMode === 'qr'
            ? 'Skieruj aparat na kod QR, aby otworzyć maszynę.'
            : 'Zbliż telefon do naklejki NFC maszyny.'
        }
      />

      {/* GŁÓWNA ZAWARTOŚĆ — 4 KAFELKI */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 max-w-[1400px] mx-auto w-full animate-fade-in">
        <div className="text-center mb-6 sm:mb-10 flex flex-col items-center">
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center font-bold text-[#1f3f88] overflow-hidden shadow-lg mb-3 sm:mb-5 border border-slate-100 p-3">
            {branding?.companyLogoUrl ? (
              <img
                src={branding.companyLogoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center">
                <i className="ph-fill ph-hexagon text-3xl sm:text-5xl"></i>
                <span className="font-black text-[10px] sm:text-sm mt-1 tracking-widest">
                  VexoNT
                </span>
              </div>
            )}
          </div>
          <h1 className="font-black text-xl sm:text-3xl leading-tight tracking-wide text-slate-900 mb-6 sm:mb-8">
            {branding?.companyName || 'VexoNT'}
          </h1>
        </div>

        {/* SIATKA 4 KAFELKÓW - JEDNA LINIA NA DESKTOPIE */}
        <div className="w-full max-w-md lg:max-w-6xl mx-auto px-2 mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* SZYBKIE WYSZUKIWANIE MASZYNY */}
            <button
              type="button"
              onClick={() => {
                setIsScannerSelectOpen(true);
              }}
              className="w-full group flex flex-col items-center justify-center p-5 sm:p-8 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1 overflow-hidden relative"
            >
              <i className="ph ph-magnifying-glass text-5xl sm:text-7xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform font-light"></i>
              <i className="ph ph-qr-code text-2xl absolute top-6 right-6 opacity-50"></i>
              <h3 className="text-base sm:text-lg font-bold tracking-wide">
                {t('login.quick_search_machine', 'Szybkie szukanie maszyny')}
              </h3>
            </button>

            {/* ZGŁOŚ AWARIĘ */}
            <button
              type="button"
              onClick={() => navigate('/manager/ur/new_ticket_scanner')}
              className="w-full group flex flex-col items-center justify-center p-5 sm:p-8 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1 overflow-hidden"
            >
              <i className="ph ph-warning-circle text-5xl sm:text-7xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform font-light"></i>
              <h3 className="text-base sm:text-xl font-bold tracking-wide">
                {t('login.report_fault_btn', 'Zgłoś awarię')}
              </h3>
            </button>

            {/* PANEL UR */}
            <button
              type="button"
              onClick={() => navigateToModule('ur', 'dashboard_tickets')}
              className="w-full group flex flex-col items-center justify-center p-5 sm:p-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-3xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1 overflow-hidden"
            >
              <i className="ph ph-wrench text-5xl sm:text-7xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform font-light"></i>
              <h3 className="text-base sm:text-xl font-bold tracking-wide">
                {t('login.ur_panel', 'Panel UR')}
              </h3>
            </button>

            {/* ADMINISTRATOR */}
            {canAccessCompanyAdmin ? (
              <button
                type="button"
                onClick={() => navigateToModule('company_admin', firstAdminTab)}
                className="w-full group flex flex-col items-center justify-center p-5 sm:p-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-3xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 text-center cursor-pointer aspect-square sm:aspect-auto sm:min-h-[220px] transform hover:-translate-y-1 overflow-hidden"
              >
                <i className="ph ph-desktop text-5xl sm:text-7xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform font-light"></i>
                <h3 className="text-base sm:text-xl font-bold tracking-wide">
                  {t('login.admin_panel', 'Administrator')}
                </h3>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-50 rounded-3xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center opacity-60 aspect-square sm:aspect-auto sm:min-h-[220px]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-slate-200 text-slate-400 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center text-3xl sm:text-5xl mb-3 sm:mb-5">
                  <i className="ph ph-lock"></i>
                </div>
                <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                  {t('login.no_access', 'Brak Dostępu')}
                </h3>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* STOPKA PULPITU */}
      <footer className="py-4 text-center text-[10px] sm:text-xs font-medium text-slate-400 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        {t('login.footer_subtitle', 'VexoNT • System Obsługi Awarii & Serwisu')}
      </footer>
    </div>
  );
}
