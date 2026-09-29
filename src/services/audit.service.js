import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../utils/tenantHelper';

export const logAudit = async (action, entityType, entityId, details = '') => {
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) return;

    const user = auth.currentUser;
    if (!user) return; // Skip if no logged-in user

    await addDoc(collection(db, 'tenants', tenantId, 'audit_logs'), {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Użytkownik',
      action,
      entityType,
      entityId,
      details: typeof details === 'string' ? details : JSON.stringify(details),
    });
  } catch (err) {
    console.error("Błąd zapisu Audit Log:", err);
  }
};
