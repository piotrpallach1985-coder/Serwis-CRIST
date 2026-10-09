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
      
      

      {currentTab === 'parts_kpi' && <PartsKPI />}
      {currentTab === 'parts_inventory' && <PartsList />}
      {currentTab === 'parts_transactions' && <PartsTransactionsList />}
      
      {currentTab === 'parts_qr' && <PartsQRCodes />}
    </div>
  );
}
