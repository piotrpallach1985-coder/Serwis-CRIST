import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useManagerStore } from '../../store/managerStore';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNavUR from './sidebar/SidebarNavUR';
import SidebarNavCompanyAdmin from './sidebar/SidebarNavCompanyAdmin';
import SidebarNavSystemAdmin from './sidebar/SidebarNavSystemAdmin';
import SidebarFooter from './sidebar/SidebarFooter';

export default function Sidebar({
  currentModule = 'ur',
  activeTab,
  onTabChange,
  isSidebarOpen,
  onSidebarClose,
  onGoHome,
  onLogout,
  onNavigate
}) {
  const { user } = useAuth();
  const [saasTenants, setSaasTenants] = useState([]);

  useEffect(() => {
    if (currentModule === 'system_admin' && user?.role === 'superadmin') {
      const unsub = onSnapshot(collection(db, 'tenant_registry'), (snap) => {
         setSaasTenants(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(t => t.id !== '_global_settings_'));
      });
      return () => unsub();
    }
  }, [currentModule, user]);

  const tickets = useManagerStore(state => state.tickets) || [];
  const machines = useManagerStore(state => state.machines) || [];
  const reporters = useManagerStore(state => state.reporters) || [];
  const plannedServices = useManagerStore(state => state.plannedServices) || [];
  const notifications = useManagerStore(state => state.notifications) || [];
  const actionItems = useManagerStore(state => state.actionItems) || [];
  const branding = useManagerStore(state => state.branding) || {};

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024 && onSidebarClose) {
      onSidebarClose();
    }
  };

  const handleReturnHome = () => {
    if (onGoHome) {
      onGoHome();
    } else if (onNavigate) {
      onNavigate('home', 'home');
    }
    if (window.innerWidth < 1024 && onSidebarClose) {
      onSidebarClose();
    }
  };

  const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data';
  const isCompanyAdmin = currentModule === 'company_admin';
  const isSystemAdmin = currentModule === 'system_admin';

  return (
    <>
      {/* TĹ‚o przyciemniajÄ…ce na mobile */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onSidebarClose}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 z-[200] w-64 h-full bg-[#1B253B] text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <SidebarHeader 
          currentModule={currentModule}
          user={user}
          onSidebarClose={onSidebarClose}
          branding={branding}
          isUrModule={isUrModule}
          isCompanyAdmin={isCompanyAdmin}
          isSystemAdmin={isSystemAdmin}
          tickets={tickets}
          plannedServices={plannedServices}
          machines={machines}
          reporters={reporters}
          actionItems={actionItems}
          notifications={notifications}
          onNavigate={onNavigate}
        />

        {/* GĹĂ“WNA LISTA NAWIGACYJNA (SCROLLOWANA) */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 space-y-3">
          {isUrModule && (
            <SidebarNavUR 
              activeTab={activeTab} 
              handleItemClick={handleItemClick}
              branding={branding}
            />
          )}

          {isSystemAdmin && (
            <SidebarNavSystemAdmin 
              saasTenants={saasTenants} 
              onNavigate={onNavigate} 
            />
          )}

          {isCompanyAdmin && (
            <SidebarNavCompanyAdmin 
              activeTab={activeTab} 
              handleItemClick={handleItemClick} 
            />
          )}
        </div>

        <SidebarFooter 
          user={user} 
          onNavigate={onNavigate} 
          handleReturnHome={handleReturnHome} 
          onLogout={onLogout} 
        />
      </aside>
    </>
  );
}
