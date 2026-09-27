import { useManagerStore } from '../store/managerStore';

export const getCurrentTenant = () => {
  let tId = useManagerStore.getState().tenantId;
  if (!tId && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    tId = params.get('tenant');
  }
  return tId || import.meta.env.VITE_DEFAULT_TENANT || 'default';
};
