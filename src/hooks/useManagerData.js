import { useEffect } from 'react';
import { useManagerStore } from '../store/managerStore';
import { collection, onSnapshot, query, orderBy, where, doc, limit, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TICKET_STATUS } from '../utils/constants';

/**
 * useManagerData — centralny hook danych dla ManagerView.
 * Optymalizacja: Słowniki i maszyny pobierane jednorazowo (getDocs).
 * Awarie i aktywne działania pobierane w czasie rzeczywistym (onSnapshot).
 */
export function useManagerData() {
  const tenantId = useManagerStore(state => state.tenantId);
  const { 
    setTickets, setMachines, setReporters, setParts, setPartTransactions, 
    setServices, setPlannedServices, setNotifications, setActionItems, 
    setRoles, setRegions, setAllowTicketDeletion, setPlannedWarningDays, 
    setBranding, setLimits, setTranscribeModel 
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

        // 1. POBIERANIE SŁOWNIKÓW I MASZYN (Real-time z wykorzystaniem cache)
    const unsubRegions = onSnapshot(collection(db, 'tenants', tenantId, 'regions'), (snap) => {
      setRegions(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    });

    const unsubMachines = onSnapshot(query(collection(db, 'tenants', tenantId, 'machines'), where('isDeleted', '==', false)), (snap) => {
      setMachines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    
    const unsubServices = onSnapshot(collection(db, 'tenants', tenantId, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    });

    const unsubRoles = onSnapshot(collection(db, 'tenants', tenantId, 'roles'), (snap) => {
      setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    });

    

    const unsubSettings = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
        if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
        if (data.limits !== undefined) setLimits(data.limits);
      }
    });

    const unsubBranding = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'branding'), (snap) => {
      if (snap.exists()) {
        const brandingData = snap.data();
        const prevBranding = useManagerStore.getState().branding || {};
        setBranding({ 
          companyName: brandingData.companyName || prevBranding.companyName || tenantId.toUpperCase(),
          systemSubtitle: brandingData.systemSubtitle || 'DYSPOZYTORNIA UR',
          companyLogoUrl: brandingData.companyLogoUrl || prevBranding.companyLogoUrl || '',
          appLogoUrl: brandingData.appLogoUrl || prevBranding.appLogoUrl || '',
          modules: brandingData.modules || prevBranding.modules || { planned_services: true, inventory: false }
        });
      }
    });

    const unsubTenantRegistry = onSnapshot(doc(db, 'tenant_registry', tenantId), (snap) => {
      if (snap.exists()) {
        const regData = snap.data();
        if (regData.modules) {
          const prevBranding = useManagerStore.getState().branding || {};
          setBranding({
            ...prevBranding,
            companyName: prevBranding.companyName || regData.name || tenantId.toUpperCase(),
            companyLogoUrl: prevBranding.companyLogoUrl || regData.companyLogoUrl || '',
            modules: regData.modules
          });
        }
      }
    }, () => {});

    // 2. DANE W CZASIE RZECZYWISTYM (REAL-TIME ONSNAPSHOT)
    
    // --- Tickets (aktywne, nie-zarchiwizowane) ---
    const qTickets = query(
      collection(db, 'tenants', tenantId, 'tickets'),
      where('status', 'in', [1, 2, 3, 4, '1', '2', '3', '4', 'new'])
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => !t.isDeleted && Number(t.status) !== TICKET_STATUS.CLOSED)
      );
    }, (err) => console.debug("onSnapshot err:", err.code));

    // --- Magazyn części (na razie zostawiamy onSnapshot ze względu na stany magazynowe) ---
    const unsubParts = onSnapshot(collection(db, 'tenants', tenantId, 'parts'), (snapshot) => {
      setParts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.isDeleted));
    }, (err) => console.debug("onSnapshot err:", err.code));
    
    
    

    // --- Serwisy planowane ---
    const qPlanned = query(
      collection(db, 'tenants', tenantId, 'planned_services'),
      where('status', '!=', 'completed')
    );
    const unsubPlanned = onSnapshot(qPlanned, (snapshot) => {
      setPlannedServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
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
      unsubTickets();
      unsubParts();
      
      unsubPlanned();
      unsubNotifications();
      unsubActionItems();
    };
  }, [tenantId]);

  return null;
}
