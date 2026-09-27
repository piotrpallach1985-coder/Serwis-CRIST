import PropTypes from 'prop-types';
import TicketMainColumn from './tickets/TicketMainColumn';
import TicketLightbox from './tickets/TicketLightbox';
import TicketHistory from './tickets/TicketHistory';
import { useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import DictationButton from '../shared/DictationButton';
import { safe } from '../../utils/safeRender';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';
import Toast from './Toast';
import MachineDTR from './MachineDTR';
import { USER_ROLES, TICKET_STATUS } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';

export default function TicketDetails({
  currentTicket,
  setSelectedTicketId,
  user,
  
  handleUpdate,
  handleDeleteTicket,
  handleArchiveTicket,
  comment,
  setComment,
  selectedService,
  setSelectedService,
  etr,
  setEtr,
  loading,
  allowTicketDeletion,
  showToast,
  showConfirm,
  STATUSES,
  isArchive
}) {
  const { machines, regions, services } = useManagerStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [lightboxImg, setLightboxImg] = React.useState(null);
  const [uploadedPhotos, setUploadedPhotos] = React.useState([]);
  const [uploadProgress, setUploadProgress] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  
  // Czas pracy
  const machine = machines?.find(m => m.id === currentTicket.machineId);
  const machineName = machine?.name || currentTicket.machineName || 'Maszyna usunięta';
  const machineRegion = machine ? machine.regionId : null;

  const duration = currentTicket.closedAt && currentTicket.startedAt ? 
    ((new Date(currentTicket.closedAt) - new Date(currentTicket.startedAt))/1000/3600).toFixed(1) : 
    (parseInt(currentTicket.status, 10) === 5 || currentTicket.status === 'closed' ? '0.0' : '-');

    return (
      <div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#111827]">
        

                {/* ZUNIFIKOWANY GÓRNY PASEK NAWIGACYJNY */}
        <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col sticky top-0 z-20 shadow-sm gap-3">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
            
            {/* Tytuł - zawsze na górze na mobile */}
            <div className="md:hidden w-full">
              <h2 className="text-xl font-bold text-gray-800 truncate">Szczegóły Awarii</h2>
            </div>

            {/* Dolny wiersz mobile (przyciski) / Lewa strona desktop */}
            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
              
              <div className="flex items-center gap-2">
                <button onClick={() => {
                    if (location.state?.backToMachineId) {
                      navigate(`/manager/master_data/machines?openMachine=${location.state.backToMachineId}`);
                    } else if (location.state?.fromNotification) {
                       setSelectedTicketId(null);
                       navigate('?module=tickets&tab=tickets_active', { replace: true });
                    } else {
                       setSelectedTicketId(null);
                    }
                  }} 
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
                  title="Powrót"
                >
                  <i className="ph ph-arrow-left text-lg"></i> <span className="inline">Powrót</span>
                </button>
              </div>

              {/* Tytuł na Desktop - schowany na mobile */}
              <h2 className="hidden md:block text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md ml-2">Szczegóły Awarii</h2>

              {/* Prawa strona (Mobile) - Przycisk PDF wyrównany do prawej w drugim rzędzie */}
              <div className="flex items-center justify-end gap-2 md:hidden">
                <button 
                  onClick={() => import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))} 
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" 
                  title="Raport PDF"
                >
                  <i className="ph ph-file-pdf text-lg"></i> <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Prawa strona (Desktop) */}
            <div className="hidden md:flex items-center justify-end gap-2 w-auto">
              <button 
                onClick={() => import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))} 
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0" 
                title="Raport PDF"
              >
                <i className="ph ph-file-pdf text-base"></i><span>Raport PDF</span>
              </button>
            </div>

          </div>
        </div>

        <div className="p-4 w-full px-2 sm:px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* LEWA KOLUMNA (Główna sekcja + Stepper) */}
            <TicketMainColumn
                currentTicket={currentTicket}
              machineName={machineName}
              machineRegion={machineRegion}
              duration={duration}
              STATUSES={STATUSES}
              user={user}
              loading={loading}
              isArchive={isArchive}
              services={services}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              etr={etr}
              setEtr={setEtr}
              comment={comment}
              setComment={setComment}
              handleUpdate={handleUpdate}
              handleDeleteTicket={handleDeleteTicket}
              handleArchiveTicket={handleArchiveTicket}
              allowTicketDeletion={allowTicketDeletion}
              setLightboxImg={setLightboxImg}
              showConfirm={showConfirm}
            />

            {/* PRAWA KOLUMNA (Historia Zdarzen) */}
            <div className="w-full lg:w-1/4">
              <TicketHistory history={currentTicket.history} setLightboxImg={setLightboxImg} />
            </div>
          </div>
        </div>

      {machines?.some(m => m.id === currentTicket.machineId) && (
        <div className="mt-8">
          <MachineDTR machine={machines?.find(m => m.id === currentTicket.machineId)} user={user} canManage={user?.role === 'manager' || (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN)} canDeleteNotes={(user?.role === 'admin' || user?.role === 'superadmin') || (user?.permissions || []).includes('delete_tech_notes')} />
        </div>
      )}

      <TicketLightbox lightboxImg={lightboxImg} setLightboxImg={setLightboxImg} />
      </div>
    );
}

TicketDetails.propTypes = {
  currentTicket: PropTypes.object.isRequired,
  setSelectedTicketId: PropTypes.func.isRequired,
  user: PropTypes.object,
  handleUpdate: PropTypes.func.isRequired,
  handleDeleteTicket: PropTypes.func.isRequired,
  handleArchiveTicket: PropTypes.func.isRequired,
  comment: PropTypes.string,
  setComment: PropTypes.func,
  selectedService: PropTypes.string,
  setSelectedService: PropTypes.func,
  etr: PropTypes.string,
  setEtr: PropTypes.func,
  loading: PropTypes.bool,
  allowTicketDeletion: PropTypes.bool,
  showToast: PropTypes.func,
  showConfirm: PropTypes.func,
  STATUSES: PropTypes.object.isRequired,
  isArchive: PropTypes.bool
};
