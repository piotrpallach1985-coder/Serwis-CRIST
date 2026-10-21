import { useAuth } from '../../hooks/useAuth';
import MapLegend from './map/MapLegend';
import MapPin from './map/MapPin';
import { useManagerStore } from '../../store/managerStore';
import MapControls from './map/MapControls';
import InteractiveGoogleMap, {
  geocodeAddressQuery,
  clampZoom,
  projectLatLngToViewportPercent,
  unprojectViewportPercentToLatLng,
  computeGoogleFitView,
} from './map/InteractiveGoogleMap';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { updateMapSettings, updateRegion, updateMachineRegion, subscribeToMapSettings } from '../../services/machines.service';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

import { useMapPins, getRegionSubmaps, isMachinePinnedOnSubmap } from '../../hooks/useMapPins';
import MapEditModal from './MapEditModal';
import { getCurrentTenant } from '../../utils/tenantHelper';

// Globalny cache dla obrazów mapy (działa do wylogowania/odświeżenia)
const mapImageCache = {};

export default function ShipyardMap({
  modeType = 'tickets',
  onNavigateToTickets,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tickets, machines, plannedServices, regions, plannedWarningDays } = useManagerStore();

  // --- Tryb widoku ---
  const [mode, setMode] = useState('view');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSubmapId, setCurrentSubmapId] = useState(null);
  const [currentSubmapTabId, setCurrentSubmapTabId] = useState(null);

  // --- Konfiguracja mapy ---
  const [mapConfig, setMapConfig] = useState({
    url: '',
    mapType: 'image',
    googleFrameSaved: false,
    googleQuery: '',
    googleLat: 54.5364,
    googleLng: 18.5469,
    googleZoom: 17,
    googleMapStyle: 'k',
    defaultZoom: 1,
    defaultPan: { x: 0, y: 0 },
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [uploadingMap, setUploadingMap] = useState(false);
  const [, setUploadProgress] = useState(0);

  // Pobierz konfigurację mapy z Firestore
  useEffect(() => {
    const unsub = subscribeToMapSettings((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapConfig({
          url: data.mapUrl || '',
          mapType: data.mapType || (data.googleQuery && !data.mapUrl ? 'google' : 'image'),
          googleFrameSaved: Boolean(
            data.mapType === 'google' ||
              data.googleLat != null ||
              (data.googleQuery && String(data.googleQuery).trim())
          ),
          googleQuery: data.googleQuery || '',
          googleLat: Number.isFinite(Number(data.googleLat)) && Number(data.googleLat) !== 0 ? Number(data.googleLat) : 54.5364,
          googleLng: Number.isFinite(Number(data.googleLng)) && Number(data.googleLng) !== 0 ? Number(data.googleLng) : 18.5469,
          googleZoom: clampZoom(data.googleZoom || 17),
          googleMapStyle: data.googleMapStyle || 'k',
          defaultZoom: data.defaultZoom || 1,
          defaultPan: { x: data.defaultPanX || 0, y: data.defaultPanY || 0 },
        });
        if (!mapLoaded) {
          setZoomScale(data.defaultZoom || 1);
          setZoomPan({ x: data.defaultPanX || 0, y: data.defaultPanY || 0 });
          setMapLoaded(true);
        }
      } else {
        setMapLoaded(true);
      }
    });
    return () => unsub();
  }, [mapLoaded]);

  // Aktualny rejon i ścieżka okruszków (podmapy w podmapach)
  const currentRegion = useMemo(
    () => (currentSubmapId ? regions.find(r => r.id === currentSubmapId) : null),
    [currentSubmapId, regions]
  );

  const breadcrumbPath = useMemo(() => {
    if (!currentSubmapId) return [];
    const trail = [];
    const visited = new Set();
    let curr = regions.find(r => r.id === currentSubmapId);
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      trail.unshift(curr);
      curr = curr.parentId ? regions.find(r => r.id === curr.parentId) : null;
    }
    return trail;
  }, [currentSubmapId, regions]);

  // --- Upload mapy oraz konfiguracja Google Maps ---
  const [mapDragActive, setMapDragActive] = useState(false);
  const [isSettingsMinimized, setIsSettingsMinimized] = useState(true);
  const [isFramingGoogleMap, setIsFramingGoogleMap] = useState(false);
  const [selectedMapKind, setSelectedMapKind] = useState('image');
  const [selectedPinCandidate, setSelectedPinCandidate] = useState(null);

  const regionSubmaps = useMemo(
    () => (currentRegion ? getRegionSubmaps(currentRegion) : []),
    [currentRegion]
  );

  useEffect(() => {
    if (!currentSubmapId) {
      setCurrentSubmapTabId(null);
      return;
    }
    if (regionSubmaps.length > 0) {
      if (!currentSubmapTabId || !regionSubmaps.some(s => s.id === currentSubmapTabId)) {
        setCurrentSubmapTabId(regionSubmaps[0].id);
      }
    } else if (!currentSubmapTabId) {
      setCurrentSubmapTabId('default');
    }
  }, [currentSubmapId, regionSubmaps, currentSubmapTabId]);

  const activeSubmapObj = useMemo(() => {
    if (!currentSubmapId || regionSubmaps.length === 0) return null;
    return regionSubmaps.find(s => s.id === currentSubmapTabId) || regionSubmaps[0];
  }, [currentSubmapId, regionSubmaps, currentSubmapTabId]);

  const activeMapType = useMemo(() => {
    if (!currentSubmapId) return mapConfig.mapType;
    if (activeSubmapObj) {
      if (activeSubmapObj.mapType === 'image' && activeSubmapObj.mapImageUrl) return 'image';
      if (activeSubmapObj.mapType === 'google' && activeSubmapObj.submapConfigured !== false) {
        return 'google';
      }
      return activeSubmapObj.mapType || 'image';
    }
    if (currentRegion?.mapType === 'image' && currentRegion?.mapImageUrl) return 'image';
    if (currentRegion?.mapType === 'google' && currentRegion?.submapConfigured !== false) {
      return 'google';
    }
    return currentRegion?.mapType || 'image';
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.mapType]);

  const activeGoogleQuery = currentSubmapId
    ? (activeSubmapObj?.googleQuery || currentRegion?.googleQuery || currentRegion?.address || '')
    : (mapConfig.googleQuery || '');

  const activeGoogleLat = useMemo(() => {
    if (currentSubmapId) {
      const regLat = Number(activeSubmapObj?.googleLat ?? currentRegion?.googleLat ?? currentRegion?.lat);
      if (Number.isFinite(regLat) && regLat !== 0) return regLat;
    }
    const mainLat = Number(mapConfig.googleLat);
    return Number.isFinite(mainLat) && mainLat !== 0 ? mainLat : 54.5364;
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.googleLat]);

  const activeGoogleLng = useMemo(() => {
    if (currentSubmapId) {
      const regLng = Number(activeSubmapObj?.googleLng ?? currentRegion?.googleLng ?? currentRegion?.lng);
      if (Number.isFinite(regLng) && regLng !== 0) return regLng;
    }
    const mainLng = Number(mapConfig.googleLng);
    return Number.isFinite(mainLng) && mainLng !== 0 ? mainLng : 18.5469;
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.googleLng]);

  const activeGoogleZoom = useMemo(() => {
    if (currentSubmapId) {
      return clampZoom(activeSubmapObj?.googleZoom || currentRegion?.googleZoom || 17);
    }
    return clampZoom(mapConfig.googleZoom || 17);
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.googleZoom]);

  const activeGoogleStyle = currentSubmapId
    ? (activeSubmapObj?.googleMapStyle || currentRegion?.googleMapStyle || mapConfig.googleMapStyle || 'k')
    : (mapConfig.googleMapStyle || 'k');

  const [draftGoogleView, setDraftGoogleView] = useState({
    lat: activeGoogleLat,
    lng: activeGoogleLng,
    zoom: activeGoogleZoom,
    style: activeGoogleStyle,
  });

  const [baseGoogleZoom, setBaseGoogleZoom] = useState(activeGoogleZoom);

  // --- Drag & Drop pinezek + Zoom/Pan ---
  const [tempPos, setTempPos] = useState(null);
  const [editingType, setEditingType] = useState('region');
  const [editingId, setEditingId] = useState('');
  const [draggingPin, setDraggingPin] = useState(null);
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const pointerDownPosRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapContentRef = useRef(null);

  const [imgBounds, setImgBounds] = useState({ width: 1000, height: 700 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // --- Pinezki (przez hook) ---
  const { displayPins = [], unpinnedData, submapTabs = [] } = useMapPins({
    tickets,
    plannedServices,
    modeType,
    machines,
    regions,
    plannedWarningDays,
    currentSubmapId,
    currentSubmapTabId: activeSubmapObj?.id || currentSubmapTabId,
    draggingPin,
  });

  const hasSavedGoogleFrame = useMemo(() => {
    if (currentSubmapId) {
      if (activeSubmapObj) {
        return (
          activeSubmapObj.submapConfigured !== false &&
          Boolean(
            activeSubmapObj.mapType === 'google' ||
              activeSubmapObj.googleLat != null ||
              activeSubmapObj.googleQuery
          )
        );
      }
      return (
        currentRegion?.submapConfigured !== false &&
        Boolean(
          currentRegion?.mapType === 'google' ||
            currentRegion?.googleLat != null ||
            currentRegion?.googleQuery
        )
      );
    }
    return Boolean(
      mapConfig.googleFrameSaved ||
        mapConfig.mapType === 'google' ||
        activeGoogleQuery.trim() ||
        displayPins.some(p => p.lat != null && p.lng != null)
    );
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.googleFrameSaved, mapConfig.mapType, activeGoogleQuery, displayPins]);

  const hasSavedImageFrame = useMemo(() => {
    if (currentSubmapId) {
      if (activeSubmapObj) return Boolean(activeSubmapObj.mapImageUrl);
      return Boolean(currentRegion?.mapImageUrl);
    }
    return Boolean(mapConfig.url);
  }, [currentSubmapId, activeSubmapObj, currentRegion, mapConfig.url]);

  useEffect(() => {
    setSelectedMapKind(activeMapType || 'image');
  }, [currentSubmapId, currentSubmapTabId, activeMapType]);

  const hasSavedGoogleMap = activeMapType === 'google' && hasSavedGoogleFrame;

  const isGoogleMap =
    mode === 'edit' ? selectedMapKind === 'google' : hasSavedGoogleMap;

  const currentMapUrl = !isGoogleMap
    ? (currentSubmapId ? (activeSubmapObj ? activeSubmapObj.mapImageUrl || '' : currentRegion?.mapImageUrl || '') : mapConfig.url)
    : '';

  // Lista nieprzypisanych miejsc montażu i urządzeń dla aktywnej mapy / podmapy (w trybie Przypinanie pinesek)
  const { unpinnedRegions, unpinnedMachines } = useMemo(() => {
    const hasCoords = (item) =>
      (item.xPercent != null && item.yPercent != null) || (item.lat != null && item.lng != null);
    const activeRegions = regions.filter(r => !r.isDeleted);
    let uRegions = [];
    if (currentSubmapId === null) {
      uRegions = activeRegions.filter(r => !r.parentId && !hasCoords(r));
    } else {
      const forbiddenIds = new Set();
      let currId = currentSubmapId;
      while (currId && !forbiddenIds.has(currId)) {
        forbiddenIds.add(currId);
        const reg = regions.find(r => r.id === currId);
        currId = reg?.parentId || null;
      }
      uRegions = activeRegions.filter(
        r =>
          !forbiddenIds.has(r.id) &&
          (r.parentId === currentSubmapId || !r.parentId) &&
          (!hasCoords(r) || r.parentId !== currentSubmapId)
      );
    }

    const mainMachines = machines.filter(m => (!m.parentId || m.parentId === '') && !m.isDeleted);
    const activeTabId = activeSubmapObj?.id || currentSubmapTabId;
    let uMachines = [];
    if (currentSubmapId !== null) {
      const inRegion = mainMachines.filter(m => !m.regionId || m.regionId === currentSubmapId);
      uMachines = inRegion.filter(
        m => !isMachinePinnedOnSubmap(m, currentSubmapId, activeRegions, activeTabId)
      );
    } else {
      uMachines = mainMachines.filter(m => !hasCoords(m));
    }

    return { unpinnedRegions: uRegions, unpinnedMachines: uMachines };
  }, [regions, machines, currentSubmapId, activeSubmapObj, currentSubmapTabId]);

  // Oblicz widok domyślny (zapisany kadr domyślny lub dopasowany do pinezek)
  const computeCurrentLevelFitView = useCallback(() => {
    if (hasSavedGoogleFrame) {
      return {
        lat: activeGoogleLat,
        lng: activeGoogleLng,
        zoom: activeGoogleZoom,
      };
    }

    const geoPoints = displayPins
      .filter(p => p.lat != null && p.lng != null)
      .map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));

    if (geoPoints.length >= 2) {
      return computeGoogleFitView(
        geoPoints,
        { lat: activeGoogleLat, lng: activeGoogleLng, zoom: activeGoogleZoom },
        imgBounds.width || 1000,
        imgBounds.height || 700
      );
    }

    if (geoPoints.length === 1) {
      return {
        lat: geoPoints[0].lat,
        lng: geoPoints[0].lng,
        zoom: clampZoom(activeGoogleZoom || (currentSubmapId ? 17 : 16)),
      };
    }

    return {
      lat: activeGoogleLat,
      lng: activeGoogleLng,
      zoom: activeGoogleZoom,
    };
  }, [hasSavedGoogleFrame, displayPins, activeGoogleLat, activeGoogleLng, activeGoogleZoom, imgBounds.width, imgBounds.height, currentSubmapId]);

  // Przy zmianie poziomu podmapy lub załadowaniu mapy ustaw widok 100% (zapisany kadr domyślny)
  const lastFittedLevelRef = useRef(undefined);
  useEffect(() => {
    if (!mapLoaded) return;
    const activeTabKey = activeSubmapObj?.id || currentSubmapTabId || 'default';
    const levelKey = `${currentSubmapId || 'main'}-${activeTabKey}-${activeMapType}`;
    if (lastFittedLevelRef.current !== levelKey) {
      lastFittedLevelRef.current = levelKey;
      if (activeMapType === 'google') {
        const fitted = computeCurrentLevelFitView();
        setDraftGoogleView({
          lat: fitted.lat,
          lng: fitted.lng,
          zoom: fitted.zoom,
          style: activeGoogleStyle,
        });
        setBaseGoogleZoom(fitted.zoom);
        setZoomScale(1);
        setZoomPan({ x: 0, y: 0 });
      } else if (currentSubmapId) {
        const reg = regions.find(r => r.id === currentSubmapId);
        setZoomScale(activeSubmapObj?.defaultZoom || reg?.defaultZoom || 1);
        setZoomPan({
          x: activeSubmapObj?.defaultPanX ?? reg?.defaultPanX ?? 0,
          y: activeSubmapObj?.defaultPanY ?? reg?.defaultPanY ?? 0,
        });
      } else {
        setZoomScale(mapConfig.defaultZoom || 1);
        setZoomPan(mapConfig.defaultPan || { x: 0, y: 0 });
      }
    }
  }, [mapLoaded, currentSubmapId, currentSubmapTabId, activeSubmapObj, activeMapType, activeGoogleStyle, computeCurrentLevelFitView, regions, mapConfig]);

  // Jeśli rejon ma zapisany tekstowy googleQuery, ale nie miał jeszcze współrzędnych googleLat/googleLng, dogeokoduj je
  useEffect(() => {
    const rawHasLat = currentSubmapId
      ? (currentRegion?.googleLat != null || currentRegion?.lat != null)
      : mapConfig.googleLat != null;
    if (activeMapType === 'google' && activeGoogleQuery.trim() && !rawHasLat) {
      let cancelled = false;
      geocodeAddressQuery(activeGoogleQuery).then(geo => {
        if (!cancelled && geo) {
          setDraftGoogleView(prev => ({ ...prev, lat: geo.lat, lng: geo.lng }));
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [activeMapType, activeGoogleQuery, currentSubmapId, currentRegion, mapConfig.googleLat]);

  // Jeśli w wybranym rodzaju mapy kadr domyślny nie został jeszcze wgrany/zapisany, wymuś tryb Ustawienie widoku
  useEffect(() => {
    if (mode !== 'edit') {
      setIsFramingGoogleMap(false);
      setSelectedPinCandidate(null);
      return;
    }
    const canPin = selectedMapKind === 'google' ? hasSavedGoogleFrame : hasSavedImageFrame;
    if (!canPin) {
      setIsFramingGoogleMap(true);
    }
  }, [mode, selectedMapKind, hasSavedGoogleFrame, hasSavedImageFrame]);

  const handleSelectMapType = useCallback(
    (nextType) => {
      setSelectedMapKind(nextType);
      if (nextType === 'google') {
        if (!hasSavedGoogleFrame) {
          setIsFramingGoogleMap(true);
        }
      } else {
        if (!hasSavedImageFrame) {
          setIsFramingGoogleMap(true);
        }
      }
    },
    [hasSavedGoogleFrame, hasSavedImageFrame]
  );

  const handleResetView100 = useCallback(() => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    if (isGoogleMap) {
      const fitted = computeCurrentLevelFitView();
      setDraftGoogleView(prev => ({
        ...prev,
        lat: fitted.lat,
        lng: fitted.lng,
        zoom: fitted.zoom,
      }));
      setBaseGoogleZoom(fitted.zoom);
    }
  }, [isGoogleMap, computeCurrentLevelFitView]);

  const handleGoogleZoomStep = useCallback((delta) => {
    setDraftGoogleView(prev => ({
      ...prev,
      zoom: clampZoom((prev?.zoom ?? activeGoogleZoom) + delta),
    }));
  }, [activeGoogleZoom]);

  const displayZoomPercent = useMemo(() => {
    if (!isGoogleMap) return Math.round(zoomScale * 100);
    const refZ = baseGoogleZoom || activeGoogleZoom || 17;
    const curZ = draftGoogleView?.zoom ?? refZ;
    const diff = curZ - refZ;
    if (Math.abs(diff) < 0.05) return 100;
    return Math.max(25, Math.min(400, Math.round(Math.pow(2, diff * 0.5) * 100)));
  }, [isGoogleMap, zoomScale, baseGoogleZoom, activeGoogleZoom, draftGoogleView?.zoom]);

  const handleMapDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(true); };
  const handleMapDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); };
  const handleMapDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleMapDrop = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); if (e.dataTransfer.files?.[0]) processMapFile(e.dataTransfer.files[0]); };
  const handleMapFileChange = (e) => { if (e.target.files?.[0]) processMapFile(e.target.files[0]); };

  const buildRegionSubmapsUpdate = (updatedTabs) => {
    const first = updatedTabs[0] || {};
    const anyConfigured = updatedTabs.some(s => s.submapConfigured !== false && (s.mapImageUrl || s.mapType === 'google'));
    return {
      submaps: updatedTabs,
      submapName: first.name || 'Podmapa 1',
      mapType: first.mapType || 'image',
      mapImageUrl: first.mapImageUrl || '',
      submapConfigured: anyConfigured,
      googleQuery: first.googleQuery || currentRegion?.googleQuery || currentRegion?.address || '',
      googleLat: Number(first.googleLat ?? currentRegion?.googleLat ?? currentRegion?.lat) || 54.5364,
      googleLng: Number(first.googleLng ?? currentRegion?.googleLng ?? currentRegion?.lng) || 18.5469,
      googleZoom: Number(first.googleZoom ?? currentRegion?.googleZoom) || 17,
      googleMapStyle: first.googleMapStyle || currentRegion?.googleMapStyle || 'k',
      defaultZoom: Number(first.defaultZoom) || 1,
      defaultPanX: Number(first.defaultPanX) || 0,
      defaultPanY: Number(first.defaultPanY) || 0,
    };
  };

  const handleAddParallelSubmap = async (customName = '') => {
    if (!currentSubmapId || !currentRegion) return;
    try {
      const existing = [...regionSubmaps];
      const nextIndex = existing.length + 1;
      const newTabId = `sub_${Date.now()}`;
      const inheritFromDirect = existing.length === 0;
      const directConfigured = Boolean(
        currentRegion.mapImageUrl ||
          (currentRegion.mapType === 'google' && currentRegion.submapConfigured !== false)
      );
      const newTab = {
        id: newTabId,
        name: customName.trim() || `Podmapa ${nextIndex}`,
        mapType: inheritFromDirect ? currentRegion.mapType || 'image' : 'image',
        mapImageUrl: inheritFromDirect ? currentRegion.mapImageUrl || '' : '',
        googleQuery: currentRegion.googleQuery || currentRegion.address || '',
        googleLat: activeGoogleLat,
        googleLng: activeGoogleLng,
        googleZoom: inheritFromDirect ? activeGoogleZoom : 17,
        googleMapStyle: inheritFromDirect ? activeGoogleStyle : 'k',
        defaultZoom: inheritFromDirect ? currentRegion.defaultZoom || 1 : 1,
        defaultPanX: inheritFromDirect ? currentRegion.defaultPanX || 0 : 0,
        defaultPanY: inheritFromDirect ? currentRegion.defaultPanY || 0 : 0,
        submapConfigured: inheritFromDirect ? directConfigured : false,
      };
      const updatedTabs = [...existing, newTab];
      await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
      setCurrentSubmapTabId(newTabId);
      setMode('edit');
      setIsSettingsMinimized(false);
    } catch (err) {
      console.error('Błąd dodawania równorzędnej podmapy:', err);
      alert('Błąd dodawania podmapy: ' + err.message);
    }
  };

  const handleRenameParallelSubmap = async (tabId, newName) => {
    if (!currentSubmapId || !currentRegion || !newName.trim() || regionSubmaps.length === 0) return;
    try {
      const updatedTabs = regionSubmaps.map(s =>
        s.id === (tabId || regionSubmaps[0]?.id) ? { ...s, name: newName.trim() } : s
      );
      await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
    } catch (err) {
      console.error('Błąd zmiany nazwy podmapy:', err);
    }
  };

  const handleDeleteParallelSubmap = async (tabId) => {
    if (!currentSubmapId || !currentRegion || regionSubmaps.length === 0) return;
    if (!confirm('Czy na pewno chcesz usunąć tę równorzędną podmapę?')) return;
    try {
      const targetId = tabId || regionSubmaps[0]?.id;
      const deletedSub = regionSubmaps.find(s => s.id === targetId) || regionSubmaps[0];
      const updatedTabs = regionSubmaps.filter(s => s.id !== targetId);
      if (updatedTabs.length === 0) {
        const keepSource = deletedSub || currentRegion;
        const hasDirectMap = Boolean(
          keepSource.mapImageUrl ||
            currentRegion.mapImageUrl ||
            ((keepSource.mapType === 'google' || currentRegion.mapType === 'google') &&
              keepSource.submapConfigured !== false)
        );
        await updateRegion(currentSubmapId, {
          submaps: [],
          submapName: '',
          mapType: keepSource.mapType || currentRegion.mapType || 'image',
          mapImageUrl: keepSource.mapImageUrl || currentRegion.mapImageUrl || '',
          submapConfigured: hasDirectMap,
          googleQuery: keepSource.googleQuery || currentRegion.googleQuery || currentRegion.address || '',
          googleLat: Number(keepSource.googleLat ?? currentRegion.googleLat ?? currentRegion.lat) || 54.5364,
          googleLng: Number(keepSource.googleLng ?? currentRegion.googleLng ?? currentRegion.lng) || 18.5469,
          googleZoom: Number(keepSource.googleZoom ?? currentRegion.googleZoom) || 17,
          googleMapStyle: keepSource.googleMapStyle || currentRegion.googleMapStyle || 'k',
          defaultZoom: Number(keepSource.defaultZoom ?? currentRegion.defaultZoom) || 1,
          defaultPanX: Number(keepSource.defaultPanX ?? currentRegion.defaultPanX) || 0,
          defaultPanY: Number(keepSource.defaultPanY ?? currentRegion.defaultPanY) || 0,
        });
        setCurrentSubmapTabId(null);
      } else {
        await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
        setCurrentSubmapTabId(updatedTabs[0]?.id || 'default');
      }
    } catch (err) {
      console.error('Błąd usuwania podmapy:', err);
    }
  };

  const processMapFile = (file) => {
    if (!file) return;
    setUploadingMap(true);
    const storageRef = ref(storage, `tenants/${getCurrentTenant()}/map_backgrounds/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      'state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        console.error('Upload error', error);
        alert('Błąd wgrywania pliku mapy: ' + error.message);
        setUploadingMap(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          if (currentSubmapId !== null) {
            const targetTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
            if (regionSubmaps.length > 0) {
              const updatedTabs = regionSubmaps.map(s =>
                s.id === targetTabId
                  ? { ...s, mapImageUrl: url, mapType: 'image', submapConfigured: true }
                  : s
              );
              await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
            } else {
              await updateRegion(currentSubmapId, {
                mapImageUrl: url,
                mapType: 'image',
                submapConfigured: true,
              });
            }
          } else {
            await updateMapSettings({ mapUrl: url, mapType: 'image' });
          }
          setIsFramingGoogleMap(false);
        } catch (err) {
          console.error('Błąd zapisywania pliku mapy:', err);
          alert('Błąd zapisywania mapy: ' + err.message);
        } finally {
          setUploadingMap(false);
          setUploadProgress(0);
        }
      }
    );
  };

  const handleSaveGoogleMapConfig = async ({ googleQuery, googleLat, googleLng, googleZoom, googleMapStyle }) => {
    try {
      const savedZoom = clampZoom(googleZoom ?? draftGoogleView.zoom ?? 17);
      const savedLat = Number(googleLat ?? draftGoogleView.lat) || 54.5364;
      const savedLng = Number(googleLng ?? draftGoogleView.lng) || 18.5469;
      const savedStyle = googleMapStyle || draftGoogleView.style || 'k';
      const payload = {
        mapType: 'google',
        submapConfigured: true,
        googleQuery: googleQuery || `${savedLat.toFixed(5)}, ${savedLng.toFixed(5)}`,
        googleLat: savedLat,
        googleLng: savedLng,
        googleZoom: savedZoom,
        googleMapStyle: savedStyle,
      };
      if (currentSubmapId !== null) {
        const targetTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
        if (regionSubmaps.length > 0) {
          const updatedTabs = regionSubmaps.map(s =>
            s.id === targetTabId
              ? {
                  ...s,
                  ...payload,
                  defaultZoom: 1,
                  defaultPanX: 0,
                  defaultPanY: 0,
                }
              : s
          );
          await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
        } else {
          await updateRegion(currentSubmapId, {
            ...payload,
            defaultZoom: 1,
            defaultPanX: 0,
            defaultPanY: 0,
          });
        }
      } else {
        await updateMapSettings({
          ...payload,
          defaultZoom: 1,
          defaultPanX: 0,
          defaultPanY: 0,
        });
      }
      setDraftGoogleView(prev => ({
        ...prev,
        lat: savedLat,
        lng: savedLng,
        zoom: savedZoom,
        style: savedStyle,
      }));
      setBaseGoogleZoom(savedZoom);
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
      setIsFramingGoogleMap(false);
    } catch (error) {
      console.error('Błąd zapisywania mapy Google:', error);
      alert('Błąd zapisywania mapy Google: ' + error.message);
    }
  };

  const handleSwitchToImageMode = async () => {
    try {
      if (currentSubmapId !== null) {
        const targetTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
        if (regionSubmaps.length > 0) {
          const updatedTabs = regionSubmaps.map(s =>
            s.id === targetTabId ? { ...s, mapType: 'image' } : s
          );
          await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
        } else {
          await updateRegion(currentSubmapId, { mapType: 'image' });
        }
      } else {
        await updateMapSettings({ mapType: 'image' });
      }
    } catch (error) {
      console.error('Błąd przełączania trybu mapy:', error);
    }
  };

  const saveDefaultView = async () => {
    try {
      if (currentSubmapId !== null) {
        const targetTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
        if (regionSubmaps.length > 0) {
          const updatedTabs = regionSubmaps.map(s =>
            s.id === targetTabId
              ? { ...s, defaultZoom: zoomScale, defaultPanX: zoomPan.x, defaultPanY: zoomPan.y }
              : s
          );
          await updateRegion(currentSubmapId, buildRegionSubmapsUpdate(updatedTabs));
        } else {
          await updateRegion(currentSubmapId, { defaultZoom: zoomScale, defaultPanX: zoomPan.x, defaultPanY: zoomPan.y });
        }
      } else {
        await updateMapSettings({ defaultZoom: zoomScale, defaultPanX: zoomPan.x, defaultPanY: zoomPan.y });
      }
      setIsFramingGoogleMap(false);
      alert(t('map_component.view_saved'));
    } catch (error) {
      console.error('Błąd zapisywania widoku:', error);
      alert(t('map_component.view_save_error') + error.message);
    }
  };

  // --- Stan pinezek i aktywnego podkładu (Obraz vs Google Maps) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    if (isGoogleMap || !currentMapUrl) {
      setIsImageLoading(false);
      return;
    }
    if (mapImageCache[currentMapUrl]) {
      setIsImageLoading(false);
      setImageProgress(100);
      return;
    }
    setIsImageLoading(true);
    setImageProgress(0);
    const safetyTimeout = setTimeout(() => {
      setIsImageLoading(false);
      setImageProgress(100);
      mapImageCache[currentMapUrl] = true;
    }, 4000);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      clearTimeout(safetyTimeout);
      setIsImageLoading(false);
      setImageProgress(100);
      mapImageCache[currentMapUrl] = true;
      return;
    }
    const interval = setInterval(() => {
      setImageProgress(p => {
        const next = p + Math.floor(Math.random() * 15) + 5;
        return next > 90 ? 90 : next;
      });
    }, 200);
    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [currentMapUrl, isGoogleMap]);

  useEffect(() => {
    const el = mapContentRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      // Dla Mapy Google płynny zoom rolką obsługuje bezpośrednio InteractiveGoogleMap
      if (isGoogleMap) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomScale(s => Math.min(Math.max(0.5, parseFloat((s + delta).toFixed(2))), 5));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isGoogleMap]);

  useEffect(() => {
    const targetEl = mapContentRef.current;
    if (!targetEl) return;

    const updateBounds = (cW, cH) => {
      if (!cW || !cH) return;
      if (isGoogleMap) {
        setImgBounds({ width: cW, height: cH });
        return;
      }
      const effectiveNatural =
        currentMapUrl && naturalSize.width > 0 && naturalSize.height > 0
          ? naturalSize
          : { width: 1600, height: 1000 };
      const imgRatio = effectiveNatural.width / effectiveNatural.height;
      const containerRatio = cW / cH;
      let rW, rH;
      if (containerRatio > imgRatio) {
        rH = cH;
        rW = cH * imgRatio;
      } else {
        rW = cW;
        rH = cW / imgRatio;
      }
      setImgBounds({ width: rW, height: rH });
    };

    const rect = targetEl.getBoundingClientRect();
    updateBounds(rect.width - 16, rect.height - 16);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width: cW, height: cH } = entry.contentRect;
      updateBounds(cW, cH);
    });
    observer.observe(targetEl);
    return () => observer.disconnect();
  }, [naturalSize, isGoogleMap, currentMapUrl]);

  // --- Tooltip ---
  const [hoveredPin, setHoveredPin] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ isNearTop: false, isNearLeft: false, isNearRight: false });
  const hideTimeoutRef = useRef(null);

  const handleMouseEnter = (pinId, e) => {
    if (mode === 'view') {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (hoveredPin !== pinId && e?.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        let containerRect = { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
        if (mapContainerRef.current) {
          containerRect = mapContainerRef.current.getBoundingClientRect();
        }
        setTooltipPos({
          isNearTop: rect.top - containerRect.top < 200,
          isNearLeft: rect.left - containerRect.left < 250,
          isNearRight: containerRect.right - rect.right < 250,
        });
      }
      setHoveredPin(pinId);
    }
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => setHoveredPin(null), 300);
  };

  // Przelicz pozycje pinezek na bieżący widok Mapy Google (aby pinezki z lat/lng płynnie podążały za mapą)
  const renderedPins = useMemo(() => {
    if (!isGoogleMap) return displayPins;
    const w = imgBounds.width || 1000;
    const h = imgBounds.height || 700;
    const cLat = draftGoogleView?.lat ?? activeGoogleLat;
    const cLng = draftGoogleView?.lng ?? activeGoogleLng;
    const cZoom = draftGoogleView?.zoom ?? activeGoogleZoom;

    return displayPins.map(pin => {
      if (draggingPin && draggingPin.id === pin.id && draggingPin.type === pin.type) {
        return pin;
      }
      let pinLat = pin.lat;
      let pinLng = pin.lng;
      if ((pinLat == null || pinLng == null) && pin.xPercent != null && pin.yPercent != null) {
        const derived = unprojectViewportPercentToLatLng(
          pin.xPercent,
          pin.yPercent,
          activeGoogleLat,
          activeGoogleLng,
          activeGoogleZoom,
          w,
          h
        );
        if (derived) {
          pinLat = derived.lat;
          pinLng = derived.lng;
        }
      }
      if (pinLat != null && pinLng != null) {
        const projected = projectLatLngToViewportPercent(pinLat, pinLng, cLat, cLng, cZoom, w, h);
        if (projected) {
          return {
            ...pin,
            lat: pinLat,
            lng: pinLng,
            xPercent: projected.xPercent,
            yPercent: projected.yPercent,
          };
        }
      }
      return pin;
    });
  }, [
    isGoogleMap,
    displayPins,
    draggingPin,
    imgBounds.width,
    imgBounds.height,
    draftGoogleView?.lat,
    draftGoogleView?.lng,
    draftGoogleView?.zoom,
    activeGoogleLat,
    activeGoogleLng,
    activeGoogleZoom,
  ]);

  // --- Fullscreen ---
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) mapContainerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // --- Handlery Pointer ---
  const handlePointerDown = (e, pin) => {
    if (mode !== 'edit') return;
    if (e.target.closest('button')) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingPin({
      id: pin.id,
      type: pin.type,
      xPercent: pin.xPercent,
      yPercent: pin.yPercent,
      lat: pin.lat ?? null,
      lng: pin.lng ?? null,
    });
  };

  const handlePointerMove = (e) => {
    if (isPanningMap && !isGoogleMap) {
      setZoomPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (mode !== 'edit' || !draggingPin) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const nextXPercent = (x / rect.width) * 100;
    const nextYPercent = (y / rect.height) * 100;
    let nextGeo = {};
    if (isGoogleMap) {
      const unproj = unprojectViewportPercentToLatLng(
        nextXPercent,
        nextYPercent,
        draftGoogleView.lat,
        draftGoogleView.lng,
        draftGoogleView.zoom,
        rect.width,
        rect.height
      );
      if (unproj) nextGeo = { lat: unproj.lat, lng: unproj.lng };
    }
    setDraggingPin(prev => ({
      ...prev,
      xPercent: nextXPercent,
      yPercent: nextYPercent,
      ...nextGeo,
    }));
  };

  const handlePointerUp = async (e) => {
    let isTap = false;
    if (pointerDownPosRef.current && e) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) < 25 && Date.now() - pointerDownPosRef.current.time < 1000) isTap = true;
      pointerDownPosRef.current = null;
    }
    if (isPanningMap) setIsPanningMap(false);
    if (
      isTap &&
      !isGoogleMap &&
      (e.target.tagName.toLowerCase() === 'img' ||
        e.target.closest('div.bg-slate-800') ||
        e.target.closest('[data-map-canvas="true"]'))
    ) {
      handleMapClick(e);
    }
    if (mode !== 'edit' || !draggingPin) return;
    const { id, type, xPercent, yPercent, lat, lng } = draggingPin;
    setDraggingPin(null);
    try {
      const updateData = {
        xPercent,
        yPercent,
        pinnedOnMapType: isGoogleMap ? 'google' : 'image',
      };
      if (isGoogleMap && lat != null && lng != null) {
        updateData.lat = lat;
        updateData.lng = lng;
      } else if (!isGoogleMap) {
        updateData.lat = null;
        updateData.lng = null;
        updateData.address = null;
      }
      if (currentSubmapId !== null) {
        updateData.submapTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
      }
      if (type === 'machine') updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
      if (type === 'region') await updateRegion(id, updateData);
      else await updateMachineRegion(id, updateData);
    } catch (error) {
      console.error('Błąd zapisywania pinezki:', error);
    }
  };

  const handleMapClick = (e) => {
    if (mode === 'view') {
      setHoveredPin(null);
      return;
    }
    if (mode !== 'edit' || draggingPin || isFramingGoogleMap) return;
    if (!isGoogleMap && !currentMapUrl) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    const rect = boundsContainer
      ? boundsContainer.getBoundingClientRect()
      : e.currentTarget?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    if (isGoogleMap) {
      const coords = unprojectViewportPercentToLatLng(
        xPercent,
        yPercent,
        draftGoogleView.lat,
        draftGoogleView.lng,
        draftGoogleView.zoom,
        rect.width,
        rect.height
      );
      setTempPos({
        xPercent,
        yPercent,
        lat: coords?.lat ?? draftGoogleView.lat,
        lng: coords?.lng ?? draftGoogleView.lng,
        fromClick: true,
      });
    } else {
      setTempPos({ xPercent, yPercent });
    }
    if (selectedPinCandidate) {
      setEditingType(selectedPinCandidate.type);
      setEditingId(selectedPinCandidate.id);
    } else {
      setEditingId('');
    }
    setIsModalOpen(true);
  };

  const handleOpenAddressPinModal = (initialQuery = '') => {
    setTempPos({
      xPercent: 50,
      yPercent: 50,
      lat: draftGoogleView.lat,
      lng: draftGoogleView.lng,
      address: initialQuery || '',
      fromClick: true,
    });
    if (selectedPinCandidate) {
      setEditingType(selectedPinCandidate.type);
      setEditingId(selectedPinCandidate.id);
    } else {
      setEditingId('');
    }
    setIsModalOpen(true);
  };

  const handleSavePin = async (e, geoOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingId) return;
    try {
      const pinLat = geoOverride?.lat ?? tempPos?.lat ?? null;
      const pinLng = geoOverride?.lng ?? tempPos?.lng ?? null;
      const pinAddress = geoOverride?.address ?? tempPos?.address ?? '';

      let xPercent = tempPos?.xPercent ?? 50;
      let yPercent = tempPos?.yPercent ?? 50;

      if (isGoogleMap && pinLat != null && pinLng != null) {
        const projected = projectLatLngToViewportPercent(
          pinLat,
          pinLng,
          draftGoogleView.lat,
          draftGoogleView.lng,
          draftGoogleView.zoom,
          imgBounds.width || 1000,
          imgBounds.height || 700
        );
        if (projected) {
          xPercent = projected.xPercent;
          yPercent = projected.yPercent;
        }
      }

      const updateData = {
        xPercent,
        yPercent,
        pinnedOnMapType: isGoogleMap ? 'google' : 'image',
      };
      if (isGoogleMap && pinLat != null && pinLng != null) {
        updateData.lat = Number(pinLat);
        updateData.lng = Number(pinLng);
        if (pinAddress) updateData.address = pinAddress;
      } else if (!isGoogleMap) {
        updateData.lat = null;
        updateData.lng = null;
        updateData.address = null;
      }

      if (editingType === 'machine') {
        updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
        if (currentSubmapId !== null) {
          updateData.regionId = currentSubmapId;
          updateData.submapTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
        }
        await updateMachineRegion(editingId, updateData);
      } else {
        updateData.parentId = currentSubmapId || null;
        if (currentSubmapId !== null) {
          updateData.submapTabId = activeSubmapObj?.id || currentSubmapTabId || 'default';
        }
        await updateRegion(editingId, updateData);
      }

      // Jeśli przypięto po adresie (geoOverride) spoza aktualnego kadru, przesuń widok na nowy adres
      if (isGoogleMap && geoOverride && pinLat != null && pinLng != null) {
        setDraftGoogleView(prev => ({
          ...prev,
          lat: Number(pinLat),
          lng: Number(pinLng),
        }));
      }

      setSelectedPinCandidate(null);
      setIsModalOpen(false);
      setTempPos(null);
    } catch (error) {
      console.error('Błąd podczas zapisywania pinezki:', error);
      alert(t('map_component.pin_save_error'));
    }
  };

  const handleDeletePin = async (id, type) => {
    if (confirm(t('map_component.delete_pin_confirm'))) {
      try {
        const clearFields =
          type === 'machine'
            ? { xPercent: null, yPercent: null, lat: null, lng: null, address: null, pinnedOnMap: null }
            : { xPercent: null, yPercent: null, lat: null, lng: null, address: null };
        await setDoc(
          doc(db, 'tenants', getCurrentTenant(), type === 'region' ? 'regions' : 'machines', id),
          clearFields,
          { merge: true }
        );
      } catch (error) {
        console.error('Błąd usuwania pinezki:', error);
      }
    }
  };

  const outerTransformStyle = isGoogleMap
    ? { transform: 'none', zIndex: 0 }
    : { transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 0 };

  const pinsTransformStyle = isGoogleMap
    ? { transform: 'none', zIndex: 100 }
    : { transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 100 };

  // --- Render ---
  return (
    <div
      className={`flex flex-col animate-fade-in relative ${
        isFullscreen ? 'h-screen w-screen bg-slate-900 p-2 sm:p-4' : 'flex-1 w-full space-y-2'
      }`}
      ref={isFullscreen ? null : mapContainerRef}
    >
      {/* Kontener Mapy */}
      <div
        ref={isFullscreen ? mapContainerRef : null}
        className={`flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 relative group flex items-center justify-center select-none touch-none ${
          isFullscreen ? 'w-full h-full' : ''
        }`}
        style={{ minHeight: '350px' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerDown={(e) => {
          if (isGoogleMap) return;
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          if (!e.target.closest('.group\\/pin') && !e.target.closest('button')) {
            setIsPanningMap(true);
            setPanStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
          }
        }}
      >
        <div
          ref={mapContentRef}
          className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden touch-none"
          onTouchStart={(e) => {
            if (isGoogleMap) return;
            if (e.touches.length >= 2) {
              setIsPanningMap(false);
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              touchDistRef.current = dist;
            }
          }}
          onTouchMove={(e) => {
            if (isGoogleMap) return;
            if (e.touches.length === 2 && touchDistRef.current) {
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              setZoomScale(s => Math.min(Math.max(0.5, s * (dist / touchDistRef.current)), 5));
              touchDistRef.current = dist;
            }
          }}
          onTouchEnd={() => {
            touchDistRef.current = null;
          }}
        >
          {/* Transform Wrapper */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center"
            style={outerTransformStyle}
          >
            {isGoogleMap ? (
              <div
                data-map-canvas="true"
                style={{
                  width: imgBounds.width ? `${imgBounds.width}px` : '100%',
                  height: imgBounds.height ? `${imgBounds.height}px` : '100%',
                }}
                className={`relative rounded-lg overflow-hidden shadow-2xl border ${
                  mode === 'edit' && isFramingGoogleMap
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                    : 'border-slate-700/80'
                } bg-slate-900 transition-opacity duration-300`}
              >
                <InteractiveGoogleMap
                  lat={draftGoogleView.lat}
                  lng={draftGoogleView.lng}
                  zoom={draftGoogleView.zoom}
                  mapStyle={draftGoogleView.style || activeGoogleStyle}
                  interactive={true}
                  showHintBar={mode === 'edit' && isFramingGoogleMap}
                  onViewChange={(next) => setDraftGoogleView(prev => ({ ...prev, ...next }))}
                  onClickCanvas={mode === 'edit' && !isFramingGoogleMap ? handleMapClick : () => setHoveredPin(null)}
                />
              </div>
            ) : currentMapUrl ? (
              <img
                ref={imgRef}
                data-map-canvas="true"
                src={currentMapUrl}
                alt="Mapa"
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  mode === 'edit' ? 'opacity-80' : 'opacity-100'
                } cursor-${
                  mode === 'edit'
                    ? draggingPin
                      ? 'grabbing'
                      : isFramingGoogleMap
                        ? isPanningMap
                          ? 'grabbing'
                          : 'grab'
                        : 'crosshair'
                    : isPanningMap
                      ? 'grabbing'
                      : 'grab'
                }`}
                onClick={handleMapClick}
                draggable="false"
                onLoad={(e) => {
                  mapImageCache[currentMapUrl] = true;
                  setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                  setImageProgress(100);
                  setTimeout(() => setIsImageLoading(false), 200);
                }}
                onError={() => {
                  setIsImageLoading(false);
                }}
              />
            ) : (
              <div
                data-map-canvas="true"
                className={`w-full h-full min-w-[400px] min-h-[350px] flex flex-col items-center justify-center bg-slate-800 text-slate-400 font-bold text-xl md:text-3xl text-center p-8 transition-opacity duration-300 ${
                  mode === 'edit' ? 'opacity-80' : 'opacity-100'
                }`}
                onClick={handleMapClick}
              >
                <i className="ph ph-map-trifold text-6xl mb-4 opacity-50"></i>
                {t('map_component.no_map')}
                <br />
                <span className="text-sm md:text-base font-medium text-slate-500 mt-2">
                  {t('map_component.upload_map_hint')} {t('map_component.or_set_google_map', '(lub ustaw Mapę Google w Opcjach Mapy)')}
                </span>
              </div>
            )}
          </div>

          {/* Pływający pasek zapisu kadrowania Mapy Google */}
          {mode === 'edit' && isFramingGoogleMap && isGoogleMap && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[150] bg-slate-900/95 backdrop-blur-md border border-emerald-500/60 px-4 py-2.5 rounded-xl shadow-2xl flex flex-wrap items-center gap-3 text-white pointer-events-auto"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <i className="ph ph-hand-grabbing text-lg animate-bounce"></i>
                <span>{t('map_component.framing_hint', 'Przesuń mapę myszką i przybliż płynnie rolką w wybrane miejsce')}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSaveGoogleMapConfig({
                    googleQuery: activeGoogleQuery,
                    googleLat: draftGoogleView.lat,
                    googleLng: draftGoogleView.lng,
                    googleZoom: draftGoogleView.zoom,
                    googleMapStyle: draftGoogleView.style,
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="ph ph-floppy-disk text-sm"></i>
                <span>Ustaw jako domyślny kadr</span>
              </button>
            </div>
          )}

          {/* Loader */}
          {!isGoogleMap && currentMapUrl && isImageLoading && !mapImageCache[currentMapUrl] && (
            <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
              <i className="ph ph-spinner-gap animate-spin text-5xl mb-4 text-blue-500"></i>
              <h3 className="text-base md:text-xl font-bold mb-2">{t('map_component.loading_map')}</h3>
              <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${imageProgress}%` }}></div>
              </div>
              <p className="mt-2 text-[10px] md:text-sm text-slate-400 font-mono">{imageProgress}%</p>
            </div>
          )}

          {/* Pinezki */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center pointer-events-none"
            style={pinsTransformStyle}
          >
            {(isGoogleMap || Boolean(currentMapUrl)) && imgBounds.width > 0 && (
              <div
                id="map-bounds-container"
                className="absolute pointer-events-none overflow-hidden"
                style={{ width: `${imgBounds.width}px`, height: `${imgBounds.height}px` }}
              >
                {mode === 'edit' && !isFramingGoogleMap && !draggingPin && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto flex flex-wrap items-center gap-2 justify-center z-10">
                    <div className="bg-amber-500/90 backdrop-blur text-white px-4 py-1.5 rounded-full font-bold shadow-xl text-[10px] md:text-xs whitespace-nowrap">
                      {selectedPinCandidate
                        ? `Kliknij na mapę, aby przypiąć: ${selectedPinCandidate.name}`
                        : t('map_component.pin_hint')}
                    </div>
                  </div>
                )}

                {renderedPins.map(pin => (
                  <MapPin
                    key={`${pin.type}-${pin.id}`}
                    pin={pin}
                    mode={isFramingGoogleMap ? 'view' : mode}
                    modeType={modeType}
                    zoomScale={isGoogleMap ? 1 : zoomScale}
                    hoveredPin={hoveredPin}
                    setHoveredPin={setHoveredPin}
                    draggingPin={draggingPin}
                    tooltipPos={tooltipPos}
                    isFullscreen={isFullscreen}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMouseLeave}
                    handlePointerDown={handlePointerDown}
                    handleDeletePin={handleDeletePin}
                    onNavigateToTickets={onNavigateToTickets}
                    setCurrentSubmapId={setCurrentSubmapId}
                    onOpenSubmap={(regionId, submapTabId) => {
                      setCurrentSubmapId(regionId);
                      setCurrentSubmapTabId(submapTabId || null);
                      setHoveredPin(null);
                    }}
                    onSetupSubmap={(regionId) => {
                      setCurrentSubmapId(regionId);
                      setCurrentSubmapTabId(null);
                      setMode('edit');
                      setIsSettingsMinimized(false);
                      setHoveredPin(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <MapLegend
            mode={mode}
            modeType={modeType}
            currentSubmapId={currentSubmapId}
            regions={regions}
            machines={machines}
            tickets={tickets}
            plannedServices={plannedServices}
            unpinnedData={unpinnedData}
            hoveredPin={hoveredPin}
            setHoveredPin={setHoveredPin}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            onNavigateToTickets={onNavigateToTickets}
            isFullscreen={isFullscreen}
          />

          <MapControls
            mode={mode}
            setMode={setMode}
            currentSubmapId={currentSubmapId}
            setCurrentSubmapId={setCurrentSubmapId}
            currentSubmapTabId={activeSubmapObj?.id || currentSubmapTabId}
            setCurrentSubmapTabId={setCurrentSubmapTabId}
            submapTabs={submapTabs}
            onAddParallelSubmap={handleAddParallelSubmap}
            onRenameParallelSubmap={handleRenameParallelSubmap}
            onDeleteParallelSubmap={handleDeleteParallelSubmap}
            breadcrumbPath={breadcrumbPath}
            activeMapType={selectedMapKind}
            onSelectMapType={handleSelectMapType}
            hasSavedGoogleFrame={hasSavedGoogleFrame}
            hasSavedImageFrame={hasSavedImageFrame}
            unpinnedRegions={unpinnedRegions}
            unpinnedMachines={unpinnedMachines}
            selectedPinCandidate={selectedPinCandidate}
            onSelectPinCandidate={setSelectedPinCandidate}
            activeGoogleQuery={activeGoogleQuery}
            activeGoogleLat={activeGoogleLat}
            activeGoogleLng={activeGoogleLng}
            activeGoogleZoom={activeGoogleZoom}
            activeGoogleStyle={activeGoogleStyle}
            isGoogleMap={isGoogleMap}
            isFramingGoogleMap={isFramingGoogleMap}
            setIsFramingGoogleMap={setIsFramingGoogleMap}
            draftGoogleView={draftGoogleView}
            setDraftGoogleView={setDraftGoogleView}
            onSaveGoogleMapConfig={handleSaveGoogleMapConfig}
            onSwitchToImageMode={handleSwitchToImageMode}
            onOpenAddressPinModal={handleOpenAddressPinModal}
            onGoogleZoomStep={handleGoogleZoomStep}
            onResetView100={handleResetView100}
            displayZoomPercent={displayZoomPercent}
            user={user}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            setZoomPan={setZoomPan}
            saveDefaultView={saveDefaultView}
            uploadingMap={uploadingMap}
            handleMapFileChange={handleMapFileChange}
            mapDragActive={mapDragActive}
            handleMapDragEnter={handleMapDragEnter}
            handleMapDragLeave={handleMapDragLeave}
            handleMapDragOver={handleMapDragOver}
            handleMapDragDrag={handleMapDragOver}
            handleMapDrop={handleMapDrop}
            isSettingsMinimized={isSettingsMinimized}
            setIsSettingsMinimized={setIsSettingsMinimized}
          />
        </div>
      </div>

      {/* Modal Edycji Pinezki */}
      <MapEditModal
        isModalOpen={isModalOpen && mode === 'edit'}
        editingType={editingType}
        setEditingType={setEditingType}
        editingId={editingId}
        setEditingId={setEditingId}
        currentSubmapId={currentSubmapId}
        currentSubmapTabId={activeSubmapObj?.id || currentSubmapTabId}
        regions={regions}
        machines={machines}
        isGoogleMap={isGoogleMap}
        tempPos={tempPos}
        onSave={handleSavePin}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
