import { useMemo } from 'react';
import { USER_ROLES } from '../utils/constants';
import { useManagerStore } from '../store/managerStore';

/**
 * usePermissions — hook obliczający uprawnienia na podstawie roli użytkownika,
 * konfiguracji ról w bazie oraz wykupionych modułów firmy (branding.modules).
 * @param {object} user - obiekt zalogowanego użytkownika { role, permissions }
 * @param {array}  roles - lista ról z Firestore
 * @returns uprawnienia dla tego użytkownika i tenanta
 */
export function usePermissions(user, roles = [], customModules = null) {
  const storeRoles = useManagerStore(state => state.roles);
  const branding = useManagerStore(state => state.branding);
  const effectiveRoles = roles && roles.length > 0 ? roles : (storeRoles || []);
  const activeModules = customModules || branding?.modules || {};

  return useMemo(() => {
    const isPlannedServicesModuleEnabled =
      activeModules.planned_services !== false && activeModules.plannedServices !== false;
    const isInventoryModuleEnabled = activeModules.inventory !== false;

    if (!user) {
      return {
        canEditPlanned: false,
        canDeletePlanned: false,
        canManageUsers: false,
        canManageRoles: false,
        canViewReports: false,
        canDeleteTickets: false,
        canEditMap: false,
        canManageDtr: false,
        canDeleteTechNotes: false,
        canAccessCompanyAdmin: false,
        canAccessTab: () => false,
        isPlannedServicesModuleEnabled,
        isInventoryModuleEnabled,
        onlyAssignedTasks: false,
        isAdmin: false,
        isManager: false,
      };
    }

    const isSuperAdmin = user.role === USER_ROLES.SUPERADMIN;
    const isAdmin = user.role === USER_ROLES.ADMIN || isSuperAdmin;
    const isManager = user.role === 'manager' || isAdmin;

    const roleConfig = (effectiveRoles || []).find(
      r => r.id === user.role || r.name === user.role
    );
    const perms = roleConfig?.permissions || user.permissions || [];
    const hasCustomPerms = Boolean(
      roleConfig || (Array.isArray(user.permissions) && user.permissions.length > 0)
    );

    const hasPermission = (perm) => isAdmin || perms.includes(perm);
    const hasDedicatedService = Boolean(
      user.assignedService ||
        (Array.isArray(user.dedicatedServices) && user.dedicatedServices.length > 0)
    );
    const onlyAssignedTasks =
      !isAdmin &&
      (perms.includes('only_assigned_tasks') ||
        Boolean(user.onlyAssignedTasks) ||
        hasDedicatedService);

    const PLANNED_TABS = ['planned_kpi', 'dashboard_planned', 'planned_maintenance', 'planned_services', 'archive_planned'];
    const ADMIN_TABS = ['users', 'roles', 'reports', 'audit', 'ai_stats', 'api_settings'];

    const canAccessTab = (tabId) => {
      if (!tabId) return false;
      if (tabId === 'home' || tabId === 'new_ticket_scanner') return true;
      if (tabId === 'superadmin') return isSuperAdmin;

      // 1. Ograniczenie przez wykupione moduły w SuperAdminie
      if (PLANNED_TABS.includes(tabId) && !isPlannedServicesModuleEnabled) {
        return false;
      }
      if (tabId.startsWith('parts_') && !isInventoryModuleEnabled) {
        return false;
      }

      // 2. Administrator firmy ma dostęp do wszystkich aktywnych modułów
      if (isAdmin) return true;

      // 3. Niestandardowa rola z przypisaną listą uprawnień
      if (hasCustomPerms) {
        if (perms.includes(tabId)) return true;
        if (tabId === 'machines_qr' && perms.includes('machines')) return true;
        if (tabId.startsWith('parts_') && perms.includes('parts')) return true;
        if (tabId === 'planned_kpi' && perms.includes('planned_maintenance')) return true;
        if (tabId === 'action_items' && (perms.includes('planned_maintenance') || perms.includes('tickets'))) return true;
        return false;
      }

      // 4. Domyślna rola manager (bez indywidualnej konfiguracji)
      if (ADMIN_TABS.includes(tabId)) {
        return tabId === 'reports' && isManager;
      }
      return true;
    };

    const canAccessCompanyAdmin =
      isAdmin || ADMIN_TABS.some(tab => canAccessTab(tab));

    return {
      isAdmin,
      isSuperAdmin,
      isManager,
      isPlannedServicesModuleEnabled,
      isInventoryModuleEnabled,
      canAccessTab,
      canAccessCompanyAdmin,
      canEditMap: hasPermission('edit_map') || (!hasCustomPerms && isManager),
      canManageDtr: isPlannedServicesModuleEnabled && (hasPermission('manage_dtr') || (!hasCustomPerms && isManager)),
      canDeleteTechNotes: hasPermission('delete_tech_notes') || hasPermission('delete_machine_notes') || isAdmin,
      canEditPlanned: isPlannedServicesModuleEnabled && (hasPermission('edit_planned') || (!hasCustomPerms && isManager)),
      canDeletePlanned: isPlannedServicesModuleEnabled && (hasPermission('delete_planned') || isAdmin),
      canManageUsers: hasPermission('users') || isAdmin,
      canManageRoles: hasPermission('roles') || isAdmin,
      canViewReports: hasPermission('reports') || hasPermission('view_reports') || (!hasCustomPerms && isManager),
      canDeleteTickets: hasPermission('delete_tickets') || isAdmin,
      onlyAssignedTasks,
    };
  }, [user, effectiveRoles, branding]);
}
