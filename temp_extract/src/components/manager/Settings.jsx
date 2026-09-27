import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Settings() {
  const [archiveDelayDays, setArchiveDelayDays] = useState(14);
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [enableTickets, setEnableTickets] = useState(true);
  const [enablePlanned, setEnablePlanned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  // Branding states
  const [companyName, setCompanyName] = useState('CRIST S.A.');
  const [systemSubtitle, setSystemSubtitle] = useState('MAINT SYSTEM PORTAL');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsubBranding = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.companyName) setCompanyName(data.companyName);
        if (data.systemSubtitle) setSystemSubtitle(data.systemSubtitle);
        if (data.companyLogoUrl) setCompanyLogoUrl(data.companyLogoUrl);
        if (data.appLogoUrl) setAppLogoUrl(data.appLogoUrl);
      }
    });
    return () => unsubBranding();
  }, []);

  
  const [dragActive, setDragActive] = useState({ app: false, company: false });

  const handleDragEnter = (e, type) => { e.preventDefault(); e.stopPropagation(); setDragActive(prev => ({...prev, [type]: true})); };
  const handleDragLeave = (e, type) => { e.preventDefault(); e.stopPropagation(); setDragActive(prev => ({...prev, [type]: false})); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({...prev, [type]: false}));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], type);
    }
  };

    const compressImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 200; // logo proportions usually wider
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.9));
        };
        img.onerror = () => resolve(null);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file, type) => {
    if (!file) return;
    setUploadingLogo(type);
    
    // Generuj Base64 od razu (aby PDF miał szybki dostęp)
    const base64Data = await compressImageToBase64(file);

    const storageRef = ref(storage, 'branding/' + type + '_' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error", error);
        alert("Błąd wgrywania: " + error.message);
        setUploadingLogo(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (type === 'app') setAppLogoUrl(downloadURL);
        if (type === 'company') setCompanyLogoUrl(downloadURL);
        
        // Auto Zapis do bazy
        await setDoc(doc(db, "settings", "branding"), {
          [type === 'app' ? 'appLogoUrl' : 'companyLogoUrl']: downloadURL,
          [type === 'app' ? 'appLogoBase64' : 'companyLogoBase64']: base64Data || ''
        }, { merge: true });

        setUploadingLogo(false);
        setUploadProgress(0);
      }
    );
  };

  const deleteLogo = async (type) => {
    if (type === 'app') setAppLogoUrl('');
    if (type === 'company') setCompanyLogoUrl('');
    await setDoc(doc(db, "settings", "branding"), {
      [type === 'app' ? 'appLogoUrl' : 'companyLogoUrl']: '',
      [type === 'app' ? 'appLogoBase64' : 'companyLogoBase64']: ''
    }, { merge: true });
  };



  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.archiveDelayDays !== undefined) {
          setArchiveDelayDays(data.archiveDelayDays);
        }
        if (data.allowTicketDeletion !== undefined) {
          setAllowTicketDeletion(data.allowTicketDeletion);
        }
        if (data.enableTickets !== undefined) setEnableTickets(data.enableTickets);
        if (data.enablePlanned !== undefined) setEnablePlanned(data.enablePlanned);
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, "settings", "general"), {
        archiveDelayDays: parseInt(archiveDelayDays, 10),
        allowTicketDeletion: false,
        enableTickets: enableTickets,
        enablePlanned: enablePlanned
      }, { merge: true });
      // Zapis nazwy firmy i podtytułu
      await setDoc(doc(db, "settings", "branding"), {
        companyName: companyName,
        systemSubtitle: systemSubtitle
      }, { merge: true });

      setSuccessMsg('Ustawienia zostały zapisane!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Błąd zapisu ustawień:", error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Ustawienia Systemu</h2>
          <p className="text-sm text-gray-500 mt-1">Konfiguracja globalnych parametrów aplikacji.</p>
        </div>
      </div>

      <div className="p-6">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center gap-2">
            <i className="ph ph-check-circle text-xl"></i>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">


          




          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 mb-2">Aktywne Moduły Firmy</h3>
            <p className="text-sm text-blue-800 mb-4">
              Wybierz, które moduły są włączone dla tej instalacji (firmy). Odznaczenie modułu ukryje go na ekranie głównym i zablokuje możliwość nadawania do niego uprawnień innym pracownikom.
            </p>
            
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-blue-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={enableTickets} onChange={e => setEnableTickets(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                <div>
                  <span className="block font-bold text-gray-800">Moduł Zgłoszeń i Awarii (Awarie UR)</span>
                  <span className="text-sm text-gray-500">Zarządzanie biletami, skanowanie kodów awarii, MTTR.</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-blue-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={enablePlanned} onChange={e => setEnablePlanned(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                <div>
                  <span className="block font-bold text-gray-800">Moduł Serwisów Planowanych (Serwis UR)</span>
                  <span className="text-sm text-gray-500">Przeglądy okresowe, harmonogramy z cyklami zliczania RBG i Dni.</span>
                </div>
              </label>
            </div>
          </div>


          </div>

        {/* Sekcja Branding */}
        <div className="mt-8 border-t border-gray-200 pt-8 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i className="ph ph-paint-brush text-blue-600"></i> Personalizacja i Branding
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nazwa Firmy (Klienta)</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. CRIST S.A."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Podtytuł Systemu</label>
                <input 
                  type="text" 
                  value={systemSubtitle}
                  onChange={e => setSystemSubtitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. MAINT SYSTEM PORTAL"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo Aplikacji (Lewy górny róg)</label>
                <div className="flex items-center gap-4">
                  {appLogoUrl && (
                    <div className="relative">
                      <img src={appLogoUrl} alt="App Logo" className="h-12 object-contain bg-slate-100 rounded border border-slate-200 p-1" />
                      <button 
                        type="button"
                        onClick={() => deleteLogo('app')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                        title="Usuń logo"
                      >
                        <i className="ph ph-x text-[10px] font-bold"></i>
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={"relative flex-1 w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + 
                      (dragActive.app ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50')
                    }
                    onDragEnter={(e) => handleDragEnter(e, 'app')}
                    onDragLeave={(e) => handleDragLeave(e, 'app')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'app')}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'app')}
                      disabled={uploadingLogo !== false}
                      className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploadingLogo === 'app' ? (
                      <span className="text-blue-600 font-bold">Wgrywanie... {Math.round(uploadProgress)}%</span>
                    ) : (
                      <span className={"text-sm font-bold " + (dragActive.app ? 'text-amber-600' : 'text-gray-500')}>
                        {dragActive.app ? 'Upuść tutaj!' : 'Wybierz lub przeciągnij plik'}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo Firmy Docelowej</label>
                <div className="flex items-center gap-4">
                  {companyLogoUrl && (
                    <div className="relative">
                      <img src={companyLogoUrl} alt="Company Logo" className="h-12 object-contain bg-slate-100 rounded border border-slate-200 p-1" />
                      <button 
                        type="button"
                        onClick={() => deleteLogo('company')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                        title="Usuń logo"
                      >
                        <i className="ph ph-x text-[10px] font-bold"></i>
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={"relative flex-1 w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + 
                      (dragActive.company ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50')
                    }
                    onDragEnter={(e) => handleDragEnter(e, 'company')}
                    onDragLeave={(e) => handleDragLeave(e, 'company')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'company')}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'company')}
                      disabled={uploadingLogo !== false}
                      className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploadingLogo === 'company' ? (
                      <span className="text-blue-600 font-bold">Wgrywanie... {Math.round(uploadProgress)}%</span>
                    ) : (
                      <span className={"text-sm font-bold " + (dragActive.company ? 'text-amber-600' : 'text-gray-500')}>
                        {dragActive.company ? 'Upuść tutaj!' : 'Wybierz lub przeciągnij plik'}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i className="ph ph-floppy-disk text-xl"></i>
            {loading ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
          </button>
        </form>
      </div>
    </div>
  );
}
