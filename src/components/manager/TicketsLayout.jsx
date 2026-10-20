import { useAuth } from '../../hooks/useAuth';
import React from 'react';
import KPIDashboard from './KPIDashboard';
import MapComponent from './Map';
import Tickets from './Tickets';
import { useManagerStore } from '../../store/managerStore';

export default function TicketsLayout({ currentTab, setActiveTab }) {
  const { user } = useAuth();
  const ticketsStore = useManagerStore(state => state.tickets) || [];

  const tabs = [
    { id: 'kpi', label: 'KPI', icon: 'ph-chart-line-up' },
    { id: 'dashboard_tickets', label: 'Mapa', icon: 'ph-map-pin' },
    { id: 'tickets', label: 'Lista', icon: 'ph-list-dashes' },
    { id: 'archive', label: 'Archiwum', icon: 'ph-archive' }
  ];

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 relative">
      {/* PWA / Mobile Horizontal Tabs - widoczne na urządzeniach mobilnych i desktopie */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-2 bg-[#f8f9fa]/90 backdrop-blur shadow-sm border-b border-gray-200 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-2">
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide whitespace-nowrap transition-all duration-200 shadow-sm ${
                currentTab === tabItem.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`ph ${tabItem.icon} text-lg`}></i>
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {currentTab === 'kpi' && <KPIDashboard />}
      {currentTab === 'dashboard_tickets' && <MapComponent tickets={ticketsStore} />}
      {currentTab === 'tickets' && <Tickets />}
      {currentTab === 'archive' && <Tickets isArchive />}
    </div>
  );
}
