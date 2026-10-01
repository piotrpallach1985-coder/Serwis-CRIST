import { useAuth } from '../../hooks/useAuth';
import MapLegend from './map/MapLegend';
import MapPin from './map/MapPin';
import { useManagerStore } from '../../store/managerStore';
import MapControls from './map/MapControls';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { updateMapSettings, updateRegion, updateMachineRegion, subscribeToMapSettings } from '../../services/machines.service';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';

import { useMapPins } from '../../hooks/useMapPins';
import MapEditModal from './MapEditModal';
import { USER_ROLES, TICKET_STATUS, SERVICE_STATUS, PIN_STATUS } from '../../utils/constants';
import { getCurrentTenant } from '../../utils/tenantHelper';


// Globalny cache dla obrazĂłw mapy (dziaĹ‚a do wylogowania/odĹ›wieĹĽenia)
const mapImageCache = {};

export default function ShipyardMap({
  
  modeType = 'tickets',
  onNavigateToTickets
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tickets, machines, reporters, services, plannedServices, notifications, actionItems, roles, regions, allowTicketDeletion, plannedWarningDays, branding } = useManagerStore();

  // --- Tryb widoku ---
  const [mode, setMode] = useState('view');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSubmapId, setCurrentSubmapId] = useState(null);

  // --- Konfiguracja mapy ---
  const [mapConfig, setMapConfig] = useState({ url: '', defaultZoom: 1, defaultPan: { x: 0, y: 0 } });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [cachedMainMap, setCachedMainMap] = useState('');
  const [cachedSubmaps, setCachedSubmaps] = useState({});
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [uploadingMap, setUploadingMap] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pobierz konfiguracjÄ™ mapy z Firestore
  useEffect(() => {
    // dynamicznie importujemy ĹĽeby uniknÄ…Ä‡ duplikacji z ManagerView
    
      const unsub = subscribeToMapSettings((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMapConfig({ url: data.mapUrl || '', defaultZoom: data.defaultZoom || 1, defaultPan: { x: data.defaultPanX || 0, y: data.defaultPanY || 0 } });
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

  // --- Upload mapy ---
  const [mapDragActive, setMapDragActive] = useState(false);
  const [isSettingsMinimized, setIsSettingsMinimized] = useState(true);

  const handleMapDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(true); };
  const handleMapDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); };
  const handleMapDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleMapDrop = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); if (e.dataTransfer.files?.[0]) processMapFile(e.dataTransfer.files[0]); };
  const handleMapFileChange = (e) => { if (e.target.files?.[0]) processMapFile(e.target.files[0]); };

  const processMapFile = (file) => {
    if (!file) return;
    setUploadingMap(true);
    const storageRef = ref(storage, 'map_backgrounds/' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => { console.error('Upload error', error); setUploadingMap(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (currentSubmapId !== null) {
          await updateRegion(currentSubmapId, { mapImageUrl: url });
        } else {
          updateMapSettings({ mapUrl: url });
        }
        setUploadingMap(false);
        setUploadProgress(0);
      }
    );
  };

  const saveDefaultView = async () => {
    try {
      if (currentSubmapId !== null) {
        await updateRegion(currentSubmapId, { defaultZoom: zoomScale, defaultPanX: zoomPan.x, defaultPanY: zoomPan.y });
      } else {
        await updateMapSettings({ defaultZoom: zoomScale, defaultPanX: zoomPan.x, defaultPanY: zoomPan.y });
      }
      alert(t('map_component.view_saved'));
    } catch (error) { 
      console.error('BĹ‚Ä…d zapisywania widoku:', error); 
      alert(t('map_component.view_save_error') + error.message);
    }
  };

  // --- Stan pinezek (modal) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const imgRef = useRef(null);

  const currentMapUrl = currentSubmapId
    ? (regions.find(r => r.id === currentSubmapId)?.mapImageUrl || mapConfig.url)
    : mapConfig.url;

  useEffect(() => {
      if (!currentMapUrl) {
        setIsImageLoading(false);
        return;
      }
    if (mapImageCache[currentMapUrl]) { setIsImageLoading(false); setImageProgress(100); return; }
    setIsImageLoading(true); setImageProgress(0);
    const safetyTimeout = setTimeout(() => { setIsImageLoading(false); setImageProgress(100); mapImageCache[currentMapUrl] = true; }, 4000);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) { clearTimeout(safetyTimeout); setIsImageLoading(false); setImageProgress(100); mapImageCache[currentMapUrl] = true; return; }
    const interval = setInterval(() => { setImageProgress(p => { const next = p + Math.floor(Math.random() * 15) + 5; return next > 90 ? 90 : next; }); }, 200);
    return () => { clearInterval(interval); clearTimeout(safetyTimeout); };
  }, [currentMapUrl]);

  // --- Drag & Drop pinezek + Zoom/Pan ---
  const [tempPos, setTempPos] = useState(null);
  const [editingType, setEditingType] = useState('region');
  const [editingId, setEditingId] = useState('');
  const [draggingPin, setDraggingPin] = useState(null);
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const initialScaleRef = useRef(1);
  const pointerDownPosRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapContentRef = useRef(null);

  useEffect(() => {
    const el = mapContentRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); const delta = e.deltaY < 0 ? 0.15 : -0.15; setZoomScale(s => Math.min(Math.max(0.5, parseFloat((s + delta).toFixed(2))), 5)); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const [imgBounds, setImgBounds] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imgRef.current || !naturalSize.width) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width: cW, height: cH } = entry.contentRect;
      const imgRatio = naturalSize.width / naturalSize.height;
      const containerRatio = cW / cH;
      let rW, rH;
      if (containerRatio > imgRatio) { rH = cH; rW = cH * imgRatio; } else { rW = cW; rH = cW / imgRatio; }
      setImgBounds({ width: rW, height: rH });
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [naturalSize]);

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
            isNearTop: (rect.top - containerRect.top) < 200, 
            isNearLeft: (rect.left - containerRect.left) < 250, 
            isNearRight: (containerRect.right - rect.right) < 250 
          });
      }
      setHoveredPin(pinId);
    }
  };

  const handleMouseLeave = () => { hideTimeoutRef.current = setTimeout(() => setHoveredPin(null), 300); };

  // --- Pinezki (przez hook) ---
  const { displayPins, unpinnedData } = useMapPins({ tickets, plannedServices, modeType, machines, regions, plannedWarningDays, currentSubmapId, draggingPin });

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
    e.stopPropagation(); e.preventDefault();
    setDraggingPin({ id: pin.id, type: pin.type, xPercent: pin.xPercent, yPercent: pin.yPercent });
  };

  const handlePointerMove = (e) => {
    if (isPanningMap) { setZoomPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    if (mode !== 'edit' || !draggingPin) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setDraggingPin(prev => ({ ...prev, xPercent: (x / rect.width) * 100, yPercent: (y / rect.height) * 100 }));
  };

  const handlePointerUp = async (e) => {
    let isTap = false;
    if (pointerDownPosRef.current && e) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) < 30 && Date.now() - pointerDownPosRef.current.time < 1000) isTap = true;
      pointerDownPosRef.current = null;
    }
    if (isPanningMap) setIsPanningMap(false);
    if (isTap && (e.target.tagName.toLowerCase() === 'img' || e.target.closest('div.bg-slate-800'))) handleMapClick(e);
    if (mode !== 'edit' || !draggingPin) return;
    const { id, type, xPercent, yPercent } = draggingPin;
    setDraggingPin(null);
    try {
      const updateData = { xPercent, yPercent };
      if (type === 'machine') updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
      if (type === 'region') await updateRegion(id, updateData); else await updateMachineRegion(id, updateData);
    } catch (error) { console.error('BĹ‚Ä…d zapisywania pinezki:', error); }
  };

  const handleMapClick = (e) => {
    if (mode === 'view') { setHoveredPin(null); return; }
    if (mode !== 'edit' || draggingPin) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
    setTempPos({ xPercent: (x / rect.width) * 100, yPercent: (y / rect.height) * 100 });
    setEditingId('');
    if (currentSubmapId !== null) setEditingType('machine');
    setIsModalOpen(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!tempPos || !editingId) return;
    try {
      const updateData = { xPercent: tempPos.xPercent, yPercent: tempPos.yPercent };
      if (editingType === 'machine') updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
      if (editingType === 'region') await updateRegion(editingId, updateData); else await updateMachineRegion(editingId, updateData);
      setIsModalOpen(false); setTempPos(null);
    } catch (error) { console.error('BĹ‚Ä…d podczas zapisywania pinezki:', error); alert(t('map_component.pin_save_error')); }
  };

  const handleDeletePin = async (id, type) => {
    if (confirm(t('map_component.delete_pin_confirm'))) {
      try { await updateDoc(doc(db, 'tenants', getCurrentTenant(), type === 'region' ? 'regions' : 'machines', id), { xPercent: null, yPercent: null }); }
      catch (error) { console.error('BĹ‚Ä…d usuwania pinezki:', error); }
    }
  };


  // --- Render ---
  return (
    <div className={`flex flex-col animate-fade-in relative ${isFullscreen ? 'h-screen w-screen bg-slate-900 p-2 sm:p-4' : 'flex-1 w-full space-y-2'}`} ref={isFullscreen ? null : mapContainerRef}>
      {/* Kontener Mapy */}
      <div
        ref={isFullscreen ? mapContainerRef : null}
        className={`flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 relative group flex items-center justify-center select-none touch-none ${isFullscreen ? 'w-full h-full' : ''}`}
        style={{ minHeight: '350px' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerDown={(e) => {
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          if (!e.target.closest('.group\\/pin') && !e.target.closest('button')) {
            setIsPanningMap(true);
            setPanStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
          }
        }}
      >
        <div ref={mapContentRef} className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden touch-none"
          onTouchStart={(e) => { if (e.touches.length >= 2) { setIsPanningMap(false); const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); touchDistRef.current = dist; initialScaleRef.current = zoomScale; } }}
          onTouchMove={(e) => { if (e.touches.length === 2 && touchDistRef.current) { const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setZoomScale(s => Math.min(Math.max(0.5, s * (dist / touchDistRef.current)), 5)); touchDistRef.current = dist; } }}
          onTouchEnd={() => { touchDistRef.current = null; }}
        >
          {/* Transform Wrapper */}
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center" style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 0 }}>
            {currentMapUrl ? (
              <img
                ref={imgRef}
                src={currentMapUrl}
                alt="Mapa"
                className={`w-full h-full object-contain transition-opacity duration-300 ${mode === 'edit' ? 'opacity-80' : 'opacity-100'} cursor-${mode === 'edit' ? (draggingPin ? 'grabbing' : 'crosshair') : (isPanningMap ? 'grabbing' : 'grab')}`}
                onClick={handleMapClick}
                draggable="false"
                onLoad={(e) => { mapImageCache[currentMapUrl] = true; setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight }); setImageProgress(100); setTimeout(() => setIsImageLoading(false), 200); }}
                onError={(e) => { setIsImageLoading(false); }}
              />
            ) : (
              <div 
                className={`w-full h-full min-w-[400px] min-h-[350px] flex flex-col items-center justify-center bg-slate-800 text-slate-400 font-bold text-xl md:text-3xl text-center p-8 transition-opacity duration-300 ${mode === 'edit' ? 'opacity-80' : 'opacity-100'}`}
                onClick={handleMapClick}
              >
                <i className="ph ph-map-trifold text-6xl mb-4 opacity-50"></i>
                {t('map_component.no_map')}<br/>{t('map_component.upload_map_hint')}
              </div>
            )}
          </div>

          {/* Loader */}
          {(isImageLoading && !mapImageCache[currentMapUrl]) && (
            <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
              <i className="ph ph-spinner-gap animate-spin text-5xl mb-4 text-blue-500"></i>
              <h3 className="text-base md:text-xl font-bold mb-2">{t('map_component.loading_map')}</h3>
              <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${imageProgress}%` }}></div></div>
              <p className="mt-2 text-[10px] md:text-sm text-slate-400 font-mono">{imageProgress}%</p>
            </div>
          )}

          {/* Pinezki */}
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center pointer-events-none" style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 100 }}>
            {imgBounds.width > 0 && (
              <div id="map-bounds-container" className="absolute pointer-events-none" style={{ width: `${imgBounds.width}px`, height: `${imgBounds.height}px` }}>
                {mode === 'edit' && !draggingPin && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none flex items-center justify-center z-10">
                    <div className="bg-amber-500/90 backdrop-blur text-white px-6 py-2 rounded-full font-bold shadow-xl animate-pulse text-[10px] md:text-sm whitespace-nowrap">
                      {t('map_component.pin_hint')}</div>
                  </div>
                )}

                {displayPins.map(pin => (
                  <MapPin
                    key={`${pin.type}-${pin.id}`}
                    pin={pin}
                    mode={mode}
                    modeType={modeType}
                    zoomScale={zoomScale}
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
                  />
                ))}
              </div>
            )}
          </div>
          
          <MapLegend 
            mode={mode}
            modeType={modeType}
            currentSubmapId={currentSubmapId}
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
            handleMapDrop={handleMapDrop}
            isSettingsMinimized={isSettingsMinimized}
            setIsSettingsMinimized={setIsSettingsMinimized}
          />
        </div>
      </div>
      {/* Modal Edycji Pinezki */}
      <MapEditModal
        isModalOpen={isModalOpen && mode === 'edit'}
        editingType={editingType} setEditingType={setEditingType}
        editingId={editingId} setEditingId={setEditingId}
        currentSubmapId={currentSubmapId}
        regions={regions} machines={machines}
        onSave={handleSavePin}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}


