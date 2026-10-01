import React from 'react';
import { useTranslation } from 'react-i18next';
import { forceUpdatePWA } from '../../../utils/pwaHelper';

export default function SidebarFooter({ user, onNavigate, handleReturnHome, onLogout }) {
  const { t, i18n } = useTranslation();

  return (
    <>
      <div className="flex-shrink-0 bg-[#121927] border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-bold text-white truncate">{user?.name || 'UĹĽytkownik'}</div>
            <div className="text-xs text-blue-400 font-medium truncate capitalize">{user?.role || 'Brak roli'}</div>
          </div>
        </div>
        
        {user?.role === 'superadmin' && (
          <button
            onClick={() => onNavigate('system_admin', 'superadmin')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-yellow-950/40 hover:bg-yellow-900/60 active:bg-yellow-950 rounded-xl text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-all border border-yellow-900/50 cursor-pointer shadow-xs mb-2"
            title="ZarzÄ…dzanie systemem SaaS"
          >
            <i className="ph ph-crown text-lg"></i>
            <span>{t("sidebar.saas_management_menu")}</span>
          </button>
        )}

        <div className="flex flex-col gap-1.5 mb-2">
          <button
            onClick={handleReturnHome}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer shadow-xs"
            title="WrĂłÄ‡ do ekranu gĹ‚Ăłwnego"
          >
            <i className="ph ph-house text-lg text-blue-400"></i>
            <span>{t("sidebar.main_menu")}</span>
          </button>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-950/40 hover:bg-red-900/60 active:bg-red-950 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 transition-all border border-red-900/50 cursor-pointer shadow-xs"
          title="Wyloguj siÄ™ z konta"
        >
          <i className="ph ph-sign-out text-lg"></i>
          <span>{t("sidebar.logout_menu")}</span>
        </button>
      </div>
      
      <div className="px-3 pb-3">
        <button
          onClick={forceUpdatePWA}
          className="w-full flex flex-col items-center justify-center gap-1 py-1.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/60 active:bg-emerald-950 rounded-xl transition-all border border-emerald-900/50 cursor-pointer shadow-xs"
          title="Aktualizuj aplikację (Wyczyść cache)"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <i className="ph ph-arrows-clockwise text-lg"></i>
            <span className="text-[11px] font-bold uppercase tracking-wider">Aktualizuj PWA</span>
          </div>
          <span className="text-[9px] text-emerald-500/70 truncate w-full text-center">
            Wersja: {import.meta.env.VITE_BUILD_TIME || 'Brak danych'}
          </span>
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
    </>
  );
}
