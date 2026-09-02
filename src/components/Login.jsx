import { Html5Qrcode } from 'html5-qrcode';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { generateAuditorReport } from '../utils/reports/auditorExport';
import { db, auth } from '../firebase';

export default function Login({ onLogin, currentUser }) {
  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeRef = useRef(null);
  
  const startScanner = () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        if (html5QrcodeRef.current) {
          try { await html5QrcodeRef.current.stop(); } catch(e) {}
        }
        const html5QrCode = new Html5Qrcode('portal-qr-reader');
        html5QrcodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopScanner();
            let machineId = decodedText;
            if (decodedText.includes('?machine=')) {
              const urlParams = new URLSearchParams(decodedText.split('?')[1]);
              machineId = urlParams.get('machine');
            }
            window.history.replaceState({ module: 'master_data', tab: 'machines' }, '', '?module=master_data&tab=machines&openMachine=' + machineId);
            onLogin(currentUser); // Trigger reload with new module
          },
          () => {} // Ignore errors
        );
      } catch (err) {
        console.error('Scanner init error:', err);
        alert('Blad dostepu do kamery: ' + err.message);
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {}
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.stop(); } catch(e) {}
      }
    };
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Status połączenia z bazą
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'error'
  const [loginModalTarget, setLoginModalTarget] = useState(null); // null = modal zamknięty, otherwise tab id string

  const [branding, setBranding] = useState({
    companyName: 'CRIST S.A.',
    systemSubtitle: 'MAINT SYSTEM PORTAL',
    companyLogoUrl: '',
    appLogoUrl: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBranding(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsub();
  }, []);


  

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Zaloguj przez Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // 2. Pobierz rolę z kolekcji users (ID dokumentu to UID z Auth)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setErrorMsg('Zalogowano, ale brak przypisanej roli w bazie danych.');
      } else {
        const userData = userDoc.data();
        if (loginModalTarget && loginModalTarget !== 'login_only') {
          window.history.replaceState({ module: loginModalTarget }, '', `?module=${loginModalTarget}`);
        }
        window.history.replaceState({}, '', window.location.pathname);
        onLogin({ 
          uid: user.uid,
          name: userData.name || user.email, 
          role: userData.role || 'brak', 
          permissions: userData.permissions || [] 
        });
        setLoginModalTarget(null);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Nieprawidłowy e-mail lub hasło.');
      } else {
        setErrorMsg('Błąd: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorBypass = () => {
    window.history.replaceState({ module: 'operator' }, '', `?module=operator`);
    onLogin({ name: 'Nieznany Zgłaszający', role: 'operator' });
  };

  const handleTileClick = (target) => {
    if (currentUser) {
      // Omijamy logowanie, jeśli użytkownik jest już zalogowany (np. kliknął Wróć do portalu)
      window.history.replaceState({ module: target }, '', `?module=${target}`);
      onLogin(currentUser);
    } else {
      setLoginModalTarget(target);
    }
  };

  const tiles = [
        
{
      id: 'operator',
      title: 'Zgłoszenie Awarii',
      desc: 'Dla pracowników hali. Brak konieczności zakładania konta. Zgłoszenia bezpośrednio ze stanowiska.',
      icon: 'ph-warning-circle',
      color: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-50 text-blue-600',
      action: handleOperatorBypass
    },
    {
      id: 'tickets',
      title: 'Awarie UR',
      desc: 'Rejestr zgłoszonych awarii i interwencji ad-hoc. Mapa stoczni i zarządzanie biletami.',
      icon: 'ph-wrench',
      color: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-50 text-red-600',
      action: () => handleTileClick('tickets')
    },
    {
      id: 'planned_maintenance',
      title: 'Serwis UR',
      desc: 'Serwis planowany, przeglądy okresowe maszyn, harmonogramy i liczniki roboczogodzin.',
      icon: 'ph-calendar-check',
      color: 'bg-green-600 hover:bg-green-700',
      iconBg: 'bg-green-50 text-green-600',
      action: () => handleTileClick('planned_maintenance')
    },
    {
      id: 'master_data',
      title: 'Administracja',
      desc: 'Zarządzanie bazą maszyn, rejonami stoczni, użytkownikami i prawami dostępu (Master Data).',
      icon: 'ph-database',
      color: 'bg-[#111827] hover:bg-gray-800',
      iconBg: 'bg-gray-100 text-[#111827]',
      action: () => handleTileClick('master_data')
    },
{
      id: 'dtr_scanner',
      title: 'Maszyny / DTR',
      desc: 'Skanuj kod QR na hali, aby odczytac dokumenty DTR.',
      icon: 'ph-qr-code',
      color: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-50 text-blue-600',
      action: () => startScanner()
    },
  ];

  return (
    <div className="min-h-[100svh] bg-[#f8f9fa] flex flex-col items-center justify-center p-2 pt-16 sm:p-4 sm:pt-4 text-[#111827] relative">
      
      
      {/* Logo Aplikacji (Lewy Górny Róg) */}
      {currentUser && currentUser.role !== 'operator' && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="font-bold text-gray-800 text-xs sm:text-sm">
            <span className="hidden sm:inline">Zalogowano jako: </span><span className="text-blue-600">{currentUser.name}</span>
          </div>
          <button 
            onClick={() => { import("firebase/auth").then(({ signOut }) => signOut(auth)); onLogin(null); }} 
            className="text-red-500 hover:bg-red-50 p-1 sm:px-3 sm:py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 text-xs sm:text-sm"
          >
            <i className="ph ph-sign-out"></i> <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      )}

        {branding.appLogoUrl && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50">
          <img src={branding.appLogoUrl} alt="App Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 object-contain drop-shadow-sm rounded-xl overflow-hidden" />
        </div>
      )}

      

      
      {/* Logo / Header */}
      <div className="text-center mb-6 animate-fade-in mt-2">
        <div className="flex justify-center mb-4 min-h-[64px] items-center">
          {branding.companyLogoUrl ? (
            <img src={branding.companyLogoUrl} alt="Company Logo" className="max-h-16 max-w-[200px] object-contain rounded-2xl overflow-hidden" />
          ) : (
            <i className="ph ph-buildings text-5xl text-[#111827]"></i>
          )}
        </div>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight mb-1 md:mb-2">{branding.companyName}</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{branding.systemSubtitle}</p>
      </div>

      {/* Grid kafelków */}
      {!currentUser ? (
        <div className="w-full max-w-4xl animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
          <div 
            onClick={handleOperatorBypass}
            className="cursor-pointer bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-yellow-50 text-yellow-500 animate-pulse">
              <i className="ph-fill ph-warning text-2xl md:text-3xl"></i>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-3 text-gray-800">Zgłoszenie Awarii</h2>
            <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">Dla pracowników. Zgłoszenia bezpośrednio ze stanowiska, bez logowania.</p>
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 md:py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              Zgłoś awarię <i className="ph ph-arrow-right font-bold"></i>
            </button>
          </div>

          <div 
            onClick={() => setLoginModalTarget('login_only')}
            className="cursor-pointer bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-blue-50 text-blue-600">
              <i className="ph-fill ph-gear text-2xl md:text-3xl animate-[spin_4s_linear_infinite]"></i>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-3 text-gray-800">Utrzymanie Ruchu</h2>
            <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">Dostęp dla autoryzowanych pracowników działu Utrzymania Ruchu.</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              Zaloguj się <i className="ph ph-lock-key font-bold"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl animate-fade-in">
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {tiles.filter(t => {
              // usunięte: pozwalamy wejść do modułu, uprawnienia są weryfikowane przez ManagerView
              if (t.id === 'operator') return false;
              if (t.id === 'tickets' && !modSettings.enableTickets) return false;
              if (t.id === 'planned_maintenance' && !modSettings.enablePlanned) return false; // Ukryte w widoku zalogowanym
              return true;
            }).map(tile => (
              <div key={tile.id} onClick={tile.action} className="cursor-pointer bg-white p-2 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
                <div className="w-full flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 ${tile.iconBg}`}>
                    <i className={`ph ${tile.icon} text-xl md:text-3xl`}></i>
                  </div>
                  <h2 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-gray-800 leading-tight">{tile.title}</h2>
                  <p className="text-gray-500 text-[10px] md:text-sm mb-2 md:mb-6 line-clamp-3 md:line-clamp-3 leading-tight">{tile.desc}</p>
                </div>
                <button
                  onClick={tile.action}
                  className={`w-full ${tile.color} text-white font-bold text-sm py-2 md:py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2`}
                >
                  Wejdź
                  <i className="ph ph-arrow-right font-bold"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      
          


            {isScanning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 relative flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-slate-800">Skanuj kod QR maszyny</h3>
              <button onClick={stopScanner} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <i className="ph ph-x"></i>
              </button>
            </div>
            <div id="portal-qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
            <p className="text-xs text-center text-slate-500">
              Skieruj aparat na kod QR, aby otworzyc dokumenty DTR.
            </p>
          </div>
        </div>
      )}
      {/* Modal logowania */}
      {loginModalTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button 
              onClick={() => setLoginModalTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ph ph-x text-2xl"></i>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ph ph-lock-key text-3xl text-gray-700"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Logowanie</h2>
              <p className="text-gray-500 text-sm mt-1">Dostęp wymaga autoryzacji do wybranego modułu.</p>
            </div>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adres e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-medium bg-gray-50"
                  placeholder="twój.email@crist.pl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-medium bg-gray-50"
                  placeholder="••••••••"
                  required
                />
              </div>
              {errorMsg && <div className="text-red-500 text-sm font-bold text-center mt-2 bg-red-50 py-2 rounded-lg">{errorMsg}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-2 md:py-3 rounded-xl transition-colors mt-4 shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się i przejdź'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}