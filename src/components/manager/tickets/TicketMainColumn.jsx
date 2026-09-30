import { useAuth } from '../../../hooks/useAuth';
import PropTypes from 'prop-types';
import React, {  useState, useMemo , useEffect } from 'react';
import TicketPartUsageModal from './TicketPartUsageModal';
import { useManagerStore } from '../../../store/managerStore';
import { getCurrentTenant } from '../../../utils/tenantHelper';

import TicketMainColumnHeader from './TicketMainColumnHeader';
import TicketMainColumnContent from './TicketMainColumnContent';
import TicketMainColumnStepper from './TicketMainColumnStepper';

export default function TicketMainColumn({
  currentTicket,
  machineName,
  machineRegion,
  duration,
  STATUSES,
  loading,
  isArchive,
  selectedService,
  setSelectedService,
  etr,
  setEtr,
  comment,
  setComment,
  handleUpdate,
  handleDeleteTicket,
  handleArchiveTicket,
  allowTicketDeletion,
  setLightboxImg,
  showConfirm
}) {
  const { user } = useAuth();
  const { machines, regions, services, branding, parts = [] } = useManagerStore();
  
  const [partTransactions, setPartTransactions] = useState([]);
  
  useEffect(() => {
    import('../../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
      fetchTransactionsForReference(getCurrentTenant(), currentTicket.id).then(setPartTransactions);
    });
  }, [currentTicket.id]);

  const actualPartsUsed = React.useMemo(() => {
    return partTransactions.filter(tx => tx.referenceId === currentTicket.id && tx.type === 'issue_adhoc');
  }, [partTransactions, currentTicket.id]);
  
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);

  return (
    <>
      <div className="w-full lg:w-3/4 space-y-5">
        <TicketMainColumnHeader 
          currentTicket={currentTicket}
          STATUSES={STATUSES}
          machines={machines}
          regions={regions}
        />

        <TicketMainColumnContent 
          currentTicket={currentTicket}
          actualPartsUsed={actualPartsUsed}
          parts={parts}
          setLightboxImg={setLightboxImg}
        />

        <TicketMainColumnStepper 
          currentTicket={currentTicket}
          user={user}
          loading={loading}
          isArchive={isArchive}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          services={services}
          etr={etr}
          comment={comment}
          setComment={setComment}
          handleUpdate={handleUpdate}
          handleArchiveTicket={handleArchiveTicket}
          handleDeleteTicket={handleDeleteTicket}
          allowTicketDeletion={allowTicketDeletion}
          uploadedPhotos={uploadedPhotos}
          setUploadedPhotos={setUploadedPhotos}
          uploadError={uploadError}
          branding={branding}
          setIsPartModalOpen={setIsPartModalOpen}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </div>

      <TicketPartUsageModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        user={user}
        ticketId={currentTicket.id}
        onPartUsed={(msg) => {
          handleUpdate(currentTicket.id, null, msg, currentTicket.etr, [], '');
        }}
      />
    </>
  );
}

TicketMainColumn.propTypes = {
  currentTicket: PropTypes.object.isRequired,
  machineName: PropTypes.string,
  machineRegion: PropTypes.string,
  duration: PropTypes.string,
  STATUSES: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  isArchive: PropTypes.bool,
  selectedService: PropTypes.string,
  setSelectedService: PropTypes.func,
  etr: PropTypes.string,
  setEtr: PropTypes.func,
  comment: PropTypes.string,
  setComment: PropTypes.func,
  handleUpdate: PropTypes.func.isRequired,
  handleDeleteTicket: PropTypes.func,
  handleArchiveTicket: PropTypes.func,
  allowTicketDeletion: PropTypes.bool,
  setLightboxImg: PropTypes.func,
  showConfirm: PropTypes.func
};
