import { create } from 'zustand';

export const useManagerStore = create((set) => ({
  tickets: [],
  machines: [],
  reporters: [],
  services: [],
  plannedServices: [],
  notifications: [],
  actionItems: [],
  roles: [],
  regions: [],
  allowTicketDeletion: false,
  plannedWarningDays: 30,
  branding: {
    companyName: 'CRIST S.A.',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    companyLogoUrl: '',
    appLogoUrl: ''
  },
  
  setTickets: (tickets) => set({ tickets }),
  setMachines: (machines) => set({ machines }),
  setReporters: (reporters) => set({ reporters }),
  setServices: (services) => set({ services }),
  setPlannedServices: (plannedServices) => set({ plannedServices }),
  setNotifications: (notifications) => set({ notifications }),
  setActionItems: (actionItems) => set({ actionItems }),
  setRoles: (roles) => set({ roles }),
  setRegions: (regions) => set({ regions }),
  setAllowTicketDeletion: (allowTicketDeletion) => set({ allowTicketDeletion }),
  setPlannedWarningDays: (plannedWarningDays) => set({ plannedWarningDays }),
  setBranding: (branding) => set({ branding })
}));
