import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useManagerStore } from '../../store/managerStore';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { addRegion, updateRegion, checkRegionInUse } from '../../services/dictionary.service';
import { updateMapSettings, subscribeToMapSettings } from '../../services/machines.service';
import { getRegionSubmaps, isRegionMapConfigured } from '../../hooks/useMapPins';
import {
  generateRandomReportPin,
  resolveRegionReportPin,
} from '../../utils/fieldServiceHelpers';
import InteractiveGoogleMap, {
  geocodeAddressQuery,
  searchAddressSuggestions,
  reverseGeocodeLatLng,
} from './map/InteractiveGoogleMap';

export default function Regions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const regions = useManagerStore(state => state.regions) || [];
  const machines = useManagerStore(state => state.machines) || [];
  const branding = useManagerStore(state => state.branding) || {};
  const setBranding = useManagerStore(state => state.setBranding);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [reportPin, setReportPin] = useState('');
  const [globalFleetPinInput, setGlobalFleetPinInput] = useState('');
  const [fleetPinSavedMsg, setFleetPinSavedMsg] = useState('');
  const [mapType, setMapType] = useState('none');
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleLat, setGoogleLat] = useState(54.5364);
  const [googleLng, setGoogleLng] = useState(18.5469);
  const [pinLat, setPinLat] = useState(54.5364);
  const [pinLng, setPinLng] = useState(18.5469);
  const [hasPinOnMap, setHasPinOnMap] = useState(true);
  const [googleZoom, setGoogleZoom] = useState(17);
  const [googleMapStyle, setGoogleMapStyle] = useState('k');
  const [searchingGeo, setSearchingGeo] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const skipSuggestRef = useRef(false);
  const [mapFile, setMapFile] = useState(null);
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [submapsDraft, setSubmapsDraft] = useState([]);
  const [activeDraftTabId, setActiveDraftTabId] = useState('default');
  const [submapNameInput, setSubmapNameInput] = useState('Podmapa 1');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted] = useState(false);
  const [mainMapSettings, setMainMapSettings] = useState(null);

  useEffect(() => {
    const unsub = subscribeToMapSettings(snap => {
      const data = snap.exists() ? snap.data() : {};
      setMainMapSettings(data);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  useEffect(() => {
    const existingFleetPin =
      branding?.globalFleetPin || mainMapSettings?.globalFleetPin || '';
    setGlobalFleetPinInput(existingFleetPin);
  }, [branding?.globalFleetPin, mainMapSettings?.globalFleetPin]);

  const handleSaveGlobalFleetPin = async nextPinValue => {
    const trimmed = String(nextPinValue ?? globalFleetPinInput ?? '').trim();
    setGlobalFleetPinInput(trimmed);
    const nextBranding = { ...branding, globalFleetPin: trimmed };
    if (typeof setBranding === 'function') {
      setBranding(nextBranding);
    }
    setMainMapSettings(prev => ({ ...(prev || {}), globalFleetPin: trimmed }));
    try {
      await updateMapSettings({ globalFleetPin: trimmed });
      await setDoc(
        doc(db, 'tenants', getCurrentTenant(), 'settings', 'branding'),
        { globalFleetPin: trimmed },
        { merge: true }
      );
      setFleetPinSavedMsg(
        trimmed ? `Zapisano PIN Floty: ${trimmed}` : 'Wyłączono Globalny PIN Floty'
      );
      setTimeout(() => setFleetPinSavedMsg(''), 3000);
    } catch (err) {
      console.error('Błąd zapisu globalnego PIN-u floty:', err);
    }
  };

  const handleQuickUpdateRegionPin = async (targetRegionId, nextPin) => {
    const cleanPin = String(nextPin || '').trim();
    try {
      if (targetRegionId === 'main_map') {
        setMainMapSettings(prev => ({ ...(prev || {}), reportPin: cleanPin }));
        if (typeof setBranding === 'function') {
          setBranding({ ...branding, mainMapReportPin: cleanPin });
        }
        await updateMapSettings({ reportPin: cleanPin });
        await setDoc(
          doc(db, 'tenants', getCurrentTenant(), 'settings', 'branding'),
          { mainMapReportPin: cleanPin },
          { merge: true }
        );
      } else {
        await updateRegion(targetRegionId, { reportPin: cleanPin });
      }
    } catch (err) {
      console.error('Błąd aktualizacji PIN-u rejonu:', err);
    }
  };

  useEffect(() => {
    if (!isFormOpen) return;
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    const q = googleQuery.trim();
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingGeo(true);
      const results = await searchAddressSuggestions(q);
      if (!cancelled) {
        setSearchingGeo(false);
        setAddressSuggestions(results);
        if (results.length > 0) {
          setGoogleLat(results[0].lat);
          setGoogleLng(results[0].lng);
          setPinLat(results[0].lat);
          setPinLng(results[0].lng);
          setHasPinOnMap(true);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [googleQuery, isFormOpen]);

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

  const buildRegionHierarchy = (list) => {
    const byId = new Map(list.map(r => [r.id, r]));
    const childrenMap = new Map();
    const roots = [];

    const sorted = [...list].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'pl', { numeric: true })
    );

    sorted.forEach(r => {
      if (r.parentId && byId.has(r.parentId) && r.parentId !== r.id) {
        if (!childrenMap.has(r.parentId)) childrenMap.set(r.parentId, []);
        childrenMap.get(r.parentId).push(r);
      } else {
        roots.push(r);
      }
    });

    const result = [];
    const visited = new Set();

    const traverse = (node, depth = 0, ancestorPath = []) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      result.push({
        ...node,
        depth,
        ancestorPath,
      });
      const children = childrenMap.get(node.id) || [];
      children.forEach(child => traverse(child, depth + 1, [...ancestorPath, node.name]));
    };

    roots.forEach(root => traverse(root, 0, []));
    sorted.forEach(r => {
      if (!visited.has(r.id)) traverse(r, 0, []);
    });

    return result;
  };

  const hierarchicalRegions = buildRegionHierarchy(
    regions.filter(r => (showDeleted ? true : !r.isDeleted))
  );

  const isRegionSubmapConfigured = (r) => isRegionMapConfigured(r);

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId('');
    setReportPin('');
    setMapType('none');
    setGoogleQuery('');
    setGoogleLat(54.5364);
    setGoogleLng(18.5469);
    setPinLat(54.5364);
    setPinLng(18.5469);
    setHasPinOnMap(false);
    setGoogleZoom(17);
    setGoogleMapStyle('k');
    setAddressSuggestions([]);
    setMapFile(null);
    setMapImageUrl('');
    setSubmapsDraft([]);
    setActiveDraftTabId('default');
    setSubmapNameInput('Podmapa 1');
    setUploadProgress(0);
    setEditingId(null);
  };

  const handleSearchRegionGeo = async () => {
    if (!googleQuery.trim()) return;
    setSearchingGeo(true);
    const results = await searchAddressSuggestions(googleQuery);
    setSearchingGeo(false);
    if (results.length > 0) {
      setAddressSuggestions(results);
      setGoogleLat(results[0].lat);
      setGoogleLng(results[0].lng);
      setPinLat(results[0].lat);
      setPinLng(results[0].lng);
      setHasPinOnMap(true);
    } else {
      const geo = await geocodeAddressQuery(googleQuery);
      if (geo) {
        setGoogleLat(geo.lat);
        setGoogleLng(geo.lng);
        setPinLat(geo.lat);
        setPinLng(geo.lng);
        setHasPinOnMap(true);
      } else {
        alert('Nie znaleziono adresu — możesz wskazać lokalizację klikając bezpośrednio na mapie poniżej.');
      }
    }
  };

  const handlePickLocationOnMap = async (picked) => {
    if (!picked || !Number.isFinite(picked.lat) || !Number.isFinite(picked.lng)) return;
    setPinLat(picked.lat);
    setPinLng(picked.lng);
    setGoogleLat(picked.lat);
    setGoogleLng(picked.lng);
    setHasPinOnMap(true);
    const rev = await reverseGeocodeLatLng(picked.lat, picked.lng);
    if (rev?.displayName) {
      skipSuggestRef.current = true;
      setGoogleQuery(rev.displayName);
      setAddressSuggestions([]);
    }
  };

  const uploadRegionMapFile = async (fileToUpload) => {
    const fileRef = ref(storage, `tenants/${getCurrentTenant()}/regions_maps/${Date.now()}_${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(fileRef, fileToUpload);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resolvedAddress = googleQuery.trim();
      let finalSubmaps = [];

      if (mapType !== 'none') {
        const rawDrafts =
          submapsDraft.length > 0
            ? submapsDraft
            : [
                {
                  id: 'default',
                  name: 'Podmapa 1',
                  mapType: mapType === 'google' ? 'google' : 'image',
                  mapImageUrl: mapImageUrl || '',
                  file: mapFile || null,
                },
              ];

        for (let i = 0; i < rawDrafts.length; i++) {
          const item = rawDrafts[i];
          let itemUrl = item.mapImageUrl || '';
          if (item.mapType === 'image' && item.file) {
            itemUrl = await uploadRegionMapFile(item.file);
          }
          const itemType = item.mapType === 'google' ? 'google' : 'image';
          const isItemConfigured = itemType === 'google' || Boolean(itemUrl);
          finalSubmaps.push({
            id: item.id || (i === 0 ? 'default' : `sub_${Date.now()}_${i}`),
            name: (item.name || '').trim() || `Podmapa ${i + 1}`,
            mapType: itemType,
            mapImageUrl: itemType === 'image' ? itemUrl : '',
            googleQuery:
              item.googleQuery ||
              resolvedAddress ||
              `${Number(googleLat).toFixed(5)}, ${Number(googleLng).toFixed(5)}`,
            googleLat: Number(item.googleLat ?? googleLat) || 54.5364,
            googleLng: Number(item.googleLng ?? googleLng) || 18.5469,
            googleZoom: Number(item.googleZoom ?? googleZoom) || 17,
            googleMapStyle: item.googleMapStyle || googleMapStyle || 'k',
            defaultZoom: Number(item.defaultZoom) || 1,
            defaultPanX: Number(item.defaultPanX) || 0,
            defaultPanY: Number(item.defaultPanY) || 0,
            submapConfigured: isItemConfigured,
          });
        }
      }

      const firstSub = finalSubmaps[0] || null;
      const submapConfigured = finalSubmaps.some(s => s.submapConfigured);
      const effectiveMapType = firstSub ? firstSub.mapType : 'image';
      const finalImageUrl = firstSub && firstSub.mapType === 'image' ? firstSub.mapImageUrl : '';

      const payload = {
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || null,
        reportPin: reportPin.trim(),
        submaps: finalSubmaps,
        submapName: firstSub?.name || 'Podmapa 1',
        mapType: effectiveMapType,
        submapConfigured,
        mapImageUrl: finalImageUrl,
        ...(submapConfigured && effectiveMapType === 'google'
          ? {
              googleQuery:
                resolvedAddress || `${Number(googleLat).toFixed(5)}, ${Number(googleLng).toFixed(5)}`,
              googleLat: Number(googleLat) || 54.5364,
              googleLng: Number(googleLng) || 18.5469,
              googleZoom: Number(googleZoom) || 17,
              googleMapStyle: googleMapStyle || 'k',
            }
          : {}),
      };

      if (editingId === 'main_map') {
        const cleanMainPin = reportPin.trim();
        const mainMapUpdate = {
          description: description.trim(),
          reportPin: cleanMainPin,
          mapType: effectiveMapType === 'google' ? 'google' : 'image',
          ...(finalImageUrl
            ? { mapUrl: finalImageUrl, imageUrl: finalImageUrl }
            : effectiveMapType === 'image' && !finalImageUrl
              ? { mapUrl: '', imageUrl: '' }
              : {}),
          ...(effectiveMapType === 'google'
            ? {
                googleQuery:
                  resolvedAddress ||
                  `${Number(googleLat).toFixed(5)}, ${Number(googleLng).toFixed(5)}`,
                googleLat: Number(googleLat) || 54.5364,
                googleLng: Number(googleLng) || 18.5469,
                googleZoom: Number(googleZoom) || 16,
                googleMapStyle: googleMapStyle || 'k',
              }
            : {}),
        };
        setMainMapSettings(prev => ({ ...(prev || {}), ...mainMapUpdate }));
        if (typeof setBranding === 'function') {
          setBranding({ ...branding, mainMapReportPin: cleanMainPin });
        }
        await updateMapSettings(mainMapUpdate);
        await setDoc(
          doc(db, 'tenants', getCurrentTenant(), 'settings', 'branding'),
          { mainMapReportPin: cleanMainPin },
          { merge: true }
        );
      } else if (editingId) {
        const existing = regions.find(r => r.id === editingId);
        if (existing && (existing.parentId || null) !== (parentId || null)) {
          payload.xPercent = null;
          payload.yPercent = null;
        }
        await updateRegion(editingId, payload);
      } else {
        await addRegion({
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Błąd zapisu:', error);
      alert('Błąd podczas zapisu: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (r, initialTab = null) => {
    skipSuggestRef.current = true;
    setName(r.name || '');
    setDescription(r.description || '');
    setParentId(r.parentId || '');
    setReportPin(r.reportPin || '');
    const existingSubmaps = getRegionSubmaps(r);
    const configured = existingSubmaps.some(s => s.submapConfigured);
    if (initialTab) {
      setMapType(initialTab);
      if (existingSubmaps.length === 0) {
        const initSub = {
          id: 'default',
          name: 'Podmapa 1',
          mapType: initialTab === 'google' ? 'google' : 'image',
          mapImageUrl: '',
          file: null,
        };
        setSubmapsDraft([initSub]);
        setActiveDraftTabId('default');
        setSubmapNameInput('Podmapa 1');
      } else {
        setSubmapsDraft(existingSubmaps.map(s => ({ ...s, file: null })));
        setActiveDraftTabId(existingSubmaps[0].id);
        setSubmapNameInput(existingSubmaps[0].name || 'Podmapa 1');
      }
    } else if (configured && existingSubmaps.length > 0) {
      setMapType(existingSubmaps[0].mapType === 'google' ? 'google' : 'image');
      setSubmapsDraft(existingSubmaps.map(s => ({ ...s, file: null })));
      setActiveDraftTabId(existingSubmaps[0].id);
      setSubmapNameInput(existingSubmaps[0].name || 'Podmapa 1');
    } else {
      setMapType('none');
      setSubmapsDraft([]);
      setActiveDraftTabId('default');
      setSubmapNameInput('Podmapa 1');
    }
    const initLat = Number(r.googleLat ?? r.lat) || 54.5364;
    const initLng = Number(r.googleLng ?? r.lng) || 18.5469;
    setGoogleQuery(r.googleQuery || r.address || '');
    setGoogleLat(initLat);
    setGoogleLng(initLng);
    setPinLat(initLat);
    setPinLng(initLng);
    setHasPinOnMap(false);
    setGoogleZoom(r.googleZoom || 17);
    setGoogleMapStyle(r.googleMapStyle || 'k');
    setAddressSuggestions([]);
    setEditingId(r.id);
    setMapImageUrl(r.mapImageUrl || '');
    setMapFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditMainMap = (initialTab = null) => {
    skipSuggestRef.current = true;
    const ms = mainMapSettings || {};
    const mainImg = ms.mapUrl || ms.imageUrl || '';
    const effectiveTab =
      initialTab ||
      (ms.mapType === 'google' ? 'google' : mainImg ? 'image' : 'google');
    setName('MAPA GŁÓWNA');
    setDescription(
      ms.description || 'Główna mapa zakładu / obiektów (nadrzędna dla wszystkich rejonów)'
    );
    setParentId('');
    setReportPin(ms.reportPin || branding?.mainMapReportPin || '');
    setMapType(effectiveTab);
    setSubmapsDraft([
      {
        id: 'default',
        name: 'Mapa Główna',
        mapType: effectiveTab === 'google' ? 'google' : 'image',
        mapImageUrl: mainImg,
        file: null,
      },
    ]);
    setActiveDraftTabId('default');
    setSubmapNameInput('Mapa Główna');
    const initLat = Number(ms.googleLat) || 54.5364;
    const initLng = Number(ms.googleLng) || 18.5469;
    setGoogleQuery(ms.googleQuery || '');
    setGoogleLat(initLat);
    setGoogleLng(initLng);
    setPinLat(initLat);
    setPinLng(initLng);
    setHasPinOnMap(false);
    setGoogleZoom(Number(ms.googleZoom) || 16);
    setGoogleMapStyle(ms.googleMapStyle || 'k');
    setAddressSuggestions([]);
    setEditingId('main_map');
    setMapImageUrl(mainImg);
    setMapFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSubmapForRegion = parentRegion => {
    resetForm();
    setName('');
    setDescription('');
    setParentId(parentRegion && parentRegion.id !== 'main_map' ? parentRegion.id : '');
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const { inUse, count } = await checkRegionInUse(id);
      if (inUse) {
        alert(`Nie można usunąć, ponieważ rekord jest przypisany do ${count} elementów. Zmień powiązania przed usunięciem.`);
        return;
      }

      if (confirm('Czy na pewno chcesz usunąć to miejsce montażu / rejon?')) {
        await updateRegion(id, {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: typeof user !== 'undefined' && user?.name ? user.name : 'System',
        });
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas usuwania miejsca montażu');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">
              {t('admin.regions.title', 'Rejony/Miejsca montażu')}
            </h2>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">
              {t('admin.regions.subtitle', 'Słownik rejonów i miejsc montażu przypisywanych do urządzeń')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <i className="ph ph-plus text-lg"></i> {t('admin.regions.add_region', 'Dodaj miejsce montażu')}
            </button>
          </div>
        </div>

        <div className="p-6">
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto animate-fade-in flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl sticky top-0 z-20">
                  <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <i className="ph ph-map-pin-line text-blue-600 text-2xl"></i>
                    <span>
                      {editingId === 'main_map'
                        ? 'Edytuj Mapę Główną'
                        : editingId
                          ? t('admin.regions.edit_region', 'Edytuj miejsce montażu / rejon')
                          : t('admin.regions.add_new_region', 'Dodaj nowy rejon / miejsce montażu')}
                    </span>
                  </h2>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200"
                  >
                    <i className="ph ph-x text-2xl"></i>
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          {t('admin.regions.region_name', 'Nazwa miejsca montażu / rejonu')}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          disabled={editingId === 'main_map'}
                          className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm ${
                            editingId === 'main_map' ? 'bg-slate-100 font-bold text-slate-600' : ''
                          }`}
                          placeholder="np. Osiedle Słoneczne / Budynek A / Hala K3"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          {t('admin.regions.description_optional', 'Opis (opcjonalnie)')}
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="np. Główna hala montażowa lub budynek mieszkalny"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Miejsce nadrzędne / Mapa nadrzędna{' '}
                          <span className="text-xs font-normal text-gray-500">(opcjonalnie)</span>
                        </label>
                        <select
                          value={parentId}
                          onChange={e => setParentId(e.target.value)}
                          disabled={editingId === 'main_map'}
                          className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm ${
                            editingId === 'main_map' ? 'bg-slate-100 text-slate-500' : ''
                          }`}
                        >
                          <option value="">— Mapa Główna (Miejsce główne) —</option>
                          {(() => {
                            const forbiddenIds = editingId ? getDescendantIds(editingId) : new Set();
                            if (editingId) forbiddenIds.add(editingId);
                            return hierarchicalRegions
                              .filter(r => !r.isDeleted && !forbiddenIds.has(r.id))
                              .map(r => {
                                const indentPrefix = r.depth > 0 ? `${'— '.repeat(r.depth)}↳ ` : '';
                                const pathSuffix = r.ancestorPath?.length ? ` (${r.ancestorPath.join(' ➔ ')})` : '';
                                return (
                                  <option key={r.id} value={r.id}>
                                    {indentPrefix}
                                    {r.name}
                                    {pathSuffix}
                                  </option>
                                );
                              });
                          })()}
                        </select>
                      </div>
                      <div className="md:col-span-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                            <i className="ph-fill ph-key text-amber-600 text-base"></i>
                            <span>Kod PIN dla zgłoszeń anonimowych w tej lokalizacji (opcjonalnie)</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              data-testid="region-generate-pin-btn"
                              onClick={() => setReportPin(generateRandomReportPin(4))}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <i className="ph ph-shuffle"></i> Losuj PIN (4 cyfry)
                            </button>
                            {reportPin && (
                              <button
                                type="button"
                                onClick={() => setReportPin('')}
                                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Wyczyść (Otwarte)
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input
                            type="text"
                            data-testid="region-report-pin-input"
                            value={reportPin}
                            onChange={e => setReportPin(e.target.value)}
                            placeholder="Brak PIN-u (lub wpisz np. 4829)"
                            className="w-full sm:max-w-xs p-2.5 border border-amber-300 rounded-lg font-mono font-bold text-sm tracking-widest bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <p className="text-xs text-amber-800 leading-snug">
                            Chroni przed przypadkowymi zgłoszeniami z kodów QR (np. w częściach wspólnych nieruchomości). Dotyczy wyłącznie zgłoszeń anonimowych — zalogowani pracownicy nie podają PIN-u.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Konfiguracja podmapy miejsca montażu (opcjonalnie; lokalizację pineski ustawia się podczas edycji mapy) */}
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <label className="block text-sm font-bold text-gray-800">
                            Podmapa miejsca montażu (opcjonalnie)
                          </label>
                          <p className="text-xs text-gray-500">
                            Lokalizację (pineskę) tego miejsca montażu ustawisz bezpośrednio podczas edycji mapy. Tutaj możesz opcjonalnie przypisać podmapy.
                          </p>
                        </div>
                        <div className="flex bg-gray-200/80 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setMapType('none')}
                            className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                              mapType === 'none'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Brak podmapy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMapType('google');
                              setSubmapsDraft(prev => {
                                if (prev.length === 0) {
                                  const first = {
                                    id: 'default',
                                    name: 'Podmapa 1',
                                    mapType: 'google',
                                    mapImageUrl: mapImageUrl || '',
                                    file: mapFile || null,
                                  };
                                  setActiveDraftTabId('default');
                                  setSubmapNameInput('Podmapa 1');
                                  return [first];
                                }
                                return prev.map(s =>
                                  s.id === activeDraftTabId ? { ...s, mapType: 'google' } : s
                                );
                              });
                            }}
                            className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                              mapType === 'google'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            <i className="ph ph-globe-hemisphere-west text-sm"></i> Mapa Google
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMapType('image');
                              setSubmapsDraft(prev => {
                                if (prev.length === 0) {
                                  const first = {
                                    id: 'default',
                                    name: 'Podmapa 1',
                                    mapType: 'image',
                                    mapImageUrl: mapImageUrl || '',
                                    file: mapFile || null,
                                  };
                                  setActiveDraftTabId('default');
                                  setSubmapNameInput('Podmapa 1');
                                  return [first];
                                }
                                return prev.map(s =>
                                  s.id === activeDraftTabId ? { ...s, mapType: 'image' } : s
                                );
                              });
                            }}
                            className={`py-1.5 px-3 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                              mapType === 'image'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            <i className="ph ph-image text-sm"></i> Mapa JPG / PNG
                          </button>
                        </div>
                      </div>

                      {mapType !== 'none' && (
                        <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl space-y-3">
                          <div>
                            <h4 className="text-xs md:text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                              <i className="ph ph-stack text-indigo-600 text-base"></i>
                              <span>Równorzędne podmapy miejsca montażu</span>
                            </h4>
                            <p className="text-[11px] text-indigo-700/80">
                              Domyślny opis to Podmapa 1, Podmapa 2... Możesz zmienić nazwę wybranej podmapy i kliknąć „Zapisz nazwę”.
                            </p>
                          </div>

                          {/* Zakładki równorzędnych podmap oraz przycisk dodawania przesuwający się w dół */}
                          {(() => {
                            const effectiveDrafts =
                              submapsDraft.length > 0
                                ? submapsDraft
                                : [
                                    {
                                      id: 'default',
                                      name: 'Podmapa 1',
                                      mapType: mapType === 'google' ? 'google' : 'image',
                                      mapImageUrl: mapImageUrl || '',
                                      file: mapFile || null,
                                    },
                                  ];
                            const currentDraft =
                              effectiveDrafts.find(d => d.id === activeDraftTabId) || effectiveDrafts[0];

                            return (
                              <>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {effectiveDrafts.map((d, idx) => {
                                    const isAct = d.id === currentDraft.id;
                                    return (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => {
                                          setActiveDraftTabId(d.id);
                                          setSubmapNameInput(d.name || `Podmapa ${idx + 1}`);
                                          setMapType(d.mapType === 'google' ? 'google' : 'image');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                          isAct
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-white text-slate-700 border border-indigo-200 hover:bg-indigo-100/60'
                                        }`}
                                      >
                                        <i className={`ph ${d.mapType === 'google' ? 'ph-globe-hemisphere-west' : 'ph-image'}`}></i>
                                        <span>{idx + 1}. {d.name || `Podmapa ${idx + 1}`}</span>
                                        {(d.mapImageUrl || d.file || d.mapType === 'google') && (
                                          <i className="ph-fill ph-check-circle text-emerald-300 text-xs"></i>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Przycisk dodawania podmapy pod listą – przesuwa się w dół wraz z przybywaniem podmap */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubmapsDraft(prev => {
                                        const base =
                                          prev.length > 0
                                            ? prev
                                            : [
                                                {
                                                  id: 'default',
                                                  name: 'Podmapa 1',
                                                  mapType: mapType === 'google' ? 'google' : 'image',
                                                  mapImageUrl: mapImageUrl || '',
                                                  file: mapFile || null,
                                                },
                                              ];
                                        const nextNum = base.length + 1;
                                        const newId = `sub_${Date.now()}`;
                                        const defaultNewName = `Podmapa ${nextNum}`;
                                        const added = {
                                          id: newId,
                                          name: defaultNewName,
                                          mapType: 'image',
                                          mapImageUrl: '',
                                          file: null,
                                        };
                                        setActiveDraftTabId(newId);
                                        setSubmapNameInput(defaultNewName);
                                        setMapType('image');
                                        return [...base, added];
                                      });
                                    }}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <i className="ph ph-plus-bold"></i>
                                    <span>Dodaj podmapę</span>
                                  </button>
                                </div>

                                <div className="bg-white border border-indigo-200 p-3.5 rounded-xl space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nazwa podmapy
                                      </label>
                                      <div className="flex gap-1.5">
                                        <input
                                          type="text"
                                          value={submapNameInput}
                                          onChange={e => setSubmapNameInput(e.target.value)}
                                          placeholder="Podmapa"
                                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const trimmed = submapNameInput.trim() || 'Podmapa 1';
                                            setSubmapNameInput(trimmed);
                                            setSubmapsDraft(prev => {
                                              const list = prev.length > 0 ? prev : effectiveDrafts;
                                              return list.map(item =>
                                                item.id === currentDraft.id ? { ...item, name: trimmed } : item
                                              );
                                            });
                                          }}
                                          className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                                        >
                                          Zapisz nazwę
                                        </button>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Rodzaj mapy
                                      </label>
                                      <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMapType('google');
                                            setSubmapsDraft(prev => {
                                              const list = prev.length > 0 ? prev : effectiveDrafts;
                                              return list.map(item =>
                                                item.id === currentDraft.id ? { ...item, mapType: 'google' } : item
                                              );
                                            });
                                          }}
                                          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-all ${
                                            currentDraft.mapType === 'google'
                                              ? 'bg-white text-emerald-600 shadow-xs'
                                              : 'text-slate-600'
                                          }`}
                                        >
                                          Mapa Google
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMapType('image');
                                            setSubmapsDraft(prev => {
                                              const list = prev.length > 0 ? prev : effectiveDrafts;
                                              return list.map(item =>
                                                item.id === currentDraft.id ? { ...item, mapType: 'image' } : item
                                              );
                                            });
                                          }}
                                          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-all ${
                                            currentDraft.mapType !== 'google'
                                              ? 'bg-white text-blue-600 shadow-xs'
                                              : 'text-slate-600'
                                          }`}
                                        >
                                          Mapa JPG / PNG
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex justify-end">
                                      {effectiveDrafts.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const remaining = effectiveDrafts.filter(item => item.id !== currentDraft.id);
                                            setSubmapsDraft(remaining);
                                            setActiveDraftTabId(remaining[0]?.id || 'default');
                                            setSubmapNameInput(remaining[0]?.name || 'Podmapa 1');
                                          }}
                                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                          <i className="ph ph-trash"></i>
                                          <span>Usuń tę podmapę</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {currentDraft.mapType !== 'google' ? (
                                    <div className="pt-2 border-t border-slate-100">
                                      <label className="block text-xs font-bold text-blue-900 mb-1.5">
                                        Wgraj plik podmapy dla: <span className="text-indigo-600">{currentDraft.name || 'Podmapa'}</span> (JPG lub PNG)
                                      </label>
                                      {currentDraft.mapImageUrl && !currentDraft.file && (
                                        <div className="mb-2 relative w-40 h-24 rounded-md overflow-hidden border border-gray-300">
                                          <img src={currentDraft.mapImageUrl} className="w-full h-full object-cover" alt={currentDraft.name} />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (currentDraft.id === 'default') setMapImageUrl('');
                                              setSubmapsDraft(prev => {
                                                const list = prev.length > 0 ? prev : effectiveDrafts;
                                                return list.map(item =>
                                                  item.id === currentDraft.id ? { ...item, mapImageUrl: '' } : item
                                                );
                                              });
                                            }}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                                          >
                                            <i className="ph ph-x text-xs"></i>
                                          </button>
                                        </div>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const pickedFile = e.target.files?.[0] || null;
                                          if (currentDraft.id === 'default') setMapFile(pickedFile);
                                          setSubmapsDraft(prev => {
                                            const list = prev.length > 0 ? prev : effectiveDrafts;
                                            return list.map(item =>
                                              item.id === currentDraft.id ? { ...item, file: pickedFile } : item
                                            );
                                          });
                                        }}
                                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                      />
                                      {currentDraft.file && (
                                        <p className="text-xs text-emerald-700 font-semibold mt-1">
                                          Wybrano plik: {currentDraft.file.name}
                                        </p>
                                      )}
                                      {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="mt-2 text-xs font-bold text-blue-600">
                                          {t('admin.regions.uploading')}
                                          {Math.round(uploadProgress)}%
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                                        <span>
                                          Przesuń mapę myszką i przybliż rolką, aby ustawić domyślny widok tej podmapy Google.
                                        </span>
                                        <select
                                          value={googleMapStyle}
                                          onChange={e => setGoogleMapStyle(e.target.value)}
                                          className="p-1.5 border border-emerald-300 rounded-md text-xs bg-white text-slate-800 font-semibold"
                                        >
                                          <option value="k">Satelita + Ulice</option>
                                          <option value="s">Satelita (czysty)</option>
                                          <option value="m">Drogowa</option>
                                        </select>
                                      </div>
                                      <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-inner bg-slate-900">
                                        <InteractiveGoogleMap
                                          lat={googleLat}
                                          lng={googleLng}
                                          zoom={googleZoom}
                                          mapStyle={googleMapStyle}
                                          interactive={true}
                                          onViewChange={(next) => {
                                            setGoogleLat(next.lat);
                                            setGoogleLng(next.lng);
                                            setGoogleZoom(next.zoom);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFormOpen(false);
                          resetForm();
                        }}
                        className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                      >
                        Anuluj
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                      >
                        {loading
                          ? t('admin.regions.saving', 'Zapisywanie...')
                          : editingId
                            ? t('admin.regions.save_changes', 'Zapisz zmiany')
                            : t('admin.regions.add_region', 'Dodaj miejsce montażu')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Pasek zarządzania Globalnym PIN-em Floty oraz informacja o PIN-ach rejonów */}
          <div
            data-testid="regions-global-fleet-pin-bar"
            className="mx-3 sm:mx-4 my-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <i className="ph-fill ph-truck text-emerald-600 text-lg"></i>
                <span>Globalny PIN Zgłoszeń Floty Samochodowej (dla wszystkich pojazdów)</span>
                {(branding?.globalFleetPin || mainMapSettings?.globalFleetPin) ? (
                  <span
                    data-testid="regions-active-fleet-pin-badge"
                    className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[11px] font-mono font-black tracking-wider"
                  >
                    PIN: {branding?.globalFleetPin || mainMapSettings?.globalFleetPin}
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Brak (Otwarte)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Obowiązuje przy zgłoszeniach anonimowych dla wszystkich samochodów nieposiadających indywidualnego PIN-u (indywidualny PIN pojazdu ustawisz w edycji pojazdu).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="text"
                data-testid="regions-global-fleet-pin-input"
                value={globalFleetPinInput}
                onChange={e => setGlobalFleetPinInput(e.target.value)}
                placeholder="Wpisz PIN floty (np. 5520)"
                className="w-44 px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono font-bold tracking-widest bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                data-testid="regions-generate-fleet-pin-btn"
                onClick={() => {
                  const newPin = generateRandomReportPin(4);
                  handleSaveGlobalFleetPin(newPin);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Wylosuj i zapisz nowy 4-cyfrowy Globalny PIN Floty"
              >
                <i className="ph ph-shuffle"></i> Losuj nowy
              </button>
              <button
                type="button"
                data-testid="regions-save-fleet-pin-btn"
                onClick={() => handleSaveGlobalFleetPin(globalFleetPinInput)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <i className="ph ph-floppy-disk"></i> Zapisz PIN Floty
              </button>
              {(branding?.globalFleetPin || mainMapSettings?.globalFleetPin) && (
                <button
                  type="button"
                  onClick={() => handleSaveGlobalFleetPin('')}
                  className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Wyłącz
                </button>
              )}
              {fleetPinSavedMsg && (
                <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                  {fleetPinSavedMsg}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="lg:hidden flex flex-col gap-1.5 p-2">
              {(() => {
                const mainMapMachines = machines.filter(
                  m =>
                    (m.regionId === 'main_map' || !m.regionId) && !m.isDeleted && !m.parentId
                );
                const topRegions = regions.filter(c => !c.parentId && !c.isDeleted);
                const mainMapImageUrl = mainMapSettings?.mapUrl || mainMapSettings?.imageUrl || '';
                const isMainGoogle =
                  mainMapSettings?.mapType === 'google' ||
                  Boolean(!mainMapImageUrl && (mainMapSettings?.googleFrameSaved || mainMapSettings?.googleQuery));
                const mainReady = Boolean(isMainGoogle || mainMapImageUrl);
                return (
                  <div className="bg-blue-50/40 p-3 rounded-xl shadow-sm border-2 border-blue-200 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-black text-[#002b5e] text-lg flex items-center gap-1.5">
                          <i className="ph-fill ph-map-trifold text-blue-600"></i>
                          <span>MAPA GŁÓWNA</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Domyślna
                          </span>
                        </h4>
                        {topRegions.length > 0 && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Podmiejsca ({topRegions.length}): {topRegions.map(c => c.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {mainReady && isMainGoogle ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <i className="ph ph-globe-hemisphere-west"></i> Google Maps
                          </span>
                        ) : mainReady && mainMapImageUrl ? (
                          <div className="flex flex-col items-end gap-1">
                            <span
                              onClick={() => handleEditMainMap('image')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold cursor-pointer transition-colors"
                              title="Ustawiono własną mapę graficzną (inną niż Google Maps)"
                            >
                              <i className="ph ph-image"></i> Mapa graficzna (JPG/PNG)
                            </span>
                            <a
                              href={mainMapImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 w-12 h-8 rounded-md overflow-hidden border border-gray-200"
                            >
                              <img
                                src={mainMapImageUrl}
                                alt="Mapa Główna"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditMainMap('google')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold transition-colors"
                          >
                            <i className="ph ph-map-trifold"></i> Ustaw mapę rejonu
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddSubmapForRegion({ id: 'main_map' })}
                          className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          + Dodaj podmapę
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {mainMapSettings?.description ||
                        'Główna mapa zakładu / obiektów (nadrzędna dla wszystkich rejonów)'}
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-white/80 border border-blue-200 rounded-lg px-2.5 py-1.5 mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <i className="ph-fill ph-key text-amber-600"></i> PIN zgłoszeń (Anonim):
                      </span>
                      <div className="flex items-center gap-1.5">
                        {mainMapSettings?.reportPin || branding?.mainMapReportPin ? (
                          <span className="font-mono font-black text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            {mainMapSettings?.reportPin || branding?.mainMapReportPin}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Brak (Otwarte)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateRegionPin('main_map', generateRandomReportPin(4))}
                          className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Losuj PIN
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2 font-bold uppercase">
                      {t('admin.regions.machines_in_region', 'Urządzenia w miejscu montażu')}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {mainMapMachines.length > 0 ? (
                        mainMapMachines.map(m => (
                          <span
                            key={m.id}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">
                          {t('admin.regions.no_machines_assigned', 'Brak przypisanych urządzeń')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1.5 justify-end border-t border-blue-100 pt-2">
                      <button
                        onClick={() => handleEditMainMap()}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"
                      >
                        <i className="ph ph-pencil-simple text-sm"></i> {t('admin.regions.edit')}
                      </button>
                    </div>
                  </div>
                );
              })()}
              {hierarchicalRegions.map(item => {
                  const parentRegion = item.parentId ? regions.find(p => p.id === item.parentId) : null;
                  const submapReady = isRegionSubmapConfigured(item);
                  return (
                    <div
                      key={item.id}
                      style={{ marginLeft: item.depth > 0 ? `${Math.min(item.depth * 16, 64)}px` : undefined }}
                      className={`bg-white p-3 rounded-xl shadow-sm border flex flex-col ${
                        item.depth > 0 ? 'border-l-4 border-l-indigo-400 border-slate-200 bg-slate-50/50' : 'border-slate-200'
                      } ${item.isDeleted ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-[#002b5e] text-lg flex items-center gap-1.5">
                            {item.depth > 0 && <i className="ph ph-arrow-bend-down-right text-indigo-500"></i>}
                            <span>{item.name || t('admin.regions.without_name')}</span>
                          </h4>
                          {parentRegion && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-0.5">
                              <i className="ph ph-arrow-bend-down-right"></i> Podmapa w:{' '}
                              {item.ancestorPath?.length ? item.ancestorPath.join(' ➔ ') : parentRegion.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {submapReady && item.mapType === 'google' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <i className="ph ph-globe-hemisphere-west"></i> Google Maps
                            </span>
                          ) : submapReady && item.mapImageUrl ? (
                            <a
                              href={item.mapImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 w-12 h-8 rounded-md overflow-hidden border border-gray-200"
                            >
                              <img src={item.mapImageUrl} alt="Mapa" className="w-full h-full object-cover" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEdit(item, 'google')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold transition-colors"
                            >
                              <i className="ph ph-map-trifold"></i> Ustaw mapę rejonu
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddSubmapForRegion(item)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            + Dodaj podmapę
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.description || '-'}</p>
                      {(() => {
                        const resolvedMobilePin = resolveRegionReportPin(
                          item.id,
                          regions,
                          mainMapSettings,
                          branding
                        );
                        return (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-2">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <i className="ph-fill ph-key text-amber-600"></i> PIN zgłoszeń:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.reportPin ? (
                                <span className="font-mono font-black text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                  {item.reportPin}
                                </span>
                              ) : resolvedMobilePin.pin ? (
                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  ↳ {resolvedMobilePin.pin} ({resolvedMobilePin.sourceName})
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold">
                                  Brak (Otwarte)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickUpdateRegionPin(item.id, generateRandomReportPin(4))
                                }
                                className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Losuj PIN
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="text-xs text-gray-500 mb-2 font-bold uppercase">
                        {t('admin.regions.machines_in_region', 'Urządzenia w miejscu montażu')}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {machines.filter(m => m.regionId === item.id && !m.isDeleted && !m.parentId).length > 0 ? (
                          machines
                            .filter(m => m.regionId === item.id && !m.isDeleted && !m.parentId)
                            .map(m => (
                              <span
                                key={m.id}
                                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100"
                              >
                                {m.name}
                              </span>
                            ))
                        ) : (
                          <span className="text-gray-400 italic">
                            {t('admin.regions.no_machines_assigned', 'Brak przypisanych urządzeń')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"
                        >
                          <i className="ph ph-pencil-simple text-sm"></i> {t('admin.regions.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"
                        >
                          <i className="ph ph-trash text-sm"></i> {t('admin.regions.delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <table className="w-full text-left hidden lg:table border-collapse relative">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('admin.regions.region_name', 'Nazwa miejsca montażu')}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('admin.regions.description')}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('admin.regions.machines_in_region', 'Urządzenia w miejscu montażu')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    PIN zgłoszeń (Anonim)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('admin.regions.submap', 'MAPA')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('admin.regions.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  const mainMapMachines = machines.filter(
                    m =>
                      (m.regionId === 'main_map' || !m.regionId) && !m.isDeleted && !m.parentId
                  );
                  const topRegions = regions.filter(c => !c.parentId && !c.isDeleted);
                  const mainMapImageUrl = mainMapSettings?.mapUrl || mainMapSettings?.imageUrl || '';
                  const isMainGoogle =
                    mainMapSettings?.mapType === 'google' ||
                    Boolean(!mainMapImageUrl && (mainMapSettings?.googleFrameSaved || mainMapSettings?.googleQuery));
                  const mainReady = Boolean(isMainGoogle || mainMapImageUrl);
                  return (
                    <tr className="bg-blue-50/40 hover:bg-blue-50/70 border-b-2 border-blue-100">
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start">
                          <div className="font-black text-[#002b5e] flex items-center gap-2">
                            <i className="ph-fill ph-map-trifold text-blue-600 text-lg"></i>
                            <span>MAPA GŁÓWNA</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Domyślna
                            </span>
                          </div>
                          {topRegions.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Podmiejsca ({topRegions.length}):{' '}
                              {topRegions.map(c => c.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {mainMapSettings?.description ||
                          'Główna mapa zakładu / obiektów (nadrzędna dla wszystkich rejonów)'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {mainMapMachines.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {mainMapMachines.map(m => (
                              <span
                                key={m.id}
                                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100"
                              >
                                {m.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            {t('admin.regions.no_machines_assigned', 'Brak przypisanych urządzeń')}
                          </span>
                        )}
                      </td>
                      <td
                        data-testid="region-pin-cell-main_map"
                        className="px-6 py-4 text-center"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {mainMapSettings?.reportPin || branding?.mainMapReportPin ? (
                            <span
                              data-testid="region-pin-badge-main_map"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 text-xs font-mono font-black tracking-wider"
                            >
                              <i className="ph-fill ph-key text-amber-600"></i>
                              {mainMapSettings?.reportPin || branding?.mainMapReportPin}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Brak (Otwarte)
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              data-testid="quick-rotate-pin-main_map"
                              onClick={() =>
                                handleQuickUpdateRegionPin('main_map', generateRandomReportPin(4))
                              }
                              className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="Wylosuj nowy 4-cyfrowy PIN dla Mapy Głównej"
                            >
                              <i className="ph ph-shuffle"></i> Zmień PIN
                            </button>
                            {(mainMapSettings?.reportPin || branding?.mainMapReportPin) && (
                              <button
                                type="button"
                                onClick={() => handleQuickUpdateRegionPin('main_map', '')}
                                className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                                title="Wyłącz wymóg PIN-u dla Mapy Głównej"
                              >
                                Wyłącz
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {mainReady && isMainGoogle ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"
                              title={mainMapSettings.googleQuery}
                            >
                              <i className="ph ph-globe-hemisphere-west text-sm"></i> Google (
                              {mainMapSettings.googleQuery || 'Mapa Główna'})
                            </span>
                          ) : mainReady && mainMapImageUrl ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                onClick={() => handleEditMainMap('image')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition-colors"
                                title="Ustawiono własną mapę graficzną (inną niż Google Maps) — kliknij, aby edytować"
                              >
                                <i className="ph ph-image text-sm"></i> Mapa graficzna (JPG/PNG)
                              </span>
                              <a
                                href={mainMapImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shadow-sm relative group block"
                                title="Kliknij by powiększyć Mapę Główną"
                              >
                                <img
                                  src={mainMapImageUrl}
                                  alt="Mapa Główna"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <i className="ph ph-magnifying-glass-plus text-white"></i>
                                </div>
                              </a>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEditMainMap('image')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <i className="ph ph-map-trifold text-sm"></i> Ustaw mapę rejonu
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddSubmapForRegion({ id: 'main_map' })}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            + Dodaj podmapę
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditMainMap()}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                          >
                            <i className="ph ph-pencil-simple"></i> {t('admin.users.edit')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
                {hierarchicalRegions.map(r => {
                  const regionMachines = machines.filter(m => m.regionId === r.id && !m.isDeleted && !m.parentId);
                  const parentRegion = r.parentId ? regions.find(p => p.id === r.parentId) : null;
                  const childRegions = regions.filter(c => c.parentId === r.id && !c.isDeleted);
                  const submapReady = isRegionSubmapConfigured(r);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 ${
                        r.depth === 0 ? 'bg-white' : r.depth === 1 ? 'bg-slate-50/50' : 'bg-indigo-50/20'
                      } ${r.isDeleted ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div
                          style={{ paddingLeft: r.depth > 0 ? `${r.depth * 28}px` : undefined }}
                          className="flex flex-col items-start"
                        >
                          <div className="font-bold text-gray-800 flex items-center gap-1.5">
                            {r.depth > 0 && (
                              <span className="text-indigo-500 font-normal flex items-center">
                                <i className="ph ph-arrow-bend-down-right text-base"></i>
                              </span>
                            )}
                            <span>{r.name || t('admin.regions.without_name')}</span>
                          </div>
                          {parentRegion && (
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1">
                              <i className="ph ph-arrow-bend-down-right"></i> Podmapa w:{' '}
                              {r.ancestorPath?.length ? r.ancestorPath.join(' ➔ ') : parentRegion.name}
                            </div>
                          )}
                          {childRegions.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Podmiejsca ({childRegions.length}): {childRegions.map(c => c.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{r.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {regionMachines.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {regionMachines.map(m => (
                              <span
                                key={m.id}
                                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100"
                              >
                                {m.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            {t('admin.regions.no_machines_assigned', 'Brak przypisanych urządzeń')}
                          </span>
                        )}
                      </td>
                      <td
                        data-testid={`region-pin-cell-${r.id}`}
                        className="px-6 py-4 text-center"
                      >
                        {(() => {
                          const resolvedPin = resolveRegionReportPin(
                            r.id,
                            regions,
                            mainMapSettings,
                            branding
                          );
                          return (
                            <div className="flex flex-col items-center gap-1">
                              {r.reportPin ? (
                                <span
                                  data-testid={`region-pin-badge-${r.id}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 text-xs font-mono font-black tracking-wider"
                                >
                                  <i className="ph-fill ph-key text-amber-600"></i>
                                  {r.reportPin}
                                </span>
                              ) : resolvedPin.pin ? (
                                <span
                                  data-testid={`region-pin-badge-${r.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-mono font-bold"
                                  title={`Dziedziczy PIN z: ${resolvedPin.sourceName}`}
                                >
                                  ↳ {resolvedPin.pin}{' '}
                                  <span className="font-sans font-normal text-[10px] text-indigo-600">
                                    ({resolvedPin.sourceName})
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">
                                  Brak (Otwarte)
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  data-testid={`quick-rotate-pin-${r.id}`}
                                  onClick={() =>
                                    handleQuickUpdateRegionPin(r.id, generateRandomReportPin(4))
                                  }
                                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                  title="Wylosuj nowy 4-cyfrowy PIN dla tej lokalizacji"
                                >
                                  <i className="ph ph-shuffle"></i>{' '}
                                  {r.reportPin ? 'Zmień PIN' : 'Ustaw PIN'}
                                </button>
                                {r.reportPin && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickUpdateRegionPin(r.id, '')}
                                    className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                                    title="Wyłącz własny PIN tej lokalizacji"
                                  >
                                    Wyłącz
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const configuredSubs = getRegionSubmaps(r).filter(s => s.submapConfigured);
                          if (configuredSubs.length > 1) {
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                                  <i className="ph ph-stack"></i> {configuredSubs.length} podmapy
                                </span>
                                <div className="flex flex-wrap justify-center gap-1">
                                  {configuredSubs.map((sub) => (
                                    <span
                                      key={sub.id}
                                      onClick={() => handleEdit(r)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 text-[10px] font-semibold cursor-pointer transition-colors"
                                      title={`Kliknij by edytować podmapę: ${sub.name}`}
                                    >
                                      <i className={`ph ${sub.mapType === 'google' ? 'ph-globe-hemisphere-west text-emerald-600' : 'ph-image text-blue-600'}`}></i>
                                      <span>{sub.name}</span>
                                    </span>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubmapForRegion(r)}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  + Dodaj podmapę
                                </button>
                              </div>
                            );
                          }
                          if (submapReady && r.mapType === 'google') {
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"
                                  title={r.googleQuery}
                                >
                                  <i className="ph ph-globe-hemisphere-west text-sm"></i> Google ({r.googleQuery || 'Mapa'})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubmapForRegion(r)}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  + Dodaj podmapę
                                </button>
                              </div>
                            );
                          }
                          if (submapReady && (configuredSubs[0]?.mapImageUrl || r.mapImageUrl)) {
                            const imgUrl = configuredSubs[0]?.mapImageUrl || r.mapImageUrl;
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  onClick={() => handleEdit(r, 'image')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition-colors"
                                  title="Ustawiono własną mapę graficzną (inną niż Google Maps) — kliknij, aby edytować"
                                >
                                  <i className="ph ph-image text-sm"></i> Mapa graficzna (JPG/PNG)
                                </span>
                                <a
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shadow-sm relative group block"
                                  title="Kliknij by powiększyć mapę"
                                >
                                  <img src={imgUrl} alt="Mapa" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="ph ph-magnifying-glass-plus text-white"></i>
                                  </div>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubmapForRegion(r)}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  + Dodaj podmapę
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(r, 'image')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <i className="ph ph-map-trifold text-sm"></i> Ustaw mapę rejonu
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddSubmapForRegion(r)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                              >
                                + Dodaj podmapę
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(r)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                          >
                            <i className="ph ph-pencil-simple"></i> {t('admin.users.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                          >
                            <i className="ph ph-trash"></i> {t('admin.users.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {regions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {t('admin.regions.empty_list')}
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
