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
    setBranding, setLimits, setGroqApiKey 
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

    // 1. POBIERANIE JEDNORAZOWE (STATIC / DICTIONARY DATA)
    const fetchStaticData = async () => {
      try {
        const [
          regionsSnap, machinesSnap, reportersSnap, servicesSnap, rolesSnap,
          globalSettingsSnap, settingsSnap, brandingSnap
        ] = await Promise.all([
          getDocs(collection(db, 'tenants', tenantId, 'regions')),
          getDocs(query(collection(db, 'tenants', tenantId, 'machines'), where('isDeleted', '==', false))),
          getDocs(collection(db, 'tenants', tenantId, 'reporters')),
          getDocs(collection(db, 'tenants', tenantId, 'services')),
          getDocs(collection(db, 'tenants', tenantId, 'roles')),
          getDoc(doc(db, 'tenant_registry', '_global_settings_')),
          getDoc(doc(db, 'tenants', tenantId, 'settings', 'general')),
          getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'))
        ]);

        setRegions(regionsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
        setMachines(machinesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReporters(reportersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.isDeleted !== true));
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
        setRoles(rolesSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));

        if (globalSettingsSnap.exists()) {
          const globalData = globalSettingsSnap.data();
          if (globalData.groqApiKey) setGroqApiKey(globalData.groqApiKey);
        }

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
          if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
          if (data.limits !== undefined) setLimits(data.limits);
          if (data.groqApiKey !== undefined) setGroqApiKey(data.groqApiKey);
        }

        if (brandingSnap.exists()) {
          const data = brandingSnap.data();
          const currentGlobalAppLogo = useManagerStore.getState().branding.appLogoUrl;
          setBranding({ 
            companyName: data.companyName || tenantId.toUpperCase(),
            systemSubtitle: data.systemSubtitle || 'DYSPOZYTORNIA UR',
            companyLogoUrl: data.companyLogoUrl || '',
            appLogoUrl: data.appLogoUrl || currentGlobalAppLogo,
            modules: data.modules
          });
        }
      } catch (err) {
        console.error("Error fetching static data:", err);
      }
    };

    fetchStaticData();

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
      unsubTickets();
      unsubParts();
      
      unsubPlanned();
      unsubNotifications();
      unsubActionItems();
    };
  }, [tenantId]);

  return null;
}
