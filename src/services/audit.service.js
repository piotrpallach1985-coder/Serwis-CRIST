import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../utils/tenantHelper';

export const logAudit = async (action, entityType, entityId, details = '') => {
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) return;

    const user = auth.currentUser;

    await addDoc(collection(db, 'tenants', tenantId, 'audit_logs'), {
      timestamp: serverTimestamp(),
      userId: user ? user.uid : 'public',
      userName: user ? (user.displayName || user.email || 'Użytkownik') : 'Zgłaszający ze skanera',
      action,
      entityType,
      entityId,
      details: typeof details === 'string' ? details : JSON.stringify(details),
    });
  } catch (err) {
    console.error("Błąd zapisu Audit Log:", err);
  }
};
