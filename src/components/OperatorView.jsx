import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OperatorScanner from './operator/OperatorScanner';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import OperatorForm from './OperatorForm';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { useAuth } from '../hooks/useAuth';


export default function OperatorView({ initialMachineId, onSwitchView }) {
  const { user, logout: onLogout } = useAuth();
  // Odczytaj tenant z prawdziwego URL (przed hashem) – HashRouter tego nie widzi
  useEffect(() => {
    const realParams = new URLSearchParams(window.location.search);
    const t = realParams.get('tenant');
    if (t) {
      useManagerStore.getState().setTenantId(t);
    }
  }, []);

  useEffect(() => {
    const unsubGlobal = onSnapshot(doc(db, 'tenant_registry', '_global_settings_'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().groqApiKey) {
        useManagerStore.getState().setGroqApiKey(docSnap.data().groqApiKey);
      }
    });
    return () => unsubGlobal();
  }, []);
  const tenantId = getCurrentTenant();
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [reportersList, setReportersList] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlMachineId = searchParams.get('machine') || initialMachineId;
  const urlMachineResolvedRef = useRef(false);

  useEffect(() => {
    urlMachineResolvedRef.current = false;
  }, [urlMachineId]);
  const [step, setStep] = useState(searchParams.get('step') || 'scan');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Do debuggowania na telefonie

  // Obsługa przycisku Wstecz (Popstate)
  
  
  

  
          
  // Status sieci
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleScanSuccess = (decodedText) => {
    let mId = decodedText;
    let tenantFromQr = null;
    
    let queryPart = decodedText;
    if (decodedText.includes('?')) {
      queryPart = decodedText.split('?')[1];
    }
    
    try {
      const urlParams = new URLSearchParams(queryPart);
      if (urlParams.has('machine')) {
        mId = urlParams.get('machine');
      }
      if (urlParams.has('tenant')) {
        tenantFromQr = urlParams.get('tenant');
      }
    } catch (e) {}
    
    const targetMachine = machines.find(m => m.id === mId || (m.qrCode && m.qrCode === mId) || (m.internalId && m.internalId.toLowerCase() === mId.toLowerCase()));
    
    if (targetMachine) {
      setSelectedMachine(targetMachine);
      setSearchParams({ step: 'form', machine: targetMachine.id }, { replace: true });
      setStep('form');
    } else if (tenantFromQr && tenantFromQr !== tenantId) {
      // Maszyna z innej firmy – przełącz tenant i przeładuj stronę
      useManagerStore.getState().setTenantId(tenantFromQr);
      // HashRouter: query params muszą być PRZED hashem
      const base = window.location.pathname;
      window.location.replace(`${base}?tenant=${tenantFromQr}#/operator?step=scan&machine=${mId}`);
    } else {
      alert('Zeskanowana maszyna (' + mId + ') nie istnieje w Twojej bazie (tenant: ' + tenantId + ').');
    }
  };

  const handleStepChange = (newStep) => {
    setStep(newStep);
    setSearchParams({ step: newStep, machine: urlMachineId || '' }, { replace: true });
  };


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
    let authUnsub = () => {};

    try {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((error) => console.error("Anonymous login error:", error));
      }

      authUnsub = onAuthStateChanged(auth, (authUser) => {
        if (authUser) {
          // Firebase Auth confirms we have a token, safe to attach listeners

      unsubscribeMachines = onSnapshot(collection(db, 'tenants', tenantId, 'machines'), async (querySnapshot) => {
        const machinesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => !m.isDeleted);
        setMachines(machinesData);

        if (urlMachineId && step === 'scan' && !urlMachineResolvedRef.current) {
          urlMachineResolvedRef.current = true;
          const targetMachine = machinesData.find(m => m.id === urlMachineId || (m.qrCode && m.qrCode === urlMachineId) || (m.internalId && m.internalId.toLowerCase() === urlMachineId.toLowerCase()));
          if (targetMachine) {
            setSelectedMachine(targetMachine);
            handleStepChange('form');
          } else {
            const docRef = doc(db, 'tenants', getCurrentTenant(), 'machines', urlMachineId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setSelectedMachine({ id: docSnap.id, ...docSnap.data() });
              handleStepChange('form');
            } else {
              alert("Błąd: Nie znaleziono maszyny o ID: " + urlMachineId);
            }
          }
        }
      }, (error) => console.error("SNAPSHOT ERROR FOR machines:", error));

      unsubscribeTopics = onSnapshot(collection(db, 'tenants', tenantId, 'topics'), (querySnapshot) => {
        setTopicsList(querySnapshot.docs.map(d => d.data()).filter(d => !d.isDeleted).map(d => d.text));
      }, (error) => console.error("SNAPSHOT ERROR FOR topics:", error));

      unsubscribeReporters = onSnapshot(collection(db, 'tenants', tenantId, 'reporters'), (querySnapshot) => {
        setReportersList(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR reporters:", error));

      unsubscribeRegions = onSnapshot(collection(db, 'tenants', tenantId, 'regions'), (querySnapshot) => {
        setRegions(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR regions:", error));
              }
        });
      } catch (error) {
      console.error("Błąd inicjalizacji:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    }
    return () => {
      unsubscribeMachines();
      unsubscribeTopics();
      unsubscribeReporters();
      unsubscribeRegions();
        if (authUnsub) authUnsub();
    };
  }, [urlMachineId]);

  const machinesRef = useRef([]);
  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);

  const resetFlow = () => {
    
    
    
    setSelectedMachine(null);
    setErrorMsg(null);
    if (initialMachineId) {
      setSearchParams({}, { replace: true });
    }
    handleStepChange('scan');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">


      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
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
          <button onClick={onLogout} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded transition-colors text-sm sm:text-base">
            <i className="ph ph-sign-out text-xl"></i>
            <span>Wyjdź</span>
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
          <OperatorScanner 
            onScanSuccess={handleScanSuccess} 
            
          />
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
            machines={machines}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            regions={regions}
            initialMachineId={initialMachineId}
            handleStepChange={handleStepChange}
            isOnline={isOnline}
            topicsList={topicsList}
            reportersList={reportersList}
            stopLiveScanner={() => {}}
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
            
          </div>
        )}
      </main>
    </div>
  );
}

OperatorView.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func,
  initialMachineId: PropTypes.string,
  onSwitchView: PropTypes.func
};
