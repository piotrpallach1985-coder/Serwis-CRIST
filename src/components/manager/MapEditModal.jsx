/**
 * MapEditModal — Modal przypinania rejonu (podmapy/osiedla) lub maszyny/urządzenia na mapie.
 * Obsługuje zarówno kliknięcie na mapie, jak i wyszukiwanie po adresie (Miejscowość, ulica i numer) dla Mapy Google.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isMachinePinnedOnSubmap, getRegionSubmaps, doesEntityBelongToSubmapTab } from '../../hooks/useMapPins';
import { geocodeAddressQuery, searchAddressSuggestions } from './map/InteractiveGoogleMap';

export default function MapEditModal({
  isModalOpen,
  editingType,
  setEditingType,
  editingId,
  setEditingId,
  currentSubmapId,
  currentSubmapTabId = null,
  regions,
  machines,
  isGoogleMap = false,
  tempPos,
  onSave,
  onClose,
}) {
  const { t } = useTranslation();

  const [addressQuery, setAddressQuery] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [resolvedGeo, setResolvedGeo] = useState(null);
  const skipAutoSuggestRef = useRef(false);

  useEffect(() => {
    if (isModalOpen) {
      skipAutoSuggestRef.current = true;
      setAddressQuery(tempPos?.address || '');
      setAddressError('');
      setSuggestions([]);
      if (tempPos?.lat != null && tempPos?.lng != null) {
        setResolvedGeo({
          lat: Number(tempPos.lat),
          lng: Number(tempPos.lng),
          displayName: tempPos.address || `${Number(tempPos.lat).toFixed(5)}, ${Number(tempPos.lng).toFixed(5)}`,
          fromClick: Boolean(tempPos.fromClick),
        });
      } else {
        setResolvedGeo(null);
      }
    }
  }, [isModalOpen, tempPos]);

  useEffect(() => {
    if (!isModalOpen || !isGoogleMap) return;
    if (skipAutoSuggestRef.current) {
      skipAutoSuggestRef.current = false;
      return;
    }
    const q = addressQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      const results = await searchAddressSuggestions(q);
      if (!cancelled) {
        setSearchingAddress(false);
        setSuggestions(results);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addressQuery, isModalOpen, isGoogleMap]);

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

  const hasCoords = (item) =>
    (item.xPercent != null && item.yPercent != null) || (item.lat != null && item.lng != null);

  const getSelectableItems = () => {
    const activeRegions = regions.filter(r => !r.isDeleted);
    if (editingType === 'region') {
      if (currentSubmapId === null) {
        const candidates = activeRegions.filter(r => !r.parentId);
        return {
          unpinned: candidates.filter(r => !hasCoords(r)),
          pinned: candidates.filter(r => hasCoords(r)),
        };
      } else {
        const forbiddenIds = getAncestorAndSelfIds(currentSubmapId);
        return {
          unpinned: activeRegions.filter(
            r =>
              !forbiddenIds.has(r.id) &&
              !hasCoords(r) &&
              (!r.parentId || r.parentId === currentSubmapId)
          ),
          pinned: activeRegions.filter(
            r => !forbiddenIds.has(r.id) && hasCoords(r) && r.parentId === currentSubmapId
          ),
        };
      }
    } else {
      const mainMachines = machines.filter(m => (!m.parentId || m.parentId === '') && !m.isDeleted);
      if (currentSubmapId !== null) {
        const inRegion = mainMachines.filter(
          m => (!m.regionId || m.regionId === currentSubmapId) && m.regionId !== 'main_map'
        );
        return {
          unpinned: inRegion.filter(m => !hasCoords(m)),
          pinned: inRegion.filter(
            m => isMachinePinnedOnSubmap(m, currentSubmapId, activeRegions, currentSubmapTabId)
          ),
        };
      }
      return {
        unpinned: mainMachines.filter(m => !hasCoords(m)),
        pinned: mainMachines.filter(m => hasCoords(m)),
      };
    }
  };

  const currentRegionObj = currentSubmapId ? regions.find(r => r.id === currentSubmapId) : null;
  const currentRegionTabs = currentRegionObj ? getRegionSubmaps(currentRegionObj) : [];
  const getAssignedTabLabel = (item) => {
    if (!currentSubmapId || currentRegionTabs.length <= 1) return '';
    if (!hasCoords(item) || item.pinnedOnMap === 'main') return '';
    const tab = currentRegionTabs.find(t => doesEntityBelongToSubmapTab(item, currentRegionTabs, t.id));
    return tab ? ` [${tab.name}]` : '';
  };

  const { unpinned: unpinnedItems, pinned: pinnedItems } = getSelectableItems();

  const handleSearchAddress = async () => {
    const q = addressQuery.trim();
    if (!q) return;
    setSearchingAddress(true);
    setAddressError('');
    const results = await searchAddressSuggestions(q);
    setSearchingAddress(false);
    if (results.length > 0) {
      setSuggestions(results);
      setResolvedGeo(results[0]);
    } else {
      setSuggestions([]);
      setAddressError(t('map_component.address_not_found', 'Nie znaleziono adresu. Sprawdź pisownię (np. Gdańsk, Długa 10).'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    let finalGeo = resolvedGeo;
    const trimmedQuery = addressQuery.trim();

    if (isGoogleMap && trimmedQuery && (!finalGeo || finalGeo.fromClick)) {
      setSearchingAddress(true);
      setAddressError('');
      const geo = await geocodeAddressQuery(trimmedQuery);
      setSearchingAddress(false);
      if (geo) {
        finalGeo = geo;
        setResolvedGeo(geo);
      } else if (!tempPos || (tempPos.xPercent == null && tempPos.lat == null)) {
        setAddressError(t('map_component.address_not_found', 'Nie znaleziono podanego adresu. Sprawdź miejscowość, ulicę i numer.'));
        return;
      }
    }

    onSave(e, {
      lat: finalGeo?.lat ?? tempPos?.lat ?? null,
      lng: finalGeo?.lng ?? tempPos?.lng ?? null,
      address: trimmedQuery || finalGeo?.displayName || tempPos?.address || '',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
            <i className="ph ph-push-pin text-blue-600 text-base md:text-xl"></i>
            {t('map_component.pin_object')}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <i className="ph ph-x text-base md:text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Typ: Miejsce montażu vs Konkretne Urządzenie */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setEditingType('region');
                setEditingId('');
              }}
              className={`flex-1 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all ${
                editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {currentSubmapId !== null
                ? t('map_component.subregion_submap', 'Podrejon / Podmapa')
                : t('map_component.region_hall', 'Miejsce montażu')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingType('machine');
                setEditingId('');
              }}
              className={`flex-1 py-2 text-[11px] md:text-xs font-bold rounded-md transition-all ${
                editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('map_component.specific_machine', 'Konkretne Urządzenie')}
            </button>
          </div>

          {/* Wyszukiwanie po miejscowości, ulicy i numerze (dla Mapy Google) */}
          {isGoogleMap && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <i className="ph ph-map-pin-line mr-1"></i>
                {t('map_component.address_label', 'Miejscowość, ulica i numer')}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={e => {
                    setAddressQuery(e.target.value);
                    setAddressError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchAddress();
                    }
                  }}
                  placeholder={t('map_component.address_placeholder', 'np. Warszawa, ul. Prosta 10 / Gdańsk, ul. Długa 10')}
                  className="flex-1 p-2.5 text-xs md:text-sm border border-emerald-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  disabled={searchingAddress || !addressQuery.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                >
                  <i className={`ph ${searchingAddress ? 'ph-spinner-gap animate-spin' : 'ph-magnifying-glass'}`}></i>
                  <span>{t('map_component.search_address_btn', 'Szukaj')}</span>
                </button>
              </div>

              {addressError && (
                <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                  <i className="ph ph-warning-circle"></i>
                  <span>{addressError}</span>
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-white border border-emerald-200 rounded-lg divide-y divide-slate-100 text-[11px] shadow-sm">
                  {suggestions.map((sug, idx) => {
                    const isSelected = resolvedGeo && resolvedGeo.lat === sug.lat && resolvedGeo.lng === sug.lng;
                    return (
                      <button
                        key={`${sug.lat}-${sug.lng}-${idx}`}
                        type="button"
                        onClick={() => {
                          skipAutoSuggestRef.current = true;
                          setResolvedGeo(sug);
                          setAddressQuery(sug.displayName);
                          setSuggestions([]);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 transition-colors flex items-start gap-1.5 ${
                          isSelected ? 'bg-emerald-100/80 font-bold text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <i className="ph ph-map-pin text-emerald-600 shrink-0 mt-0.5"></i>
                        <span className="line-clamp-2">{sug.displayName}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {resolvedGeo && (
                <div className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between font-mono">
                  <span className="truncate mr-2">
                    <i className="ph ph-check-circle text-emerald-600 mr-1"></i>
                    GPS: {Number(resolvedGeo.lat).toFixed(5)}, {Number(resolvedGeo.lng).toFixed(5)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Wybór elementu */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {t('map_component.choose_element')}
            </label>
            <select
              value={editingId}
              onChange={e => setEditingId(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 font-medium text-xs md:text-sm"
              required
            >
              <option value="">{t('map_component.choose_from_list')}</option>
              {unpinnedItems.length > 0 && (
                <optgroup label={t('map_component.unpinned_items', 'Nieprzypięte na tej mapie (wolne)')}>
                  {unpinnedItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {getAssignedTabLabel(item)}
                    </option>
                  ))}
                </optgroup>
              )}
              {pinnedItems.length > 0 && (
                <optgroup label={t('map_component.already_pinned_items', 'Już przypięte (zmień lokalizację)')}>
                  {pinnedItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {getAssignedTabLabel(item)} {item.address ? `(${item.address})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {unpinnedItems.length === 0 && pinnedItems.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-2 font-semibold">
                <i className="ph ph-check-circle mr-1"></i>
                {editingType === 'region'
                  ? t('map_component.no_free_regions', 'Brak rejonów/podmap do przypięcia (dodaj nowy rejon w Słownikach -> Rejony).')
                  : currentSubmapId !== null
                    ? t('map_component.all_machines_pinned')
                    : t('map_component.no_objects_to_pin')}
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={!editingId || searchingAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-sm transition-colors text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <i className="ph ph-push-pin"></i>
              <span>{t('map_component.save_pin')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
