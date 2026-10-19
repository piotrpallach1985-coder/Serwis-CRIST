import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribePWAInstallState, triggerPWAInstall } from '../../../utils/pwaHelper';

export default function SidebarFooter({ user, onNavigate, handleReturnHome, onLogout }) {
  const { t, i18n } = useTranslation();
  const [pwaState, setPwaState] = useState({ canInstall: false, isInstalled: false });
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePWAInstallState((state) => {
      setPwaState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    const result = await triggerPWAInstall();
    if (result.outcome === 'unavailable') {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <div className="flex-shrink-0 bg-[#121927] border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-bold text-white truncate">{user?.name || 'Użytkownik'}</div>
            <div className="text-xs text-blue-400 font-medium truncate capitalize">{user?.role || 'Brak roli'}</div>
          </div>
        </div>
        
        {user?.role === 'superadmin' && (
          <button
            onClick={() => onNavigate('system_admin', 'superadmin')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-yellow-950/40 hover:bg-yellow-900/60 active:bg-yellow-950 rounded-xl text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-all border border-yellow-900/50 cursor-pointer shadow-xs mb-2"
            title="Zarządzanie systemem SaaS"
          >
            <i className="ph ph-crown text-lg"></i>
            <span>{t("sidebar.saas_management_menu")}</span>
          </button>
        )}

        {!pwaState.isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-950/50 hover:bg-emerald-900/70 active:bg-emerald-950 rounded-xl text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all border border-emerald-800/60 cursor-pointer shadow-xs mb-2"
            title={t("sidebar.install_app_pc", "Zainstaluj aplikację na PC")}
          >
            <i className="ph ph-desktop-tower text-base text-emerald-400"></i>
            <span>{t("sidebar.install_app_pc", "Zainstaluj aplikację na PC")}</span>
          </button>
        )}

        <div className="flex flex-col gap-1.5 mb-2">
          <button
            onClick={handleReturnHome}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer shadow-xs"
            title="Wróć do ekranu głównego"
          >
            <i className="ph ph-house text-lg text-blue-400"></i>
            <span>{t("sidebar.main_menu")}</span>
          </button>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 active:bg-red-950 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 transition-all border border-red-900/50 cursor-pointer shadow-xs"
          title="Wyloguj się z konta"
        >
          <i className="ph ph-sign-out text-lg"></i>
          <span>{t("sidebar.logout_menu")}</span>
        </button>
      </div>
      
      {/* Language Switcher */}
      <div className="p-3 mt-auto border-t border-white/5">
        <button 
          onClick={() => i18n.changeLanguage((i18n.language || 'pl').startsWith('pl') ? 'en' : 'pl')}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <div className="flex items-center gap-1.5">
            <i className="ph ph-globe text-lg"></i>
            <span>{t('sidebar.language')}</span>
          </div>
          <span className="font-bold text-xs bg-black/30 px-2 py-1 rounded">
            {(i18n.language || 'pl').startsWith('pl') ? 'PL' : 'EN'}
          </span>
        </button>
      </div>

      {showInstallModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <i className="ph ph-desktop-tower text-2xl"></i>
              </div>
              <h3 className="text-base font-bold text-white">
                {t('sidebar.install_app_title', 'Instalacja aplikacji VexoNT na komputerze (PC)')}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {t('sidebar.install_app_desc', 'Możesz uruchamiać VexoNT jak natywną aplikację okienkową na komputerze (z ikoną na Pulpicie i pasku zadań):')}
            </p>
            <ul className="space-y-2 text-xs text-slate-200 mb-4">
              <li className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="font-bold text-emerald-400">1.</span>
                <span>{t('sidebar.install_app_step1', 'W przeglądarce Chrome lub Edge kliknij ikonę instalacji (komputer ze strzałką) po prawej stronie paska adresu.')}</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="font-bold text-emerald-400">2.</span>
                <span>{t('sidebar.install_app_step2', 'Alternatywnie otwórz menu przeglądarki (⋮) → Zapisz i udostępnij (lub Aplikacje) → Zainstaluj VexoNT.')}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {t('sidebar.install_app_close', 'Rozumiem')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
