import React from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../../store/managerStore';

export default function SidebarNavSystemAdmin({ saasTenants, onNavigate }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1 mt-4 px-3">
      <div className="px-3 py-1.5 text-[11px] font-bold text-yellow-500 uppercase tracking-wider mb-1">
        Lista Firm (SaaS)
      </div>
      {saasTenants.map(tenantItem => (
         <button
          key={tenantItem.id}
          onClick={() => {
             useManagerStore.getState().setTenantId(tenantItem.id);
             onNavigate('home', 'home');
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <i className="ph ph-buildings text-xl shrink-0"></i>
          <span className="text-sm">{tenantItem.name || tenantItem.id}</span>
        </button>
      ))}
    </div>
  );
}
