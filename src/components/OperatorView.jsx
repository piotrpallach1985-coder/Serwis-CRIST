import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import OperatorForm from './OperatorForm';

export default function OperatorView({ user, onLogout, initialMachineId, onSwitchView }) {
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [reportersList, setReportersList] = useState([]);
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('step') || 'scan';
  }); // 'scan', 'form', 'success'
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Do debuggowania na telefonie

  // Obsługa przycisku Wstecz (Popstate)
  useEffect(() => {
    window.history.replaceState({ step: step }, '', `?module=operator&step=${step}`);
    const handlePopState = (e) => {
      if (e.state && e.state.step) {
        setStep(e.state.step);
      }
    };
    window.addEventListener('popstate', handlePopState);
return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStepChange = (newStep) => {
    setStep(newStep);
    window.history.pushState({ step: newStep }, '', `?module=operator&step=${newStep}`);
  };
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const html5QrcodeRef = useRef(null);

  // Status sieci
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Formularz

  // Pobieranie maszyn i tematów
  useEffect(() => {
    let unsubscribeMachines = () => {};
    let unsubscribeTopics = () => {};
    let unsubscribeReporters = () => {};
    let unsubscribeRegions = () => {};
    try {
      unsubscribeMachines = onSnapshot(collection(db, "machines"), async (querySnapshot) => {
        const machinesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => !m.isDeleted);
        setMachines(machinesData);

        if (initialMachineId && step === 'scan') {
          const targetMachine = machinesData.find(m => m.id === initialMachineId);
          if (targetMachine) {
            setSelectedMachine(targetMachine);
            handleStepChange('form');
          } else {
            const docRef = doc(db, "machines", initialMachineId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setSelectedMachine({ id: docSnap.id, ...docSnap.data() });
              handleStepChange('form');
            }
          }
        }
      }, (error) => console.error("SNAPSHOT ERROR FOR machines:", error));

      unsubscribeTopics = onSnapshot(collection(db, "topics"), (querySnapshot) => {
        setTopicsList(querySnapshot.docs.map(d => d.data()).filter(d => !d.isDeleted).map(d => d.text));
      }, (error) => console.error("SNAPSHOT ERROR FOR topics:", error));

      unsubscribeReporters = onSnapshot(collection(db, "reporters"), (querySnapshot) => {
        setReportersList(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR reporters:", error));

      unsubscribeRegions = onSnapshot(collection(db, "regions"), (querySnapshot) => {
        setRegions(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR regions:", error));
    } catch (error) {
      console.error("Błąd inicjalizacji:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    }
    return () => {
      unsubscribeMachines();
      unsubscribeTopics();
      unsubscribeReporters();
      unsubscribeRegions();
    };
  }, [initialMachineId]);

  const machinesRef = useRef([]);
  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);

  const startLiveScanner = async () => {
    setIsLiveScanning(true);
    setErrorMsg(null);
    setTimeout(async () => {
      try {
        if (html5QrcodeRef.current) {
          try { await html5QrcodeRef.current.stop(); } catch(e) { /* ignore */ }
        }
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopLiveScanner();
            let machineId = decodedText;
            if (decodedText.includes('?machine=')) {
              const urlParams = new URLSearchParams(decodedText.split('?')[1]);
              machineId = urlParams.get('machine');
            }
            const currentMachines = machinesRef.current;
            const foundMachine = currentMachines.find(m => m.id === machineId);
            if (foundMachine) {
              setSelectedMachine(foundMachine);
              handleStepChange('form');
            } else {
              alert('Nie znaleziono maszyny o kodzie: ' + machineId);
              handleStepChange('scan');
            }
          },
          () => {} // Ignoruj powtarzalne ramki bez QR
        );
      } catch (err) {
        console.error("Błąd uruchamiania kamery:", err);
        setErrorMsg("Błąd kamery: " + (err.message || err) + ". Zezwól na dostęp do aparatu w przeglądarce.");
        setIsLiveScanning(false);
      }
    }, 150);
  };

  const stopLiveScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error("Stop scanner err:", e);
      }
      html5QrcodeRef.current = null;
    }
    setIsLiveScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.stop(); } catch(e) { /* ignore */ }
      }
    };
  }, []);
  const handleFileScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Skalowanie obrazu
        let w = img.width;
        let h = img.height;
        if (w > 1200 || h > 1200) {
          const ratio = Math.min(1200 / w, 1200 / h);
          w = w * ratio;
          h = h * ratio;
        }
        canvas.width = w;
        canvas.height = h;
        context.drawImage(img, 0, 0, w, h);
        
        const imageData = context.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          let machineId = code.data;
          if (code.data.includes('?machine=')) {
            const urlParams = new URLSearchParams(code.data.split('?')[1]);
            machineId = urlParams.get('machine');
          }
          const currentMachines = machinesRef.current;
          const foundMachine = currentMachines.find(m => m.id === machineId);
          if (foundMachine) {
            setSelectedMachine(foundMachine);
            handleStepChange('form');
          } else {
            alert('Nie znaleziono maszyny o tym kodzie w bazie.');
            handleStepChange('scan');
          }
        } else {
          setErrorMsg('Nie wykryto kodu QR na zdjęciu. Spróbuj jeszcze raz (zrób wyraźne zdjęcie).');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };


  const resetFlow = () => {
    
    
    
    setSelectedMachine(null);
    setErrorMsg(null);
    if (initialMachineId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    handleStepChange('scan');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">


      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Zgłoś Awarię
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchView && (
            <button 
              onClick={onSwitchView} 
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-3 py-2 rounded transition-colors shadow-sm"
              title="Wróć do Dyspozytorni"
            >
              <i className="ph ph-desktop text-xl"></i>
              <span className="hidden sm:inline">Dyspozytornia</span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded transition-colors">
            <i className="ph ph-sign-out text-xl"></i>
            <span className="hidden sm:inline">Wyjdź</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full mt-4">
        
        {/* Kontener na błędy (Logowanie błędów na ekranie) */}
        {errorMsg && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded shadow-sm">
            <h3 className="font-bold text-sm">Log błędu systemu:</h3>
            <p className="text-xs font-mono break-words mt-1">{errorMsg}</p>
          </div>
        )}

        {step === 'scan' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-semibold mb-4">Skanuj kod QR na maszynie</h2>
            
            {isLiveScanning ? (
              <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    Skanowanie na żywo (Skieruj aparat na QR)
                  </span>
                  <button 
                    onClick={stopLiveScanner}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    Zamknij kamerę
                  </button>
                </div>
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                    onClick={startLiveScanner}
                    className="w-full max-w-md mx-auto py-5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden">
                      <i className="ph ph-qr-code text-[80px] text-white/90"></i>
                      <div className="absolute left-0 w-full h-1 bg-red-500 opacity-90 shadow-[0_0_12px_4px_rgba(239,68,68,0.9)] animate-scan z-10"></div>
                    </div>
                    <span className="text-2xl tracking-wide">Skanuj kod QR</span>
                  </button>
              </div>
            )}
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Lub wpisz nazwę i wybierz z listy</h3>
              <input 
                type="text"
                list="machine-datalist"
                placeholder="Zacznij wpisywać nazwę maszyny..."
                className="w-full max-w-md mx-auto block p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white text-left mb-4 shadow-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  const m = machines.find(machine => `${machine.name} ${machine.bay ? `(${machine.bay})` : ''}` === val);
                  if (m) {
                    setSelectedMachine(m);
                    handleStepChange('form');
                  }
                }}
              />
              <datalist id="machine-datalist">
                {machines.map(m => (
                  <option key={m.id} value={`${m.name} ${m.bay ? `(${m.bay})` : ''}`} />
                ))}
              </datalist>
              
              <button 
                onClick={() => {
                  setSelectedMachine({ id: 'manual', name: '' });
                  handleStepChange('form');
                }}
                className="w-full max-w-md mx-auto p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                + Brak na liście? Dodaj maszynę ręcznie
              </button>
            </div>
          </div>
        )}
        
        {step === 'form' && !selectedMachine && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
            <i className="ph ph-spinner-gap animate-spin text-4xl text-blue-600 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800">Wczytywanie maszyny...</h2>
            <p className="text-gray-500 text-sm mt-2">Pobieranie danych z systemu bazy maszyn.</p>
          </div>
        )}

        {step === 'form' && selectedMachine && (
          <OperatorForm
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            regions={regions}
            initialMachineId={initialMachineId}
            handleStepChange={handleStepChange}
            isOnline={isOnline}
            topicsList={topicsList}
            reportersList={reportersList}
            stopLiveScanner={stopLiveScanner}
          />
        )}
        {step === 'success' && (
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center animate-fade-in border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <i className="ph ph-check-circle text-6xl"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Gotowe!</h2>
            <p className="text-gray-600 mb-8 max-w-sm text-lg leading-relaxed">
              Zgłoszenie awarii maszyny <span className="font-bold text-gray-800">{selectedMachine?.name}</span> zostało pomyślnie wysłane.
            </p>
            
            <button 
              onClick={() => {
                setSelectedMachine(null);
                handleStepChange('scan');
              }} 
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-10 rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-gray-900/20 active:scale-95"
            >
              Zgłoś kolejną awarię
            </button>
            <button 
              onClick={() => {
                window.history.pushState({ module: '' }, '', window.location.pathname);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="w-full sm:w-auto mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-red-600/20 active:scale-95"
            >
              Powrót
            </button>
          </div>
        )}
      </main>
    </div>
  );
}