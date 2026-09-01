import React, { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp, getDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { savePhotoToIndexedDB } from '../utils/offlineStorage';
import { db, storage } from '../firebase';
import { compressImage } from '../utils/imageCompressor';

export default function OperatorForm({
  selectedMachine,
  setSelectedMachine,
  regions,
  initialMachineId,
  handleStepChange,
  isOnline,
  topicsList,
  reportersList,
  stopLiveScanner
}) {
  const [topicMode, setTopicMode] = useState('select'); // 'select' lub 'manual'
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterDeviceId] = useState(() => {
    let id = localStorage.getItem('device_id_token');
    if (!id) {
      id = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('device_id_token', id);
    }
    return id;
  });
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');

  
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (selectedMachine.id === 'manual' && (!selectedMachine.name || !selectedMachine.name.trim())) {
      return alert('Podaj nazwę maszyny!');
    }
    if (!topic || !description || !reporterName.trim() || !reporterPhone.trim()) {
      return alert('Wypełnij wszystkie wymagane pola (Imię, Telefon, Temat, Opis)!');
    }
    const cleanedPhone = reporterPhone.replace(/\D/g, '');
    if (cleanedPhone.length !== 9) {
      return alert('Numer telefonu musi składać się z dokładnie 9 cyfr.');
    }
    
    if (!isOnline) {
      alert('Jesteś offline. Zgłoszenie zostanie zapisane lokalnie i wysłane automatycznie po odzyskaniu połączenia z siecią.');
    }

    // 1. Zabezpieczenie przed duplikowaniem (2 godziny)
    if (selectedMachine.id !== 'manual') {
      try {
        const q = query(collection(db, 'tickets'), where('machineId', '==', selectedMachine.id));
        const snap = await getDocs(q);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        let foundDuplicate = null;
        snap.forEach(doc => {
          const t = doc.data();
          const d = new Date(t.createdAt);
          const st = Number(t.status);
          if (d > twoHoursAgo && st !== 5) foundDuplicate = d;
        });
        
        if (foundDuplicate) {
          const proceed = window.confirm(`UWAGA: Awaria dla tej maszyny została już zgłoszona dzisiaj o godzinie ${foundDuplicate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.\n\nCzy na pewno chcesz wysłać KOLEJNE zgłoszenie dla tego samego urządzenia?`);
          if (!proceed) return;
        }
      } catch (err) {
        console.error('Błąd weryfikacji duplikatów:', err);
      }
    }

    setLoading(true);
    setErrorMsg(null);

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

    try {
      let finalMachineId = selectedMachine.id;
      
      
        if (finalMachineId === 'manual') {
          // Użytkownik dodał "Inną" maszynę
          // Zgodnie z prośbą, dodajemy ją do bazy, by w przyszłości mogła zostać edytowana przez admina.
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
      
      // Zapisujemy w tle, jeśli offline Firebase zadba o to
      handleStepChange('success');
    } catch (error) {
      console.error("Szczegóły błędu Firebase:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm font-bold flex items-center gap-3">
          <i className="ph ph-warning-circle text-2xl"></i>
          {errorMsg}
        </div>
      )}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Karta szczegółów wybranej maszyny */}
            <div className="bg-blue-50/70 p-5 border-b border-blue-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full sm:mr-4">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded">Zgłoszenie dla maszyny</span>
                  {selectedMachine.id === 'manual' ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={selectedMachine.name || ''} 
                        onChange={(e) => setSelectedMachine({...selectedMachine, name: e.target.value})} 
                        className="w-full p-2 border border-blue-300 rounded font-bold text-lg focus:outline-none focus:border-blue-900 bg-white" 
                        placeholder="Wpisz nazwę maszyny..." 
                        autoFocus
                      />
                      <select
                        value={selectedMachine.regionId || ''}
                        onChange={(e) => setSelectedMachine({...selectedMachine, regionId: e.target.value})}
                        className="w-full p-2 border border-blue-300 rounded font-medium text-sm text-slate-700 focus:outline-none focus:border-blue-900 bg-white"
                      >
                        <option value="" disabled>-- Wybierz rejon (opcjonalnie) --</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="font-black text-xl text-slate-800 break-words mt-1">{selectedMachine.name}</div>
                  )}
                </div>
                {!initialMachineId && (
                  <button 
                    onClick={() => {
                      stopLiveScanner();
                      setSelectedMachine(null);
                      handleStepChange('scan');
                    }} 
                    className="mb-6 flex items-center gap-2 text-white hover:text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <i className="ph ph-arrow-left text-lg"></i> Cofnij i skanuj ponownie
                  </button>
                )}
              </div>

              {selectedMachine.id !== 'manual' && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Rejon / Numer Hali:</span>
                    <div className="font-bold text-slate-800">
                      {regions.find(r => r.id === selectedMachine.regionId)?.name || 'Nieokreślono'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Przelot / Dodatkowe:</span>
                    <div className="font-bold text-slate-800">
                      {selectedMachine.bay || 'Brak'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isOnline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 mb-0 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="ph ph-wifi-slash text-yellow-500 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-bold">
                      Brak połączenia z siecią (Offline)
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Możesz bezpiecznie wypełnić i wysłać formularz. Zgłoszenie zostanie zapisane w pamięci urządzenia i zsynchronizowane automatycznie, gdy tylko odzyskasz zasięg.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 pb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Imię i Nazwisko Zgłaszającego <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="reporters-list"
                    value={reporterName}
                    onChange={e => {
                      const val = e.target.value;
                      setReporterName(val);
                      const found = reportersList.find(r => r.name.toLowerCase() === val.toLowerCase());
                      if (found) {
                        setReporterPhone(found.phone);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. Jan Kowalski"
                    required
                  />
                  <datalist id="reporters-list">
                    {reportersList.map(r => (
                      <option key={r.id} value={r.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Numer Telefonu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      let formatted = val;
                      if (val.length > 3 && val.length <= 6) {
                        formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
                      } else if (val.length > 6) {
                        formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
                      }
                      setReporterPhone(formatted);
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. 500 600 700"
                    pattern="[0-9]{3} [0-9]{3} [0-9]{3}"
                    minLength={11}
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Co się stało? (Temat)</label>
                {topicMode === 'select' ? (
                  <select
                    value={topicsList.includes(topic) ? topic : ''}
                    onChange={(e) => {
                      if (e.target.value === 'manual') {
                        setTopicMode('manual');
                        setTopic('');
                      } else {
                        setTopic(e.target.value);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none bg-white text-gray-800"
                    required
                  >
                    <option value="" disabled>Wybierz z podpowiedzi...</option>
                    
                      <option value="manual" className="font-bold text-blue-900">+ Wpisz własny temat...</option>
                    {topicsList.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)} 
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
                      placeholder="Wpisz własny temat..."
                      required 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setTopicMode('select');
                        setTopic('');
                      }}
                      className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                      title="Wróć do listy"
                    >
                      <i className="ph ph-x text-lg"></i>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis problemu</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded h-32 resize-none focus:ring-2 focus:ring-blue-900 outline-none" required></textarea>
              </div>
              <label className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded cursor-pointer transition-colors hover:bg-red-100">
                <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                <span className="text-red-900 font-medium">Maszyna jest całkowicie unieruchomiona (Krytyczne)</span>
              </label>
              {/* Zdjęcia */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ph ph-camera text-blue-900 text-lg"></i>
                  Załącz zdjęcia (opcjonalnie)
                </h3>
                <div className="space-y-3">
                  
                  {uploadProgress && <div className="text-sm font-bold text-blue-600 mb-2">{uploadProgress}</div>}
                  <div className="flex gap-2">
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-image text-xl"></i> Galeria
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          
                            const files = Array.from(e.target.files);
                            if (!files.length) return;
                            setUploadProgress('Przetwarzanie zdjęć...');
                            setLoading(true);
                            try {
                              let newPhotos = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const compressedFile = await compressImage(file, 2);
                                const base64 = await fileToBase64(compressedFile);
                                const preview = URL.createObjectURL(compressedFile);
                                newPhotos.push({ file: compressedFile, base64, preview, name: compressedFile.name });
                              }
                              setPendingPhotos(prev => [...prev, ...newPhotos]);
                            } catch (err) {
                              console.error(err);
                              alert("Błąd przetwarzania: " + err.message);
                            }
                            setUploadProgress('');
                            setLoading(false);

                        }}
                      />
                    </label>
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-camera text-xl"></i> Aparat
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          
                            const files = Array.from(e.target.files);
                            if (!files.length) return;
                            setUploadProgress('Przetwarzanie zdjęć...');
                            setLoading(true);
                            try {
                              let newPhotos = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const compressedFile = await compressImage(file, 2);
                                const base64 = await fileToBase64(compressedFile);
                                const preview = URL.createObjectURL(compressedFile);
                                newPhotos.push({ file: compressedFile, base64, preview, name: compressedFile.name });
                              }
                              setPendingPhotos(prev => [...prev, ...newPhotos]);
                            } catch (err) {
                              console.error(err);
                              alert("Błąd przetwarzania: " + err.message);
                            }
                            setUploadProgress('');
                            setLoading(false);

                        }}
                      />
                    </label>
                  </div>
                  {pendingPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {pendingPhotos.map((p, i) => (
                        <div key={i} className="relative w-20 h-20 shrink-0 border border-gray-300 rounded overflow-hidden">
                          <img src={p.preview} alt="preview" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full font-bold py-4 rounded text-lg transition-colors flex items-center justify-center gap-2 ${
                  loading ? 'bg-blue-400 text-white cursor-not-allowed' : 
                  !isOnline ? 'bg-orange-500 hover:bg-orange-600 text-white' : 
                  'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {loading ? (
                  uploadProgress ? uploadProgress : <><i className="ph ph-spinner animate-spin text-2xl"></i> Zapisywanie...</>
                ) : !isOnline ? (
                  <><i className="ph ph-wifi-slash text-xl"></i> Oczekuję na zasięg...</>
                ) : (
                  <><i className="ph ph-paper-plane-tilt text-xl"></i> Wyślij zgłoszenie</>
                )}
              </button>
            </form>
          </div>
    </div>
  );
}
