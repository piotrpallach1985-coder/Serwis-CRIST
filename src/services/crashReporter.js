import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../utils/tenantHelper';

let crashCount = 0;
const MAX_CRASHES = 5;

export const logCrashToFirebase = async (error, stackInfo = '', type = 'runtime') => {
  // Zabezpieczenie przed nieskończoną pętlą (Circuit Breaker)
  if (crashCount >= MAX_CRASHES) {
    console.warn("Zatrzymano raportowanie błędów do Firebase (przekroczono limit MAX_CRASHES).");
    return;
  }
  
  const errMsg = error?.message || String(error);
  
  // Ignorujemy błędy Firestore, żeby nie wpaść w pętlę przy braku dostępu
  if (errMsg.includes('Firestore') || errMsg.includes('Firebase') || errMsg.includes('Quota')) {
     console.error("Zignorowano błąd systemowy Firebase w Crash Reporterze:", error);
     return;
  }
  
  crashCount++;

  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) return;
    
    await addDoc(collection(db, 'tenants', tenantId, 'crash_reports'), {
      type,
      error: errMsg,
      stackTrace: error?.stack || stackInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      resolved: false
    });
  } catch (e) {
    console.error('Błąd raportowania crashy do Firebase:', e);
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
