import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';

export function useManagerRouting() {
  const { module: routeModule, tab: routeTab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentModule = routeModule || 'home';
  const activeTab = routeTab || (currentModule === 'home' ? 'home' : 'dashboard_tickets');

  const [globalTicketId, setGlobalTicketId] = useState(() => searchParams.get('openTicket'));
  const [globalServiceId, setGlobalServiceId] = useState(() => searchParams.get('openService'));
  const [globalMachineId, setGlobalMachineId] = useState(() => searchParams.get('openMachine'));

  const setCurrentModule = (mod) => { navigate(`/manager/${mod}/${activeTab}`); };
  const setActiveTab = (tab) => { navigate(`/manager/${currentModule}/${tab}`); };

  const handleTabChange = (tabId) => {
    navigate(`/manager/${currentModule}/${tabId}`);
  };

  const clearUrlParam = (paramName) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete(paramName);
      return newParams;
    }, { replace: true, state: location.state });
  };

  const handleNavigate = (module, tab, extra = {}) => {
    const params = new URLSearchParams();
    
    if (extra.ticketId) {
      setGlobalTicketId(extra.ticketId);
      params.set('openTicket', extra.ticketId);
    }
    if (extra.serviceId) {
      setGlobalServiceId(extra.serviceId);
      params.set('openService', extra.serviceId);
    }
    if (extra.machineId) {
      setGlobalMachineId(extra.machineId);
      params.set('openMachine', extra.machineId);
    }
    if (extra.partId) {
      params.set('openPart', extra.partId);
    }
    
    const searchString = params.toString() ? '?' + params.toString() : '';
    navigate(`/manager/${module}/${tab}${searchString}`);
  };

  const getModuleTitle = () => {
    if (currentModule === 'ur') return 'Panel Awarii i Serwisu';
    if (currentModule === 'company_admin') return 'Administrator Firmy';
    if (currentModule === 'system_admin') return 'Super Panel SaaS';
    return 'System CMMS';
  };

  return {
    currentModule, setCurrentModule,
    activeTab, setActiveTab,
    handleTabChange,
    handleNavigate,
    clearUrlParam,
    globalTicketId, setGlobalTicketId,
    globalServiceId, setGlobalServiceId,
    globalMachineId, setGlobalMachineId,
    navigate,
    searchParams,
    getModuleTitle
  };
}
