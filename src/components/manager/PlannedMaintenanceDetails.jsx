import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import MachineDTR from './MachineDTR';
import PlannedMaintenanceHistory from './PlannedMaintenanceHistory';
import PlannedMaintenanceRbgModal from './PlannedMaintenanceRbgModal';
import PlannedMaintenanceCompletionModal from './PlannedMaintenanceCompletionModal';
import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import PlannedMaintenanceInfo from './PlannedMaintenanceInfo';
import PlannedMaintenanceTimeline from './PlannedMaintenanceTimeline';
import TicketPartUsageModal from './tickets/TicketPartUsageModal';
import { useTileLayout } from '../../hooks/useTileLayout';
import CustomizableTileGrid, { TileLayoutButton } from '../shared/CustomizableTileGrid';

import { USER_ROLES } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';

export default function PlannedMaintenanceDetails({
  srv,
  machine,
  isArchive,
  allowTicketDeletion,
  canEditPlanned,
  canDeletePlanned,
  getMachineRegionName,
  machines,
  regions = [],
  onBack,
  onComplete,
  onAddFutureNote,
  onEdit,
  onAddPart,
  rbgUpdateModal,
  setRbgUpdateModal,
  newRbgValue,
  setNewRbgValue,
  serviceToComplete,
  setServiceToComplete,
  isModalOpen,
  setIsModalOpen,
  editingService,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const deletePlannedServiceAction = useManagerStore(state => state.deletePlannedServiceAction);
  const updateRbgAction = useManagerStore(state => state.updateRbgAction);
  const setServiceInProgressAction = useManagerStore(state => state.setServiceInProgressAction);
  const setServicePendingAction = useManagerStore(state => state.setServicePendingAction);
  const parts = useManagerStore(state => state.parts || []);

  const [partTransactions, setPartTransactions] = useState([]);
  const [isPartUsageModalOpen, setIsPartUsageModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    import('../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
      fetchTransactionsForReference(getCurrentTenant(), srv.id).then(setPartTransactions);
    });
  }, [srv.id]);

  const actualPartsUsed = useMemo(() => {
    return partTransactions.filter(
      tx => tx.referenceId === srv.id && (tx.type === 'issue_planned' || tx.type === 'issue_adhoc')
    );
  }, [partTransactions, srv.id]);

  const isCompleted = srv.status === 'completed';
  const targetMachine = machine || (machines || []).find(m => m.id === srv?.machineId);

  const tiles = useMemo(() => {
    const list = [
      {
        id: 'info_params',
        title: 'Dane i parametry serwisu',
        icon: 'ph-sliders-horizontal',
        defaultColSpan: 9,
        render: () => (
          <PlannedMaintenanceInfo
            srv={srv}
            machine={targetMachine}
            parts={parts}
            actualPartsUsed={actualPartsUsed}
            getMachineRegionName={getMachineRegionName}
            regions={regions}
            section="params"
          />
        ),
      },
      {
        id: 'history',
        title: 'Historia zdarzeń',
        icon: 'ph-clock-counter-clockwise',
        defaultColSpan: 3,
        render: () => (
          <PlannedMaintenanceHistory srv={srv} setLightboxImg={setLightboxImg} />
        ),
      },
      {
        id: 'info_resources',
        title: 'Wymagane narzędzia i części',
        icon: 'ph-wrench',
        defaultColSpan: 6,
        render: () => (
          <PlannedMaintenanceInfo
            srv={srv}
            machine={targetMachine}
            parts={parts}
            actualPartsUsed={actualPartsUsed}
            getMachineRegionName={getMachineRegionName}
            regions={regions}
            section="resources"
          />
        ),
      },
      {
        id: 'info_checklist',
        title: 'Zakres prac do wykonania',
        icon: 'ph-list-checks',
        defaultColSpan: 6,
        render: () => (
          <PlannedMaintenanceInfo
            srv={srv}
            machine={targetMachine}
            parts={parts}
            actualPartsUsed={actualPartsUsed}
            getMachineRegionName={getMachineRegionName}
            regions={regions}
            section="checklist"
          />
        ),
      },
      {
        id: 'timeline',
        title: 'Kroki realizacji serwisu (1–5)',
        icon: 'ph-list-numbers',
        defaultColSpan: 12,
        render: () => (
          <PlannedMaintenanceTimeline
            srv={srv}
            isCompleted={isCompleted}
            user={user}
            setServiceInProgressAction={setServiceInProgressAction}
            setServicePendingAction={setServicePendingAction}
            onAddFutureNote={onAddFutureNote}
            setServiceToComplete={setServiceToComplete}
            onEdit={onEdit}
            onDelete={deletePlannedServiceAction}
            onOpenPartModal={() => setIsPartUsageModalOpen(true)}
            canEditPlanned={canEditPlanned}
            canDeletePlanned={canDeletePlanned}
            isArchive={isArchive}
            allowTicketDeletion={allowTicketDeletion}
            onBack={onBack}
            actualPartsUsed={actualPartsUsed}
          />
        ),
      },
    ];

    if (targetMachine) {
      list.push({
        id: 'dtr',
        title: 'Dokumentacja DTR i notatki techniczne',
        icon: 'ph-files',
        defaultColSpan: 12,
        render: () => (
          <MachineDTR
            machine={targetMachine}
            user={user}
            canManage={
              user?.role === 'manager' ||
              user?.role === USER_ROLES.ADMIN ||
              user?.role === USER_ROLES.SUPERADMIN
            }
            canDeleteNotes={
              user?.role === 'admin' ||
              user?.role === 'superadmin' ||
              (user?.permissions || []).includes('delete_tech_notes')
            }
          />
        ),
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    srv,
    targetMachine,
    parts,
    actualPartsUsed,
    regions,
    isCompleted,
    user,
    canEditPlanned,
    canDeletePlanned,
    isArchive,
    allowTicketDeletion,
  ]);

  // Wspólny klucz 'service_details' dla aktywnych serwisów oraz archiwum serwisów
  const tileLayout = useTileLayout('service_details', tiles);

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto animate-fade-in relative text-[#111827]">
      {/* HEADER NAV */}
      <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              if (location.state?.backToMachineId) {
                navigate(`/manager/master_data/machines?openMachine=${location.state.backToMachineId}`);
              } else {
                onBack();
              }
            }}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
            title="Powrót"
          >
            <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">Powrót</span>
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md">
            {isArchive ? 'Szczegóły Serwisu (Archiwum)' : 'Szczegóły Serwisu'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          <TileLayoutButton
            isEditing={tileLayout.isEditing}
            setIsEditing={tileLayout.setIsEditing}
            resetLayout={tileLayout.resetLayout}
            compact
          />
          <button
            onClick={() =>
              import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, targetMachine))
            }
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
            title="Raport PDF"
          >
            <i className="ph ph-file-pdf text-xl md:text-base"></i>
            <span className="hidden md:inline">Raport PDF</span>
          </button>
        </div>
      </div>

      {/* SIATKA KAFELKÓW (Opcja 2+) */}
      <div className="px-2 sm:px-4 md:px-6 pb-8">
        <CustomizableTileGrid tiles={tiles} layoutState={tileLayout} />
      </div>

      {/* Modals */}
      <TicketPartUsageModal
        isOpen={isPartUsageModalOpen}
        onClose={() => setIsPartUsageModalOpen(false)}
        ticketId={srv.id}
        onPartUsed={(msgOrTx, maybeTx) => {
          const tx = typeof msgOrTx === 'object' && msgOrTx !== null ? msgOrTx : maybeTx || {};
          const txUnit = tx.unit || parts.find(p => p.id === tx.partId)?.unit || 'szt.';
          const noteText =
            typeof msgOrTx === 'string' && msgOrTx.startsWith('Pobrano')
              ? msgOrTx
              : tx.partName
              ? `Pobrano z magazynu: ${tx.partName} (${tx.quantity || 1} ${txUnit})`
              : 'Pobrano część z magazynu';
          if (tx.partId) {
            setPartTransactions(prev => [...prev, tx]);
          }
          setIsPartUsageModalOpen(false);
          onAddFutureNote(srv.id, noteText, [], () => {});
        }}
      />
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal}
        newRbgValue={newRbgValue}
        setNewRbgValue={setNewRbgValue}
        onSubmit={async e => {
          e.preventDefault();
          if (rbgUpdateModal) {
            try {
              await updateRbgAction(rbgUpdateModal.id, newRbgValue);
              setRbgUpdateModal(null);
              setNewRbgValue('');
            } catch (err) {
              alert('Błąd aktualizacji RBG');
            }
          }
        }}
        onClose={() => setRbgUpdateModal(null)}
      />

      <PlannedMaintenanceCompletionModal
        isOpen={!!serviceToComplete}
        onClose={() => setServiceToComplete(null)}
        serviceToComplete={serviceToComplete}
        user={user}
      />

      <PlannedMaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingService={editingService}
        machines={machines}
        user={user}
      />

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Powiększenie"
            className="max-w-full max-h-full object-contain cursor-zoom-out"
          />
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

PlannedMaintenanceDetails.propTypes = {
  srv: PropTypes.object.isRequired,
  machine: PropTypes.object,
  isArchive: PropTypes.bool,
  allowTicketDeletion: PropTypes.bool,
  canEditPlanned: PropTypes.bool,
  canDeletePlanned: PropTypes.bool,
  getMachineRegionName: PropTypes.func,
  machines: PropTypes.array,
  regions: PropTypes.array,
  onBack: PropTypes.func,
  onComplete: PropTypes.func,
  onAddFutureNote: PropTypes.func,
  onEdit: PropTypes.func,
  onAddPart: PropTypes.func,
  rbgUpdateModal: PropTypes.object,
  setRbgUpdateModal: PropTypes.func,
  newRbgValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setNewRbgValue: PropTypes.func,
  serviceToComplete: PropTypes.object,
  setServiceToComplete: PropTypes.func,
  isModalOpen: PropTypes.bool,
  setIsModalOpen: PropTypes.func,
  editingService: PropTypes.object,
};
