import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import React from 'react';
import PartsKPI from './PartsKPI';
import PartsList from './PartsList';

import PartsQRCodes from './PartsQRCodes';
import PartsTransactionsList from './PartsTransactionsList';

export default function PartsLayout({ currentTab, setActiveTab }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const tabs = [
    { id: 'parts_kpi', label: t('parts.tabs.kpi'), icon: 'ph-chart-pie-slice' },
    { id: 'parts_inventory', label: t('parts.tabs.inventory'), icon: 'ph-archive-box' },
    { id: 'parts_transactions', label: t('parts.tabs.transactions'), icon: 'ph-arrows-left-right' },
    
    { id: 'parts_qr', label: t('parts.tabs.qr'), icon: 'ph-qr-code' }
  ];

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 relative">
      
      {/* PWA / Mobile Horizontal Tabs - widoczne glownie na urzadzeniach mobilnych */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 pb-2 bg-slate-50/90 backdrop-blur shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-2">
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide whitespace-nowrap transition-all duration-200 shadow-sm ${
                currentTab === tabItem.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`ph ${t.icon} text-lg`}></i>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {currentTab === 'parts_kpi' && <PartsKPI />}
      {currentTab === 'parts_inventory' && <PartsList />}
      {currentTab === 'parts_transactions' && <PartsTransactionsList />}
      
      {currentTab === 'parts_qr' && <PartsQRCodes />}
    </div>
  );
}
