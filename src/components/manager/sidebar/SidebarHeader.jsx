import React from 'react';
import NotificationCenter from '../NotificationCenter';

export default function SidebarHeader({ 
  currentModule, 
  user, 
  onSidebarClose, 
  branding, 
  isUrModule, 
  isCompanyAdmin, 
  isSystemAdmin,
  tickets,
  plannedServices,
  machines,
  reporters,
  actionItems,
  notifications,
  onNavigate
}) {
  return (
    <div className="flex-shrink-0 h-16 bg-[#161f30] px-5 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-inner flex-shrink-0">
          {isSystemAdmin ? (
            <i className="ph ph-crown text-2xl text-yellow-600"></i>
          ) : branding?.companyLogoUrl ? (
            <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            branding?.companyName?.charAt(0) || 'C'
          )}
        </div>
        
        <div className="overflow-hidden">
          <div className="font-bold text-sm sm:text-base leading-tight tracking-wide truncate text-white">
            {branding?.companyName || 'VexoNT'}
          </div>
          <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold truncate">
            {isUrModule && 'PANEL AWARII & SERWISU'}
            {isCompanyAdmin && 'ADMINISTRATOR FIRMY'}
            {isSystemAdmin && 'ADMINISTRATOR PROGRAMU'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isUrModule && (
          <div className="hidden lg:block">
            <NotificationCenter 
              currentModule={currentModule}
              user={user}
              onNavigate={onNavigate}
              align="left"
              tickets={tickets}
              plannedServices={plannedServices}
              machines={machines}
              reporters={reporters}
              actionItems={actionItems}
              notifications={notifications}
            />
          </div>
        )}
        
        <button onClick={onSidebarClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-auto">
          <i className="ph ph-x text-xl"></i>
        </button>
      </div>
    </div>
  );
}
