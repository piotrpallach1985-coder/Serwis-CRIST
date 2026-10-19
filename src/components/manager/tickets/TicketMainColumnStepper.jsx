import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { USER_ROLES, TICKET_STATUS } from '../../../utils/constants';
import DictationButton from '../../shared/DictationButton';

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
  uploadProgress
}) {
  const { t } = useTranslation();

  // Pozwala na swobodne przeglądanie i cofanie kroków (tak samo jak w Serwisach)
  const [selectedStepOverride, setSelectedStepOverride] = useState(null);

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

  const stepsList = [
    { id: 1, label: t('tickets.details.step_1') },
    { id: 2, label: t('tickets.details.step_2') },
    { id: 3, label: t('tickets.details.step_3') },
    { id: 4, label: t('tickets.details.step_4') },
    { id: 5, label: t('tickets.details.step_5') }
  ];

  const statusLabel = isClosed
    ? 'Zakończona'
    : naturalStepNum === 4
      ? 'Naprawa w trakcie'
      : naturalStepNum === 3
        ? 'Przekazana do wykonawcy'
        : naturalStepNum === 2
          ? 'Wybór wykonawcy'
          : 'Oczekująca';

  const renderNotesAndPartsSection = () => (
    <div className="pt-3 border-t border-slate-200/80 space-y-3">
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
        <span>Dodaj notatkę lub zdjęcie z prac:</span>
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
          className="w-full p-3.5 pr-12 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none text-sm bg-white shadow-sm transition-all min-h-[75px]"
          rows="2"
          placeholder="Wpisz treść notatki lub użyj mikrofonu..."
          disabled={loading || isUploading}
        />
        <div className="absolute right-3 bottom-3">
          <DictationButton onResult={(text) => setComment(prev => prev ? prev + ' ' + text : text)} />
        </div>
      </div>

      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center">
          <i className="ph ph-image text-lg text-slate-500"></i> Dodaj zdjęcie
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => setUploadedPhotos(prev => [...(prev || []), ...e.target.files])}
          />
        </label>

        <label className="flex-1 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center">
          <i className="ph ph-camera text-lg text-slate-500"></i> Aparat
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setUploadedPhotos(prev => [...(prev || []), ...e.target.files])}
          />
        </label>
      </div>

      {uploadedPhotos?.length > 0 && (
        <div className="text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex justify-between items-center">
          <span>Wybrano plików: {uploadedPhotos.length}</span>
          <button type="button" onClick={() => setUploadedPhotos([])} className="text-red-500 hover:text-red-700">
            <i className="ph ph-x"></i> Usuń
          </button>
        </div>
      )}
      {uploadError && <p className="text-red-500 text-xs text-center">{uploadError}</p>}

      <button
        type="button"
        disabled={loading || isUploading || (!comment.trim() && (!uploadedPhotos || uploadedPhotos.length === 0))}
        onClick={() => {
          handleUpdate(
            currentTicket.id,
            null,
            user?.role === 'manager' || user?.role === 'superadmin' || user?.role === 'company_admin'
              ? t('tickets.details.manager_comment')
              : t('tickets.details.note_added'),
            currentTicket.etr,
            uploadedPhotos,
            comment
          );
          setUploadedPhotos([]);
          setComment('');
        }}
        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploadProgress ? (
          <><i className="ph ph-spinner animate-spin text-xl"></i> {uploadProgress}</>
        ) : (
          <><i className="ph ph-paper-plane-tilt text-xl"></i> Zapisz notatkę/zdjęcie</>
        )}
      </button>

      {branding?.modules?.inventory !== false && (
        <button
          type="button"
          disabled={loading || isArchive}
          onClick={() => setIsPartModalOpen(true)}
          className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <i className="ph ph-package text-lg"></i> Pobierz dodatkową część z magazynu
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
            DZIAŁ TECHNICZNY - KROKI REALIZACJI
          </h3>
        </div>
        <div className="text-xs text-slate-300 font-mono">
          Status: <span className="font-bold uppercase text-white">{statusLabel}</span>
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
                  <div className={`absolute left-[7px] md:left-[12px] top-6 md:top-9 bottom-[-16px] w-0.5 z-0 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}

                {/* Kółko z numerem kroku */}
                <button
                  type="button"
                  onClick={() => setSelectedStepOverride(step.id === currentStepNum ? null : step.id)}
                  className={`relative z-10 flex-shrink-0 w-4 h-4 md:w-[26px] md:h-[26px] rounded-full flex items-center justify-center border md:border-2 font-bold text-[9px] md:text-xs leading-none mt-2.5 md:mt-3 mr-1.5 md:mr-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] border-[#111827] text-white shadow-sm'
                      : isPast
                        ? 'bg-white border-green-500 text-green-600 hover:bg-green-50'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                  title="Kliknij, aby rozwinąć ten krok"
                >
                  {isPast ? <i className="ph ph-check font-bold text-[10px] md:text-sm"></i> : step.id}
                </button>

                {/* Karta kroku */}
                <div className={`flex-1 min-w-0 rounded-xl transition-all duration-300 border relative z-0 ${
                  isSelected
                    ? 'bg-[#f4f1eb] p-3 sm:p-4 shadow-sm border-[#e8e4db]'
                    : 'bg-white py-2.5 px-3 sm:p-3.5 border-gray-200 hover:border-gray-300'
                }`}>
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setSelectedStepOverride(step.id === currentStepNum ? null : step.id)}
                  >
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                      <h4 className={`text-sm md:text-base transition-colors ${
                        isSelected
                          ? 'font-extrabold text-gray-900'
                          : isPast
                            ? 'font-bold text-gray-600'
                            : 'font-medium text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      {isActualStatus && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                          Aktywny etap
                        </span>
                      )}
                    </div>
                    <i className={`ph ${isSelected ? 'ph-caret-up' : 'ph-caret-down'} text-gray-400`}></i>
                  </div>

                  {/* Treść rozwiniętego kroku */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-4 animate-fade-in min-w-0">

                      {/* ==================== KROK 1: PRZYJĘCIE ZGŁOSZENIA ==================== */}
                      {step.id === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600">
                            Zgłoszenie awarii oczekuje na przyjęcie do realizacji i przydzielenie zespołu technicznego.
                          </p>
                          {!isClosed && !isArchive && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                handleUpdate(currentTicket.id, 2, t('tickets.details.started_search'), etr);
                                setSelectedStepOverride(2);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-4 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                              <i className="ph ph-play-circle text-xl"></i> Rozpocznij naprawę
                            </button>
                          )}
                          {!isClosed && !isArchive && renderNotesAndPartsSection()}
                        </div>
                      )}

                      {/* ==================== KROK 2: WYBÓR WYKONAWCY ==================== */}
                      {step.id === 2 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Wybierz wykonawcę (serwis wewnętrzny lub podwykonawca):
                            </label>
                            <select
                              value={selectedService || ''}
                              onChange={e => setSelectedService(e.target.value)}
                              disabled={loading || isClosed || isArchive}
                              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm"
                            >
                              <option value="">Wybierz wykonawcę z listy...</option>
                              {services?.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                disabled={loading || !selectedService}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 3, t('tickets.details.passed_to') + selectedService, etr);
                                  setSelectedStepOverride(3);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-check-circle text-xl"></i> Zatwierdź Wykonawcę i Przejdź Dalej
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 1, 'Cofnięto do przyjęcia zgłoszenia', etr);
                                  setSelectedStepOverride(1);
                                }}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-arrow-left text-lg"></i> Cofnij
                              </button>
                            </div>
                          )}

                          {!isClosed && !isArchive && renderNotesAndPartsSection()}
                        </div>
                      )}

                      {/* ==================== KROK 3: ROZPOCZĘCIE NAPRAWY ==================== */}
                      {step.id === 3 && (
                        <div className="space-y-4">
                          {(currentTicket.assignedTo || selectedService) && (
                            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                              <i className="ph ph-user-gear text-lg text-blue-600"></i>
                              <span>Wyznaczony wykonawca: <strong className="font-bold">{currentTicket.assignedTo || selectedService}</strong></span>
                            </div>
                          )}

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 4, t('tickets.details.started_repair_action'), etr);
                                  setSelectedStepOverride(4);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-play-circle text-xl"></i> Rozpocznij naprawę
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 2, t('tickets.details.reverted_contractor'), etr);
                                  setSelectedStepOverride(2);
                                }}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-arrow-counter-clockwise text-lg"></i> {t('tickets.details.change_contractor')}
                              </button>
                            </div>
                          )}

                          {!isClosed && !isArchive && renderNotesAndPartsSection()}
                        </div>
                      )}

                      {/* ==================== KROK 4: NAPRAWA W TRAKCIE ==================== */}
                      {step.id === 4 && (
                        <div className="space-y-4">
                          {(currentTicket.assignedTo || selectedService) && (
                            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                              <i className="ph ph-user-gear text-lg text-blue-600"></i>
                              <span>Wyznaczony wykonawca: <strong className="font-bold">{currentTicket.assignedTo || selectedService}</strong></span>
                            </div>
                          )}

                          {!isClosed && !isArchive && renderNotesAndPartsSection()}

                          {!isClosed && !isArchive && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 5, t('tickets.details.finished_repair_action'), etr);
                                  setSelectedStepOverride(5);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-check-circle text-xl"></i> Zakończ Naprawę
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate(currentTicket.id, 2, t('tickets.details.reverted_contractor'), etr);
                                  setSelectedStepOverride(2);
                                }}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-arrow-counter-clockwise text-lg"></i> {t('tickets.details.change_contractor')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 5: ZAKOŃCZENIE NAPRAWY ==================== */}
                      {step.id === TICKET_STATUS.CLOSED && (
                        <div className="space-y-3">
                          {isClosed ? (
                            <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                              <i className="ph ph-check-circle text-2xl text-emerald-600 shrink-0"></i>
                              <div>
                                <p className="font-bold text-emerald-950">Naprawa została pomyślnie zrealizowana i przeniesiona do historii.</p>
                                {(currentTicket.completedBy || currentTicket.assignedTo) && (
                                  <p className="text-xs text-emerald-700 mt-0.5">
                                    Zrealizował: <strong className="font-bold">{currentTicket.completedBy || currentTicket.assignedTo}</strong>
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600">
                              Naprawa jest w trakcie realizacji. Możesz zamknąć zgłoszenie z tego poziomu lub zakończyć je w Kroku 4.
                            </p>
                          )}

                          {isClosed && !isArchive && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                handleUpdate(currentTicket.id, 4, t('tickets.details.resumed_work'), etr);
                                setSelectedStepOverride(4);
                              }}
                              className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-700 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                              <i className="ph ph-arrow-counter-clockwise text-lg"></i>
                              {t('tickets.details.reopen_ticket')}
                            </button>
                          )}

                          {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN) && (
                            <div className="space-y-3 pt-2">
                              {!isArchive && !isClosed && (
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleArchiveTicket(currentTicket.id)}
                                  className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                  <i className="ph ph-archive text-lg"></i>
                                  {t('tickets.details.move_to_archive')}
                                </button>
                              )}
                              {allowTicketDeletion && (
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleDeleteTicket(currentTicket.id)}
                                  className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-700 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
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

        {/* ==================== PRZYCISK ZAMKNIJ AWARIĘ (POMIŃ KROKI) NA SAMYM DOLE ==================== */}
        {!isClosed && !isArchive && (
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={loading || isArchive}
              onClick={() => {
                handleUpdate(currentTicket.id, TICKET_STATUS.CLOSED, t('tickets.details.closed_false_alarm_action'), null);
                setSelectedStepOverride(TICKET_STATUS.CLOSED);
              }}
              className="w-full bg-emerald-50 border-2 border-emerald-500 hover:bg-emerald-100 text-emerald-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <i className="ph ph-check-circle text-lg md:text-xl"></i>
              {t('tickets.details.close_false_alarm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
