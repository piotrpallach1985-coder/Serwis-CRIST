import { useAuth } from '../../hooks/useAuth';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { markServiceCompleted, processServicePartsTransaction } from '../../services/plannedServices.service';
import { addActionItem } from '../../services/tickets.service';
import DictationButton from '../shared/DictationButton';
import { useManagerStore } from '../../store/managerStore';

export default function PlannedMaintenanceCompletionModal({
  isOpen, onClose, serviceToComplete }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const machines = useManagerStore(state => state.machines || []);
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  const [partsUsed, setPartsUsed] = useState(false);
  const [actualManHours, setActualManHours] = useState('');
  const [extraParts, setExtraParts] = useState([]);
  const parts = useManagerStore(state => state.parts || []);

  if (!isOpen || !serviceToComplete) return null;

  const getMachine = (id) => machines.find(m => m.id === id);

  const handleSmartAiResult = (result) => {
    if (typeof result === 'object' && result !== null) {
      if (result.note) setCompletionNotes(prev => prev ? prev + ' \n' + result.note : result.note);
      if (result.timeSpentHours) setActualManHours(result.timeSpentHours);
      if (result.actionItem) {
        setCreateActionItem(true);
        setActionItemProblem(result.actionItem);
        if (result.actionItemDays) {
          const d = new Date();
          d.setDate(d.getDate() + result.actionItemDays);
          setActionItemDueDate(d.toISOString().split('T')[0]);
        }
      }
    } else {
      setCompletionNotes(prev => prev ? prev + ' ' + result : result);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = { 
          name: serviceToComplete.name, 
          machineId: serviceToComplete.machineId || '', 
            machineName: serviceToComplete.machineName || (getMachine(serviceToComplete.machineId)?.name) || '', 
          priority: serviceToComplete.priority, 
          triggerType: serviceToComplete.triggerType, 
          estimatedDowntimeHours: serviceToComplete.estimatedDowntimeHours, 
          estimatedManHours: serviceToComplete.estimatedManHours, 
          requiredPersonnel: serviceToComplete.requiredPersonnel, 
          machineStatus: serviceToComplete.machineStatus, 
          notified: false, 
          checklist: serviceToComplete.checklist || [], 
          futureNotes: serviceToComplete.futureNotes || [] 
        };
        if (serviceToComplete.triggerType === 'calendar' || serviceToComplete.triggerType === 'mixed') { 
          nextPlanData.calendarIntervalDays = serviceToComplete.calendarIntervalDays; 
          const nextD = new Date(); 
          nextD.setDate(nextD.getDate() + (serviceToComplete.calendarIntervalDays || 30)); 
          nextPlanData.nextDate = nextD; 
        }
        if (serviceToComplete.triggerType === 'hours' || serviceToComplete.triggerType === 'mixed') { 
          nextPlanData.hoursInterval = serviceToComplete.hoursInterval; 
          const machine = getMachine(serviceToComplete.machineId); 
          const currentH = machine?.currentWorkHours || 0; 
          nextPlanData.targetWorkHours = currentH + (serviceToComplete.hoursInterval || 500); 
        }
      }

      const checklistResponses = serviceToComplete.checklistResponses || {};
      let checklistSummary = [];
      if (serviceToComplete.checklist) {
        checklistSummary = serviceToComplete.checklist.map(step => ({
          step: step.text,
          answer: checklistResponses.values?.[step.id] === undefined ? (checklistResponses[step.id] === undefined ? null : checklistResponses[step.id]) : checklistResponses.values[step.id],
          note: checklistResponses.notes?.[step.id] || '',
          photos: checklistResponses.photos?.[step.id] || []
        }));
      }

      const historyEntry = { 
        manHours: actualManHours ? Number(actualManHours) : null, 
        date: new Date().toISOString(), 
        user: user?.name || 'System', 
        action: 'Zakończono serwis', 
        note: completionNotes, 
        checklistSummary, 
        partsUsed 
      };
      
      let finalCost = 0;
      if (partsUsed && serviceToComplete.requiredParts && serviceToComplete.requiredParts.length > 0) {
        finalCost = await processServicePartsTransaction({...serviceToComplete, completedBy: user?.name || 'System'});
      }
      
      // Issue extra (unplanned) parts
      const validExtraParts = extraParts.filter(ep => ep.partId && ep.partId !== '' && Number(ep.quantity) > 0);
      if (validExtraParts.length > 0) {
        const { issuePart } = await import('../../services/parts.service');
        for (const ep of validExtraParts) {
          try {
            await issuePart({
              partId: ep.partId,
              quantity: Number(ep.quantity),
              user: user?.name || 'System',
              type: 'issue_planned',
              notes: 'Część dodatkowa (poza planem) - serwis: ' + (serviceToComplete.name || ''),
              referenceId: serviceToComplete.id,
              machineId: serviceToComplete.machineId || null,
            });
          } catch (err) {
            console.warn('Could not issue extra part:', ep.partId, err);
          }
        }
        const extraNote = 'Pobrano dodatkowe części (poza planem): ' + validExtraParts.map(ep => {
          const found = parts.find(p => p.id === ep.partId);
          return (found ? found.name : ep.partId) + ' x' + ep.quantity;
        }).join(', ');
        historyEntry.note = (historyEntry.note ? historyEntry.note + '\n' : '') + extraNote;
        historyEntry.extraParts = validExtraParts;
      }
        
      if (finalCost > 0) {
         historyEntry.cost = finalCost;
         historyEntry.note = (historyEntry.note ? historyEntry.note + '\\n' : '') + 'Zużyto części z magazynu o wartości: ' + finalCost.toLocaleString('pl-PL') + ' PLN.';
      }

      await markServiceCompleted(serviceToComplete.id, { completedBy: user?.name || 'System', notes: completionNotes, checklistResponses, historyEntry, partsUsed }, nextPlanData);

      if (createActionItem && actionItemProblem.trim()) {
        await addActionItem({ 
          machineId: serviceToComplete.machineId || '', 
          plannedServiceId: serviceToComplete.id || '', 
          problem: actionItemProblem.trim(), 
          dueDate: actionItemDueDate ? new Date(actionItemDueDate).toISOString() : null, 
          status: 'pending', 
          createdAt: new Date().toISOString(), 
          createdBy: user?.name || 'Nieznany' 
        });
      }

      setCompletionNotes('');
      setCreateNewPlan(true);
      setCreateActionItem(false);
      setActionItemProblem('');
      setActionItemDueDate('');
      setPartsUsed(false);
      
      onClose();
    } catch (err) { 
      console.error(err); 
      alert("Błąd: " + err.message); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('planned.complete_service')}</h3>
            <p className="text-sm text-slate-600 font-bold">{serviceToComplete.name}</p>
          </div>
          <DictationButton mode="smart" onResult={handleSmartAiResult} />
        </div>


        
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Czas pracy (RBG / Godziny)</label>
          <input
            type="number"
            step="0.1"
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={actualManHours}
            onChange={e => setActualManHours(e.target.value)}
            placeholder="np. 2.5"
          />
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
          {/* Extra parts outside the plan */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600">Pobierz część poza planową listą</span>
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
            {extraParts.map((ep, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <select
                  value={ep.partId}
                  onChange={e => {
                    const updated = [...extraParts];
                    updated[idx].partId = e.target.value;
                    setExtraParts(updated);
                  }}
                  className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white outline-none"
                >
                  <option value="">-- Wybierz część --</option>
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stan: {p.stock})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={ep.quantity}
                  onChange={e => {
                    const updated = [...extraParts];
                    updated[idx].quantity = e.target.value;
                    setExtraParts(updated);
                  }}
                  className="w-16 p-1.5 border border-slate-200 rounded text-xs outline-none"
                  placeholder="Szt."
                />
                <button
                  type="button"
                  onClick={() => setExtraParts(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600"
                >
                  <i className="ph ph-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">{t('planned.exec_notes')}</label>
          <div className="relative">
            <textarea
              className="w-full p-3 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              placeholder="Opcjonalne notatki..."
            ></textarea>
            <div className="absolute right-2 top-2">
              <DictationButton onResult={(text) => setCompletionNotes(prev => prev ? prev + ' ' + text : text)} />
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="createNewPlan"
            checked={createNewPlan}
            onChange={e => setCreateNewPlan(e.target.checked)}
            className="w-4 h-4 text-green-600 rounded border-slate-300"
          />
          <label htmlFor="createNewPlan" className="text-sm font-bold text-slate-700 cursor-pointer">
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
            <label htmlFor="createActionItem" className="text-sm font-bold text-slate-700 cursor-pointer">
              {t('planned.add_to_tasks')}
            </label>
          </div>
          {createActionItem && (
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">{t('planned.problem_desc')}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={actionItemProblem}
                    onChange={e => setActionItemProblem(e.target.value)}
                    className="w-full p-2 pr-10 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-1 top-1">
                    <DictationButton onResult={(text) => setActionItemProblem(prev => prev ? prev + ' ' + text : text)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">{t('planned.expected_date')}</label>
                <input
                  type="date"
                  value={actionItemDueDate}
                  onChange={e => setActionItemDueDate(e.target.value)}
                  className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
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
