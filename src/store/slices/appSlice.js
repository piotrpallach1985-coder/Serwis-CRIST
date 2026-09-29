export const createAppSlice = (set) => ({
  notifications: [],
  allowTicketDeletion: false,
  tenantId: null,
  limits: { maxUsers: 10, maxMachines: 50 },
  groqApiKey: '',
  branding: {
    companyName: '',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    companyLogoUrl: '',
    appLogoUrl: ''
  },
  setNotifications: (notifications) => set({ notifications }),
  setAllowTicketDeletion: (allowTicketDeletion) => set({ allowTicketDeletion }),
  setTenantId: (tenantId) => set({ tenantId }),
  setLimits: (limits) => set({ limits }),
  setGroqApiKey: (groqApiKey) => set({ groqApiKey }),
  setBranding: (branding) => set({ branding }),
});
