import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { TICKET_STATUS } from '../utils/constants';
import { getCurrentTenant } from '../utils/tenantHelper';

export const fetchHistoricalTickets = async () => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return [];
  const q = query(collection(db, 'tenants', tenantId, 'tickets'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(x => !x.isDeleted && Number(x.status) === TICKET_STATUS.CLOSED);
};

export const fetchHistoricServices = async () => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return [];
  const qArchive = query(collection(db, 'tenants', tenantId, 'planned_services'), where('status', '==', 'completed'));
  const snap = await getDocs(qArchive);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fetchServerKPIStats = async (period) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;
  const getKPIStats = httpsCallable(functions, 'getKPIStats');
  const result = await getKPIStats({ tenantId, period });
  return result.data;
};

export const fetchServerPlannedKPIStats = async (period) => {
  const tenantId = getCurrentTenant();
  if (!tenantId) return null;
  const getPlannedKPIStats = httpsCallable(functions, 'getPlannedKPIStats');
  const result = await getPlannedKPIStats({ tenantId, period });
  return result.data;
};
