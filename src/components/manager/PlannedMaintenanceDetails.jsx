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
  rbgUpdateModal, setRbgUpdateModal,
  newRbgValue, setNewRbgValue,
  serviceToComplete, setServiceToComplete,
  isModalOpen, setIsModalOpen,
  editingService
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const deletePlannedServiceAction = useManagerStore(state => state.deletePlannedServiceAction);
  const updateRbgAction = useManagerStore(state => state.updateRbgAction);
  const setServiceInProgressAction = useManagerStore(state => state.setServiceInProgressAction);
  const parts = useManagerStore(state => state.parts || []);
  
  const [partTransactions, setPartTransactions] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    import('../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
      fetchTransactionsForReference(getCurrentTenant(), srv.id).then(setPartTransactions);
    });
  }, [srv.id]);
  
  const actualPartsUsed = useMemo(() => {
    return partTransactions.filter(tx => tx.referenceId === srv.id && (tx.type === 'issue_planned' || tx.type === 'issue_adhoc'));
  }, [partTransactions, srv.id]);

  const isCompleted = srv.status === 'completed';

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto animate-fade-in relative text-[#111827]">
      {/* HEADER NAV */}
      <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3 mb-6">
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
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md">Szczegóły Serwisu</h2>
        </div>

        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          <button 
            onClick={() => import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, machine))}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
            title="Raport PDF"
          >
            <i className="ph ph-file-pdf text-xl md:text-base"></i><span className="hidden md:inline">Raport PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-2 sm:px-4 md:px-6 pb-6">
        {/* LEWA KOLUMNA */}
        <div className="w-full lg:w-3/4 space-y-6">
          <PlannedMaintenanceInfo 
            srv={srv}
            machine={machine}
            parts={parts}
            actualPartsUsed={actualPartsUsed}
            getMachineRegionName={getMachineRegionName}
            regions={regions}
          />
          
          <PlannedMaintenanceTimeline
            srv={srv}
            isCompleted={isCompleted}
            user={user}
            setServiceInProgressAction={setServiceInProgressAction}
            onAddFutureNote={onAddFutureNote}
            setServiceToComplete={setServiceToComplete}
            onEdit={onEdit}
            onDelete={deletePlannedServiceAction}
            canEditPlanned={canEditPlanned}
            canDeletePlanned={canDeletePlanned}
            isArchive={isArchive}
            allowTicketDeletion={allowTicketDeletion}
            onBack={onBack}
          />
        </div>
        
        {/* PRAWA KOLUMNA – Historia */}
        <PlannedMaintenanceHistory srv={srv} setLightboxImg={setLightboxImg} />
      </div>

      {/* Modals */}
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal}
        newRbgValue={newRbgValue}
        setNewRbgValue={setNewRbgValue}
        onSubmit={async (e) => {
          e.preventDefault();
          if (rbgUpdateModal) {
            try { await updateRbgAction(rbgUpdateModal.id, newRbgValue); setRbgUpdateModal(null); setNewRbgValue(''); }
            catch(err) { alert('Błąd aktualizacji RBG'); }
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

      <MachineDTR 
        machine={machines.find(m => m.id === srv?.machineId)} 
        user={user} 
        canManage={user?.role === 'manager' || (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN)} 
        canDeleteNotes={(user?.role === 'admin' || user?.role === 'superadmin') || (user?.permissions || []).includes('delete_tech_notes')} 
      />

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Powiększenie" className="max-w-full max-h-full object-contain cursor-zoom-out" />
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2" onClick={() => setLightboxImg(null)}>&times;</button>
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
  editingService: PropTypes.object
};
