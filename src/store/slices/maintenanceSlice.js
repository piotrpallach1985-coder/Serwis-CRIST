import { updatePlannedService, deletePlannedService } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';

export const createMaintenanceSlice = (set, get) => ({
  services: [],
  plannedServices: [],
  actionItems: [],
  plannedWarningDays: 30,
  
  setServices: (services) => set({ services }),
  setPlannedServices: (plannedServices) => set({ plannedServices }),
  setActionItems: (actionItems) => set({ actionItems }),
  setPlannedWarningDays: (plannedWarningDays) => set({ plannedWarningDays }),

  // --- Akcje asynchroniczne zintegrowane ze stanem (eliminacja prop drillingu) ---
  deletePlannedServiceAction: async (id) => {
    await deletePlannedService(id);
  },
  
  updateRbgAction: async (machineId, newRbgValue) => {
    await updateMachineWorkHours(machineId, Number(newRbgValue));
  },
  
  setServiceInProgressAction: async (srv, user) => {
    const historyEntry = { 
      date: new Date().toISOString(), 
      user: user?.name || 'System', 
      action: 'Zmieniono status na: W trakcie', 
      note: '' 
    };
    const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
    await updatePlannedService(srv.id, { status: 'in_progress', history: newHistory });
  },

  addServiceNoteAction: async (srv, noteText, user) => {
    const historyEntry = { 
      date: new Date().toISOString(), 
      user: user?.name || 'System', 
      action: 'Dodano notatkę', 
      note: noteText 
    };
    const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
    await updatePlannedService(srv.id, { history: newHistory });
  },
});
