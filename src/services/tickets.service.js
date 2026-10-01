import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, limit, startAfter, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';
import { logAudit } from './audit.service';

export const updateTicket = async (ticketId, updateData) => {
  const res = await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'tickets', ticketId), updateData);
  logAudit('UPDATE', 'TICKET', ticketId, 'Zaktualizowano zgłoszenie');
  return res;
};

export const deleteTicket = async (ticketId, userName = 'System') => {
  logAudit('DELETE', 'TICKET', ticketId, 'Usunięto zgłoszenie');
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'tickets', ticketId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: userName
  });
};

export const fetchMachineTickets = async (machineId, machineName) => {
  const tenantId = getCurrentTenant();
  const qById = query(collection(db, 'tenants', tenantId, 'tickets'), where('machineId', '==', machineId));
  const snapById = await getDocs(qById);
  let docs = snapById.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);

  if (machineName) {
    const qByName = query(collection(db, 'tenants', tenantId, 'tickets'), where('machineName', '==', machineName));
    const snapByName = await getDocs(qByName);
    const byNameDocs = snapByName.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
    
    const cleanName = machineName.replace(/\\s*\\(.*\\)\\s*/g, '');
    const qByClean = query(collection(db, 'tenants', tenantId, 'tickets'), where('machineName', '==', cleanName));
    const snapByClean = await getDocs(qByClean);
    const byCleanDocs = snapByClean.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
    
    const map = new Map();
    [...docs, ...byNameDocs, ...byCleanDocs].forEach(t => map.set(t.id, t));
    docs = Array.from(map.values());
  }
  return docs;
};

export const fetchActiveMachineTickets = async (machineId) => {
  const q = query(
    collection(db, 'tenants', getCurrentTenant(), 'tickets'),
    where('machineId', '==', machineId),
    where('status', 'in', ['0', '1', '2', '3', '4', 0, 1, 2, 3, 4])
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
};

export const addActionItem = async (data) => {
  const ref = await addDoc(collection(db, 'tenants', getCurrentTenant(), 'action_items'), {
    ...data,
    createdAt: serverTimestamp()
  });
  logAudit('CREATE', 'ACTION_ITEM', ref.id, 'Dodano temat do realizacji');
  return ref;
};

export const updateActionItem = async (id, data) => {
  const p = await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'action_items', id), data);
  logAudit('UPDATE', 'ACTION_ITEM', id, 'Zaktualizowano temat do realizacji');
  return p;
};

export const subscribeToActionItems = (callback) => {
  const q = query(collection(db, 'tenants', getCurrentTenant(), 'action_items'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

