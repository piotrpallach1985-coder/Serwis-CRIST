import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, writeBatch, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * useManagerData — centralny hook danych dla ManagerView.
 * Subskrybuje wszystkie kolekcje Firestore i zwraca dane + ustawienia.
 */
export function useManagerData() {
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [reporters, setReporters] = useState([]);
  const [services, setServices] = useState([]);
  const [plannedServices, setPlannedServices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [branding, setBranding] = useState({
    companyName: 'CRIST S.A.',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    companyLogoUrl: '',
    appLogoUrl: ''
  });

  useEffect(() => {
    // --- Tickets (aktywne, nie-zarchiwizowane) ---
    const qTickets = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => !t.isDeleted && t.status !== 5)
      );
    });

    // --- Maszyny ---
    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Zgłaszający ---
    const unsubReporters = onSnapshot(collection(db, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Słownik serwisów ---
    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Serwisy planowane ---
    const qPlanned = query(
      collection(db, 'planned_services'),
      where('status', '!=', 'completed')
    );
    const unsubPlanned = onSnapshot(qPlanned, (snapshot) => {
      setPlannedServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Powiadomienia (ograniczone do ostatnich) ---
    const qNotifications = query(
      collection(db, 'notifications'),
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
    const unsubActionItems = onSnapshot(collection(db, 'action_items'), (snapshot) => {
      setActionItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Role ---
    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Rejony ---
    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted));
    });

    // --- Ustawienia ogólne ---
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.allowTicketDeletion !== undefined) setAllowTicketDeletion(data.allowTicketDeletion);
        if (data.plannedWarningDays !== undefined) setPlannedWarningDays(data.plannedWarningDays);
      }
    });

    // --- Branding ---
    const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        setBranding(prev => ({ ...prev, ...docSnap.data() }));
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
  }, []);

  return {
    tickets,
    machines,
    reporters,
    services,
    plannedServices,
    notifications,
    actionItems,
    roles,
    regions,
    allowTicketDeletion,
    plannedWarningDays,
    branding,
  };
}
