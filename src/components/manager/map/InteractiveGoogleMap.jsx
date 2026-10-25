import React, { useState, useRef, useEffect, useCallback } from 'react';

export const DEFAULT_LAT = 54.5364; // Domyślne współrzędne początkowe mapy
export const DEFAULT_LNG = 18.5469;
export const DEFAULT_ZOOM = 17;

export function clampZoom(z) {
  const num = Number(z);
  if (!Number.isFinite(num)) return DEFAULT_ZOOM;
  return Math.min(20, Math.max(5, Math.round(num * 1000) / 1000));
}

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

export function projectLatLngToViewportPercent(
  lat,
  lng,
  centerLat,
  centerLng,
  zoom,
  widthPx = 1000,
  heightPx = 700
) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  const cLat = Number.isFinite(Number(centerLat)) && Number(centerLat) !== 0 ? Number(centerLat) : DEFAULT_LAT;
  const cLng = Number.isFinite(Number(centerLng)) && Number(centerLng) !== 0 ? Number(centerLng) : DEFAULT_LNG;
  const z = clampZoom(zoom);
  const w = widthPx > 0 ? widthPx : 1000;
  const h = heightPx > 0 ? heightPx : 700;

  const centerWx = lngToWorldX(cLng, z);
  const centerWy = latToWorldY(cLat, z);
  const ptWx = lngToWorldX(numLng, z);
  const ptWy = latToWorldY(numLat, z);

  const xPx = w / 2 + (ptWx - centerWx);
  const yPx = h / 2 + (ptWy - centerWy);

  return {
    xPercent: (xPx / w) * 100,
    yPercent: (yPx / h) * 100,
  };
}

export function unprojectViewportPercentToLatLng(
  xPercent,
  yPercent,
  centerLat,
  centerLng,
  zoom,
  widthPx = 1000,
  heightPx = 700
) {
  const xp = Number(xPercent);
  const yp = Number(yPercent);
  if (!Number.isFinite(xp) || !Number.isFinite(yp)) return null;
  const cLat = Number.isFinite(Number(centerLat)) && Number(centerLat) !== 0 ? Number(centerLat) : DEFAULT_LAT;
  const cLng = Number.isFinite(Number(centerLng)) && Number(centerLng) !== 0 ? Number(centerLng) : DEFAULT_LNG;
  const z = clampZoom(zoom);
  const w = widthPx > 0 ? widthPx : 1000;
  const h = heightPx > 0 ? heightPx : 700;

  const centerWx = lngToWorldX(cLng, z);
  const centerWy = latToWorldY(cLat, z);
  const ptWx = centerWx + (xp / 100 - 0.5) * w;
  const ptWy = centerWy + (yp / 100 - 0.5) * h;

  const lat = Math.max(-85, Math.min(85, worldYToLat(ptWy, z)));
  const lng = Math.max(-180, Math.min(180, worldXToLng(ptWx, z)));
  return { lat, lng };
}

export function computeGoogleFitView(points = [], fallbackCenter = {}, widthPx = 1000, heightPx = 700) {
  const valid = (points || [])
    .map(p => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat !== 0 || p.lng !== 0));

  const fbLat = Number.isFinite(Number(fallbackCenter?.lat)) && Number(fallbackCenter?.lat) !== 0
    ? Number(fallbackCenter.lat)
    : DEFAULT_LAT;
  const fbLng = Number.isFinite(Number(fallbackCenter?.lng)) && Number(fallbackCenter?.lng) !== 0
    ? Number(fallbackCenter.lng)
    : DEFAULT_LNG;
  const fbZoom = clampZoom(fallbackCenter?.zoom ?? DEFAULT_ZOOM);

  if (valid.length === 0) {
    return { lat: fbLat, lng: fbLng, zoom: fbZoom };
  }

  if (valid.length === 1) {
    return {
      lat: valid[0].lat,
      lng: valid[0].lng,
      zoom: clampZoom(Math.min(17.5, Math.max(15.5, fbZoom))),
    };
  }

  let minWx0 = Infinity;
  let maxWx0 = -Infinity;
  let minWy0 = Infinity;
  let maxWy0 = -Infinity;

  valid.forEach(p => {
    const wx = lngToWorldX(p.lng, 0);
    const wy = latToWorldY(p.lat, 0);
    if (wx < minWx0) minWx0 = wx;
    if (wx > maxWx0) maxWx0 = wx;
    if (wy < minWy0) minWy0 = wy;
    if (wy > maxWy0) maxWy0 = wy;
  });

  const centerWx0 = (minWx0 + maxWx0) / 2;
  const centerWy0 = (minWy0 + maxWy0) / 2;
  const centerLat = Math.max(-85, Math.min(85, worldYToLat(centerWy0, 0)));
  const centerLng = Math.max(-180, Math.min(180, worldXToLng(centerWx0, 0)));

  const spanWx0 = maxWx0 - minWx0;
  const spanWy0 = maxWy0 - minWy0;

  if (spanWx0 < 1e-7 && spanWy0 < 1e-7) {
    return { lat: centerLat, lng: centerLng, zoom: 17.5 };
  }

  const usableW = Math.max(240, (widthPx > 0 ? widthPx : 1000) * 0.72);
  const usableH = Math.max(200, (heightPx > 0 ? heightPx : 700) * 0.70);

  const scaleX = usableW / Math.max(spanWx0, 1e-9);
  const scaleY = usableH / Math.max(spanWy0, 1e-9);
  const rawZoom = Math.log2(Math.min(scaleX, scaleY));

  return {
    lat: centerLat,
    lng: centerLng,
    zoom: Math.min(18.2, Math.max(5.5, clampZoom(rawZoom))),
  };
}

export async function searchAddressSuggestions(queryStr) {
  const trimmed = (queryStr || '').trim();
  if (!trimmed) return [];

  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [{ lat, lng, displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }];
    }
  }

  const normalized = trimmed.replace(/\b(ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  const queriesToTry = normalized && normalized !== trimmed ? [trimmed, normalized] : [trimmed];

  for (const q of queriesToTry) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pl,en' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data
          .map(item => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name || q,
          }))
          .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));
        if (mapped.length > 0) return mapped;
      }
    } catch (e) {
      console.warn('Geocoding error:', e);
    }
  }
  return [];
}

export async function geocodeAddressQuery(queryStr) {
  const results = await searchAddressSuggestions(queryStr);
  return results.length > 0 ? results[0] : null;
}

export async function reverseGeocodeLatLng(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${encodeURIComponent(numLat)}&lon=${encodeURIComponent(numLng)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pl,en' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.display_name) {
      return {
        lat: numLat,
        lng: numLng,
        displayName: data.display_name,
      };
    }
  } catch (e) {
    console.warn('Reverse geocoding error:', e);
  }
  return null;
}

function resolveGoogleLyrs(style) {
  if (style === 'm') return 'm';
  if (style === 's') return 's';
  return 'y';
}

function buildTilesForZoom(tileZ, centerLat, centerLng, width, height, scaleFactor, lyrs, keyPrefix = '') {
  const maxTileIdx = Math.pow(2, tileZ);
  const centerWx = lngToWorldX(centerLng, tileZ);
  const centerWy = latToWorldY(centerLat, tileZ);

  const effectiveWidth = width / scaleFactor;
  const effectiveHeight = height / scaleFactor;

  const minTx = Math.floor((centerWx - effectiveWidth / 2) / 256) - 1;
  const maxTx = Math.floor((centerWx + effectiveWidth / 2) / 256) + 1;
  const minTy = Math.floor((centerWy - effectiveHeight / 2) / 256) - 1;
  const maxTy = Math.floor((centerWy + effectiveHeight / 2) / 256) + 1;

  const tiles = [];
  for (let tx = minTx; tx <= maxTx; tx++) {
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (ty < 0 || ty >= maxTileIdx) continue;
      const wrappedTx = ((tx % maxTileIdx) + maxTileIdx) % maxTileIdx;
      const serverIdx = Math.abs(tx + ty) % 4;
      const left = width / 2 + (tx * 256 - centerWx);
      const top = height / 2 + (ty * 256 - centerWy);
      const src = `https://mt${serverIdx}.google.com/vt/lyrs=${lyrs}&x=${wrappedTx}&y=${ty}&z=${tileZ}&hl=pl`;
      tiles.push(
        <img
          key={`${keyPrefix}${tileZ}-${tx}-${ty}-${lyrs}`}
          src={src}
          alt=""
          draggable={false}
          className="absolute w-[256px] h-[256px] max-w-none select-none pointer-events-none"
          style={{ left: `${left}px`, top: `${top}px` }}
        />
      );
    }
  }
  return tiles;
}

export default function InteractiveGoogleMap({
  lat,
  lng,
  zoom = DEFAULT_ZOOM,
  mapStyle = 'k',
  interactive = true,
  showHintBar = false,
  markerPosition = null,
  onPickLocation,
  onViewChange,
  onClickCanvas,
  className = '',
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState({
    lat: Number.isFinite(Number(lat)) && Number(lat) !== 0 ? Number(lat) : DEFAULT_LAT,
    lng: Number.isFinite(Number(lng)) && Number(lng) !== 0 ? Number(lng) : DEFAULT_LNG,
    zoom: clampZoom(zoom),
  });

  const dragRef = useRef(null);
  const pinchDistRef = useRef(null);
  const prevTileZRef = useRef(Math.max(5, Math.min(20, Math.floor(clampZoom(zoom)))));
  const [bgTileZ, setBgTileZ] = useState(prevTileZRef.current);

  useEffect(() => {
    const nextLat = Number(lat);
    const nextLng = Number(lng);
    const nextZoom = clampZoom(zoom);
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
      const deltaModeFactor = e.deltaMode === 1 ? 25 : 1;
      const rawStep = -e.deltaY * deltaModeFactor * 0.0016;
      const step = Math.abs(rawStep) > 0.01 ? Math.max(-0.28, Math.min(0.28, rawStep)) : (e.deltaY < 0 ? 0.15 : -0.15);
      setView(prev => {
        const nextZoom = clampZoom(prev.zoom + step);
        if (nextZoom === prev.zoom) return prev;

        // Przybliżaj płynnie w kierunku kursora myszy
        const rect = containerRef.current?.getBoundingClientRect();
        let nextLat = prev.lat;
        let nextLng = prev.lng;
        if (rect && rect.width > 0 && rect.height > 0) {
          const offsetX = e.clientX - rect.left - rect.width / 2;
          const offsetY = e.clientY - rect.top - rect.height / 2;
          const ptWxBefore = lngToWorldX(prev.lng, prev.zoom) + offsetX;
          const ptWyBefore = latToWorldY(prev.lat, prev.zoom) + offsetY;
          const cursorLat = worldYToLat(ptWyBefore, prev.zoom);
          const cursorLng = worldXToLng(ptWxBefore, prev.zoom);
          const newCenterWx = lngToWorldX(cursorLng, nextZoom) - offsetX;
          const newCenterWy = latToWorldY(cursorLat, nextZoom) - offsetY;
          nextLat = Math.max(-85, Math.min(85, worldYToLat(newCenterWy, nextZoom)));
          nextLng = Math.max(-180, Math.min(180, worldXToLng(newCenterWx, nextZoom)));
        }

        const next = { lat: nextLat, lng: nextLng, zoom: nextZoom };
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
    const startWx = lngToWorldX(view.lng, view.zoom);
    const startWy = latToWorldY(view.lat, view.zoom);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWx,
      startWy,
      zoom: view.zoom,
      moved: false,
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
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < 5) return;
    dragRef.current.moved = true;
    setIsDragging(true);
    const nextWx = dragRef.current.startWx - dx;
    const nextWy = dragRef.current.startWy - dy;
    const nextLat = Math.max(-85, Math.min(85, worldYToLat(nextWy, dragRef.current.zoom)));
    const nextLng = Math.max(-180, Math.min(180, worldXToLng(nextWx, dragRef.current.zoom)));
    const next = { lat: nextLat, lng: nextLng, zoom: dragRef.current.zoom };
    setView(next);
    if (onViewChange) onViewChange(next);
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const wasMoved = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);
    if (!wasMoved) {
      if (onPickLocation && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
          const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
          const picked = unprojectViewportPercentToLatLng(
            xPercent,
            yPercent,
            view.lat,
            view.lng,
            view.zoom,
            rect.width,
            rect.height
          );
          if (picked) {
            onPickLocation(picked);
          }
        }
      }
      if (onClickCanvas) {
        onClickCanvas(e);
      }
    }
  };

  const handleTouchStart = (e) => {
    if (!interactive) return;
    if (e.touches && e.touches.length === 2) {
      dragRef.current = null;
      setIsDragging(false);
      pinchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e) => {
    if (!interactive) return;
    if (e.touches && e.touches.length === 2 && pinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (dist > 0 && pinchDistRef.current > 0) {
        const ratio = dist / pinchDistRef.current;
        const zoomDelta = Math.log2(ratio);
        if (Math.abs(zoomDelta) > 0.005) {
          pinchDistRef.current = dist;
          setView(prev => {
            const nextZoom = clampZoom(prev.zoom + zoomDelta);
            const next = { ...prev, zoom: nextZoom };
            if (onViewChange) onViewChange(next);
            return next;
          });
        }
      }
    }
  };

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
  };

  const z = clampZoom(view.zoom);
  const tileZ = Math.max(5, Math.min(20, Math.floor(z)));
  const fracScale = Math.pow(2, z - tileZ);

  useEffect(() => {
    if (tileZ !== prevTileZRef.current) {
      setBgTileZ(prevTileZRef.current);
      prevTileZRef.current = tileZ;
    }
  }, [tileZ]);

  const lyrs = resolveGoogleLyrs(mapStyle);
  const tiles = buildTilesForZoom(tileZ, view.lat, view.lng, size.width, size.height, fracScale, lyrs, 'fg-');

  const showBgLayer = bgTileZ !== tileZ && Math.abs(z - bgTileZ) <= 2.2;
  const bgScale = showBgLayer ? Math.pow(2, z - bgTileZ) : 1;
  const bgTiles = showBgLayer
    ? buildTilesForZoom(bgTileZ, view.lat, view.lng, size.width, size.height, bgScale, lyrs, 'bg-')
    : null;

  const projectedMarker =
    markerPosition &&
    Number.isFinite(Number(markerPosition.lat)) &&
    Number.isFinite(Number(markerPosition.lng)) &&
    (Number(markerPosition.lat) !== 0 || Number(markerPosition.lng) !== 0)
      ? projectLatLngToViewportPercent(
          Number(markerPosition.lat),
          Number(markerPosition.lng),
          view.lat,
          view.lng,
          z,
          size.width,
          size.height
        )
      : null;

  return (
    <div
      ref={containerRef}
      data-map-canvas="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden bg-slate-900 select-none ${
        interactive
          ? isDragging
            ? 'cursor-grabbing'
            : onClickCanvas || onPickLocation
              ? 'cursor-crosshair'
              : 'cursor-grab'
          : ''
      } ${className}`}
    >
      {showBgLayer && (
        <div
          className="absolute inset-0 pointer-events-none origin-center"
          style={{ transform: `scale(${bgScale})`, willChange: 'transform' }}
        >
          {bgTiles}
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none origin-center"
        style={{ transform: `scale(${fracScale})`, willChange: 'transform' }}
      >
        {tiles}
      </div>

      {projectedMarker && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${projectedMarker.xPercent}%`,
            top: `${projectedMarker.yPercent}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="relative flex flex-col items-center">
            <div className="bg-red-600 text-white w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center ring-4 ring-red-500/40">
              <i className="ph-fill ph-map-pin text-lg"></i>
            </div>
            <div className="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1.5 border-r border-b border-white shadow"></div>
            <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
          </div>
        </div>
      )}

      {showHintBar && (
        <div className="absolute bottom-2 left-2 z-20 bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-md border border-emerald-500/50 text-[10px] font-mono text-emerald-300 pointer-events-none flex items-center gap-2 shadow">
          <i className="ph ph-arrows-out-cardinal text-xs"></i>
          <span>
            Przeciągnij mapę myszką / rolką • {view.lat.toFixed(5)}, {view.lng.toFixed(5)} (Zoom {z.toFixed(2)})
          </span>
        </div>
      )}
    </div>
  );
}
