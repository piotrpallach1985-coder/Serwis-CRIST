export const createAppSlice = (set) => ({
  notifications: [],
  allowTicketDeletion: false,
  tenantId: null,
  limits: { maxUsers: 10, maxMachines: 50 },
  
  transcribeModel: 'gemini-3.8-flash',
  geminiModel: 'gemini-3.8-flash',
  geminiPrice: 0.60,
  transcribePrice: 0.40,
  branding: {
    companyName: '',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    industryProfile: 'industrial',
    companyLogoUrl: '',
    appLogoUrl: ''
  },
  setNotifications: (notifications) => set({ notifications }),
  setAllowTicketDeletion: (allowTicketDeletion) => set({ allowTicketDeletion }),
  setTenantId: (tenantId) => set({ tenantId }),
  setLimits: (limits) => set({ limits }),
  
  setTranscribeModel: (transcribeModel) => set({ transcribeModel }),
  setGeminiModel: (geminiModel) => set({ geminiModel }),
  setGeminiPrice: (geminiPrice) => set({ geminiPrice }),
  setTranscribePrice: (transcribePrice) => set({ transcribePrice }),
  setBranding: (branding) => set({ branding }),
});
