import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { completeServiceWithTransaction } from '../../services/plannedServices.service';
import DictationButton from '../shared/DictationButton';
import SignaturePad from '../shared/SignaturePad';
import { useManagerStore } from '../../store/managerStore';
import { normalizeSmartSummary, daysFromNowISODate } from '../../utils/smartSummaryParser';
import {
  formatFGasSummary,
  getIndustryProfileConfig,
  isInspectorLicenseRequired,
} from '../../utils/fieldServiceHelpers';

export default function PlannedMaintenanceCompletionModal({
  isOpen,
  onClose,
  onCompleted,
  serviceToComplete,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const machines = useManagerStore(state => state.machines || []);
  const services = useManagerStore(state => state.services || []);
  const branding = useManagerStore(state => state.branding || {});
  const industryProfile = branding?.industryProfile || 'industrial';
  const profileConfig = getIndustryProfileConfig(industryProfile);

  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  const [partsUsed, setPartsUsed] = useState(false);
  const [actualManHours, setActualManHours] = useState('');
  const [extraParts, setExtraParts] = useState([]);
  const [alreadyUsedParts, setAlreadyUsedParts] = useState([]);

  // Field Service / HVAC F-Gaz / Podpis cyfrowy
  const [showFGasSection, setShowFGasSection] = useState(false);
  const [leakTestResult, setLeakTestResult] = useState('');
  const [refrigerantAddedKg, setRefrigerantAddedKg] = useState('');
  const [refrigerantRecoveredKg, setRefrigerantRecoveredKg] = useState('');
  const [clientSignature, setClientSignature] = useState('');
  const [clientSignerName, setClientSignerName] = useState('');
  const [inspectorLicense, setInspectorLicense] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const requiresInspectorLicense = isInspectorLicenseRequired(industryProfile);

  const parts = useManagerStore(state => state.parts || []);

  const currentMachine = serviceToComplete?.machineId
    ? machines.find(m => m.id === serviceToComplete.machineId)
    : null;
  const canShowFGasSection =
    industryProfile !== 'industrial' &&
    (industryProfile === 'hvac' || Boolean(currentMachine?.refrigerantType));

  useEffect(() => {
    if (
      industryProfile !== 'industrial' &&
      (currentMachine?.refrigerantType || industryProfile === 'hvac')
    ) {
      setShowFGasSection(true);
    } else {
      setShowFGasSection(false);
    }
    if (currentMachine?.contactPerson && !clientSignerName) {
      setClientSignerName(currentMachine.contactPerson);
    }
    const matchedSrv = (services || []).find(
      s =>
        s.name === (serviceToComplete?.assignedService || serviceToComplete?.assignedTo) ||
        s.id === (serviceToComplete?.assignedService || serviceToComplete?.assignedTo)
    );
    const defaultLic =
      serviceToComplete?.inspectorLicense ||
      serviceToComplete?.completionDetails?.inspectorLicense ||
      matchedSrv?.licenseNumber ||
      user?.licenseNumber ||
      '';
    if (defaultLic) {
      setInspectorLicense(defaultLic);
    }
  }, [
    currentMachine?.id,
    currentMachine?.refrigerantType,
    industryProfile,
    serviceToComplete?.id,
    serviceToComplete?.assignedService,
    user?.licenseNumber,
    services,
  ]);

  useEffect(() => {
    if (serviceToComplete?.id) {
      import('../../hooks/usePartTransactions').then(({ fetchTransactionsForReference }) => {
        import('../../utils/tenantHelper').then(({ getCurrentTenant }) => {
          fetchTransactionsForReference(getCurrentTenant(), serviceToComplete.id).then(txs => {
            const filtered = (txs || []).filter(
              tx =>
                tx.referenceId === serviceToComplete.id &&
                (tx.type === 'issue_planned' || tx.type === 'issue_adhoc')
            );
            setAlreadyUsedParts(filtered);
          });
        });
      });
    }
  }, [serviceToComplete?.id]);

  if (!isOpen || !serviceToComplete) return null;

  const getMachine = id => machines.find(m => m.id === id);

  const handleSmartAiResult = result => {
    const r = normalizeSmartSummary(result);
    if (r.note) {
      setCompletionNotes(prev => (prev ? prev + '\n' + r.note : r.note));
    }
    if (r.manHours !== undefined) {
      setActualManHours(String(r.manHours));
    }
    if (r.partsUsed !== undefined) {
      setPartsUsed(r.partsUsed);
    }
    if (r.createActionItem) {
      setCreateActionItem(true);
      if (r.actionItemDetails) setActionItemProblem(r.actionItemDetails);
      if (r.actionItemDays && r.actionItemDays > 0) {
        setActionItemDueDate(daysFromNowISODate(r.actionItemDays));
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (requiresInspectorLicense && !inspectorLicense.trim()) {
      setLicenseError(
        'Podaj numer uprawnień kontrolującego / inspektora (wymagane dla profilu HVAC i Facility c-KOB).'
      );
      return;
    }
    setLicenseError('');
    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = {
          name: serviceToComplete.name,
          machineId: serviceToComplete.machineId || '',
          machineName:
            serviceToComplete.machineName || getMachine(serviceToComplete.machineId)?.name || '',
          priority: serviceToComplete.priority,
          category: serviceToComplete.category || 'preventive',
          triggerType: serviceToComplete.triggerType,
          estimatedDowntimeHours: serviceToComplete.estimatedDowntimeHours,
          estimatedManHours: serviceToComplete.estimatedManHours,
          requiredPersonnel: serviceToComplete.requiredPersonnel,
          machineStatus: serviceToComplete.machineStatus,
          notified: false,
          checklist: serviceToComplete.checklist || [],
          toolsType: serviceToComplete.toolsType || 'Podstawowe',
          specialTools: serviceToComplete.specialTools || '',
          otherTools: serviceToComplete.otherTools || '',
          requiredParts: serviceToComplete.requiredParts || [],
          futureNotes: serviceToComplete.futureNotes || [],
          assignedService: serviceToComplete.assignedService || serviceToComplete.assignedTo || '',
          additionalDescription: serviceToComplete.additionalDescription || '',
        };
        if (
          serviceToComplete.triggerType === 'calendar' ||
          serviceToComplete.triggerType === 'mixed'
        ) {
          nextPlanData.calendarIntervalDays = serviceToComplete.calendarIntervalDays;
          const nextD = new Date();
          nextD.setDate(nextD.getDate() + (serviceToComplete.calendarIntervalDays || 30));
          nextPlanData.nextDate = nextD;
        }
        if (
          serviceToComplete.triggerType === 'hours' ||
          serviceToComplete.triggerType === 'mixed'
        ) {
          nextPlanData.hoursInterval = serviceToComplete.hoursInterval;
          const machine = getMachine(serviceToComplete.machineId);
          const currentH = machine?.currentWorkHours || 0;
          nextPlanData.targetWorkHours = currentH + (serviceToComplete.hoursInterval || 500);
        }
      }

      const checklistResponses =
        serviceToComplete.checklistResponses || serviceToComplete.responses || {};
      let checklistSummary = [];
      if (serviceToComplete.checklist) {
        checklistSummary = serviceToComplete.checklist.map(step => ({
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

      const fGasProtocol =
        leakTestResult ||
        Number(refrigerantAddedKg) > 0 ||
        Number(refrigerantRecoveredKg) > 0 ||
        currentMachine?.refrigerantType
          ? {
              refrigerantType: currentMachine?.refrigerantType || '',
              refrigerantChargeKg: currentMachine?.refrigerantChargeKg || null,
              leakTestResult: leakTestResult || null,
              refrigerantAddedKg:
                refrigerantAddedKg !== '' && Number(refrigerantAddedKg) > 0
                  ? Number(refrigerantAddedKg)
                  : 0,
              refrigerantRecoveredKg:
                refrigerantRecoveredKg !== '' && Number(refrigerantRecoveredKg) > 0
                  ? Number(refrigerantRecoveredKg)
                  : 0,
            }
          : null;

      const fGasNoteStr = fGasProtocol ? formatFGasSummary(fGasProtocol) : '';
      const sigNoteStr =
        clientSignature && clientSignerName
          ? `Odebrał i podpisał: ${clientSignerName}`
          : clientSignature
          ? 'Dołączono podpis cyfrowy odbioru'
          : '';

      const combinedNoteParts = [completionNotes, fGasNoteStr, sigNoteStr].filter(
        Boolean
      );

      const historyEntry = {
        manHours: actualManHours ? Number(actualManHours) : null,
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Zakończono serwis',
        note: combinedNoteParts.join('\n'),
        checklistSummary,
        partsUsed,
        fGasProtocol,
        clientSignerName: clientSignerName || null,
        inspectorLicense: inspectorLicense && inspectorLicense.trim() ? inspectorLicense.trim() : null,
      };

      const completionData = {
        completedBy: user?.name || 'System',
        notes: completionNotes,
        manHours: actualManHours ? Number(actualManHours) : null,
        checklistResponses,
        historyEntry,
        partsUsed,
        fGasProtocol,
        completedGps: serviceToComplete?.completedGps || null,
        clientSignature: clientSignature || null,
        clientSignerName: clientSignerName || null,
        inspectorLicense: inspectorLicense && inspectorLicense.trim() ? inspectorLicense.trim() : null,
      };

      const validExtraParts = extraParts.filter(
        ep => ep.partId && ep.partId !== '' && Number(ep.quantity) > 0
      );

      let actionItemDataObj = null;
      if (createActionItem && actionItemProblem.trim()) {
        actionItemDataObj = {
          machineId: serviceToComplete.machineId || '',
          plannedServiceId: serviceToComplete.id || '',
          problem: actionItemProblem.trim(),
          dueDate: actionItemDueDate ? new Date(actionItemDueDate).toISOString() : null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: user?.name || 'Nieznany',
        };
      }

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
        serviceToComplete,
        completionData,
        nextPlanData,
        actionItemDataObj,
        validExtraParts
      );

      if (onCompleted) {
        onCompleted({
          ...serviceToComplete,
          status: 'completed',
          currentStep: 5,
          completedAt: historyEntry.date,
          completedBy: completionData.completedBy,
          manHours: completionData.manHours,
          completionNotes,
          checklistResponses,
          fGasProtocol,
          completedGps: completionData.completedGps,
          clientSignature: clientSignature || null,
          clientSignerName: clientSignerName || null,
          inspectorLicense: inspectorLicense && inspectorLicense.trim() ? inspectorLicense.trim() : null,
          completionDetails: completionData,
          history: [...(serviceToComplete.history || []), historyEntry],
        });
      }

      setCompletionNotes('');
      setCreateNewPlan(true);
      setCreateActionItem(false);
      setActionItemProblem('');
      setActionItemDueDate('');
      setPartsUsed(false);
      setLeakTestResult('');
      setRefrigerantAddedKg('');
      setRefrigerantRecoveredKg('');
      setClientSignature('');
      setClientSignerName('');

      onClose();
    } catch (err) {
      console.error(err);
      alert('Błąd: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-scale-in max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {t('planned.complete_service')}
            </h3>
            <p className="text-sm text-slate-600 font-bold">{serviceToComplete.name}</p>
          </div>
          <div
            className="flex items-center gap-2 bg-purple-50 p-1.5 px-3 rounded-xl border border-purple-200 shadow-sm"
            title="Inteligentne podsumowanie głosowe (AI)"
          >
            <span className="text-xs font-bold text-purple-800 hidden sm:inline">Smart AI</span>
            <DictationButton mode="smart" onResult={handleSmartAiResult} />
          </div>
        </div>

        <div
          className={`mb-4 grid grid-cols-1 ${
            requiresInspectorLicense ? 'sm:grid-cols-2' : ''
          } gap-3`}
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Czas pracy (RBG / Godziny)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={actualManHours}
              onChange={e => setActualManHours(e.target.value)}
              placeholder="np. 2.5"
            />
          </div>
          {requiresInspectorLicense && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between gap-2">
                <span>
                  Nr uprawnień kontrolującego / inspektora (do protokołu c-KOB / F-Gaz){' '}
                  <span className="text-red-600">*</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  Wymagane
                </span>
              </label>
              <input
                type="text"
                required
                data-testid="modal-inspector-license-input"
                className={`w-full p-2 border rounded-lg text-sm focus:ring-2 ${
                  licenseError
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-amber-500'
                }`}
                value={inspectorLicense}
                onChange={e => {
                  setInspectorLicense(e.target.value);
                  if (licenseError) setLicenseError('');
                }}
                placeholder="np. POM/0123/OWOK/18, SEP E1/D1, FGAZ-O/..."
              />
              {licenseError && (
                <p
                  data-testid="modal-inspector-license-error"
                  className="text-[11px] font-bold text-red-600 mt-1"
                >
                  {licenseError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              id="partsUsed"
              type="checkbox"
              checked={partsUsed}
              onChange={e => setPartsUsed(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-slate-300"
            />
            <label htmlFor="partsUsed" className="text-sm font-bold text-slate-700 cursor-pointer">
              {t('planned.confirm_parts')}
            </label>
          </div>

          {alreadyUsedParts.length > 0 && (
            <div className="mb-4 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
              <div className="text-xs font-bold text-blue-900 mb-2 flex items-center justify-between">
                <span>Faktycznie pobrane części ({alreadyUsedParts.length}):</span>
                <span className="text-[11px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded-full">
                  Łącznie:{' '}
                  {alreadyUsedParts
                    .reduce(
                      (sum, tx) =>
                        sum +
                        (tx.totalCost
                          ? Number(tx.totalCost)
                          : Math.abs(Number(tx.quantity) || 1) * (Number(tx.price) || 0)),
                      0
                    )
                    .toFixed(2)}{' '}
                  PLN
                </span>
              </div>
              <div className="space-y-1.5">
                {alreadyUsedParts.map((tx, idx) => {
                  const foundPart = parts.find(p => p.id === tx.partId);
                  const pName = foundPart?.name || tx.partName || 'Część';
                  const pUnit = foundPart?.unit || tx.unit || 'szt.';
                  const qty = Math.abs(Number(tx.quantity) || 1);
                  const cost = tx.totalCost
                    ? Number(tx.totalCost).toFixed(2)
                    : (qty * (Number(tx.price) || 0)).toFixed(2);
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs bg-white p-2 rounded border border-blue-100"
                    >
                      <span className="font-bold text-slate-800">{pName}</span>
                      <div className="text-slate-600 text-[11px]">
                        <span>
                          Pobrano: {qty} {pUnit} ({tx.user || 'System'})
                        </span>{' '}
                        | <strong className="text-blue-700">{cost} PLN</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra parts outside the plan */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600">
                Pobierz część poza planową listą
              </span>
              <button
                type="button"
                onClick={() => setExtraParts(prev => [...prev, { partId: '', quantity: 1 }])}
                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold hover:bg-orange-200"
              >
                + Dodaj
              </button>
            </div>
            {extraParts.length === 0 && (
              <p className="text-xs text-slate-400 italic">Brak dodatkowych części</p>
            )}
            {extraParts.map((ep, idx) => {
              const selPart = parts.find(p => p.id === ep.partId);
              const epUnit = selPart?.unit || 'szt.';
              return (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <select
                    value={ep.partId}
                    onChange={e => {
                      const updated = [...extraParts];
                      updated[idx].partId = e.target.value;
                      setExtraParts(updated);
                    }}
                    className="flex-1 min-w-0 p-1.5 border border-slate-200 rounded text-xs bg-white outline-none"
                  >
                    <option value="">-- Wybierz część --</option>
                    {parts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stan: {p.stock} {p.unit || 'szt.'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={ep.quantity}
                    onChange={e => {
                      const updated = [...extraParts];
                      updated[idx].quantity = e.target.value;
                      setExtraParts(updated);
                    }}
                    className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center outline-none"
                    placeholder={epUnit}
                  />
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">{epUnit}</span>
                  <button
                    type="button"
                    onClick={() => setExtraParts(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <i className="ph ph-trash"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-bold text-slate-700">
              {t('planned.exec_notes')}
            </label>
            <span className="text-xs text-gray-400 font-normal">AI voice to text</span>
          </div>
          <div className="relative">
            <textarea
              className="w-full p-3 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[90px]"
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              placeholder="Opcjonalne notatki..."
            ></textarea>
            <div className="absolute right-2 top-2">
              <DictationButton
                onResult={text => setCompletionNotes(prev => (prev ? prev + ' ' + text : text))}
              />
            </div>
          </div>
        </div>

        {/* Sekcja: Protokół F-Gaz (HVAC) */}
        <div className="mb-4 space-y-3">
          {/* Protokół F-Gaz / Próba szczelności (widoczny dla branży HVAC lub urządzeń z czynnikiem) */}
          {canShowFGasSection && (
            <div className="border border-cyan-200 rounded-xl bg-cyan-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFGasSection(prev => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-cyan-900 hover:bg-cyan-50 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <i className="ph ph-snowflake text-cyan-600 text-base"></i>
                  Protokół F-Gaz / Próba szczelności (HVAC / CRO)
                  {currentMachine?.refrigerantType && (
                    <span className="bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded text-[10px]">
                      {currentMachine.refrigerantType}
                    </span>
                  )}
                </span>
                <i className={`ph ${showFGasSection ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
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
                      data-testid="fgas-leak-test-select"
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">-- Nie wykonywano / Nie dotyczy --</option>
                      <option value="positive">POZYTYWNY (Układ szczelny)</option>
                      <option value="negative">NEGATYWNY (Stwierdzono wyciek - do naprawy)</option>
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
                        data-testid="fgas-added-input"
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
                        data-testid="fgas-recovered-input"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Podpis cyfrowy klienta / odbierającego na ekranie */}
          <SignaturePad
            label={profileConfig.clientSignatureLabel}
            collapsible={true}
            value={clientSignature}
            signerName={clientSignerName}
            onSignerNameChange={setClientSignerName}
            onChange={({ signatureDataUrl, signerName }) => {
              setClientSignature(signatureDataUrl);
              if (signerName !== undefined) setClientSignerName(signerName);
            }}
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="createNewPlan"
            checked={createNewPlan}
            onChange={e => setCreateNewPlan(e.target.checked)}
            className="w-4 h-4 text-green-600 rounded border-slate-300"
          />
          <label
            htmlFor="createNewPlan"
            className="text-sm font-bold text-slate-700 cursor-pointer"
          >
            {t('planned.auto_next_plan')}
          </label>
        </div>

        <div className="mb-6 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="createActionItem"
              checked={createActionItem}
              onChange={e => setCreateActionItem(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <label
              htmlFor="createActionItem"
              className="text-sm font-bold text-slate-700 cursor-pointer"
            >
              {t('planned.add_to_tasks')}
            </label>
          </div>
          {createActionItem && (
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">
                  {t('planned.problem_desc')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={actionItemProblem}
                    onChange={e => setActionItemProblem(e.target.value)}
                    className="w-full p-2 pr-10 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-1 top-1">
                    <DictationButton
                      onResult={text => setActionItemProblem(prev => (prev ? prev + ' ' + text : text))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">
                  {t('planned.expected_date')}
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="date"
                    value={actionItemDueDate}
                    onChange={e => setActionItemDueDate(e.target.value)}
                    className="w-full sm:w-auto flex-1 p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setActionItemDueDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 shadow-2xs"
                    >
                      +7 dni
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 14);
                        setActionItemDueDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 shadow-2xs"
                    >
                      +14 dni
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setActionItemDueDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 shadow-2xs"
                    >
                      +30 dni
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm"
          >
            {t('planned.confirm_exec')}
          </button>
        </div>
      </form>
    </div>
  );
}
