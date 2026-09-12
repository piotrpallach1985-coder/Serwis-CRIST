import { useState } from 'react';
import MachineDTR from './MachineDTR';
import ChecklistExecutor from '../checklists/ChecklistExecutor';
import PlannedMaintenanceRbgModal from './PlannedMaintenanceRbgModal';
import PlannedMaintenanceCompletionModal from './PlannedMaintenanceCompletionModal';
import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import { USER_ROLES } from '../../utils/constants';

/**
 * PlannedMaintenanceDetails — Widok szczegółowy jednego serwisu planowego.
 * Wyciągnięty z PlannedMaintenance.jsx (linie 479–835).
 */
export default function PlannedMaintenanceDetails({
  srv,
  machine,
  user,
  isArchive,
  allowTicketDeletion,
  canEditPlanned,
  canDeletePlanned,
  getMachineRegionName,
  machines,
  regions = [],
  // Akcje
  onBack,
  onDelete,
  onSetInProgress,
  onComplete,
  onUpdateRbg,
  onAddNote,
  onAddFutureNote,
  onEdit,
  // Stan modali (przekazywany z góry)
  rbgUpdateModal, setRbgUpdateModal,
  newRbgValue, setNewRbgValue,
  completionModal, setCompletionModal,
  completionNotes, setCompletionNotes,
  createNewPlan, setCreateNewPlan,
  createActionItem, setCreateActionItem,
  actionItemProblem, setActionItemProblem,
  actionItemDueDate, setActionItemDueDate,
  checklistResponses, setChecklistResponses,
  // Stan formularza edycji
  isModalOpen, setIsModalOpen,
  editingId,
  name, setName,
  machineId, setMachineId,
  priority, setPriority,
  triggerType, setTriggerType,
  calendarIntervalDays, setCalendarIntervalDays,
  nextDate, setNextDate,
  hoursInterval, setHoursInterval,
  targetWorkHours, setTargetWorkHours,
  estimatedDowntimeHours, setEstimatedDowntimeHours,
  estimatedManHours, setEstimatedManHours,
  requiredPersonnel, setRequiredPersonnel,
  machineStatus, setMachineStatus,
  checklist, setChecklist,
  handleSaveService,
}) {
  const [lightboxImg, setLightboxImg] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [newFutureNote, setNewFutureNote] = useState('');

  const isCompleted = srv.status === 'completed';

  const handleAddNoteLocal = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await onAddNote(srv, newNote.trim());
      setNewNote('');
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pasek nawigacji */}
      <div className="flex gap-2 sm:gap-4 flex-wrap p-2 sm:p-4 bg-white/95 backdrop-blur border-b sm:border border-gray-200 shadow-sm sm:rounded-xl mb-4">
        {window.history.state?.backToMachineId && (
          <button
            onClick={() => {
              const returnId = window.history.state?.backToMachineId;
              if (returnId) {
                window.history.pushState({ module: 'master_data', tab: 'machines', openMachine: returnId }, '', '?module=master_data&tab=machines&openMachine=' + returnId);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all w-fit"
          >
            <i className="ph ph-arrow-u-up-left text-lg"></i>
            Wróć do Urządzenia
          </button>
        )}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all w-fit"
        >
          <i className="ph ph-arrow-left text-lg"></i>
          Wróć do listy serwisów
        </button>
        <button
          onClick={() => import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, machine))}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-sm transition-all w-fit"
        >
          <i className="ph ph-file-pdf text-xl text-red-600"></i>
          Karta Serwisu PDF
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEWA KOLUMNA */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5">
              {/* Nagłówek serwisu */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-2xl font-black text-slate-800">{srv.name}</h2>
                  <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                    <i className="ph ph-engine text-lg text-slate-400"></i>
                    {machine?.name || <>{srv.machineName || 'Nieznana maszyna'} <span className="text-red-500 font-bold ml-1">(maszyna usunięta)</span></>}
                    {' '}({getMachineRegionName(machine?.regionId)})
                    {(regions || []).find(r => r.id === machine?.regionId)?.mapImageUrl && (
                      <a href={(regions || []).find(r => r.id === machine?.regionId).mapImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2 inline-flex items-center gap-1">
                        <i className="ph ph-map-trifold"></i> Podmapa
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  {srv.priority === 'Krytyczny' ? (
                    <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-red-100 flex items-center gap-1 shadow-sm">
                      <i className="ph ph-warning"></i> KRYTYCZNY
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm">Standard</span>
                  )}
                </div>
              </div>

              {/* Parametry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-clock text-base"></i> Wyzwalacz</div>
                  <div className="font-bold text-slate-800 text-sm">{srv.triggerType === 'calendar' ? 'Kalendarz' : srv.triggerType === 'hours' ? 'RBG' : 'Mieszany'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-users text-base"></i> Personel</div>
                  <div className="font-bold text-slate-800 text-sm">{srv.requiredPersonnel || '-'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-hourglass text-base"></i> Przestój (h)</div>
                  <div className="font-bold text-slate-800 text-sm">{srv.estimatedDowntimeHours || 0} h</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-wrench text-base"></i> Status maszyny</div>
                  <div className="font-bold text-slate-800 text-sm">{srv.machineStatus || '-'}</div>
                </div>
              </div>

              {/* Zakres prac / Checklista */}
              <div className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="ph ph-list-checks text-xl text-blue-600"></i> Zakres prac do wykonania
                </h3>
                {srv.checklist && srv.checklist.length > 0 ? (
                  <ul className="space-y-3">
                    {srv.checklist.map((step, idx) => (
                      <li key={step.id} className="flex items-start gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <span className="font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{step.taskName}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Wymagane: {step.type === 'CHECKBOX' ? 'Potwierdzenie (odhaczenie)' : step.type === 'PHOTO' ? 'Zdjęcie dokumentujące' : 'Wpisanie wartości'}
                            <span className={step.isRequired ? "text-red-500 font-medium ml-1" : "text-slate-400 ml-1"}>
                              {step.isRequired ? '(Obowiązkowe)' : '(Opcjonalne)'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm font-medium text-slate-600 italic bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                    Przegląd według obowiązującego standardu DTR maszyny.
                  </div>
                )}
              </div>

              {/* Przyciski akcji */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                {!isCompleted && srv.status !== 'in_progress' && (
                  <button onClick={() => onSetInProgress(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                    <i className="ph ph-play-circle text-xl"></i> Rozpocznij Serwis
                  </button>
                )}
                {!isCompleted && srv.status === 'in_progress' && (
                  <>
                    {(!srv.checklist || srv.checklist.length === 0) ? (
                      <button onClick={() => setCompletionModal(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                        <i className="ph ph-check-circle text-xl"></i> Zakończ Serwis
                      </button>
                    ) : (
                      <div className="w-full mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Lista Kontrolna (Wymagana do zamknięcia)</h3>
                        <ChecklistExecutor
                          steps={srv.checklist}
                          onComplete={(responses) => {
                            setChecklistResponses(responses);
                            setCompletionModal(srv);
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {!isCompleted && srv.status !== 'in_progress' && canEditPlanned && (
                  <button onClick={() => onEdit(srv)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300">
                    <i className="ph ph-pencil-simple text-xl"></i> Edytuj
                  </button>
                )}
                {canDeletePlanned && (!isArchive || allowTicketDeletion) && (
                  <button onClick={() => { onDelete(srv.id); onBack(); }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200">
                    <i className="ph ph-trash text-xl"></i> Usuń
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PRAWA KOLUMNA — Historia */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
            </h4>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
              {srv.history && [...srv.history].reverse().map((entry, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-slate-800"></div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-slate-800 text-sm">{entry.user || 'System'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(entry.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 font-medium">{entry.action}</div>
                  {entry.note && (
                    <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      &quot;{entry.note}&quot;
                    </div>
                  )}
                  {entry.checklistSummary && entry.checklistSummary.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lista Kontrolna:</div>
                      {entry.checklistSummary.map((item, i) => (
                        <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="font-semibold">{item.taskName}:</span>{' '}
                          {item.type === 'CHECKBOX' ? (
                            item.answer ? '✅ Wykonano' : '❌ Pominięto'
                          ) : item.type === 'PHOTO' ? (
                            item.answer && item.answer.length > 0 ? (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <img src={item.answer} alt="załącznik" className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm" onClick={() => setLightboxImg(item.answer)} />
                              </div>
                            ) : 'Brak zdjęć'
                          ) : (
                            <span className="font-mono text-blue-600">{item.answer || 'Brak danych'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(!srv.history || srv.history.length === 0) && (
                <div className="text-sm text-slate-400 italic pl-6">Brak historii zdarzeń.</div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Modals */}
      <PlannedMaintenanceRbgModal
        rbgUpdateModal={rbgUpdateModal}
        newRbgValue={newRbgValue}
        setNewRbgValue={setNewRbgValue}
        onSubmit={onUpdateRbg}
        onClose={() => setRbgUpdateModal(null)}
      />

      <PlannedMaintenanceCompletionModal
        completionModal={completionModal}
        completionNotes={completionNotes} setCompletionNotes={setCompletionNotes}
        createNewPlan={createNewPlan} setCreateNewPlan={setCreateNewPlan}
        createActionItem={createActionItem} setCreateActionItem={setCreateActionItem}
        actionItemProblem={actionItemProblem} setActionItemProblem={setActionItemProblem}
        actionItemDueDate={actionItemDueDate} setActionItemDueDate={setActionItemDueDate}
        onSubmit={onComplete}
        onClose={() => setCompletionModal(null)}
      />

      <PlannedMaintenanceFormModal
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingId={editingId}
        name={name} setName={setName} machineId={machineId} setMachineId={setMachineId}
        priority={priority} setPriority={setPriority} triggerType={triggerType} setTriggerType={setTriggerType}
        calendarIntervalDays={calendarIntervalDays} setCalendarIntervalDays={setCalendarIntervalDays}
        nextDate={nextDate} setNextDate={setNextDate} hoursInterval={hoursInterval} setHoursInterval={setHoursInterval}
        targetWorkHours={targetWorkHours} setTargetWorkHours={setTargetWorkHours}
        estimatedDowntimeHours={estimatedDowntimeHours} setEstimatedDowntimeHours={setEstimatedDowntimeHours}
        estimatedManHours={estimatedManHours} setEstimatedManHours={setEstimatedManHours}
        requiredPersonnel={requiredPersonnel} setRequiredPersonnel={setRequiredPersonnel}
        machineStatus={machineStatus} setMachineStatus={setMachineStatus}
        checklist={checklist} setChecklist={setChecklist}
        machines={machines} handleSaveService={handleSaveService}
      />

      <MachineDTR machine={machines.find(m => m.id === srv?.machineId)} canManage={user?.role === 'manager' || user?.role === USER_ROLES.ADMIN} />

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
