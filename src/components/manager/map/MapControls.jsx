import { useAuth } from '../../../hooks/useAuth';
import React, { useState } from 'react';
import { USER_ROLES, PIN_STATUS } from '../../../utils/constants';
import { useTranslation } from 'react-i18next';
import { clampZoom } from './InteractiveGoogleMap';
import { usePermissions } from '../../../hooks/usePermissions';
import { useManagerStore } from '../../../store/managerStore';

export default function MapControls({
  mode,
  setMode,
  currentSubmapId,
  setCurrentSubmapId,
  currentSubmapTabId = null,
  setCurrentSubmapTabId,
  submapTabs = [],
  onAddParallelSubmap,
  onRenameParallelSubmap,
  onDeleteParallelSubmap,
  breadcrumbPath = [],
  activeMapType = 'image',
  onSelectMapType,
  activeGoogleQuery = '',
  activeGoogleLat = 54.5364,
  activeGoogleLng = 18.5469,
  activeGoogleZoom = 18,
  activeGoogleStyle = 'k',
  isGoogleMap = false,
  isFramingGoogleMap = true,
  setIsFramingGoogleMap,
  hasSavedGoogleFrame = true,
  hasSavedImageFrame = false,
  unpinnedRegions = [],
  unpinnedMachines = [],
  selectedPinCandidate = null,
  onSelectPinCandidate,
  draftGoogleView,
  setDraftGoogleView,
  onSaveGoogleMapConfig,
  onSwitchToImageMode,
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
  const roles = useManagerStore(state => state.roles || []);
  const { canEditMap } = usePermissions(user, roles);

  const [tabType, setTabType] = useState(activeMapType || 'image');
  const activeTabObj =
    (currentSubmapTabId && submapTabs.find(s => s.id === currentSubmapTabId)) ||
    submapTabs[0] ||
    null;
  const [submapNameDraft, setSubmapNameDraft] = useState(activeTabObj?.name || 'Podmapa 1');

  React.useEffect(() => {
    setTabType(activeMapType || 'image');
  }, [currentSubmapId, currentSubmapTabId, activeMapType]);

  React.useEffect(() => {
    setSubmapNameDraft(activeTabObj?.name || 'Podmapa 1');
  }, [currentSubmapId, activeTabObj?.id, activeTabObj?.name]);

  const canPinOnCurrentMap = tabType === 'google' ? Boolean(hasSavedGoogleFrame) : Boolean(hasSavedImageFrame);

  const parentSubmapId = breadcrumbPath.length > 1 ? breadcrumbPath[breadcrumbPath.length - 2].id : null;
  const currentRegionName =
    breadcrumbPath.length > 0 ? breadcrumbPath[breadcrumbPath.length - 1].name : t('map_component.main_map', 'Mapa Główna');

  const currentLat = draftGoogleView?.lat ?? activeGoogleLat ?? 54.5364;
  const currentLng = draftGoogleView?.lng ?? activeGoogleLng ?? 18.5469;
  const currentZoom = clampZoom(draftGoogleView?.zoom ?? activeGoogleZoom ?? 18);
  const currentStyle = draftGoogleView?.style ?? activeGoogleStyle ?? 'k';

  const handleSaveCurrentGoogleView = () => {
    if (!onSaveGoogleMapConfig) return;
    const resolvedLat = Number(currentLat);
    const resolvedLng = Number(currentLng);
    const resolvedZoom = clampZoom(currentZoom);
    const queryStr = activeGoogleQuery?.trim() || `${resolvedLat.toFixed(5)}, ${resolvedLng.toFixed(5)}`;

    onSaveGoogleMapConfig({
      mapType: 'google',
      googleQuery: queryStr,
      googleLat: resolvedLat,
      googleLng: resolvedLng,
      googleZoom: resolvedZoom,
      googleMapStyle: currentStyle || 'k',
    });
    if (setIsFramingGoogleMap) setIsFramingGoogleMap(false);
  };

  return (
    <>
      {/* Kontener główny lewego górnego rogu (flex-col): gdy pasek górny zawija się przy dużej liczbie podmap, panel edycji i dodawania podmapy automatycznie przesuwa się w dół bez kolizji */}
      <div className="absolute top-4 left-4 right-4 z-[150] flex flex-col items-start gap-2.5 pointer-events-none">
        {/* Przyciski narzędzi i ścieżka podmap (górny pasek) */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto max-w-full">
          {currentSubmapId && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 shadow-lg text-white">
              <button
                onClick={() => setCurrentSubmapId(parentSubmapId)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-[10px] md:text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('map_component.main_map', 'Mapa Główna')}
                </button>
                {breadcrumbPath.map((reg, idx) => (
                  <React.Fragment key={reg.id}>
                    <i className="ph ph-caret-right text-slate-500 text-[10px]"></i>
                    <button
                      onClick={() => setCurrentSubmapId(reg.id)}
                      className={`whitespace-nowrap transition-colors cursor-pointer ${
                        idx === breadcrumbPath.length - 1 ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {reg.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Pasek przełączania równorzędnych podmap (bez przycisku dodawania, który znajduje się w menu po lewej) */}
              {submapTabs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pl-1.5 border-l border-slate-700">
                  {submapTabs.map((sub) => {
                    const isActive = (activeTabObj?.id || submapTabs[0]?.id) === sub.id;
                    const dotColor =
                      sub.status === PIN_STATUS.CRITICAL
                        ? 'bg-red-500 animate-pulse'
                        : sub.status === PIN_STATUS.IN_PROGRESS
                          ? 'bg-blue-400'
                          : sub.status === PIN_STATUS.WARNING
                            ? 'bg-amber-400'
                            : 'bg-emerald-400';
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setCurrentSubmapTabId && setCurrentSubmapTabId(sub.id)}
                        className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={`Przełącz na podmapę: ${sub.name}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                        <span className="whitespace-nowrap">{sub.name}</span>
                        {sub.itemCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-black/40 text-[9px] font-extrabold">
                            {sub.itemCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {canEditMap && (
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
                onClick={() => {
                  setMode('edit');
                  if (setIsSettingsMinimized) setIsSettingsMinimized(false);
                }}
                className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-2 transition-all shadow-md ${
                  mode === 'edit'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'
                }`}
              >
                <i className="ph ph-pencil-simple text-base sm:text-lg"></i>
                <span className="hidden sm:inline">{t('map_component.edit')}</span>
              </button>
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

        {/* Ustawienia mapy / podmapy (przesuwa się automatycznie w dół pod paskiem górnym przy dużej liczbie podmap) */}
        {mode === 'edit' && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative bg-white p-3 md:p-4 rounded-xl shadow-2xl w-72 sm:w-92 max-h-[calc(100vh-7.5rem)] overflow-y-auto border border-amber-200 animate-fade-in transition-all pointer-events-auto"
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
                  {t('map_component.map_options', 'Opcje Mapy')} (
                  {currentSubmapId ? currentRegionName : t('map_component.main_short', 'Główna')})
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
                    {t('map_component.background_label', 'Podkład')}:{' '}
                    {currentSubmapId
                      ? `${currentRegionName}${activeTabObj?.name ? ` — ${activeTabObj.name}` : ''}`
                      : t('map_component.main_map', 'Mapa Główna')}
                  </span>
                </h3>

                {/* Równorzędne podmapy (domyślnie Podmapa 1, Podmapa 2... z możliwością zmiany w Zapisz nazwę oraz usunięcia ostatniej podmapy) */}
                {currentSubmapId && (
                  <div className="mb-3 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[9px] md:text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                        <i className="ph ph-stack text-indigo-600 text-sm"></i>
                        <span>Równorzędne podmapy ({submapTabs.length})</span>
                      </label>
                    </div>

                    {submapTabs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {submapTabs.map((sub, idx) => {
                          const isActive = (activeTabObj?.id || submapTabs[0]?.id) === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setCurrentSubmapTabId && setCurrentSubmapTabId(sub.id)}
                              className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-white text-slate-700 border border-indigo-200 hover:bg-indigo-100/60'
                              }`}
                            >
                              <span>{idx + 1}. {sub.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Przycisk dodawania podmapy pod listą – przesuwa się w dół wraz z przybywaniem podmap */}
                    {onAddParallelSubmap && (
                      <button
                        type="button"
                        onClick={() => onAddParallelSubmap()}
                        className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Dodaj kolejną równorzędną podmapę"
                      >
                        <i className="ph ph-plus-bold"></i>
                        <span>Dodaj podmapę</span>
                      </button>
                    )}

                    {submapTabs.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={submapNameDraft}
                          onChange={e => setSubmapNameDraft(e.target.value)}
                          onBlur={() => {
                            if (
                              onRenameParallelSubmap &&
                              submapNameDraft.trim() &&
                              submapNameDraft.trim() !== activeTabObj?.name
                            ) {
                              onRenameParallelSubmap(activeTabObj?.id || 'default', submapNameDraft.trim());
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (onRenameParallelSubmap && submapNameDraft.trim()) {
                                onRenameParallelSubmap(activeTabObj?.id || 'default', submapNameDraft.trim());
                              }
                            }
                          }}
                          placeholder="Nazwa (np. Podmapa 1)"
                          className="flex-1 px-2 py-1 text-xs border border-indigo-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {onRenameParallelSubmap && (
                          <button
                            type="button"
                            onClick={() => {
                              if (submapNameDraft.trim()) {
                                onRenameParallelSubmap(activeTabObj?.id || 'default', submapNameDraft.trim());
                              }
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                            title="Zapisz nazwę podmapy"
                          >
                            Zapisz nazwę
                          </button>
                        )}
                        {onDeleteParallelSubmap && (
                          <button
                            type="button"
                            onClick={() => onDeleteParallelSubmap(activeTabObj?.id)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold rounded transition-colors cursor-pointer"
                            title="Usuń tę równorzędną podmapę"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* 1. Wybór rodzaju mapy: Mapa Google vs Mapa JPG / PNG */}
              <div className="mb-3">
                <label className="block text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Rodzaj mapy
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTabType('google');
                      if (onSelectMapType) onSelectMapType('google');
                      if (!hasSavedGoogleFrame && setIsFramingGoogleMap) {
                        setIsFramingGoogleMap(true);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      tabType === 'google'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <i className="ph ph-globe-hemisphere-west"></i> Mapa Google
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTabType('image');
                      if (onSelectMapType) onSelectMapType('image');
                      if (activeMapType === 'google' && onSwitchToImageMode) onSwitchToImageMode();
                      if (!hasSavedImageFrame && setIsFramingGoogleMap) {
                        setIsFramingGoogleMap(true);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      tabType === 'image'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <i className="ph ph-image"></i> Mapa JPG / PNG
                  </button>
                </div>
              </div>

              {/* 2. Tryb edycji na mapie: Ustawienie widoku oraz Przypinanie pinesek */}
              <div className="mb-3">
                <label className="block text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tryb edycji na mapie
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFramingGoogleMap && setIsFramingGoogleMap(true)}
                    className={`flex-1 py-1.5 px-2 rounded text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isFramingGoogleMap
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="ph ph-frame-corners"></i> Ustawienie widoku
                  </button>
                  <button
                    type="button"
                    disabled={!canPinOnCurrentMap}
                    onClick={() => {
                      if (!canPinOnCurrentMap) return;
                      if (setIsFramingGoogleMap) setIsFramingGoogleMap(false);
                    }}
                    title={
                      !canPinOnCurrentMap
                        ? 'Najpierw ustaw i zapisz domyślny kadr mapy w opcji „Ustawienie widoku”'
                        : 'Przejdź do przypinania pinesek na mapie'
                    }
                    className={`flex-1 py-1.5 px-2 rounded text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      !canPinOnCurrentMap
                        ? 'text-slate-400 cursor-not-allowed opacity-60'
                        : !isFramingGoogleMap
                          ? 'bg-amber-500 text-white shadow-xs cursor-pointer'
                          : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                    }`}
                  >
                    <i className="ph ph-push-pin"></i> Przypinanie pinesek
                  </button>
                </div>
              </div>

              {/* Zawartość zależna od trybu: Ustawienie widoku vs Przypinanie pinesek */}
              {isFramingGoogleMap ? (
                tabType === 'image' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">
                        {t('map_component.upload_new_map', 'Wgraj mapę z pliku JPG lub PNG')}
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/*"
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
                              <p className="text-[10px] md:text-xs font-bold text-slate-600">
                                {t('map_component.processing')}
                              </p>
                            </>
                          ) : (
                            <>
                              <i className="ph ph-upload-simple text-2xl text-blue-400 mb-2"></i>
                              <p className="text-[10px] md:text-xs font-bold text-slate-600">
                                {t('map_component.click_or_drop')}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!hasSavedImageFrame && (
                      <div className="text-[10px] md:text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium">
                        <i className="ph ph-info mr-1"></i>
                        Wgraj plik mapy powyżej, aby odblokować przypinanie pinesek.
                      </div>
                    )}

                    {hasSavedImageFrame && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <label className="block text-[9px] md:text-xs font-bold text-slate-500">
                          {t('map_component.default_frame_zoom', 'Domyślny kadr i powiększenie (ustaw ręcznie obraz i zoom)')}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (saveDefaultView) saveDefaultView();
                            if (setIsFramingGoogleMap) setIsFramingGoogleMap(false);
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[10px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <i className="ph ph-floppy-disk"></i>{' '}
                          {t('map_component.set_as_default_frame', 'Ustaw jako domyślny kadr')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                    <p className="text-[10px] md:text-[11px] text-slate-600 font-medium leading-snug">
                      Przesuń mapę myszką oraz ustaw zoom rolką, a następnie zapisz widok jako domyślny kadr.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] md:text-[11px] font-bold text-slate-700 mb-1">
                          {t('map_component.map_style', 'Typ mapy')}
                        </label>
                        <select
                          value={currentStyle}
                          onChange={e =>
                            setDraftGoogleView && setDraftGoogleView(prev => ({ ...prev, style: e.target.value }))
                          }
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
                        Kadr: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
                      </span>
                      <span>Zoom: {Number(currentZoom).toFixed(2)}</span>
                    </div>

                    {!hasSavedGoogleFrame && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 font-medium">
                        <i className="ph ph-info mr-1"></i>
                        Zapisz domyślny kadr poniżej, aby odblokować przypinanie pinesek.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveCurrentGoogleView}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <i className="ph ph-floppy-disk text-sm"></i>{' '}
                      <span>Ustaw jako domyślny kadr</span>
                      <span className="sr-only">Wgraj ustawiony widok mapy</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-2.5 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                  <div className="text-[10px] md:text-[11px] text-slate-700 font-medium leading-snug flex items-start gap-1.5">
                    <i className="ph ph-cursor-click text-amber-600 text-base shrink-0 mt-0.5"></i>
                    <span>
                      Kliknij w wybrane miejsce na mapie, aby przypiąć obiekt. Mapę możesz swobodnie przesuwać i powiększać.
                    </span>
                  </div>

                  {selectedPinCandidate && (
                    <div className="bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                      <span className="truncate">
                        Wybrano do przypięcia: {selectedPinCandidate.name} (kliknij na mapie)
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectPinCandidate && onSelectPinCandidate(null)}
                        className="text-white/80 hover:text-white shrink-0"
                        title="Wyczyść wybór"
                      >
                        <i className="ph ph-x"></i>
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    <div>
                      <div className="text-[9px] md:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Nieprzypisane miejsca montażu</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                          {unpinnedRegions.length}
                        </span>
                      </div>
                      {unpinnedRegions.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic px-1">
                          Wszystkie miejsca montażu są już przypięte.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {unpinnedRegions.map(reg => {
                            const isSel =
                              selectedPinCandidate?.type === 'region' && selectedPinCandidate?.id === reg.id;
                            return (
                              <button
                                key={reg.id}
                                type="button"
                                onClick={() =>
                                  onSelectPinCandidate &&
                                  onSelectPinCandidate(
                                    isSel ? null : { type: 'region', id: reg.id, name: reg.name }
                                  )
                                }
                                className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] md:text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                                  isSel
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-amber-100/70 text-slate-700 border border-slate-200'
                                }`}
                                title="Kliknij, a następnie wskaż punkt na mapie"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <i className={`ph ph-map-pin ${isSel ? 'text-white' : 'text-amber-600'}`}></i>
                                  <span className="truncate">{reg.name}</span>
                                </span>
                                <span className={`text-[9px] shrink-0 ${isSel ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {isSel ? 'Kliknij na mapie' : 'Wybierz'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-amber-200/70">
                      <div className="text-[9px] md:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Nieprzypisane urządzenia</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                          {unpinnedMachines.length}
                        </span>
                      </div>
                      {unpinnedMachines.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic px-1">
                          Wszystkie urządzenia są już przypięte.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {unpinnedMachines.map(mach => {
                            const isSel =
                              selectedPinCandidate?.type === 'machine' && selectedPinCandidate?.id === mach.id;
                            return (
                              <button
                                key={mach.id}
                                type="button"
                                onClick={() =>
                                  onSelectPinCandidate &&
                                  onSelectPinCandidate(
                                    isSel ? null : { type: 'machine', id: mach.id, name: mach.name }
                                  )
                                }
                                className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] md:text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                                  isSel
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-amber-100/70 text-slate-700 border border-slate-200'
                                }`}
                                title="Kliknij, a następnie wskaż punkt na mapie"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <i className={`ph ph-engine ${isSel ? 'text-white' : 'text-blue-600'}`}></i>
                                  <span className="truncate">{mach.name}</span>
                                </span>
                                <span className={`text-[9px] shrink-0 ${isSel ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {isSel ? 'Kliknij na mapie' : 'Wybierz'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        )}
      </div>

      {/* Kontrolki powiększenia (prawy dolny róg - z-[150] nad pinezkami) */}
      <div className="absolute bottom-[90px] lg:bottom-4 right-4 z-[150] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl pointer-events-auto">
        <button
          onClick={() => {
            if (isGoogleMap && onGoogleZoomStep) {
              onGoogleZoomStep(0.35);
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
              onGoogleZoomStep(-0.35);
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
