import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect } from 'react';
import { useManagerStore } from '../../store/managerStore';
import MachineDTR from './MachineDTR';
import MachineWorkHoursModal from './MachineWorkHoursModal';
import { USER_ROLES } from '../../utils/constants';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { getOrCreateQrKey, getCachedQrKey, buildMachineQrValue } from '../../services/qrAccess.service';
import { useTileLayout } from '../../hooks/useTileLayout';
import { usePermissions } from '../../hooks/usePermissions';
import CustomizableTileGrid from '../shared/CustomizableTileGrid';

import MachineHeader from './machines/MachineHeader';
import MachineInfoCard from './machines/MachineInfoCard';
import MachineQRCard from './machines/MachineQRCard';
import MachineHistoryPanels from './machines/MachineHistoryPanels';

export default function MachineDetails({
  isFromQR,
  onScanNext,
  onNfcNext,
  machine,
  history,
  loading,
  onBack,
  onPrint,
  onGeneratePDF,
  onGenerateNewQR,
  regions,
  onEdit,
  onDelete,
  onOpenTicket,
  onOpenService,
  onViewRelatedMachine,
  onAddChildMachine,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canManageDtr, canDeleteTechNotes } = usePermissions(user);
  const [isWorkHoursModalOpen, setIsWorkHoursModalOpen] = useState(false);
  const regionName =
    regions.find(r => r.id === machine.regionId)?.name || t('machines.details.unknownRegion');
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
  const branding = useManagerStore(state => state.branding);

  const parentMachine = machine.parentId ? machines.find(m => m.id === machine.parentId) : null;
  const childMachines = machines.filter(m => m.parentId === machine.id);

  const machinePartsTx = useMemo(() => {
    return partTransactions
      .filter(tx => {
        if (!['issue_planned', 'issue_adhoc', 'issue'].includes(tx.type)) return false;
        if (tx.machineId === machine.id) return true;
        if (
          tx.machineName &&
          machine.name &&
          tx.machineName.toLowerCase().includes(machine.name.toLowerCase())
        )
          return true;
        return false;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [partTransactions, machine.id, machine.name]);

  const totalPartsCost = useMemo(() => {
    return partTransactions
      .filter(tx => {
        if (!['issue_planned', 'issue_adhoc', 'issue'].includes(tx.type)) return false;
        if (tx.machineId === machine.id) return true;
        if (tx.referenceId) {
          if (tx.type === 'issue_adhoc' || tx.type === 'issue') {
            const tic = tickets.find(item => item.id === tx.referenceId);
            if (tic && tic.machineId === machine.id) return true;
          } else if (tx.type === 'issue_planned') {
            const srv = plannedServices.find(item => item.id === tx.referenceId);
            if (srv && srv.machineId === machine.id) return true;
          }
        }
        return false;
      })
      .reduce(
        (sum, tx) =>
          sum + Number(tx.totalCost || Math.abs(Number(tx.quantity)) * Number(tx.price) || 0),
        0
      );
  }, [partTransactions, machine.id, tickets, plannedServices]);

  const [qrKey, setQrKey] = useState(() => getCachedQrKey(currentTenantId));
  useEffect(() => {
    let active = true;
    getOrCreateQrKey(currentTenantId)
      .then(k => {
        if (active && k) setQrKey(prev => (prev === k ? prev : k));
      })
      .catch(err => console.error('Nie udało się pobrać klucza QR firmy:', err));
    return () => {
      active = false;
    };
  }, [currentTenantId]);

  const qrValue = useMemo(
    () =>
      buildMachineQrValue(machine, currentTenantId, qrKey, {
        allMachines: machines,
        branding,
      }),
    [machine, currentTenantId, qrKey, machines, branding]
  );

  const tiles = useMemo(
    () => [
      {
        id: 'machine_info',
        title: t('machines.details.infoTileTitle', 'Dane maszyny, podzespoły i części (BOM)'),
        icon: 'ph-engine',
        defaultColSpan: 8,
        render: () => (
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
        ),
      },
      {
        id: 'machine_qr',
        title: t('machines.details.qrTileTitle', 'Kod QR maszyny'),
        icon: 'ph-qr-code',
        defaultColSpan: 4,
        render: () => (
          <MachineQRCard
            machine={machine}
            qrValue={qrValue}
            machines={machines}
            branding={branding}
          />
        ),
      },
      {
        id: 'machine_dtr',
        title: t('machines.details.dtrTileTitle', 'Dokumentacja DTR i notatki techniczne'),
        icon: 'ph-files',
        defaultColSpan: 12,
        render: () => (
          <MachineDTR
            machine={machine}
            user={user}
            canManage={canManageDtr}
            canDeleteNotes={canDeleteTechNotes}
          />
        ),
      },
      {
        id: 'machine_tickets',
        title: t('machines.details.breakdownHistory'),
        icon: 'ph-warning-circle',
        defaultColSpan: 6,
        render: () =>
          loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-3">
              <i className="ph ph-spinner-gap animate-spin text-3xl text-blue-500"></i>
              <span className="text-gray-500 text-sm font-medium">
                {t('machines.details.loadingHistory')}
              </span>
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
              panel="tickets"
            />
          ),
      },
      {
        id: 'machine_services',
        title: t('machines.details.serviceHistory'),
        icon: 'ph-calendar-check',
        defaultColSpan: 6,
        render: () =>
          loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-3">
              <i className="ph ph-spinner-gap animate-spin text-3xl text-blue-500"></i>
              <span className="text-gray-500 text-sm font-medium">
                {t('machines.details.loadingHistory')}
              </span>
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
              panel="services"
            />
          ),
      },
      {
        id: 'machine_parts',
        title: t('machines.details.usedPartsTitle'),
        icon: 'ph-money',
        defaultColSpan: 12,
        render: () => (
          <MachineHistoryPanels
            history={history}
            machine={machine}
            machinePartsTx={machinePartsTx}
            parts={parts}
            totalPartsCost={totalPartsCost}
            onOpenTicket={onOpenTicket}
            onOpenService={onOpenService}
            panel="parts"
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      machine,
      parentMachine,
      childMachines,
      regions,
      regionName,
      totalPartsCost,
      parts,
      qrValue,
      user,
      loading,
      history,
      machinePartsTx,
      t,
    ]
  );

  const tileLayout = useTileLayout('machine_details', tiles);

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full relative text-[#111827]">
      <MachineHeader
        machine={machine}
        onBack={onBack}
        onScanNext={onScanNext}
        onNfcNext={onNfcNext}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrint={onPrint}
        onGeneratePDF={onGeneratePDF}
        tileLayout={tileLayout}
      />

      <div className="p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 pb-12">
        <CustomizableTileGrid tiles={tiles} layoutState={tileLayout} />
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
