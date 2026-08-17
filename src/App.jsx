import { useState, useEffect } from 'react';
import Login from './components/Login';
import OperatorView from './components/OperatorView';
import ManagerView from './components/ManagerView';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('appUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [currentModule, setCurrentModule] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('module');
  });

  const [urlMachineId, setUrlMachineId] = useState(null);
  const [adminView, setAdminView] = useState('manager'); // Domyślny widok dla admina

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
    if (userData) {
      localStorage.setItem('appUser', JSON.stringify(userData));
    } else {
      localStorage.removeItem('appUser');
    }
    setUser(userData);
    
    // Update currentModule from URL after login
    const params = new URLSearchParams(window.location.search);
    setCurrentModule(params.get('module'));
  };

  // Sprawdzanie parametrów w adresie URL po załadowaniu strony (np. ?machine=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const machineParam = params.get('machine');
    if (machineParam) {
      setUrlMachineId(machineParam);
      // Jeśli wejście z kodu QR, automatycznie zaloguj jako operator
      handleSetUser({ name: 'Pracownik (QR)', role: 'operator' });
    }
  }, []);

  // Jeśli użytkownik nie jest zalogowany LUB jest zalogowany, ale nie wybrał modułu, pokaż portal (Login)
  if (!user || !currentModule) {
    return <Login onLogin={handleSetUser} currentUser={user} />;
  }

  // Ustalenie aktywnego widoku na podstawie roli i ew. wyboru admina
  const currentView = (user.role === 'admin' || user.role === 'kierownik' || user.role === 'tech') ? adminView : user.role;

  if (currentView === 'operator') {
    return (
      <OperatorView 
        user={user} 
        onLogout={() => handleSetUser(null)} 
        initialMachineId={urlMachineId}
        onSwitchView={user.role === 'admin' ? () => setAdminView('manager') : null}
      />
    );
  }

  return (
    <ManagerView 
      user={user} 
      onLogout={() => handleSetUser(null)} 
      onSwitchView={user.role === 'admin' ? () => setAdminView('operator') : null}
    />
  );
}