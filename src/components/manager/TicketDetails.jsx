import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import TicketLightbox from './tickets/TicketLightbox';
import TicketHistory from './tickets/TicketHistory';
import TicketMainColumnHeader from './tickets/TicketMainColumnHeader';
import TicketMainColumnContent from './tickets/TicketMainColumnContent';
import TicketMainColumnStepper from './tickets/TicketMainColumnStepper';
import TicketPartUsageModal from './tickets/TicketPartUsageModal';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';
import MachineDTR from './MachineDTR';
import { USER_ROLES } from '../../utils/constants';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useTileLayout } from '../../hooks/useTileLayout';
import CustomizableTileGrid, { TileLayoutButton } from '../shared/CustomizableTileGrid';

export default function TicketDetails({
  currentTicket,
  setSelectedTicketId,
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { machines, regions, services, branding, parts = [] } = useManagerStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [lightboxImg, setLightboxImg] = useState(null);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partTransactions, setPartTransactions] = useState([]);

  useEffect(() => {
    import('../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
      fetchTransactionsForReference(getCurrentTenant(), currentTicket.id).then(setPartTransactions);
    });
  }, [currentTicket.id]);

  const actualPartsUsed = useMemo(() => {
    return partTransactions.filter(tx => tx.referenceId === currentTicket.id && tx.type === 'issue_adhoc');
  }, [partTransactions, currentTicket.id]);

  const handleUploadAndUpdate = async (ticketId, newStatus, actionText, newEtr, files, noteText, extraData = null) => {
    let finalUrls = [];
    if (files && files.length > 0 && files[0] instanceof File) {
      setIsUploading(true);
      setUploadError(null);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`${t('tickets.details.uploading_photo', 'Wysyłanie zdjęcia')} (${i + 1}/${files.length})...`);

          let fileToUpload = file;
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.warn('Kompresja nieudana', e);
          }

          const fileName = Date.now() + '_' + fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const tenantId = getCurrentTenant();
          const fileRef = ref(storage, `tenants/${tenantId}/tickets/${ticketId}/${fileName}`);
          await uploadBytes(fileRef, fileToUpload);
          const url = await getDownloadURL(fileRef);
          finalUrls.push(url);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError(t('tickets.details.upload_error', 'Błąd wgrywania zdjęć: ') + err.message);
        setIsUploading(false);
        setUploadProgress('');
        return;
      }
    } else if (files && files.length > 0) {
      finalUrls = files;
    }

    setIsUploading(false);
    setUploadProgress('');

    return handleUpdate(ticketId, newStatus, actionText, newEtr, finalUrls, noteText, extraData);
  };

  const machine = machines?.find(m => m.id === currentTicket.machineId);

  const tiles = useMemo(() => {
    const list = [
      {
        id: 'header',
        title: t('tickets.details.tile_header', 'Dane obiektu i zgłoszenia'),
        icon: 'ph-info',
        defaultColSpan: 8,
        render: () => (
          <TicketMainColumnHeader
            currentTicket={currentTicket}
            STATUSES={STATUSES}
            machines={machines}
            regions={regions}
          />
        ),
      },
      {
        id: 'history',
        title: t('tickets.details.tile_history', 'Historia zdarzeń'),
        icon: 'ph-clock-counter-clockwise',
        defaultColSpan: 4,
        render: () => (
          <TicketHistory
            history={currentTicket.history}
            setLightboxImg={setLightboxImg}
          />
        ),
      },
      {
        id: 'content',
        title: t('tickets.details.tile_content', 'Opis awarii, zdjęcia i części'),
        icon: 'ph-file-text',
        defaultColSpan: 8,
        render: () => (
          <TicketMainColumnContent
            currentTicket={currentTicket}
            actualPartsUsed={actualPartsUsed}
            parts={parts}
            setLightboxImg={setLightboxImg}
          />
        ),
      },
      {
        id: 'stepper',
        title: t('tickets.details.tile_stepper', 'Kroki realizacji awarii (1–5)'),
        icon: 'ph-list-numbers',
        defaultColSpan: 8,
        render: () => (
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
            handleUpdate={handleUploadAndUpdate}
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
        ),
      },
    ];

    if (machine) {
      list.push({
        id: 'dtr',
        title: t('tickets.details.tile_dtr', 'Dokumentacja DTR i notatki techniczne'),
        icon: 'ph-files',
        defaultColSpan: 12,
        render: () => (
          <MachineDTR
            machine={machine}
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
    currentTicket,
    STATUSES,
    machines,
    regions,
    actualPartsUsed,
    parts,
    user,
    loading,
    isArchive,
    selectedService,
    services,
    etr,
    comment,
    allowTicketDeletion,
    uploadedPhotos,
    uploadError,
    branding,
    isUploading,
    uploadProgress,
    machine,
    t,
  ]);

  // Wspólny klucz 'ticket_details' dla aktywnych awarii oraz archiwum awarii
  const tileLayout = useTileLayout('ticket_details', tiles);

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#111827]">
      {/* ZUNIFIKOWANY GÓRNY PASEK NAWIGACYJNY */}
      <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col sticky top-0 z-20 shadow-sm gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
          {/* Tytuł - zawsze na górze na mobile */}
          <div className="md:hidden w-full">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              {isArchive ? t('tickets.details.title_archive', 'Szczegóły Awarii (Archiwum)') : t('tickets.details.title', 'Szczegóły Awarii')}
            </h2>
          </div>

          {/* Dolny wiersz mobile (przyciski) / Lewa strona desktop */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
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
                title={t('common.back', 'Powrót')}
              >
                <i className="ph ph-arrow-left text-lg"></i> <span className="inline">{t('common.back', 'Powrót')}</span>
              </button>
            </div>

            {/* Tytuł na Desktop - schowany na mobile */}
            <h2 className="hidden md:block text-xl font-bold text-gray-800 shrink-0 truncate max-w-[200px] sm:max-w-md ml-2">
              {isArchive ? t('tickets.details.title_archive', 'Szczegóły Awarii (Archiwum)') : t('tickets.details.title', 'Szczegóły Awarii')}
            </h2>

            {/* Prawa strona (Mobile) */}
            <div className="flex items-center justify-end gap-2 md:hidden">
              <TileLayoutButton
                isEditing={tileLayout.isEditing}
                setIsEditing={tileLayout.setIsEditing}
                resetLayout={tileLayout.resetLayout}
                compact
              />
              <button
                onClick={() =>
                  import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))
                }
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
                title={t('tickets.details.pdf_report', 'Raport PDF')}
              >
                <i className="ph ph-file-pdf text-lg"></i> <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Prawa strona (Desktop) */}
          <div className="hidden md:flex items-center justify-end gap-2 w-auto">
            <TileLayoutButton
              isEditing={tileLayout.isEditing}
              setIsEditing={tileLayout.setIsEditing}
              resetLayout={tileLayout.resetLayout}
            />
            <button
              onClick={() =>
                import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))
              }
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
              title={t('tickets.details.pdf_report', 'Raport PDF')}
            >
              <i className="ph ph-file-pdf text-base"></i>
              <span>{t('tickets.details.pdf_report', 'Raport PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SIATKA KAFELKÓW (Opcja 2+) */}
      <div className="p-4 w-full px-2 sm:px-4 md:px-6 pb-10">
        <CustomizableTileGrid tiles={tiles} layoutState={tileLayout} />
      </div>

      <TicketPartUsageModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        user={user}
        ticketId={currentTicket.id}
        onPartUsed={msg => {
          handleUpdate(currentTicket.id, null, msg, currentTicket.etr, [], '');
        }}
      />

      <TicketLightbox lightboxImg={lightboxImg} setLightboxImg={setLightboxImg} />
    </div>
  );
}

TicketDetails.propTypes = {
  currentTicket: PropTypes.object.isRequired,
  setSelectedTicketId: PropTypes.func.isRequired,
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
  isArchive: PropTypes.bool,
};
