import { useEffect } from 'react';
import { useManagerStore } from '../store/managerStore';
import { collection, onSnapshot, query, orderBy, where, doc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { TICKET_STATUS } from '../utils/constants';
import { useAuth } from './useAuth';
import {
  filterTasksForFieldTechnician,
  filterMachinesForFieldTechnician,
} from '../utils/fieldServiceHelpers';

/**
 * useManagerData — centralny hook danych dla ManagerView.
 * Optymalizacja: Słowniki i maszyny pobierane z wykorzystaniem cache.
 * Awarie i aktywne działania pobierane w czasie rzeczywistym (onSnapshot).
 * Obsługuje izolację RODO B2C (only_assigned_tasks) dla mobilnych serwisantów.
 */
export function useManagerData() {
  const tenantId = useManagerStore(state => state.tenantId);
  let user = null;
  try {
    const authCtx = useAuth();
    user = authCtx?.user || null;
  } catch {
    user = null;
  }

  const { 
    setTickets, setMachines, setReporters, setParts, setPartTransactions, 
    setServices, setPlannedServices, setNotifications, setActionItems, 
    setRoles, setRegions, setAllowTicketDeletion, setPlannedWarningDays, 
    setBranding, setLimits, setMapSettings
  } = useManagerStore.getState();

  useEffect(() => {
    if (!tenantId) return;
    
    // Zabezpieczenie przed "wylewaniem" starych danych po przełączeniu firmy
    setTickets([]);
    setMachines([]);
    setReporters([]);
    setParts([]);
    setPartTransactions([]);
    setServices([]);
    setPlannedServices([]);
    setNotifications([]);
    setActionItems([]);
    setRoles([]);
    setRegions([]);
    setBranding({ 
      companyName: tenantId.toUpperCase(), 
      systemSubtitle: 'DYSPOZYTORNIA UR', 
      companyLogoUrl: '', 
      appLogoUrl: useManagerStore.getState().branding.appLogoUrl || '' 
    });

    let rawMachines = [];
    let rawTickets = [];
    let rawPlannedServices = [];
    let currentRoles = useManagerStore.getState().roles || [];

    const hasOnlyAssignedFlag = () => {
      if (!user || user.role === 'admin' || user.role === 'superadmin') return false;
      const roleConfig = (currentRoles || []).find(
        r => r.id === user.role || r.name === user.role
      );
      const perms = roleConfig?.permissions || user.permissions || [];
      return Boolean(perms.includes('only_assigned_tasks') || user.onlyAssignedTasks);
    };

    const syncFilteredDataToStore = () => {
      const restricted = hasOnlyAssignedFlag();
      if (restricted) {
        const filteredTickets = filterTasksForFieldTechnician(rawTickets, user, true);
        const filteredPlanned = filterTasksForFieldTechnician(rawPlannedServices, user, true);
        const filteredMachines = filterMachinesForFieldTechnician(
          rawMachines,
          filteredTickets,
          filteredPlanned,
          user,
          true
        );
        setTickets(filteredTickets);
        setPlannedServices(filteredPlanned);
        setMachines(filteredMachines);
      } else {
        setTickets(rawTickets);
        setPlannedServices(rawPlannedServices);
        setMachines(rawMachines);
      }
    };

    // 1. POBIERANIE SŁOWNIKÓW I MASZYN (Real-time z wykorzystaniem cache)
    const unsubRegions = onSnapshot(collection(db, 'tenants', tenantId, 'regions'), (snap) => {
      setRegions(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    });

    const unsubMachines = onSnapshot(query(collection(db, 'tenants', tenantId, 'machines'), where('isDeleted', '==', false)), (snap) => {
      rawMachines = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncFilteredDataToStore();
    });

    const unsubServices = onSnapshot(collection(db, 'tenants', tenantId, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    });

    const unsubRoles = onSnapshot(collection(db, 'tenants', tenantId, 'roles'), (snap) => {
      currentRoles = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true);
      setRoles(currentRoles);
      syncFilteredDataToStore();
    });

    const unsubSettings = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
        if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
        if (data.limits !== undefined) setLimits(data.limits);
        if (data.industryProfile) {
          const prevBranding = useManagerStore.getState().branding || {};
          if (prevBranding.industryProfile !== data.industryProfile) {
            setBranding({ ...prevBranding, industryProfile: data.industryProfile });
          }
        }
      }
    });

    const unsubBranding = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'branding'), (snap) => {
      if (snap.exists()) {
        const brandingData = snap.data();
        const prevBranding = useManagerStore.getState().branding || {};
        setBranding({ 
          companyName: brandingData.companyName || prevBranding.companyName || tenantId.toUpperCase(),
          systemSubtitle: brandingData.systemSubtitle || prevBranding.systemSubtitle || 'DYSPOZYTORNIA UR',
          industryProfile: brandingData.industryProfile || prevBranding.industryProfile || 'industrial',
          companyLogoUrl: brandingData.companyLogoUrl || prevBranding.companyLogoUrl || '',
          companyLogoBase64: brandingData.companyLogoBase64 || prevBranding.companyLogoBase64 || '',
          appLogoUrl: brandingData.appLogoUrl || prevBranding.appLogoUrl || '',
          modules: brandingData.modules || prevBranding.modules || { planned_services: true, inventory: false }
        });
      }
    });

    const unsubTenantRegistry = onSnapshot(doc(db, 'tenant_registry', tenantId), (snap) => {
      if (snap.exists()) {
        const regData = snap.data();
        const prevBranding = useManagerStore.getState().branding || {};
        setBranding({
          ...prevBranding,
          companyName: prevBranding.companyName || regData.name || tenantId.toUpperCase(),
          companyLogoUrl: prevBranding.companyLogoUrl || regData.companyLogoUrl || '',
          industryProfile: regData.industryProfile || prevBranding.industryProfile || 'industrial',
          modules: regData.modules || prevBranding.modules
        });
      }
    }, () => {});

    const unsubMapSettings = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'map'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMapSettings({
          mapType: data.mapType || (data.googleQuery && !data.mapUrl ? 'google' : 'image'),
          mapUrl: data.mapUrl || '',
          googleLat: data.googleLat ?? null,
          googleLng: data.googleLng ?? null,
        });
      } else {
        setMapSettings({ mapType: 'image', mapUrl: '' });
      }
    }, () => {});

    // 2. DANE W CZASIE RZECZYWISTYM (REAL-TIME ONSNAPSHOT)
    
    // --- Tickets (aktywne, nie-zarchiwizowane; z filtrem assignedTo na poziomie zapytania dla only_assigned_tasks) ---
    const isDirectRestricted = Boolean(
      user &&
        user.role !== 'admin' &&
        user.role !== 'superadmin' &&
        (user.onlyAssignedTasks || (user.permissions || []).includes('only_assigned_tasks'))
    );

    const qTickets = isDirectRestricted && user?.name
      ? query(
          collection(db, 'tenants', tenantId, 'tickets'),
          where('status', 'in', [1, 2, 3, 4, '1', '2', '3', '4', 'new']),
          where('assignedTo', '==', user.name)
        )
      : query(
          collection(db, 'tenants', tenantId, 'tickets'),
          where('status', 'in', [1, 2, 3, 4, '1', '2', '3', '4', 'new'])
        );

    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      rawTickets = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => !t.isDeleted && Number(t.status) !== TICKET_STATUS.CLOSED);
      syncFilteredDataToStore();
    }, (err) => console.debug("onSnapshot err:", err.code));

    // --- Magazyn części ---
    const unsubParts = onSnapshot(collection(db, 'tenants', tenantId, 'parts'), (snapshot) => {
      setParts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.isDeleted));
    }, (err) => console.debug("onSnapshot err:", err.code));

    // --- Serwisy planowane ---
    const qPlanned = query(
      collection(db, 'tenants', tenantId, 'planned_services'),
      where('status', '!=', 'completed')
    );
    const unsubPlanned = onSnapshot(qPlanned, (snapshot) => {
      rawPlannedServices = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.isDeleted !== true);
      syncFilteredDataToStore();
    }, (err) => console.debug("onSnapshot err:", err.code));

    // --- Powiadomienia (ograniczone do 100 ostatnich) ---
    const qNotifications = query(
      collection(db, 'tenants', tenantId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      const notifs = [];
      snapshot.docs.forEach(docSnap => {
        notifs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNotifications(notifs);
    }, (err) => console.debug("onSnapshot err:", err.code));

    // --- Zadania do realizacji ---
    const qActionItems = query(
      collection(db, 'tenants', tenantId, 'action_items'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubActionItems = onSnapshot(qActionItems, (snapshot) => {
      setActionItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.debug("onSnapshot err:", err.code));

    return () => {
      unsubRegions();
      unsubMachines();
      unsubServices();
      unsubRoles();
      unsubSettings();
      unsubBranding();
      unsubTenantRegistry();
      unsubMapSettings();
      unsubTickets();
      unsubParts();
      unsubPlanned();
      unsubNotifications();
      unsubActionItems();
    };
  }, [tenantId, user?.uid, user?.role, user?.name, user?.onlyAssignedTasks]);

  return null;
}
