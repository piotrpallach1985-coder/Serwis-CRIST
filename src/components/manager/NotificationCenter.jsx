import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import { db } from '../../firebase';
import { doc, writeBatch, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { TICKET_STATUS, USER_ROLES } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { checkInventoryStatus, checkServiceUrgency } from '../../utils/logicHelpers';
import { usePermissions } from '../../hooks/usePermissions';
import {
  checkCkob7DaysDeadline,
  filterTasksForFieldTechnician,
  filterMachinesForFieldTechnician,
  checkVehicleDatesStatus,
  isVehicleAsset,
} from '../../utils/fieldServiceHelpers';

const EMPTY_ARRAY = [];
let inFlightCkobFetch = null;
let cachedCkobKey = '';
let cachedCkobList = EMPTY_ARRAY;

export default function NotificationCenter({
  onNavigate,
  tickets = EMPTY_ARRAY,
  plannedServices = EMPTY_ARRAY,
  machines = EMPTY_ARRAY,
  reporters = EMPTY_ARRAY,
  actionItems = EMPTY_ARRAY,
  align = 'left'
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'pl-PL';
  const { user } = useAuth();
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays) || 30;
  const [isOpen, setIsOpen] = useState(false);
  const parts = useManagerStore(state => state.parts || []);
  const notifications = useManagerStore(state => state.notifications || []);
  const currentModule = useManagerStore(state => state.currentModule || 'ur');
  const markAsRead = useManagerStore(state => state.markAsRead);
  const roles = useManagerStore(state => state.roles || []);
  const branding = useManagerStore(state => state.branding || {});
  const ckobRefreshVersion = useManagerStore(state => state.ckobRefreshVersion || 0);
  const industryProfile = branding?.industryProfile || 'industrial';
  const { onlyAssignedTasks } = usePermissions(user, roles);
  const [completedCkobServices, setCompletedCkobServices] = useState(EMPTY_ARRAY);

  useEffect(() => {
    const handleCkobEntered = e => {
      const serviceId = e?.detail?.serviceId;
      if (!serviceId) return;
      cachedCkobList = cachedCkobList.filter(s => s.id !== serviceId);
      setCompletedCkobServices(prev => prev.filter(s => s.id !== serviceId));
    };
    window.addEventListener('vexont:ckob-entered', handleCkobEntered);
    return () => window.removeEventListener('vexont:ckob-entered', handleCkobEntered);
  }, []);

  useEffect(() => {
    if (industryProfile !== 'facility' || typeof getDocs !== 'function') {
      setCompletedCkobServices(prev => (prev.length ? EMPTY_ARRAY : prev));
      return;
    }
    let cancelled = false;
    const loadCompletedForCkob = async () => {
      try {
        const tenantId = getCurrentTenant();
        if (!tenantId || !db) return;
        const fetchKey = `${tenantId}:${plannedServices.length}:${ckobRefreshVersion}`;
        if (cachedCkobKey === fetchKey && !inFlightCkobFetch) {
          if (!cancelled) setCompletedCkobServices(cachedCkobList);
          return;
        }
        if (!inFlightCkobFetch || cachedCkobKey !== fetchKey) {
          cachedCkobKey = fetchKey;
          const q = query(
            collection(db, 'tenants', tenantId, 'planned_services'),
            where('status', '==', 'completed'),
            limit(200)
          );
          inFlightCkobFetch = getDocs(q)
            .then(snap => {
              const items = (snap?.docs || [])
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(s => !s.isDeleted && s.ckobEntered !== true)
                .sort((a, b) => {
                  const dA = safeParseDate(a.completedAt)?.getTime() || 0;
                  const dB = safeParseDate(b.completedAt)?.getTime() || 0;
                  return dB - dA;
                });
              cachedCkobList = items;
              return items;
            })
            .finally(() => {
              inFlightCkobFetch = null;
            });
        }
        const items = await inFlightCkobFetch;
        if (!cancelled && Array.isArray(items)) {
          setCompletedCkobServices(items);
        }
      } catch {
        // Ignoruj w środowisku testowym lub przy braku połączenia
      }
    };
    loadCompletedForCkob();
    return () => {
      cancelled = true;
    };
  }, [industryProfile, plannedServices.length, ckobRefreshVersion]);

  const relevantNotifications = useMemo(() => {
    const list = [];
    const isUrModule = currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data';
    const mergedPlannedServices = [
      ...plannedServices,
      ...completedCkobServices.filter(cs => !plannedServices.some(ps => ps.id === cs.id)),
    ];
    const visibleTickets = filterTasksForFieldTechnician(tickets, user, onlyAssignedTasks);
    const visibleServices = filterTasksForFieldTechnician(mergedPlannedServices, user, onlyAssignedTasks);
    const visibleMachines = filterMachinesForFieldTechnician(
      machines,
      tickets,
      mergedPlannedServices,
      user,
      onlyAssignedTasks
    );
    const visibleMachineIds = new Set(visibleMachines.map(m => m.id));

    if (isUrModule || currentModule === 'tickets') {
      visibleTickets.filter(tk => Number(tk.status) !== TICKET_STATUS.CLOSED).forEach(tk => {
        const isCrit = !!tk.isCritical;
        list.push({
          id: 'dyn_ticket_' + tk.id,
          title: isCrit
            ? t('notifications.critical_breakdown', 'KRYTYCZNA AWARIA!')
            : (tk.status === 1 || tk.status === '1'
              ? t('notifications.new_ticket', 'NOWE ZGŁOSZENIE AWARII')
              : t('notifications.active_ticket', 'Aktywna awaria')),
          message: `${t('notifications.machine_prefix', 'Maszyna')}: ${tk.machineName || t('common.unknown', 'Nieznana')} - ${tk.topic || t('common.other', 'Inne')}`,
          isCritical: isCrit,
          priorityRank: isCrit ? 1 : 2,
          icon: isCrit ? 'ph-siren' : 'ph-warning',
          colorClass: isCrit ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
          badge: isCrit
            ? t('notifications.badge_critical', 'KRYTYCZNA')
            : (tk.status === 1 || tk.status === '1'
              ? t('notifications.badge_new', 'NOWA')
              : t('notifications.badge_active', 'AKTYWNA')),
          badgeClass: isCrit ? 'bg-red-600 text-white font-bold animate-pulse' : 'bg-amber-100 text-amber-800 font-bold',
          read: false,
          ticketId: tk.id,
          createdAt: { toDate: () => safeParseDate(tk.createdAt) || new Date() },
          isDynamic: true,
        });
      });
    }

    notifications.forEach(n => {
      if (!n.title && !n.message) return;
      if (n.ticketId || n.linkTo === 'planned_maintenance') return;
      if (onlyAssignedTasks && n.machineId && !visibleMachineIds.has(n.machineId)) return;
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
      visibleServices.forEach(srv => {
        const machine = machines.find(m => m.id === srv.machineId);

        if (srv.status === 'completed') {
          const ckobCheck = checkCkob7DaysDeadline(srv, machine, industryProfile);
          if (ckobCheck.requiresCkobEntry) {
            list.push({
              id: 'dyn_ckob_7d_' + srv.id,
              title: ckobCheck.isOverdue7Days
                ? 'PRZEKROCZONO 7 DNI NA WPIS DO c-KOB!'
                : 'WYMAGANY WPIS DO RZĄDOWEGO c-KOB (7 DNI)',
              message: `Obiekt: ${machine?.name || srv.machineName || 'Nieznany'} - ${srv.name} (${
                ckobCheck.isOverdue7Days
                  ? `minęło ${ckobCheck.daysElapsed} dni od kontroli`
                  : `pozostało ${ckobCheck.daysRemaining} dni na wpis w c-kob.gunb.gov.pl`
              })`,
              isCritical: ckobCheck.isOverdue7Days,
              priorityRank: ckobCheck.isOverdue7Days ? 2 : 3,
              icon: 'ph-buildings',
              colorClass: ckobCheck.isOverdue7Days
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700',
              badge: ckobCheck.isOverdue7Days ? 'c-KOB PILNE' : 'c-KOB 7 DNI',
              badgeClass: ckobCheck.isOverdue7Days
                ? 'bg-red-600 text-white font-bold animate-pulse'
                : 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
              read: false,
              linkTo: 'archive_planned',
              serviceId: srv.id,
              createdAt: { toDate: () => ckobCheck.completedDate || new Date() },
              isDynamic: true,
            });
          }
          return;
        }
        
        const { isOverdue, isUpcoming, message } = checkServiceUrgency(srv, machine, plannedWarningDays);

        if (isOverdue) {
          list.push({
            id: 'dyn_srv_ov_' + srv.id,
            title: t('notifications.overdue_service', 'PRZEKROCZONY TERMIN SERWISU!'),
            message: `${t('notifications.machine_prefix', 'Maszyna')}: ${machine?.name || t('common.unknown', 'Nieznana')} - ${srv.name} (${message})`,
            isCritical: true,
            priorityRank: 3,
            icon: 'ph-clock-countdown',
            colorClass: 'bg-red-100 text-red-600',
            badge: t('notifications.badge_required', 'WYMAGANY'),
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
            title: isCriticalPriority
              ? t('notifications.upcoming_critical_service', 'ZBLIŻA SIĘ KRYTYCZNY SERWIS!')
              : t('notifications.upcoming_service', 'ZBLIŻA SIĘ SERWIS PLANOWANY'),
            message: `${t('notifications.machine_prefix', 'Maszyna')}: ${machine?.name || t('common.unknown', 'Nieznana')} - ${srv.name} (${message})`,
            isCritical: isCriticalPriority,
            priorityRank: isCriticalPriority ? 3 : 5,
            icon: 'ph-calendar-blank',
            colorClass: isCriticalPriority ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
            badge: t('notifications.badge_upcoming', 'ZBLIŻA SIĘ'),
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

    if (
      !onlyAssignedTasks &&
      (isUrModule || currentModule === 'parts' || currentModule === 'parts_inventory')
    ) {
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
            title: isOut
              ? t('notifications.out_of_stock', 'BRAK CZĘŚCI!')
              : t('notifications.low_stock', 'NISKI STAN MAGAZYNOWY'),
            message: t('notifications.part_stock_msg', {
              defaultValue: `Część "${p.name}" ma dostępne: ${available} (min: ${minStock}). Fizycznie: ${stock}`,
              name: p.name,
              available,
              minStock,
              stock,
            }),
            isCritical: isOut,
            priorityRank: 4,
            icon: 'ph-warning',
            colorClass: isOut ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
            badge: isOut ? t('notifications.badge_out', 'BRAK') : t('notifications.badge_low', 'NISKI STAN'),
            badgeClass: isOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-orange-100 text-orange-700 font-bold',
            read: false,
            linkTo: 'parts',
            partId: p.id,
            createdAt: { toDate: () => new Date() },
            isDynamic: true,
          });
        }
      });
    }

    if (isUrModule || currentModule === 'master_data' || (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN)) {
      visibleMachines.forEach(m => {
        if (!isVehicleAsset(m, industryProfile)) return;
        const vStatus = checkVehicleDatesStatus(m, plannedWarningDays);
        const plateInfo = m.licensePlate ? ` [${m.licensePlate}]` : '';

        if (
          vStatus.techInspectionStatus === 'overdue' ||
          vStatus.techInspectionStatus === 'upcoming'
        ) {
          const isOver = vStatus.techInspectionStatus === 'overdue';
          list.push({
            id: 'dyn_fleet_skp_' + m.id,
            title: isOver
              ? 'PRZETERMINOWANE BADANIE TECHNICZNE (SKP)!'
              : 'ZBLIŻA SIĘ TERMIN BADANIA TECHNICZNEGO (SKP)',
            message: `Pojazd: ${m.name}${plateInfo} — ${
              isOver
                ? `badanie SKP po terminie o ${Math.abs(vStatus.techInspectionDaysLeft)} dni (${m.techInspectionDate})`
                : `ważność badania SKP kończy się za ${vStatus.techInspectionDaysLeft} dni (${m.techInspectionDate})`
            }`,
            isCritical: isOver,
            priorityRank: isOver ? 2 : 4,
            icon: 'ph-truck',
            colorClass: isOver ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
            badge: isOver ? 'SKP PILNE' : 'SKP ZBLIŻA SIĘ',
            badgeClass: isOver
              ? 'bg-red-600 text-white font-bold animate-pulse'
              : 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
            read: false,
            linkTo: 'machines',
            machineId: m.id,
            createdAt: { toDate: () => safeParseDate(m.techInspectionDate) || new Date() },
            isDynamic: true,
          });
        }

        if (vStatus.insuranceStatus === 'overdue' || vStatus.insuranceStatus === 'upcoming') {
          const isOver = vStatus.insuranceStatus === 'overdue';
          list.push({
            id: 'dyn_fleet_oc_' + m.id,
            title: isOver
              ? 'WYGASŁA POLISA UBEZPIECZENIOWA (OC/AC)!'
              : 'ZBLIŻA SIĘ KONIEC POLISY UBEZPIECZENIOWEJ (OC/AC)',
            message: `Pojazd: ${m.name}${plateInfo} — ${
              isOver
                ? `polisa OC/AC wygasła ${Math.abs(vStatus.insuranceDaysLeft)} dni temu (${m.insuranceExpiryDate})`
                : `polisa OC/AC kończy się za ${vStatus.insuranceDaysLeft} dni (${m.insuranceExpiryDate})`
            }`,
            isCritical: isOver,
            priorityRank: isOver ? 2 : 4,
            icon: 'ph-shield-warning',
            colorClass: isOver ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
            badge: isOver ? 'OC/AC PILNE' : 'OC/AC ZBLIŻA SIĘ',
            badgeClass: isOver
              ? 'bg-red-600 text-white font-bold animate-pulse'
              : 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
            read: false,
            linkTo: 'machines',
            machineId: m.id,
            createdAt: { toDate: () => safeParseDate(m.insuranceExpiryDate) || new Date() },
            isDynamic: true,
          });
        }
      });

      visibleMachines.filter(m => m.name && m.name.includes('(DO WERYFIKACJI)')).forEach(m => {
        list.push({
          id: 'dyn_verif_machine_' + m.id,
          title: t('notifications.machine_to_verify', 'MASZYNA DO WERYFIKACJI'),
          message: t('notifications.machine_to_verify_msg', {
            defaultValue: 'Nowa maszyna wymaga weryfikacji: ' + m.name,
            name: m.name,
          }),
          isCritical: true,
          priorityRank: 6,
          icon: 'ph-wrench',
          colorClass: 'bg-amber-100 text-amber-700',
          badge: t('notifications.badge_verify', 'DO WERYFIKACJI'),
          badgeClass: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
          read: false,
          linkTo: 'machines',
          machineId: m.id,
          createdAt: { toDate: () => safeParseDate(m.createdAt) || new Date() },
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
  }, [tickets, plannedServices, completedCkobServices, machines, actionItems, notifications, currentModule, user, reporters, parts, plannedWarningDays, t, onlyAssignedTasks, industryProfile]);

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const handleNotifClick = (n) => {
    if (!n.isDynamic) markAsRead(n.id);
    setIsOpen(false);
    const targetModule = (currentModule === 'ur' || currentModule === 'tickets' || currentModule === 'planned_maintenance' || currentModule === 'master_data') ? 'ur' : currentModule;
    if (n.ticketId) {
      if (onNavigate) onNavigate(targetModule, 'tickets', { ticketId: n.ticketId });
    } else if (n.linkTo === 'planned_maintenance') {
      if (onNavigate) onNavigate(targetModule, 'planned_maintenance', { serviceId: n.serviceId });
    } else if (n.linkTo === 'archive_planned') {
      if (onNavigate) onNavigate(targetModule, 'archive_planned', { serviceId: n.serviceId });
    } else if (n.linkTo === 'action_items') {
      if (onNavigate) onNavigate(targetModule, 'action_items');
    } else if (n.linkTo === 'machines') {
      if (onNavigate) onNavigate(targetModule, 'machines', { machineId: n.machineId });
    } else if (n.linkTo === 'reporters') {
      if (onNavigate) onNavigate(targetModule, 'reporters');
    } else if (n.linkTo === 'parts') {
      if (onNavigate) onNavigate(targetModule, 'parts_inventory', { partId: n.partId });
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
              <i className="ph ph-bell-ringing text-blue-600"></i> {t('notifications.title', 'Powiadomienia')}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} 
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <i className="ph ph-check-double"></i> {t('notifications.mark_all_read', 'Odczytaj wszystkie')}
              </button>
            )}
          </div>
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto overscroll-contain">
            {relevantNotifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <i className="ph ph-bell-z text-3xl text-slate-300"></i>
                </div>
                <p className="text-slate-500 font-medium">{t('notifications.empty_title', 'Brak powiadomień')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('notifications.empty_desc', 'Wszystko jest pod kontrolą')}</p>
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
                        {(n.createdAt?.toDate ? n.createdAt.toDate() : new Date()).toLocaleString(locale)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50/80 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('notifications.end', 'Koniec powiadomień')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
