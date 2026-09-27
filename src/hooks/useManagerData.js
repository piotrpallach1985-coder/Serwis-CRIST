import { useEffect } from 'react';
import { useManagerStore } from '../store/managerStore';
import { collection, onSnapshot, query, orderBy, where, doc, writeBatch, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { TICKET_STATUS } from '../utils/constants';

/**
 * useManagerData — centralny hook danych dla ManagerView.
 * Subskrybuje wszystkie kolekcje Firestore i zwraca dane + ustawienia.
 */
export function useManagerData() {
  const tenantId = useManagerStore(state => state.tenantId);
  const { setTickets, setMachines, setReporters, setParts, setPartTransactions, setServices, setPlannedServices, setNotifications, setActionItems, setRoles, setRegions, setAllowTicketDeletion, setPlannedWarningDays, setBranding, setLimits, setGroqApiKey } = useManagerStore.getState();

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
      appLogoUrl: useManagerStore.getState().branding.appLogoUrl || '' });

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
      );}, (err) => { console.debug("onSnapshot err:", err.code); });

    
    // --- Rejony ---
    const unsubRegions = onSnapshot(collection(db, 'tenants', tenantId, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    }, (err) => { console.debug("onSnapshot err:", err.code); });

    // --- Maszyny ---
    const unsubMachines = onSnapshot(query(collection(db, 'tenants', tenantId, 'machines'), where('isDeleted', '==', false)), (snapshot) => {
      setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));}, (err) => { console.debug("onSnapshot err:", err.code); });

    // --- Zgłaszający ---
    const unsubReporters = onSnapshot(collection(db, 'tenants', tenantId, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.isDeleted !== true));}, (err) => { console.debug("onSnapshot err:", err.code); });

    // --- Słownik serwisów ---
    


      // --- S�owniki (pobierane jednorazowo - optymalizacja odczyt�w) ---
      
    const unsubServices = onSnapshot(collection(db, 'tenants', tenantId, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    }, (err) => { console.debug("onSnapshot err:", err.code); });

    const unsubRoles = onSnapshot(collection(db, 'tenants', tenantId, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.isDeleted !== true));
    }, (err) => { console.debug("onSnapshot err:", err.code); });

    
      // --- Magazyn części ---
      const unsubParts = onSnapshot(collection(db, 'tenants', tenantId, 'parts'), (snapshot) => {
        setParts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.isDeleted));
      }, (err) => { console.debug("onSnapshot err:", err.code); });
      
      const qTx = query(collection(db, 'tenants', tenantId, 'part_transactions'), limit(500));
      const unsubTransactions = onSnapshot(qTx, (snapshot) => {
        setPartTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => { console.debug("onSnapshot err:", err.code); });

      // --- Serwisy planowane ---
    const qPlanned = query(
      collection(db, 'tenants', tenantId, 'planned_services'),
      where('status', '!=', 'completed')
    );
    const unsubPlanned = onSnapshot(qPlanned, (snapshot) => {
      setPlannedServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));}, (err) => { console.debug("onSnapshot err:", err.code); });

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
      setNotifications(notifs);}, (err) => { console.debug("onSnapshot err:", err.code); });

    // --- Zadania do realizacji ---
    const qActionItems = query(
      collection(db, 'tenants', tenantId, 'action_items'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubActionItems = onSnapshot(qActionItems, (snapshot) => {
      setActionItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));}, (err) => { console.debug("onSnapshot err:", err.code); });

    
      // --- Globalne API Key ---
      const unsubGlobalSettings = onSnapshot(doc(db, 'tenant_registry', '_global_settings_'), (docSnap) => {
        if (docSnap.exists()) {
          const globalData = docSnap.data();
          if (globalData.groqApiKey) {
            useManagerStore.getState().setGroqApiKey(globalData.groqApiKey);
          }
        }
      });
      
      // --- Ustawienia ogólne ---
    const unsubSettings = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
          if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
          if (data.limits !== undefined) setLimits(data.limits);
          if (data.groqApiKey !== undefined) setGroqApiKey(data.groqApiKey);
      }}, (err) => { console.debug("onSnapshot err:", err.code); });

    // --- Branding ---
    const unsubBranding = onSnapshot(doc(db, 'tenants', tenantId, 'settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
          const currentGlobalAppLogo = useManagerStore.getState().branding.appLogoUrl;
          setBranding({ 
            companyName: data.companyName || tenantId.toUpperCase(),
            systemSubtitle: data.systemSubtitle || 'DYSPOZYTORNIA UR',
            companyLogoUrl: data.companyLogoUrl || '',
            appLogoUrl: data.appLogoUrl || currentGlobalAppLogo,
            modules: data.modules
          });
      }}, (err) => { console.debug("onSnapshot err:", err.code); });

    return () => {
      if (unsubRegions) unsubRegions();
      if (typeof unsubServices !== "undefined") unsubServices();
      if (typeof unsubRoles !== "undefined") unsubRoles();
      unsubTickets();
      unsubMachines();
      unsubReporters();
        if (typeof unsubParts !== "undefined") unsubParts();
        if (typeof unsubTransactions !== "undefined") unsubTransactions();
            unsubPlanned();
      unsubNotifications();
      unsubActionItems();
                  unsubSettings();
      unsubBranding();
    };
  }, [tenantId]);

  return null;
}
