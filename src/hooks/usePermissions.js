import { useMemo } from 'react';

/**
 * usePermissions — hook obliczający uprawnienia na podstawie roli użytkownika i konfiguracji ról w bazie.
 * @param {object} user - obiekt zalogowanego użytkownika { role, permissions }
 * @param {array}  roles - lista ról z Firestore
 * @returns uprawnienia dla tego użytkownika
 */
export function usePermissions(user, roles) {
  return useMemo(() => {
    if (!user) {
      return {
        canEditPlanned: false,
        canDeletePlanned: false,
        canManageUsers: false,
        canManageRoles: false,
        canViewReports: false,
        canDeleteTickets: false,
        isAdmin: false,
        isManager: false,
      };
    }

    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager' || isAdmin;

    // Szukamy konfiguracji roli w bazie (opcjonalne - może nie istnieć)
    const roleConfig = roles.find(r => r.id === user.role);
    const perms = roleConfig?.permissions || user.permissions || [];

    const hasPermission = (perm) => isAdmin || perms.includes(perm);

    return {
      isAdmin,
      isManager,
      canEditPlanned: hasPermission('edit_planned') || isManager,
      canDeletePlanned: hasPermission('delete_planned') || isAdmin,
      canManageUsers: isAdmin,
      canManageRoles: isAdmin,
      canViewReports: hasPermission('view_reports') || isManager,
      canDeleteTickets: hasPermission('delete_tickets') || isAdmin,
    };
  }, [user, roles]);
}
