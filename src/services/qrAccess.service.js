import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Klucz dostępu QR firmy (tenants/{tenantId}/settings/qr_access).
 * Kod QR maszyny zawiera: tenant=<id>&machine=<id>&k=<klucz>.
 * Anonimowy operator może powiązać sesję z firmą (anon_sessions/{uid}) TYLKO znając klucz –
 * weryfikują to reguły Firestore/Storage. Zmiana klucza unieważnia wszystkie sesje QR i stare naklejki.
 */

const keyCache = {};
const LS_PREFIX = 'vexo_qr_key_';

export const generateQrKey = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const qrAccessRef = (tenantId) => doc(db, 'tenants', tenantId, 'settings', 'qr_access');

/** Pobiera klucz QR firmy; jeśli nie istnieje – tworzy go (personel firmy). */
export const getOrCreateQrKey = async (tenantId) => {
  if (!tenantId) return null;
  if (keyCache[tenantId]) return keyCache[tenantId];
  const snap = await getDoc(qrAccessRef(tenantId));
  if (snap.exists() && snap.data().key) {
    keyCache[tenantId] = snap.data().key;
    return keyCache[tenantId];
  }
  const key = generateQrKey();
  try {
    await setDoc(qrAccessRef(tenantId), { key, createdAt: serverTimestamp() });
    keyCache[tenantId] = key;
    return key;
  } catch (e) {
    // Wyścig: ktoś inny utworzył klucz w międzyczasie
    const again = await getDoc(qrAccessRef(tenantId));
    if (again.exists() && again.data().key) {
      keyCache[tenantId] = again.data().key;
      return keyCache[tenantId];
    }
    throw e;
  }
};

/** Generuje nowy klucz (tylko admin). Wszystkie wydrukowane kody QR i sesje operatorów tracą ważność. */
export const rotateQrKey = async (tenantId) => {
  const key = generateQrKey();
  await setDoc(qrAccessRef(tenantId), { key, createdAt: serverTimestamp() });
  keyCache[tenantId] = key;
  return key;
};

/** Treść kodu QR / tagu NFC maszyny. */
export const buildMachineQrValue = (tenantId, machineId, key) =>
  `tenant=${tenantId}&machine=${machineId}${key ? `&k=${key}` : ''}`;

/** Parsuje treść QR: "tenant=X&machine=Y&k=Z", pełny URL z tymi parametrami lub samo ID maszyny. */
export const parseQrPayload = (text) => {
  const raw = String(text || '').trim();
  const get = (name) => {
    const m = raw.match(new RegExp('(?:^|[?&#])' + name + '=([^&#]+)'));
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  };
  const machineId = get('machine');
  return {
    tenantId: get('tenant'),
    machineId: machineId || (raw.includes('=') ? null : raw),
    key: get('k')
  };
};

/** Klucz zapamiętany na urządzeniu operatora po zeskanowaniu kodu QR danej firmy. */
export const getOperatorQrKey = (tenantId) => {
  try { return tenantId ? localStorage.getItem(LS_PREFIX + tenantId) : null; } catch { return null; }
};

export const saveOperatorQrKey = (tenantId, key) => {
  try { if (tenantId && key) localStorage.setItem(LS_PREFIX + tenantId, key); } catch { /* tryb prywatny */ }
};
