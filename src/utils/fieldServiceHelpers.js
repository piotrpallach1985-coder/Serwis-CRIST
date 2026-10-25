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

export const DTR_DOC_CATEGORIES = [
  {
    id: 'DTR',
    label: 'Dokumentacja DTR / Instrukcja obsługi',
    shortLabel: 'DTR / Instrukcja',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'PROTOKOL_KONTROLI',
    label: 'Protokół kontroli okresowej (c-KOB)',
    shortLabel: 'Protokół c-KOB',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'EKSPERTYZA',
    label: 'Ekspertyza / Opinia techniczna',
    shortLabel: 'Ekspertyza',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'DECYZJA_PINB',
    label: 'Decyzja administracyjna (PINB / UDT / PSP)',
    shortLabel: 'Decyzja PINB/UDT',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'SWIADECTWO_ENERG',
    label: 'Świadectwo charakterystyki energetycznej',
    shortLabel: 'Świadectwo Energ.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'DOK_POWYKONAWCZA',
    label: 'Dokumentacja budowy / powykonawcza / Plan sytuacyjny',
    shortLabel: 'Dok. powykonawcza',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'DOWOD_POLISA_FLOTA',
    label: 'Dowód rejestracyjny / Polisa OC/AC / Karta pojazdu',
    shortLabel: 'Dowód / OC/AC',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

export const FUEL_TYPES = [
  { id: '', label: '-- Wybierz rodzaj napędu / paliwa --' },
  { id: 'Diesel (ON)', label: 'Diesel (ON)' },
  { id: 'Benzyna (PB)', label: 'Benzyna (PB)' },
  { id: 'Benzyna + LPG', label: 'Benzyna + LPG' },
  { id: 'Hybryda (HEV/PHEV)', label: 'Hybryda (HEV / PHEV)' },
  { id: 'Elektryczny (EV)', label: 'Elektryczny (EV)' },
  { id: 'Inny / Sprzęt roboczy', label: 'Inny / Sprzęt roboczy' },
];

export function getDtrDocCategoryInfo(docCategory) {
  const found = DTR_DOC_CATEGORIES.find(c => c.id === docCategory);
  return found || DTR_DOC_CATEGORIES[0];
}

export const INDUSTRY_PROFILES = {
  industrial: {
    id: 'industrial',
    name: 'Przemysł / Produkcja / Zakład UR',
    shortName: 'Przemysł / UR',
    description: 'Zakłady produkcyjne, hale przemysłowe i infrastruktura techniczna: urządzenia, liczniki RBG, przestoje i magazyn części UR.',
    icon: 'ph-factory',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    bannerClass: 'bg-slate-900 text-white border-slate-800',
    machineLabel: 'Urządzenie',
    regionLabel: 'Miejsce montażu',
    bayLabel: 'Informacja dodatkowa',
    machineCardTitle: 'Karta Techniczna Urządzenia (Przemysł / UR)',
    machinePdfTitle: 'Karta Techniczna Urzadzenia (Przemysl / UR)',
    ticketCardTitle: 'Karta Zgłoszenia Awarii Urządzenia (UR)',
    ticketPdfTitle: 'Karta Zgłoszenia Awarii (UR)',
    serviceCardTitle: 'Karta Serwisu Planowanego (Prewencja UR)',
    servicePdfTitle: 'Karta Serwisu Planowanego (UR)',
    clientSignatureLabel: 'Podpis Odbierającego (Mistrz zmiany / Operator UR) — Opcjonalnie',
    techSignatureLabel: 'Podpis Wykonawcy / Mechanika UR',
    showFGasByDefault: false,
    showCkobSection: false,
    showIndustrialRbgSection: true,
    showHvacCustomerSection: false,
    requireInspectorLicense: false,
  },
  facility: {
    id: 'facility',
    name: 'Zarządzanie Nieruchomościami / Osiedla (c-KOB)',
    shortName: 'Facility / Osiedla (c-KOB)',
    description: 'Wspólnoty mieszkaniowe, biurowce i osiedla: budynki, klatki/lokale, przeglądy budowlane c-KOB (art. 62), domofony.',
    icon: 'ph-buildings',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    bannerClass: 'bg-amber-900 text-white border-amber-800',
    machineLabel: 'Urządzenie',
    regionLabel: 'Miejsce montażu',
    bayLabel: 'Informacja dodatkowa',
    machineCardTitle: 'Karta Obiektu / Instalacji Budowlanej (Facility / c-KOB)',
    machinePdfTitle: 'Karta Obiektu / Instalacji Budowlanej (Facility / c-KOB)',
    ticketCardTitle: 'Karta Zgłoszenia Usterki Obiektu (Facility / c-KOB)',
    ticketPdfTitle: 'Karta Usterki Obiektu (Facility / c-KOB)',
    serviceCardTitle: 'Protokół Przeglądu Okresowego Obiektu (c-KOB art. 62)',
    servicePdfTitle: 'Protokół Przeglądu Technicznego Obiektu (c-KOB)',
    clientSignatureLabel: 'Podpis Zarządcy Nieruchomości / Odbierającego (Opcjonalnie)',
    techSignatureLabel: 'Podpis Inspektora / Konserwatora Obiektu',
    showFGasByDefault: false,
    showCkobSection: true,
    showIndustrialRbgSection: false,
    showHvacCustomerSection: false,
    requireInspectorLicense: true,
  },
  hvac: {
    id: 'hvac',
    name: 'Serwis Mobilny HVAC / Pompy Ciepła (Field Service)',
    shortName: 'Serwis HVAC (F-Gazy / CRO)',
    description: 'Instalatorzy i serwis mobilny: pompy ciepła, klimatyzatory, kotłownie, protokoły F-Gaz (CRO), nawigacja GPS do klienta.',
    icon: 'ph-snowflake',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    bannerClass: 'bg-cyan-900 text-white border-cyan-800',
    machineLabel: 'Urządzenie',
    regionLabel: 'Miejsce montażu',
    bayLabel: 'Informacja dodatkowa',
    machineCardTitle: 'Karta Urządzenia Chłodniczego HVAC / F-Gaz (CRO)',
    machinePdfTitle: 'Karta Urzadzenia Chlodniczego HVAC / F-Gaz (CRO)',
    ticketCardTitle: 'Karta Naprawy Serwisowej HVAC / F-Gaz',
    ticketPdfTitle: 'Protokół Naprawy Serwisowej HVAC / F-Gaz',
    serviceCardTitle: 'Protokół Przeglądu i Szczelności HVAC / F-Gaz (CRO)',
    servicePdfTitle: 'Protokół Serwisowy HVAC / F-Gaz (CRO)',
    clientSignatureLabel: 'Podpis Klienta / Inwestora (Opcjonalnie)',
    techSignatureLabel: 'Podpis Uprawnionego Serwisanta F-Gaz',
    showFGasByDefault: true,
    showCkobSection: false,
    showIndustrialRbgSection: false,
    showHvacCustomerSection: true,
    requireInspectorLicense: true,
  },
  fleet: {
    id: 'fleet',
    name: 'Flota Samochodowa / Pojazdy i Sprzęt Mobilny (VexoNT Fleet)',
    shortName: 'VexoNT Fleet (Pojazdy)',
    description:
      'Samochody służbowe, busy serwisowe, transport i sprzęt kołowy: przebiegi (km / mth), polisy OC/AC, badania techniczne SKP i koszty TCO.',
    icon: 'ph-truck',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    bannerClass: 'bg-emerald-900 text-white border-emerald-800',
    machineLabel: 'Pojazd / Urządzenie',
    regionLabel: 'Baza / Lokalizacja',
    bayLabel: 'Informacja dodatkowa',
    machineCardTitle: 'Karta Pojazdu / Środka Transportu (VexoNT Fleet)',
    machinePdfTitle: 'Karta Pojazdu / Srodka Transportu (VexoNT Fleet)',
    ticketCardTitle: 'Karta Zgłoszenia Usterki / Szkody Pojazdu (VexoNT Fleet)',
    ticketPdfTitle: 'Karta Usterki / Szkody Pojazdu (VexoNT Fleet)',
    serviceCardTitle: 'Karta Serwisu Eksploatacyjnego Pojazdu (Olej / SKP / OC)',
    servicePdfTitle: 'Karta Serwisu Eksploatacyjnego Pojazdu (VexoNT Fleet)',
    clientSignatureLabel: 'Podpis Kierowcy / Odbierającego Pojazd (Opcjonalnie)',
    techSignatureLabel: 'Podpis Mechanika / Serwisanta Floty',
    showFGasByDefault: false,
    showCkobSection: false,
    showIndustrialRbgSection: false,
    showHvacCustomerSection: false,
    showFleetSection: true,
    requireInspectorLicense: false,
  },
};

/**
 * Sprawdza, czy dany zasób jest Pojazdem / Środkiem transportu (Flota).
 * Działa zarówno dla 4. profilu branżowego ('fleet'), jak i dla pojazdów dodanych w profilach industrial/facility/hvac.
 */
export function isVehicleAsset(machine, industryProfile = 'industrial') {
  if (!machine) return industryProfile === 'fleet';
  if (machine.assetCategory === 'vehicle') return true;
  if (machine.assetCategory === 'device') return false;
  if (
    machine.licensePlate ||
    machine.vinNumber ||
    machine.techInspectionDate ||
    machine.insuranceExpiryDate ||
    machine.counterUnit === 'km'
  ) {
    return true;
  }
  return industryProfile === 'fleet';
}

/**
 * Zwraca jednostkę licznika dla danego urządzenia/pojazdu ('km' lub 'RBG').
 */
export function getMachineCounterUnit(machine, industryProfile = 'industrial') {
  if (machine?.counterUnit === 'km') return 'km';
  if (machine?.counterUnit === 'RBG' || machine?.counterUnit === 'mth') return 'RBG';
  return isVehicleAsset(machine, industryProfile) ? 'km' : 'RBG';
}

/**
 * Weryfikuje status dat badania technicznego (SKP) oraz polisy ubezpieczeniowej (OC/AC) pojazdu.
 */
export function checkVehicleDatesStatus(machine, warningDays = 30, nowDate = new Date()) {
  const nowObj = nowDate instanceof Date ? nowDate : new Date(nowDate);
  const nowTime = isNaN(nowObj.getTime()) ? Date.now() : nowObj.getTime();
  const emptyCheck = {
    dateStr: '',
    daysLeft: null,
    isOverdue: false,
    isUpcoming: false,
    status: 'none',
    statusLabel: 'Brak daty',
  };

  const evaluateDate = (rawDate, labelPrefix) => {
    if (!rawDate || String(rawDate).trim() === '') return { ...emptyCheck };
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return { ...emptyCheck };
    const diffMs = parsed.getTime() - nowTime;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const dateStr = String(rawDate).split('T')[0];

    if (daysLeft < 0) {
      return {
        dateStr,
        daysLeft,
        isOverdue: true,
        isUpcoming: false,
        status: 'overdue',
        statusLabel: `${labelPrefix} po terminie (${Math.abs(daysLeft)} dni temu!)`,
      };
    }
    if (daysLeft <= warningDays) {
      return {
        dateStr,
        daysLeft,
        isOverdue: false,
        isUpcoming: true,
        status: 'upcoming',
        statusLabel: `${labelPrefix} kończy się za ${daysLeft} dni (${dateStr})`,
      };
    }
    return {
      dateStr,
      daysLeft,
      isOverdue: false,
      isUpcoming: false,
      status: 'ok',
      statusLabel: `Ważne do ${dateStr} (${daysLeft} dni)`,
    };
  };

  const skp = evaluateDate(machine?.techInspectionDate, 'Badanie SKP');
  const oc = evaluateDate(machine?.insuranceExpiryDate, 'Polisa OC/AC');

  return {
    skp,
    oc,
    techInspectionStatus: skp.status,
    techInspectionDaysLeft: skp.daysLeft,
    insuranceStatus: oc.status,
    insuranceDaysLeft: oc.daysLeft,
    hasAnyAlert: Boolean(skp.isOverdue || skp.isUpcoming || oc.isOverdue || oc.isUpcoming),
  };
}

/**
 * Sprawdza, czy dla danego profilu firmy wymagany jest numer uprawnień kontrolującego / inspektora.
 * Wymagany dla profili 'facility' (c-KOB art. 62 PB) oraz 'hvac' (F-Gaz / CRO).
 */
export function isInspectorLicenseRequired(industryProfile) {
  return industryProfile === 'facility' || industryProfile === 'hvac';
}

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
 * Sprawdza, czy podmapa danego rejonu (lub wskazana zakładka podmapy) jest skonfigurowana
 * i zwraca jej typ ('google' | 'image' | null).
 */
function getRegionSubmapEffectiveType(region, submapTabId = null) {
  if (!region) return null;
  if (Array.isArray(region.submaps) && region.submaps.length > 0) {
    const tab =
      (submapTabId && region.submaps.find(s => s.id === submapTabId)) ||
      region.submaps[0];
    if (!tab || tab.submapConfigured === false) return null;
    if (tab.mapType === 'google') {
      const hasGoogle = Boolean(
        tab.submapConfigured === true ||
          (tab.googleLat != null && tab.googleLng != null) ||
          (tab.googleQuery && String(tab.googleQuery).trim() !== '')
      );
      return hasGoogle ? 'google' : null;
    }
    if (tab.mapImageUrl && String(tab.mapImageUrl).trim() !== '') {
      return 'image';
    }
    if (tab.mapType === 'image' && tab.submapConfigured === true) {
      return 'image';
    }
    return null;
  }

  if (region.submapConfigured === false) return null;
  if (region.mapType === 'google') {
    const hasGoogle = Boolean(
      region.submapConfigured === true ||
        (region.googleLat != null && region.googleLng != null) ||
        (region.googleQuery && String(region.googleQuery).trim() !== '')
    );
    return hasGoogle ? 'google' : null;
  }
  if (region.mapImageUrl && String(region.mapImageUrl).trim() !== '') {
    return 'image';
  }
  if (region.mapType === 'image' && region.submapConfigured === true) {
    return 'image';
  }
  return null;
}

/**
 * Wyznacza dane geolokalizacyjne i adresowe maszyny (z maszyny lub z przypisanego rejonu).
 * Zasady:
 * 1. Brak pineski na Mapie Google -> brak przycisku "Nawiguj GPS" (nie bierzemy pod uwagę samych
 *    współrzędnych kadru podmapy googleLat/googleLng).
 * 2. Nawigacja działa TYLKO wtedy, gdy mapa nadrzędna ("mapa powyższa"), na której znajduje się
 *    dana pineska, jest ustawiona na Mapę Google ('google'). Jeśli mapa nadrzędna jest ustawiona
 *    jako JPG / PNG ('image'), nawigacja jest wyłączona.
 */
export function resolveMachineGeoLocation(machine, regions = [], mapSettings = null) {
  const emptyResult = {
    lat: null,
    lng: null,
    address: '',
    hasCoordinates: false,
    hasAddress: false,
    canNavigate: false,
  };

  if (!machine) return emptyResult;

  const region = (regions || []).find(
    r => r.id === machine.regionId || (machine.regionName && r.name === machine.regionName)
  );

  const mainMapType = mapSettings?.mapType || null;

  // Współrzędne samej pinezki maszyny (bez googleLat/googleLng kadru!)
  const mRawLat = machine.gpsLat ?? machine.lat ?? machine.mapLat ?? null;
  const mRawLng = machine.gpsLng ?? machine.lng ?? machine.mapLng ?? null;
  const mLat =
    mRawLat !== null && mRawLat !== '' && Number.isFinite(Number(mRawLat))
      ? Number(mRawLat)
      : null;
  const mLng =
    mRawLng !== null && mRawLng !== '' && Number.isFinite(Number(mRawLng))
      ? Number(mRawLng)
      : null;
  const mAddress = (machine.address || machine.mapAddress || '').trim();
  const machinePinnedOnImage = machine.pinnedOnMapType === 'image';
  const mHasPinGeo =
    !machinePinnedOnImage && ((mLat !== null && mLng !== null) || mAddress.length > 0);

  // 1. Maszyna przypięta bezpośrednio na Mapie Głównej (lub nie ma przypisanego rejonu)
  if (machine.pinnedOnMap === 'main' || !region) {
    if (mainMapType === 'image' || machinePinnedOnImage) {
      return emptyResult;
    }
    if (!mHasPinGeo) return emptyResult;
    return {
      lat: mLat,
      lng: mLng,
      address: mAddress,
      hasCoordinates: mLat !== null && mLng !== null,
      hasAddress: mAddress.length > 0,
      canNavigate: true,
    };
  }

  // 2. Maszyna należy do rejonu (Miejsca montażu)
  const regionSubmapType = getRegionSubmapEffectiveType(region, machine.submapTabId);

  // 2a. Jeśli rejon posiada własną podmapę, to ona jest "mapą powyższą" dla tego urządzenia
  if (regionSubmapType !== null) {
    // Jeśli podmapa rejonu jest ustawiona na JPG / PNG -> brak możliwości nawigacji
    if (regionSubmapType !== 'google') {
      return emptyResult;
    }
    // Podmapa rejonu to Mapa Google -> urządzenie MUSI mieć na niej postawioną pineskę
    const hasPinOnSubmap =
      mHasPinGeo &&
      (machine.xPercent != null ||
        machine.lat != null ||
        machine.mapLat != null ||
        machine.gpsLat != null);
    if (!hasPinOnSubmap) {
      return emptyResult;
    }
    return {
      lat: mLat,
      lng: mLng,
      address: mAddress,
      hasCoordinates: mLat !== null && mLng !== null,
      hasAddress: mAddress.length > 0,
      canNavigate: true,
    };
  }

  // 2b. Rejon NIE posiada własnej podmapy -> "mapą powyższą" jest mapa, na której leży sam rejon
  const parentRegion = region.parentId
    ? (regions || []).find(r => r.id === region.parentId)
    : null;
  const parentMapTypeForRegion = parentRegion
    ? getRegionSubmapEffectiveType(parentRegion, region.submapTabId)
    : mainMapType;

  // Jeśli mapa powyższa (np. Mapa Główna lub mapa nadrzędnego rejonu) to JPG / PNG -> brak nawigacji
  if (parentMapTypeForRegion === 'image') {
    return emptyResult;
  }

  if (mHasPinGeo) {
    return {
      lat: mLat,
      lng: mLng,
      address: mAddress,
      hasCoordinates: mLat !== null && mLng !== null,
      hasAddress: mAddress.length > 0,
      canNavigate: true,
    };
  }

  // Sprawdź czy sam rejon ma postawioną pineskę na Mapie Google (UWAGA: nie używamy googleLat/googleLng kadru!)
  if (region.pinnedOnMapType === 'image') {
    return emptyResult;
  }
  const rRawLat = region.lat ?? region.mapLat ?? region.gpsLat ?? null;
  const rRawLng = region.lng ?? region.mapLng ?? region.gpsLng ?? null;
  const rLat =
    rRawLat !== null && rRawLat !== '' && Number.isFinite(Number(rRawLat))
      ? Number(rRawLat)
      : null;
  const rLng =
    rRawLng !== null && rRawLng !== '' && Number.isFinite(Number(rRawLng))
      ? Number(rRawLng)
      : null;
  const rAddress = (region.address || region.mapAddress || '').trim();
  const rHasPinGeo = (rLat !== null && rLng !== null) || rAddress.length > 0;

  if (!rHasPinGeo) {
    return emptyResult;
  }

  return {
    lat: rLat,
    lng: rLng,
    address: rAddress,
    hasCoordinates: rLat !== null && rLng !== null,
    hasAddress: rAddress.length > 0,
    canNavigate: true,
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
 * Tłumaczy błędy Geolocation API (np. "User denied geolocation prompt") na czytelny komunikat po polsku.
 */
export function formatGeolocationError(err) {
  const msg = String(err?.message || '');
  if (err?.code === 1 || /denied/i.test(msg)) {
    return 'Odmowa dostępu do lokalizacji GPS w przeglądarce (pole opcjonalne — możesz kontynuować bez GPS).';
  }
  if (err?.code === 2 || /unavailable/i.test(msg)) {
    return 'Sygnał GPS jest chwilowo niedostępny (pole opcjonalne).';
  }
  if (err?.code === 3 || /timeout/i.test(msg)) {
    return 'Przekroczono czas oczekiwania na sygnał GPS (pole opcjonalne).';
  }
  return msg || 'Nie udało się pobrać lokalizacji GPS (pole opcjonalne).';
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
        reject(new Error(formatGeolocationError(err)));
      },
      options
    );
  });
}

/**
 * Sprawdza, czy dane zlecenie (awaria lub serwis planowany) jest przypisane do danego użytkownika
 * lub do jego dedykowanego serwisu / zakresu (np. `assignedService` / `dedicatedServices`).
 */
export function isTaskAssignedToUser(task, user) {
  if (!task || !user) return false;

  const dedicatedList = Array.isArray(user.dedicatedServices)
    ? user.dedicatedServices
    : user.dedicatedServices
    ? [user.dedicatedServices]
    : [];

  const userIdentifiers = [
    user.uid,
    user.id,
    user.name,
    user.email,
    user.serviceName,
    user.assignedService,
    ...dedicatedList,
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
 * Filtruje listę zgłoszeń/serwisów dla mobilnego serwisanta z włączonym ograniczeniem RODO B2C (`onlyAssignedTasks`)
 * lub przypisanym dedykowanym serwisem (`assignedService` / `dedicatedServices`).
 */
export function filterTasksForFieldTechnician(tasks = [], user = null, onlyAssignedTasks = false) {
  if (!Array.isArray(tasks)) return [];
  if (!user) return tasks;
  if (user.role === 'admin' || user.role === 'superadmin') return tasks;
  const hasDedicatedScope = Boolean(
    user.assignedService ||
      (Array.isArray(user.dedicatedServices) && user.dedicatedServices.length > 0)
  );
  if (!onlyAssignedTasks && !hasDedicatedScope) return tasks;

  return tasks.filter(task => isTaskAssignedToUser(task, user));
}

/**
 * Filtruje listę maszyn/urządzeń dla mobilnego serwisanta z włączonym ograniczeniem RODO B2C (`onlyAssignedTasks`)
 * lub przypisanym dedykowanym serwisem (`assignedService` / `dedicatedServices`),
 * tak aby widział wyłącznie urządzenia powiązane z jego zleceniami (bez dostępu do innych zakresów).
 */
export function filterMachinesForFieldTechnician(
  machines = [],
  tickets = [],
  plannedServices = [],
  user = null,
  onlyAssignedTasks = false
) {
  if (!Array.isArray(machines)) return [];
  if (!user) return machines;
  if (user.role === 'admin' || user.role === 'superadmin') return machines;
  const hasDedicatedScope = Boolean(
    user.assignedService ||
      (Array.isArray(user.dedicatedServices) && user.dedicatedServices.length > 0)
  );
  if (!onlyAssignedTasks && !hasDedicatedScope) return machines;

  const myTickets = filterTasksForFieldTechnician(tickets, user, true);
  const myServices = filterTasksForFieldTechnician(plannedServices, user, true);

  const allowedMachineIds = new Set();
  const allowedMachineNames = new Set();

  [...myTickets, ...myServices].forEach(item => {
    if (item.machineId) allowedMachineIds.add(item.machineId);
    if (item.machineName) allowedMachineNames.add(String(item.machineName).trim().toLowerCase());
  });

  machines.forEach(m => {
    if (!m) return;
    if (
      (m.assignedDriver || m.assignedService) &&
      isTaskAssignedToUser(
        { assignedTo: m.assignedDriver, assignedService: m.assignedService },
        user
      )
    ) {
      allowedMachineIds.add(m.id);
    }
  });

  return machines.filter(m => {
    if (!m) return false;
    if (allowedMachineIds.has(m.id)) return true;
    if (m.parentId && allowedMachineIds.has(m.parentId)) return true;
    if (m.name && allowedMachineNames.has(String(m.name).trim().toLowerCase())) return true;
    return false;
  });
}

/**
 * Kontrola ustawowego terminu 7 dni na wpis protokołu kontroli do rządowego systemu c-KOB (art. 60k ust. 2 Prawa budowlanego).
 * @param {object} service Obiekt serwisu planowanego
 * @param {object} machine Obiekt maszyny/urządzenia
 * @param {string} industryProfile Profil branżowy firmy ('industrial' | 'facility' | 'hvac')
 * @param {number} nowMs Czas odniesienia w ms (domyślnie Date.now())
 */
export function checkCkob7DaysDeadline(
  service,
  machine = null,
  industryProfile = 'industrial',
  nowMs = Date.now()
) {
  const defaultResult = {
    requiresCkobEntry: false,
    ckobEntered: Boolean(service?.ckobEntered || service?.completionDetails?.ckobEntered),
    daysElapsed: 0,
    daysRemaining: 7,
    isOverdue7Days: false,
    completedDate: null,
  };

  if (!service) return defaultResult;

  const hasCkobCategory = Boolean(
    machine?.inspectionCategory ||
      industryProfile === 'facility' ||
      String(service.category || '').startsWith('ckob_')
  );

  if (!hasCkobCategory || service.status !== 'completed') {
    return defaultResult;
  }

  const rawCompletedAt =
    service.completedAt || service.completionDetails?.completedAt || service.closedAt || null;

  if (!rawCompletedAt) {
    return defaultResult;
  }

  let completedDate = null;
  if (rawCompletedAt instanceof Date) {
    completedDate = rawCompletedAt;
  } else if (typeof rawCompletedAt?.toDate === 'function') {
    completedDate = rawCompletedAt.toDate();
  } else if (typeof rawCompletedAt?.seconds === 'number') {
    completedDate = new Date(rawCompletedAt.seconds * 1000);
  } else {
    completedDate = new Date(rawCompletedAt);
  }

  if (!completedDate || Number.isNaN(completedDate.getTime())) {
    return defaultResult;
  }

  const isAlreadyEntered = Boolean(
    service.ckobEntered === true || service.completionDetails?.ckobEntered === true
  );

  const elapsedMs = Math.max(0, nowMs - completedDate.getTime());
  const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const daysRemaining = 7 - daysElapsed;
  const isOverdue7Days = daysRemaining < 0;

  if (isAlreadyEntered) {
    return {
      requiresCkobEntry: false,
      ckobEntered: true,
      daysElapsed,
      daysRemaining,
      isOverdue7Days: false,
      completedDate,
    };
  }

  return {
    requiresCkobEntry: true,
    ckobEntered: false,
    daysElapsed,
    daysRemaining,
    isOverdue7Days,
    completedDate,
  };
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

function isValidNumericCoord(val) {
  return (
    val !== null &&
    val !== undefined &&
    val !== '' &&
    typeof val !== 'boolean' &&
    Number.isFinite(Number(val))
  );
}

function parseTaskTimestampMs(raw) {
  if (!raw || typeof raw === 'boolean') return null;
  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof raw?.toDate === 'function') {
    const d = raw.toDate();
    const ms = d instanceof Date ? d.getTime() : NaN;
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof raw?.seconds === 'number') {
    return raw.seconds * 1000;
  }
  if (typeof raw?._seconds === 'number') {
    return raw._seconds * 1000;
  }
  const d = new Date(raw);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Oblicza odległość w linii prostej (w metrach) pomiędzy dwoma punktami GPS za pomocą wzoru Haversine.
 * Zwraca liczbę całkowitą (zaokrągloną w metrach) lub `null`, jeśli brakuje poprawnych współrzędnych.
 */
export function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  if (
    !isValidNumericCoord(lat1) ||
    !isValidNumericCoord(lng1) ||
    !isValidNumericCoord(lat2) ||
    !isValidNumericCoord(lng2)
  ) {
    return null;
  }

  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);

  if (
    Math.abs(nLat1) > 90 ||
    Math.abs(nLat2) > 90 ||
    Math.abs(nLng1) > 180 ||
    Math.abs(nLng2) > 180
  ) {
    return null;
  }

  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371000; // promień Ziemi w metrach
  const dLat = toRad(nLat2 - nLat1);
  const dLng = toRad(nLng2 - nLng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) *
      Math.cos(toRad(nLat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Pomocniczy fallback wyciągający współrzędne GPS docelowego obiektu z maszyny, hierarchii maszyn (`parentId`)
 * lub hierarchii rejonów (`region.parentId` oraz `submaps` Google).
 */
function resolveTargetGpsCoordinates(machine, regions = [], machines = []) {
  if (!machine) return null;

  const visitedMachines = new Set();
  let currentMachine = machine;
  let inheritedRegionId = machine.regionId || null;
  let inheritedRegionName = machine.regionName || null;

  while (currentMachine) {
    if (currentMachine.id) visitedMachines.add(currentMachine.id);

    const geo = resolveMachineGeoLocation(currentMachine, regions);
    if (geo.hasCoordinates && isValidNumericCoord(geo.lat) && isValidNumericCoord(geo.lng)) {
      return { lat: Number(geo.lat), lng: Number(geo.lng) };
    }

    const mLat =
      currentMachine.gpsLat ??
      (currentMachine.pinnedOnMapType !== 'image'
        ? currentMachine.lat ?? currentMachine.mapLat
        : null);
    const mLng =
      currentMachine.gpsLng ??
      (currentMachine.pinnedOnMapType !== 'image'
        ? currentMachine.lng ?? currentMachine.mapLng
        : null);
    if (isValidNumericCoord(mLat) && isValidNumericCoord(mLng)) {
      return { lat: Number(mLat), lng: Number(mLng) };
    }

    if (!inheritedRegionId && currentMachine.regionId) {
      inheritedRegionId = currentMachine.regionId;
    }
    if (!inheritedRegionName && currentMachine.regionName) {
      inheritedRegionName = currentMachine.regionName;
    }

    if (currentMachine.parentMachine && typeof currentMachine.parentMachine === 'object') {
      currentMachine = currentMachine.parentMachine;
    } else if (
      currentMachine.parentId &&
      !visitedMachines.has(currentMachine.parentId) &&
      Array.isArray(machines) &&
      machines.length > 0
    ) {
      currentMachine = machines.find(m => m.id === currentMachine.parentId) || null;
    } else {
      currentMachine = null;
    }
  }

  const visitedRegions = new Set();
  let currentRegion = (regions || []).find(
    r =>
      (inheritedRegionId && r.id === inheritedRegionId) ||
      (inheritedRegionName && r.name === inheritedRegionName)
  );

  while (currentRegion && !visitedRegions.has(currentRegion.id)) {
    visitedRegions.add(currentRegion.id);
    const googleSubmap = Array.isArray(currentRegion.submaps)
      ? currentRegion.submaps.find(
          sm =>
            sm?.mapType === 'google' &&
            isValidNumericCoord(sm?.googleLat) &&
            isValidNumericCoord(sm?.googleLng)
        )
      : null;

    const rLat =
      currentRegion.gpsLat ??
      (currentRegion.pinnedOnMapType !== 'image' ? currentRegion.lat ?? currentRegion.mapLat : null) ??
      currentRegion.googleLat ??
      googleSubmap?.googleLat ??
      null;
    const rLng =
      currentRegion.gpsLng ??
      (currentRegion.pinnedOnMapType !== 'image' ? currentRegion.lng ?? currentRegion.mapLng : null) ??
      currentRegion.googleLng ??
      googleSubmap?.googleLng ??
      null;
    if (isValidNumericCoord(rLat) && isValidNumericCoord(rLng)) {
      return { lat: Number(rLat), lng: Number(rLng) };
    }
    currentRegion = currentRegion.parentId
      ? (regions || []).find(r => r.id === currentRegion.parentId)
      : null;
  }

  return null;
}

/**
 * Weryfikuje obecność serwisanta na obiekcie (Geofencing GPS) względem współrzędnych maszyny/rejonu.
 */
export function verifyOnSiteGps(
  workerGps,
  machine,
  regions = [],
  thresholdMeters = 300,
  machines = []
) {
  const targetCoords = resolveTargetGpsCoordinates(machine, regions, machines);
  if (!targetCoords) {
    return {
      status: 'no_target_coords',
      distanceMeters: null,
      isOnSite: null,
      label: 'Brak współrzędnych obiektu',
    };
  }

  if (
    !workerGps ||
    typeof workerGps !== 'object' ||
    !isValidNumericCoord(workerGps.lat) ||
    !isValidNumericCoord(workerGps.lng)
  ) {
    return {
      status: 'no_worker_gps',
      distanceMeters: null,
      isOnSite: null,
      label: 'Brak odczytu GPS serwisanta',
    };
  }

  const distanceMeters = calculateDistanceMeters(
    workerGps.lat,
    workerGps.lng,
    targetCoords.lat,
    targetCoords.lng
  );

  if (distanceMeters === null) {
    return {
      status: 'no_worker_gps',
      distanceMeters: null,
      isOnSite: null,
      label: 'Brak odczytu GPS serwisanta',
    };
  }

  const isOnSite = distanceMeters <= thresholdMeters;
  const formattedDist =
    distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km`
      : `${distanceMeters} m`;

  return {
    status: isOnSite ? 'on_site' : 'off_site',
    distanceMeters,
    isOnSite,
    label: isOnSite
      ? `Na miejscu (${distanceMeters} m od obiektu)`
      : `POZA OBIEKTEM (${formattedDist} od obiektu!)`,
  };
}

/**
 * Uniwersalna funkcja wyliczająca metryki czasu dojazdu, czasu pracy na miejscu (stoper vs deklarowane RBG)
 * oraz weryfikację geofencingu GPS dla zgłoszenia awarii (`ticket`) lub serwisu planowanego (`planned_service`).
 * Wyliczenia oparte wyłącznie na czystej matematyce (znaczniki czasu + wzór Haversine).
 */
export function calculateWorkAndTravelMetrics(task, machine = null, regions = [], machines = []) {
  const safeTask = task || {};

  const travelStartedAt = safeTask.travelStartedAt || null;
  const travelStartMs = parseTaskTimestampMs(travelStartedAt);

  // Jeśli istnieje jawny workStartedAt, używamy go; w przeciwnym razie inProgressAt tylko gdy nie jest wcześniejszy niż start dojazdu
  let workStartedAt = safeTask.workStartedAt || null;
  if (!workStartedAt && safeTask.inProgressAt) {
    const inProgMs = parseTaskTimestampMs(safeTask.inProgressAt);
    if (inProgMs !== null && (travelStartMs === null || inProgMs >= travelStartMs)) {
      workStartedAt = safeTask.inProgressAt;
    }
  }

  const completedAt =
    safeTask.closedAt ||
    safeTask.completedAt ||
    safeTask.completionDetails?.completedAt ||
    null;

  const workStartMs = parseTaskTimestampMs(workStartedAt);
  const completedMs = parseTaskTimestampMs(completedAt);

  const travelDurationMinutes =
    travelStartMs !== null && workStartMs !== null && workStartMs > travelStartMs
      ? Math.round((workStartMs - travelStartMs) / 60000)
      : null;

  const stopwatchWorkMinutes =
    workStartMs !== null && completedMs !== null && completedMs >= workStartMs
      ? Math.round((completedMs - workStartMs) / 60000)
      : null;

  const stopwatchWorkHours =
    stopwatchWorkMinutes !== null ? Number((stopwatchWorkMinutes / 60).toFixed(2)) : null;

  let rawDeclared =
    safeTask.manHours ??
    safeTask.actualManHours ??
    safeTask.completionDetails?.manHours ??
    safeTask.completionDetails?.historyEntry?.manHours ??
    null;

  if (
    (rawDeclared === null || rawDeclared === undefined || rawDeclared === '') &&
    Array.isArray(safeTask.history)
  ) {
    for (let i = safeTask.history.length - 1; i >= 0; i -= 1) {
      const h = safeTask.history[i];
      if (h && h.manHours !== undefined && h.manHours !== null && h.manHours !== '') {
        rawDeclared = h.manHours;
        break;
      }
    }
  }

  const normalizedDeclaredStr =
    rawDeclared !== null && rawDeclared !== undefined && typeof rawDeclared !== 'boolean'
      ? String(rawDeclared).replace(',', '.').trim()
      : '';
  const parsedDeclaredNum =
    normalizedDeclaredStr !== '' ? Number(normalizedDeclaredStr) : NaN;

  const declaredManHours =
    Number.isFinite(parsedDeclaredNum) && parsedDeclaredNum >= 0
      ? Number(parsedDeclaredNum.toFixed(2))
      : null;

  const isMultiDayOrPaused = Boolean(stopwatchWorkHours !== null && stopwatchWorkHours > 12);

  const discrepancyHours =
    declaredManHours !== null && stopwatchWorkHours !== null && !isMultiDayOrPaused
      ? Number((declaredManHours - stopwatchWorkHours).toFixed(2))
      : null;

  const isTimeInflated = Boolean(discrepancyHours !== null && discrepancyHours > 0.25);
  const isSuspiciouslyShort = Boolean(
    stopwatchWorkMinutes !== null &&
      stopwatchWorkMinutes < 5 &&
      Boolean(safeTask.triggerType || safeTask.checklist)
  );

  const effectiveMachine =
    machine ||
    (safeTask.regionId || safeTask.regionName || safeTask.address
      ? {
          regionId: safeTask.regionId,
          regionName: safeTask.regionName,
          address: safeTask.address,
        }
      : null);

  const startGpsVerification = verifyOnSiteGps(
    safeTask.workStartGps,
    effectiveMachine,
    regions,
    300,
    machines
  );
  const endGpsVerification = verifyOnSiteGps(
    safeTask.completedGps || safeTask.completionDetails?.completedGps,
    effectiveMachine,
    regions,
    300,
    machines
  );

  return {
    travelStartedAt,
    workStartedAt,
    completedAt,
    travelDurationMinutes,
    stopwatchWorkMinutes,
    stopwatchWorkHours,
    declaredManHours,
    discrepancyHours,
    isTimeInflated,
    isSuspiciouslyShort,
    isMultiDayOrPaused,
    startGpsVerification,
    endGpsVerification,
  };
}
