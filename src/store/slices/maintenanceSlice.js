export const createMaintenanceSlice = (set) => ({
  services: [],
  plannedServices: [],
  actionItems: [],
  plannedWarningDays: 30,
  setServices: (services) => set({ services }),
  setPlannedServices: (plannedServices) => set({ plannedServices }),
  setActionItems: (actionItems) => set({ actionItems }),
  setPlannedWarningDays: (plannedWarningDays) => set({ plannedWarningDays }),
});
