export const createUserSlice = (set) => ({
  reporters: [],
  roles: [],
  setReporters: (reporters) => set({ reporters }),
  setRoles: (roles) => set({ roles }),
});
