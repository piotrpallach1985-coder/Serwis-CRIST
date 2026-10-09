import { useAuth } from '../../hooks/useAuth';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PlannedKPIDashboard from './PlannedKPIDashboard';
import MapComponent from './Map';
import PlannedMaintenance from './PlannedMaintenance';
import ActionItems from './ActionItems';
import { useManagerStore } from '../../store/managerStore';

export default function PlannedMaintenanceLayout({ currentTab, setActiveTab }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const ticketsStore = useManagerStore(state => state.tickets) || [];

  const tabs = [
    { id: 'planned_kpi', label: t('planned.tab_kpi'), icon: 'ph-chart-line-up' },
    { id: 'dashboard_planned', label: t('planned.tab_map'), icon: 'ph-map-pin' },
    { id: 'planned_maintenance', label: t('planned.tab_list'), icon: 'ph-calendar-check' },
    { id: 'action_items', label: t('planned.tab_tasks'), icon: 'ph-check-square' },
    { id: 'planned_maintenance_archive', label: t('planned.tab_archive'), icon: 'ph-archive' }
  ];

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 relative">
      

      {currentTab === 'planned_kpi' && <PlannedKPIDashboard />}
      {currentTab === 'dashboard_planned' && <MapComponent tickets={ticketsStore} mode="services" />}
      {currentTab === 'planned_maintenance' && <PlannedMaintenance />}
      {currentTab === 'action_items' && <ActionItems />}
      {currentTab === 'planned_maintenance_archive' && <PlannedMaintenance isArchive />}
    </div>
  );
}
