import { useEffect } from 'react';
import { useManagerStore } from '../store/managerStore';
import { collection, onSnapshot, query, orderBy, where, doc, writeBatch, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { TICKET_STATUS } from '../utils/constants';

/**
 * useManagerData — centralny hook danych dla ManagerView.
 * Subskrybuje wszystkie kolekcje Firestore i zwraca dane + ustawienia.
 */
export function useManagerData() {
  const tenantId = useManagerStore(state => state.tenantId);
  const { setTickets, setMachines, setReporters, setServices, setPlannedServices, setNotifications, setActionItems, setRoles, setRegions, setAllowTicketDeletion, setPlannedWarningDays, setBranding } = useManagerStore.getState();

  useEffect(() => {
    if (!tenantId) return;
    
    // Zabezpieczenie przed "wylewaniem" starych danych po przełączeniu firmy
    setTickets([]);
    setMachines([]);
    setReporters([]);
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

    // --- Tickets (aktywne, nie-zarchiwizowane) ---
    const qTickets = query(
      collection(db, 'tenants', tenantId, 'tickets'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => !t.isDeleted && Number(t.status) !== TICKET_STATUS.CLOSED)
      );
    });

    // --- Maszyny ---
    const unsubMachines = onSnapshot(collection(db, 'tenants', tenantId, 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Zgłaszający ---
    const unsubReporters = onSnapshot(collection(db, 'tenants', tenantId, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Słownik serwisów ---
    const unsubServices = onSnapshot(collection(db, 'tenants', tenantId, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Serwisy planowane ---
    const qPlanned = query(
      collection(db, 'tenants', tenantId, 'planned_services'),
      where('status', '!=', 'completed')
    );
    const unsubPlanned = onSnapshot(qPlanned, (snapshot) => {
      setPlannedServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // --- Powiadomienia (ograniczone do ostatnich) ---
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
    });

    // --- Zadania do realizacji ---
    const qActionItems = query(
      collection(db, 'tenants', tenantId, 'action_items'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubActionItems = onSnapshot(qActionItems, (snapshot) => {
      setActionItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // --- Role ---
    const unsubRoles = onSnapshot(collection(db, 'tenants', tenantId, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Rejony ---
    const unsubRegions = onSnapshot(collection(db, 'tenants', tenantId, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Ustawienia ogólne ---
    const unsubSettings = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
        if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
      }
    });

    // --- Branding ---
    const unsubBranding = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
          const currentGlobalAppLogo = useManagerStore.getState().branding.appLogoUrl;
          setBranding({ 
            companyName: data.companyName || tenantId.toUpperCase(),
            systemSubtitle: data.systemSubtitle || 'DYSPOZYTORNIA UR',
            companyLogoUrl: data.companyLogoUrl || '',
            appLogoUrl: data.appLogoUrl || currentGlobalAppLogo
          });
      }
    });

    return () => {
      unsubTickets();
      unsubMachines();
      unsubReporters();
      unsubServices();
      unsubPlanned();
      unsubNotifications();
      unsubActionItems();
      unsubRoles();
      unsubRegions();
      unsubSettings();
      unsubBranding();
    };
  }, [tenantId]);

  return null;
}
