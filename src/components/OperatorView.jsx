import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OperatorScanner from './operator/OperatorScanner';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, setDoc, query, where, getDocs, limit } from 'firebase/firestore';
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

  
  const tenantId = getCurrentTenant();
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const reportersList = []; // Usunięto (Blind Drop)
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

  const handleScanSuccess = async (decodedText) => {
    let mId = decodedText;
    let tenantFromQr = null;
    
    const match = decodedText.match(/machine=([^&]+)/);
    if (match) mId = match[1];
    
    const tMatch = decodedText.match(/tenant=([^&#]+)/);
    if (tMatch) tenantFromQr = tMatch[1];

    if (tenantFromQr && tenantFromQr !== tenantId) {
      useManagerStore.getState().setTenantId(tenantFromQr);
      const base = window.location.pathname;
      window.location.replace(base + "?tenant=" + tenantFromQr + "#/operator?step=form&machine=" + mId);
      return;
    }
    
    let targetMachine = machines.find(m => m.id === mId || (m.qrCode && (m.qrCode === mId || m.qrCode === decodedText)) || (m.internalId && m.internalId.toLowerCase() === mId.toLowerCase()));
    
    if (!targetMachine && mId && tenantId) {
      try {
        const d = await getDoc(doc(db, "tenants", tenantId, "machines", mId));
        if (d.exists() && !d.data().isDeleted) {
          targetMachine = { id: d.id, ...d.data() };
        } else {
          const q = query(collection(db, "tenants", tenantId, "machines"), where("qrCode", "==", decodedText), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty && !snap.docs[0].data().isDeleted) {
            targetMachine = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }
      } catch (e) {}
    }
    
    if (targetMachine) {
      setSelectedMachine(targetMachine);
      setSearchParams({ step: "form", machine: targetMachine.id }, { replace: true });
      setStep("form");
    } else {
      setSelectedMachine({ id: "manual", name: "Nieznana Maszyna", manualInput: mId });
      setSearchParams({ step: "form", machine: "manual" }, { replace: true });
      setStep("form");
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

      authUnsub = onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
          if (authUser.isAnonymous && tenantId) {
            try {
              const sRef = doc(db, 'anon_sessions', authUser.uid);
              const sSnap = await getDoc(sRef);
              if (!sSnap.exists()) {
                await setDoc(sRef, { tenantId, createdAt: serverTimestamp() });
              }
            } catch (e) {
              console.warn("Could not bind anon session:", e);
            }
          }
          // Firebase Auth confirms we have a token, safe to attach listeners
          
          unsubscribeMachines = onSnapshot(query(collection(db, 'tenants', tenantId, 'machines'), where('isDeleted', '==', false)), (snapshot) => {
            setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Re-resolve URL machine ID if it's pending
            if (urlMachineId && !urlMachineResolvedRef.current) {
              const target = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).find(m => 
                m.id === urlMachineId || 
                (m.qrCode && m.qrCode === urlMachineId) || 
                (m.internalId && m.internalId.toLowerCase() === urlMachineId.toLowerCase())
              );
              if (target) {
                setSelectedMachine(target);
                urlMachineResolvedRef.current = true;
                setStep("form");
              }
            }
          });

      

      unsubscribeTopics = onSnapshot(collection(db, 'tenants', tenantId, 'topics'), (querySnapshot) => {
        setTopicsList(querySnapshot.docs.map(d => d.data()).filter(d => !d.isDeleted).map(d => d.text));
      }, (error) => console.error("SNAPSHOT ERROR FOR topics:", error));

      

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
