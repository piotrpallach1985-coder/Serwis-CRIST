import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { addRegion, updateRegion, checkRegionInUse } from '../../services/dictionary.service';


export default function Regions() {
  const { t } = useTranslation();
  const [regions, setRegions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [mapType, setMapType] = useState('image');
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleZoom, setGoogleZoom] = useState(18);
  const [googleMapStyle, setGoogleMapStyle] = useState('k');
  const [mapFile, setMapFile] = useState(null);
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const getDescendantIds = (rootId) => {
    const descendants = new Set();
    const queue = [rootId];
    while (queue.length > 0) {
      const curr = queue.shift();
      regions.forEach(r => {
        if (r.parentId === curr && !descendants.has(r.id)) {
          descendants.add(r.id);
          queue.push(r.id);
        }
      });
    }
    return descendants;
  };

  useEffect(() => {
    const unsubRegions = onSnapshot(collection(db, 'tenants', getCurrentTenant(), 'regions'), (snapshot) => {
      const fetchedRegions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedRegions.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setRegions(fetchedRegions);
    }, (error) => { console.debug('Regions listener closed:', error.message); });
    const unsubMachines = onSnapshot(collection(db, 'tenants', getCurrentTenant(), 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => { console.debug('Machines listener closed:', error.message); });
    return () => {
      unsubRegions();
      unsubMachines();
    };
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId('');
    setMapType('image');
    setGoogleQuery('');
    setGoogleZoom(18);
    setGoogleMapStyle('k');
    setMapFile(null);
    setMapImageUrl('');
    setUploadProgress(0);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = mapImageUrl;

      if (mapType === 'image' && mapFile) {
        const fileRef = ref(storage, `tenants/${getCurrentTenant()}/regions_maps/${Date.now()}_${mapFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, mapFile);
        
        finalImageUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prog);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || null,
        mapType: mapType || 'image',
        mapImageUrl: finalImageUrl || '',
        googleQuery: googleQuery.trim(),
        googleZoom: Number(googleZoom) || 18,
        googleMapStyle: googleMapStyle || 'k',
      };

      // Jeśli zmieniono nadrzędny rejon przy edycji, wyzeruj współrzędne pinezki tylko gdy zmienił się rodzic
      if (editingId) {
        const existing = regions.find(r => r.id === editingId);
        if (existing && (existing.parentId || null) !== (parentId || null)) {
          payload.xPercent = null;
          payload.yPercent = null;
        }
        await updateRegion(editingId, payload);
      } else {
        await addRegion({
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
      alert("Błąd podczas zapisu: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name || '');
    setDescription(r.description || '');
    setParentId(r.parentId || '');
    setMapType(r.mapType || (r.googleQuery ? 'google' : 'image'));
    setGoogleQuery(r.googleQuery || '');
    setGoogleZoom(r.googleZoom || 18);
    setGoogleMapStyle(r.googleMapStyle || 'k');
    setEditingId(r.id);
    setMapImageUrl(r.mapImageUrl || '');
    setMapFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestore = async (id) => {
    if (window.confirm('Czy na pewno chcesz przywrócić ten rejon?')) {
      try {
        await updateRegion(id, { isDeleted: false });
        alert('Rejon przywrócony pomyślnie.');
      } catch (err) {
        alert("Błąd: " + err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      const { inUse, count } = await checkRegionInUse(id);
      if (inUse) {
        alert(`Nie można usunąć, ponieważ rekord jest przypisany do ${count} elementów. Zmień powiązania przed usunięciem.`);
        return;
      }
      
      if (confirm("Czy na pewno chcesz usunąć ten rejon?")) {
        await updateRegion(id, { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas usuwania rejonu');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">{t("admin.regions.title")}</h2>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">{t("admin.regions.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
              <i className="ph ph-plus text-lg"></i> {t("admin.regions.add_region")}
            </button>
          </div>
        </div>

      <div className="p-6">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-xl font-extrabold text-gray-800">
                  {editingId ? t("admin.regions.edit_region") : t("admin.regions.add_new_region")}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.regions.region_name")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Osiedle Słoneczne / Budynek A / Hala K3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.regions.description_optional")}</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Główna hala montażowa lub budynek mieszkalny"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Rejon nadrzędny / Mapa nadrzędna <span className="text-xs font-normal text-gray-500">(opcjonalnie — tworzy podmapę w podmapie)</span>
              </label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">— Mapa Główna (Rejon główny) —</option>
                {(() => {
                  const forbiddenIds = editingId ? getDescendantIds(editingId) : new Set();
                  if (editingId) forbiddenIds.add(editingId);
                  return regions
                    .filter(r => !r.isDeleted && !forbiddenIds.has(r.id))
                    .map(r => {
                      const parentObj = r.parentId ? regions.find(p => p.id === r.parentId) : null;
                      return (
                        <option key={r.id} value={r.id}>
                          {parentObj ? `${parentObj.name} ➔ ${r.name}` : r.name}
                        </option>
                      );
                    });
                })()}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-sm font-bold text-gray-700">{t("admin.regions.submap_optional")}</label>
            <div className="flex bg-gray-200/80 p-1 rounded-lg max-w-md">
              <button
                type="button"
                onClick={() => setMapType('image')}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${mapType === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className="ph ph-image text-sm"></i> Rzut / Obraz (Plik)
              </button>
              <button
                type="button"
                onClick={() => setMapType('google')}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${mapType === 'google' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className="ph ph-globe-hemisphere-west text-sm"></i> Mapa Google (Osiedla / Budynki)
              </button>
            </div>

            {mapType === 'image' ? (
              <div>
                {mapImageUrl && !mapFile && (
                  <div className="mb-2 relative w-32 h-20 rounded-md overflow-hidden border border-gray-300">
                    <img src={mapImageUrl} className="w-full h-full object-cover" alt="Podmapa" />
                    <button type="button" onClick={() => setMapImageUrl('')} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"><i className="ph ph-x text-xs"></i></button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setMapFile(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 text-xs font-bold text-blue-600">{t("admin.regions.uploading")}{Math.round(uploadProgress)}%</div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Adres osiedla / budynku lub współrzędne GPS</label>
                    <input
                      type="text"
                      value={googleQuery}
                      onChange={e => setGoogleQuery(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                      placeholder="np. Gdańsk, ul. Słoneczna 12 lub 54.3520, 18.6466"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Widok</label>
                      <select
                        value={googleMapStyle}
                        onChange={e => setGoogleMapStyle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                      >
                        <option value="k">Satelita</option>
                        <option value="m">Drogowa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Zoom ({googleZoom})</label>
                      <input
                        type="number"
                        min="12"
                        max="20"
                        value={googleZoom}
                        onChange={e => setGoogleZoom(Number(e.target.value) || 18)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
                {googleQuery.trim() && (
                  <div className="w-full h-44 rounded-lg overflow-hidden border border-gray-300 shadow-inner bg-slate-900">
                    <iframe
                      title="Podgląd Google Maps"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(googleQuery.trim())}&t=${googleMapStyle || 'k'}&z=${googleZoom || 18}&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full border-0 pointer-events-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); resetForm(); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? t('admin.regions.saving') : (editingId ? t('admin.regions.save_changes') : t('admin.regions.add_region'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        <div className="overflow-x-auto">
<div className="lg:hidden flex flex-col gap-1.5 p-2">
    {regions.length === 0 ? (
      <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">{t("admin.regions.no_data")}</div>
    ) : (
      regions.filter(r => showDeleted ? true : !r.isDeleted).map(item => {
        const parentRegion = item.parentId ? regions.find(p => p.id === item.parentId) : null;
        return (
<div key={item.id} className={`bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col ${item.isDeleted ? "opacity-50" : ""}`}>
  <div className="flex justify-between items-start mb-2">
    <div>
      <h4 className="font-bold text-[#002b5e] text-lg">{item.name || t('admin.regions.without_name')}</h4>
      {parentRegion && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-0.5">
          <i className="ph ph-arrow-bend-down-right"></i> Podmapa w: {parentRegion.name}
        </span>
      )}
    </div>
    {item.mapType === 'google' && item.googleQuery ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
        <i className="ph ph-globe-hemisphere-west"></i> Google Maps
      </span>
    ) : item.mapImageUrl ? (
      <a href={item.mapImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-12 h-8 rounded-md overflow-hidden border border-gray-200">
        <img src={item.mapImageUrl} alt="Podmapa" className="w-full h-full object-cover" />
      </a>
    ) : null}
  </div>
  <p className="text-sm text-gray-600 mb-1">{item.description || '-'}</p>
    <div className="text-xs text-gray-500 mb-2 font-bold uppercase">{t("admin.regions.machines_in_region")}</div>
    <div className="flex flex-wrap gap-1 mb-2">
      {machines.filter(m => m.regionId === item.id && !m.isDeleted && !m.parentId).length > 0 ? (
        machines.filter(m => m.regionId === item.id && !m.isDeleted && !m.parentId).map(m => (
          <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">{m.name}</span>
        ))
    ) : (
      <span className="text-gray-400 italic">{t("admin.regions.no_machines_assigned")}</span>
    )}
  </div>
  <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
    <button onClick={() => { handleEdit(item); }} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-pencil-simple text-sm"></i> {t("admin.regions.edit")}</button>
    <button onClick={() => handleDelete(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-trash text-sm"></i> {t("admin.regions.delete")}</button>
  </div>
</div>
        );
      })
    )}
  </div>
          <table className="w-full text-left hidden lg:table border-collapse relative">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("admin.regions.region_name")}</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("admin.regions.description")}</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("admin.regions.machines_in_region")}</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{t("admin.regions.submap")}</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("admin.regions.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regions.filter(r => showDeleted ? true : !r.isDeleted).map(r => {
                const regionMachines = machines.filter(m => m.regionId === r.id && !m.isDeleted && !m.parentId);
                const parentRegion = r.parentId ? regions.find(p => p.id === r.parentId) : null;
                const childRegions = regions.filter(c => c.parentId === r.id && !c.isDeleted);
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 ${r.isDeleted ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{r.name || t('admin.regions.without_name')}</div>
                      {parentRegion && (
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1">
                          <i className="ph ph-arrow-bend-down-right"></i> Podmapa w: {parentRegion.name}
                        </div>
                      )}
                      {childRegions.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Podrejony ({childRegions.length}): {childRegions.map(c => c.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {regionMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {regionMachines.map(m => (
                            <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{t("admin.regions.no_machines_assigned")}</span>
                      )}
                    </td>
                      <td className="px-6 py-4 text-center">
                        {r.mapType === 'google' && r.googleQuery ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold" title={r.googleQuery}>
                            <i className="ph ph-globe-hemisphere-west text-sm"></i> Google ({r.googleQuery})
                          </span>
                        ) : r.mapImageUrl ? (
                          <div className="flex justify-center">
                            <a href={r.mapImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shadow-sm relative group block" title="Kliknij by powiększyć mapę">
                              <img src={r.mapImageUrl} alt="Podmapa" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="ph ph-magnifying-glass-plus text-white"></i>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">{t('admin.regions.none')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEdit(r)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-pencil-simple"></i> {t("admin.users.edit")}
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-trash"></i> {t("admin.users.delete")}
                          </button>
                        </div>
                      </td>
                  </tr>
                );
              })}
              {regions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {t("admin.regions.empty_list")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      </div>
  );
}
