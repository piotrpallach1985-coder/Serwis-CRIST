/**
 * fieldServiceHelpers.js
 * Logika domenowa dla rozszerzeń:
 * 1. Serwis mobilny HVAC / Pompy ciepła (Rozporządzenie F-gazowe UE 2024/573, GWP, ekwiwalent CO2, CRO)
 * 2. Zarządzanie osiedlami i nieruchomościami (Facility Management, c-KOB art. 62 Prawa budowlanego)
 * 3. Geolokalizacja GPS, nawigacja Google Maps i potwierdzenie obecności (Check-in GPS)
 * 4. Izolacja danych B2C (RODO) dla mobilnych serwisantów (widok wyłącznie przypisanych zleceń i urządzeń)
 * 5. Ochrona anty-spamowa publicznych kodów QR (np. klatki schodowe na osiedlach)
 */

export const REFRIGERANT_TYPES = {
  R32: { code: 'R32', name: 'R32 (Difluorometan)', gwp: 675, isFluorinated: true },
  R410A: { code: 'R410A', name: 'R410A', gwp: 2088, isFluorinated: true },
  R290: { code: 'R290', name: 'R290 (Propan - naturalny)', gwp: 3, isFluorinated: false },
  R134a: { code: 'R134a', name: 'R134a', gwp: 1430, isFluorinated: true },
  R407C: { code: 'R407C', name: 'R407C', gwp: 1774, isFluorinated: true },
  R404A: { code: 'R404A', name: 'R404A', gwp: 3922, isFluorinated: true },
  R454B: { code: 'R454B', name: 'R454B (Opteon XL41)', gwp: 466, isFluorinated: true },
  R454C: { code: 'R454C', name: 'R454C (Opteon XL20)', gwp: 148, isFluorinated: true },
  R1234yf: { code: 'R1234yf', name: 'R1234yf (HFO)', gwp: 4, isFluorinated: false },
  R1234ze: { code: 'R1234ze', name: 'R1234ze (HFO)', gwp: 7, isFluorinated: false },
  R744: { code: 'R744', name: 'R744 (CO2 - naturalny)', gwp: 1, isFluorinated: false },
};

export const CKOB_CATEGORIES = [
  { id: '', label: 'Brak (Standardowe urządzenie / maszyna)' },
  { id: 'elektryczna_1r', label: 'Instalacja elektryczna i odgromowa (c-KOB art. 62)' },
  { id: 'gazowa_1r', label: 'Instalacja gazowa — przegląd roczny (c-KOB art. 62)' },
  { id: 'kominiarska_1r', label: 'Przewody kominowe: dymowe, spalinowe, wentylacyjne (c-KOB)' },
  { id: 'ppoz', label: 'Instalacja ppoż., SSP, oddymianie i hydranty' },
  { id: 'hvac_kotlownia', label: 'Węzeł cieplny / Kotłownia / Pompa ciepła / Klimatyzacja (HVAC)' },
  { id: 'dzwig_udt', label: 'Dźwig osobowy / Winda / Urządzenie UDT' },
  { id: 'brama_garazowa', label: 'Brama garażowa, wjazdowa lub szlaban' },
  { id: 'budowlany_1r', label: 'Przegląd ogólnobudowlany roczny (art. 62 ust. 1 pkt 1)' },
  { id: 'budowlany_5l', label: 'Przegląd ogólnobudowlany 5-letni (art. 62 ust. 1 pkt 2)' },
];

export const INDUSTRY_PROFILES = {
  industrial: {
    id: 'industrial',
    name: 'Przemysł / Produkcja / Stocznia',
    shortName: 'Przemysł / UR',
    description: 'Zakłady produkcyjne, stocznie i hale: maszyny, liczniki RBG, przestoje i magazyn części UR.',
    icon: 'ph-factory',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    bannerClass: 'bg-slate-900 text-white border-slate-800',
    machineLabel: 'Maszyna / Urządzenie',
    regionLabel: 'Rejon / Hala',
    bayLabel: 'Przelot / Stanowisko',
    ticketCardTitle: 'Karta Zgłoszenia Awarii Maszyny (UR)',
    ticketPdfTitle: 'Karta Zgłoszenia Awarii (UR)',
    serviceCardTitle: 'Karta Serwisu Planowanego (Prewencja UR)',
    servicePdfTitle: 'Karta Serwisu Planowanego (UR)',
    clientSignatureLabel: 'Podpis Odbierającego (Mistrz zmiany / Operator UR)',
    techSignatureLabel: 'Podpis Wykonawcy / Mechanika UR',
    showFGasByDefault: false,
    showCkobSection: false,
    showIndustrialRbgSection: true,
    showHvacCustomerSection: false,
  },
  facility: {
    id: 'facility',
    name: 'Zarządzanie Nieruchomościami / Osiedla (c-KOB)',
    shortName: 'Facility / Osiedla (c-KOB)',
    description: 'Wspólnoty mieszkaniowe, biurowce i osiedla: budynki, klatki/lokale, przeglądy budowlane c-KOB (art. 62), domofony.',
    icon: 'ph-buildings',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    bannerClass: 'bg-amber-900 text-white border-amber-800',
    machineLabel: 'Urządzenie / Instalacja Budynku',
    regionLabel: 'Budynek / Obiekt',
    bayLabel: 'Klatka / Piętro / Lokal',
    ticketCardTitle: 'Karta Zgłoszenia Usterki Obiektu (Facility / c-KOB)',
    ticketPdfTitle: 'Karta Usterki Obiektu (Facility / c-KOB)',
    serviceCardTitle: 'Protokół Przeglądu Okresowego Obiektu (c-KOB art. 62)',
    servicePdfTitle: 'Protokół Przeglądu Technicznego Obiektu (c-KOB)',
    clientSignatureLabel: 'Podpis Zarządcy Nieruchomości / Odbierającego',
    techSignatureLabel: 'Podpis Inspektora / Konserwatora Obiektu',
    showFGasByDefault: false,
    showCkobSection: true,
    showIndustrialRbgSection: false,
    showHvacCustomerSection: false,
  },
  hvac: {
    id: 'hvac',
    name: 'Serwis Mobilny HVAC / Pompy Ciepła (Field Service)',
    shortName: 'Serwis HVAC (F-Gazy / CRO)',
    description: 'Instalatorzy i serwis mobilny: pompy ciepła, klimatyzatory, kotłownie, protokoły F-Gaz (CRO), nawigacja GPS do klienta.',
    icon: 'ph-snowflake',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    bannerClass: 'bg-cyan-900 text-white border-cyan-800',
    machineLabel: 'Urządzenie HVAC / Kocioł',
    regionLabel: 'Lokalizacja / Klient',
    bayLabel: 'Pomieszczenie / Adres',
    ticketCardTitle: 'Karta Naprawy Serwisowej HVAC / F-Gaz',
    ticketPdfTitle: 'Protokół Naprawy Serwisowej HVAC / F-Gaz',
    serviceCardTitle: 'Protokół Przeglądu i Szczelności HVAC / F-Gaz (CRO)',
    servicePdfTitle: 'Protokół Serwisowy HVAC / F-Gaz (CRO)',
    clientSignatureLabel: 'Podpis Klienta / Inwestora (Potwierdzenie gwarancji)',
    techSignatureLabel: 'Podpis Uprawnionego Serwisanta F-Gaz',
    showFGasByDefault: true,
    showCkobSection: false,
    showIndustrialRbgSection: false,
    showHvacCustomerSection: true,
  },
};

/**
 * Zwraca konfigurację profilu branżowego firmy (domyślnie 'industrial').
 * @param {string} profileId 'industrial' | 'facility' | 'hvac'
 */
export function getIndustryProfileConfig(profileId) {
  if (profileId && INDUSTRY_PROFILES[profileId]) {
    return INDUSTRY_PROFILES[profileId];
  }
  return INDUSTRY_PROFILES.industrial;
}

/**
 * Oblicza ekwiwalent CO2 (t CO2e) oraz wymogi CRO / prób szczelności wg Rozporządzenia UE 2024/573.
 * @param {string} refrigerantType Kod czynnika (np. 'R32', 'R410A')
 * @param {number|string} chargeKg Ilość czynnika w kg
 */
export function calculateCo2Equivalent(refrigerantType, chargeKg) {
  const cleanType = (refrigerantType || '').trim();
  const refInfo = REFRIGERANT_TYPES[cleanType] || null;
  const numericCharge = Number(chargeKg);

  if (!refInfo || !Number.isFinite(numericCharge) || numericCharge <= 0) {
    return {
      refrigerantType: cleanType || null,
      gwp: refInfo?.gwp ?? 0,
      chargeKg: Number.isFinite(numericCharge) && numericCharge > 0 ? numericCharge : 0,
      co2EquivalentTons: 0,
      requiresCroCard: false,
      recommendedLeakCheckMonths: null,
    };
  }

  const co2EquivalentTons = Number(((numericCharge * refInfo.gwp) / 1000).toFixed(3));
  const requiresCroCard = Boolean(refInfo.isFluorinated && co2EquivalentTons >= 5);

  let recommendedLeakCheckMonths = null;
  if (requiresCroCard) {
    if (co2EquivalentTons >= 500) {
      recommendedLeakCheckMonths = 3;
    } else if (co2EquivalentTons >= 50) {
      recommendedLeakCheckMonths = 6;
    } else {
      recommendedLeakCheckMonths = 12;
    }
  }

  return {
    refrigerantType: cleanType,
    gwp: refInfo.gwp,
    chargeKg: numericCharge,
    co2EquivalentTons,
    requiresCroCard,
    recommendedLeakCheckMonths,
  };
}

/**
 * Zwraca czytelną nazwę kategorii przeglądu budowlanego c-KOB.
 */
export function getCkobCategoryLabel(categoryId) {
  if (!categoryId) return '';
  const found = CKOB_CATEGORIES.find(c => c.id === categoryId);
  return found ? found.label : categoryId;
}

export const LEAK_TEST_RESULTS = [
  { id: 'not_applicable', label: 'Nie wykonywano próby szczelności' },
  { id: 'positive', label: 'Pozytywny — układ szczelny (brak wycieku)' },
  { id: 'negative', label: 'Negatywny — wykryto nieszczelność!' },
];

/**
 * Buduje znormalizowany obiekt wpisu protokołu F-Gaz (próba szczelności, odzysk, uzupełnienie czynnika).
 */
export function buildFGasServiceEntry({
  refrigerantType = '',
  refrigerantChargeKg = null,
  addedKg = 0,
  recoveredKg = 0,
  leakTestResult = 'not_applicable',
} = {}) {
  const numAdded = Number(addedKg) > 0 ? Number(addedKg) : 0;
  const numRecovered = Number(recoveredKg) > 0 ? Number(recoveredKg) : 0;
  const validLeak =
    leakTestResult === 'positive' || leakTestResult === 'negative' ? leakTestResult : null;

  if (!validLeak && numAdded <= 0 && numRecovered <= 0 && !refrigerantType) {
    return null;
  }

  return {
    refrigerantType: refrigerantType || '',
    refrigerantChargeKg: refrigerantChargeKg || null,
    leakTestResult: validLeak,
    refrigerantAddedKg: numAdded,
    refrigerantRecoveredKg: numRecovered,
  };
}

/**
 * Formatuje podsumowanie protokołu F-Gaz do notatki historycznej oraz raportu PDF.
 */
export function formatFGasSummary(fGasData = {}) {
  if (!fGasData || typeof fGasData !== 'object') return '';
  const {
    refrigerantType,
    refrigerantChargeKg,
    leakTestResult,
    refrigerantAddedKg,
    refrigerantRecoveredKg,
  } = fGasData;

  const added = Number(refrigerantAddedKg) || 0;
  const recovered = Number(refrigerantRecoveredKg) || 0;
  const hasLeakTest = leakTestResult === 'positive' || leakTestResult === 'negative';

  if (!hasLeakTest && added <= 0 && recovered <= 0 && !refrigerantType) {
    return '';
  }

  const parts = [];
  if (refrigerantType) {
    const calc = calculateCo2Equivalent(refrigerantType, refrigerantChargeKg);
    parts.push(
      `Czynnik: ${refrigerantType}${
        calc.chargeKg > 0 ? ` (${calc.chargeKg} kg / ${calc.co2EquivalentTons} t CO2e)` : ''
      }`
    );
  }
  if (hasLeakTest) {
    parts.push(
      `Próba szczelności: ${
        leakTestResult === 'positive' ? 'POZYTYWNA (Szczelny)' : 'NEGATYWNA (Stwierdzono wyciek)'
      }`
    );
  }
  if (added > 0) {
    parts.push(`Uzupełniono czynnik: +${added} kg`);
  }
  if (recovered > 0) {
    parts.push(`Odzyskano czynnik: -${recovered} kg`);
  }

  return parts.join(' | ');
}

/**
 * Wyznacza dane geolokalizacyjne i adresowe maszyny (z maszyny lub z przypisanego rejonu/podmapy).
 */
export function resolveMachineGeoLocation(machine, regions = []) {
  if (!machine) {
    return {
      lat: null,
      lng: null,
      address: '',
      hasCoordinates: false,
      hasAddress: false,
      canNavigate: false,
    };
  }

  const region = (regions || []).find(
    r => r.id === machine.regionId || (machine.regionName && r.name === machine.regionName)
  );

  const rawLat = machine.gpsLat ?? machine.mapLat ?? region?.mapLat ?? region?.gpsLat ?? null;
  const rawLng = machine.gpsLng ?? machine.mapLng ?? region?.mapLng ?? region?.gpsLng ?? null;

  const lat = rawLat !== null && rawLat !== '' && Number.isFinite(Number(rawLat)) ? Number(rawLat) : null;
  const lng = rawLng !== null && rawLng !== '' && Number.isFinite(Number(rawLng)) ? Number(rawLng) : null;

  const address = (
    machine.address ||
    machine.mapAddress ||
    region?.address ||
    region?.mapAddress ||
    ''
  ).trim();

  const hasCoordinates = lat !== null && lng !== null;
  const hasAddress = address.length > 0;

  return {
    lat,
    lng,
    address,
    hasCoordinates,
    hasAddress,
    canNavigate: hasCoordinates || hasAddress,
  };
}

/**
 * Buduje link do nawigacji Google Maps dla maszyny lub obiektu geo.
 */
export function buildGoogleMapsNavigationUrl(machineOrGeo, regions = []) {
  if (!machineOrGeo) return '';
  const geo =
    'canNavigate' in machineOrGeo
      ? machineOrGeo
      : resolveMachineGeoLocation(machineOrGeo, regions);

  if (!geo.canNavigate) return '';

  if (geo.hasCoordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${geo.lat},${geo.lng}`
    )}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(geo.address)}`;
}

/**
 * Formatuje obiekt potwierdzenia obecności GPS (Check-in) do czytelnego tekstu.
 */
export function formatGpsCheckIn(gpsObj) {
  if (!gpsObj || typeof gpsObj !== 'object') return '';
  const lat = Number(gpsObj.lat);
  const lng = Number(gpsObj.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';

  const coordsStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const accStr =
    Number.isFinite(Number(gpsObj.accuracy)) && Number(gpsObj.accuracy) > 0
      ? ` (±${Math.round(Number(gpsObj.accuracy))} m)`
      : '';
  return `${coordsStr}${accStr}`;
}

/**
 * Pobiera bieżącą pozycję GPS z przeglądarki / urządzenia mobilnego (Check-in serwisanta).
 */
export function captureCurrentGpsPosition(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolokalizacja GPS nie jest wspierana przez tę przeglądarkę.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0),
          timestamp: new Date().toISOString(),
        });
      },
      err => {
        reject(new Error(err?.message || 'Nie udało się pobrać lokalizacji GPS.'));
      },
      options
    );
  });
}

/**
 * Sprawdza, czy dane zlecenie (awaria lub serwis planowany) jest przypisane do danego użytkownika.
 */
export function isTaskAssignedToUser(task, user) {
  if (!task || !user) return false;

  const userIdentifiers = [
    user.uid,
    user.id,
    user.name,
    user.email,
    user.serviceName,
    user.companyName,
  ]
    .filter(Boolean)
    .map(v => String(v).trim().toLowerCase());

  if (userIdentifiers.length === 0) return false;

  const taskAssignees = [
    task.assignedTo,
    task.assignedService,
    task.executor,
    task.assignedUserId,
    task.completedBy,
    task.completionDetails?.completedBy,
    task.reportedBy,
    task.requiredPersonnel,
  ]
    .filter(v => v && String(v).trim() !== '' && String(v).trim() !== '-')
    .map(v => String(v).trim().toLowerCase());

  return taskAssignees.some(assignee =>
    userIdentifiers.some(
      uid =>
        assignee === uid ||
        (assignee.length >= 3 && uid.length >= 3 && (assignee.includes(uid) || uid.includes(assignee)))
    )
  );
}

/**
 * Filtruje listę zgłoszeń/serwisów dla mobilnego serwisanta z włączonym ograniczeniem RODO B2C (`onlyAssignedTasks`).
 */
export function filterTasksForFieldTechnician(tasks = [], user = null, onlyAssignedTasks = false) {
  if (!Array.isArray(tasks)) return [];
  if (!onlyAssignedTasks || !user) return tasks;
  if (user.role === 'admin' || user.role === 'superadmin') return tasks;

  return tasks.filter(task => isTaskAssignedToUser(task, user));
}

/**
 * Filtruje listę maszyn/urządzeń dla mobilnego serwisanta z włączonym ograniczeniem RODO B2C (`onlyAssignedTasks`),
 * tak aby widział wyłącznie urządzenia powiązane z jego zleceniami (bez dostępu do pełnej bazy adresowej wszystkich klientów).
 */
export function filterMachinesForFieldTechnician(
  machines = [],
  tickets = [],
  plannedServices = [],
  user = null,
  onlyAssignedTasks = false
) {
  if (!Array.isArray(machines)) return [];
  if (!onlyAssignedTasks || !user) return machines;
  if (user.role === 'admin' || user.role === 'superadmin') return machines;

  const myTickets = filterTasksForFieldTechnician(tickets, user, true);
  const myServices = filterTasksForFieldTechnician(plannedServices, user, true);

  const allowedMachineIds = new Set();
  const allowedMachineNames = new Set();

  [...myTickets, ...myServices].forEach(item => {
    if (item.machineId) allowedMachineIds.add(item.machineId);
    if (item.machineName) allowedMachineNames.add(String(item.machineName).trim().toLowerCase());
  });

  return machines.filter(m => {
    if (!m) return false;
    if (allowedMachineIds.has(m.id)) return true;
    if (m.parentId && allowedMachineIds.has(m.parentId)) return true;
    if (m.name && allowedMachineNames.has(String(m.name).trim().toLowerCase())) return true;
    return false;
  });
}

const QR_COOLDOWN_STORAGE_KEY = 'vexont_qr_last_submit_ts';

/**
 * Sprawdza, czy anonimowe zgłoszenie QR nie jest wysyłane zbyt często (ochrona anty-spamowa na osiedlach).
 * @param {number} cooldownMs Domyślnie 45 sekund pomiędzy kolejnymi zgłoszeniami z jednego telefonu
 */
export function checkQrSubmissionCooldown(cooldownMs = 45000, nowMs = Date.now()) {
  try {
    const raw = localStorage.getItem(QR_COOLDOWN_STORAGE_KEY);
    if (!raw) return { allowed: true, remainingSeconds: 0 };
    const lastTs = Number(raw);
    if (!Number.isFinite(lastTs) || lastTs <= 0) return { allowed: true, remainingSeconds: 0 };
    const elapsed = nowMs - lastTs;
    if (elapsed >= cooldownMs) {
      return { allowed: true, remainingSeconds: 0 };
    }
    return {
      allowed: false,
      remainingSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
    };
  } catch {
    return { allowed: true, remainingSeconds: 0 };
  }
}

export function recordQrSubmissionTimestamp(nowMs = Date.now()) {
  try {
    localStorage.setItem(QR_COOLDOWN_STORAGE_KEY, String(nowMs));
  } catch {
    // ignore storage errors
  }
}
