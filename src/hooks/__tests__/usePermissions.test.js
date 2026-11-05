import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePermissions } from '../usePermissions';
import { USER_ROLES } from '../../utils/constants';

describe('usePermissions', () => {
  it('should return all false when user is null', () => {
    const { result } = renderHook(() => usePermissions(null, []));
    
    expect(result.current).toEqual(expect.objectContaining({
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
      isAdmin: false,
      isManager: false,
      isPlannedServicesModuleEnabled: true,
      isInventoryModuleEnabled: true,
    }));
    expect(typeof result.current.canAccessTab).toBe('function');
  });

  it('should grant all permissions to admin', () => {
    const user = { role: USER_ROLES.ADMIN };
    const { result } = renderHook(() => usePermissions(user, []));
    
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isManager).toBe(true);
    expect(result.current.canEditPlanned).toBe(true);
    expect(result.current.canDeletePlanned).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageRoles).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canDeleteTickets).toBe(true);
    expect(result.current.canAccessCompanyAdmin).toBe(true);
  });

  it('should grant specific defaults to manager (both "manager" and USER_ROLES.MANAGER "kierownik")', () => {
    for (const roleVal of ['manager', USER_ROLES.MANAGER]) {
      const user = { role: roleVal };
      const { result } = renderHook(() => usePermissions(user, []));

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(true);
      expect(result.current.canEditPlanned).toBe(true);
      expect(result.current.canViewReports).toBe(true);

      expect(result.current.canDeletePlanned).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
      expect(result.current.canDeleteTickets).toBe(false);
    }
  });

  it('should restrict default operator role from accessing master data and admin tabs', () => {
    const user = { role: USER_ROLES.OPERATOR };
    const { result } = renderHook(() => usePermissions(user, []));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(false);
    expect(result.current.canAccessTab('home')).toBe(true);
    expect(result.current.canAccessTab('new_ticket_scanner')).toBe(true);
    expect(result.current.canAccessTab('tickets')).toBe(true);
    expect(result.current.canAccessTab('machines')).toBe(false);
    expect(result.current.canAccessTab('users')).toBe(false);
  });

  it('should read permissions from firestore roles config', () => {
    const user = { role: 'mechanic' };
    const roles = [
      { id: 'mechanic', permissions: ['edit_planned', 'view_reports'] }
    ];
    
    const { result } = renderHook(() => usePermissions(user, roles));
    
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(false);
    expect(result.current.canEditPlanned).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canDeletePlanned).toBe(false);
  });

  it('should fallback to user.permissions if role config not found', () => {
    const user = { role: 'mechanic', permissions: ['delete_tickets'] };
    const roles = []; // Empty roles
    
    const { result } = renderHook(() => usePermissions(user, roles));
    
    expect(result.current.canDeleteTickets).toBe(true);
    expect(result.current.canEditPlanned).toBe(false);
  });

  it('should restrict access to disabled modules via canAccessTab', () => {
    const user = { role: USER_ROLES.ADMIN };
    const modules = { plannedServices: false, inventory: false };
    const { result } = renderHook(() => usePermissions(user, [], modules));

    expect(result.current.isPlannedServicesModuleEnabled).toBe(false);
    expect(result.current.isInventoryModuleEnabled).toBe(false);
    expect(result.current.canAccessTab('planned_services')).toBe(false);
    expect(result.current.canAccessTab('parts_inventory')).toBe(false);
    expect(result.current.canAccessTab('tickets')).toBe(true);
  });

  it('should automatically grant access to tickets and planned_maintenance tabs when only_assigned_tasks is enabled on custom role', () => {
    const user = { role: 'Serwis Zewnętrzyn Pla', assignedService: 'Serwis Zewnętrzny' };
    const roles = [
      { id: 'Serwis Zewnętrzyn Pla', name: 'Serwis Zewnętrzyn Pla', permissions: ['only_assigned_tasks'] },
    ];
    const { result } = renderHook(() => usePermissions(user, roles));

    expect(result.current.onlyAssignedTasks).toBe(true);
    expect(result.current.canAccessTab('tickets')).toBe(true);
    expect(result.current.canAccessTab('archive')).toBe(true);
    expect(result.current.canAccessTab('planned_maintenance')).toBe(true);
    expect(result.current.canAccessTab('archive_planned')).toBe(true);
    expect(result.current.canAccessTab('dashboard_tickets')).toBe(false);
    expect(result.current.canAccessTab('users')).toBe(false);
  });
});
