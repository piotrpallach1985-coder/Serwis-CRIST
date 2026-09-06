/**
 * MapEditModal — Modal przypinania rejonu lub maszyny na mapie.
 * Wyciągnięty z Map.jsx (linie 1225–1290).
 */
export default function MapEditModal({
  isModalOpen,
  editingType, setEditingType,
  editingId, setEditingId,
  currentSubmapId,
  regions,
  machines,
  onSave,
  onClose,
}) {
  if (!isModalOpen) return null;

  const getUnpinnedItems = () => {
    if (editingType === 'region') {
      return regions.filter(r => r.xPercent == null || r.yPercent == null);
    } else {
      if (currentSubmapId !== null) {
        return machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null));
      }
      return machines.filter(m => !m.regionId && (m.xPercent == null || m.yPercent == null));
    }
  };

  const unpinnedItems = getUnpinnedItems();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-push-pin text-blue-600 text-base md:text-xl"></i>
            Przypnij Obiekt
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <i className="ph ph-x text-base md:text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-5">
          {/* Typ: Rejon / Maszyna */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              disabled={currentSubmapId !== null}
              onClick={() => { setEditingType('region'); setEditingId(''); }}
              style={{ opacity: currentSubmapId !== null ? 0.3 : 1 }}
              className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rejon / Hala
            </button>
            <button
              type="button"
              onClick={() => { setEditingType('machine'); setEditingId(''); }}
              className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Konkretna Maszyna
            </button>
          </div>

          {/* Wybór elementu */}
          <div>
            <label className="block text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Wybierz element z bazy
            </label>
            <select
              value={editingId}
              onChange={e => setEditingId(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 font-medium"
              required
            >
              <option value="">-- Wybierz z listy --</option>
              {unpinnedItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {unpinnedItems.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-2 font-semibold">
                <i className="ph ph-check-circle mr-1"></i>
                {currentSubmapId !== null
                  ? 'Wszystkie przypisane maszyny są już na mapie! Możesz je złapać i swobodnie przesuwać.'
                  : 'Brak obiektów do przypięcia. Wszystkie znajdują się już na mapie (możesz je przesuwać).'}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!editingId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-[10px] md:text-sm"
            >
              Zapisz pinezkę na mapie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
