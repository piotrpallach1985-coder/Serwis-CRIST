import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Tryb gościa
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestRole, setGuestRole] = useState('operator');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setErrorMsg('Brak dostępu. Twój adres e-mail nie został odnaleziony w bazie. Skontaktuj się z administratorem.');
      } else {
        const userData = querySnapshot.docs[0].data();
        onLogin({ name: userData.name, role: userData.role });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Błąd połączenia z serwerem logowania.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (guestName.trim() !== '') {
      onLogin({ name: guestName.trim() + " (Gość)", role: guestRole });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 text-[#111827]">
      
      {/* Logo / Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex justify-center mb-4">
          <i className="ph ph-buildings text-5xl text-[#111827]"></i>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">CRIST S.A.</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">MAINT SYSTEM</p>
      </div>

      {!showGuestPrompt ? (
        <div className="w-full max-w-md animate-fade-in space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Logowanie</h2>
            <p className="text-gray-500 text-sm mb-6">Wpisz swój autoryzowany adres e-mail</p>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none text-center font-medium bg-gray-50"
                placeholder="twoj@email.pl"
                required
                autoFocus
              />
              {errorMsg && <div className="text-red-500 text-sm font-bold">{errorMsg}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </form>
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => setShowGuestPrompt(true)}
              className="text-gray-500 hover:text-gray-800 text-sm font-semibold underline underline-offset-4"
            >
              Chcę zalogować się tymczasowo jako Gość (bez e-maila)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-2">Dostęp Tymczasowy (Gość)</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Wpisz swoje imię i nazwisko oraz wybierz rolę.</p>
          
          <form onSubmit={handleGuestSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Twoje Imię i Nazwisko</label>
              <input
                type="text"
                autoFocus
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-bold text-lg bg-gray-50"
                placeholder="np. Jan Kowalski"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Wybierz Moduł</label>
              <select 
                value={guestRole}
                onChange={e => setGuestRole(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none bg-white font-medium"
              >
                <option value="operator">Panel Operatora (Zgłaszanie awarii)</option>
                <option value="manager">Panel Dyspozytora UT (Zarządzanie)</option>
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowGuestPrompt(false)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl transition-colors"
              >
                Wstecz
              </button>
              <button
                type="submit"
                className="w-2/3 bg-[#111827] hover:bg-gray-800 text-white font-bold py-4 px-4 rounded-xl transition-colors"
              >
                Wejdź jako Gość
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}