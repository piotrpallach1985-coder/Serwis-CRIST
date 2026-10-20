import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { USER_ROLES, TICKET_STATUS } from '../../../utils/constants';
import DictationButton from '../../shared/DictationButton';
import SignaturePad from '../../shared/SignaturePad';
import { useManagerStore } from '../../../store/managerStore';
import { formatFGasSummary, formatGpsCheckIn } from '../../../utils/fieldServiceHelpers';

export default function TicketMainColumnStepper({
  currentTicket,
  user,
  loading,
  isArchive,
  selectedService,
  setSelectedService,
  services,
  etr,
  comment,
  setComment,
  handleUpdate,
  handleArchiveTicket,
  handleDeleteTicket,
  allowTicketDeletion,
  uploadedPhotos,
  setUploadedPhotos,
  uploadError,
  branding,
  setIsPartModalOpen,
  isUploading,
  uploadProgress,
}) {
  const { t } = useTranslation();
  const machines = useManagerStore(state => state.machines || []);

  // Pozwala na swobodne przeglądanie kroków (aktywne są jednak wyłącznie przyciski z aktywnego etapu)
  const [selectedStepOverride, setSelectedStepOverride] = useState(null);

  // Field Service / HVAC F-Gaz / GPS Check-in / Podpis cyfrowy klienta (Krok 4)
  const [completedGps, setCompletedGps] = useState(currentTicket?.completedGps || null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showFGasSection, setShowFGasSection] = useState(false);
  const [leakTestResult, setLeakTestResult] = useState('');
  const [refrigerantAddedKg, setRefrigerantAddedKg] = useState('');
  const [refrigerantRecoveredKg, setRefrigerantRecoveredKg] = useState('');
  const [clientSignature, setClientSignature] = useState(currentTicket?.clientSignature || '');
  const [clientSignerName, setClientSignerName] = useState(currentTicket?.clientSignerName || '');

  const currentMachine = currentTicket?.machineId
    ? machines.find(m => m.id === currentTicket.machineId)
    : null;

  useEffect(() => {
    if (currentMachine?.refrigerantType) {
      setShowFGasSection(true);
    } else {
      setShowFGasSection(false);
    }
    if (currentMachine?.contactPerson && !clientSignerName) {
      setClientSignerName(currentMachine.contactPerson);
    }
  }, [currentMachine?.id, currentMachine?.refrigerantType]);

  let naturalStepNum = parseInt(currentTicket.status, 10);
  if (isNaN(naturalStepNum) || naturalStepNum < 1 || naturalStepNum > 5) {
    if (currentTicket.status === 'closed') naturalStepNum = TICKET_STATUS.CLOSED;
    else naturalStepNum = 1;
  }

  const isClosed = naturalStepNum === TICKET_STATUS.CLOSED || currentTicket.status === 'closed';
  const currentStepNum = selectedStepOverride !== null ? selectedStepOverride : naturalStepNum;

  useEffect(() => {
    setSelectedStepOverride(null);
  }, [currentTicket.id, currentTicket.status]);

  useEffect(() => {
    if (currentTicket.assignedTo) {
      setSelectedService(currentTicket.assignedTo);
    }
  }, [currentTicket.assignedTo, setSelectedService]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolokalizacja GPS nie jest wspierana przez tę przeglądarkę.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCompletedGps({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0),
          timestamp: new Date().toISOString(),
        });
        setGpsLoading(false);
      },
      err => {
        setGpsError(err?.message || 'Nie udało się pobrać lokalizacji GPS.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stepsList = [
    { id: 1, label: t('tickets.details.step_1') },
    { id: 2, label: t('tickets.details.step_2') },
    { id: 3, label: t('tickets.details.step_3') },
    { id: 4, label: t('tickets.details.step_4') },
    { id: 5, label: t('tickets.details.step_5') },
  ];

  const statusLabel = isClosed
    ? t('tickets.status.closed', 'Zakończona')
    : naturalStepNum === 4
    ? t('tickets.status.in_progress', 'Naprawa w trakcie')
    : naturalStepNum === 3
    ? t('tickets.status.assigned', 'Przekazana do wykonawcy')
    : naturalStepNum === 2
    ? t('tickets.status.contractor_selection', 'Wybór wykonawcy')
    : t('tickets.status.pending', 'Oczekująca');

  const renderNotesAndPartsSection = (isStepActive = true) => (
    <div
      className={`pt-3 border-t border-slate-200/80 space-y-3 ${
        !isStepActive ? 'opacity-60' : ''
      }`}
    >
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
        <span>{t('tickets.details.addNoteOrPhotoLabel', 'Dodaj notatkę lub zdjęcie z prac:')}</span>
        <span className="text-gray-400 font-normal lowercase">AI voice to text</span>
      </label>

      <div className="relative">
        <textarea
          value={comment}
          onChange={e => {
            setComment(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="w-full p-3.5 pr-12 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none text-sm bg-white shadow-sm transition-all min-h-[75px] disabled:bg-slate-100"
          rows="2"
          placeholder={t(
            'tickets.details.notePlaceholder',
            'Wpisz treść notatki lub użyj mikrofonu...'
          )}
          disabled={!isStepActive || loading || isUploading}
        />
        {isStepActive && (
          <div className="absolute right-3 bottom-3">
            <DictationButton
              onResult={text => setComment(prev => (prev ? prev + ' ' + text : text))}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <label
          className={`flex-1 bg-white text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center ${
            isStepActive ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50 pointer-events-none'
          }`}
        >
          <i className="ph ph-image text-lg text-slate-500"></i>{' '}
          {t('tickets.details.addPhotoBtn', 'Dodaj zdjęcie')}
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={!isStepActive}
            className="hidden"
            onChange={e => setUploadedPhotos(prev => [...(prev || []), ...e.target.files])}
          />
        </label>

        <label
          className={`flex-1 bg-white text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center ${
            isStepActive ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50 pointer-events-none'
          }`}
        >
          <i className="ph ph-camera text-lg text-slate-500"></i>{' '}
          {t('tickets.details.cameraBtn', 'Aparat')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={!isStepActive}
            className="hidden"
            onChange={e => setUploadedPhotos(prev => [...(prev || []), ...e.target.files])}
          />
        </label>
      </div>

      {uploadedPhotos?.length > 0 && (
        <div className="text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex justify-between items-center">
          <span>
            {t('tickets.details.selectedFiles', 'Wybrano plików')}: {uploadedPhotos.length}
          </span>
          <button
            type="button"
            disabled={!isStepActive}
            onClick={() => setUploadedPhotos([])}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <i className="ph ph-x"></i> {t('common.delete', 'Usuń')}
          </button>
        </div>
      )}
      {uploadError && <p className="text-red-500 text-xs text-center">{uploadError}</p>}

      <button
        type="button"
        disabled={
          !isStepActive ||
          loading ||
          isUploading ||
          (!comment.trim() && (!uploadedPhotos || uploadedPhotos.length === 0))
        }
        onClick={() => {
          handleUpdate(
            currentTicket.id,
            null,
            user?.role === 'manager' ||
              user?.role === 'superadmin' ||
              user?.role === 'company_admin'
              ? t('tickets.details.manager_comment')
              : t('tickets.details.note_added'),
            currentTicket.etr,
            uploadedPhotos,
            comment
          );
          setUploadedPhotos([]);
          setComment('');
        }}
        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {uploadProgress ? (
          <>
            <i className="ph ph-spinner animate-spin text-xl"></i> {uploadProgress}
          </>
        ) : (
          <>
            <i className="ph ph-paper-plane-tilt text-xl"></i>{' '}
            {t('tickets.details.saveNotePhotoBtn', 'Zapisz notatkę/zdjęcie')}
          </>
        )}
      </button>

      {branding?.modules?.inventory !== false && (
        <button
          type="button"
          disabled={!isStepActive || loading || isArchive}
          onClick={() => setIsPartModalOpen(true)}
          className="w-full bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed text-orange-700 border border-orange-200 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="ph ph-package text-lg"></i>{' '}
          {t('tickets.details.takeExtraPartBtn', 'Pobierz dodatkową część z magazynu')}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2">
      {/* NAGŁÓWEK PANELU */}
      <div className="bg-[#111827] text-white p-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="ph ph-faders text-xl text-blue-400"></i>
          <h3 className="font-bold text-sm tracking-widest uppercase">
            {t('tickets.details.stepperHeader', 'DZIAŁ TECHNICZNY - KROKI REALIZACJI')}
          </h3>
        </div>
        <div className="text-xs text-slate-300 font-mono">
          {t('common.status', 'Status')}:{' '}
          <span className="font-bold uppercase text-white">{statusLabel}</span>
        </div>
      </div>

      <div className="p-2 sm:p-4 md:p-6 space-y-6 bg-gray-50/50">
        <div className="space-y-4">
          {stepsList.map(step => {
            const isActualStatus = step.id === naturalStepNum;
            const isSelected = step.id === currentStepNum;
            const isPast = step.id < naturalStepNum;

            return (
              <div key={step.id} className="relative flex items-start group">
                {/* Liniowa łączówka pionowa */}
                {step.id !== 5 && (
                  <div
                    className={`absolute left-[7px] md:left-[12px] top-6 md:top-9 bottom-[-16px] w-0.5 z-0 ${
                      isPast ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  ></div>
                )}

                {/* Kółko z numerem kroku */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStepOverride(step.id === currentStepNum ? null : step.id)
                  }
                  className={`relative z-10 flex-shrink-0 w-4 h-4 md:w-[26px] md:h-[26px] rounded-full flex items-center justify-center border md:border-2 font-bold text-[9px] md:text-xs leading-none mt-2.5 md:mt-3 mr-1.5 md:mr-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] border-[#111827] text-white shadow-sm'
                      : isPast
                      ? 'bg-white border-green-500 text-green-600 hover:bg-green-50'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                  title={t('tickets.details.expandStepHint', 'Kliknij, aby rozwinąć ten krok')}
                >
                  {isPast ? (
                    <i className="ph ph-check font-bold text-[10px] md:text-sm"></i>
                  ) : (
                    step.id
                  )}
                </button>

                {/* Karta kroku */}
                <div
                  className={`flex-1 min-w-0 rounded-xl transition-all duration-300 border relative z-0 ${
                    isSelected
                      ? 'bg-[#f4f1eb] p-3 sm:p-4 shadow-sm border-[#e8e4db]'
                      : 'bg-white py-2.5 px-3 sm:p-3.5 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() =>
                      setSelectedStepOverride(step.id === currentStepNum ? null : step.id)
                    }
                  >
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                      <h4
                        className={`text-sm md:text-base transition-colors ${
                          isSelected
                            ? 'font-extrabold text-gray-900'
                            : isPast
                            ? 'font-bold text-gray-600'
                            : 'font-medium text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      {isActualStatus && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                          {t('tickets.details.activeStageBadge', 'Aktywny etap')}
                        </span>
                      )}
                    </div>
                    <i
                      className={`ph ${
                        isSelected ? 'ph-caret-up' : 'ph-caret-down'
                      } text-gray-400`}
                    ></i>
                  </div>

                  {/* Treść rozwiniętego kroku */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-4 animate-fade-in min-w-0">
                      {!isActualStatus && !isClosed && (
                        <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                          <i className="ph ph-info text-sm shrink-0"></i>
                          <span>
                            {t(
                              'tickets.details.previewStageNotice',
                              'Podgląd innego etapu — akcje są aktywne tylko dla aktualnego etapu.'
                            )}
                          </span>
                        </div>
                      )}

                      {/* ==================== KROK 1: PRZYJĘCIE ZGŁOSZENIA ==================== */}
                      {step.id === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600">
                            {t(
                              'tickets.details.step1Desc',
                              'Zgłoszenie awarii oczekuje na przyjęcie do realizacji i przydzielenie zespołu technicznego.'
                            )}
                          </p>
                          {!isClosed && !isArchive && (
                            <button
                              type="button"
                              disabled={!isActualStatus || loading}
                              onClick={() => {
                                handleUpdate(
                                  currentTicket.id,
                                  2,
                                  t('tickets.details.started_search'),
                                  etr
                                );
                                setSelectedStepOverride(2);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <i className="ph ph-play-circle text-xl"></i>{' '}
                              {t('tickets.details.startRepairBtn', 'Rozpocznij naprawę')}
                            </button>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 2: WYBÓR WYKONAWCY (bez notatki i zdjęć - jak w serwisie) ==================== */}
                      {step.id === 2 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {t(
                                'tickets.details.selectContractorLabel',
                                'Wybierz wykonawcę (serwis wewnętrzny lub podwykonawca):'
                              )}
                            </label>
                            <select
                              value={selectedService || ''}
                              onChange={e => setSelectedService(e.target.value)}
                              disabled={!isActualStatus || loading || isClosed || isArchive}
                              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm disabled:opacity-50 disabled:bg-slate-100"
                            >
                              <option value="">
                                {t(
                                  'tickets.details.selectContractorPlaceholder',
                                  'Wybierz wykonawcę z listy...'
                                )}
                              </option>
                              {services?.map(s => (
                                <option key={s.id} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                disabled={!isActualStatus || loading || !selectedService}
                                onClick={() => {
                                  handleUpdate(
                                    currentTicket.id,
                                    3,
                                    t('tickets.details.passed_to') + selectedService,
                                    etr
                                  );
                                  setSelectedStepOverride(3);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-check-circle text-xl"></i>{' '}
                                {t(
                                  'tickets.details.confirmContractorBtn',
                                  'Zatwierdź Wykonawcę i Przejdź Dalej'
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={!isActualStatus || loading}
                                onClick={() => {
                                  handleUpdate(
                                    currentTicket.id,
                                    1,
                                    'Cofnięto do przyjęcia zgłoszenia',
                                    etr
                                  );
                                  setSelectedStepOverride(1);
                                }}
                                className="bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-arrow-left text-lg"></i>{' '}
                                {t('common.back', 'Cofnij')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 3: ROZPOCZĘCIE NAPRAWY ==================== */}
                      {step.id === 3 && (
                        <div className="space-y-4">
                          {(currentTicket.assignedTo || selectedService) && (
                            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                              <i className="ph ph-user-gear text-lg text-blue-600"></i>
                              <span>
                                {t('tickets.details.assignedContractor', 'Wyznaczony wykonawca')}:{' '}
                                <strong className="font-bold">
                                  {currentTicket.assignedTo || selectedService}
                                </strong>
                              </span>
                            </div>
                          )}

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                disabled={!isActualStatus || loading}
                                onClick={() => {
                                  handleUpdate(
                                    currentTicket.id,
                                    4,
                                    t('tickets.details.started_repair_action'),
                                    etr
                                  );
                                  setSelectedStepOverride(4);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-play-circle text-xl"></i>{' '}
                                {t('tickets.details.startRepairBtn', 'Rozpocznij naprawę')}
                              </button>
                              <button
                                type="button"
                                disabled={!isActualStatus || loading}
                                onClick={() => {
                                  handleUpdate(
                                    currentTicket.id,
                                    2,
                                    t('tickets.details.reverted_contractor'),
                                    etr
                                  );
                                  setSelectedStepOverride(2);
                                }}
                                className="bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-arrow-counter-clockwise text-lg"></i>{' '}
                                {t('tickets.details.change_contractor')}
                              </button>
                            </div>
                          )}

                          {!isClosed && !isArchive && renderNotesAndPartsSection(isActualStatus)}
                        </div>
                      )}

                      {/* ==================== KROK 4: NAPRAWA W TRAKCIE ==================== */}
                      {step.id === 4 && (
                        <div className="space-y-4">
                          {(currentTicket.assignedTo || selectedService) && (
                            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                              <i className="ph ph-user-gear text-lg text-blue-600"></i>
                              <span>
                                {t('tickets.details.assignedContractor', 'Wyznaczony wykonawca')}:{' '}
                                <strong className="font-bold">
                                  {currentTicket.assignedTo || selectedService}
                                </strong>
                              </span>
                            </div>
                          )}

                          {!isClosed && !isArchive && renderNotesAndPartsSection(isActualStatus)}

                          {/* Sekcja Field Service: Potwierdzenie GPS, F-Gazy (HVAC) i Podpis cyfrowy odbierającego */}
                          {!isClosed && !isArchive && (
                            <div
                              className={`pt-3 border-t border-slate-200 space-y-3 ${
                                !isActualStatus ? 'opacity-60 pointer-events-none' : ''
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-2.5">
                                <div className="text-xs">
                                  <span className="font-bold text-slate-700 flex items-center gap-1">
                                    <i className="ph ph-map-pin-line text-emerald-600 text-base"></i>
                                    Potwierdzenie obecności GPS
                                  </span>
                                  {completedGps ? (
                                    <span className="text-emerald-700 font-semibold block mt-0.5">
                                      Zapisano GPS: {formatGpsCheckIn(completedGps)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] block">
                                      Opcjonalny znacznik lokalizacji do protokołu PDF
                                    </span>
                                  )}
                                  {gpsError && (
                                    <span className="text-red-600 text-[11px] block">
                                      {gpsError}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={!isActualStatus || gpsLoading}
                                  onClick={handleCaptureGps}
                                  data-testid="ticket-capture-gps-btn"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="ph ph-crosshair"></i>
                                  {gpsLoading
                                    ? 'Pobieranie...'
                                    : completedGps
                                    ? 'Odśwież GPS'
                                    : 'Pobierz GPS'}
                                </button>
                              </div>

                              {/* Protokół F-Gaz / Szczelność */}
                              <div className="border border-cyan-200 rounded-xl bg-cyan-50/40 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setShowFGasSection(prev => !prev)}
                                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-cyan-900 hover:bg-cyan-50 cursor-pointer"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <i className="ph ph-snowflake text-cyan-600 text-base"></i>
                                    Protokół F-Gaz / Próba szczelności (HVAC / CRO)
                                  </span>
                                  <i
                                    className={`ph ${
                                      showFGasSection ? 'ph-caret-up' : 'ph-caret-down'
                                    }`}
                                  ></i>
                                </button>
                                {showFGasSection && (
                                  <div className="p-3 bg-white border-t border-cyan-100 space-y-2.5 text-xs">
                                    <div>
                                      <label className="block font-bold text-slate-700 mb-1">
                                        Wynik próby szczelności układu
                                      </label>
                                      <select
                                        value={leakTestResult}
                                        onChange={e => setLeakTestResult(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                                      >
                                        <option value="">
                                          -- Nie wykonywano / Nie dotyczy --
                                        </option>
                                        <option value="positive">
                                          POZYTYWNY (Układ szczelny)
                                        </option>
                                        <option value="negative">
                                          NEGATYWNY (Stwierdzono wyciek)
                                        </option>
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                          Uzupełniono czynnik (kg)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={refrigerantAddedKg}
                                          onChange={e => setRefrigerantAddedKg(e.target.value)}
                                          placeholder="np. 0.35"
                                          className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                          Odzyskano czynnik (kg)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={refrigerantRecoveredKg}
                                          onChange={e => setRefrigerantRecoveredKg(e.target.value)}
                                          placeholder="np. 0.00"
                                          className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <SignaturePad
                                value={clientSignature}
                                signerName={clientSignerName}
                                onSignerNameChange={setClientSignerName}
                                disabled={!isActualStatus}
                                onChange={({ signatureDataUrl, signerName }) => {
                                  setClientSignature(signatureDataUrl);
                                  if (signerName !== undefined) setClientSignerName(signerName);
                                }}
                              />
                            </div>
                          )}

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                              <button
                                type="button"
                                disabled={!isActualStatus || loading}
                                onClick={() => {
                                  const fGasProtocol =
                                    leakTestResult ||
                                    Number(refrigerantAddedKg) > 0 ||
                                    Number(refrigerantRecoveredKg) > 0 ||
                                    currentMachine?.refrigerantType
                                      ? {
                                          refrigerantType: currentMachine?.refrigerantType || '',
                                          refrigerantChargeKg:
                                            currentMachine?.refrigerantChargeKg || null,
                                          leakTestResult: leakTestResult || null,
                                          refrigerantAddedKg:
                                            refrigerantAddedKg !== '' &&
                                            Number(refrigerantAddedKg) > 0
                                              ? Number(refrigerantAddedKg)
                                              : 0,
                                          refrigerantRecoveredKg:
                                            refrigerantRecoveredKg !== '' &&
                                            Number(refrigerantRecoveredKg) > 0
                                              ? Number(refrigerantRecoveredKg)
                                              : 0,
                                        }
                                      : null;

                                  const extraNotes = [
                                    comment,
                                    fGasProtocol ? formatFGasSummary(fGasProtocol) : '',
                                    completedGps
                                      ? `Check-in GPS: ${formatGpsCheckIn(completedGps)}`
                                      : '',
                                    clientSignature && clientSignerName
                                      ? `Odebrał i podpisał: ${clientSignerName}`
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join('\n');

                                  handleUpdate(
                                    currentTicket.id,
                                    5,
                                    t('tickets.details.finished_repair_action'),
                                    etr,
                                    [],
                                    extraNotes,
                                    {
                                      completedGps: completedGps || null,
                                      fGasProtocol,
                                      clientSignature: clientSignature || null,
                                      clientSignerName: clientSignerName || null,
                                    }
                                  );
                                  setSelectedStepOverride(5);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-check-circle text-xl"></i>{' '}
                                {t('tickets.details.finishRepairBtn', 'Zakończ Naprawę')}
                              </button>
                              <button
                                type="button"
                                disabled={!isActualStatus || loading}
                                onClick={() => {
                                  handleUpdate(
                                    currentTicket.id,
                                    2,
                                    t('tickets.details.reverted_contractor'),
                                    etr
                                  );
                                  setSelectedStepOverride(2);
                                }}
                                className="bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-arrow-counter-clockwise text-lg"></i>{' '}
                                {t('tickets.details.change_contractor')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 5: ZAKOŃCZENIE NAPRAWY ==================== */}
                      {step.id === TICKET_STATUS.CLOSED && (
                        <div className="space-y-3">
                          {isClosed ? (
                            <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <i className="ph ph-check-circle text-2xl text-emerald-600 shrink-0"></i>
                                <div>
                                  <p className="font-bold text-emerald-950">
                                    {t(
                                      'tickets.details.completedBanner',
                                      'Naprawa została pomyślnie zrealizowana i przeniesiona do historii.'
                                    )}
                                  </p>
                                  {(currentTicket.completedBy || currentTicket.assignedTo) && (
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                      {t('tickets.details.completedByLabel', 'Zrealizował')}:{' '}
                                      <strong className="font-bold">
                                        {currentTicket.completedBy || currentTicket.assignedTo}
                                      </strong>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {currentTicket.clientSignature && (
                                <div className="bg-white border border-emerald-200 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-700">
                                      Podpis potwierdzający odbiór prac
                                    </span>
                                    {currentTicket.clientSignerName && (
                                      <span className="block text-slate-600">
                                        Podpisał(a): <strong>{currentTicket.clientSignerName}</strong>
                                      </span>
                                    )}
                                  </div>
                                  <img
                                    src={currentTicket.clientSignature}
                                    alt="Podpis odbierającego"
                                    className="h-12 border border-slate-200 rounded px-2 py-0.5 bg-white object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600">
                              {t(
                                'tickets.details.step5PendingDesc',
                                'Naprawa jest w trakcie realizacji. Możesz zamknąć zgłoszenie przyciskiem na dole lub zakończyć je w Kroku 4.'
                              )}
                            </p>
                          )}

                          {isClosed && !isArchive && (
                            <button
                              type="button"
                              disabled={!isActualStatus || loading}
                              onClick={() => {
                                handleUpdate(
                                  currentTicket.id,
                                  4,
                                  t('tickets.details.resumed_work'),
                                  etr
                                );
                                setSelectedStepOverride(4);
                              }}
                              className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <i className="ph ph-arrow-counter-clockwise text-lg"></i>
                              {t('tickets.details.reopen_ticket')}
                            </button>
                          )}

                          {(user?.role === USER_ROLES.ADMIN ||
                            user?.role === USER_ROLES.SUPERADMIN) && (
                            <div className="space-y-3 pt-2">
                              {!isArchive && !isClosed && (
                                <button
                                  type="button"
                                  disabled={!isActualStatus || loading}
                                  onClick={() => handleArchiveTicket(currentTicket.id)}
                                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <i className="ph ph-archive text-lg"></i>
                                  {t('tickets.details.move_to_archive')}
                                </button>
                              )}
                              {allowTicketDeletion && (
                                <button
                                  type="button"
                                  disabled={!isActualStatus || loading}
                                  onClick={() => handleDeleteTicket(currentTicket.id)}
                                  className="w-full bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <i className="ph ph-trash text-lg"></i>
                                  {t('tickets.details.delete_permanently')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== PRZYCISK ZAMKNIJ AWARIĘ (POMIŃ KROKI / BŁĘDNA AWARIA) NA SAMYM DOLE — ZAWSZE AKTYWNY ==================== */}
        {!isClosed && !isArchive && (
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={loading || isArchive}
              onClick={() => {
                handleUpdate(
                  currentTicket.id,
                  TICKET_STATUS.CLOSED,
                  t('tickets.details.closed_false_alarm_action'),
                  null
                );
                setSelectedStepOverride(TICKET_STATUS.CLOSED);
              }}
              className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 px-4 py-3 rounded-xl text-xs md:text-sm font-bold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ph ph-x-circle text-lg"></i>
              {t(
                'tickets.details.closeFalseAlarmBtn',
                'Zamknij awarię (fałszywy alarm / błędne zgłoszenie)'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
