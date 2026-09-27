import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useManagerStore = create(
  persist(
    (set) => ({
      tickets: [],
      machines: [],
      reporters: [],
  parts: [],
  partTransactions: [],
      services: [],
      plannedServices: [],
      notifications: [],
      actionItems: [],
      roles: [],
      regions: [],
      allowTicketDeletion: false,
      plannedWarningDays: 30,
      tenantId: null,
      limits: { maxUsers: 10, maxMachines: 50 },
      groqApiKey: '',
      branding: {
        companyName: '',
        systemSubtitle: 'DYSPOZYTORNIA UR',
        companyLogoUrl: '',
        appLogoUrl: ''
      },
                  
      setTickets: (tickets) => set({ tickets }),
      setMachines: (machines) => set({ machines }),
      setReporters: (reporters) => set({ reporters }),
      setParts: (parts) => set({ parts }),
      setPartTransactions: (partTransactions) => set({ partTransactions }),
      setServices: (services) => set({ services }),
      setPlannedServices: (plannedServices) => set({ plannedServices }),
      setNotifications: (notifications) => set({ notifications }),
      setActionItems: (actionItems) => set({ actionItems }),
      setRoles: (roles) => set({ roles }),
      setRegions: (regions) => set({ regions }),
      setAllowTicketDeletion: (allowTicketDeletion) => set({ allowTicketDeletion }),
      setPlannedWarningDays: (plannedWarningDays) => set({ plannedWarningDays }),
      setTenantId: (tenantId) => set({ tenantId }),
      setLimits: (limits) => set({ limits }),
      setGroqApiKey: (groqApiKey) => set({ groqApiKey }),
      setBranding: (branding) => set({ branding }),
    }),
    {
      name: 'vexont-tenant-storage',
      partialize: (state) => ({ tenantId: state.tenantId }),
    }
  )
);
