export const createInventorySlice = (set) => ({
  parts: [],
  partTransactions: [],
  setParts: (parts) => set({ parts }),
  setPartTransactions: (partTransactions) => set({ partTransactions }),
});
