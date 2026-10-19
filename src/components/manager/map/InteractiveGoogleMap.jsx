import React, { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_LAT = 54.5364; // Gdynia / Trójmiasto domyślnie
const DEFAULT_LNG = 18.5469;
const DEFAULT_ZOOM = 17;

export function lngToWorldX(lng, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  return ((lng + 180) / 360) * scale;
}

export function latToWorldY(lat, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
}

export function worldXToLng(wx, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  return (wx / scale) * 360 - 180;
}

export function worldYToLat(wy, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * wy) / scale;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export async function geocodeAddressQuery(queryStr) {
  const trimmed = (queryStr || '').trim();
  if (!trimmed) return null;

  // Sprawdź czy użytkownik wpisał współrzędne GPS np. "54.5189, 18.5305"
  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pl,en' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, displayName: data[0].display_name };
      }
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }
  return null;
}

function resolveGoogleLyrs(style) {
  // 'k' lub 'y' -> Satelita z nazwami ulic i budynków (Hybryda), 's' -> Satelita bez opisów, 'm' -> Drogowa
  if (style === 'm') return 'm';
  if (style === 's') return 's';
  return 'y';
}

export default function InteractiveGoogleMap({
  lat,
  lng,
  zoom = DEFAULT_ZOOM,
  mapStyle = 'k',
  interactive = false,
  onViewChange,
  onClickCanvas,
  className = '',
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [view, setView] = useState({
    lat: Number.isFinite(Number(lat)) && Number(lat) !== 0 ? Number(lat) : DEFAULT_LAT,
    lng: Number.isFinite(Number(lng)) && Number(lng) !== 0 ? Number(lng) : DEFAULT_LNG,
    zoom: Math.min(20, Math.max(5, Math.round(Number(zoom) || DEFAULT_ZOOM))),
  });

  const dragRef = useRef(null);

  useEffect(() => {
    const nextLat = Number(lat);
    const nextLng = Number(lng);
    const nextZoom = Math.min(20, Math.max(5, Math.round(Number(zoom) || DEFAULT_ZOOM)));
    if (Number.isFinite(nextLat) && Number.isFinite(nextLng) && (nextLat !== 0 || nextLng !== 0)) {
      setView({ lat: nextLat, lng: nextLng, zoom: nextZoom });
    } else {
      setView(prev => ({ ...prev, zoom: nextZoom }));
    }
  }, [lat, lng, zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  const handleWheel = useCallback(
    (e) => {
      if (!interactive) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 1 : -1;
      setView(prev => {
        const nextZoom = Math.min(20, Math.max(5, prev.zoom + delta));
        if (nextZoom === prev.zoom) return prev;
        const next = { ...prev, zoom: nextZoom };
        if (onViewChange) onViewChange(next);
        return next;
      });
    },
    [interactive, onViewChange]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !interactive) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [interactive, handleWheel]);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const startWx = lngToWorldX(view.lng, view.zoom);
    const startWy = latToWorldY(view.lat, view.zoom);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWx,
      startWy,
      zoom: view.zoom,
    };
    if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!interactive || !dragRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextWx = dragRef.current.startWx - dx;
    const nextWy = dragRef.current.startWy - dy;
    const nextLat = Math.max(-85, Math.min(85, worldYToLat(nextWy, dragRef.current.zoom)));
    const nextLng = Math.max(-180, Math.min(180, worldXToLng(nextWx, dragRef.current.zoom)));
    const next = { lat: nextLat, lng: nextLng, zoom: dragRef.current.zoom };
    setView(next);
    if (onViewChange) onViewChange(next);
  };

  const handlePointerUp = (e) => {
    if (!interactive || !dragRef.current) return;
    e.stopPropagation();
    dragRef.current = null;
  };

  const z = view.zoom;
  const maxTileIdx = Math.pow(2, z);
  const centerWx = lngToWorldX(view.lng, z);
  const centerWy = latToWorldY(view.lat, z);
  const topLeftWx = centerWx - size.width / 2;
  const topLeftWy = centerWy - size.height / 2;

  const minTx = Math.floor(topLeftWx / 256);
  const maxTx = Math.floor((topLeftWx + size.width) / 256);
  const minTy = Math.floor(topLeftWy / 256);
  const maxTy = Math.floor((topLeftWy + size.height) / 256);

  const lyrs = resolveGoogleLyrs(mapStyle);
  const tiles = [];

  for (let tx = minTx; tx <= maxTx; tx++) {
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (ty < 0 || ty >= maxTileIdx) continue;
      const wrappedTx = ((tx % maxTileIdx) + maxTileIdx) % maxTileIdx;
      const serverIdx = Math.abs(tx + ty) % 4;
      const left = Math.round(tx * 256 - topLeftWx);
      const top = Math.round(ty * 256 - topLeftWy);
      const src = `https://mt${serverIdx}.google.com/vt/lyrs=${lyrs}&x=${wrappedTx}&y=${ty}&z=${z}&hl=pl`;
      tiles.push(
        <img
          key={`${z}-${tx}-${ty}-${lyrs}`}
          src={src}
          alt=""
          draggable={false}
          className="absolute w-[256px] h-[256px] max-w-none select-none pointer-events-none"
          style={{ left: `${left}px`, top: `${top}px` }}
        />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      data-map-canvas="true"
      onClick={onClickCanvas}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-full overflow-hidden bg-slate-900 select-none ${
        interactive ? 'cursor-grab active:cursor-grabbing' : ''
      } ${className}`}
    >
      {tiles}
      {interactive && (
        <div className="absolute bottom-2 left-2 z-20 bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-md border border-emerald-500/50 text-[10px] font-mono text-emerald-300 pointer-events-none flex items-center gap-2 shadow">
          <i className="ph ph-arrows-out-cardinal text-xs"></i>
          <span>Przeciągnij mapę myszką / rolką • {view.lat.toFixed(5)}, {view.lng.toFixed(5)} (Zoom {view.zoom})</span>
        </div>
      )}
    </div>
  );
}
