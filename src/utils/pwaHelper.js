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
      await Promise.all(keys.map(key => caches.delete(key)));
    }
  } catch (error) {
    console.error('Error during PWA cache clear:', error);
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set('v', new Date().getTime());
    window.location.href = url.toString();
  }
};