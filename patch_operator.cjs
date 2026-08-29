const fs = require('fs');

let code = fs.readFileSync('src/components/OperatorForm.jsx', 'utf8');

const oldBlock = `      const ticketRef = doc(collection(db, 'tickets'));
      
      const regionObj = regions.find(r => r.id === selectedMachine.regionId);
      
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
        status: 1,
        createdAt: new Date().toISOString(),
        photos: [], // will be updated later if online
        updates: [{
          timestamp: new Date().toISOString(),
          status: 1,
          comment: 'Zgłoszenie awarii w systemie.',
          author: reporterName.trim()
        }]
      };

      await setDoc(ticketRef, ticketPayload);

      // Handle Photos
      if (pendingPhotos.length > 0) {
        if (!navigator.onLine) {
          // Offline mode
          for (const p of pendingPhotos) {
            await savePhotoToIndexedDB(ticketRef.id, p.base64, p.name);
          }
        } else {
          // Online mode
          try {
            let uploadedUrls = [];
            for (const p of pendingPhotos) {
              const fileName = Date.now() + '_' + p.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileRef = ref(storage, \`tickets/\${ticketRef.id}/\${fileName}\`);
              await uploadString(fileRef, p.base64, 'data_url');
              const url = await getDownloadURL(fileRef);
              uploadedUrls.push(url);
            }
            await updateDoc(ticketRef, { photos: uploadedUrls });
          } catch (uploadErr) {
            console.error("Błąd wgrywania zdjęć online:", uploadErr);
            // Fallback to offline queue if upload fails
            for (const p of pendingPhotos) {
              await savePhotoToIndexedDB(ticketRef.id, p.base64, p.name);
            }
          }
        }
      }`;

const newBlock = `      const ticketRef = doc(collection(db, 'tickets'));
      const regionObj = regions.find(r => r.id === selectedMachine.regionId);
      let uploadedUrls = [];
      let saveToOfflineQueue = false;

      // 3. Wgrywamy zdjęcia NAJPIERW (jeśli online)
      if (pendingPhotos.length > 0) {
        if (navigator.onLine) {
          try {
            for (const p of pendingPhotos) {
              const fileName = Date.now() + '_' + p.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileRef = ref(storage, \`tickets/\${ticketRef.id}/\${fileName}\`);
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

      // 4. Tworzymy zgłoszenie ATOMOWO (z linkami do zdjęć od razu)
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
        status: 1,
        createdAt: new Date().toISOString(),
        photos: uploadedUrls, // Gotowe linki, zero potrzeby updateDoc dla niezalogowanych (w trybie online)
        updates: [{
          timestamp: new Date().toISOString(),
          status: 1,
          comment: 'Zgłoszenie awarii w systemie.',
          author: reporterName.trim()
        }]
      };

      await setDoc(ticketRef, ticketPayload);

      // 5. Tryb offline dla zdjęć (jeśli nie udało się wgrać online)
      if (saveToOfflineQueue && pendingPhotos.length > 0) {
        for (const p of pendingPhotos) {
          await savePhotoToIndexedDB(ticketRef.id, p.base64, p.name);
        }
      }`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/OperatorForm.jsx', code);
console.log('OperatorForm.jsx updated to upload photos before setDoc.');
