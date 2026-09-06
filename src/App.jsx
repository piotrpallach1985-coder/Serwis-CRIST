import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import OperatorView from './components/OperatorView';
import ManagerView from './components/ManagerView';
import OfflineSyncManager from './components/OfflineSyncManager';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [currentModule, setCurrentModule] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('module');
  });

  const [urlMachineId, setUrlMachineId] = useState(null);
  const [adminView, setAdminView] = useState('manager'); // Domyślny widok dla admina

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          // Anonimowy operator
          setUser({ name: 'Nieznany Zgłaszający', role: 'operator', uid: firebaseUser.uid });
        } else {
          // Zwykły użytkownik – pobieramy jego rolę z bazy
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                name: userData.name || firebaseUser.email,
                role: userData.role || 'brak',
                permissions: userData.permissions || []
              });
              const params = new URLSearchParams(window.location.search);
              if (!params.get('module')) {
                setCurrentModule('home');
              }
            } else {
              setUser(null);
            }
          } catch (e) {
            console.error('Błąd weryfikacji roli:', e);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to popstate to update currentModule if user navigates back
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentModule(params.get('module'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetUser = (userData) => {
    // onLogin z Login.jsx wciąż działa, by natychmiast odświeżyć UI bez czekania na hook firestore
    setUser(userData);
    if (!userData) { 
      auth.signOut(); // Trwałe wylogowanie z bazy
      setUrlMachineId(null); 
      window.history.replaceState({}, '', window.location.pathname); 
      setCurrentModule(null);
    } else {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module') || (userData.role === 'operator' ? 'operator' : 'home');
      setCurrentModule(mod);
    }
  };

  // Sprawdzanie parametrów w adresie URL po załadowaniu strony (np. ?machine=xyz)
  useEffect(() => {
    if (isAuthLoading) return; // Czekamy aż będzie znany użytkownik
    
    const params = new URLSearchParams(window.location.search);
    const machineParam = params.get('machine');
    if (machineParam) {
      if (user && user.role !== 'operator') {
        const params = new URLSearchParams(window.location.search);
        params.set('module', 'master_data');
        params.set('tab', 'machines');
        params.set('openMachine', machineParam);
        params.delete('machine');
        window.history.replaceState({ module: 'master_data', tab: 'machines', openMachine: machineParam }, '', '?' + params.toString());
        setCurrentModule('master_data');
      } else {
        setUrlMachineId(machineParam);
        window.history.replaceState({ module: 'operator' }, '', '?module=operator&machine=' + machineParam);
        setCurrentModule('operator');
        // Jeśli nie jest anonimowo zalogowany, handleSetUser zostanie wywołany przy skanie
      }
    }
  }, [isAuthLoading, user?.role]); // Przelicz gdy auth się załaduje

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center">
          <i className="ph ph-spinner animate-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-500 font-medium animate-pulse">Ładowanie sesji użytkownika...</p>
        </div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, pokaż portal logowania
  if (!user) {
    return <Login onLogin={handleSetUser} currentUser={user} />;
  }

  // Jeśli użytkownik jest zalogowany, ale nie wybrano modułu w URL
  if (!currentModule) {
    if (user.role === 'operator') {
      return <Login onLogin={handleSetUser} currentUser={user} />;
    }
    // Dla pracowników i adminów domyślnym modułem po zalogowaniu jest Pulpit Główny
    return (
      <>
        <OfflineSyncManager />
        <ManagerView 
          user={user} 
          onLogout={() => handleSetUser(null)} 
          onSwitchView={user.role === 'admin' ? () => setAdminView('operator') : null}
        />
      </>
    );
  }

  // Ustalenie aktywnego widoku na podstawie roli i ew. wyboru admina
  const currentView = (user.role === 'admin' || user.role === 'kierownik' || user.role === 'tech') ? adminView : user.role;

  if (currentView === 'operator') {
    return (
      <>
        <OfflineSyncManager />
        <OperatorView 
          user={user} 
          onLogout={() => handleSetUser(null)} 
          initialMachineId={urlMachineId}
          onSwitchView={user.role === 'admin' ? () => setAdminView('manager') : null}
        />
      </>
    );
  }

  return (
    <>
      <OfflineSyncManager />
      <ManagerView 
        user={user} 
        onLogout={() => handleSetUser(null)} 
        onSwitchView={user.role === 'admin' ? () => setAdminView('operator') : null}
      />
    </>
  );
}