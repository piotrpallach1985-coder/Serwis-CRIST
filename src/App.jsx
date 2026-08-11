import { useState, useEffect } from 'react';
import Login from './components/Login';
import OperatorView from './components/OperatorView';
import ManagerView from './components/ManagerView';

export default function App() {
  const [user, setUser] = useState(null);
  const [urlMachineId, setUrlMachineId] = useState(null);
  const [adminView, setAdminView] = useState('manager'); // Domyślny widok dla admina

  // Sprawdzanie parametrów w adresie URL po załadowaniu strony (np. ?machine=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const machineParam = params.get('machine');
    if (machineParam) {
      setUrlMachineId(machineParam);
    }
  }, []);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Ustalenie aktywnego widoku na podstawie roli i ew. wyboru admina
  const currentView = user.role === 'admin' ? adminView : user.role;

  if (currentView === 'operator') {
    return (
      <OperatorView 
        user={user} 
        onLogout={() => setUser(null)} 
        initialMachineId={urlMachineId}
        onSwitchView={user.role === 'admin' ? () => setAdminView('manager') : null}
      />
    );
  }

  return (
    <ManagerView 
      user={user} 
      onLogout={() => setUser(null)} 
      onSwitchView={user.role === 'admin' ? () => setAdminView('operator') : null}
    />
  );
}