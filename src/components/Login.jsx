import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Status połączenia z bazą
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'error'

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Próbny, lekki odczyt z bazy by zweryfikować konfigurację
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
    onLogin({ name: 'Nieznany Zgłaszający', role: 'operator' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 text-[#111827]">
      
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
      <div className="text-center mb-12 animate-fade-in mt-10">
        <div className="flex justify-center mb-4">
          <i className="ph ph-buildings text-5xl text-[#111827]"></i>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">CRIST S.A.</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">MAINT SYSTEM</p>
      </div>

      <div className="w-full max-w-4xl animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sekcja 1: Anonimowe zgłaszanie (Panel Operatora) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center space-y-6">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-2">
            <i className="ph ph-qr-code text-5xl text-blue-600"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Pracownik Hali</h2>
            <p className="text-gray-500 text-sm">Zgłaszanie usterek przez skanowanie QR bezpośrednio na stanowisku. Brak konieczności zakładania konta.</p>
          </div>
          <button
            onClick={handleOperatorBypass}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-5 rounded-xl transition-colors uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          >
            <i className="ph ph-wrench text-2xl"></i>
            Zgłoś Awarię
          </button>
        </div>

        {/* Sekcja 2: Logowanie dyspozytorni */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Panel Dyspozytorni</h2>
          <p className="text-gray-500 text-sm mb-6 text-center">Dostęp zarezerwowany dla autoryzowanego personelu UR.</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adres e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-medium bg-gray-50"
                placeholder="dyspozytor@crist.pl"
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
            {errorMsg && <div className="text-red-500 text-sm font-bold text-center mt-2">{errorMsg}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors mt-4 shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                'Logowanie...'
              ) : (
                <>
                  <i className="ph ph-sign-in text-xl"></i>
                  Zaloguj się
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}