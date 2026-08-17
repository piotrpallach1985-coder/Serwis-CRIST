import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function Login({ onLogin, currentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Status połączenia z bazą
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'error'
  const [loginModalTarget, setLoginModalTarget] = useState(null); // null = modal zamknięty, otherwise tab id string

  useEffect(() => {
    const testConnection = async () => {
      try {
        const q = query(collection(db, 'users'), limit(1));
        await getDocs(q);
        setDbStatus('connected');
      } catch (error) {
        console.error("Błąd połączenia z Firebase:", error);
        setDbStatus('error');
      }
    };
    testConnection();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setErrorMsg('Brak dostępu. Twój adres e-mail nie został odnaleziony w bazie.');
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.password && userData.password !== password) {
          setErrorMsg('Podano nieprawidłowe hasło.');
        } else {
          // Ustawiamy docelową zakładkę w URL aby ManagerView wiedziało, gdzie przekierować
          if (loginModalTarget) {
            window.history.replaceState({ module: loginModalTarget }, '', `?module=${loginModalTarget}`);
          }
          onLogin({ name: userData.name, role: userData.role });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Błąd połączenia z serwerem logowania.');
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
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 text-[#111827] relative">
      
      {/* Wskaźnik stanu bazy */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-bold">
        {dbStatus === 'checking' && (
          <><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span> Łączenie z Firebase...</>
        )}
        {dbStatus === 'connected' && (
          <><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span> Baza połączona</>
        )}
        {dbStatus === 'error' && (
          <><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Błąd bazy danych</>
        )}
      </div>

      {/* Logo / Header */}
      <div className="text-center mb-12 animate-fade-in mt-6">
        <div className="flex justify-center mb-4">
          <i className="ph ph-buildings text-5xl text-[#111827]"></i>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">CRIST S.A.</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">MAINT SYSTEM PORTAL</p>
      </div>

      {/* Grid kafelków */}
      <div className="w-full max-w-5xl animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map(tile => (
          <div key={tile.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="w-full flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${tile.iconBg}`}>
                <i className={`ph ${tile.icon} text-4xl`}></i>
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">{tile.title}</h2>
              <p className="text-gray-500 text-sm mb-6 line-clamp-3">{tile.desc}</p>
            </div>
            <button
              onClick={tile.action}
              className={`w-full ${tile.color} text-white font-bold text-sm py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2`}
            >
              Wejdź
              <i className="ph ph-arrow-right font-bold"></i>
            </button>
          </div>
        ))}
      </div>

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
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors mt-4 shadow-md flex items-center justify-center gap-2"
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