/**
 * ifcCoordinatesHelper.js — Obsługa współrzędnych BIM / IFC (ISO 16739: IfcCartesianPoint,
 * IfcMapConversion, IfcBuildingStorey) oraz państwowego układu geodezyjnego PUWG 2000
 * (EPSG:2176–2179, w tym strefa 6 EPSG:2177 — Trójmiasto / Gdynia).
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// Parametry elipsoidy GRS80 / WGS84 dla układu PUWG 2000
const GRS80_A = 6378137.0;
const GRS80_F = 1 / 298.257222101;
const GRS80_E2 = 2 * GRS80_F - GRS80_F * GRS80_F;
const PUWG2000_M0 = 0.999923;

/**
 * Sprawdza, czy obiekt (urządzenie lub rejon) posiada zdefiniowane współrzędne IFC (X, Y).
 */
export function hasIfcCoordinates(entity) {
  if (!entity || typeof entity !== 'object') return false;
  const x = entity.ifcX;
  const y = entity.ifcY;
  if (x === '' || x === null || x === undefined || y === '' || y === null || y === undefined) {
    return false;
  }
  return Number.isFinite(Number(x)) && Number.isFinite(Number(y));
}

/**
 * Normalizuje wartość współrzędnej IFC do metrów (obsługa modeli w milimetrach lub metrach).
 */
export function normalizeIfcUnit(value, unit = 'm') {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const cleanUnit = String(unit || 'm').trim().toLowerCase();
  if (cleanUnit === 'mm' || cleanUnit === 'millimetre' || cleanUnit === 'millimeter') {
    return num / 1000;
  }
  if (cleanUnit === 'cm' || cleanUnit === 'centimetre' || cleanUnit === 'centimeter') {
    return num / 100;
  }
  return num;
}

/**
 * Realizuje transformację IFC4 IfcMapConversion z lokalnego układu modelu BIM (X, Y, Z)
 * do globalnego układu odniesienia (Eastings, Northings, OrthogonalHeight).
 *
 * Wzór zgodny ze specyfikacją buildingSMART IFC4 IfcMapConversion:
 *   cos(theta) = XAxisAbscissa / hypot(XAxisAbscissa, XAxisOrdinate)
 *   sin(theta) = XAxisOrdinate / hypot(XAxisAbscissa, XAxisOrdinate)
 *   E = Eastings + Scale * (X * cos(theta) - Y * sin(theta))
 *   N = Northings + Scale * (X * sin(theta) + Y * cos(theta))
 *   H = OrthogonalHeight + Scale * Z
 */
export function applyIfcMapConversion(localX, localY, localZ = 0, mapConversion = {}) {
  const x = Number(localX) || 0;
  const y = Number(localY) || 0;
  const z = Number(localZ) || 0;

  const eastings = Number(mapConversion?.eastings) || 0;
  const northings = Number(mapConversion?.northings) || 0;
  const orthogonalHeight = Number(mapConversion?.orthogonalHeight) || 0;
  const scale =
    mapConversion?.scale !== undefined &&
    mapConversion?.scale !== null &&
    Number(mapConversion.scale) > 0
      ? Number(mapConversion.scale)
      : 1.0;

  let cosTheta = 1.0;
  let sinTheta = 0.0;

  if (
    mapConversion?.xAxisAbscissa !== undefined &&
    mapConversion?.xAxisOrdinate !== undefined &&
    mapConversion.xAxisAbscissa !== '' &&
    mapConversion.xAxisOrdinate !== ''
  ) {
    const ax = Number(mapConversion.xAxisAbscissa);
    const ay = Number(mapConversion.xAxisOrdinate);
    const norm = Math.hypot(ax, ay);
    if (norm > 1e-12) {
      cosTheta = ax / norm;
      sinTheta = ay / norm;
    }
  } else if (
    mapConversion?.rotationDeg !== undefined &&
    mapConversion?.rotationDeg !== null &&
    mapConversion?.rotationDeg !== ''
  ) {
    const rad = Number(mapConversion.rotationDeg) * DEG_TO_RAD;
    cosTheta = Math.cos(rad);
    sinTheta = Math.sin(rad);
  }

  const easting = eastings + scale * (x * cosTheta - y * sinTheta);
  const northing = northings + scale * (x * sinTheta + y * cosTheta);
  const elevation = orthogonalHeight + scale * z;

  return {
    easting: Number(easting.toFixed(4)),
    northing: Number(northing.toFixed(4)),
    elevation: Number(elevation.toFixed(4)),
  };
}

/**
 * Sprawdza, czy para współrzędnych wygląda jak państwowy układ geodezyjny PUWG 2000 (w metrach).
 * W Polsce:
 *   Northing (X geodezyjne): ok. 5 400 000 – 6 150 000 m
 *   Easting (Y geodezyjne):  strefa 5 (5 400 000 – 5 600 000), strefa 6 (6 400 000 – 6 600 000),
 *                            strefa 7 (7 400 000 – 7 600 000), strefa 8 (8 400 000 – 8 600 000)
 */
export function isPuwg2000CoordinatePair(coordA, coordB) {
  const a = Number(coordA);
  const b = Number(coordB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

  const isNorthing = v => v >= 5300000 && v <= 6200000;
  const isEasting = v =>
    (v >= 5350000 && v <= 5650000) ||
    (v >= 6350000 && v <= 6650000) ||
    (v >= 7350000 && v <= 7650000) ||
    (v >= 8350000 && v <= 8650000);

  return (isNorthing(a) && isEasting(b)) || (isEasting(a) && isNorthing(b));
}

/**
 * Konwertuje współrzędne geodezyjne PUWG 2000 (EPSG:2176–2179) na WGS84 (lat, lng).
 * Obsługuje zarówno kolejność geodezyjną (X=Northing, Y=Easting), jak i matematyczną/CAD (X=Easting, Y=Northing).
 * Domyślna strefa: 6 (południk 18°E — EPSG:2177, obejmująca Gdynię / Gdańsk / Pomorze).
 */
export function puwg2000ToWgs84(coordA, coordB, explicitZone = null) {
  const a = Number(coordA);
  const b = Number(coordB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  let northing = a;
  let easting = b;

  // Automatyczne rozpoznanie, która liczba zawiera prefiks strefy (np. 6 535 000 dla Gdyni vs 6 045 000 Northing)
  const prefixA = Math.floor(a / 1000000);
  const prefixB = Math.floor(b / 1000000);
  const remA = a - prefixA * 1000000;
  const remB = b - prefixB * 1000000;

  if (
    [5, 6, 7, 8].includes(prefixA) &&
    remA >= 350000 &&
    remA <= 650000 &&
    a >= 6350000
  ) {
    easting = a;
    northing = b;
  } else if (
    [5, 6, 7, 8].includes(prefixB) &&
    remB >= 350000 &&
    remB <= 650000 &&
    b >= 6350000
  ) {
    northing = a;
    easting = b;
  } else if (prefixA in { 5: 1, 7: 1, 8: 1 } && remA >= 350000 && remA <= 650000 && prefixB === 5) {
    easting = a;
    northing = b;
  }

  let zone = explicitZone ? Number(explicitZone) : Math.floor(easting / 1000000);
  if (![5, 6, 7, 8].includes(zone)) {
    zone = 6; // Domyślnie strefa 6 (18°E - Gdynia / Trójmiasto)
  }

  const lon0 = zone * 3 * DEG_TO_RAD;
  const falseEasting = zone * 1000000 + 500000;

  const x = northing / PUWG2000_M0;
  const y = (easting - falseEasting) / PUWG2000_M0;

  const e2 = GRS80_E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const ep2 = e2 / (1 - e2);

  const A0 = 1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256;
  const mu = x / (GRS80_A * A0);

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const e12 = e1 * e1;
  const e13 = e12 * e1;
  const e14 = e12 * e12;

  const J1 = (3 * e1) / 2 - (27 * e13) / 32;
  const J2 = (21 * e12) / 16 - (55 * e14) / 32;
  const J3 = (151 * e13) / 96;
  const J4 = (1097 * e14) / 512;

  const fp =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const C1 = ep2 * cosFp * cosFp;
  const T1 = tanFp * tanFp;
  const R1 = (GRS80_A * (1 - e2)) / Math.pow(1 - e2 * sinFp * sinFp, 1.5);
  const N1 = GRS80_A / Math.sqrt(1 - e2 * sinFp * sinFp);
  const D = y / N1;

  const D2 = D * D;
  const D3 = D2 * D;
  const D4 = D2 * D2;
  const D5 = D4 * D;
  const D6 = D3 * D3;

  const latRad =
    fp -
    ((N1 * tanFp) / R1) *
      (D2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D6) / 720);

  const lngRad =
    lon0 +
    (D -
      ((1 + 2 * T1 + C1) * D3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D5) / 120) /
      cosFp;

  const lat = Number((latRad * RAD_TO_DEG).toFixed(6));
  const lng = Number((lngRad * RAD_TO_DEG).toFixed(6));

  if (lat < 48 || lat > 56 || lng < 13 || lng > 25) {
    return null;
  }

  return { lat, lng, zone };
}

/**
 * Konwertuje współrzędne GPS WGS84 (lat, lng) na układ geodezyjny PUWG 2000 (northing, easting).
 */
export function wgs84ToPuwg2000(lat, lng, explicitZone = null) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  let zone = explicitZone ? Number(explicitZone) : Math.round(lngNum / 3);
  if (![5, 6, 7, 8].includes(zone)) {
    zone = 6;
  }

  const lon0 = zone * 3 * DEG_TO_RAD;
  const falseEasting = zone * 1000000 + 500000;

  const phi = latNum * DEG_TO_RAD;
  const lam = lngNum * DEG_TO_RAD;

  const e2 = GRS80_E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const ep2 = e2 / (1 - e2);

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = GRS80_A / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = ep2 * cosPhi * cosPhi;
  const A = (lam - lon0) * cosPhi;

  const M =
    GRS80_A *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi));

  const A2 = A * A;
  const A3 = A2 * A;
  const A4 = A2 * A2;
  const A5 = A4 * A;
  const A6 = A3 * A3;

  const northing =
    PUWG2000_M0 *
    (M +
      N *
        tanPhi *
        (A2 / 2 +
          ((5 - T + 9 * C + 4 * C * C) * A4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A6) / 720));

  const easting =
    falseEasting +
    PUWG2000_M0 *
      N *
      (A +
        ((1 - T + C) * A3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A5) / 120);

  return {
    northing: Number(northing.toFixed(3)),
    easting: Number(easting.toFixed(3)),
    zone,
  };
}

/**
 * Przelicza współrzędne IFC (ifcX, ifcY) na pozycję procentową (xPercent, yPercent w zakresie 0–100)
 * na rzucie 2D / izometrycznym hali lub stoczni.
 *
 * Obsługiwane tryby kalibracji (w obiekcie `calibration`):
 * 1) 3 punkty kontrolne (`anchors: [p1, p2, p3]`) — pełna transformacja afiniczna 2D (skala, obrót, pochylenie izometrii).
 * 2) 2 punkty kontrolne (`anchors: [p1, p2]`) — interpolacja liniowa między narożnikami lub transformacja podobieństwa (gdy `uniformScale: true`).
 * 3) Zakres współrzędnych (`minX`, `maxX`, `minY`, `maxY`, opcjonalnie `rotationDeg` i `invertY`).
 */
export function ifcToMapPercent(ifcX, ifcY, calibration = null) {
  if (!calibration || typeof calibration !== 'object') return null;
  const rawX = Number(ifcX);
  const rawY = Number(ifcY);
  if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

  const unit = calibration.unit || 'm';
  const x = normalizeIfcUnit(rawX, unit);
  const y = normalizeIfcUnit(rawY, unit);

  let xPercent = null;
  let yPercent = null;

  const anchors = Array.isArray(calibration.anchors)
    ? calibration.anchors.filter(
        a =>
          a &&
          Number.isFinite(Number(a.ifcX)) &&
          Number.isFinite(Number(a.ifcY)) &&
          Number.isFinite(Number(a.xPercent)) &&
          Number.isFinite(Number(a.yPercent))
      )
    : [];

  // Tryb 1: 3 punkty referencyjne (Pełna macierz afiniczna 2D — idealna również dla rzutów pod kątem i izometrii)
  if (anchors.length >= 3) {
    const [p1, p2, p3] = anchors;
    const x1 = Number(p1.ifcX);
    const y1 = Number(p1.ifcY);
    const x2 = Number(p2.ifcX);
    const y2 = Number(p2.ifcY);
    const x3 = Number(p3.ifcX);
    const y3 = Number(p3.ifcY);

    const det = x1 * (y2 - y3) - y1 * (x2 - x3) + (x2 * y3 - x3 * y2);
    if (Math.abs(det) > 1e-9) {
      const u1 = Number(p1.xPercent);
      const v1 = Number(p1.yPercent);
      const u2 = Number(p2.xPercent);
      const v2 = Number(p2.yPercent);
      const u3 = Number(p3.xPercent);
      const v3 = Number(p3.yPercent);

      const a = (u1 * (y2 - y3) - y1 * (u2 - u3) + (u2 * y3 - u3 * y2)) / det;
      const b = (x1 * (u2 - u3) - u1 * (x2 - x3) + (x2 * u3 - x3 * u2)) / det;
      const c = (x1 * (y2 * u3 - y3 * u2) - y1 * (x2 * u3 - x3 * u2) + u1 * (x2 * y3 - x3 * y2)) / det;

      const d = (v1 * (y2 - y3) - y1 * (v2 - v3) + (v2 * y3 - v3 * y2)) / det;
      const e = (x1 * (v2 - v3) - v1 * (x2 - x3) + (x2 * v3 - x3 * v2)) / det;
      const f = (x1 * (y2 * v3 - y3 * v2) - y1 * (x2 * v3 - x3 * v2) + v1 * (x2 * y3 - x3 * y2)) / det;

      xPercent = a * x + b * y + c;
      yPercent = d * x + e * y + f;
    }
  }

  // Tryb 2: 2 punkty referencyjne (Narożnik 1 i Narożnik 2 na rzucie)
  if ((xPercent === null || yPercent === null) && anchors.length === 2) {
    const [p1, p2] = anchors;
    const x1 = Number(p1.ifcX);
    const y1 = Number(p1.ifcY);
    const x2 = Number(p2.ifcX);
    const y2 = Number(p2.ifcY);
    const u1 = Number(p1.xPercent);
    const v1 = Number(p1.yPercent);
    const u2 = Number(p2.xPercent);
    const v2 = Number(p2.yPercent);

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (calibration.uniformScale) {
      const distIfcSq = dx * dx + dy * dy;
      if (distIfcSq > 1e-9) {
        const du = u2 - u1;
        const dv = v2 - v1;
        const invertY = calibration.invertY !== false ? -1 : 1;
        const rx = x - x1;
        const ry = (y - y1) * invertY;
        const rdx = dx;
        const rdy = dy * invertY;
        const a = (rdx * du + rdy * dv) / distIfcSq;
        const b = (rdx * dv - rdy * du) / distIfcSq;
        xPercent = u1 + a * rx - b * ry;
        yPercent = v1 + b * rx + a * ry;
      }
    } else if (Math.abs(dx) > 1e-9 && Math.abs(dy) > 1e-9) {
      xPercent = u1 + ((x - x1) / dx) * (u2 - u1);
      yPercent = v1 + ((y - y1) / dy) * (v2 - v1);
    }
  }

  // Tryb 3: Zakres współrzędnych Bounding Box (minX, maxX, minY, maxY + opcjonalny obrót rotationDeg)
  if (
    (xPercent === null || yPercent === null) &&
    calibration.minX !== undefined &&
    calibration.maxX !== undefined &&
    calibration.minY !== undefined &&
    calibration.maxY !== undefined
  ) {
    const minX = Number(calibration.minX);
    const maxX = Number(calibration.maxX);
    const minY = Number(calibration.minY);
    const maxY = Number(calibration.maxY);
    const spanX = maxX - minX;
    const spanY = maxY - minY;

    if (Math.abs(spanX) > 1e-9 && Math.abs(spanY) > 1e-9) {
      let rotX = x;
      let rotY = y;
      if (calibration.rotationDeg && Number(calibration.rotationDeg) !== 0) {
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rad = -Number(calibration.rotationDeg) * DEG_TO_RAD;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const dx = x - cx;
        const dy = y - cy;
        rotX = cx + dx * cosA - dy * sinA;
        rotY = cy + dx * sinA + dy * cosA;
      }

      const normX = (rotX - minX) / spanX;
      const normY = (rotY - minY) / spanY;
      // W BIM/CAD oś Y rośnie w górę (Północ), a na obrazie 2D oś Y rośnie w dół (0% u góry, 100% na dole)
      const invertY = calibration.invertY !== false;
      xPercent = normX * 100;
      yPercent = (invertY ? 1 - normY : normY) * 100;
    }
  }

  if (!Number.isFinite(xPercent) || !Number.isFinite(yPercent)) {
    return null;
  }

  if (calibration.clamp !== false) {
    xPercent = Math.max(1, Math.min(99, xPercent));
    yPercent = Math.max(1, Math.min(99, yPercent));
  }

  return {
    xPercent: Number(xPercent.toFixed(2)),
    yPercent: Number(yPercent.toFixed(2)),
  };
}

/**
 * Automatycznie dobiera zakładkę podmapy (poziom / kondygnację) na podstawie
 * atrybutu `ifcStorey` (IfcBuildingStorey) lub rzędnej wysokości `ifcZ`.
 */
export function resolveSubmapByIfcElevation(entity, submaps = []) {
  if (!entity || !Array.isArray(submaps) || submaps.length === 0) return null;

  const rawStorey = String(entity.ifcStorey || '').trim().toLowerCase();
  if (rawStorey) {
    const byStoreyField = submaps.find(
      s => s.ifcStorey && String(s.ifcStorey).trim().toLowerCase() === rawStorey
    );
    if (byStoreyField) return byStoreyField.id;

    const bySubmapName = submaps.find(
      s => s.name && String(s.name).trim().toLowerCase() === rawStorey
    );
    if (bySubmapName) return bySubmapName.id;
  }

  if (entity.ifcZ !== undefined && entity.ifcZ !== null && entity.ifcZ !== '') {
    const z = Number(entity.ifcZ);
    if (Number.isFinite(z)) {
      const byZRange = submaps.find(s => {
        const hasMin = s.ifcMinZ !== undefined && s.ifcMinZ !== null && s.ifcMinZ !== '';
        const hasMax = s.ifcMaxZ !== undefined && s.ifcMaxZ !== null && s.ifcMaxZ !== '';
        if (!hasMin && !hasMax) return false;
        const minZ = hasMin ? Number(s.ifcMinZ) : -Infinity;
        const maxZ = hasMax ? Number(s.ifcMaxZ) : Infinity;
        return z >= minZ && z <= maxZ;
      });
      if (byZRange) return byZRange.id;
    }
  }

  return null;
}

/**
 * Wyznacza docelową pozycję urządzenia/rejonu na mapie VexoNT:
 * 1) Pierwszeństwo mają ręcznie ustawione pinezki (`xPercent/yPercent` lub `lat/lng`).
 * 2) Jeśli brak ręcznej pinezki, a obiekt posiada współrzędne BIM (`ifcX`, `ifcY`),
 *    automatycznie przelicza je na `(xPercent, yPercent)` (wg kalibracji podmapy/rejonu)
 *    oraz na `(lat, lng)` (jeśli współrzędne są w układzie PUWG 2000 lub zdefiniowano `IfcMapConversion`).
 */
export function resolveMachineMapPosition(entity, region = null, activeSubmapTab = null) {
  if (!entity) return null;

  const hasManualPercent =
    entity.xPercent !== undefined &&
    entity.xPercent !== null &&
    entity.xPercent !== '' &&
    entity.yPercent !== undefined &&
    entity.yPercent !== null &&
    entity.yPercent !== '';

  const hasManualGps =
    entity.lat !== undefined &&
    entity.lat !== null &&
    entity.lat !== '' &&
    entity.lng !== undefined &&
    entity.lng !== null &&
    entity.lng !== '';

  let xPercent = hasManualPercent ? Number(entity.xPercent) : null;
  let yPercent = hasManualPercent ? Number(entity.yPercent) : null;
  let lat = hasManualGps ? Number(entity.lat) : null;
  let lng = hasManualGps ? Number(entity.lng) : null;
  let isIfcPositioned = false;

  if (hasIfcCoordinates(entity)) {
    const rawX = Number(entity.ifcX);
    const rawY = Number(entity.ifcY);
    const rawZ = Number(entity.ifcZ) || 0;

    const calibration =
      activeSubmapTab?.ifcCalibration || region?.ifcCalibration || entity.ifcCalibration || null;

    if (xPercent === null || yPercent === null) {
      if (calibration) {
        const mapped = ifcToMapPercent(rawX, rawY, calibration);
        if (mapped) {
          xPercent = mapped.xPercent;
          yPercent = mapped.yPercent;
          isIfcPositioned = true;
        }
      }
    }

    if (lat === null || lng === null) {
      let checkX = rawX;
      let checkY = rawY;
      if (calibration?.mapConversion) {
        const conv = applyIfcMapConversion(rawX, rawY, rawZ, calibration.mapConversion);
        checkX = conv.northing;
        checkY = conv.easting;
      }
      if (isPuwg2000CoordinatePair(checkX, checkY)) {
        const wgs = puwg2000ToWgs84(checkX, checkY, calibration?.zone);
        if (wgs) {
          lat = wgs.lat;
          lng = wgs.lng;
          isIfcPositioned = true;
        }
      }
    }
  }

  if (xPercent === null && yPercent === null && lat === null && lng === null) {
    return null;
  }

  return {
    xPercent,
    yPercent,
    lat,
    lng,
    isIfcPositioned,
  };
}
