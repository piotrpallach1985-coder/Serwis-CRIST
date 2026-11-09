/**
 * Helpery do masowego importu Urządzeń/Pojazdów (wraz z podzespołami parentId) oraz Części Magazynowych z plików Excel (.xlsx/.xls) i CSV.
 */
import { isPuwg2000CoordinatePair, puwg2000ToWgs84 } from './ifcCoordinatesHelper';

export const MACHINE_IMPORT_FIELDS = [
  {
    key: 'name',
    label: 'Nazwa urządzenia / pojazdu *',
    required: true,
    requirementLevel: 'unconditional',
    requirementBadge: 'WYMAGANE BEZWARUNKOWO',
    legendDesc:
      'Pełna nazwa maszyny, podzespołu lub pojazdu. Wiersze bez nazwy zostaną pominięte.',
  },
  {
    key: 'regionName',
    label: 'Miejsce montażu (Rejon)',
    required: false,
    requirementLevel: 'for_qr',
    requirementBadge: 'WYMAGANE DO KODU QR',
    legendDesc:
      'Nazwa rejonu/hali (np. Hala Cięcia, Mapa Główna). Jeśli brak rejonu (i brak urządzenia nadrzędnego z rejonem), urządzenie zostanie dodane jako (DO WERYFIKACJI) bez kodu QR.',
  },
  {
    key: 'parentMachine',
    label: 'Urządzenie nadrzędne (Nazwa lub Nr wew.) — dla podzespołów',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (PODZESPÓŁ)',
    legendDesc:
      'Wpisz dokładną nazwę lub numer wewnętrzny urządzenia głównego (z bazy lub z wyższego wiersza tego samego pliku Excel), jeśli dany wiersz jest podzespołem. Podzespół automatycznie odziedziczy rejon po urządzeniu głównym.',
  },
  {
    key: 'internalId',
    label: 'Numer wewnętrzny / inwentarzowy',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (ZALECANE)',
    legendDesc:
      'Unikalny kod UR / numer inwentarzowy (np. UR-101). Ułatwia wyszukiwanie duplikatów oraz przypisywanie podzespołów i części zamiennych.',
  },
  {
    key: 'bay',
    label: 'Informacja dodatkowa (Hala / Piętro / Stanowisko)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Szczegółowa lokalizacja wewnątrz rejonu (np. Nawa B, Piętro 2, Gniazdo 4).',
  },
  {
    key: 'assetCategory',
    label: 'Kategoria zasobu (device / vehicle / hvac)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc:
      'Domyślnie: device (maszyna/urządzenie). Dla pojazdów wpisz: vehicle (lub pojazd/flota).',
  },
  {
    key: 'currentWorkHours',
    label: 'Stan licznika (RBG / km)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Początkowy stan licznika czasu pracy urządzenia (RBG) lub przebiegu (km). Domyślnie 0.',
  },
  {
    key: 'counterUnit',
    label: 'Jednostka licznika (RBG / km)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Jednostka licznika: RBG dla maszyn lub km dla pojazdów.',
  },
  {
    key: 'additionalDescription',
    label: 'Dodatkowy opis',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Dodatkowe informacje techniczne widoczne w karcie urządzenia.',
  },
  {
    key: 'licensePlate',
    label: 'Nr rejestracyjny (dla pojazdów)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (FLOTA)',
    legendDesc: 'Numer tablicy rejestracyjnej pojazdu (np. GD 3V975).',
  },
  {
    key: 'vinNumber',
    label: 'Numer VIN (dla pojazdów)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (FLOTA)',
    legendDesc: '17-znakowy numer nadwozia VIN.',
  },
  {
    key: 'productionYear',
    label: 'Rok produkcji',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Rok produkcji maszyny lub pojazdu (np. 2023).',
  },
  {
    key: 'techInspectionDate',
    label: 'Data badania SKP / UDT (RRRR-MM-DD)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Termin ważności przeglądu technicznego SKP lub badania UDT.',
  },
  {
    key: 'insuranceExpiryDate',
    label: 'Data końca polisy OC/AC (RRRR-MM-DD)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (FLOTA)',
    legendDesc: 'Termin ważności ubezpieczenia pojazdu.',
  },
  {
    key: 'needsVerification',
    label: 'Status weryfikacji (np. TAK / DO WERYFIKACJI)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc:
      'Wpisz TAK, jeśli mimo podanego rejonu urządzenie ma trafić do bazy jako (DO WERYFIKACJI) bez generowania kodu QR.',
  },
  {
    key: 'ifcGlobalId',
    label: 'IfcGlobalId (GUID obiektu BIM / IFC)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (BIM / IFC)',
    legendDesc:
      'Unikalny 22-znakowy identyfikator obiektu z modelu BIM (standard ISO 16739 IFC) do synchronizacji i aktualizacji.',
  },
  {
    key: 'ifcX',
    label: 'Współrzędna X (IFC / PUWG 2000 [m])',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (BIM / IFC)',
    legendDesc:
      'Współrzędna X obiektu w modelu BIM (w metrach) lub w układzie geodezyjnym PUWG 2000 (automatyczne przeliczenie na mapę).',
  },
  {
    key: 'ifcY',
    label: 'Współrzędna Y (IFC / PUWG 2000 [m])',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (BIM / IFC)',
    legendDesc:
      'Współrzędna Y obiektu w modelu BIM (w metrach) lub w układzie geodezyjnym PUWG 2000 (automatyczne przeliczenie na mapę).',
  },
  {
    key: 'ifcZ',
    label: 'Rzędna wysokości Z (IFC Elevation [m])',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (BIM / IFC)',
    legendDesc:
      'Rzędna wysokości Z obiektu w modelu BIM (w metrach) — pozwala automatycznie przypisać maszynę do poziomu podmapy.',
  },
  {
    key: 'ifcStorey',
    label: 'Kondygnacja / Poziom BIM (IfcBuildingStorey)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (BIM / IFC)',
    legendDesc: 'Nazwa kondygnacji lub poziomu z modelu IFC (np. Poziom 0.00, Pomost +12m).',
  },
];

export const PART_IMPORT_FIELDS = [
  {
    key: 'name',
    label: 'Nazwa części *',
    required: true,
    requirementLevel: 'unconditional',
    requirementBadge: 'WYMAGANE BEZWARUNKOWO',
    legendDesc: 'Pełna nazwa części zamiennej lub materiału eksploatacyjnego.',
  },
  {
    key: 'code',
    label: 'Kod magazynowy / Indeks *',
    required: true,
    requirementLevel: 'unconditional',
    requirementBadge: 'WYMAGANE BEZWARUNKOWO',
    legendDesc:
      'Unikalny kod magazynowy / indeks ERP / SKU (np. LOZ-6205-2RS). Służy do identyfikacji części i kodów QR.',
  },
  {
    key: 'stock',
    label: 'Stan początkowy (Fizyczny) *',
    required: true,
    requirementLevel: 'unconditional',
    requirementBadge: 'WYMAGANE BEZWARUNKOWO',
    legendDesc:
      'Ilość fizyczna na magazynie (wpisz 0, jeśli zakładasz tylko kartotekę części; dla wartości > 0 system automatycznie utworzy pierwszą partię FIFO).',
  },
  {
    key: 'unit',
    label: 'Jednostka miary (szt. / kg / L / m / kpl.)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Jednostka magazynowa: szt., kg, L, m, m2, opak., kpl. (domyślnie: szt.).',
  },
  {
    key: 'minStock',
    label: 'Stan minimalny (Alarmowy)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc:
      'Próg poniżej którego część pojawi się na Liście Zakupowej jako Niski Stan (domyślnie: 0).',
  },
  {
    key: 'unitPrice',
    label: 'Cena jedn. netto (PLN)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Cena jednostkowa netto w PLN dla partii początkowej FIFO.',
  },
  {
    key: 'building',
    label: 'Budynek magazynowy',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Nazwa magazynu lub budynku (np. Magazyn Główny UR).',
  },
  {
    key: 'location',
    label: 'Lokalizacja (Regał / Półka / Kuweta)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Dokładne miejsce składowania na magazynie (np. Regał R-04 / Półka P-02).',
  },
  {
    key: 'expirationDate',
    label: 'Data ważności (RRRR-MM-DD)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE',
    legendDesc: 'Opcjonalna data ważności partii początkowej w formacie RRRR-MM-DD.',
  },
  {
    key: 'compatibleMachines',
    label: 'Kompatybilne urządzenia (nazwy lub nr wew. po przecinku)',
    required: false,
    requirementLevel: 'optional',
    requirementBadge: 'OPCJONALNE (MOŻNA DODAĆ PÓŹNIEJ)',
    legendDesc:
      'Możesz podać nazwy lub numery wewnętrzne urządzeń/podzespołów po przecinku (np. UR-101, UR-102) ALBO zostawić puste i przypisać kompatybilne urządzenia później w edycji części.',
  },
];

const MACHINE_HEADER_ALIASES = {
  name: [
    'nazwa urządzenia',
    'nazwa urzadzenia',
    'nazwa urządzenia *',
    'nazwa maszyny',
    'nazwa',
    'urządzenie',
    'urzadzenie',
    'maszyna',
    'name',
    'machine name',
    'środek trwały',
    'srodek trwaly',
    'pojazd',
  ],
  regionName: [
    'miejsce montażu',
    'miejsce montazu',
    'miejsce montażu *',
    'miejsce montażu (rejon)',
    'rejon',
    'lokalizacja',
    'wydział',
    'wydzial',
    'hala',
    'budynek',
    'region',
    'location',
    'rejon / miejsce montażu',
  ],
  parentMachine: [
    'urządzenie nadrzędne',
    'urzadzenie nadrzedne',
    'urządzenie nadrzędne (nazwa lub nr wew.)',
    'maszyna nadrzędna',
    'maszyna główna',
    'urządzenie główne',
    'podlega pod',
    'parent',
    'parent machine',
    'parent id',
    'nadrzędne',
  ],
  internalId: [
    'numer wewnętrzny',
    'numer wew.',
    'numer wew',
    'nr wew.',
    'nr wew',
    'nr inwentarzowy',
    'numer inwentarzowy',
    'id wewnętrzne',
    'internal id',
    'kod urządzenia',
    'nr ur',
    'numer ur',
  ],
  bay: [
    'informacja dodatkowa',
    'stanowisko',
    'piętro',
    'pietro',
    'przelot',
    'gniazdo',
    'bay',
    'hala / piętro',
    'lokalizacja szczegółowa',
  ],
  assetCategory: [
    'kategoria',
    'kategoria zasobu',
    'typ zasobu',
    'typ',
    'category',
    'asset category',
    'rodzaj',
  ],
  currentWorkHours: [
    'stan licznika',
    'licznik',
    'rbg',
    'przebieg',
    'km',
    'mth',
    'motogodziny',
    'work hours',
    'counter',
    'stan licznika (rbg / km)',
  ],
  counterUnit: ['jednostka licznika', 'jednostka', 'unit', 'counter unit', 'j.m. licznika'],
  additionalDescription: [
    'dodatkowy opis',
    'opis',
    'uwagi',
    'notatka',
    'description',
    'notes',
    'additional description',
  ],
  licensePlate: [
    'nr rejestracyjny',
    'numer rejestracyjny',
    'tablica rejestracyjna',
    'tablica',
    'rejestracja',
    'license plate',
    'plate',
  ],
  vinNumber: ['vin', 'numer vin', 'nr vin', 'vin number'],
  productionYear: ['rok produkcji', 'rocznik', 'production year', 'year'],
  techInspectionDate: [
    'data badania skp',
    'badanie techniczne',
    'przegląd skp',
    'skp',
    'udt',
    'data badania skp / udt',
    'tech inspection date',
  ],
  insuranceExpiryDate: [
    'data końca oc/ac',
    'polisa oc/ac',
    'data końca oc',
    'data oc',
    'ubezpieczenie',
    'oc/ac',
    'insurance expiry date',
  ],
  needsVerification: [
    'do weryfikacji',
    'weryfikacja',
    'status weryfikacji',
    'status',
    'verify',
    'needs verification',
  ],
  ifcGlobalId: [
    'ifcglobalid',
    'globalid',
    'ifc global id',
    'ifc guid',
    'bim guid',
    'bim id',
    'guid bim',
    'id bim',
  ],
  ifcX: ['ifcx', 'ifc x', 'współrzędna x', 'wspolrzedna x', 'bim x', 'x (ifc)', 'easting', 'x [m]'],
  ifcY: ['ifcy', 'ifc y', 'współrzędna y', 'wspolrzedna y', 'bim y', 'y (ifc)', 'northing', 'y [m]'],
  ifcZ: ['ifcz', 'ifc z', 'współrzędna z', 'wspolrzedna z', 'rzędna z', 'rzedna z', 'bim z', 'elevation', 'z [m]'],
  ifcStorey: [
    'ifcstorey',
    'ifcbuildingstorey',
    'kondygnacja bim',
    'poziom bim',
    'kondygnacja ifc',
    'storey',
    'floor',
  ],
};

const PART_HEADER_ALIASES = {
  name: [
    'nazwa części',
    'nazwa czesci',
    'nazwa części *',
    'nazwa',
    'część',
    'czesc',
    'materiał',
    'material',
    'asortyment',
    'name',
    'part name',
  ],
  code: [
    'kod magazynowy',
    'kod magazynowy *',
    'kod części',
    'kod czesci',
    'kod',
    'indeks',
    'sku',
    'part number',
    'nr katalogowy',
    'symbol',
    'code',
  ],
  stock: [
    'stan początkowy',
    'stan poczatkowy',
    'stan początkowy *',
    'stan początkowy (fizyczny) *',
    'stan fizyczny',
    'stan',
    'ilość',
    'ilosc',
    'stock',
    'quantity',
    'qty',
  ],
  unit: ['jednostka', 'jednostka miary', 'j.m.', 'jm', 'unit'],
  minStock: [
    'stan minimalny',
    'stan minimalny (alarmowy)',
    'minimum',
    'min',
    'min.',
    'min stock',
    'stan min.',
    'stan min',
  ],
  unitPrice: [
    'cena jedn. netto (pln)',
    'cena jedn. netto',
    'cena jedn.',
    'cena jednostkowa',
    'cena netto',
    'cena',
    'cena (pln)',
    'price',
    'unit price',
  ],
  building: ['budynek magazynowy', 'budynek', 'magazyn', 'hala magazynowa', 'building', 'warehouse'],
  location: [
    'lokalizacja',
    'lokalizacja (regał/półka)',
    'lokalizacja (regał / półka / kuweta)',
    'regał/półka',
    'regał',
    'regal',
    'półka',
    'polka',
    'kuweta',
    'location',
    'shelf',
  ],
  expirationDate: [
    'data ważności',
    'data waznosci',
    'ważność',
    'termin ważności',
    'expiration date',
    'expiry',
  ],
  compatibleMachines: [
    'kompatybilne urządzenia',
    'kompatybilne urzadzenia',
    'urządzenia',
    'maszyny',
    'pasuje do',
    'compatible machines',
  ],
};

const normalizeHeader = str =>
  String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * Zwraca informację o urządzeniu nadrzędnym (lub pełnej ścieżce nadrzędnej), pod które podlega dany podzespół.
 * Używane m.in. na liście kompatybilności części zamiennych.
 */
export function getMachineParentHierarchyInfo(machine, allMachines = []) {
  if (!machine || !machine.parentId) {
    return {
      isChild: false,
      parentMachine: null,
      parentName: '',
      parentLabel: '',
      fullHierarchyLabel: machine?.name || '',
    };
  }

  const byId = new Map();
  (allMachines || []).forEach(m => {
    if (m?.id) byId.set(m.id, m);
  });

  const directParent = byId.get(machine.parentId) || null;
  if (!directParent) {
    return {
      isChild: true,
      parentMachine: null,
      parentName: '',
      parentLabel: '',
      fullHierarchyLabel: machine.name || '',
    };
  }

  const chain = [];
  let cursor = directParent;
  const visited = new Set([machine.id]);
  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    const labelWithCode = cursor.internalId
      ? `${cursor.name} (${cursor.internalId})`
      : cursor.name;
    chain.unshift(labelWithCode);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : null;
  }

  const parentLabel = chain.join(' → ');
  return {
    isChild: true,
    parentMachine: directParent,
    parentName: directParent.name || '',
    parentInternalId: directParent.internalId || '',
    parentLabel,
    fullHierarchyLabel: `${machine.name} (Podlega pod: ${parentLabel})`,
  };
}

/**
 * Sprawdza, czy urządzenie jest niekompletne i NIE powinno mieć jeszcze aktywnego kodu QR do wydruku.
 * Warunek: brak przypisanego rejonu (`!regionId`), flaga `needsVerification === true` lub dopisek `(DO WERYFIKACJI)` w nazwie.
 */
export function isMachineIncompleteForQr(machine) {
  if (!machine) return true;
  if (machine.needsVerification === true) return true;
  const nameUpper = String(machine.name || '').toUpperCase();
  if (nameUpper.includes('(DO WERYFIKACJI)')) return true;
  const regionId = String(machine.regionId || '').trim();
  if (!regionId) {
    if (machine.qrCode && String(machine.qrCode).trim().length > 0 && machine.qrCreatedAt !== null) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Automatycznie dopasowuje nagłówki kolumn z pliku Excel/CSV do pól systemowych VexoNT.
 */
export function autoDetectColumnMapping(headers = [], mode = 'machines') {
  const aliasesMap = mode === 'parts' ? PART_HEADER_ALIASES : MACHINE_HEADER_ALIASES;
  const mapping = {};
  const usedHeaders = new Set();

  const normalizedHeaders = headers.map(h => ({
    raw: h,
    norm: normalizeHeader(h),
  }));

  Object.entries(aliasesMap).forEach(([fieldKey, aliases]) => {
    // 1. Dokładne dopasowanie
    const exactMatch = normalizedHeaders.find(
      h => !usedHeaders.has(h.raw) && aliases.includes(h.norm)
    );
    if (exactMatch) {
      mapping[fieldKey] = exactMatch.raw;
      usedHeaders.add(exactMatch.raw);
      return;
    }

    // 2. Dopasowanie częściowe (zawieranie słowa kluczowego)
    const partialMatch = normalizedHeaders.find(
      h =>
        !usedHeaders.has(h.raw) &&
        aliases.some(alias => alias.length >= 3 && h.norm.includes(alias))
    );
    if (partialMatch) {
      mapping[fieldKey] = partialMatch.raw;
      usedHeaders.add(partialMatch.raw);
    }
  });

  return mapping;
}

function normalizeAssetCategory(rawVal, licensePlateVal, industryProfile = 'industrial') {
  const v = String(rawVal || '')
    .trim()
    .toLowerCase();
  if (
    v === 'vehicle' ||
    v === 'pojazd' ||
    v === 'samochód' ||
    v === 'samochod' ||
    v === 'flota' ||
    v === 'auto' ||
    (licensePlateVal && String(licensePlateVal).trim().length > 0)
  ) {
    return 'vehicle';
  }
  if (
    industryProfile !== 'industrial' &&
    (v === 'hvac' || v === 'klimatyzacja' || v === 'pompa ciepła' || v === 'chłodnictwo')
  ) {
    return 'hvac';
  }
  return 'device';
}

function parseNumericValue(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number' && !isNaN(val)) return val;
  const cleaned = String(val)
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? fallback : num;
}

/**
 * Przygotowuje podgląd i walidację wierszy dla masowego importu Urządzeń / Pojazdów (wraz z podzespołami parentMachine).
 * Zasada QR:
 * - Jeśli wiersz ma nazwę i rejon (własny lub odziedziczony po urządzeniu nadrzędnym) oraz nie jest oznaczony jako "do weryfikacji" ->
 *   otrzymuje `qrReady: true` (kod QR zostanie wygenerowany od razu).
 * - Jeśli brakuje rejonu lub wiersz jest oznaczony jako "do weryfikacji" ->
 *   otrzymuje dopisek `(DO WERYFIKACJI)` w nazwie, `needsVerification: true`, `qrReady: false` (`qrCreatedAt: null`).
 */
export function prepareMachinesImportPreview(
  rawRows = [],
  columnMap = {},
  {
    existingMachines = [],
    existingRegions = [],
    duplicateStrategy = 'skip', // 'skip' | 'update'
    industryProfile = 'industrial',
  } = {}
) {
  const activeMachines = (existingMachines || []).filter(m => !m.isDeleted);
  const regionsByName = new Map();
  (existingRegions || [])
    .filter(r => !r.isDeleted && r.name)
    .forEach(r => {
      regionsByName.set(String(r.name).trim().toLowerCase(), r);
    });

  // Krok 1: Zbudowanie indeksu urządzeń z tego samego pliku (aby podzespół mógł wskazywać na maszynę główną z tego samego arkusza!)
  const inFileByKey = new Map();
  rawRows.forEach((rawRow, idx) => {
    const getVal = fieldKey => {
      const colName = columnMap[fieldKey];
      if (!colName || rawRow[colName] === undefined || rawRow[colName] === null) return '';
      return String(rawRow[colName]).trim();
    };
    const rName = getVal('name')
      .replace(/\(DO WERYFIKACJI\)/gi, '')
      .trim();
    const rInternalId = getVal('internalId');
    const rRegionName = getVal('regionName');
    const rBay = getVal('bay');
    if (!rName) return;
    const entry = {
      rowIndex: idx + 1,
      name: rName,
      internalId: rInternalId,
      regionName: rRegionName,
      bay: rBay,
    };
    inFileByKey.set(rName.toLowerCase(), entry);
    if (rInternalId) {
      inFileByKey.set(rInternalId.toLowerCase(), entry);
    }
  });

  const newRegionsSet = new Map(); // lowerName -> displayName
  const rows = [];
  let readyWithQrCount = 0;
  let incompleteWithoutQrCount = 0;
  let subassembliesCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  rawRows.forEach((rawRow, idx) => {
    const getVal = fieldKey => {
      const colName = columnMap[fieldKey];
      if (!colName || rawRow[colName] === undefined || rawRow[colName] === null) return '';
      return String(rawRow[colName]).trim();
    };

    const rawName = getVal('name');
    if (!rawName) {
      skipCount += 1;
      rows.push({
        rowIndex: idx + 1,
        status: 'skip',
        reason: 'Brak nazwy urządzenia (pusty wiersz)',
        name: '-',
      });
      return;
    }

    const rawParentRef = getVal('parentMachine');
    let resolvedParentId = null;
    let resolvedParentRowIndex = null;
    let resolvedParentDisplay = '';
    let inheritedRegionId = '';
    let inheritedRegionName = '';
    let inheritedBay = '';

    if (rawParentRef) {
      const parentKey = rawParentRef
        .replace(/\(DO WERYFIKACJI\)/gi, '')
        .trim()
        .toLowerCase();
      // 1. Szukaj w istniejącej bazie urządzeń
      const existingParent = activeMachines.find(m => {
        const mName = String(m.name || '')
          .replace(/\(DO WERYFIKACJI\)/gi, '')
          .trim()
          .toLowerCase();
        const mInternal = String(m.internalId || '')
          .trim()
          .toLowerCase();
        return mName === parentKey || (mInternal && mInternal === parentKey);
      });

      if (existingParent) {
        resolvedParentId = existingParent.id;
        resolvedParentDisplay = existingParent.internalId
          ? `${existingParent.name} (${existingParent.internalId})`
          : existingParent.name;
        inheritedRegionId = existingParent.regionId || '';
        inheritedBay = existingParent.bay || '';
      } else if (inFileByKey.has(parentKey)) {
        // 2. Szukaj wśród urządzeń importowanych w tym samym pliku Excel
        const fileParent = inFileByKey.get(parentKey);
        if (fileParent && fileParent.rowIndex !== idx + 1) {
          resolvedParentRowIndex = fileParent.rowIndex;
          resolvedParentDisplay = `${fileParent.name}${
            fileParent.internalId ? ` (${fileParent.internalId})` : ''
          } [wiersz #${fileParent.rowIndex}]`;
          inheritedRegionName = fileParent.regionName || '';
          inheritedBay = fileParent.bay || '';
        }
      }
    }

    const rawRegionName = getVal('regionName') || inheritedRegionName;
    const internalId = getVal('internalId');
    const bay = getVal('bay') || inheritedBay;
    const licensePlate = getVal('licensePlate').toUpperCase();
    const vinNumber = getVal('vinNumber').toUpperCase();
    const assetCategory = normalizeAssetCategory(
      getVal('assetCategory'),
      licensePlate,
      industryProfile
    );
    const currentWorkHours = Math.max(0, parseNumericValue(getVal('currentWorkHours'), 0));
    const rawUnit = getVal('counterUnit');
    const counterUnit =
      rawUnit === 'km' || rawUnit === 'RBG'
        ? rawUnit
        : assetCategory === 'vehicle'
        ? 'km'
        : 'RBG';
    const additionalDescription = getVal('additionalDescription');
    const productionYear = getVal('productionYear');
    const techInspectionDate = getVal('techInspectionDate');
    const insuranceExpiryDate = getVal('insuranceExpiryDate');
    const rawVerifyFlag = getVal('needsVerification').toLowerCase();
    const ifcGlobalId = getVal('ifcGlobalId');
    const rawIfcX = getVal('ifcX');
    const rawIfcY = getVal('ifcY');
    const rawIfcZ = getVal('ifcZ');
    const ifcStorey = getVal('ifcStorey');
    const ifcX = rawIfcX !== '' ? parseNumericValue(rawIfcX, null) : null;
    const ifcY = rawIfcY !== '' ? parseNumericValue(rawIfcY, null) : null;
    const ifcZ = rawIfcZ !== '' ? parseNumericValue(rawIfcZ, null) : null;

    // Rozpoznanie rejonu (własnego lub odziedziczonego po urządzeniu nadrzędnym)
    let resolvedRegionId = '';
    let resolvedRegionLabel = '';
    let newRegionToCreate = '';

    if (rawRegionName) {
      const lowerReg = rawRegionName.toLowerCase();
      if (
        lowerReg === 'mapa główna' ||
        lowerReg === 'mapa glowna' ||
        lowerReg === 'cała firma' ||
        lowerReg === 'cala firma' ||
        lowerReg === 'main_map'
      ) {
        resolvedRegionId = 'main_map';
        resolvedRegionLabel = assetCategory === 'vehicle' ? 'Cała Firma' : 'Mapa Główna';
      } else if (regionsByName.has(lowerReg)) {
        const reg = regionsByName.get(lowerReg);
        resolvedRegionId = reg.id;
        resolvedRegionLabel = reg.name;
      } else {
        newRegionToCreate = rawRegionName;
        resolvedRegionLabel = `${rawRegionName} (Nowy rejon)`;
        if (!newRegionsSet.has(lowerReg)) {
          newRegionsSet.set(lowerReg, rawRegionName);
        }
      }
    } else if (inheritedRegionId) {
      resolvedRegionId = inheritedRegionId;
      const existingReg = (existingRegions || []).find(r => r.id === inheritedRegionId);
      resolvedRegionLabel = existingReg
        ? `${existingReg.name} (z urządzenia nadrzędnego)`
        : inheritedRegionId === 'main_map'
        ? 'Mapa Główna (z urządzenia nadrzędnego)'
        : inheritedRegionId;
    }

    const markedUnverifiedInFile =
      rawName.toUpperCase().includes('(DO WERYFIKACJI)') ||
      rawVerifyFlag === 'tak' ||
      rawVerifyFlag === 'true' ||
      rawVerifyFlag === '1' ||
      rawVerifyFlag.includes('weryfikac');

    const hasRegion = Boolean(resolvedRegionId || newRegionToCreate);
    // Jeśli podano parentMachine w arkuszu, ale nie udało się go znaleźć ani w bazie ani w pliku -> oznacz do weryfikacji
    const unresolvedParentRef = Boolean(
      rawParentRef && !resolvedParentId && !resolvedParentRowIndex
    );
    const isIncomplete = !hasRegion || markedUnverifiedInFile || unresolvedParentRef;

    let finalName = rawName.replace(/\(DO WERYFIKACJI\)/gi, '').trim();
    if (isIncomplete) {
      finalName = `${finalName} (DO WERYFIKACJI)`;
    }

    if (resolvedParentId || resolvedParentRowIndex) {
      subassembliesCount += 1;
    }

    // Sprawdzenie duplikatów (po nr rejestracyjnym, nr wewnętrznym lub dokładnej nazwie)
    const cleanPlate = licensePlate.replace(/[\s-]/g, '');
    const cleanBaseName = rawName.replace(/\(DO WERYFIKACJI\)/gi, '').trim().toLowerCase();

    const duplicateMachine = activeMachines.find(m => {
      if (ifcGlobalId && m.ifcGlobalId) {
        if (String(m.ifcGlobalId).trim() === ifcGlobalId.trim()) return true;
      }
      if (cleanPlate && m.licensePlate) {
        const mPlate = String(m.licensePlate).toUpperCase().replace(/[\s-]/g, '');
        if (mPlate === cleanPlate) return true;
      }
      if (internalId && m.internalId) {
        if (String(m.internalId).trim().toLowerCase() === internalId.toLowerCase()) return true;
      }
      const mBaseName = String(m.name || '')
        .replace(/\(DO WERYFIKACJI\)/gi, '')
        .trim()
        .toLowerCase();
      if (mBaseName === cleanBaseName && (!internalId || !m.internalId)) {
        return true;
      }
      return false;
    });

    const autoWgs =
      ifcX !== null && ifcY !== null && isPuwg2000CoordinatePair(ifcX, ifcY)
        ? puwg2000ToWgs84(ifcX, ifcY)
        : null;

    const payload = {
      name: finalName,
      regionId: resolvedRegionId,
      parentId: assetCategory === 'vehicle' ? null : resolvedParentId || null,
      internalId,
      bay,
      assetCategory,
      currentWorkHours,
      counterUnit,
      additionalDescription,
      licensePlate: assetCategory === 'vehicle' ? licensePlate : '',
      vinNumber: assetCategory === 'vehicle' ? vinNumber : '',
      productionYear: assetCategory === 'vehicle' ? productionYear : '',
      techInspectionDate: assetCategory === 'vehicle' ? techInspectionDate : '',
      insuranceExpiryDate: assetCategory === 'vehicle' ? insuranceExpiryDate : '',
      ...(ifcGlobalId ? { ifcGlobalId } : {}),
      ...(ifcX !== null ? { ifcX } : {}),
      ...(ifcY !== null ? { ifcY } : {}),
      ...(ifcZ !== null ? { ifcZ } : {}),
      ...(ifcStorey ? { ifcStorey } : {}),
      ...(autoWgs ? { lat: autoWgs.lat, lng: autoWgs.lng } : {}),
      needsVerification: isIncomplete,
      isDeleted: false,
    };

    if (duplicateMachine) {
      if (duplicateStrategy === 'update') {
        updateCount += 1;
        rows.push({
          rowIndex: idx + 1,
          status: 'update',
          existingId: duplicateMachine.id,
          qrReady: !isIncomplete,
          isIncomplete,
          newRegionToCreate,
          parentRowIndex: resolvedParentRowIndex,
          parentDisplay: resolvedParentDisplay,
          regionDisplay: resolvedRegionLabel || 'Brak rejonu (DO WERYFIKACJI)',
          reason: `Aktualizacja istniejącego urządzenia (${duplicateMachine.name})`,
          payload,
          ...payload,
        });
      } else {
        skipCount += 1;
        rows.push({
          rowIndex: idx + 1,
          status: 'skip',
          existingId: duplicateMachine.id,
          qrReady: false,
          isIncomplete,
          parentRowIndex: resolvedParentRowIndex,
          parentDisplay: resolvedParentDisplay,
          regionDisplay: resolvedRegionLabel || '-',
          reason: `Duplikat w bazie (${duplicateMachine.name}) — pominięto`,
          payload,
          ...payload,
        });
      }
      return;
    }

    if (isIncomplete) {
      incompleteWithoutQrCount += 1;
      rows.push({
        rowIndex: idx + 1,
        status: 'incomplete',
        qrReady: false,
        isIncomplete: true,
        newRegionToCreate,
        parentRowIndex: resolvedParentRowIndex,
        parentDisplay:
          resolvedParentDisplay ||
          (unresolvedParentRef ? `Nie znaleziono nadrzędnego: "${rawParentRef}"` : ''),
        regionDisplay: resolvedRegionLabel || 'Brak rejonu',
        reason: unresolvedParentRef
          ? `Nie znaleziono urządzenia nadrzędnego "${rawParentRef}" — dodano jako (DO WERYFIKACJI)`
          : !hasRegion
          ? 'Brak rejonu — zostanie dodane jako (DO WERYFIKACJI) bez kodu QR'
          : 'Oznaczone do weryfikacji — kod QR zostanie wygenerowany po weryfikacji',
        payload,
        ...payload,
      });
    } else {
      readyWithQrCount += 1;
      rows.push({
        rowIndex: idx + 1,
        status: 'ready',
        qrReady: true,
        isIncomplete: false,
        newRegionToCreate,
        parentRowIndex: resolvedParentRowIndex,
        parentDisplay: resolvedParentDisplay,
        regionDisplay: resolvedRegionLabel,
        reason: 'Komplet danych — kod QR zostanie wygenerowany automatycznie',
        payload,
        ...payload,
      });
    }
  });

  return {
    rows,
    summary: {
      totalRows: rawRows.length,
      readyWithQrCount,
      incompleteWithoutQrCount,
      subassembliesCount,
      createTotalCount: readyWithQrCount + incompleteWithoutQrCount,
      updateCount,
      skipCount,
      newRegions: Array.from(newRegionsSet.values()),
    },
  };
}

const VALID_UNITS = ['szt.', 'kg', 'L', 'm', 'm2', 'opak.', 'kpl.'];
function normalizePartUnit(raw) {
  const v = String(raw || '').trim();
  if (!v) return 'szt.';
  const lower = v.toLowerCase();
  if (lower === 'szt' || lower === 'szt.' || lower === 'pcs' || lower === 'sztuk') return 'szt.';
  if (lower === 'kg' || lower === 'kilogram') return 'kg';
  if (lower === 'l' || lower === 'litr' || lower === 'litrów') return 'L';
  if (lower === 'm' || lower === 'mb') return 'm';
  if (lower === 'm2') return 'm2';
  if (lower === 'opak' || lower === 'opak.') return 'opak.';
  if (lower === 'kpl' || lower === 'kpl.' || lower === 'komplet') return 'kpl.';
  return VALID_UNITS.includes(v) ? v : 'szt.';
}

/**
 * Przygotowuje podgląd i walidację wierszy dla masowego importu Części Magazynowych.
 */
export function preparePartsImportPreview(
  rawRows = [],
  columnMap = {},
  {
    existingParts = [],
    existingMachines = [],
    duplicateStrategy = 'skip', // 'skip' | 'update'
  } = {}
) {
  const activeMachines = (existingMachines || []).filter(m => !m.isDeleted);
  const rows = [];
  let createCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  rawRows.forEach((rawRow, idx) => {
    const getVal = fieldKey => {
      const colName = columnMap[fieldKey];
      if (!colName || rawRow[colName] === undefined || rawRow[colName] === null) return '';
      return String(rawRow[colName]).trim();
    };

    const name = getVal('name');
    const code = getVal('code');

    if (!name && !code) {
      skipCount += 1;
      rows.push({
        rowIndex: idx + 1,
        status: 'skip',
        reason: 'Pusty wiersz (brak nazwy i kodu części)',
        name: '-',
        code: '-',
      });
      return;
    }

    const finalName = name || code;
    const finalCode = code || `PART-${idx + 1}`;
    const stock = Math.max(0, parseNumericValue(getVal('stock'), 0));
    const minStock = Math.max(0, parseNumericValue(getVal('minStock'), 0));
    const unitPrice = Math.max(0, parseNumericValue(getVal('unitPrice'), 0));
    const unit = normalizePartUnit(getVal('unit'));
    const building = getVal('building');
    const location = getVal('location');
    const expirationDate = getVal('expirationDate') || null;
    const rawCompat = getVal('compatibleMachines');

    const compatibleMachines = [];
    if (rawCompat) {
      const tokens = rawCompat
        .split(/[,;]/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      tokens.forEach(tok => {
        const matched = activeMachines.find(
          m =>
            String(m.name || '')
              .trim()
              .toLowerCase() === tok ||
            String(m.internalId || '')
              .trim()
              .toLowerCase() === tok ||
            String(m.licensePlate || '')
              .trim()
              .toLowerCase() === tok
        );
        if (matched && !compatibleMachines.includes(matched.id)) {
          compatibleMachines.push(matched.id);
        }
      });
    }

    const duplicatePart = (existingParts || []).find(p => {
      if (finalCode && p.code && String(p.code).trim().toLowerCase() === finalCode.toLowerCase()) {
        return true;
      }
      return false;
    });

    const nowIso = new Date().toISOString();
    const payload = {
      name: finalName,
      code: finalCode,
      stock,
      minStock,
      unitPrice,
      unit,
      building,
      location,
      expirationDate,
      compatibleMachines,
      batches:
        stock > 0
          ? [
              {
                qty: stock,
                price: unitPrice,
                date: nowIso,
                expirationDate: expirationDate || null,
              },
            ]
          : [],
    };

    if (duplicatePart) {
      if (duplicateStrategy === 'update') {
        updateCount += 1;
        rows.push({
          rowIndex: idx + 1,
          status: 'update',
          existingId: duplicatePart.id,
          reason: `Aktualizacja części o kodzie ${finalCode}`,
          payload,
          ...payload,
        });
      } else {
        skipCount += 1;
        rows.push({
          rowIndex: idx + 1,
          status: 'skip',
          existingId: duplicatePart.id,
          reason: `Duplikat kodu magazynowego (${finalCode}) — pominięto`,
          payload,
          ...payload,
        });
      }
      return;
    }

    createCount += 1;
    rows.push({
      rowIndex: idx + 1,
      status: 'ready',
      reason:
        stock > 0
          ? `Nowa część + partia początkowa FIFO (${stock} ${unit}) + kod QR`
          : 'Nowa część (stan 0) + kod QR',
      payload,
      ...payload,
    });
  });

  return {
    rows,
    summary: {
      totalRows: rawRows.length,
      createCount,
      updateCount,
      skipCount,
    },
  };
}

/**
 * Zwraca wiersze Legendy Kolumn (używane zarówno w drugim arkuszu pliku Excel "Legenda_Kolumn", jak i w UI kreatora).
 */
export function getImportLegendRows(mode = 'machines') {
  const fields = mode === 'parts' ? PART_IMPORT_FIELDS : MACHINE_IMPORT_FIELDS;
  return fields.map(f => ({
    Kolumna: f.label,
    Wymagalność: f.requirementBadge,
    'Opis i zasady importu': f.legendDesc,
  }));
}

/**
 * Generuje przykładowe wiersze szablonu Excel (.xlsx) do pobrania dla klienta.
 */
export function getSampleTemplateRows(mode = 'machines', industryProfile = 'industrial') {
  if (mode === 'parts') {
    return [
      {
        'Nazwa części *': 'Łożysko kulkowe 6205-2RS SKF',
        'Kod magazynowy *': 'LOZ-6205-2RS',
        'Stan początkowy *': 12,
        'Jednostka miary': 'szt.',
        'Stan minimalny': 4,
        'Cena jedn. netto (PLN)': 28.5,
        'Budynek magazynowy': 'Magazyn Główny UR',
        'Lokalizacja (Regał/Półka)': 'R-04 / P-02',
        'Data ważności': '',
        'Kompatybilne urządzenia': 'UR-001, UR-001-CHILL',
      },
      {
        'Nazwa części *': 'Olej hydrauliczny HVLP 46 (Kompatybilne urządzenia można też przypisać później)',
        'Kod magazynowy *': 'OLEJ-HVLP-46',
        'Stan początkowy *': 60,
        'Jednostka miary': 'L',
        'Stan minimalny': 20,
        'Cena jedn. netto (PLN)': 14.2,
        'Budynek magazynowy': 'Magazyn Olejowy',
        'Lokalizacja (Regał/Półka)': 'Strefa B',
        'Data ważności': '2028-12-31',
        'Kompatybilne urządzenia': '',
      },
    ];
  }

  if (industryProfile === 'fleet') {
    return [
      {
        'Nazwa urządzenia *': 'Volkswagen Crafter 2.0 TDI Brygadówka',
        'Miejsce montażu (Rejon)': 'Cała Firma',
        'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
        'Numer wewnętrzny': 'FLOTA-01',
        'Informacja dodatkowa': 'Brygada Serwisowa Północ',
        'Kategoria zasobu': 'vehicle',
        'Stan licznika': 142500,
        'Jednostka licznika': 'km',
        'Nr rejestracyjny': 'GD 3V975',
        'Numer VIN': 'WV1ZZZSYZ09012345',
        'Rok produkcji': '2023',
        'Data badania SKP': '2027-04-15',
        'Data końca OC/AC': '2027-03-31',
        'Dodatkowy opis': 'Samochód serwisowy z zabudową warsztatową',
        'Do weryfikacji': '',
      },
      {
        'Nazwa urządzenia *': 'Ford Transit Custom (Brak oddziału — trafi do weryfikacji bez QR)',
        'Miejsce montażu (Rejon)': '',
        'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
        'Numer wewnętrzny': 'FLOTA-02',
        'Informacja dodatkowa': '',
        'Kategoria zasobu': 'vehicle',
        'Stan licznika': 15,
        'Jednostka licznika': 'km',
        'Nr rejestracyjny': 'WE 8842K',
        'Numer VIN': 'WF0XXXTTGX0098765',
        'Rok produkcji': '2026',
        'Data badania SKP': '2028-01-10',
        'Data końca OC/AC': '2027-01-10',
        'Dodatkowy opis': 'Brak rejonu -> zostanie zaimportowany jako (DO WERYFIKACJI) bez kodu QR',
        'Do weryfikacji': 'TAK',
      },
    ];
  }

  return [
    {
      'Nazwa urządzenia *': 'Wycinarka laserowa Nukon Extreme 30250',
      'Miejsce montażu (Rejon)': 'Hala Cięcia',
      'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
      'Numer wewnętrzny': 'UR-001',
      'Informacja dodatkowa': 'Nawa A / Stanowisko 1',
      'Kategoria zasobu': 'device',
      'Stan licznika': 4250,
      'Jednostka licznika': 'RBG',
      'Dodatkowy opis': 'Główne urządzenie — otrzyma kod QR',
      'Do weryfikacji': '',
    },
    {
      'Nazwa urządzenia *': 'Chiller chłodzący źrodło lasera (Podzespół)',
      'Miejsce montażu (Rejon)': 'Hala Cięcia',
      'Urządzenie nadrzędne (Nazwa lub Nr wew.)': 'UR-001',
      'Numer wewnętrzny': 'UR-001-CHILL',
      'Informacja dodatkowa': 'Nawa A / Przy laserze',
      'Kategoria zasobu': 'device',
      'Stan licznika': 4250,
      'Jednostka licznika': 'RBG',
      'Dodatkowy opis': 'Podzespół podlegający pod urządzenie UR-001',
      'Do weryfikacji': '',
    },
    {
      'Nazwa urządzenia *': 'Suwnica pomostowa 16T (Brak rejonu - do uzupełnienia)',
      'Miejsce montażu (Rejon)': '',
      'Urządzenie nadrzędne (Nazwa lub Nr wew.)': '',
      'Numer wewnętrzny': 'UR-003',
      'Informacja dodatkowa': '',
      'Kategoria zasobu': 'device',
      'Stan licznika': 0,
      'Jednostka licznika': 'RBG',
      'Dodatkowy opis': 'Wiersz bez rejonu trafi do bazy jako (DO WERYFIKACJI) bez kodu QR',
      'Do weryfikacji': 'TAK',
    },
  ];
}
