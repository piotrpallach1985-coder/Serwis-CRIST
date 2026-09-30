import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import React, {  useMemo, useState , useEffect } from 'react';
import { useManagerStore } from '../../store/managerStore';
import MachineDTR from './MachineDTR';
import MachineWorkHoursModal from './MachineWorkHoursModal';
import { USER_ROLES } from '../../utils/constants';
import { getCurrentTenant } from '../../utils/tenantHelper';

import MachineHeader from './machines/MachineHeader';
import MachineInfoCard from './machines/MachineInfoCard';
import MachineQRCard from './machines/MachineQRCard';
import MachineHistoryPanels from './machines/MachineHistoryPanels';

export default function MachineDetails({ isFromQR, onScanNext, onNfcNext, machine, history, loading, onBack, onPrint, onGeneratePDF, onGenerateNewQR, regions, onEdit, onDelete, onOpenTicket, onOpenService, onViewRelatedMachine, onAddChildMachine }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isWorkHoursModalOpen, setIsWorkHoursModalOpen] = useState(false);
  const regionName = regions.find(r => r.id === machine.regionId)?.name || t('machines.details.unknownRegion');
  const currentTenantId = getCurrentTenant();
  const [partTransactions, setPartTransactions] = useState([]);
  
  useEffect(() => {
    import('../../hooks/usePartTransactions').then(({ fetchTransactionsForMachine }) => {
      fetchTransactionsForMachine(getCurrentTenant(), machine.id).then(setPartTransactions);
    });
  }, [machine.id]);

  const parts = useManagerStore(state => state.parts || []);
  const tickets = useManagerStore(state => state.tickets || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  const machines = useManagerStore(state => state.machines || []);
  
  const parentMachine = machine.parentId ? machines.find(m => m.id === machine.parentId) : null;
  const childMachines = machines.filter(m => m.parentId === machine.id);
  
  const machinePartsTx = useMemo(() => {
    return partTransactions.filter(tx => {
      if (!["issue_planned", "issue_adhoc", "issue"].includes(tx.type)) return false;
      if (tx.machineId === machine.id) return true;
      if (tx.machineName && machine.name && tx.machineName.toLowerCase().includes(machine.name.toLowerCase())) return true;
      return false;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [partTransactions, machine.id, machine.name]);

  const totalPartsCost = useMemo(() => {
    return partTransactions.filter(tx => {
      if (!["issue_planned", "issue_adhoc", "issue"].includes(tx.type)) return false;
      if (tx.machineId === machine.id) return true;
      if (tx.referenceId) {
        if (tx.type === "issue_adhoc" || tx.type === "issue") {
          const t = tickets.find(t => t.id === tx.referenceId);
          if (t && t.machineId === machine.id) return true;
        } else if (tx.type === 'issue_planned') {
          const s = plannedServices.find(s => s.id === tx.referenceId);
          if (s && s.machineId === machine.id) return true;
        }
      }
      return false;
    }).reduce((sum, tx) => sum + Number(tx.totalCost || (Math.abs(Number(tx.quantity)) * Number(tx.price)) || 0), 0);
  }, [partTransactions, machine.id, tickets, plannedServices]);

  const qrValue = `tenant=${currentTenantId}&machine=${machine.id}`;

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full animate-fade-in relative text-[#111827]">
      
      <MachineHeader 
        machine={machine}
        onBack={onBack}
        onScanNext={onScanNext}
        onNfcNext={onNfcNext}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrint={onPrint}
        onGeneratePDF={onGeneratePDF}
      />

      <div className="p-6 overflow-y-auto h-full flex flex-col gap-6">
        {/* Górna sekcja - Info i QR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MachineInfoCard 
            machine={machine}
            parentMachine={parentMachine}
            childMachines={childMachines}
            regions={regions}
            regionName={regionName}
            totalPartsCost={totalPartsCost}
            setIsWorkHoursModalOpen={setIsWorkHoursModalOpen}
            onViewRelatedMachine={onViewRelatedMachine}
            onAddChildMachine={onAddChildMachine}
            parts={parts}
          />

          <MachineQRCard 
            machine={machine}
            qrValue={qrValue}
          />
        </div>

        <MachineDTR 
          machine={machine} 
          user={user} 
          canManage={(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN) || (user?.permissions || []).includes('manage_dtr')} 
          canDeleteNotes={(user?.role === 'admin' || user?.role === 'superadmin') || (user?.permissions || []).includes('delete_tech_notes')}
        />

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center gap-3">
            <i className="ph ph-spinner-gap animate-spin text-4xl text-blue-500"></i>
            <span className="text-gray-500 font-medium">{t('machines.details.loadingHistory')}</span>
          </div>
        ) : (
          <MachineHistoryPanels 
            history={history}
            machine={machine}
            machinePartsTx={machinePartsTx}
            parts={parts}
            totalPartsCost={totalPartsCost}
            onOpenTicket={onOpenTicket}
            onOpenService={onOpenService}
          />
        )}
      </div>

      <MachineWorkHoursModal 
        isOpen={isWorkHoursModalOpen} 
        onClose={() => setIsWorkHoursModalOpen(false)} 
        machine={machine} 
        user={user} 
      />
    </div>
  );
}

MachineDetails.propTypes = {
  isFromQR: PropTypes.bool,
  onScanNext: PropTypes.func,
  onNfcNext: PropTypes.func,
  machine: PropTypes.object.isRequired,
  history: PropTypes.object,
  loading: PropTypes.bool,
  onBack: PropTypes.func,
  onPrint: PropTypes.func,
  onGeneratePDF: PropTypes.func,
  onGenerateNewQR: PropTypes.func,
  regions: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onOpenTicket: PropTypes.func,
  onOpenService: PropTypes.func,
};
