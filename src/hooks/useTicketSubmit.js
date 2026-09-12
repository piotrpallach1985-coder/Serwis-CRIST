import { useState } from 'react';
import { collection, doc, setDoc, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { savePhotoToIndexedDB } from '../utils/offlineStorage';
import { TICKET_STATUS } from '../utils/constants';

export const useTicketSubmit = ({ regions, onStepChange, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const submitTicket = async (formData) => {
    const {
      selectedMachine,
      topic,
      description,
      reporterName,
      reporterPhone,
      isCritical,
      pendingPhotos,
      captchaAnswer,
      captchaA,
      captchaB,
      acceptedRodo,
      reporterDeviceId,
      isOnline,
      timeoutRef,
      setTopicMode
    } = formData;

    if (loading) return false;

    if (selectedMachine.id === 'manual' && (!selectedMachine.name || !selectedMachine.name.trim())) {
      showToast('Podaj nazwę maszyny!', 'error');
      return false;
    }
    if (!topic || !description || !reporterName.trim() || !reporterPhone.trim()) {
      showToast('Wypełnij wszystkie wymagane pola (Imię, Telefon, Temat, Opis)!', 'error');
      return false;
    }
    const cleanedPhone = reporterPhone.replace(/\D/g, '');
    
    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      showToast('Weryfikacja antyspamowa: Niepoprawny wynik z dodawania!', 'error');
      return false;
    }
    if (!acceptedRodo) {
      showToast('Musisz zaakceptować zasady przetwarzania danych osobowych (RODO).', 'error');
      return false;
    }

    const lastTicketTime = localStorage.getItem('last_ticket_time');
    if (lastTicketTime && Date.now() - parseInt(lastTicketTime) < 2 * 60 * 1000) {
      showToast('Zbyt wiele zgłoszeń w krótkim czasie. Odczekaj 2 minuty.', 'error');
      return false;
    }
    if (cleanedPhone.length !== 9) {
      showToast('Numer telefonu musi składać się z dokładnie 9 cyfr.', 'error');
      return false;
    }

    if (!isOnline) {
      showToast('Jesteś offline. Zgłoszenie zostanie zapisane lokalnie i wysłane automatycznie po odzyskaniu połączenia z siecią.', 'warning');
    }

    // 1. Zabezpieczenie przed duplikowaniem (2 godziny)
    if (selectedMachine.id !== 'manual') {
      try {
        const q = query(collection(db, 'tickets'), where('machineId', '==', selectedMachine.id));
        const snap = await getDocs(q);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        let foundDuplicate = null;
        snap.forEach(d => {
          const t = d.data();
          const date = new Date(t.createdAt);
          const st = Number(t.status);
          if (date > twoHoursAgo && st !== TICKET_STATUS.CLOSED) foundDuplicate = date;
        });
        
        if (foundDuplicate) {
          const proceed = window.confirm(`UWAGA: Awaria dla tej maszyny została już zgłoszona dzisiaj o godzinie ${foundDuplicate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.\n\nCzy na pewno chcesz wysłać KOLEJNE zgłoszenie dla tego samego urządzenia?`);
          if (!proceed) return false;
        }
      } catch (err) {
        console.error('Błąd weryfikacji duplikatów:', err);
      }
    }

    setLoading(true);

    try {
      // 2. Dodawanie Zgłaszającego do bazy
      const reporterNameTrimmed = reporterName.trim();
      if (reporterNameTrimmed) {
        try {
          const repQ = query(collection(db, 'reporters'), where('name', '==', reporterNameTrimmed));
          const repSnap = await getDocs(repQ);
          if (repSnap.empty) {
            await addDoc(collection(db, 'reporters'), {
              name: reporterNameTrimmed + " (DO WERYFIKACJI)",
              phone: reporterPhone.trim(),
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Błąd zapisywania zgłaszającego:", e);
        }
      }

      let finalMachineId = selectedMachine.id;
      
      if (finalMachineId === 'manual') {
        const newMachineRef = await addDoc(collection(db, 'machines'), {
          name: selectedMachine.name + ' (DO WERYFIKACJI)',
          regionId: selectedMachine.regionId || '',
          bay: selectedMachine.bay || '',
          currentWorkHours: 0,
          status: 'active',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          createdBy: reporterName.trim() || 'Operator',
          description: 'Maszyna dodana z poziomu zgłoszenia awarii. Wymaga uzupełnienia danych i wygenerowania QR.'
        });
        finalMachineId = newMachineRef.id;
      }

      const ticketRef = doc(collection(db, 'tickets'));
      const regionObj = regions.find(r => r.id === selectedMachine.regionId);
      let uploadedUrls = [];
      let saveToOfflineQueue = false;

      // 3. Wgrywamy zdjęcia NAJPIERW (jeśli online)
      if (pendingPhotos.length > 0) {
        if (navigator.onLine) {
          try {
            setUploadProgress('Wysyłanie zdjęć...');
            for (const p of pendingPhotos) {
              const fileName = Date.now() + '_' + p.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileRef = ref(storage, `tickets/${ticketRef.id}/${fileName}`);
              await uploadString(fileRef, p.base64, 'data_url');
              const url = await getDownloadURL(fileRef);
              uploadedUrls.push(url);
            }
          } catch (uploadErr) {
            console.error("Błąd wgrywania zdjęć online, przechodzę w tryb offline:", uploadErr);
            saveToOfflineQueue = true;
          }
        } else {
          saveToOfflineQueue = true;
        }
      }

      setUploadProgress('');

      // 4. Tworzymy zgłoszenie ATOMOWO
      const ticketPayload = {
        machineId: finalMachineId,
        machineName: selectedMachine.name,
        bay: selectedMachine.bay || '',
        regionId: selectedMachine.regionId || '',
        regionName: regionObj ? regionObj.name : '',
        topic,
        description,
        isCritical,
        reportedBy: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        reporterDevice: navigator.userAgent,
        reporterDeviceId: reporterDeviceId,
        status: TICKET_STATUS.OPEN,
        createdAt: new Date().toISOString(),
        photos: uploadedUrls,
        updates: [{
          timestamp: new Date().toISOString(),
          status: TICKET_STATUS.OPEN,
          comment: 'Zgłoszenie awarii w systemie.',
          author: reporterName.trim()
        }]
      };

      await setDoc(ticketRef, ticketPayload);
      localStorage.setItem('last_ticket_time', Date.now().toString());

      // 5. Tryb offline dla zdjęć
      if (saveToOfflineQueue && pendingPhotos.length > 0) {
        for (const p of pendingPhotos) {
          await savePhotoToIndexedDB(ticketRef.id, p.base64, p.name);
        }
      }

      // Zapis powiadomienia w tle
      const newNotifRef = doc(collection(db, "notifications"));
      setDoc(newNotifRef, {
        title: isCritical ? "KRYTYCZNA AWARIA!" : "Nowe zgłoszenie awarii",
        message: `Maszyna: ${selectedMachine.name} - ${topic}`,
        isCritical: isCritical,
        read: false,
        ticketId: ticketRef.id,
        createdAt: serverTimestamp()
      }).catch(err => console.error("Błąd powiadomienia w tle:", err));
      
      setTopicMode('select');
      onStepChange('success');
      return true;

    } catch (error) {
      console.error('Szczegóły błędu Firebase:', error);
      showToast('Krytyczny błąd: ' + error.message, 'error');
      return false;
    } finally {
      if (timeoutRef && timeoutRef.current !== undefined) {
        timeoutRef.current = setTimeout(() => setLoading(false), 500);
      } else {
        setLoading(false);
      }
    }
  };

  return { submitTicket, loading, uploadProgress };
};
