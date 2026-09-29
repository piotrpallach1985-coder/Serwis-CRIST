import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenant } from '../utils/tenantHelper';

// --- Regions ---
export const addRegion = async (regionData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'regions'), {
    ...regionData,
    createdAt: serverTimestamp()
  });
};

export const updateRegion = async (id, regionData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'regions', id), regionData);
};

export const checkRegionInUse = async (id) => {
  const machinesQuery = query(collection(db, 'tenants', getCurrentTenant(), 'machines'), where('regionId', '==', id));
  const machinesSnapshot = await getDocs(machinesQuery);
  return {
    inUse: !machinesSnapshot.empty,
    count: machinesSnapshot.size
  };
};

// --- Reporters ---
export const addReporter = async (reporterData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'reporters'), {
    ...reporterData,
    createdAt: serverTimestamp()
  });
};

export const updateReporter = async (id, reporterData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'reporters', id), reporterData);
};

export const checkReporterInUse = async (id) => {
  const ticketsQuery = query(collection(db, 'tenants', getCurrentTenant(), 'tickets'), where('reporterId', '==', id));
  const ticketsSnapshot = await getDocs(ticketsQuery);
  return {
    inUse: !ticketsSnapshot.empty,
    count: ticketsSnapshot.size
  };
};

// --- Roles ---
export const addRole = async (roleData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'roles'), {
    ...roleData,
    createdAt: serverTimestamp()
  });
};

export const updateRole = async (id, roleData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'roles', id), roleData);
};

export const checkRoleInUse = async (id) => {
  const usersQuery = query(collection(db, 'tenants', getCurrentTenant(), 'users'), where('roleId', '==', id));
  const usersSnapshot = await getDocs(usersQuery);
  return {
    inUse: !usersSnapshot.empty,
    count: usersSnapshot.size
  };
};

// --- Topics ---
export const addTopic = async (topicData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'topics'), {
    ...topicData,
    createdAt: serverTimestamp()
  });
};

export const updateTopic = async (id, topicData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'topics', id), topicData);
};

export const checkTopicInUse = async (id) => {
  const ticketsQuery = query(collection(db, 'tenants', getCurrentTenant(), 'tickets'), where('topicId', '==', id));
  const ticketsSnapshot = await getDocs(ticketsQuery);
  return {
    inUse: !ticketsSnapshot.empty,
    count: ticketsSnapshot.size
  };
};

// --- Services (Categories) ---
export const addService = async (serviceData) => {
  return await addDoc(collection(db, 'tenants', getCurrentTenant(), 'services'), {
    ...serviceData,
    createdAt: serverTimestamp()
  });
};

export const updateService = async (id, serviceData) => {
  return await updateDoc(doc(db, 'tenants', getCurrentTenant(), 'services', id), serviceData);
};

export const checkServiceInUse = async (id) => {
  const ticketsQuery = query(collection(db, 'tenants', getCurrentTenant(), 'tickets'), where('serviceId', '==', id));
  const ticketsSnapshot = await getDocs(ticketsQuery);
  return {
    inUse: !ticketsSnapshot.empty,
    count: ticketsSnapshot.size
  };
};

// --- Users ---
export const addUser = async (uid, userData) => {
  return await setDoc(doc(db, 'users', uid), userData);
};

export const updateUser = async (id, userData) => {
  return await updateDoc(doc(db, 'users', id), userData);
};

export const checkUserInUse = async (id) => {
  const ticketsQuery = query(collection(db, 'tenants', getCurrentTenant(), 'tickets'), where('assignedTo', '==', id));
  const ticketsSnapshot = await getDocs(ticketsQuery);
  return {
    inUse: !ticketsSnapshot.empty,
    count: ticketsSnapshot.size
  };
};
