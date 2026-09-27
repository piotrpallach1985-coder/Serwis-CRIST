import React from 'react';
import KPIDashboard from './KPIDashboard';
import MapComponent from './Map';
import Tickets from './Tickets';
import { useManagerStore } from '../../store/managerStore';

export default function TicketsLayout({ user, currentTab, setActiveTab }) {
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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide whitespace-nowrap transition-all duration-200 shadow-sm ${
                currentTab === t.id
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

      {currentTab === 'kpi' && <KPIDashboard user={user} />}
      {currentTab === 'dashboard_tickets' && <MapComponent user={user} tickets={ticketsStore} />}
      {currentTab === 'tickets' && <Tickets user={user} />}
      {currentTab === 'archive' && <Tickets isArchive user={user} />}
    </div>
  );
}
