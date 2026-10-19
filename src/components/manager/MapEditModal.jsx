/**
 * MapEditModal — Modal przypinania rejonu lub maszyny na mapie.
 * Wyciągnięty z Map.jsx (linie 1225–1290).
 */
import { useTranslation } from 'react-i18next';
import { isMachinePinnedOnSubmap } from '../../hooks/useMapPins';

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
  const { t } = useTranslation();

  if (!isModalOpen) return null;

  const getAncestorAndSelfIds = (startId) => {
    const ids = new Set();
    let currId = startId;
    while (currId && !ids.has(currId)) {
      ids.add(currId);
      const reg = regions.find(r => r.id === currId);
      currId = reg?.parentId || null;
    }
    return ids;
  };

  const getUnpinnedItems = () => {
    const activeRegions = regions.filter(r => !r.isDeleted);
    if (editingType === 'region') {
      if (currentSubmapId === null) {
        return activeRegions.filter(r => !r.parentId && (r.xPercent == null || r.yPercent == null));
      } else {
        const forbiddenIds = getAncestorAndSelfIds(currentSubmapId);
        return activeRegions.filter(
          r =>
            !forbiddenIds.has(r.id) &&
            (r.xPercent == null || r.yPercent == null) &&
            (r.parentId === currentSubmapId || !r.parentId)
        );
      }
    } else {
      const mainMachines = machines.filter(m => (!m.parentId || m.parentId === '') && !m.isDeleted);
      if (currentSubmapId !== null) {
        return mainMachines.filter(m => m.regionId === currentSubmapId && !isMachinePinnedOnSubmap(m, currentSubmapId, activeRegions));
      }
      return mainMachines.filter(m => m.xPercent == null || m.yPercent == null);
    }
  };

  const unpinnedItems = getUnpinnedItems();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-push-pin text-blue-600 text-base md:text-xl"></i>{t('map_component.pin_object')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <i className="ph ph-x text-base md:text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-5">
          {/* Typ: Rejon / Podmapa vs Maszyna */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setEditingType('region'); setEditingId(''); }}
              className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {currentSubmapId !== null ? 'Podrejon / Podmapa' : t('map_component.region_hall')}
            </button>
            <button
              type="button"
              onClick={() => { setEditingType('machine'); setEditingId(''); }}
              className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >{t('map_component.specific_machine')}</button>
          </div>

          {/* Wybór elementu */}
          <div>
            <label className="block text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('map_component.choose_element')}</label>
            <select
              value={editingId}
              onChange={e => setEditingId(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 font-medium"
              required
            >
              <option value="">{t('map_component.choose_from_list')}</option>
              {unpinnedItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {unpinnedItems.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-2 font-semibold">
                <i className="ph ph-check-circle mr-1"></i>
                {editingType === 'region'
                  ? 'Brak wolnych rejonów/podmap do przypięcia (dodaj nowy rejon w Słownikach -> Rejony).'
                  : currentSubmapId !== null
                    ? t('map_component.all_machines_pinned')
                    : t('map_component.no_objects_to_pin')}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!editingId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-[10px] md:text-sm"
            >{t('map_component.save_pin')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
