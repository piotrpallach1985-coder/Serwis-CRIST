import { useState, useMemo } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { USER_ROLES, TICKET_STATUS } from '../../utils/constants';

/**
 * NotificationCenter — dzwonek z powiadomieniami systemowymi.
 * Wyciągnięty z ManagerView.jsx jako osobny komponent.
 *
 * Props:
 *   tickets, plannedServices, machines, actionItems — dane do generowania dynamicznych powiadomień
 *   notifications — powiadomienia z Firestore
 *   currentModule — aktywny moduł (wpływa na filtrowanie powiadomień)
 *   user — zalogowany użytkownik
 *   onNavigate(module, tab, extra) — callback do nawigacji
 */
export default function NotificationCenter({
  tickets = [],
  plannedServices = [],
  machines = [],
  reporters = [],
  actionItems = [],
  notifications = [],
  currentModule,
  user,
  onNavigate,
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);

  // --- Budowanie listy relevantnych powiadomień ---
  const relevantNotifications = useMemo(() => {
    const list = [];
    const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data';

    // 1. Awarie krytyczne (priorytet 1) oraz 2. Pozostałe awarie (priorytet 2)
    if (isUrModule || currentModule === 'tickets') {
      tickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED).forEach(t => {
        const isCrit = !!t.isCritical;
        list.push({
          id: 'dyn_ticket_' + t.id,
          title: isCrit ? 'KRYTYCZNA AWARIA!' : (t.status === 1 || t.status === '1' ? 'NOWE ZGŁOSZENIE AWARII' : 'Aktywna awaria'),
          message: 'Maszyna: ' + (t.machineName || 'Nieznana') + ' - ' + (t.topic || 'Inne'),
          isCritical: isCrit,
          priorityRank: isCrit ? 1 : 2,
          icon: isCrit ? 'ph-siren' : 'ph-warning',
          colorClass: isCrit ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
          badge: isCrit ? 'KRYTYCZNA' : (t.status === 1 || t.status === '1' ? 'NOWA' : 'AKTYWNA'),
          badgeClass: isCrit ? 'bg-red-600 text-white font-bold animate-pulse' : 'bg-amber-100 text-amber-800 font-bold',
          read: false,
          ticketId: t.id,
          createdAt: { toDate: () => safeParseDate(t.createdAt) || new Date() },
          isDynamic: true,
        });
      });
    }

    // 2. Pozostałe standardowe powiadomienia systemowe z Firestore (priorytet 2, lub 1 gdy krytyczne)
    notifications.forEach(n => {
      if (n.ticketId) return;
      if (n.linkTo === 'planned_maintenance') return;
      const isCrit = !!n.isCritical;
      list.push({
        ...n,
        priorityRank: isCrit ? 1 : 2,
        icon: n.icon || (isCrit ? 'ph-siren' : 'ph-bell'),
        colorClass: n.colorClass || (isCrit ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'),
        badge: n.badge || (isCrit ? 'KRYTYCZNE' : 'SYSTEM'),
        badgeClass: n.badgeClass || (isCrit ? 'bg-red-600 text-white font-bold animate-pulse' : 'bg-blue-100 text-blue-800 font-bold'),
      });
    });

    // 3. Przedawnione serwisy (priorytet 3 - czerwony status przeterminowania)
    if (isUrModule || currentModule === 'planned_maintenance') {
      const now = new Date();
      plannedServices.forEach(srv => {
        if (srv.status === 'completed' || srv.status === 'in_progress') return;
        let isOverdue = false;
        const machine = machines.find(m => m.id === srv.machineId);
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (nDate && nDate < now) isOverdue = true;
        }
        if (srv.targetWorkHours && machine) {
          if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
        }
        if (isOverdue) {
          list.push({
            id: 'dyn_srv_' + srv.id,
            title: 'PRZEKROCZONY TERMIN SERWISU!',
            message: 'Maszyna: ' + (machine?.name || 'Nieznana') + ' - ' + srv.name,
            isCritical: true,
            priorityRank: 3,
            icon: 'ph-clock-countdown',
            colorClass: 'bg-red-100 text-red-600',
            badge: 'PRZETERMINOWANY',
            badgeClass: 'bg-red-100 text-red-700 font-bold border border-red-200',
            read: false,
            linkTo: 'planned_maintenance',
            serviceId: srv.id,
            createdAt: { toDate: () => safeParseDate(srv.nextDate) || new Date() },
            isDynamic: true,
          });
        }
      });

      // 4. Tematy do realizacji (priorytet 4 - otwarte zadania z action items)
      const openCount = actionItems.filter(i => i.status !== 'completed').length;
      if (openCount > 0) {
        list.push({
          id: 'dyn_action_grouped',
          title: 'TEMATY DO REALIZACJI',
          message: `Liczba otwartych zadań: ${openCount}`,
          isCritical: false,
          priorityRank: 4,
          icon: 'ph-clipboard-text',
          colorClass: 'bg-indigo-100 text-indigo-600',
          badge: 'DO REALIZACJI',
          badgeClass: 'bg-indigo-100 text-indigo-700 font-bold',
          read: false,
          linkTo: 'action_items',
          createdAt: { toDate: () => new Date() },
          isDynamic: true,
        });
      }
    }

    // 5. Maszyny do weryfikacji ((DO WERYFIKACJI)) & 6. Zgłaszający do weryfikacji ((DO WERYFIKACJI))
    if (isUrModule || currentModule === 'master_data' || user?.role === USER_ROLES.ADMIN) {
      machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).forEach(m => {
        list.push({
          id: 'dyn_verif_machine_' + m.id,
          title: 'MASZYNA DO WERYFIKACJI',
          message: 'Nowa maszyna wymaga weryfikacji: ' + m.name,
          isCritical: true,
          priorityRank: 5,
          icon: 'ph-wrench',
          colorClass: 'bg-amber-100 text-amber-700',
          badge: 'DO WERYFIKACJI',
          badgeClass: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
          read: false,
          linkTo: 'machines',
          machineId: m.id,
          createdAt: { toDate: () => safeParseDate(m.createdAt) || new Date() },
          isDynamic: true,
        });
      });

      reporters.filter(r => r.name && r.name.includes('(DO WERYFIKACJI)')).forEach(r => {
        list.push({
          id: 'dyn_verif_reporter_' + r.id,
          title: 'OSOBA DO WERYFIKACJI',
          message: 'Nowy zgłaszający wymaga weryfikacji: ' + r.name,
          isCritical: true,
          priorityRank: 6,
          icon: 'ph-user-focus',
          colorClass: 'bg-purple-100 text-purple-700',
          badge: 'DO WERYFIKACJI',
          badgeClass: 'bg-purple-100 text-purple-800 font-bold border border-purple-200',
          read: false,
          linkTo: 'reporters',
          createdAt: { toDate: () => safeParseDate(r.createdAt) || new Date() },
          isDynamic: true,
        });
      });
    }

    // Sortowanie wg zadanego priorytetu:
    // 1. Awarie krytyczne (czerwona syrena)
    // 2. Pozostałe (nowe awarie, standardowe powiadomienia systemowe)
    // 3. Przedawnione serwisy (czerwony status przeterminowania)
    // 4. Tematy do realizacji (otwarte zadania z action items)
    // 5. Nowe maszyny do weryfikacji ((DO WERYFIKACJI))
    // 6. Nowi zgłaszający do weryfikacji ((DO WERYFIKACJI))
    list.sort((a, b) => {
      const rA = a.priorityRank || 99;
      const rB = b.priorityRank || 99;
      if (rA !== rB) {
        return rA - rB;
      }
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
      return (tb || 0) - (ta || 0);
    });

    return list;
  }, [tickets, plannedServices, machines, actionItems, notifications, currentModule, user, reporters]);

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  // --- Akcje ---
  const markAsRead = async (notifId) => {
    if (!notifId || notifId.toString().startsWith('dyn_')) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      console.error('Błąd aktualizacji powiadomienia:', e);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć wszystkie widoczne powiadomienia?')) return;
    try {
      const batch = writeBatch(db);
      relevantNotifications
        .filter(n => !n.isDynamic)
        .forEach(n => batch.delete(doc(db, 'notifications', n.id)));
      await batch.commit();
    } catch (e) {
      console.error('Błąd usuwania powiadomień:', e);
    }
  };

  const handleNotifClick = (n) => {
    markAsRead(n.id);
    setIsOpen(false);
    const targetModule = (currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data') ? 'ur' : currentModule;
    if (n.ticketId) {
      onNavigate(targetModule, 'tickets', { ticketId: n.ticketId });
    } else if (n.linkTo === 'planned_maintenance') {
      onNavigate(targetModule, 'planned_maintenance', { serviceId: n.serviceId });
    } else if (n.linkTo === 'action_items') {
      onNavigate(targetModule, 'action_items');
    } else if (n.linkTo === 'machines') {
      onNavigate(targetModule, 'machines', { machineId: n.machineId });
    } else if (n.linkTo === 'reporters') {
      onNavigate(targetModule, 'reporters');
    }
  };

  return (
    <div className="relative">
      {/* Przycisk dzwonka */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Powiadomienia"
      >
        <i className="ph ph-bell text-2xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel powiadomień */}
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden`}>
          <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
            <span className="font-bold text-sm">Powiadomienia systemowe</span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-900 px-2 py-0.5 rounded">{unreadCount} nowych</span>
              {relevantNotifications.some(n => !n.isDynamic) && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                  title="Usuń wszystkie"
                >
                  <i className="ph ph-trash"></i>
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto overflow-x-hidden divide-y divide-gray-100">
            {relevantNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Brak powiadomień</div>
            ) : (
              relevantNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex gap-3 items-start ${n.read ? 'bg-white opacity-60' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.colorClass || (n.isCritical ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}`}>
                    <i className={`ph ${n.icon || (n.isCritical ? 'ph-siren' : 'ph-info')} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="font-bold text-gray-800 mb-0.5 flex items-center justify-between gap-1.5">
                      <span className="truncate">{n.title}</span>
                      {n.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded tracking-wide shrink-0 ${n.badgeClass || (n.isCritical ? 'bg-red-100 text-red-700 font-bold' : 'bg-blue-100 text-blue-700 font-bold')}`}>
                          {n.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 leading-relaxed break-words">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {safeParseDate(n.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || 'Przed chwilą'}
                    </div>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
