export const createMachineSlice = (set) => ({
  machines: [],
  regions: [],
  setMachines: (machines) => set({ machines }),
  setRegions: (regions) => set({ regions }),
});
