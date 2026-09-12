import QRScannerModal from './shared/QRScannerModal';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { generateAuditorReport } from '../utils/reports/auditorExport';
import { db, auth } from '../firebase';
import { USER_ROLES } from '../utils/constants';

export default function Login({ onLogin, currentUser }) {
  const [isScanning, setIsScanning] = useState(false);
  const handleScanSuccess = async (machineId) => {
    setIsScanning(false);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous sign-in failed', e);
    }
    window.history.replaceState({ module: 'master_data', tab: 'machines' }, '', '?module=master_data&tab=machines&openMachine=' + machineId);
    onLogin(currentUser);
  };
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [dbStatus, setDbStatus] = useState('checking'); 
  const [loginModalTarget, setLoginModalTarget] = useState(null); 

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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setErrorMsg('Zalogowano, ale brak przypisanej roli w bazie danych.');
      } else {
        const userData = userDoc.data();
        const targetModule = (loginModalTarget && loginModalTarget !== 'login_only') ? loginModalTarget : 'home';
        window.history.replaceState({ module: targetModule, tab: targetModule === 'home' ? 'home' : undefined }, '', `?module=${targetModule}${targetModule === 'home' ? '&tab=home' : ''}`);
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

  const handleOperatorBypass = async () => {
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous sign-in failed', e);
    }
    window.history.replaceState({ module: 'operator' }, '', `?module=operator`);
    onLogin({ name: 'Nieznany Zgłaszający', role: USER_ROLES.OPERATOR, uid: auth.currentUser?.uid || 'anon' });
  };

  const handleTileClick = (target) => {
    if (currentUser) {
      window.history.replaceState({ module: target }, '', `?module=${target}`);
      onLogin(currentUser);
    } else {
      setLoginModalTarget(target);
    }
  };

  const tiles = [
    {
      id: 'dtr_scanner',
      title: 'Skaner QR',
      desc: '',
      icon: 'ph-qr-code',
      color: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-50 text-blue-600',
      action: () => setIsScanning(true)
    },
    {
      id: 'ur_panel',
      title: 'Panel UR',
      desc: '',
      icon: 'ph-wrench',
      color: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-50 text-red-600',
      action: () => handleTileClick('tickets')
    },
    {
      id: 'master_data',
      title: 'Administrator',
      desc: '',
      icon: 'ph-database',
      color: 'bg-[#111827] hover:bg-gray-800',
      iconBg: 'bg-gray-100 text-[#111827]',
      action: () => handleTileClick('master_data')
    },
    {
      id: 'admin_program',
      title: 'Administrator Programu',
      desc: '',
      icon: 'ph-gear',
      color: 'bg-gray-600 hover:bg-gray-700',
      iconBg: 'bg-gray-50 text-gray-600',
      action: () => alert('Panel Administratora Programu w budowie')
    }
  ];

  return (
    <div className="min-h-[100svh] bg-[#f8f9fa] flex flex-col items-center justify-center p-2 pt-16 sm:p-4 sm:pt-4 text-[#111827] relative">
      
      {/* GÓRNY PASEK LOGO (Logo aplikacji) */}
      <div className="absolute top-4 left-4 z-50">
        <img src={branding?.appLogoUrl || '/pwa-192x192.jpg'} alt="App Logo" className="h-16 sm:h-24 object-contain rounded-lg" />
      </div>
      
      {currentUser && currentUser.role !== 'operator' && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="font-bold text-gray-800 text-xs sm:text-sm">
            <span className="hidden sm:inline">Zalogowano jako: </span><span className="text-blue-600">{currentUser.name}</span>
          </div>
          <button onClick={() => onLogin(null)} className="ml-2 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors font-bold text-xs sm:text-sm">
            <i className="ph ph-sign-out text-lg sm:text-xl"></i>
            <span>Wyloguj</span>
          </button>
        </div>
      )}

      <div className="mb-6 md:mb-12 text-center animate-fade-in-up mt-8 sm:mt-0">
        <div className="flex justify-center mb-3 sm:mb-5">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center font-bold text-blue-900 overflow-hidden shadow-lg border border-slate-100 shrink-0">
              {branding.companyLogoUrl ? (
                <img src={branding.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-2 sm:p-3" />
              ) : (
                <span className="text-4xl sm:text-5xl">{branding?.companyName?.charAt(0) || 'C'}</span>
              )}
            </div>
          </div>
          <h1 className="font-black text-xl sm:text-2xl leading-tight tracking-wide text-blue-900 mb-6">
            VexoNT &bull; MAINTANCE SYSTEM
          </h1>
      </div>

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
              if (t.id === 'operator') return false;
              if (t.id === 'tickets' && !modSettings.enableTickets) return false;
              if (t.id === 'planned_maintenance' && !modSettings.enablePlanned) return false;
              return true;
            }).map(tile => (
              <div key={tile.id} onClick={tile.action} className="cursor-pointer bg-white p-2 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
                <div className="w-full flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 ${tile.iconBg}`}>
                    <i className={`ph ${tile.icon} text-xl md:text-3xl`}></i>
                  </div>
                  <h2 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-gray-800 leading-tight">{tile.title}</h2>
                  {tile.desc && (
                    <p className="text-gray-500 text-[10px] md:text-sm mb-2 md:mb-6 line-clamp-3 md:line-clamp-3 leading-tight">{tile.desc}</p>
                  )}
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

      <QRScannerModal 
        isOpen={isScanning} 
        onClose={() => setIsScanning(false)} 
        onScanSuccess={handleScanSuccess} 
        title="Skanuj kod QR maszyny"
        subtitle="Skieruj aparat na kod QR, aby odczytać dokumenty DTR."
      />

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
