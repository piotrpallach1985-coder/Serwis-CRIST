import { useState } from 'react';
import Machines from './Machines';
import Regions from './Regions';
import Roles from './Roles';
import Users from './Users';
import Settings from './Settings';
import Services from './Services';
import Topics from './Topics';
import Reporters from './Reporters';

export default function MasterData({ user, machines, regions, services, roles }) {
  const [activeSubTab, setActiveSubTab] = useState('machines');

  const tabs = [
    { id: 'machines', label: 'Baza Maszyn', icon: 'ph-engine' },
    { id: 'regions', label: 'Rejony na stoczni', icon: 'ph-map-pin' },
    { id: 'services', label: 'Podwykonawcy / Serwis', icon: 'ph-wrench' },
    { id: 'topics', label: 'Tematy Zgłoszeń', icon: 'ph-text-aa' },
    { id: 'reporters', label: 'Zgłaszający', icon: 'ph-user-list' }
  ];

  if (user.role === 'admin') {
    tabs.push({ id: 'users', label: 'Użytkownicy', icon: 'ph-users' });
    tabs.push({ id: 'roles', label: 'Role i Uprawnienia', icon: 'ph-shield-check' });
    tabs.push({ id: 'settings', label: 'Ustawienia', icon: 'ph-gear' });
  }

  // Odfiltruj zakładki jeśli użytkownik nie ma uprawnień (podobnie jak w ManagerView)
  let visibleTabs = tabs;
  if (user.role !== 'admin') {
    const userRoleDoc = roles.find(r => r.id === user.role);
    const perms = userRoleDoc?.permissions || [];
    visibleTabs = tabs.filter(t => perms.includes(t.id));
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sub-menu dla Master Data */}
      <div className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Konfiguracja</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {visibleTabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeSubTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <i className={`ph ${tab.icon} text-lg`}></i>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zawartość wybranej zakładki */}
      <div className="flex-1 min-w-0">
        {activeSubTab === 'machines' && <Machines />}
        {activeSubTab === 'regions' && <Regions />}
        {activeSubTab === 'services' && <Services services={services} />}
        {activeSubTab === 'topics' && <Topics />}
        {activeSubTab === 'reporters' && <Reporters />}
        {activeSubTab === 'users' && <Users />}
        {activeSubTab === 'roles' && <Roles />}
        {activeSubTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}
