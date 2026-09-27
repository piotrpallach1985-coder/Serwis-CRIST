import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { markServiceCompleted } from '../../services/plannedServices.service';
import DictationButton from '../shared/DictationButton';
import { useManagerStore } from '../../store/managerStore';

export default function PlannedMaintenanceCompletionModal({
  isOpen, onClose, serviceToComplete, user
}) {
  const machines = useManagerStore(state => state.machines || []);
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  const [partsUsed, setPartsUsed] = useState(false);

  if (!isOpen || !serviceToComplete) return null;

  const getMachine = (id) => machines.find(m => m.id === id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = { 
          name: serviceToComplete.name, 
          machineId: serviceToComplete.machineId || '', 
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

      const checklistResponses = serviceToComplete.responses || {};
      let checklistSummary = [];
      if (serviceToComplete.checklist?.length > 0) {
        checklistSummary = serviceToComplete.checklist.map(step => ({ 
          taskName: step.taskName, 
          type: step.type, 
          answer: checklistResponses.values?.[step.id] === undefined ? (checklistResponses[step.id] === undefined ? null : checklistResponses[step.id]) : checklistResponses.values[step.id],
          note: checklistResponses.notes?.[step.id] || '',
          photos: checklistResponses.photos?.[step.id] || []
        }));
      }

      const historyEntry = { 
        date: new Date().toISOString(), 
        user: user?.name || 'System', 
        action: 'Zakończono serwis', 
        note: completionNotes, 
        checklistSummary, 
        partsUsed 
      };
      
      let finalCost = 0;
      if (partsUsed && serviceToComplete.requiredParts && serviceToComplete.requiredParts.length > 0) {
        const tenantId = getCurrentTenant();
        await runTransaction(db, async (transaction) => {
          const partsToUpdate = [];
          for (const req of serviceToComplete.requiredParts) {
             if (!req.partId || req.partId === 'custom') continue;
             const pRef = doc(db, 'tenants', tenantId, 'parts', req.partId);
             const pSnap = await transaction.get(pRef);
             if (pSnap.exists()) {
               partsToUpdate.push({ ref: pRef, id: req.partId, currentStock: Number(pSnap.data().stock || 0), unitPrice: Number(pSnap.data().unitPrice || req.unitCost || 0), quantity: Number(req.quantity || 1) });
             }
          }
          
          for (const p of partsToUpdate) {
             const newStock = Math.max(0, p.currentStock - p.quantity);
             transaction.update(p.ref, { stock: newStock });
             
             const txRef = doc(collection(db, 'tenants', tenantId, 'part_transactions'));
             transaction.set(txRef, {
               partId: p.id,
               type: 'issue_planned',
               quantity: -p.quantity,
               price: p.unitPrice,
               date: new Date().toISOString(),
               user: user?.name || 'System',
               referenceId: serviceToComplete.id,
               machineId: serviceToComplete.machineId || null,
                                                              createdAt: new Date().toISOString()
             });
             
             finalCost += p.quantity * p.unitPrice;
          }
        });
      }
        
      if (finalCost > 0) {
         historyEntry.cost = finalCost;
         historyEntry.note = (historyEntry.note ? historyEntry.note + '\n' : '') + 'Zużyto części z magazynu o wartości: ' + finalCost.toLocaleString('pl-PL') + ' PLN.';
      }

      await markServiceCompleted(serviceToComplete.id, { completedBy: user?.name || 'System', notes: completionNotes, checklistResponses, historyEntry, partsUsed }, nextPlanData);

      if (createActionItem && actionItemProblem.trim()) {
        await addDoc(collection(db, 'tenants', getCurrentTenant(), 'action_items'), { 
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
      alert('Błąd: ' + err.message); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Zakończ Serwis</h3>
        <p className="text-sm text-slate-600 mb-4 font-bold">{serviceToComplete.name}</p>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="partsUsed"
            checked={partsUsed}
            onChange={e => setPartsUsed(e.target.checked)}
            className="w-4 h-4 text-orange-600 rounded border-gray-300"
          />
          <label htmlFor="partsUsed" className="text-sm font-bold text-gray-700 cursor-pointer">
            Potwierdzam zużycie wymaganych części
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Notatki z wykonania</label>
          <div className="relative">
            <textarea
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none pr-10"
              rows="3"
              placeholder="np. Wymieniono filtr, zalano 5L oleju..."
            />
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
            className="w-4 h-4 text-green-600 rounded border-gray-300"
          />
          <label htmlFor="createNewPlan" className="text-sm font-bold text-gray-700 cursor-pointer">
            Wygeneruj automatycznie kolejny termin przeglądu
          </label>
        </div>

        <div className="mb-6 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="createActionItem"
              checked={createActionItem}
              onChange={e => setCreateActionItem(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="createActionItem" className="text-sm font-bold text-gray-700 cursor-pointer">
              Dodaj do Tematy do Realizacji
            </label>
          </div>
          {createActionItem && (
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Problem / Akcja do wykonania</label>
                <div className="relative">
                  <textarea
                    value={actionItemProblem}
                    onChange={e => setActionItemProblem(e.target.value)}
                    required={createActionItem}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10"
                    rows="2"
                    placeholder="Wpisz problem..."
                  />
                  <div className="absolute right-2 top-2">
                    <DictationButton onResult={(text) => setActionItemProblem(prev => prev ? prev + ' ' + text : text)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Data wymaganej realizacji</label>
                <input
                  type="date"
                  value={actionItemDueDate}
                  onChange={e => setActionItemDueDate(e.target.value)}
                  required={createActionItem}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm"
          >
            Zatwierdź Wykonanie
          </button>
        </div>
      </form>
    </div>
  );
}
