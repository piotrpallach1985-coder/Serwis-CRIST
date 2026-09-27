export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CristOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_photos')) {
        db.createObjectStore('offline_photos', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePhotoToIndexedDB = async (ticketId, base64Data, fileName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readwrite');
    const store = transaction.objectStore('offline_photos');
    const request = store.add({
      ticketId,
      base64Data,
      fileName,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getOfflinePhotos = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readonly');
    const store = transaction.objectStore('offline_photos');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeOfflinePhoto = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readwrite');
    const store = transaction.objectStore('offline_photos');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
