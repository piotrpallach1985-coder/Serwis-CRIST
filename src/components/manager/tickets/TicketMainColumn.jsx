import { useAuth } from '../../../hooks/useAuth';
import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';
import { safe } from '../../../utils/safeRender';
import { safeParseDate } from '../../../utils/dateHelpers';
import DictationButton from '../../shared/DictationButton';
import TicketPartUsageModal from './TicketPartUsageModal';
import { USER_ROLES, TICKET_STATUS } from '../../../utils/constants';
import { useManagerStore } from '../../../store/managerStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import { compressImage } from '../../../utils/imageCompressor';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { machines, regions, services, branding, parts = [], partTransactions = [] } = useManagerStore();

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
      {/* LEWA KOLUMNA */}
            <div className="w-full lg:w-3/4 space-y-5">
              
              {/* Główna sekcja danych (Tytuł i szczegóły) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  {/* Statusy i Tagi */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="font-bold text-gray-400 mr-1 text-sm md:text-lg">T{currentTicket.id?.slice(0, 4).toUpperCase() || "1"}</span>
                    <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold border uppercase tracking-wider ${STATUSES[currentTicket.status || 1]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {STATUSES[currentTicket.status || 1]?.label || t('tickets.statuses.unknown')}
                    </span>
                    {currentTicket.isCritical && (
                      <span className="bg-red-600 animate-pulse text-white px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                        {t('tickets.details.machine_down')}
                      </span>
                    )}
                  </div>
                  
                  {/* Tytuł */}
                  <h2 className="text-lg md:text-2xl font-extrabold text-[#111827] mb-2 md:mb-6">{safe(currentTicket.topic)}</h2>
                  
                  {/* Podział na {t('tickets.details.object_data')} i {t('tickets.details.ticket_info')} */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 border-t border-gray-100 pt-8">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('tickets.details.object_data')}</h3>
                      <div className="font-bold text-[#111827] text-lg mb-1 flex items-center gap-2">
                        {safe(currentTicket.machineName)}{!machines?.some(m => m.id === currentTicket.machineId) && <span className="text-red-500 font-bold ml-1">{t('tickets.details.deleted_machine_inline')}</span>}
    
                      </div>
                      <div className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                        <i className="ph ph-map-pin"></i> {safe(currentTicket.regionName, t('tickets.details.no_region'))} {currentTicket.bay ? ` / ${safe(currentTicket.bay)}` : ""}
                        {(regions || []).find(r => r.name === currentTicket.regionName || r.id === currentTicket.regionId)?.mapImageUrl && (
                          <a href={(regions || []).find(r => r.name === currentTicket.regionName || r.id === currentTicket.regionId).mapImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2 inline-flex items-center gap-1">
                            <i className="ph ph-map-trifold"></i> Podmapa
                          </a>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">ID: {safe(currentTicket.machineId)}</div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('tickets.details.ticket_info')}</h3>
                      <div className="font-bold text-[#111827] flex items-center gap-2 mb-1">
                        <i className="ph ph-user text-gray-400"></i> {safe(currentTicket.reportedBy)}
                      </div>
                      {currentTicket.reporterDeviceId && (
                          <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-xs bg-gray-100 p-2 rounded w-fit">
                            <i className="ph ph-device-mobile text-gray-500"></i> {t('tickets.details.device_id')}{safe(currentTicket.reporterDeviceId)}
                          </div>
                        )}
                        {currentTicket.reporterPhone && (
                        <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-sm">
                          <i className="ph ph-phone text-gray-400"></i> {safe(currentTicket.reporterPhone)}
                        </div>
                      )}
                      <div className="text-gray-500 text-sm mb-1">
                        Priorytet: <span className={currentTicket.isCritical ? "text-red-600 font-bold" : ""}>{currentTicket.isCritical ? t('tickets.details.priority_high') : t('tickets.details.priority_standard')}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {t('tickets.details.reported_at')} {safeParseDate(currentTicket.createdAt)?.toLocaleString('pl-PL') || t('tickets.history.no_date')}
                      </div>
                      
                    </div>
                  </div>

                  {actualPartsUsed && actualPartsUsed.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="ph ph-nut text-lg"></i> {t('tickets.details.parts_used')}
                      </h4>
                      <ul className="space-y-2">
                        {actualPartsUsed.map((tx, idx) => {
                          const pName = parts.find(p => p.id === tx.partId)?.name || t('tickets.details.unknown_part');
                          return (
                            <li key={idx} className="flex justify-between items-center text-sm bg-blue-50/50 p-3 border border-blue-100 rounded-lg">
                              <span className="font-bold text-slate-800">{pName}</span>
                              <div className="flex gap-4 text-xs text-slate-600 font-medium">
                                <span>{t('tickets.details.taken')}{Math.abs(tx.quantity)} ({tx.user || 'System'})</span>
                                <span>{t('tickets.details.cost')}{tx.totalCost ? tx.totalCost.toFixed(2) + ' PLN' : (Math.abs(tx.quantity) * tx.price).toFixed(2) + ' PLN'}</span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* {t('tickets.details.description')} */}
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('tickets.details.description')}</h3>
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
                      {safe(currentTicket.description)}
                  </div>
{currentTicket.photos && currentTicket.photos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{t('tickets.details.photos')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentTicket.photos.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt="zalacznik" 
                            className="w-24 h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => setLightboxImg(url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  
                </div>
              </div>

              {/* PANEL DYSPOZYTORA (Akcje) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#111827] text-white p-4 px-6 flex items-center gap-3">
                  <i className="ph ph-faders text-xl"></i>
                  <h3 className="font-bold text-sm tracking-widest uppercase">
                    {user?.role === USER_ROLES.MANAGER ? t('tickets.details.manager_panel') : t('tickets.details.tech_panel')}
                  </h3>
                </div>
                
                <div className="p-4 md:p-5 space-y-6 bg-gray-50/50">
                  
                  {/* NOWY LAYOUT - STEPPER (4 KROKI) */}
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
                        <div key={step.id} className="relative flex items-start group min-h-[80px]">
                            {/* Liniowa łączówka */}
                            {step.id !== 5 && (
                              <div className="absolute left-4 top-10 bottom-[-10px] w-0.5 bg-gray-200 z-0"></div>
                            )}
                            
                            {/* Kółko z numerem */}
                            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm mt-3 mr-4 transition-all ${isActive ? 'bg-[#111827] border-[#111827] text-white shadow-md' : isPast ? 'bg-white border-green-500 text-green-500' : 'bg-white border-gray-200 text-gray-300'}`}>
                              {isPast ? <i className="ph ph-check font-bold"></i> : step.id}
                            </div>
                            
                            {/* Karta z treścią */}
                            <div className={`flex-1 mb-2 md:mb-4 rounded-xl transition-all duration-300 relative z-0 ${isActive ? 'bg-[#f4f1eb] py-4 pr-4 pl-[3.5rem] sm:pl-[4rem] shadow-sm border border-[#e8e4db] -ml-[3rem] -mt-1' : 'py-3 pr-3'}`}>
                            <h4 className={`text-sm md:text-lg transition-colors ${isActive ? 'font-extrabold text-gray-900' : isPast ? 'font-bold text-gray-500' : 'font-medium text-gray-400'}`}>
                              {step.label}
                            </h4>
                            
                            
                              {/* Bezpośrednie zamknięcie awarii */}
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
                                
                                {/* Specyficzna akcja dla kroku */}
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

                                {/* Admin Actions for closed/archived */}
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
                      );
                    })}
                  </div>
                </div>
              </div>
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
  handleDeleteTicket: PropTypes.func.isRequired,
  handleArchiveTicket: PropTypes.func.isRequired,
  allowTicketDeletion: PropTypes.bool
};
