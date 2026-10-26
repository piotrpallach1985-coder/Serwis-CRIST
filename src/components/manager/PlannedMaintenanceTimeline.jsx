import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompressor';
import DictationButton from '../shared/DictationButton';
import SignaturePad from '../shared/SignaturePad';
import ChecklistExecutor from '../checklists/ChecklistExecutor';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import {
  updatePlannedService,
  completeServiceWithTransaction,
} from '../../services/plannedServices.service';
import { normalizeSmartSummary, daysFromNowISODate } from '../../utils/smartSummaryParser';
import {
  REFRIGERANT_TYPES,
  LEAK_TEST_RESULTS,
  buildFGasServiceEntry,
  getIndustryProfileConfig,
  isInspectorLicenseRequired,
} from '../../utils/fieldServiceHelpers';

export default function PlannedMaintenanceTimeline({
  srv,
  isCompleted,
  user,
  onAddFutureNote,
  setServiceToComplete,
  onComplete,
  onEdit,
  onDelete,
  onOpenPartModal,
  canEditPlanned,
  canDeletePlanned,
  isArchive,
  allowTicketDeletion,
  onBack,
  actualPartsUsed = [],
}) {
  const { t } = useTranslation();
  const services = useManagerStore(state => state.services || []);
  const machines = useManagerStore(state => state.machines || []);
  const parts = useManagerStore(state => state.parts || []);
  const branding = useManagerStore(state => state.branding || {});
  const industryProfile = branding?.industryProfile || 'industrial';
  const profileConfig = getIndustryProfileConfig(industryProfile);

  const [loadedPartsUsed, setLoadedPartsUsed] = useState([]);
  useEffect(() => {
    if ((!actualPartsUsed || actualPartsUsed.length === 0) && srv?.id) {
      import('../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
        fetchTransactionsForReference(getCurrentTenant(), srv.id).then(txs => {
          const filtered = (txs || []).filter(
            tx =>
              tx.referenceId === srv.id &&
              (tx.type === 'issue_planned' || tx.type === 'issue_adhoc')
          );
          setLoadedPartsUsed(filtered);
        });
      });
    }
  }, [srv?.id, actualPartsUsed]);

  const displayedPartsUsed =
    actualPartsUsed && actualPartsUsed.length > 0 ? actualPartsUsed : loadedPartsUsed;

  const [timelineNote, setTimelineNote] = useState('');
  const [timelinePhotos, setTimelinePhotos] = useState([]);
  const [timelineUploadProgress, setTimelineUploadProgress] = useState('');
  const [isTimelineUploading, setIsTimelineUploading] = useState(false);
  const [timelineUploadError, setTimelineUploadError] = useState(null);
  const [timelineSuccessMsg, setTimelineSuccessMsg] = useState(null);

  // Krok 2: Wybór wykonawcy
  const [selectedService, setSelectedService] = useState(
    srv.assignedService || srv.assignedTo || ''
  );

  // Krok 4: Podsumowanie serwisu
  const [summaryManHours, setSummaryManHours] = useState('');
  const [summaryPartsUsed, setSummaryPartsUsed] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [summaryCreateActionItem, setSummaryCreateActionItem] = useState(false);
  const [summaryActionItemDetails, setSummaryActionItemDetails] = useState('');
  const [summaryActionItemDueDate, setSummaryActionItemDueDate] = useState('');
  const [summaryExtraParts, setSummaryExtraParts] = useState([]);
  const [summaryCreateNewPlan, setSummaryCreateNewPlan] = useState(true);
  const [isCompletingService, setIsCompletingService] = useState(false);

  const currentMachine = machines.find(m => m.id === srv.machineId) || null;
  const canShowFGasSection =
    industryProfile !== 'industrial' &&
    (industryProfile === 'hvac' || Boolean(currentMachine?.refrigerantType));
  const [licenseError, setLicenseError] = useState('');
  const requiresInspectorLicense = isInspectorLicenseRequired(industryProfile);
  const [leakTestResult, setLeakTestResult] = useState('not_applicable');
  const [refrigerantType, setRefrigerantType] = useState(currentMachine?.refrigerantType || '');
  const [addedRefrigerantKg, setAddedRefrigerantKg] = useState('');
  const [recoveredRefrigerantKg, setRecoveredRefrigerantKg] = useState('');
  const [showFGasSection, setShowFGasSection] = useState(
    industryProfile !== 'industrial' &&
      (industryProfile === 'hvac' || Boolean(currentMachine?.refrigerantType))
  );
  const [clientSignature, setClientSignature] = useState('');
  const [clientSignerName, setClientSignerName] = useState(currentMachine?.contactPerson || '');
  const matchedServiceForLicense = (services || []).find(
    s =>
      s.name === (selectedService || srv.assignedService || srv.assignedTo) ||
      s.id === (selectedService || srv.assignedService || srv.assignedTo)
  );
  const [inspectorLicense, setInspectorLicense] = useState(
    srv.inspectorLicense ||
      srv.completionDetails?.inspectorLicense ||
      matchedServiceForLicense?.licenseNumber ||
      user?.licenseNumber ||
      ''
  );

  useEffect(() => {
    const fallbackLicense =
      srv.inspectorLicense ||
      srv.completionDetails?.inspectorLicense ||
      matchedServiceForLicense?.licenseNumber ||
      user?.licenseNumber ||
      '';
    if (fallbackLicense && !inspectorLicense) {
      setInspectorLicense(fallbackLicense);
    }
  }, [
    srv.inspectorLicense,
    srv.completionDetails?.inspectorLicense,
    matchedServiceForLicense?.licenseNumber,
    user?.licenseNumber,
  ]);

  useEffect(() => {
    if (industryProfile === 'industrial') {
      setShowFGasSection(false);
      return;
    }
    if (currentMachine) {
      if (currentMachine.refrigerantType) {
        setRefrigerantType(currentMachine.refrigerantType);
        setShowFGasSection(true);
      } else if (industryProfile === 'hvac') {
        setShowFGasSection(true);
      } else {
        setShowFGasSection(false);
      }
      if (currentMachine.contactPerson && !clientSignerName) {
        setClientSignerName(currentMachine.contactPerson);
      }
    }
  }, [srv.machineId, currentMachine, industryProfile]);

  const setQuickActionItemDueDate = days => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSummaryActionItemDueDate(d.toISOString().split('T')[0]);
  };

  // Pozwala na przeglądanie kroków (aktywne są jednak wyłącznie przyciski z aktywnego etapu)
  const [selectedStepOverride, setSelectedStepOverride] = useState(null);

  useEffect(() => {
    if (srv.assignedService || srv.assignedTo) {
      setSelectedService(srv.assignedService || srv.assignedTo);
    }
  }, [srv.id, srv.assignedService, srv.assignedTo]);

  // Określenie naturalnego kroku (1 do 5)
  let naturalStepNum = 1;
  if (isCompleted || srv.status === 'completed' || srv.currentStep === 5) {
    naturalStepNum = 5;
  } else if (srv.currentStep === 4) {
    naturalStepNum = 4;
  } else if (srv.currentStep === 3 || srv.status === 'in_progress') {
    naturalStepNum = 3;
  } else if (srv.currentStep === 2 || (srv.assignedService && srv.status !== 'in_progress')) {
    naturalStepNum = 2;
  } else {
    naturalStepNum = 1;
  }

  const currentStepNum = selectedStepOverride !== null ? selectedStepOverride : naturalStepNum;

  // 1. Krok 1 -> Krok 2: Rozpocznij serwis
  const handleStartService = async () => {
    try {
      const historyEntry = {
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Przyjęto serwis do realizacji',
        note: '',
      };
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      await updatePlannedService(srv.id, { currentStep: 2, history: newHistory });
      setSelectedStepOverride(2);
    } catch (err) {
      console.error('Błąd rozpoczęcia serwisu:', err);
      setTimelineUploadError('Błąd: ' + err.message);
    }
  };

  // 2. Krok 2 -> Krok 3: Zatwierdź wykonawcę
  const handleConfirmContractor = async () => {
    if (!selectedService) return;
    try {
      const nowIso = new Date().toISOString();
      const historyEntry = {
        date: nowIso,
        user: user?.name || 'System',
        action: 'Przekazano do: ' + selectedService,
        note: '',
      };
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      await updatePlannedService(srv.id, {
        assignedService: selectedService,
        status: 'in_progress',
        assignedAt: srv.assignedAt || nowIso,
        currentStep: 3,
        history: newHistory,
      });
      setSelectedStepOverride(3);
    } catch (err) {
      console.error('Błąd zatwierdzenia wykonawcy:', err);
      setTimelineUploadError('Błąd: ' + err.message);
    }
  };

  // 3. Krok 3 -> Krok 4: Przejście do podsumowania
  const handleGoToSummary = async () => {
    try {
      await updatePlannedService(srv.id, { currentStep: 4 });
      setSelectedStepOverride(4);
    } catch {
      setSelectedStepOverride(4);
    }
  };

  // Obsługa inteligentnego AI w Kroku 4
  const handleSmartSummaryResult = result => {
    const r = normalizeSmartSummary(result);
    if (r.note) {
      setSummaryNotes(prev => (prev ? prev + '\n' + r.note : r.note));
    }
    if (r.manHours !== undefined) {
      setSummaryManHours(String(r.manHours));
    }
    if (r.partsUsed !== undefined) {
      setSummaryPartsUsed(r.partsUsed);
    }
    if (r.createActionItem) {
      setSummaryCreateActionItem(true);
      if (r.actionItemDetails) setSummaryActionItemDetails(r.actionItemDetails);
      if (r.actionItemDays && r.actionItemDays > 0) {
        setSummaryActionItemDueDate(daysFromNowISODate(r.actionItemDays));
      }
    }
  };

  // 4. Krok 4 -> Krok 5: Zakończ Serwis (Rozliczenie)
  const handleCompleteServiceFromStep4 = async () => {
    if (requiresInspectorLicense && !inspectorLicense.trim()) {
      setLicenseError(
        'Podaj numer uprawnień kontrolującego / inspektora (wymagane dla profilu HVAC i Facility c-KOB).'
      );
      return;
    }
    setLicenseError('');
    setIsCompletingService(true);
    setTimelineUploadError(null);
    try {
      let nextPlanData = null;
      if (summaryCreateNewPlan) {
        const machine = machines.find(m => m.id === srv.machineId);
        nextPlanData = {
          name: srv.name,
          machineId: srv.machineId || '',
          machineName: srv.machineName || machine?.name || '',
          priority: srv.priority,
          category: srv.category || 'preventive',
          triggerType: srv.triggerType,
          estimatedDowntimeHours: srv.estimatedDowntimeHours,
          estimatedManHours: srv.estimatedManHours,
          requiredPersonnel: srv.requiredPersonnel,
          machineStatus: srv.machineStatus,
          notified: false,
          checklist: srv.checklist || [],
          toolsType: srv.toolsType || 'Podstawowe',
          specialTools: srv.specialTools || '',
          otherTools: srv.otherTools || '',
          requiredParts: srv.requiredParts || [],
          futureNotes: srv.futureNotes || [],
          assignedService: srv.assignedService || selectedService || '',
          additionalDescription: srv.additionalDescription || '',
        };
        if (srv.triggerType === 'calendar' || srv.triggerType === 'mixed') {
          nextPlanData.calendarIntervalDays = srv.calendarIntervalDays;
          const nextD = new Date();
          nextD.setDate(nextD.getDate() + (srv.calendarIntervalDays || 30));
          nextPlanData.nextDate = nextD;
        }
        if (srv.triggerType === 'hours' || srv.triggerType === 'mixed') {
          nextPlanData.hoursInterval = srv.hoursInterval;
          const currentH = machine?.currentWorkHours || 0;
          nextPlanData.targetWorkHours = currentH + (srv.hoursInterval || 500);
        }
      }

      const checklistResponses = srv.checklistResponses || srv.responses || {};
      let checklistSummary = [];
      if (srv.checklist) {
        checklistSummary = srv.checklist.map(step => ({
          taskName: step.taskName || step.text || '',
          step: step.taskName || step.text || '',
          type: step.type || 'CHECKBOX',
          answer:
            checklistResponses.values?.[step.id] === undefined
              ? checklistResponses[step.id] === undefined
                ? null
                : checklistResponses[step.id]
              : checklistResponses.values[step.id],
          note: checklistResponses.notes?.[step.id] || '',
          photos: checklistResponses.photos?.[step.id] || [],
        }));
      }

      const fGasProtocol = showFGasSection
        ? buildFGasServiceEntry({
            refrigerantType: refrigerantType || currentMachine?.refrigerantType,
            refrigerantChargeKg: currentMachine?.refrigerantChargeKg || null,
            addedKg: addedRefrigerantKg,
            recoveredKg: recoveredRefrigerantKg,
            leakTestResult,
          })
        : null;

      const parsedSummaryManHours =
        summaryManHours !== '' && summaryManHours !== null && summaryManHours !== undefined
          ? Number(String(summaryManHours).replace(',', '.'))
          : null;
      const safeManHours =
        parsedSummaryManHours !== null && Number.isFinite(parsedSummaryManHours) && parsedSummaryManHours >= 0
          ? parsedSummaryManHours
          : null;

      const historyEntry = {
        manHours: safeManHours,
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Zakończono serwis',
        note: summaryNotes,
        checklistSummary,
        partsUsed: summaryPartsUsed,
        ...(fGasProtocol ? { fGasProtocol } : {}),
        ...(clientSignerName ? { clientSignerName: clientSignerName.trim() } : {}),
        ...(inspectorLicense && inspectorLicense.trim()
          ? { inspectorLicense: inspectorLicense.trim() }
          : {}),
      };

      const completionData = {
        completedBy: user?.name || 'System',
        completedAt: historyEntry.date,
        notes: summaryNotes,
        manHours: safeManHours,
        checklistResponses,
        historyEntry,
        partsUsed: summaryPartsUsed,
        currentStep: 5,
        completedGps: srv.completedGps || null,
        fGasProtocol: fGasProtocol || null,
        clientSignature: clientSignature || null,
        clientSignerName: clientSignerName ? clientSignerName.trim() : null,
        inspectorLicense: inspectorLicense && inspectorLicense.trim() ? inspectorLicense.trim() : null,
      };

      let actionItemDataObj = null;
      if (summaryCreateActionItem && summaryActionItemDetails.trim()) {
        actionItemDataObj = {
          machineId: srv.machineId || '',
          machineName: srv.machineName || '',
          plannedServiceId: srv.id || '',
          problem: summaryActionItemDetails.trim(),
          dueDate: summaryActionItemDueDate
            ? new Date(summaryActionItemDueDate).toISOString()
            : null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: user?.name || 'Nieznany',
        };
      }

      const validExtraParts = summaryExtraParts.filter(
        ep => ep.partId && ep.partId !== '' && Number(ep.quantity) > 0
      );

      if (validExtraParts.length > 0) {
        const extraNote =
          'Pobrano dodatkowe części (poza planem): ' +
          validExtraParts
            .map(ep => {
              const found = parts.find(p => p.id === ep.partId);
              const unitStr = found?.unit || 'szt.';
              return (found ? found.name : ep.partId) + ' (' + ep.quantity + ' ' + unitStr + ')';
            })
            .join(', ');
        historyEntry.note = (historyEntry.note ? historyEntry.note + '\n' : '') + extraNote;
        historyEntry.extraParts = validExtraParts;
      }

      await completeServiceWithTransaction(
        srv,
        completionData,
        nextPlanData,
        actionItemDataObj,
        validExtraParts
      );

      if (onComplete) {
        onComplete({
          ...srv,
          ...completionData,
          completedAt: historyEntry.date,
          completionDetails: completionData,
          history: [...(srv.history || []), historyEntry],
          status: 'completed',
          currentStep: 5,
        });
      }

      setSelectedStepOverride(5);
      setTimelineSuccessMsg('Serwis został pomyślnie zakończony i rozliczony!');
      setTimeout(() => setTimelineSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Błąd zakończenia serwisu:', err);
      setTimelineUploadError('Błąd rozliczenia serwisu: ' + err.message);
    } finally {
      setIsCompletingService(false);
    }
  };

  // Obsługa dodawania zdjęć w Kroku 3
  const handlePhotoSelect = async files => {
    if (!files || files.length === 0) return;
    setIsTimelineUploading(true);
    setTimelineUploadProgress(t('tickets.details.uploading') || 'Przetwarzanie zdjęć...');
    setTimelineUploadError(null);
    setTimelineSuccessMsg(null);
    try {
      const uploadedUrls = [];
      for (const f of files) {
        const compressed = await compressImage(f, 2);
        const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(
          storage,
          `tenants/${getCurrentTenant()}/maintenance_logs/${Date.now()}_${safeName}`
        );
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }
      setTimelinePhotos(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Photo upload error:', err);
      setTimelineUploadError('Błąd wgrywania zdjęcia: ' + err.message);
    } finally {
      setIsTimelineUploading(false);
      setTimelineUploadProgress('');
    }
  };

  // Zapisanie notatki / zdjęć do historii w Kroku 3
  const handleSaveNote = async () => {
    if (!timelineNote.trim() && timelinePhotos.length === 0) return;
    setIsTimelineUploading(true);
    setTimelineUploadProgress('Zapisywanie wpisu...');
    setTimelineUploadError(null);
    setTimelineSuccessMsg(null);
    try {
      if (onAddFutureNote) {
        await onAddFutureNote(srv.id, timelineNote, timelinePhotos);
      }
      setTimelineNote('');
      setTimelinePhotos([]);
      setTimelineSuccessMsg('Notatka została pomyślnie zapisana!');
      setTimeout(() => setTimelineSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Save note error:', err);
      setTimelineUploadError('Błąd zapisu: ' + err.message);
    } finally {
      setIsTimelineUploading(false);
      setTimelineUploadProgress('');
    }
  };

  const stepsList = [
    { id: 1, label: t('planned.timeline.step1', 'Przyjęcie do realizacji') },
    { id: 2, label: t('planned.timeline.step2', 'Wybór wykonawcy') },
    { id: 3, label: t('planned.timeline.step3', 'Realizacja serwisu (W trakcie)') },
    { id: 4, label: t('planned.timeline.step4', 'Podsumowanie serwisu') },
    { id: 5, label: t('planned.timeline.step5', 'Zakończony i rozliczony') },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
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
          <span className="font-bold uppercase text-white">
            {srv.status === 'in_progress'
              ? t('planned.status.in_progress', 'W trakcie')
              : srv.status === 'completed' || isCompleted
              ? t('planned.status.completed', 'Zakończony')
              : t('planned.status.pending', 'Oczekujący')}
          </span>
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
                      className={`ph ${isSelected ? 'ph-caret-up' : 'ph-caret-down'} text-gray-400`}
                    ></i>
                  </div>

                  {/* Treść rozwiniętego kroku */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-4 animate-fade-in min-w-0">
                      {!isActualStatus && !isCompleted && srv.status !== 'completed' && (
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

                      {/* ==================== KROK 1: PRZYJĘCIE DO REALIZACJI ==================== */}
                      {step.id === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600">
                            {t(
                              'planned.timeline.step1Desc',
                              'Przegląd oczekuje na przyjęcie do realizacji i przydzielenie zespołu technicznego.'
                            )}
                          </p>
                          {!isCompleted && srv.status !== 'completed' && (
                            <button
                              type="button"
                              data-testid="planned-accept-btn"
                              disabled={!isActualStatus}
                              onClick={handleStartService}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <i className="ph ph-check-circle text-xl"></i>{' '}
                              {t('planned.timeline.acceptServiceBtn', 'Przyjęcie do realizacji')}
                            </button>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 2: WYBÓR WYKONAWCY ==================== */}
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
                              disabled={
                                !isActualStatus || isCompleted || srv.status === 'completed'
                              }
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

                          {!isCompleted && srv.status !== 'completed' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                disabled={!isActualStatus || !selectedService}
                                onClick={handleConfirmContractor}
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
                                disabled={!isActualStatus}
                                onClick={() => {
                                  setSelectedStepOverride(1);
                                  updatePlannedService(srv.id, { currentStep: 1 });
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

                      {/* ==================== KROK 3: REALIZACJA SERWISU (W TRAKCIE) ==================== */}
                      {step.id === 3 && (
                        <div className="space-y-4">
                          {srv.assignedService && (
                            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                              <i className="ph ph-user-gear text-lg text-blue-600"></i>
                              <span>
                                {t('tickets.details.assignedContractor', 'Wyznaczony wykonawca')}:{' '}
                                <strong className="font-bold">{srv.assignedService}</strong>
                              </span>
                            </div>
                          )}

                          {/* Lista kontrolna dla kroku 3 */}
                          {srv.checklist && srv.checklist.length > 0 && (
                            <div className="w-full bg-white p-2.5 sm:p-3.5 rounded-xl shadow-sm border border-slate-200">
                              <h4 className="text-xs sm:text-sm font-bold mb-2 text-slate-800 border-b pb-1.5 flex items-center gap-2">
                                <i className="ph ph-clipboard-text text-blue-600 text-base"></i>
                                {t(
                                  'planned.timeline.checklistTitle',
                                  'Lista Kontrolna (Checklista do wykonania)'
                                )}
                              </h4>
                              <ChecklistExecutor
                                steps={srv.checklist}
                                disabled={!isActualStatus}
                                initialResponses={srv.checklistResponses || srv.responses || {}}
                                onComplete={async responses => {
                                  try {
                                    await updatePlannedService(srv.id, {
                                      checklistResponses: responses,
                                      responses,
                                      currentStep: 4,
                                    });
                                    setSelectedStepOverride(4);
                                    setTimelineSuccessMsg(
                                      'Checklista zatwierdzona! Przejście do podsumowania serwisu.'
                                    );
                                    setTimeout(() => setTimelineSuccessMsg(null), 3000);
                                  } catch (err) {
                                    console.error('Błąd zapisu checklisty:', err);
                                    setSelectedStepOverride(4);
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Formularz notatek i zdjęć z AI voice to text */}
                          {!isCompleted && srv.status !== 'completed' && (
                            <div
                              className={`pt-3 border-t border-slate-200/80 space-y-3 ${
                                !isActualStatus ? 'opacity-60' : ''
                              }`}
                            >
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                                <span>
                                  {t(
                                    'tickets.details.addNoteOrPhotoLabel',
                                    'Dodaj notatkę lub zdjęcie z prac:'
                                  )}
                                </span>
                                <span className="text-gray-400 font-normal lowercase">
                                  AI voice to text
                                </span>
                              </label>

                              <div className="relative">
                                <textarea
                                  value={timelineNote}
                                  onChange={e => {
                                    setTimelineNote(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  disabled={!isActualStatus || isTimelineUploading}
                                  className="w-full p-3.5 pr-12 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none text-sm bg-white shadow-sm transition-all min-h-[75px] disabled:bg-slate-100"
                                  rows="2"
                                  placeholder={t(
                                    'tickets.details.notePlaceholder',
                                    'Wpisz treść notatki lub użyj mikrofonu...'
                                  )}
                                ></textarea>
                                {isActualStatus && (
                                  <div className="absolute right-3 bottom-3">
                                    <DictationButton
                                      onResult={text =>
                                        setTimelineNote(prev => (prev ? prev + ' ' + text : text))
                                      }
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Podgląd wybranych zdjęć */}
                              {timelinePhotos.length > 0 && (
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                  <div className="text-xs font-bold text-slate-600 mb-2 flex justify-between items-center">
                                    <span>Załączone zdjęcia ({timelinePhotos.length}):</span>
                                    <button
                                      type="button"
                                      disabled={!isActualStatus}
                                      onClick={() => setTimelinePhotos([])}
                                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <i className="ph ph-trash"></i> Usuń wszystkie
                                    </button>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {timelinePhotos.map((url, idx) => (
                                      <div key={idx} className="relative group">
                                        <img
                                          src={url}
                                          alt="załącznik"
                                          className="w-14 h-14 object-cover rounded-lg border border-gray-300 shadow-sm"
                                        />
                                        {isActualStatus && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setTimelinePhotos(prev =>
                                                prev.filter((_, i) => i !== idx)
                                              )
                                            }
                                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                                            title="Usuń to zdjęcie"
                                          >
                                            &times;
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Przyciski aparatu i galerii */}
                              <div className="flex gap-2">
                                <label
                                  className={`flex-1 bg-white text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center ${
                                    isActualStatus
                                      ? 'cursor-pointer hover:bg-slate-50'
                                      : 'opacity-50 pointer-events-none'
                                  }`}
                                >
                                  <i className="ph ph-image text-lg text-slate-500"></i>{' '}
                                  {t('tickets.details.addPhotoBtn', 'Dodaj zdjęcie')}
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    disabled={!isActualStatus || isTimelineUploading}
                                    onChange={e => handlePhotoSelect(Array.from(e.target.files))}
                                  />
                                </label>

                                <label
                                  className={`flex-1 bg-white text-slate-700 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-300 shadow-sm text-center ${
                                    isActualStatus
                                      ? 'cursor-pointer hover:bg-slate-50'
                                      : 'opacity-50 pointer-events-none'
                                  }`}
                                >
                                  <i className="ph ph-camera text-lg text-slate-500"></i>{' '}
                                  {t('tickets.details.cameraBtn', 'Aparat')}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    disabled={!isActualStatus || isTimelineUploading}
                                    onChange={e => handlePhotoSelect(Array.from(e.target.files))}
                                  />
                                </label>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  !isActualStatus ||
                                  isTimelineUploading ||
                                  (!timelineNote.trim() && timelinePhotos.length === 0)
                                }
                                onClick={handleSaveNote}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {isTimelineUploading ? (
                                  <>
                                    <i className="ph ph-spinner-gap animate-spin text-xl"></i>{' '}
                                    {timelineUploadProgress || 'Wysyłanie...'}
                                  </>
                                ) : (
                                  <>
                                    <i className="ph ph-paper-plane-tilt text-xl"></i>{' '}
                                    {t('tickets.details.saveNotePhotoBtn', 'Zapisz notatkę/zdjęcie')}
                                  </>
                                )}
                              </button>

                              {onOpenPartModal && (
                                <button
                                  type="button"
                                  disabled={!isActualStatus}
                                  onClick={onOpenPartModal}
                                  className="w-full bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed text-orange-700 border border-orange-200 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <i className="ph ph-package text-lg"></i>{' '}
                                  {t(
                                    'planned.timeline.takePartBtn',
                                    'Pobierz część z magazynu do serwisu'
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Przyciski przejścia dalej i cofnięcia */}
                          {!isCompleted && srv.status !== 'completed' && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                              <button
                                type="button"
                                disabled={!isActualStatus}
                                onClick={handleGoToSummary}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-arrow-right text-xl"></i>{' '}
                                {t('planned.timeline.goToSummaryBtn', 'Przejdź do Podsumowania')}
                              </button>
                              <button
                                type="button"
                                disabled={!isActualStatus}
                                onClick={() => {
                                  setSelectedStepOverride(2);
                                  updatePlannedService(srv.id, { currentStep: 2 });
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

                      {/* ==================== KROK 4: PODSUMOWANIE SERWISU ==================== */}
                      {step.id === 4 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-800 leading-tight">
                                {t('planned.timeline.completeHeader', 'Zakończ Serwis')}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">{srv.name}</p>
                              <p className="text-[11px] text-purple-700 mt-1 leading-snug">
                                {t(
                                  'planned.timeline.smartAiHint',
                                  'Różdżka AI: podyktuj podsumowanie – uzupełni czas pracy, części, notatkę i tematy do realizacji.'
                                )}
                              </p>
                            </div>
                            {isActualStatus && (
                              <div className="shrink-0 bg-purple-50 border border-purple-200 rounded-xl p-1">
                                <DictationButton mode="smart" onResult={handleSmartSummaryResult} />
                              </div>
                            )}
                          </div>

                          {/* Czas pracy i Nr uprawnień inspektora / kontrolującego (wymagany przy HVAC i Facility) */}
                          <div
                            className={`grid grid-cols-1 ${
                              requiresInspectorLicense ? 'sm:grid-cols-2' : ''
                            } gap-3`}
                          >
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">
                                {t('planned.timeline.manHoursLabel', 'Czas pracy (RBG / Godziny)')}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                inputMode="decimal"
                                disabled={!isActualStatus}
                                value={summaryManHours}
                                onChange={e => setSummaryManHours(e.target.value)}
                                placeholder="np. 2.5"
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                              />
                            </div>
                            {requiresInspectorLicense && (
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center justify-between gap-2">
                                  <span>
                                    {t(
                                      'planned.timeline.inspectorLicenseLabel',
                                      'Nr uprawnień kontrolującego / inspektora (do protokołu c-KOB / F-Gaz)'
                                    )}{' '}
                                    <span className="text-red-600">*</span>
                                  </span>
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                    Wymagane
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  disabled={!isActualStatus}
                                  data-testid="timeline-inspector-license-input"
                                  value={inspectorLicense}
                                  onChange={e => {
                                    setInspectorLicense(e.target.value);
                                    if (licenseError) setLicenseError('');
                                  }}
                                  placeholder="np. POM/0123/OWOK/18, SEP E1/D1, FGAZ-O/..."
                                  className={`w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 outline-none disabled:bg-slate-100 ${
                                    licenseError
                                      ? 'border-red-400 focus:ring-red-500'
                                      : 'border-slate-300 focus:ring-amber-500'
                                  }`}
                                />
                                {licenseError && (
                                  <p
                                    data-testid="timeline-inspector-license-error"
                                    className="text-[11px] font-bold text-red-600 mt-1"
                                  >
                                    {licenseError}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Potwierdzenie zużycia części planowych */}
                          <label
                            htmlFor="timelineSummaryPartsUsed"
                            className={`flex items-center gap-2 ${
                              isActualStatus ? 'cursor-pointer' : 'opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              id="timelineSummaryPartsUsed"
                              disabled={!isActualStatus}
                              checked={summaryPartsUsed}
                              onChange={e => setSummaryPartsUsed(e.target.checked)}
                              className="w-4 h-4 text-orange-600 rounded border-slate-300 cursor-pointer shrink-0"
                            />
                            <span className="text-sm font-bold text-slate-700">
                              {t(
                                'planned.timeline.confirmPartsUsed',
                                'Potwierdzam zużycie wymaganych części'
                              )}
                            </span>
                          </label>

                          {/* Już pobrane części w ramach serwisu */}
                          {displayedPartsUsed && displayedPartsUsed.length > 0 && (
                            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-bold text-blue-900">
                                  Faktycznie pobrane części ({displayedPartsUsed.length})
                                </span>
                                <span className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                                  Łącznie:{' '}
                                  {displayedPartsUsed
                                    .reduce(
                                      (sum, tx) =>
                                        sum +
                                        (tx.totalCost
                                          ? Number(tx.totalCost)
                                          : Math.abs(Number(tx.quantity) || 1) *
                                            (Number(tx.price) || 0)),
                                      0
                                    )
                                    .toFixed(2)}{' '}
                                  PLN
                                </span>
                              </div>
                              {displayedPartsUsed.map((tx, idx) => {
                                const foundPart = parts.find(p => p.id === tx.partId);
                                const pName =
                                  foundPart?.name || tx.partName || 'Część z magazynu';
                                const pUnit = foundPart?.unit || tx.unit || 'szt.';
                                const qty = Math.abs(Number(tx.quantity) || 1);
                                const costVal = tx.totalCost
                                  ? Number(tx.totalCost)
                                  : qty * (Number(tx.price) || 0);
                                return (
                                  <div
                                    key={idx}
                                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs bg-white p-2 rounded-md border border-blue-100"
                                  >
                                    <span className="font-bold text-slate-800 min-w-0 break-words">
                                      {pName}
                                    </span>
                                    <span className="text-[11px] text-slate-600">
                                      Pobrano:{' '}
                                      <strong className="text-slate-800">
                                        {qty} {pUnit}
                                      </strong>{' '}
                                      ({tx.user || 'System'}) ·{' '}
                                      <strong className="text-blue-700">
                                        {costVal.toFixed(2)} PLN
                                      </strong>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Części poza planową listą */}
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                            <div className="flex justify-between items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-600">
                                Pobierz część poza planową listą
                              </span>
                              <button
                                type="button"
                                disabled={!isActualStatus}
                                onClick={() =>
                                  setSummaryExtraParts(prev => [
                                    ...prev,
                                    { partId: '', quantity: 1 },
                                  ])
                                }
                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold hover:bg-orange-200 disabled:opacity-50 shrink-0 cursor-pointer"
                              >
                                + Dodaj
                              </button>
                            </div>
                            {summaryExtraParts.length === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                Brak dodatkowych części
                              </p>
                            )}
                            {summaryExtraParts.map((ep, idx) => {
                              const selPart = parts.find(p => p.id === ep.partId);
                              const epUnit = selPart?.unit || 'szt.';
                              return (
                                <div key={idx} className="flex gap-2 items-center mb-2 last:mb-0">
                                  <select
                                    disabled={!isActualStatus}
                                    value={ep.partId}
                                    onChange={e => {
                                      const copy = [...summaryExtraParts];
                                      copy[idx] = { ...copy[idx], partId: e.target.value };
                                      setSummaryExtraParts(copy);
                                    }}
                                    className="flex-1 min-w-0 p-1.5 border border-slate-200 rounded text-xs bg-white outline-none"
                                  >
                                    <option value="">-- Wybierz część --</option>
                                    {parts.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} (Stan: {p.stock || 0} {p.unit || 'szt.'})
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    disabled={!isActualStatus}
                                    value={ep.quantity}
                                    onChange={e => {
                                      const copy = [...summaryExtraParts];
                                      copy[idx] = { ...copy[idx], quantity: e.target.value };
                                      setSummaryExtraParts(copy);
                                    }}
                                    className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center outline-none"
                                    placeholder={epUnit}
                                  />
                                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                                    {epUnit}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={!isActualStatus}
                                    onClick={() =>
                                      setSummaryExtraParts(prev =>
                                        prev.filter((_, i) => i !== idx)
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                                    title="Usuń pozycję"
                                  >
                                    <i className="ph ph-trash"></i>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Notatki z wykonania */}
                          <div>
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <label className="text-sm font-bold text-slate-700">
                                Notatki z wykonania
                              </label>
                              <span className="text-xs text-gray-400 font-normal shrink-0">
                                AI voice to text
                              </span>
                            </div>
                            <div className="relative">
                              <textarea
                                disabled={!isActualStatus}
                                value={summaryNotes}
                                onChange={e => setSummaryNotes(e.target.value)}
                                placeholder="Opcjonalne notatki..."
                                className="w-full p-3 pr-12 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] disabled:bg-slate-100"
                              />
                              {isActualStatus && (
                                <div className="absolute right-2 top-2">
                                  <DictationButton
                                    onResult={text =>
                                      setSummaryNotes(prev => (prev ? prev + ' ' + text : text))
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sekcja F-Gazy (HVAC / Pompy ciepła / Klimatyzacja) — widoczna dla profilu HVAC lub maszyn z czynnikiem, aktywna WYŁĄCZNIE gdy Krok 4 jest aktywnym etapem */}
                          {canShowFGasSection && (
                            <div className="border border-cyan-200 rounded-xl bg-cyan-50/40 overflow-hidden">
                              <button
                                type="button"
                                disabled={!isActualStatus || isCompleted}
                                onClick={() => {
                                  if (!isActualStatus || isCompleted) return;
                                  setShowFGasSection(prev => !prev);
                                }}
                                data-testid="service-fgas-toggle-btn"
                                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${
                                  isActualStatus && !isCompleted
                                    ? 'hover:bg-cyan-50 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                                  <i className="ph ph-snowflake text-base text-cyan-600"></i>
                                  Protokół F-Gaz / Próba szczelności (HVAC / CRO)
                                </span>
                                <span className="text-[11px] font-bold text-cyan-700 flex items-center gap-1">
                                  {showFGasSection && isActualStatus && !isCompleted
                                    ? 'Ukryj'
                                    : 'Rozwiń'}
                                  <i
                                    className={`ph ${
                                      showFGasSection && isActualStatus && !isCompleted
                                        ? 'ph-caret-up'
                                        : 'ph-caret-down'
                                    }`}
                                  ></i>
                                </span>
                              </button>
                              {showFGasSection && isActualStatus && !isCompleted && (
                                <div className="p-3.5 pt-2 bg-white border-t border-cyan-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Wynik próby szczelności
                                    </label>
                                    <select
                                      disabled={!isActualStatus || isCompleted}
                                      value={leakTestResult}
                                      onChange={e => setLeakTestResult(e.target.value)}
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none disabled:bg-slate-100 disabled:opacity-60"
                                    >
                                      {LEAK_TEST_RESULTS.map(res => (
                                        <option key={res.id} value={res.id}>
                                          {res.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Rodzaj czynnika chłodniczego
                                    </label>
                                    <select
                                      disabled={!isActualStatus || isCompleted}
                                      value={refrigerantType}
                                      onChange={e => setRefrigerantType(e.target.value)}
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none disabled:bg-slate-100 disabled:opacity-60"
                                    >
                                      <option value="">-- Brak (Nie dotyczy) --</option>
                                      {Object.values(REFRIGERANT_TYPES).map(ref => (
                                        <option key={ref.code} value={ref.code}>
                                          {ref.name} (GWP: {ref.gwp})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Uzupełniono czynnik (kg)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      disabled={!isActualStatus || isCompleted}
                                      value={addedRefrigerantKg}
                                      onChange={e => setAddedRefrigerantKg(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none disabled:bg-slate-100 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Odzyskano czynnik (kg)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      disabled={!isActualStatus || isCompleted}
                                      value={recoveredRefrigerantKg}
                                      onChange={e => setRecoveredRefrigerantKg(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none disabled:bg-slate-100 disabled:opacity-60"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Podpis cyfrowy klienta / odbierającego */}
                          <SignaturePad
                            label={profileConfig.clientSignatureLabel}
                            collapsible={true}
                            disabled={!isActualStatus || isCompleted}
                            value={clientSignature}
                            signerName={clientSignerName}
                            onSignerNameChange={setClientSignerName}
                            onChange={sig => {
                              setClientSignature(sig.signatureDataUrl || '');
                              if (sig.signerName !== undefined) setClientSignerName(sig.signerName);
                            }}
                          />

                          {/* Kolejny cykl */}
                          <label
                            htmlFor="timelineSummaryNextPlan"
                            className={`flex items-center gap-2 ${
                              isActualStatus ? 'cursor-pointer' : 'opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              id="timelineSummaryNextPlan"
                              disabled={!isActualStatus}
                              checked={summaryCreateNewPlan}
                              onChange={e => setSummaryCreateNewPlan(e.target.checked)}
                              className="w-4 h-4 text-green-600 rounded border-slate-300 cursor-pointer shrink-0"
                            />
                            <span className="text-sm font-bold text-slate-700">
                              Wygeneruj automatycznie kolejny termin przeglądu
                            </span>
                          </label>

                          {/* Temat do realizacji (Action Item) */}
                          <div className="border-t border-slate-200 pt-3 space-y-3">
                            <label
                              htmlFor="timelineSummaryActionItem"
                              className={`flex items-center gap-2 ${
                                isActualStatus ? 'cursor-pointer' : 'opacity-60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                id="timelineSummaryActionItem"
                                disabled={!isActualStatus}
                                checked={summaryCreateActionItem}
                                onChange={e => setSummaryCreateActionItem(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer shrink-0"
                              />
                              <span className="text-sm font-bold text-slate-700">
                                Dodaj do Tematy do Realizacji
                              </span>
                            </label>
                            {summaryCreateActionItem && (
                              <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div>
                                  <label className="block text-xs font-bold text-blue-800 mb-1">
                                    Opis tematu do realizacji
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      disabled={!isActualStatus}
                                      value={summaryActionItemDetails}
                                      onChange={e => setSummaryActionItemDetails(e.target.value)}
                                      placeholder="np. wymiana paska napędowego"
                                      className="w-full p-2 pr-12 rounded border border-blue-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    {isActualStatus && (
                                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                        <DictationButton
                                          onResult={text =>
                                            setSummaryActionItemDetails(prev =>
                                              prev ? prev + ' ' + text : text
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-blue-800 mb-1">
                                    Data wymagalności (termin)
                                  </label>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="date"
                                      disabled={!isActualStatus}
                                      value={summaryActionItemDueDate}
                                      onChange={e => setSummaryActionItemDueDate(e.target.value)}
                                      className="flex-1 min-w-[140px] p-2 rounded border border-blue-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <div className="flex gap-1">
                                      {[7, 14, 30].map(days => (
                                        <button
                                          key={days}
                                          type="button"
                                          disabled={!isActualStatus}
                                          onClick={() => setQuickActionItemDueDate(days)}
                                          className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 whitespace-nowrap disabled:opacity-50"
                                        >
                                          +{days} dni
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Przyciski zakończenia i cofnięcia */}
                          {!isCompleted && srv.status !== 'completed' && (
                            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-slate-200">
                              <button
                                type="button"
                                disabled={!isActualStatus}
                                onClick={() => {
                                  setSelectedStepOverride(3);
                                  updatePlannedService(srv.id, { currentStep: 3 });
                                }}
                                className="bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="ph ph-arrow-left text-lg"></i> Cofnij do Realizacji
                              </button>
                              <button
                                type="button"
                                disabled={!isActualStatus || isCompletingService}
                                onClick={handleCompleteServiceFromStep4}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {isCompletingService ? (
                                  <>
                                    <i className="ph ph-spinner-gap animate-spin text-xl"></i>{' '}
                                    Rozliczanie serwisu...
                                  </>
                                ) : (
                                  <>
                                    <i className="ph ph-check-circle text-xl"></i> Zatwierdź
                                    Wykonanie
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ==================== KROK 5: ZAKOŃCZONY I ROZLICZONY ==================== */}
                      {step.id === 5 && (
                        <div className="space-y-3">
                          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                            <i className="ph ph-check-circle text-2xl text-emerald-600 shrink-0"></i>
                            <div>
                              <p className="font-bold text-emerald-950">
                                Serwis został pomyślnie zrealizowany i przeniesiony do historii
                              </p>
                              {(srv.completedBy || srv.completionDetails?.completedBy) && (
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  Rozliczył:{' '}
                                  <strong className="font-bold">
                                    {srv.completedBy || srv.completionDetails?.completedBy}
                                  </strong>
                                </p>
                              )}
                            </div>
                          </div>
                          {(srv.clientSignature || srv.completionDetails?.clientSignature) && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>Podpis odbierającego:</span>
                                {(srv.clientSignerName ||
                                  srv.completionDetails?.clientSignerName) && (
                                  <span className="text-slate-900">
                                    {srv.clientSignerName ||
                                      srv.completionDetails?.clientSignerName}
                                  </span>
                                )}
                              </div>
                              <img
                                src={srv.clientSignature || srv.completionDetails?.clientSignature}
                                alt="Podpis klienta"
                                className="max-h-20 bg-white border border-slate-200 rounded p-1"
                              />
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

        {/* ==================== PRZYCISK ZAKOŃCZ SERWIS (POMIŃ KROKI) NA SAMYM DOLE — ZAWSZE AKTYWNY ==================== */}
        {!isCompleted && srv.status !== 'completed' && (
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={isArchive}
              onClick={() => setServiceToComplete && setServiceToComplete(srv)}
              className="w-full bg-emerald-50 border-2 border-emerald-500 hover:bg-emerald-100 text-emerald-700 px-3 py-2 md:px-5 md:py-3.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ph ph-check-circle text-lg md:text-xl"></i>
              {t('planned.timeline.skipStepsCompleteBtn', 'Zakończ serwis (Pomiń Kroki)')}
            </button>
          </div>
        )}

        {/* Komunikaty o błędach i sukcesach */}
        {timelineUploadError && (
          <p className="text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs text-center font-medium">
            {timelineUploadError}
          </p>
        )}
        {timelineSuccessMsg && (
          <p className="text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200 text-xs text-center font-bold">
            ✓ {timelineSuccessMsg}
          </p>
        )}

        {/* Dolne przyciski edycji i usunięcia */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 mt-2">
          {!isCompleted && srv.status !== 'in_progress' && canEditPlanned && (
            <button
              type="button"
              onClick={() => onEdit(srv)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <i className="ph ph-pencil-simple text-xl"></i> {t('admin.users.edit')}
            </button>
          )}
          {canDeletePlanned && (!isArchive || allowTicketDeletion) && (
            <button
              type="button"
              onClick={() => {
                onDelete(srv.id);
                onBack();
              }}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-3.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer"
            >
              <i className="ph ph-trash text-xl"></i> {t('planned.delete_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
