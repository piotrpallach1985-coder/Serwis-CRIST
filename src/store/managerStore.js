import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTicketSlice } from './slices/ticketSlice';
import { createMachineSlice } from './slices/machineSlice';
import { createMaintenanceSlice } from './slices/maintenanceSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createUserSlice } from './slices/userSlice';
import { createAppSlice } from './slices/appSlice';

export const useManagerStore = create(
  persist(
    (...a) => ({
      ...createTicketSlice(...a),
      ...createMachineSlice(...a),
      ...createMaintenanceSlice(...a),
      ...createInventorySlice(...a),
      ...createUserSlice(...a),
      ...createAppSlice(...a),
    }),
    {
      name: 'vexont-tenant-storage',
      partialize: (state) => ({ tenantId: state.tenantId }),
    }
  )
);
