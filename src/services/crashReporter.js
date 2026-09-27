import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';


export const logCrashToFirebase = async (error, stackInfo = '', type = 'runtime') => {
  try {
    await addDoc(collection(db, 'tenants', getCurrentTenant(), 'crash_reports'), {
      type,
      error: error?.message || String(error),
      stackTrace: error?.stack || stackInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      resolved: false
    });
  } catch (e) {
    console.error('B��d raportowania crashy do Firebase:', e);
  }
};

export const initGlobalCrashReporting = () => {
  window.addEventListener('error', (event) => {
    logCrashToFirebase(event.error, '', 'window_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logCrashToFirebase(event.reason, '', 'unhandled_promise');
  });
};

