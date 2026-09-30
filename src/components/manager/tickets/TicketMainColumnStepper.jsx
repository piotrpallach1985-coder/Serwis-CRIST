import React from 'react';
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-5">
      <div className="bg-[#111827] text-white p-4 px-6 flex items-center gap-3">
        <i className="ph ph-faders text-xl"></i>
        <h3 className="font-bold text-sm tracking-widest uppercase">
          {user?.role === USER_ROLES.MANAGER ? t('tickets.details.manager_panel') : t('tickets.details.tech_panel')}
        </h3>
      </div>
      
      <div className="p-4 md:p-5 space-y-6 bg-gray-50/50">
        <div className="mt-2">
          {[
            { id: 1, label: t('tickets.details.step_1') },
            { id: 2, label: t('tickets.details.step_2') },
            { id: 3, label: t('tickets.details.step_3') },
            { id: 4, label: t('tickets.details.step_4') },
            { id: 5, label: t('tickets.details.step_5') }
          ].map(step => {
            let currentStatus = parseInt(currentTicket.status, 10);
            if (isNaN(currentStatus) || currentStatus < 1 || currentStatus > 5) {
              if (currentTicket.status === 'closed') currentStatus = TICKET_STATUS.CLOSED;
              else currentStatus = 1;
            }
            const currentStepNum = currentStatus;
            const isActive = step.id === currentStepNum;
            const isPast = step.id < currentStepNum;

            return (
              <div key={step.id} className="flex flex-col md:flex-row md:gap-4 relative">
                {step.id !== 5 && (
                  <div className={`hidden md:block absolute left-[15px] top-[30px] bottom-[-20px] w-0.5 z-0 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
                
                <div className="flex gap-4 w-full">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 relative z-10 shrink-0 transition-colors ${isActive ? 'bg-white border-blue-600 text-blue-600 shadow-md scale-110' : isPast ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                    {isPast ? <i className="ph ph-check text-lg"></i> : step.id}
                  </div>
                  
                  <div className={`flex-1 mb-2 md:mb-4 rounded-xl transition-all duration-300 relative z-0 ${isActive ? 'bg-[#f4f1eb] py-4 pr-4 pl-[3.5rem] sm:pl-[4rem] shadow-sm border border-[#e8e4db] -ml-[3rem] -mt-1' : 'py-3 pr-3'}`}>
                    <h4 className={`text-sm md:text-lg transition-colors ${isActive ? 'font-extrabold text-gray-900' : isPast ? 'font-bold text-gray-500' : 'font-medium text-gray-400'}`}>
                      {step.label}
                    </h4>
                    
                    {step.id === TICKET_STATUS.CLOSED && currentTicket.status !== TICKET_STATUS.CLOSED && currentTicket.status !== 'closed' && (
                      <div className="mt-4 pt-3 mb-4">
                        <button 
                          disabled={loading || isArchive} 
                          onClick={() => handleUpdate(currentTicket.id, TICKET_STATUS.CLOSED, t('tickets.details.closed_false_alarm_action'), null)}
                          className="w-full bg-emerald-50 border-2 border-emerald-500 hover:bg-emerald-100 text-emerald-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <i className="ph ph-check-circle text-lg md:text-xl"></i>
                          {t('tickets.details.close_false_alarm')}
                        </button>
                      </div>
                    )}

                    {isActive && (
                      <div className="mt-5 space-y-5 animate-fade-in">
                        {user?.role !== USER_ROLES.MANAGER && (
                          <div className="space-y-4">
                            {step.id === 1 && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, t('tickets.details.started_search'), etr)} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                  {t('tickets.details.go_to_contractor')}
                                </button>
                              </div>
                            )}

                            {step.id === 2 && (
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">{t('tickets.details.select_contractor_label')}</label>
                                <select value={selectedService || ''} onChange={e => setSelectedService(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                                  <option value="">{t('tickets.details.select_placeholder')}</option>
                                  {services?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                                <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, t('tickets.details.passed_to') + selectedService, etr)} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all mt-2">
                                  {t('tickets.details.confirm_contractor')}
                                </button>
                              </div>
                            )}

                            {step.id === 3 && (
                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, t('tickets.details.started_repair_action'), etr)} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                Rozpocznij Naprawę
                              </button>
                            )}
                            
                            {step.id === 4 && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, t('tickets.details.finished_repair_action'), etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all">
                                  Zakończ Naprawę
                                </button>
                                <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, t('tickets.details.reverted_contractor'), etr)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all">
                                  {t('tickets.details.change_contractor')}
                                </button>
                              </div>
                            )}

                            {step.id === TICKET_STATUS.CLOSED && !isArchive && (
                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, t('tickets.details.resumed_work'), etr)} className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all mt-4">
                                {t('tickets.details.reopen_ticket')}
                              </button>
                            )}
                          </div>
                        )}

                        {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN) && step.id === TICKET_STATUS.CLOSED && (
                          <div className="space-y-3 pt-3 border-t border-[#e8e4db]">
                            {!isArchive && (
                              <button 
                                disabled={loading} 
                                onClick={() => handleArchiveTicket(currentTicket.id)}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-archive text-lg"></i>
                                {t('tickets.details.move_to_archive')}
                              </button>
                            )}
                            {allowTicketDeletion && (
                              <button 
                                disabled={loading} 
                                onClick={() => handleDeleteTicket(currentTicket.id)}
                                className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-trash text-lg"></i>
                                {t('tickets.details.delete_permanently')}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {step.id !== TICKET_STATUS.CLOSED && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('tickets.details.add_note_label')}</label>
                            <div className="relative mb-2">
                              <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none pr-10 text-sm bg-white"
                                rows="3"
                                placeholder={t('tickets.details.note_placeholder')}
                                disabled={loading}
                              />
                              <div className="absolute right-2 top-2">
                                <DictationButton onResult={(text) => setComment(prev => prev ? prev + ' ' + text : text)} />
                              </div>
                            </div>

                            <div className="mb-2 relative border border-slate-200 rounded p-1">
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => setUploadedPhotos([...e.target.files])}
                                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                              />
                              {uploadError && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-2">{uploadError}</p>}
                            </div>

                            <div className="flex gap-2">
                              {branding?.modules?.inventory !== false && (
                              <button 
                                disabled={loading || isArchive} 
                                onClick={() => setIsPartModalOpen(true)}
                                className="mt-2 flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-lg shadow-sm border border-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <i className="ph ph-qr-code text-lg"></i> {t('tickets.details.take_part')}
                              </button>
                              )}
                              
                              <button 
                                disabled={loading || isUploading || (!comment.trim() && (!uploadedPhotos || uploadedPhotos.length === 0))} 
                                onClick={() => {
                                  handleUpdate(currentTicket.id, null, user?.role === USER_ROLES.MANAGER ? t('tickets.details.manager_comment') : t('tickets.details.note_added'), currentTicket.etr, uploadedPhotos, comment);
                                  setUploadedPhotos([]);
                                  setComment('');
                                }} 
                                className="mt-2 flex-1 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {uploadProgress ? (
                                  <><i className="ph ph-spinner animate-spin text-lg"></i> {uploadProgress}</>
                                ) : (
                                  <><i className="ph ph-paper-plane-tilt text-lg"></i> {t('tickets.details.send_note')}</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
