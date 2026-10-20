import { useAuth } from '../../../hooks/useAuth';
import React, { useState } from 'react';
import { USER_ROLES } from '../../../utils/constants';
import { useTranslation } from 'react-i18next';
import { geocodeAddressQuery, clampZoom } from './InteractiveGoogleMap';

export default function MapControls({
  mode,
  setMode,
  currentSubmapId,
  setCurrentSubmapId,
  breadcrumbPath = [],
  activeMapType = 'image',
  activeGoogleQuery = '',
  activeGoogleLat = 54.5364,
  activeGoogleLng = 18.5469,
  activeGoogleZoom = 18,
  activeGoogleStyle = 'k',
  isGoogleMap = false,
  isFramingGoogleMap = false,
  setIsFramingGoogleMap,
  draftGoogleView,
  setDraftGoogleView,
  onSaveGoogleMapConfig,
  onSwitchToImageMode,
  onOpenAddressPinModal,
  onGoogleZoomStep,
  onResetView100,
  displayZoomPercent = 100,
  isFullscreen,
  toggleFullscreen,
  zoomScale,
  setZoomScale,
  setZoomPan,
  saveDefaultView,
  uploadingMap,
  handleMapFileChange,
  mapDragActive,
  handleMapDragEnter,
  handleMapDragLeave,
  handleMapDragOver,
  handleMapDrop,
  isSettingsMinimized,
  setIsSettingsMinimized,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [tabType, setTabType] = useState(activeMapType || 'image');
  const [gQuery, setGQuery] = useState(activeGoogleQuery || '');
  const [searchingGeo, setSearchingGeo] = useState(false);
  const lastGeocodedQueryRef = React.useRef((activeGoogleQuery || '').trim());

  React.useEffect(() => {
    setTabType(activeMapType || 'image');
    setGQuery(activeGoogleQuery || '');
    lastGeocodedQueryRef.current = (activeGoogleQuery || '').trim();
  }, [currentSubmapId, activeMapType, activeGoogleQuery]);

  const parentSubmapId = breadcrumbPath.length > 1 ? breadcrumbPath[breadcrumbPath.length - 2].id : null;
  const currentRegionName = breadcrumbPath.length > 0 ? breadcrumbPath[breadcrumbPath.length - 1].name : t('map_component.main_map', 'Mapa Główna');

  const currentLat = draftGoogleView?.lat ?? activeGoogleLat ?? 54.5364;
  const currentLng = draftGoogleView?.lng ?? activeGoogleLng ?? 18.5469;
  const currentZoom = clampZoom(draftGoogleView?.zoom ?? activeGoogleZoom ?? 18);
  const currentStyle = draftGoogleView?.style ?? activeGoogleStyle ?? 'k';

  const handleSearchAddress = async (e) => {
    if (e) e.preventDefault();
    const trimmed = gQuery.trim();
    if (!trimmed) return;
    setSearchingGeo(true);
    const geo = await geocodeAddressQuery(trimmed);
    setSearchingGeo(false);
    if (geo && setDraftGoogleView) {
      lastGeocodedQueryRef.current = trimmed;
      setDraftGoogleView(prev => ({
        ...prev,
        lat: geo.lat,
        lng: geo.lng,
        zoom: clampZoom(prev?.zoom || 17),
      }));
    } else {
      alert(t('map_component.address_not_found_manual', 'Nie znaleziono podanego adresu. Możesz przesunąć mapę ręcznie myszką w wybrane miejsce.'));
    }
  };

  const handleSaveCurrentGoogleView = async () => {
    if (!onSaveGoogleMapConfig) return;
    let resolvedLat = Number(currentLat);
    let resolvedLng = Number(currentLng);
    const resolvedZoom = clampZoom(currentZoom);
    const trimmedQuery = gQuery.trim();

    if (trimmedQuery && trimmedQuery !== lastGeocodedQueryRef.current) {
      setSearchingGeo(true);
      const geo = await geocodeAddressQuery(trimmedQuery);
      setSearchingGeo(false);
      if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
        resolvedLat = Number(geo.lat);
        resolvedLng = Number(geo.lng);
        lastGeocodedQueryRef.current = trimmedQuery;
        if (setDraftGoogleView) {
          setDraftGoogleView(prev => ({
            ...prev,
            lat: resolvedLat,
            lng: resolvedLng,
            zoom: resolvedZoom,
          }));
        }
      }
    }

    onSaveGoogleMapConfig({
      mapType: 'google',
      googleQuery: trimmedQuery || `${resolvedLat.toFixed(5)}, ${resolvedLng.toFixed(5)}`,
      googleLat: resolvedLat,
      googleLng: resolvedLng,
      googleZoom: resolvedZoom,
      googleMapStyle: currentStyle || 'k',
    });
    if (setIsFramingGoogleMap) setIsFramingGoogleMap(false);
  };

  return (
    <>
      {/* Ustawienia mapy / podmapy (z-[150] aby żadna pinezka nie prześwitywała przez menu) */}
      {mode === 'edit' && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-14 sm:top-16 left-4 z-[150] bg-white p-3 md:p-4 rounded-xl shadow-2xl w-72 sm:w-88 border border-amber-200 animate-fade-in transition-all pointer-events-auto"
        >
          {isSettingsMinimized ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsMinimized(false);
              }}
              className="font-bold text-slate-800 text-[10px] md:text-sm flex items-center gap-2 w-full"
            >
              <i className="ph ph-sliders-horizontal text-amber-500 text-base"></i>
              <span>
                {t('map_component.map_options', 'Opcje Mapy')} ({currentSubmapId ? currentRegionName : t('map_component.main_short', 'Główna')})
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsMinimized(true);
                }}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-1"
              >
                <i className="ph ph-minus"></i>
              </button>
              <h3 className="font-bold text-slate-800 text-[10px] md:text-xs mb-2.5 border-b pb-2 flex items-center gap-1.5 pr-6 truncate">
                <i className="ph ph-map-trifold text-amber-500 text-base"></i>
                <span>
                  {t('map_component.background_label', 'Podkład')}: {currentSubmapId ? currentRegionName : t('map_component.main_map', 'Mapa Główna')}
                </span>
              </h3>

              {/* Przełącznik typu podkładu: Obraz vs Google Maps */}
              <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setTabType('image');
                    if (setIsFramingGoogleMap) setIsFramingGoogleMap(false);
                    if (activeMapType === 'google' && onSwitchToImageMode) onSwitchToImageMode();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    tabType === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <i className="ph ph-image"></i> {t('map_component.image_plan', 'Rzut / Plik')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTabType('google');
                    if (setIsFramingGoogleMap) setIsFramingGoogleMap(true);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    tabType === 'google' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <i className="ph ph-globe-hemisphere-west"></i> {t('map_component.google_map', 'Mapa Google')}
                </button>
              </div>

              {tabType === 'image' ? (
                <div className="mb-3">
                  <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">
                    {t('map_component.upload_new_map')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMapFileChange}
                      disabled={uploadingMap}
                      className="absolute inset-0 w-full h-full z-50 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div
                      className={
                        'w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors ' +
                        (mapDragActive
                          ? 'border-amber-500 bg-amber-50'
                          : uploadingMap
                            ? 'bg-slate-50 border-slate-300'
                            : 'bg-slate-50 border-blue-300 hover:bg-blue-50')
                      }
                      onDragEnter={handleMapDragEnter}
                      onDragLeave={handleMapDragLeave}
                      onDragOver={handleMapDragOver}
                      onDrop={handleMapDrop}
                    >
                      {uploadingMap ? (
                        <>
                          <i className="ph ph-spinner-gap animate-spin text-2xl text-blue-500 mb-2"></i>
                          <p className="text-[10px] md:text-xs font-bold text-slate-600">{t('map_component.processing')}</p>
                        </>
                      ) : (
                        <>
                          <i className="ph ph-upload-simple text-2xl text-blue-400 mb-2"></i>
                          <p className="text-[10px] md:text-xs font-bold text-slate-600">{t('map_component.click_or_drop')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 space-y-2.5 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                  <div>
                    <label className="block text-[9px] md:text-[11px] font-bold text-slate-700 mb-1">
                      {t('map_component.search_address_or_pan', '1. Wpisz miejscowość, ulicę i numer lub przesuń mapę')}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={gQuery}
                        onChange={e => setGQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSearchAddress(e);
                        }}
                        placeholder="np. Gdańsk, ul. Długa 10 / Gdynia..."
                        className="flex-1 p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        disabled={searchingGeo || !gQuery.trim()}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold rounded flex items-center gap-1 shrink-0"
                        title="Wyszukaj adres na mapie"
                      >
                        <i className={`ph ${searchingGeo ? 'ph-spinner-gap animate-spin' : 'ph-magnifying-glass'}`}></i>
                        <span>{t('map_component.search_address_btn', 'Szukaj')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Szybkie przypięcie pinezki do szukanego adresu (rejonu/osiedla lub maszyny/urządzenia) */}
                  {onOpenAddressPinModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAddressPinModal(gQuery)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <i className="ph ph-push-pin text-sm"></i>
                      <span>{t('map_component.pin_address_to_object', 'Przypnij pinezkę po adresie (rejon / urządzenie)')}</span>
                    </button>
                  )}

                  {/* Przełącznik: Przesuwanie mapy myszką vs Przypinanie pinezek kliknięciem */}
                  <div className="flex bg-white p-1 rounded-lg border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setIsFramingGoogleMap && setIsFramingGoogleMap(true)}
                      className={`flex-1 py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        isFramingGoogleMap
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <i className="ph ph-hand-grabbing"></i> {t('map_component.pan_map_mode', 'Kadruj mapę')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFramingGoogleMap && setIsFramingGoogleMap(false)}
                      className={`flex-1 py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        !isFramingGoogleMap
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <i className="ph ph-push-pin"></i> {t('map_component.pin_mode', 'Przypinaj pinezki')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] md:text-[11px] font-bold text-slate-700 mb-1">
                        {t('map_component.map_style', 'Typ mapy')}
                      </label>
                      <select
                        value={currentStyle}
                        onChange={e => setDraftGoogleView && setDraftGoogleView(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="k">{t('map_component.style_hybrid', 'Satelita + Ulice')}</option>
                        <option value="s">{t('map_component.style_satellite', 'Satelita (czysty)')}</option>
                        <option value="m">{t('map_component.style_road', 'Mapa drogowa')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] md:text-[11px] font-bold text-slate-700 mb-1">
                        Zoom ({Number(currentZoom).toFixed(2)})
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="5"
                        max="20"
                        value={currentZoom}
                        onChange={e =>
                          setDraftGoogleView &&
                          setDraftGoogleView(prev => ({ ...prev, zoom: clampZoom(e.target.value) }))
                        }
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-800 bg-emerald-100/70 px-2 py-1 rounded flex items-center justify-between font-mono">
                    <span>
                      Pozycja: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
                    </span>
                    <span>Zoom: {Number(currentZoom).toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCurrentGoogleView}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <i className="ph ph-floppy-disk text-sm"></i> {t('map_component.save_google_view', 'Wgraj ustawiony widok mapy')}
                  </button>
                </div>
              )}

              {tabType === 'image' && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">
                    {t('map_component.default_frame_zoom', 'Domyślny kadr i powiększenie')}
                  </label>
                  <button
                    onClick={saveDefaultView}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[9px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <i className="ph ph-floppy-disk"></i> {t('map_component.set_as_default_frame', 'Ustaw jako domyślny kadr')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Przyciski narzędzi i ścieżka podmap (górny lewy róg - z-[150] nad pinezkami) */}
      <div className="absolute top-4 left-4 z-[150] flex flex-wrap items-center gap-2 pointer-events-auto max-w-[85%]">
        {currentSubmapId && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 shadow-lg text-white">
            <button
              onClick={() => setCurrentSubmapId(parentSubmapId)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-[10px] md:text-xs flex items-center gap-1.5 transition-colors"
              title="Cofnij poziom wyżej"
            >
              <i className="ph ph-arrow-left text-sm"></i>
              <span className="hidden sm:inline">
                {parentSubmapId ? t('map_component.level_up', 'Poziom wyżej') : t('map_component.main_map', 'Mapa Główna')}
              </span>
            </button>
            <div className="hidden md:flex items-center gap-1 px-2 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setCurrentSubmapId(null)}
                className="text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {t('map_component.main_map', 'Mapa Główna')}
              </button>
              {breadcrumbPath.map((reg, idx) => (
                <React.Fragment key={reg.id}>
                  <i className="ph ph-caret-right text-slate-500 text-[10px]"></i>
                  <button
                    onClick={() => setCurrentSubmapId(reg.id)}
                    className={`whitespace-nowrap transition-colors ${
                      idx === breadcrumbPath.length - 1 ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {reg.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        {(user?.role === USER_ROLES.ADMIN ||
          user?.role === USER_ROLES.SUPERADMIN ||
          user?.permissions?.includes('edit_map')) && (
          <>
            <button
              onClick={() => setMode('view')}
              className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-2 transition-all shadow-md ${
                mode === 'view'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'
              }`}
            >
              <i className="ph ph-eye text-base sm:text-lg"></i>
              <span className="hidden sm:inline">{t('map_component.preview')}</span>
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-2 transition-all shadow-md ${
                mode === 'edit'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'
              }`}
            >
              <i className="ph ph-pencil-simple text-base sm:text-lg"></i>
              <span className="hidden sm:inline">{t('map_component.edit')}</span>
            </button>
            {mode === 'edit' && isGoogleMap && onOpenAddressPinModal && (
              <button
                type="button"
                onClick={() => onOpenAddressPinModal(gQuery)}
                className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md transition-colors"
              >
                <i className="ph ph-map-pin-line text-base sm:text-lg"></i>
                <span>{t('map_component.pin_by_address_short', 'Przypnij adres')}</span>
              </button>
            )}
          </>
        )}
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white flex items-center gap-2 shadow-md"
        >
          <i className={`ph ${isFullscreen ? 'ph-corners-in' : 'ph-corners-out'} text-base sm:text-lg`}></i>
          <span className="hidden sm:inline">
            {isFullscreen ? t('map_component.close_fullscreen') : t('map_component.fullscreen')}
          </span>
        </button>
      </div>

      {/* Kontrolki powiększenia (prawy dolny róg - z-[150] nad pinezkami) */}
      <div className="absolute bottom-[90px] lg:bottom-4 right-4 z-[150] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl pointer-events-auto">
        <button
          onClick={() => {
            if (isGoogleMap && onGoogleZoomStep) {
              onGoogleZoomStep(0.5);
            } else {
              setZoomScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 4));
            }
          }}
          className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-base md:text-xl shadow-sm transition-colors"
          title={t('map_component.zoom_in')}
        >
          +
        </button>
        <button
          onClick={() => {
            if (onResetView100) {
              onResetView100();
            } else {
              setZoomScale(1);
              setZoomPan({ x: 0, y: 0 });
            }
          }}
          className="w-9 h-9 flex items-center justify-center text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-mono font-bold shadow-sm transition-colors"
          title={t('map_component.zoom_reset')}
        >
          {isGoogleMap ? `${displayZoomPercent}%` : `${Math.round(zoomScale * 100)}%`}
        </button>
        <button
          onClick={() => {
            if (isGoogleMap && onGoogleZoomStep) {
              onGoogleZoomStep(-0.5);
            } else {
              setZoomScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 0.5));
            }
          }}
          className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-base md:text-xl shadow-sm transition-colors"
          title="Pomniejsz (-)"
        >
          -
        </button>
      </div>
    </>
  );
}
