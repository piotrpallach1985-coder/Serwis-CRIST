/**
 * PlannedMaintenanceRbgModal — Modal aktualizacji licznika roboczogodzin maszyny.
 */
export default function PlannedMaintenanceRbgModal({ rbgUpdateModal, newRbgValue, setNewRbgValue, onSubmit, onClose }) {
  if (!rbgUpdateModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Aktualizuj licznik maszyny</h3>
        <p className="text-sm text-slate-600 mb-4">{rbgUpdateModal.name}</p>
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-1">Nowy stan licznika (rbg)</label>
          <input
            type="number"
            value={newRbgValue}
            onChange={e => setNewRbgValue(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            required
            min={0}
          />
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
            className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
          >
            Zapisz
          </button>
        </div>
      </form>
    </div>
  );
}
