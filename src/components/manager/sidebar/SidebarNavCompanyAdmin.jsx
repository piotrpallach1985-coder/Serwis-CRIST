import React from 'react';
import { useTranslation } from 'react-i18next';

export default function SidebarNavCompanyAdmin({ activeTab, handleItemClick }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <div className="px-3 py-1.5 text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">
        Administracja Firmy
      </div>

      <button
        onClick={() => handleItemClick('users')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'users' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-users-three text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.users_menu")}</span>
      </button>

      <button
        onClick={() => handleItemClick('roles')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'roles' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-shield-check text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.roles_permissions_menu")}</span>
      </button>

      <button
        onClick={() => handleItemClick('reports')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'reports' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-chart-bar text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.reporting_menu")}</span>
      </button>

      <button
        onClick={() => handleItemClick('audit')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'audit' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-scroll text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.audit_logs_menu")}</span>
      </button>

      <button
        onClick={() => handleItemClick('ai_stats')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'ai_stats' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-brain text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.ai_usage_menu")}</span>
      </button>
      
      <button
        onClick={() => handleItemClick('api_settings')}
        className={`w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 group text-left ${activeTab === 'api_settings' ? 'bg-purple-600/30 text-purple-200 font-semibold shadow-xs' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
      >
        <i className="ph ph-plugs-connected text-lg shrink-0"></i>
        <span className="text-[13px]">{t("sidebar.api_settings_menu", "Klucze API (Integracje)")}</span>
      </button>
    </div>
  );
}
