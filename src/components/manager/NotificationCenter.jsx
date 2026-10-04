import { useAuth } from '../../hooks/useAuth';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { TICKET_STATUS, USER_ROLES } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { checkInventoryStatus, checkServiceUrgency } from '../../utils/logicHelpers';

export default function NotificationCenter({
  tickets = [],
  plannedServices = [],
  machines = [],
  reporters = [],
  actionItems = [],
  align = 'left'
}) {
  const { user } = useAuth();
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays) || 30;
  const [isOpen, setIsOpen] = useState(false);
  const parts = useManagerStore(state => state.parts || []);
  const notifications = useManagerStore(state => state.notifications || []);
  const currentModule = useManagerStore(state => state.currentModule || 'ur');
  const onNavigate = useManagerStore(state => state.onNavigate);
  const markAsRead = useManagerStore(state => state.markAsRead);

  const relevantNotifications = useMemo(() => {
    const list = [];
    const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data';

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

    notifications.forEach(n => {
      if (!n.title && !n.message) return;
      if (n.ticketId || n.linkTo === 'planned_maintenance') return;
      const isCrit = !!n.isCritical;
      list.push({
        ...n,
        priorityRank: isCrit ? 1 : 2,
        icon: n.icon || (isCrit ? 'ph-siren' : 'ph-bell'),
        colorClass: n.colorClass || (isCrit ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'),
        badgeClass: n.badgeClass || (isCrit ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'),
        createdAt: { toDate: () => safeParseDate(n.createdAt) || new Date() }
      });
    });

    if (isUrModule || currentModule === 'planned_maintenance') {
      plannedServices.forEach(srv => {
        if (srv.status === 'completed') return;
        const machine = machines.find(m => m.id === srv.machineId);
        
        const { isOverdue, isUpcoming, message } = checkServiceUrgency(srv, machine, plannedWarningDays);

        if (isOverdue) {
          list.push({
            id: 'dyn_srv_ov_' + srv.id,
            title: 'PRZEKROCZONY TERMIN SERWISU!',
            message: 'Maszyna: ' + (machine?.name || 'Nieznana') + ' - ' + srv.name + ' (' + message + ')',
            isCritical: true,
            priorityRank: 3,
            icon: 'ph-clock-countdown',
            colorClass: 'bg-red-100 text-red-600',
            badge: 'WYMAGANY',
            badgeClass: 'bg-red-100 text-red-700 font-bold border border-red-200',
            read: false,
            linkTo: 'planned_maintenance',
            serviceId: srv.id,
            createdAt: { toDate: () => safeParseDate(srv.nextDate) || new Date() },
            isDynamic: true,
          });
        } else if (isUpcoming && srv.status !== 'in_progress') {
          const isCriticalPriority = ['Krytyczne', 'KRYTYCZNE', 'Krytyczny', 'KRYTYCZNY'].includes(srv.priority);
          list.push({
            id: 'dyn_srv_up_' + srv.id,
            title: isCriticalPriority ? 'ZBLIŻA SIĘ KRYTYCZNY SERWIS!' : 'ZBLIŻA SIĘ SERWIS PLANOWANY',
            message: 'Maszyna: ' + (machine?.name || 'Nieznana') + ' - ' + srv.name + ' (' + message + ')',
            isCritical: isCriticalPriority,
            priorityRank: isCriticalPriority ? 3 : 5,
            icon: 'ph-calendar-blank',
            colorClass: isCriticalPriority ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
            badge: 'ZBLIŻA SIĘ',
            badgeClass: isCriticalPriority ? 'bg-red-100 text-red-700 font-bold border border-red-200' : 'bg-orange-100 text-orange-700 font-bold border border-orange-200',
            read: false,
            linkTo: 'planned_maintenance',
            serviceId: srv.id,
            createdAt: { toDate: () => safeParseDate(srv.nextDate) || new Date() },
            isDynamic: true,
          });
        }
      });
    }

    if (isUrModule || currentModule === 'parts' || currentModule === 'parts_list') {
      parts.forEach(p => {
        let reservedQty = 0;
        plannedServices.forEach(s => {
          if (s.status !== 'completed' && s.requiredParts) {
            const req = s.requiredParts.find(rp => rp.partId === p.id);
            if (req) reservedQty += Number(req.quantity) || 0;
          }
        });
        
        const { isLow, isOut, available, minStock, stock } = checkInventoryStatus(p, reservedQty);

        if (isLow || isOut) {
          list.push({
            id: 'dyn_part_low_' + p.id,
            title: isOut ? 'BRAK CZĘŚCI!' : 'NISKI STAN MAGAZYNOWY',
            message: `Część "${p.name}" ma dostępne: ${available} (min: ${minStock}). Fizycznie: ${stock}`,
            isCritical: isOut,
            priorityRank: 4,
            icon: 'ph-warning',
            colorClass: isOut ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
            badge: isOut ? 'BRAK' : 'NISKI STAN',
            badgeClass: isOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-orange-100 text-orange-700 font-bold',
            read: false,
            linkTo: 'parts',
            createdAt: { toDate: () => new Date() },
            isDynamic: true,
          });
        }
      });
    }

    if (isUrModule || currentModule === 'master_data' || (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN)) {
      machines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).forEach(m => {
        list.push({
          id: 'dyn_verif_machine_' + m.id,
          title: 'MASZYNA DO WERYFIKACJI',
          message: 'Nowa maszyna wymaga weryfikacji: ' + m.name,
          isCritical: true,
          priorityRank: 6,
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
          title: 'ZGŁASZAJĄCY DO WERYFIKACJI',
          message: 'Nowy pracownik wymaga weryfikacji: ' + r.name,
          isCritical: true,
          priorityRank: 6,
          icon: 'ph-user',
          colorClass: 'bg-amber-100 text-amber-700',
          badge: 'DO WERYFIKACJI',
          badgeClass: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
          read: false,
          linkTo: 'reporters',
          createdAt: { toDate: () => safeParseDate(r.createdAt) || new Date() },
          isDynamic: true,
        });
      });
    }

    return list.sort((a, b) => {
      if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
      const dA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dB - dA;
    });
  }, [tickets, plannedServices, machines, actionItems, notifications, currentModule, user, reporters, parts, plannedWarningDays]);

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const handleNotifClick = (n) => {
    if (!n.isDynamic) markAsRead(n.id);
    setIsOpen(false);
    const targetModule = (currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data') ? 'ur' : currentModule;
    if (n.ticketId) {
      if (onNavigate) onNavigate(targetModule, 'tickets', { ticketId: n.ticketId });
    } else if (n.linkTo === 'planned_maintenance') {
      if (onNavigate) onNavigate(targetModule, 'planned_maintenance', { serviceId: n.serviceId });
    } else if (n.linkTo === 'action_items') {
      if (onNavigate) onNavigate(targetModule, 'action_items');
    } else if (n.linkTo === 'machines') {
      if (onNavigate) onNavigate(targetModule, 'machines', { machineId: n.machineId });
    } else if (n.linkTo === 'reporters') {
      if (onNavigate) onNavigate(targetModule, 'reporters');
    } else if (n.linkTo === 'parts') {
      if (onNavigate) onNavigate('parts_list');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const tenantId = getCurrentTenant();
      const batch = writeBatch(db);
      relevantNotifications.forEach(n => {
        if (!n.read && !n.isDynamic) {
          const ref = doc(db, 'tenants', tenantId, 'notifications', n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Blad', err);
    }
  };

  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 lg:p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative flex items-center justify-center text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <i className="ph ph-bell text-xl lg:text-2xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1 lg:top-1.5 right-1 lg:right-1.5 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-[9px] lg:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm shadow-red-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-[calc(100vw-32px)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-xl">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="ph ph-bell-ringing text-blue-600"></i> Powiadomienia
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} 
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <i className="ph ph-check-double"></i> Odczytaj wszystkie
              </button>
            )}
          </div>
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto overscroll-contain">
            {relevantNotifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <i className="ph ph-bell-z text-3xl text-slate-300"></i>
                </div>
                <p className="text-slate-500 font-medium">Brak powiadomień</p>
                <p className="text-xs text-slate-400 mt-1">Wszystko jest pod kontrolą</p>
              </div>
            ) : (
              relevantNotifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotifClick(n)}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                >
                  {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>}
                  <div className="flex gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${n.colorClass || 'bg-blue-100 text-blue-600'}`}>
                      <i className={`ph ${n.icon || 'ph-bell'} text-xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-bold text-slate-800 text-sm leading-tight truncate pr-2">
                          {n.title}
                        </div>
                        {n.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${n.badgeClass || 'bg-slate-100 text-slate-600'}`}>
                            {n.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                      <div className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                        <i className="ph ph-clock"></i>
                        {(n.createdAt?.toDate ? n.createdAt.toDate() : new Date()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50/80 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koniec powiadomień</span>
          </div>
        </div>
      )}
    </div>
  );
}


