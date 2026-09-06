/**
 * PlannedMaintenanceCompletionModal — Modal zakończenia serwisu.
 * Zawiera formularz z notatkami, opcją tworzenia nowego planu i opcją Action Items.
 */
export default function PlannedMaintenanceCompletionModal({
  completionModal,
  completionNotes, setCompletionNotes,
  createNewPlan, setCreateNewPlan,
  createActionItem, setCreateActionItem,
  actionItemProblem, setActionItemProblem,
  actionItemDueDate, setActionItemDueDate,
  onSubmit,
  onClose,
}) {
  if (!completionModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Zakończ Serwis</h3>
        <p className="text-sm text-slate-600 mb-4 font-bold">{completionModal.name}</p>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Notatki z wykonania</label>
          <textarea
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            rows="3"
            placeholder="np. Wymieniono filtr, zalano 5L oleju..."
          />
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
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Problem / Akcja do wykonania</label>
                <textarea
                  value={actionItemProblem}
                  onChange={e => setActionItemProblem(e.target.value)}
                  required={createActionItem}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  rows="2"
                  placeholder="Wpisz problem..."
                />
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
