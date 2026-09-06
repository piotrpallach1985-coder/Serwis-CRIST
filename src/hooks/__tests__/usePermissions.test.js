import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePermissions } from '../usePermissions';

describe('usePermissions', () => {
  it('should return all false when user is null', () => {
    const { result } = renderHook(() => usePermissions(null, []));
    
    expect(result.current).toEqual({
      canEditPlanned: false,
      canDeletePlanned: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewReports: false,
      canDeleteTickets: false,
      isAdmin: false,
      isManager: false,
    });
  });

  it('should grant all permissions to admin', () => {
    const user = { role: 'admin' };
    const { result } = renderHook(() => usePermissions(user, []));
    
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isManager).toBe(true);
    expect(result.current.canEditPlanned).toBe(true);
    expect(result.current.canDeletePlanned).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageRoles).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canDeleteTickets).toBe(true);
  });

  it('should grant specific defaults to manager', () => {
    const user = { role: 'manager' };
    const { result } = renderHook(() => usePermissions(user, []));
    
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(true);
    expect(result.current.canEditPlanned).toBe(true); // Managers can edit planned
    expect(result.current.canViewReports).toBe(true); // Managers can view reports
    
    // They shouldn't have these unless explicitly granted
    expect(result.current.canDeletePlanned).toBe(false);
    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canDeleteTickets).toBe(false);
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
});
