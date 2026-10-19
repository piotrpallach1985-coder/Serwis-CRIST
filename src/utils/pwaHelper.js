let deferredPrompt = null;
let isStandaloneInstalled = false;
const listeners = new Set();

export const isPWAStandalone = () => {
  if (typeof window === 'undefined') return false;
  if (isStandaloneInstalled) return true;
  const standaloneMedia =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches;
  return Boolean(standaloneMedia || window.navigator?.standalone === true);
};

const notifyListeners = () => {
  const state = {
    canInstall: Boolean(deferredPrompt),
    isInstalled: isPWAStandalone(),
  };
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (e) {
      // Ignore listener errors
    }
  });
};

let initialized = false;

export const initPWAInstallListener = () => {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isStandaloneInstalled = true;
    notifyListeners();
  });

  if (window.matchMedia) {
    const mq = window.matchMedia('(display-mode: standalone)');
    if (mq.addEventListener) {
      mq.addEventListener('change', notifyListeners);
    }
  }
};

// Auto-initialize on module load in browser environment
if (typeof window !== 'undefined') {
  initPWAInstallListener();
}

export const subscribePWAInstallState = (listener) => {
  initPWAInstallListener();
  listeners.add(listener);
  listener({
    canInstall: Boolean(deferredPrompt),
    isInstalled: isPWAStandalone(),
  });
  return () => {
    listeners.delete(listener);
  };
};

export const triggerPWAInstall = async () => {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }
  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult?.outcome === 'accepted') {
      deferredPrompt = null;
      isStandaloneInstalled = true;
    }
    notifyListeners();
    return { outcome: choiceResult?.outcome || 'dismissed' };
  } catch (err) {
    return { outcome: 'unavailable', error: err };
  }
};

export const forceUpdatePWA = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.error('Error during PWA cache clear:', error);
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set('v', new Date().getTime());
    window.location.href = url.toString();
  }
};