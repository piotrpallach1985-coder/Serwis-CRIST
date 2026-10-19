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
      <div className="flex-shrink-0 bg-[#121927] border-t border-gray-800 p-2.5">
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-bold text-white truncate leading-tight">{user?.name || 'Użytkownik'}</div>
            <div className="text-[11px] text-blue-400 font-medium truncate capitalize leading-tight">{user?.role || 'Brak roli'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleReturnHome}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer shadow-xs"
            title="Wróć do ekranu głównego"
          >
            <i className="ph ph-house text-base text-blue-400"></i>
            <span className="truncate">{t("sidebar.main_menu")}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 active:bg-red-950 rounded-xl text-xs font-medium text-red-300 hover:text-red-200 transition-all border border-red-900/50 cursor-pointer shadow-xs"
            title="Wyloguj się z konta"
          >
            <i className="ph ph-sign-out text-base"></i>
            <span className="truncate">{t("sidebar.logout_menu")}</span>
          </button>
        </div>
      </div>
      
      {/* PC Install & Language Switcher */}
      <div className="px-2.5 py-2 mt-auto border-t border-white/5 space-y-1.5 bg-[#121927]">
        {!pwaState.isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-950/50 hover:bg-emerald-900/70 active:bg-emerald-950 rounded-lg text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all border border-emerald-800/60 cursor-pointer shadow-xs"
            title={t("sidebar.install_app_pc", "Zainstaluj aplikację na PC")}
          >
            <i className="ph ph-desktop-tower text-base text-emerald-400"></i>
            <span className="truncate">{t("sidebar.install_app_pc", "Zainstaluj aplikację na PC")}</span>
          </button>
        )}

        <button 
          onClick={() => i18n.changeLanguage((i18n.language || 'pl').startsWith('pl') ? 'en' : 'pl')}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <i className="ph ph-globe text-base"></i>
            <span>{t('sidebar.language')}</span>
          </div>
          <span className="font-bold text-[11px] bg-black/30 px-2 py-0.5 rounded">
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
