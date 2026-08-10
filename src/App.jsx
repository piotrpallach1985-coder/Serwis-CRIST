import { useState, useEffect } from 'react';
import Login from './components/Login';
import OperatorView from './components/OperatorView';
import ManagerView from './components/ManagerView';

export default function App() {
  const [user, setUser] = useState(null);
  const [urlMachineId, setUrlMachineId] = useState(null);

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

  if (user.role === 'operator') {
    return <OperatorView user={user} onLogout={() => setUser(null)} initialMachineId={urlMachineId} />;
  }

  return <ManagerView user={user} onLogout={() => setUser(null)} />;
}