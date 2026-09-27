import { useEffect } from 'react';
import { getOfflinePhotos, removeOfflinePhoto } from '../utils/offlineStorage';
import { db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function OfflineSyncManager() {
  useEffect(() => {
    const syncPhotos = async () => {
      if (!navigator.onLine) return;
      
      try {
        const photos = await getOfflinePhotos();
        if (photos.length === 0) return;
        
        console.log(`Znaleziono ${photos.length} zdjęć w kolejce offline do synchronizacji.`);
        
        for (const photo of photos) {
          try {
            const fileName = Date.now() + '_' + photo.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileRef = ref(storage, `tickets/${photo.ticketId}/${fileName}`);
            
            await uploadString(fileRef, photo.base64Data, 'data_url');
            const url = await getDownloadURL(fileRef);
            
            const ticketRef = doc(db, 'tickets', photo.ticketId);
            await updateDoc(ticketRef, {
              photos: arrayUnion(url)
            });
            
            await removeOfflinePhoto(photo.id);
            console.log(`Zdjęcie dla awarii ${photo.ticketId} zostało zsynchronizowane.`);
          } catch (uploadErr) {
            console.error(`Błąd synchronizacji zdjęcia (Ticket ID: ${photo.ticketId}):`, uploadErr);
          }
        }
      } catch (err) {
        console.error("Błąd dostępu do kolejki zdjęć offline:", err);
      }
    };

    window.addEventListener('online', syncPhotos);
    
    // Próba synchronizacji przy każdym starcie aplikacji
    if (navigator.onLine) {
      syncPhotos();
    }

    return () => window.removeEventListener('online', syncPhotos);
  }, []);

  return null; // Komponent nie renderuje nic na ekranie, działa w tle
}
