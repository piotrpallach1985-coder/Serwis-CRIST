import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { safeParseDate } from '../utils/dateHelpers';

const QR_BASE_URL = 'https://piotrpallach1985-coder.github.io/Serwis-CRIST';
const STORAGE_PREFIX = 'vexont_qr_key_';

export const PART_QR_IN_MACHINE_SCANNER_MSG =
  'Nie jest to maszyna tylko część - zaloguj się do konta UR';

const qrKeyMemoryCache = new Map();

export const getCachedQrKey = (tenantId) => {
  if (!tenantId) return null;
  return qrKeyMemoryCache.get(tenantId) || null;
};

export const saveOperatorQrKey = (tenantId, key) => {
  if (!tenantId || !key) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tenantId}`, key);
  } catch (e) {
    console.warn('Could not save operator QR key:', e);
  }
};

export const getOperatorQrKey = (tenantId) => {
  if (!tenantId) return null;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tenantId}`) || null;
  } catch {
    return null;
  }
};

export const clearOperatorQrKey = (tenantId) => {
  if (!tenantId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tenantId}`);
  } catch {
    // ignore
  }
};

export const generateQrKey = (len = 24) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, b => chars[b % chars.length]).join('');
};

export const resolveTenantDisplayName = (tenantId, branding) => {
  return branding?.companyName || branding?.name || (tenantId ? String(tenantId).toUpperCase() : 'FIRMA');
};

export const resolveEntityQrDate = (entityOrDate, allMachines = [], parentId = null) => {
  if (!entityOrDate) return null;
  if (typeof entityOrDate === 'object' && !(entityOrDate instanceof Date) && !entityOrDate.toDate && entityOrDate.seconds === undefined) {
    const entity = entityOrDate;
    const raw = entity.qrCreatedAt || entity.updatedAt || entity.createdAt;
    let d = safeParseDate(raw);
    if (!d && entity.parentId && Array.isArray(allMachines) && allMachines.length > 0) {
      let currParentId = entity.parentId;
      const visited = new Set();
      while (currParentId && !visited.has(currParentId)) {
        visited.add(currParentId);
        const parent = allMachines.find(m => m.id === currParentId);
        if (!parent) break;
        d = safeParseDate(parent.qrCreatedAt || parent.updatedAt || parent.createdAt);
        if (d) break;
        currParentId = parent.parentId;
      }
    }
    return d;
  }

  let d = safeParseDate(entityOrDate);
  if (!d && parentId && Array.isArray(allMachines) && allMachines.length > 0) {
    let currParentId = parentId;
    const visited = new Set();
    while (currParentId && !visited.has(currParentId)) {
      visited.add(currParentId);
      const parent = allMachines.find(m => m.id === currParentId);
      if (!parent) break;
      d = safeParseDate(parent.qrCreatedAt || parent.updatedAt || parent.createdAt);
      if (d) break;
      currParentId = parent.parentId;
    }
  }
  return d;
};

export const formatQrDate = (entityOrDate, allMachines = [], fallbackOrParentId = '') => {
  const isParentId =
    typeof fallbackOrParentId === 'string' &&
    Array.isArray(allMachines) &&
    allMachines.some(m => m.id === fallbackOrParentId);
  const parentId = isParentId ? fallbackOrParentId : null;
  const fallback = isParentId ? '' : (typeof fallbackOrParentId === 'string' ? fallbackOrParentId : '');

  const d = resolveEntityQrDate(entityOrDate, allMachines, parentId);
  if (!d) return fallback;
  return d.toLocaleDateString('pl-PL');
};

export const getMachineQrDateString = (machine, allMachines = [], fallback = '') => {
  if (!machine) return fallback;
  return formatQrDate(machine, allMachines, fallback);
};

export const getOrCreateQrKey = async (tenantId) => {
  if (!tenantId) return null;
  if (qrKeyMemoryCache.has(tenantId)) {
    return qrKeyMemoryCache.get(tenantId);
  }
  const ref = doc(db, 'tenants', tenantId, 'secrets', 'qr_key');
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data()?.key) {
    const k = snap.data().key;
    qrKeyMemoryCache.set(tenantId, k);
    return k;
  }
  const key = generateQrKey(24);
  await setDoc(ref, { key, updatedAt: serverTimestamp() });
  qrKeyMemoryCache.set(tenantId, key);
  return key;
};

export const rotateQrKey = async (tenantId) => {
  if (!tenantId) return null;
  const key = generateQrKey(24);
  const ref = doc(db, 'tenants', tenantId, 'secrets', 'qr_key');
  await setDoc(ref, { key, updatedAt: serverTimestamp() });
  qrKeyMemoryCache.set(tenantId, key);
  return key;
};

export const buildMachineQrValue = (arg1, arg2, qrKey, meta) => {
  const isFirstArgMachineObj = arg1 && typeof arg1 === 'object';
  const tenantId = isFirstArgMachineObj ? arg2 : arg1;
  const machineId = isFirstArgMachineObj ? arg1.id : arg2;
  const machineObj = isFirstArgMachineObj ? arg1 : null;

  const params = [
    `tenant=${encodeURIComponent(tenantId || '')}`,
    `machine=${encodeURIComponent(machineId || '')}`,
  ];
  if (qrKey) {
    params.push(`k=${encodeURIComponent(qrKey)}`);
  }

  if (meta && typeof meta === 'object') {
    const tenantName = meta.tenantName || resolveTenantDisplayName(tenantId, meta.branding);
    const machineName = meta.machineName || meta.name || machineObj?.name || '';
    const dateStr =
      typeof (meta.qrDate || meta.date) === 'string'
        ? (meta.qrDate || meta.date)
        : formatQrDate(
            meta.qrDate || meta.date || machineObj || meta.qrCreatedAt || meta.updatedAt || meta.createdAt,
            meta.allMachines || []
          );
    if (tenantName) params.push(`tn=${encodeURIComponent(tenantName)}`);
    if (machineName) params.push(`mn=${encodeURIComponent(machineName)}`);
    if (dateStr && dateStr !== '-') params.push(`dt=${encodeURIComponent(dateStr)}`);
    return `${QR_BASE_URL}/?${params.join('&')}`;
  }

  if (isFirstArgMachineObj) {
    const tenantName = resolveTenantDisplayName(tenantId, null);
    const machineName = machineObj?.name || '';
    const dateStr = formatQrDate(machineObj, []);
    if (tenantName) params.push(`tn=${encodeURIComponent(tenantName)}`);
    if (machineName) params.push(`mn=${encodeURIComponent(machineName)}`);
    if (dateStr) params.push(`dt=${encodeURIComponent(dateStr)}`);
    return `${QR_BASE_URL}/?${params.join('&')}`;
  }

  return params.join('&');
};

export const buildPartQrValue = (partOrTenantId, arg2, meta = {}) => {
  const isFirstArgPartObj = partOrTenantId && typeof partOrTenantId === 'object';
  const tenantId = isFirstArgPartObj ? arg2 : partOrTenantId;
  const partId = isFirstArgPartObj ? (partOrTenantId.id || partOrTenantId.code) : arg2;
  const partObj = isFirstArgPartObj ? partOrTenantId : null;

  const tenantName = meta.tenantName || resolveTenantDisplayName(tenantId, meta.branding);
  const partName = meta.partName || meta.name || partObj?.name || '';
  const partCode = meta.partCode || meta.code || partObj?.code || '';
  const dateStr =
    typeof (meta.qrDate || meta.date) === 'string'
      ? (meta.qrDate || meta.date)
      : formatQrDate(meta.qrDate || meta.date || partObj?.qrCreatedAt || partObj?.createdAt || partObj?.updatedAt || meta.qrCreatedAt || meta.createdAt || meta.updatedAt);

  const params = [
    `tenant=${encodeURIComponent(tenantId || '')}`,
    `part=${encodeURIComponent(partId || '')}`,
  ];
  if (partCode) params.push(`code=${encodeURIComponent(partCode)}`);
  if (tenantName) params.push(`tn=${encodeURIComponent(tenantName)}`);
  if (partName) params.push(`pn=${encodeURIComponent(partName)}`);
  if (dateStr && dateStr !== '-') params.push(`dt=${encodeURIComponent(dateStr)}`);

  return `${QR_BASE_URL}/?${params.join('&')}`;
};

export const parseQrPayload = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return { tenantId: null, machineId: null, key: null };
  }
  const text = rawText.trim();

  const tenantMatch = text.match(/[?&=#\s|^]tenant=([^&#\s]+)/i) || text.match(/^tenant=([^&#\s]+)/i);
  const machineMatch = text.match(/[?&=#\s|^]machine=([^&#\s]+)/i) || text.match(/^machine=([^&#\s]+)/i);
  const partMatch = text.match(/[?&=#\s|^]part=([^&#\s]+)/i) || text.match(/^part=([^&#\s]+)/i);
  const keyMatch = text.match(/[?&#\s|^]k=([^&#\s]+)/i) || text.match(/^k=([^&#\s]+)/i);
  const tnMatch = text.match(/[?&#\s|^]tn=([^&#\s]+)/i);
  const mnMatch = text.match(/[?&#\s|^]mn=([^&#\s]+)/i);
  const pnMatch = text.match(/[?&#\s|^]pn=([^&#\s]+)/i);
  const dtMatch = text.match(/[?&#\s|^]dt=([^&#\s]+)/i);

  if (partMatch) {
    return {
      tenantId: tenantMatch ? decodeURIComponent(tenantMatch[1]) : null,
      machineId: null,
      partId: decodeURIComponent(partMatch[1]),
      key: keyMatch ? decodeURIComponent(keyMatch[1]) : null,
      isPart: true,
      tenantName: tnMatch ? decodeURIComponent(tnMatch[1]) : null,
      itemName: pnMatch ? decodeURIComponent(pnMatch[1]) : null,
      qrDate: dtMatch ? decodeURIComponent(dtMatch[1]) : null,
    };
  }

  if (machineMatch) {
    const res = {
      tenantId: tenantMatch ? decodeURIComponent(tenantMatch[1]) : null,
      machineId: decodeURIComponent(machineMatch[1]),
      key: keyMatch ? decodeURIComponent(keyMatch[1]) : null,
    };
    if (tnMatch) res.tenantName = decodeURIComponent(tnMatch[1]);
    if (mnMatch) res.itemName = decodeURIComponent(mnMatch[1]);
    if (dtMatch) res.qrDate = decodeURIComponent(dtMatch[1]);
    return res;
  }

  if (!text.includes('=') && !text.includes('/')) {
    return { tenantId: null, machineId: text, key: null };
  }

  return { tenantId: null, machineId: null, key: null };
};
