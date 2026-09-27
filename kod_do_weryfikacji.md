# KOD ŹRÓDŁOWY APLIKACJI SERWIS CRIST DO AUDYTU



=========================================
📄 PLIK: src\App.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import Login from './components/Login';
import OperatorView from './components/OperatorView';
import ManagerView from './components/ManagerView';
import OfflineSyncManager from './components/OfflineSyncManager';

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
    if (!userData) { setUrlMachineId(null); window.history.replaceState({}, '', window.location.pathname); }
    
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
      // Jeśli wejście z kodu QR, ustaw moduł i zaloguj automatycznie
      window.history.replaceState({ module: 'operator' }, '', `?module=operator&machine=${machineParam}`);
      setCurrentModule('operator');
      handleSetUser({ name: 'Pracownik (QR)', role: 'operator' });
    }
  }, []);

  // Jeśli użytkownik nie jest zalogowany LUB jest zalogowany, ale nie wybrał modułu, pokaż portal (Login)
  if (!user || !currentModule) {
    if (user && user.role === 'operator') {
      setTimeout(() => handleSetUser(null), 0);
    }
    return <Login onLogin={handleSetUser} currentUser={user} />;
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
```


=========================================
📄 PLIK: src\components\checklists\ChecklistBuilder.jsx
=========================================

```javascript
import React, { useState } from 'react';

const STEP_TYPES = [
  { value: 'CHECKBOX', label: 'Zwykłe odhaczenie' },
  { value: 'VALUE_INPUT', label: 'Wpisanie wartości' },
  { value: 'PHOTO', label: 'Wymagane zdjęcie' }
];

export default function ChecklistBuilder({ steps, onChange }) {
  const addStep = () => {
    const newStep = {
      id: Math.random().toString(36).substr(2, 9),
      taskName: '',
      type: 'CHECKBOX',
      isRequired: true
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (id, field, value) => {
    onChange(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
  };

  const removeStep = (id) => {
    onChange(steps.filter(step => step.id !== id));
  };

  const moveStep = (index, direction) => {
    if (index + direction < 0 || index + direction >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    onChange(newSteps);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Lista Kontrolna (Checklista)</h3>
        <button type="button" 
          onClick={(e) => { e.preventDefault(); addStep(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <i className="ph ph-plus"></i> Dodaj krok
        </button>
      </div>

      {steps.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          Brak kroków. Dodaj pierwszy krok listy kontrolnej.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              
              {/* Kolejność */}
              <div className="flex flex-row sm:flex-col gap-1 items-center">
                <button type="button" 
                  onClick={(e) => { e.preventDefault(); moveStep(index, -1); }}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <i className="ph ph-caret-up text-lg"></i>
                </button>
                <button type="button" 
                  onClick={(e) => { e.preventDefault(); moveStep(index, 1); }}
                  disabled={index === steps.length - 1}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <i className="ph ph-caret-down text-lg"></i>
                </button>
              </div>

              {/* Zawartość */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Treść zadania</label>
                  <input 
                    type="text" 
                    value={step.taskName} 
                    onChange={(e) => updateStep(step.id, 'taskName', e.target.value)}
                    placeholder="Naciśnij, aby wpisać..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="w-full sm:w-48 shrink-0">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Typ odpowiedzi</label>
                  <select 
                    value={step.type}
                    onChange={(e) => updateStep(step.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {STEP_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-20 shrink-0 flex flex-col justify-center items-center">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Wymagane</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={step.isRequired}
                      onChange={(e) => updateStep(step.id, 'isRequired', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Akcje */}
              <button type="button" 
                onClick={(e) => { e.preventDefault(); removeStep(step.id); }}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto sm:ml-0"
                title="Usuń krok"
              >
                <i className="ph ph-trash text-lg"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\checklists\ChecklistExecutor.jsx
=========================================

```javascript
import React, { useState, useEffect } from 'react';

export default function ChecklistExecutor({ steps, onComplete, initialResponses = {} }) {
  const [responses, setResponses] = useState(initialResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  const updateResponse = (id, value) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  // Zmockowana funkcja do uploadu zdjęcia do Firebase Storage
  const mockUploadPhoto = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Zwracamy zmockowany URL zdjęcia (w prawdziwym kodzie będzie to url z getDownloadURL)
        resolve(URL.createObjectURL(file));
      }, 1500);
    });
  };

  const handlePhotoChange = async (e, stepId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhotoId(stepId);
    try {
      // TU PODPIĄĆ PRAWDZIWY UPLOAD DO FIREBASE STORAGE
      // np. const storageRef = ref(storage, `checklists/\${Date.now()}_\${file.name}`);
      // await uploadBytes(storageRef, file);
      // const url = await getDownloadURL(storageRef);
      
      const photoUrl = await mockUploadPhoto(file);
      updateResponse(stepId, photoUrl);
    } catch (err) {
      alert("Błąd podczas wgrywania zdjęcia: " + err.message);
    } finally {
      setUploadingPhotoId(null);
    }
  };

  // Walidacja - czy wszystkie wymagane pola są wypełnione
  const isFormValid = () => {
    if (!steps || steps.length === 0) return true;
    
    return steps.every(step => {
      if (!step.isRequired) return true;
      const val = responses[step.id];
      if (step.type === 'CHECKBOX') return val === true;
      if (step.type === 'VALUE_INPUT') return val !== undefined && val !== null && val.toString().trim() !== '';
      if (step.type === 'PHOTO') return val && val.length > 0;
      return true;
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    try {
      await onComplete(responses);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        Brak przypisanej listy kontrolnej do tego serwisu.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const val = responses[step.id];
          const isMissing = step.isRequired && (
            (step.type === 'CHECKBOX' && val !== true) ||
            (step.type === 'VALUE_INPUT' && (!val || val.toString().trim() === '')) ||
            (step.type === 'PHOTO' && !val)
          );

          return (
            <div 
              key={step.id} 
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-colors ${lockedSteps[step.id] ? 'border-gray-300 bg-gray-100 opacity-75' : (isMissing ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-800 text-lg flex items-start gap-2">
                    <span className="bg-white text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 border border-gray-200 shadow-sm">
                      {index + 1}
                    </span>
                    {step.taskName || 'Nienazwane zadanie'}
                  </h4>
                  {step.isRequired && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-100 px-2 py-1 rounded-md shrink-0">
                      Wymagane
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {step.type === 'CHECKBOX' && (
                    <label className="flex items-center gap-3 cursor-pointer p-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white">
                        <input 
                          type="checkbox"
                          className="opacity-0 absolute w-full h-full cursor-pointer"
                          checked={val === true}
                          onChange={(e) => updateResponse(step.id, e.target.checked)}
                        />
                        {val === true && <i className="ph-bold ph-check text-2xl text-blue-600"></i>}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {val ? 'Odhaczone' : 'Do wykonania'}
                      </span>
                    </label>
                  )}

                  {step.type === 'VALUE_INPUT' && (
                    <input 
                      type="text"
                      value={val || ''}
                      onChange={(e) => updateResponse(step.id, e.target.value)}
                      placeholder="Wprowadź wartość..."
                      className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    />
                  )}

                  {step.type === 'PHOTO' && (
                    <div className="flex flex-col gap-2">
                      {val ? (
                        <div className="relative">
                          <img src={val} alt="Załącznik" className="w-full h-24 sm:h-32 sm:h-48 object-cover rounded-xl border-2 border-gray-200" />
                          <button 
                            onClick={() => updateResponse(step.id, null)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                          >
                            <i className="ph ph-x text-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          {uploadingPhotoId === step.id ? (
                            <div className="flex flex-col items-center gap-2 text-blue-600">
                              <i className="ph ph-spinner-gap animate-spin text-3xl"></i>
                              <span className="font-semibold text-sm">Wgrywanie...</span>
                            </div>
                          ) : (
                            <>
                              <i className="ph ph-camera text-4xl text-gray-400 mb-2"></i>
                              <span className="font-semibold text-gray-600">Zrób zdjęcie / Wgraj plik</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoChange(e, step.id)}
                              />
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  )}
                
                <div className="mt-4 flex justify-end">
                  {!lockedSteps[step.id] ? (
                    <button
                      onClick={() => setLockedSteps(prev => ({...prev, [step.id]: true}))}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-colors shadow-sm"
                    >
                      Wykonana
                    </button>
                  ) : (
                    <button
                      onClick={() => setLockedSteps(prev => ({...prev, [step.id]: false}))}
                      className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors shadow-sm"
                    >
                      Edytuj
                    </button>
                  )}
                </div>
</div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isFormValid() || isSubmitting}
        className="w-full bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <>
            <i className="ph ph-spinner-gap animate-spin text-2xl"></i> Zapisywanie...
          </>
        ) : (
          <>
            <i className="ph-fill ph-check-circle text-2xl"></i> Zatwierdź Serwis
          </>
        )}
      </button>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\Login.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { generateAuditorReport } from '../utils/reports/auditorExport';
import { db, auth } from '../firebase';

export default function Login({ onLogin, currentUser }) {
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
    }
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">{branding.companyName}</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{branding.systemSubtitle}</p>
      </div>

      {/* Grid kafelków */}
      {!currentUser ? (
        <div className="w-full max-w-4xl animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            onClick={handleOperatorBypass}
            className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-yellow-50 text-yellow-500 animate-pulse">
              <i className="ph-fill ph-warning text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Zgłoszenie Awarii</h2>
            <p className="text-gray-500 text-sm mb-4">Dla pracowników. Zgłoszenia bezpośrednio ze stanowiska, bez logowania.</p>
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              Zgłoś awarię <i className="ph ph-arrow-right font-bold"></i>
            </button>
          </div>

          <div 
            onClick={() => setLoginModalTarget('login_only')}
            className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-50 text-blue-600">
              <i className="ph-fill ph-gear text-3xl animate-[spin_4s_linear_infinite]"></i>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Utrzymanie Ruchu</h2>
            <p className="text-gray-500 text-sm mb-4">Dostęp dla autoryzowanych pracowników działu Utrzymania Ruchu.</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              Zaloguj się <i className="ph ph-lock-key font-bold"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiles.filter(t => {
              // usunięte: pozwalamy wejść do modułu, uprawnienia są weryfikowane przez ManagerView
              if (t.id === 'operator') return false;
              if (t.id === 'tickets' && !modSettings.enableTickets) return false;
              if (t.id === 'planned_maintenance' && !modSettings.enablePlanned) return false; // Ukryte w widoku zalogowanym
              return true;
            }).map(tile => (
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
                  className={`w-full ${tile.color} text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2`}
                >
                  Wejdź
                  <i className="ph ph-arrow-right font-bold"></i>
                </button>
              </div>
            ))}
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
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-md flex items-center justify-center gap-2"
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
```


=========================================
📄 PLIK: src\components\manager\ActionItems.jsx
=========================================

```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { exportToExcel } from '../../utils/reports/excelExport';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';

export default function ActionItems({ machines, user }) {
  const [items, setItems] = useState([]);
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => {
      const createdDate = safeParseDate(item.createdAt);
      const dueDate = safeParseDate(item.dueDate);
      const completedDate = safeParseDate(item.completedAt);
      return {
        'ID': item.id,
        'Data Zgłoszenia': createdDate ? createdDate.toLocaleDateString('pl-PL') : '-',
        'Maszyna': item.machineName || getMachineName(item.machineId) || '-',
        'Problem / Zadanie': item.problem || '-',
        'Wymagany Termin': dueDate ? dueDate.toLocaleDateString('pl-PL') : '-',
        'Zgłaszający': item.createdBy || '-',
        'Status': item.status === 'completed' ? 'Zrealizowane' : 'Oczekujące',
        'Zrealizował(a)': item.completedBy || '-',
        'Data Realizacji': completedDate ? completedDate.toLocaleDateString('pl-PL') : '-'
      };
    });
    exportToExcel(dataToExport, 'Tematy_do_realizacji');
  };

  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterTime, setFilterTime] = useState('all');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');

  // Regions list extracted from machines
  const regions = useMemo(() => {
    const rSet = new Map();
    machines.forEach(m => {
      if (m.regionId) rSet.set(m.regionId, { id: m.regionId, name: m.regionId }); // Simplified
    });
    return Array.from(rSet.values());
  }, [machines]);


  useEffect(() => {
    const q = query(collection(db, 'action_items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.isDeleted));
    }, (err) => {
      alert('Błąd ładowania Tematów do Realizacji: ' + err.message);
      console.error(err);
    });
    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);

    let filtered = items.filter(item => {
      // 1. Status Filter
      if (filterStatus === 'pending' && item.status === 'completed') return false;
      if (filterStatus === 'completed' && item.status !== 'completed') return false;

      const machine = machines.find(m => m.id === item.machineId);

      // 2. Region Filter
      if (filterRegion && machine?.regionId !== filterRegion) return false;

      // 3. Machine Filter
      if (filterMachine && item.machineId !== filterMachine) return false;

      // 4. Time Filter
      if (filterTime !== 'all') {
        if (!item.dueDate) return false;
        const dDate = safeParseDate(item.dueDate);
        if (!dDate) return false;
        
        let isWithinTime = false;
        if (filterTime === '30' && dDate <= future30) isWithinTime = true;
        if (filterTime === '90' && dDate <= future90) isWithinTime = true;
        
        if (!isWithinTime) return false;
      }

      return true;
    });
    
    // Sort logic (optional, already sorted by createdAt desc by default, but we can keep it as is or sort by dueDate)
    return filtered.sort((a,b) => {
       const isAClosed = a.status === 'completed';
       const isBClosed = b.status === 'completed';
       if (isAClosed && !isBClosed) return 1;
       if (!isAClosed && isBClosed) return -1;
       const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
       const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
       return dA - dB;
    });
  }, [items, filterStatus, filterTime, filterRegion, filterMachine, machines]);

  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'Nieznana maszyna';

  const handleComplete = async (id) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten temat jako zrealizowany?')) {
      try {
        await updateDoc(doc(db, 'action_items', id), {
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: user?.name || 'Nieznany'
        });
      } catch (err) {
        console.error(err);
        alert('Błąd aktualizacji statusu');
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-clipboard-text text-2xl text-blue-600"></i>
            Tematy do Realizacji
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Akcje i problemy zgłoszone podczas serwisów planowanych
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors"
          >
            <i className="ph ph-file-xls text-lg"></i>
            Eksportuj (.xlsx)
          </button>
          <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'all' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Wszystkie</button>
          <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Oczekujące</button>
          <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterStatus === 'completed' ? 'bg-green-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Zrealizowane</button>
        </div>
        </div>

      </div>

      {/* FILTRY */}
      <PlannedMaintenanceFilters 
        isArchive={false}
        filterTime={filterTime} setFilterTime={setFilterTime}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterMachine={filterMachine} setFilterMachine={setFilterMachine}
        clearFilters={() => {
          setFilterTime('all');
          setFilterRegion('');
          setFilterMachine('');
          setFilterStatus('pending');
        }}
        machines={machines}
        regions={regions}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-4">Data Zgłoszenia</th>
                <th className="px-6 py-4">Maszyna</th>
                <th className="px-6 py-4">Problem / Zadanie</th>
                <th className="px-6 py-4">Wymagany Termin</th>
                <th className="px-6 py-4">Zgłaszający</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">
                    Brak tematów do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {getMachineName(item.machineId)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-md break-words">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Brak'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.createdBy}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'completed' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider w-fit">
                            <i className="ph ph-check-circle"></i> Zrealizowane
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            przez: <span className="font-bold text-slate-700">{item.completedBy || 'System'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            dn. {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                          <i className="ph ph-clock"></i> Oczekujące
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                          {item.status !== 'completed' && (<button onClick={() => handleComplete(item.id)} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors">Wykonano</button>)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\ConfirmModal.jsx
=========================================

```javascript
import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Tak, usuń", cancelText = "Anuluj" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <i className="ph ph-warning text-red-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title || 'Czy na pewno?'}</h3>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors flex items-center gap-2"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Dashboard.jsx
=========================================

```javascript
export default function Dashboard({ tickets, machines }) {
  // Obliczenia statystyk
  const activeTickets = tickets.filter(t => t.status !== 5);
  const criticalTickets = activeTickets.filter(t => t.isCritical);
  const completedToday = tickets.filter(t => {
    if (t.status !== 5 || !t.closedAt) return false;
    const closedDate = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
    const today = new Date();
    return closedDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-warning-circle"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{activeTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aktywne Zgłoszenia</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-siren"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{criticalTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Krytyczne (Postój)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-check-circle"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{completedToday.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Zakończone Dzisiaj</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-engine"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{machines.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Maszyny w bazie</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\HomeDashboard.jsx
=========================================

```javascript
import { generateAuditorReport } from '../../utils/reports/auditorExport';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function HomeDashboard({ setActiveTab, setCurrentModule, user }) {
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    return () => unsub();
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[600px] p-6 animate-fade-in bg-slate-50">
      <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">Witaj w systemie zarządzania</h2>
      <p className="text-slate-500 mb-12 text-center max-w-lg">
        Wybierz moduł, do którego chcesz przejść, aby rozpocząć pracę.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {modSettings.enableTickets && (
      <>
        {/* AWARIE UR */}
        <button 
          onClick={() => {
            setCurrentModule('tickets'); setActiveTab('dashboard_tickets'); window.history.pushState({ module: 'tickets', tab: 'dashboard_tickets' }, '', '?module=tickets&tab=dashboard_tickets');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i className="ph ph-warning-circle"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Awarie UR</h3>
          <p className="text-sm text-slate-500 text-center">Zarządzanie bieżącymi awariami i usterkami zgłaszanymi z produkcji.</p>
        </button>
      </>
    )}

        {modSettings.enablePlanned && (
      <>
        {/* SERWIS UR */}
        <button 
          onClick={() => {
            setCurrentModule('planned_maintenance'); setActiveTab('dashboard_planned'); window.history.pushState({ module: 'planned_maintenance', tab: 'dashboard_planned' }, '', '?module=planned_maintenance&tab=dashboard_planned');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:emerald-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <i className="ph ph-calendar-check"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Serwis UR</h3>
          <p className="text-sm text-slate-500 text-center">Harmonogramy przeglądów, prewencja i zaplanowane prace serwisowe.</p>
        </button>
      </>
    )}

        {/* ADMINISTRACJA */}
        <button 
          onClick={() => {
            setCurrentModule('master_data');
            const t = user?.role === 'admin' ? 'settings' : 'machines';
            setActiveTab(t);
            window.history.pushState({ module: 'master_data', tab: t }, '', '?module=master_data&tab='+t);
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:purple-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <i className="ph ph-gear"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Administracja</h3>
          <p className="text-sm text-slate-500 text-center">Baza maszyn, ustawienia, pracownicy i konfiguracja systemu.</p>
        </button>
      
        
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\KPIDashboard.jsx
=========================================

```javascript
import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';


export default function KPIDashboard({ tickets, machines, plannedServices = [] }) {
  const [period, setPeriod] = useState('all');

  const [historicalTickets, setHistoricalTickets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const q = query(
          collection(db, 'tickets'),
          where('closedAt', '>=', ninetyDaysAgo)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted && x.status === 5);
        setHistoricalTickets(docs);
      } catch (err) {
        console.error("Błąd pobierania historii KPI:", err);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, []);

  const allTicketsForKPI = useMemo(() => {
    // Combine active tickets (passed via props) with historical closed tickets
    const activeMap = new Map(tickets.map(t => [t.id, t]));
    historicalTickets.forEach(t => {
      if (!activeMap.has(t.id)) activeMap.set(t.id, t);
    });
    return Array.from(activeMap.values());
  }, [tickets, historicalTickets]);


  const safeParseDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredTickets = useMemo(() => {
    return allTicketsForKPI.filter(t => {
      if (period === 'all') return true;
      const createdAt = safeParseDate(t.createdAt);
      if (!createdAt) return false;
      
      const now = new Date();
      if (period === 'month') {
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }
      if (period === 'prev_month') {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return createdAt.getMonth() === prevMonth.getMonth() && createdAt.getFullYear() === prevMonth.getFullYear();
      }
      
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (period === '7') return daysDiff <= 7;
      if (period === '30') return daysDiff <= 30;
      if (period === '90') return daysDiff <= 90;
      
      return true;
    });
  }, [tickets, period]);

  // 1. Podstawowe statystyki
  const totalTickets = filteredTickets.length;
  const closedTickets = filteredTickets.filter(t => t.status === 5);
  const criticalTickets = filteredTickets.filter(t => t.isCritical);

  // 2. Obliczanie średniego czasu naprawy (MTTR) w minutach dla zakończonych
  let totalRepairTimeMinutes = 0;
  closedTickets.forEach(t => {
    if (t.createdAt && t.closedAt) {
      const start = safeParseDate(t.createdAt);
      const end = safeParseDate(t.closedAt);
      if (start && end) {
        const diffMins = Math.floor((end - start) / 60000);
        if (diffMins > 0) totalRepairTimeMinutes += diffMins;
      }
    }
  });

  const avgRepairMinutes = closedTickets.length > 0 ? Math.round(totalRepairTimeMinutes / closedTickets.length) : 0;
  const avgHours = Math.floor(avgRepairMinutes / 60);
  const avgMins = avgRepairMinutes % 60;

  // 3. Maszyny z największą liczbą awarii
  const machineFaultCounts = {};
  filteredTickets.forEach(t => {
    const mName = t.machineName || 'Nieznana maszyna';
    machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;
  });

  const sortedMachines = Object.entries(machineFaultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 najbardziej awaryjnych

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      
      {/* Pasek filtrów */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="font-bold text-gray-700 flex items-center gap-2">
          <i className="ph ph-funnel text-lg"></i>
          Okres analizy:
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
        >
          <option value="all">Wszystkie zgłoszenia</option>
          <option value="7">Ostatnie 7 dni</option>
          <option value="30">Ostatnie 30 dni</option>
          <option value="90">Ostatnie 90 dni</option>
          <option value="month">Obecny miesiąc</option>
          <option value="prev_month">Poprzedni miesiąc</option>
        </select>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Kafel: Wszystkie Zgłoszenia */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-files"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{totalTickets}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Ilość zgłoszeń</div>
          </div>
        </div>

        {/* Kafel zgłoszeń krytycznych */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-warning-octagon"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{criticalTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Awarii krytycznych</div>
          </div>
        </div>

        {/* Kafel: Zgłoszenia zamknięte */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-check-circle"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{closedTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Zgłoszeń zamkniętych</div>
          </div>
        </div>

        {/* Kafel MTTR */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-timer"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {avgHours}g {avgMins}m
            </div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Średni czas (MTTR)</div>
          </div>
        </div>

        {/* Kafel skuteczności zamknięć */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-chart-pie-slice"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {totalTickets > 0 ? Math.round((closedTickets.length / totalTickets) * 100) : 0}%
            </div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Wskaźnik zamknięć</div>
          </div>
        </div>

      </div>


      {/* Tabela awaryjności maszyn */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
          <i className="ph ph-ranking text-lg text-blue-900"></i>
          Najbardziej awaryjne maszyny (Top 5 w wybranym okresie)
        </div>
        <div className="divide-y divide-gray-100">
          {sortedMachines.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Brak danych do wygenerowania statystyk maszyn.</div>
          ) : (
            sortedMachines.map(([name, count], index) => (
              <div key={name} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-800">{name}</span>
                </div>
                <span className="bg-gray-150 px-3 py-1 rounded text-sm font-semibold text-gray-700">
                  {count} {count === 1 ? 'zgłoszenie' : (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 'zgłoszenia' : 'zgłoszeń')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\MachineDetails.jsx
=========================================

```javascript
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { safeParseDate } from '../../utils/dateHelpers';


export default function MachineDetails({ machine, history, loading, onBack, onPrint, onGeneratePDF, regions, onEdit, onDelete }) {
  const regionName = regions.find(r => r.id === machine.regionId)?.name || 'Nieznany rejon';
  const baseUrl = window.location.origin + window.location.pathname;
  const qrValue = `${baseUrl}?machine=${machine.id}`;

  return (
    <div className="bg-[#f8f9fa] w-full flex flex-col h-full animate-fade-in relative text-[#111827]">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Wróć do listy maszyn"
          >
            <i className="ph ph-arrow-left text-xl"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Szczegóły Maszyny</h2>
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold text-sm border border-blue-200 transition-colors">
            <i className="ph ph-pencil-simple"></i> Edytuj
          </button>
          <button onClick={onDelete} className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm border border-red-200 transition-colors">
            <i className="ph ph-trash"></i> Usuń
          </button>
          {!machine.name.includes('(DO WERYFIKACJI)') && (
            <button onClick={() => onPrint(machine.id, machine.name)} className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold text-sm border border-slate-300 transition-colors">
              <i className="ph ph-printer"></i> Drukuj QR
            </button>
          )}
          <button onClick={onGeneratePDF} className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">
            <i className="ph ph-file-pdf"></i> Raport PDF
          </button>
        </div>

      </div>

      <div className="p-6 overflow-y-auto h-full flex flex-col gap-6">
        {/* Górna sekcja - Info i QR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                <i className="ph ph-engine"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{machine.name}</h1>
                <div className="text-gray-400 font-mono text-sm">ID: {machine.id}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rejon / Miejsce</div>
                <div className="font-semibold text-gray-800 text-base">{regionName}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Numer Wewnętrzny</div>
                <div className="font-semibold text-gray-800 text-base">{machine.internalId || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Stan Licznika</div>
                <div className="font-semibold text-gray-800 text-base">{machine.currentWorkHours || 0} RBG</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dodatkowy Opis</div>
                <div className="font-semibold text-gray-800 text-sm max-w-full break-words">{machine.additionalDescription || '-'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
              {machine.name.includes('(DO WERYFIKACJI)') ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-2">
                    <i className="ph ph-warning"></i>
                  </div>
                  <div className="font-bold text-orange-600 text-center text-sm">Maszyna Wymaga Weryfikacji</div>
                  <div className="text-xs text-gray-500 text-center">
                    Aby wygenerować kod QR dla operatorów, użyj przycisku <b>Edytuj</b>, uzupełnij brakujące dane (np. lokalizację, numer wewnętrzny), usuń dopisek "(DO WERYFIKACJI)" z nazwy i zapisz.
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-gray-700">Kod QR Maszyny</div>
                  <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                    <div id={"qr-svg-" + machine.id}><QRCodeSVG value={qrValue} size={150} /></div>
                  </div>
                  <div className="text-xs text-gray-400 text-center px-4">
                    Operatorzy mogą zeskanować ten kod, aby szybko zgłosić awarię tej maszyny.
                  </div>
                </>
              )}
            </div>
          </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center gap-3">
            <i className="ph ph-spinner-gap animate-spin text-4xl text-blue-500"></i>
            <span className="text-gray-500 font-medium">Ładowanie historii z bazy...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Historia Awarii */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-warning-circle text-red-500 text-xl"></i> 
                  Historia Awarii
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{history.tickets.length} zgłoszeń</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.tickets.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm italic">Brak zgłoszeń awarii dla tej maszyny.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.tickets.map(t => (
                      <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{t.topic || 'Inne'}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${t.status === 5 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {t.status === 5 ? 'Zamknięte' : 'Otwarte'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{t.description || '-'}</div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Zgłaszający: <span className="font-semibold text-gray-600">{t.reportedBy}</span></span>
                          <span>{t.createdAt ? safeParseDate(t.createdAt).toLocaleDateString('pl-PL') : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Historia Serwisów */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-calendar-check text-blue-500 text-xl"></i> 
                  Historia Serwisów
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{history.services.length} serwisów</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                {history.services.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm italic">Brak zrealizowanych lub zaplanowanych serwisów.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.services.map(s => (
                      <div key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-800">{s.name}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.status === 'completed' ? 'Zakończony' : 'W trakcie/Oczekujący'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                          <span>{s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Czasowy' : 'Mieszany')}</span>
                          <span>{s.completedAt ? safeParseDate(s.completedAt).toLocaleDateString('pl-PL') : (s.nextDate ? 'Planowane: ' + safeParseDate(s.nextDate).toLocaleDateString('pl-PL') : '-')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Machines.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { exportToExcel } from '../../utils/reports/excelExport';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { safeParseDate } from '../../utils/dateHelpers';

import MachineDetails from './MachineDetails';

import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

export default function Machines({ tickets = [], plannedServices = [] }) {
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [name, setName] = useState('');
  const [bay, setBay] = useState('');
  const [regionId, setRegionId] = useState('');
  const [internalId, setInternalId] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [qrModalMachine, setQrModalMachine] = useState(null);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);


  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const [confirmModalConfig, setConfirmModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    confirmText: 'Tak'
  });

  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const unsubMachines = onSnapshot(collection(db, "machines"), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    const unsubRegions = onSnapshot(collection(db, "regions"), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => {
      unsubMachines();
      unsubRegions();
    };
  }, []);

  
  const handleExportExcel = () => {
    const filteredMachines = machines.filter(m => !m.isDeleted).filter(m => {
      const queryLower = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(queryLower) || (m.internalId && m.internalId.toLowerCase().includes(queryLower));
      const matchRegion = filterRegion ? m.regionId === filterRegion : true;
      return matchName && matchRegion;
    });
    const dataToExport = filteredMachines.map(m => ({
      'ID': m.id,
      'Nazwa Maszyny': m.name || '-',
      'Rejon': (regions.find(r => r.id === m.regionId)?.name || '-'),
      'Nr Seryjny / Wewnętrzny': m.internalId || '-',
      'Obecne RBG': m.currentWorkHours || 0,
      'Zapasowy Opis': m.additionalDescription || '-'
    }));
    exportToExcel(dataToExport, 'Rejestr_Maszyn');
  };

  
  const handleViewMachine = async (m) => {
    setSelectedMachine(m);
    setLoadingHistory(true);
    try {
      // Tickets
      const activeTickets = tickets.filter(t => t.machineId === m.id);
      const qArchived = query(collection(db, 'tickets'), where('machineId', '==', m.id), where('status', '==', 5));
      const snapArchived = await getDocs(qArchived);
      const archivedTickets = snapArchived.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allT = [...activeTickets, ...archivedTickets].filter((v,i,a) => a.findIndex(t=>t.id === v.id) === i);
      allT.sort((a,b) => (safeParseDate(b.createdAt) || 0) - (safeParseDate(a.createdAt) || 0));

      // Services
      const activeServices = plannedServices.filter(s => s.machineId === m.id);
      const qArchivedS = query(collection(db, 'planned_services'), where('machineId', '==', m.id), where('status', '==', 'completed'));
      const snapArchivedS = await getDocs(qArchivedS);
      const archivedS = snapArchivedS.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allS = [...activeServices, ...archivedS].filter((v,i,a) => a.findIndex(s=>s.id === v.id) === i);
      allS.sort((a,b) => (safeParseDate(b.completedAt || b.createdAt) || 0) - (safeParseDate(a.completedAt || a.createdAt) || 0));
      
      setMachineHistory({ tickets: allT, services: allS });
    } catch(err) {
      console.error(err);
    }
    setLoadingHistory(false);
  };

  const handleDownloadPDF = (machine, allHist = null) => {
    // Inject regionName for PDF generator
    const rName = regions.find(r => r.id === machine.regionId)?.name || 'Nieznany';
    const machineWithRegion = { ...machine, regionName: rName };
    
    const mTickets = allHist ? allHist.tickets : tickets.filter(t => t.machineId === machine.id);
    const mServices = allHist ? allHist.services : plannedServices.filter(s => s.machineId === machine.id);
    generateMachineHistoryPDF(machineWithRegion, mTickets, mServices);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !regionId) {
      return showToast('Proszę wypełnić nazwę i wskazać rejon.', 'error');
    }
    
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        bay: bay.trim(),
        regionId: regionId,
        internalId: internalId.trim(),
        additionalDescription: additionalDescription.trim()
      };

      if (editingId) {
        await updateDoc(doc(db, 'machines', editingId), payload);
        showToast('Maszyna została zaktualizowana pomyślnie.');
      } else {
        await addDoc(collection(db, 'machines'), payload);
        showToast('Maszyna została dodana pomyślnie.');
      }
      setName('');
      setBay('');
      setRegionId('');
      setInternalId('');
      setAdditionalDescription('');
      setAdditionalDescription('');
      setEditingId(null);
        setIsFormOpen(false);
      if (selectedMachine && selectedMachine.id === id) { setSelectedMachine(null); }
    } catch (error) {
      console.error('Błąd dodawania maszyny:', error);
      showToast('Nie udało się dodać maszyny.', 'error');
    }
    setLoading(false);
    setLoading(false);
  };

  const handleEdit = (m) => {
    setName(m.name);
    setBay(m.bay || '');
    setRegionId(m.regionId || '');
    setInternalId(m.internalId || '');
    setAdditionalDescription(m.additionalDescription || '');
    setEditingId(m.id);
    setIsFormOpen(true);
    setSelectedMachine(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, machineName) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Usunąć maszynę?',
      message: `Czy na pewno chcesz usunąć maszynę "${machineName}" z bazy? To unieważni jej kody QR oraz zamknie wszystkie jej aktywne zgłoszenia awarii.`,
      confirmText: 'Tak, usuń maszynę',
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          // Najpierw zamknij wszystkie zgłoszenia dla tej maszyny
          const q = query(collection(db, 'tickets'), where('machineId', '==', id));
          const snapshot = await getDocs(q);
          
          const closePromises = snapshot.docs.map(ticketDoc => {
            const tData = ticketDoc.data();
            if (tData.status !== 5) { // Jeśli nie jest jeszcze zakończone
              return updateDoc(doc(db, 'tickets', ticketDoc.id), {
                status: 5,
                closedAt: new Date().toISOString(),
                isManuallyArchived: true, // Trafi od razu do archiwum
                history: [
                  ...(tData.history || []),
                  {
                    status: 5,
                    timestamp: new Date().toISOString(),
                    note: 'Zamknięto systemowo z powodu usunięcia maszyny z bazy.'
                  }
                ]
              });
            }
            return Promise.resolve();
          });
          
          await Promise.all(closePromises);
          
          // Pobierz i usuń wszystkie plany serwisowe dla tej maszyny
          const plannedQuery = query(collection(db, 'planned_services'), where('machineId', '==', id));
          const plannedSnapshot = await getDocs(plannedQuery);
          const plannedPromises = plannedSnapshot.docs.map(planDoc => updateDoc(doc(db, 'planned_services', planDoc.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' }));
          await Promise.all(plannedPromises);

          // Następnie usuń samą maszynę
          await updateDoc(doc(db, 'machines', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
          showToast('Maszyna oraz jej aktywne zgłoszenia zostały pomyślnie usunięte.');
        } catch (error) {
          console.error("Błąd podczas usuwania maszyny:", error);
          showToast("Nie udało się całkowicie usunąć maszyny i jej zgłoszeń.", 'error');
        }
        setLoading(false);
      }
    });
  };

  const handlePrint = (machineId, machineName) => {
    const printWindow = window.open('', '_blank');
    const baseUrl = window.location.origin + window.location.pathname;
    const qrContent = `${baseUrl}?machine=${machineId}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Wydruk Etykiety QR - ${machineName}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .label-container { border: 4px dashed #000; padding: 40px; text-align: center; width: 500px; }
            .company { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .name { font-size: 32px; font-weight: bold; margin-bottom: 25px; }
            .qr { margin-bottom: 20px; }
            .qr svg { width: 350px; height: 350px; }
            .hint { font-size: 16px; color: #555; }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="company">CRIST S.A. - Serwis UR</div>
            <div class="name">${machineName}</div>
            <div class="qr">${document.getElementById('qr-svg-' + machineId).outerHTML}</div>
            <div class="hint">Zeskanuj kod w aplikacji, aby zgłosić awarię</div>
            <div class="hint" style="margin-top: 10px; font-weight: bold;">ID: ${machineId}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  
  if (selectedMachine) {
    return (
      <MachineDetails 
        machine={selectedMachine} 
        onEdit={() => handleEdit(selectedMachine)}
        onDelete={() => handleDelete(selectedMachine.id, selectedMachine.name)} 
        history={machineHistory} 
        loading={loadingHistory} 
        regions={regions}
        onBack={() => setSelectedMachine(null)} 
        onPrint={handlePrint} 
        onGeneratePDF={() => handleDownloadPDF(selectedMachine, machineHistory)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Rejestr Maszyn</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj maszynami i generuj kody QR</p>
        </div>
        <button onClick={() => { 
          setEditingId(null); 
          setName(''); setBay(''); setRegionId(''); setInternalId(''); setAdditionalDescription(''); 
          setIsFormOpen(true); 
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Maszynę
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                {editingId ? 'Edytuj maszynę' : 'Dodaj nową maszynę i wygeneruj kod QR'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rejon / Numer Hali</label>
            <select value={regionId} onChange={e => setRegionId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white" required>
              <option value="">-- Wybierz Rejon --</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Przelot / Inf. dodatkowa (Opcjonalnie)</label>
            <input type="text" value={bay} onChange={(e) => setBay(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Przelot 2 / Magazyn" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Numer wew. UR (Opcjonalnie)</label>
            <input type="text" value={internalId} onChange={(e) => setInternalId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. UR-123" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa maszyny</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Suwnica S-01" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dodatkowy opis (Opcjonalnie)</label>
            <input type="text" value={additionalDescription} onChange={(e) => setAdditionalDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="Opcjonalnie..." />
          </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <button 
              type="button" 
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
                setName('');
                setBay('');
                setRegionId('');
                setInternalId('');
                setAdditionalDescription('');
              }}
              className="bg-gray-100 text-gray-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Anuluj
            </button>
            <button disabled={loading} type="submit" className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-w-[150px] shadow-sm">
              {loading ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-check font-bold"></i>}
              {editingId ? 'Zapisz zmiany' : 'Dodaj maszynę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden m-6 mt-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Rejestr Maszyn</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {machines.length}</span>
        </div>
        <div className="p-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <button 
              onClick={handleExportExcel}
              className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2 border border-green-200 transition-colors"
            >
              <i className="ph ph-file-xls text-lg"></i>
              Eksportuj
            </button>
          <input 
            type="text" 
            placeholder="Szukaj po nazwie lub numerze wew..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded outline-none text-sm"
          />
          <select 
            value={filterRegion} 
            onChange={e => setFilterRegion(e.target.value)} 
            className="w-full sm:w-64 p-2 border border-gray-300 rounded outline-none bg-white text-sm"
          >
            <option value="">Wszystkie Rejony</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="px-6 py-3 border-b">Nazwa Maszyny</th>
                <th className="px-6 py-3 border-b">Nr wew. / Opis</th>
                <th className="px-6 py-3 border-b">Rejon / Hala</th>
                <th className="px-6 py-3 border-b">Przelot / Inf.</th>
                <th className="px-6 py-3 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredMachines = machines.filter(m => !m.isDeleted).filter(m => {
                  const queryLower = searchQuery.toLowerCase();
                  const matchName = m.name.toLowerCase().includes(queryLower) || (m.internalId && m.internalId.toLowerCase().includes(queryLower));
                  const matchRegion = filterRegion ? m.regionId === filterRegion : true;
                  return matchName && matchRegion;
                });

                if (filteredMachines.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-500">Brak maszyn spełniających kryteria.</td>
                    </tr>
                  );
                }

                return filteredMachines.map(m => {
                  const baseUrl = window.location.origin + window.location.pathname;
                  const qrValue = `${baseUrl}?machine=${m.id}`;
                  return (
                    <tr key={m.id} className={"border-b border-gray-100 transition-colors " + (m.name.includes('(DO WERYFIKACJI)') ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-blue-50')}>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800 text-base">{m.name}</div>
                        <div className="text-xs font-mono text-gray-400 mt-1">ID: {m.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-700">{m.internalId || '-'}</div>
                        {m.additionalDescription && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{m.additionalDescription}</div>}
                      </td>
                      <td className="p-4 text-gray-600">
                        {regions.find(r => r.id === m.regionId)?.name || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {m.bay || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
            <button 
              onClick={() => handleViewMachine(m)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              Szczegóły
              <i className="ph ph-caret-right"></i>
            </button>
            
          </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Podglądu Kodu QR */}
      {qrModalMachine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-200">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-gray-800">Kod QR Maszyny</h3>
              <button 
                onClick={() => setQrModalMachine(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ph ph-x text-xl font-bold"></i>
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 inline-block mb-4 shadow-inner">
              <QRCodeSVG 
                id={`qr-svg-${qrModalMachine.id}`}
                value={`${window.location.origin}${window.location.pathname}?machine=${qrModalMachine.id}`} 
                size={220} 
                level={"M"} 
                includeMargin={true} 
              />
            </div>

            <div className="mb-6">
              <h4 className="font-black text-xl text-gray-800">{qrModalMachine.name}</h4>
              <p className="text-xs text-gray-500 font-mono mt-1">ID: {qrModalMachine.id}</p>
              <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100 inline-block">
                <span className="font-bold text-blue-900">
                  {regions.find(r => r.id === qrModalMachine.regionId)?.name || 'Brak Rejonu'}
                </span>
                {qrModalMachine.bay ? ` / Przelot: ${qrModalMachine.bay}` : ''}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handlePrint(qrModalMachine.id, qrModalMachine.name);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <i className="ph ph-printer text-lg"></i>
                Wydrukuj Etykietę
              </button>
              <button
                onClick={() => setQrModalMachine(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-5 rounded-xl transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {toastConfig.message && (
        <Toast 
          message={toastConfig.message} 
          type={toastConfig.type} 
          onClose={() => setToastConfig({ message: '', type: 'success' })} 
        />
      )}
      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModalConfig.confirmText}
      />
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\Map.jsx
=========================================

```javascript
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';

export default function ShipyardMap({ tickets = [], plannedServices = [], modeType = 'tickets', machines = [], regions = [], user, plannedWarningDays = 30, onNavigateToTickets }) {
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [hoveredPin, setHoveredPin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapConfig, setMapConfig] = useState({
    url: '',
    defaultZoom: 1,
    defaultPan: { x: 0, y: 0 }
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentSubmapId, setCurrentSubmapId] = useState(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load map config from firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'map'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapConfig({
          url: data.mapUrl || '',
          defaultZoom: data.defaultZoom || 1,
          defaultPan: { x: data.defaultPanX || 0, y: data.defaultPanY || 0 }
        });
        if (!mapLoaded) {
          setZoomScale(data.defaultZoom || 1);
          setZoomPan({ x: data.defaultPanX || 0, y: data.defaultPanY || 0 });
          setMapLoaded(true);
        }
      } else {
        setMapLoaded(true);
      }
    });
    return () => unsub();
  }, [mapLoaded]);


  const [mapDragActive, setMapDragActive] = useState(false);
  const handleMapDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(true); };
  const handleMapDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); };
  const handleMapDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleMapDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMapDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processMapFile(e.dataTransfer.files[0]);
    }
  };
  const handleMapFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processMapFile(e.target.files[0]);
    }
  };
  const processMapFile = (file) => {

    if (!file) return;
    setUploadingMap(true);
    
    const storageRef = ref(storage, 'map_backgrounds/' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error", error);
        alert("Błąd wgrywania: " + error.message);
        setUploadingMap(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await setDoc(doc(db, 'settings', 'map'), { mapUrl: downloadURL }, { merge: true });
        setUploadingMap(false);
        setUploadProgress(0);
      }
    );
  };

  const saveDefaultView = async () => {
    try {
      await setDoc(doc(db, 'settings', 'map'), {
        defaultZoom: zoomScale,
        defaultPanX: zoomPan.x,
        defaultPanY: zoomPan.y
      }, { merge: true });
      alert("Widok został zapisany jako domyślny dla wszystkich!");
    } catch(err) {
      alert("Błąd zapisu widoku.");
    }
  };

  
  // States for Edit Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const imgRef = useRef(null);

  const currentMapUrl = currentSubmapId ? (regions.find(r => r.id === currentSubmapId)?.mapImageUrl || mapConfig.url) : mapConfig.url;

  useEffect(() => {
    setIsImageLoading(true);
    setImageProgress(0);

    const safetyTimeout = setTimeout(() => {
      setIsImageLoading(false);
      setImageProgress(100);
    }, 4000); // 4 seconds max loading screen

    // If image is already loaded from cache before effect runs
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      clearTimeout(safetyTimeout);
      setIsImageLoading(false);
      setImageProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setImageProgress(p => {
        if (p >= 90) return 90;
          const next = p + Math.floor(Math.random() * 15) + 5;
          return next > 90 ? 90 : next;
      });
    }, 200);
    return () => { clearInterval(interval); clearTimeout(safetyTimeout); };
  }, [currentMapUrl]);
  const [tempPos, setTempPos] = useState(null);
  const [editingType, setEditingType] = useState('region'); // 'region' or 'machine'
  const [editingId, setEditingId] = useState('');
  
  // Drag & Drop
  const [draggingPin, setDraggingPin] = useState(null); // { id, type, xPercent, yPercent }
  
  // Zoom & Pan
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const initialScaleRef = useRef(1);
  const pointerDownPosRef = useRef(null);
  
  const mapContainerRef = useRef(null);

  // Exact bounds of the visual image inside object-fit: contain
  const [imgBounds, setImgBounds] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imgRef.current || !naturalSize.width) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const containerHeight = entry.contentRect.height;
      const imgRatio = naturalSize.width / naturalSize.height;
      const containerRatio = containerWidth / containerHeight;

      let renderWidth, renderHeight;
      if (containerRatio > imgRatio) {
        renderHeight = containerHeight;
        renderWidth = containerHeight * imgRatio;
      } else {
        renderWidth = containerWidth;
        renderHeight = containerWidth / imgRatio;
      }

      setImgBounds({ width: renderWidth, height: renderHeight });
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [naturalSize]);

  // Tooltip hover timeout
  const hideTimeoutRef = useRef(null);

  // Zoptymalizowane obliczanie statusu pinezek
    const pinData = useMemo(() => {
    const pins = [];
    const now = new Date();

    if (currentSubmapId === null) {
      // MAIN MAP
      // Process Regions
      regions.forEach(region => {
        if (region.xPercent == null || region.yPercent == null) return;
        
        let status = 'ok';
        let count = 0;
        let machineCount = 0;

        const regionMachineIds = machines.filter(m => m.regionId === region.id).map(m => m.id);
          const submapMachineIds = machines.filter(m => {
            if (m.regionId !== region.id) return false;
            const isPinnedOnMain = m.pinnedOnMap === 'main' || (!m.pinnedOnMap && (!region || !region.mapImageUrl));
            return !isPinnedOnMain; 
          }).map(m => m.id);
          machineCount = regionMachineIds.length;

          if (modeType === 'tickets') {
            const activeTickets = tickets.filter(t => submapMachineIds.includes(t.machineId) && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) {
            status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          }
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => submapMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
          
          activePlans.forEach(p => {
            let isOverdue = false;
            let isWarning = false;
            if (p.nextDate) {
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              const m = machines.find(mac => mac.id === p.machineId);
              if (m) {
                if (m.currentWorkHours >= p.targetWorkHours) isOverdue = true;
                else if (p.hoursInterval && (p.targetWorkHours - m.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
              }
            }
            if (p.status === 'in_progress') status = 'in_progress';
            else if (isOverdue && status !== 'in_progress') status = 'critical';
            else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
          });
          count = activePlans.length;
        }

        pins.push({
          id: region.id,
          type: 'region',
          name: region.name,
          xPercent: region.xPercent,
          yPercent: region.yPercent,
          status,
          itemCount: count,
          machineCount,
          hasSubmap: !!region.mapImageUrl
        });
      });

      // Process Machines
      machines.forEach(machine => {
        if (machine.xPercent == null || machine.yPercent == null) return;
        const region = regions.find(r => r.id === machine.regionId);
        
        const isPinnedOnMain = machine.pinnedOnMap === 'main' || (!machine.pinnedOnMap && (!region || !region.mapImageUrl));
        if (!isPinnedOnMain) return;
        
        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) {
            status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          }
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
          activePlans.forEach(p => {
            let isOverdue = false;
            let isWarning = false;
            if (p.nextDate) {
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              if (machine.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval && (p.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
            }
            if (p.status === 'in_progress') status = 'in_progress';
            else if (isOverdue && status !== 'in_progress') status = 'critical';
            else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
          });
          count = activePlans.length;
        }

        pins.push({
          id: machine.id,
          type: 'machine',
          name: machine.name,
          xPercent: machine.xPercent,
          yPercent: machine.yPercent,
          status,
          itemCount: count
        });
      });
    } else {
      // SUBMAP (Show only machines belonging to currentSubmapId)
      machines.forEach(machine => {
        if (machine.regionId !== currentSubmapId || machine.xPercent == null || machine.yPercent == null) return;
        
        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) {
            status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          }
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
          activePlans.forEach(p => {
            let isOverdue = false;
            let isWarning = false;
            if (p.nextDate) {
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              if (machine.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval && (p.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
            }
            if (p.status === 'in_progress') status = 'in_progress';
            else if (isOverdue && status !== 'in_progress') status = 'critical';
            else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
          });
          count = activePlans.length;
        }

        pins.push({
          id: machine.id,
          type: 'machine',
          name: machine.name,
          xPercent: machine.xPercent,
          yPercent: machine.yPercent,
          status,
          itemCount: count
        });
      });
    }

    return pins;
  }, [tickets, plannedServices, modeType, machines, regions, plannedWarningDays, currentSubmapId]);

  // Apply drag preview
  const displayPins = useMemo(() => {
    if (!draggingPin) return pinData;
    return pinData.map(p => 
      (p.id === draggingPin.id && p.type === draggingPin.type)
        ? { ...p, xPercent: draggingPin.xPercent, yPercent: draggingPin.yPercent }
        : p
    );
  }, [pinData, draggingPin]);

  // Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handlePointerDown = (e, pin) => {
    if (mode !== 'edit') return;
    if (e.target.closest('button')) return; // Nie zaczynaj przeciągania jeśli kliknięto przycisk usunięcia
    e.stopPropagation();
    e.preventDefault();
    setDraggingPin({ id: pin.id, type: pin.type, xPercent: pin.xPercent, yPercent: pin.yPercent });
  };

  const handlePointerMove = (e) => {
    if (isPanningMap) {
      setZoomPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (mode !== 'edit' || !draggingPin) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    setDraggingPin(prev => ({ ...prev, xPercent, yPercent }));
  };

  const handlePointerUp = async (e) => {
    // Ręczne wykrywanie "kliknięcia" (tap) dla urządzeń mobilnych
    let isTap = false;
    if (pointerDownPosRef.current && e) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      const dt = Date.now() - pointerDownPosRef.current.time;
      if (Math.hypot(dx, dy) < 15 && dt < 500) {
        isTap = true;
      }
      pointerDownPosRef.current = null;
    }

    if (isPanningMap) {
      setIsPanningMap(false);
    }

    if (isTap && e.target.tagName.toLowerCase() === 'img') {
      handleMapClick(e);
    }

    if (mode !== 'edit' || !draggingPin) return;
    
    const { id, type, xPercent, yPercent } = draggingPin;
    setDraggingPin(null);
    
    try {
      const collectionName = type === 'region' ? 'regions' : 'machines';
        const updateData = { xPercent, yPercent };
        if (type === 'machine') {
           updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
        }
        await updateDoc(doc(db, collectionName, id), updateData);
    } catch (error) {
      console.error("Błąd zapisywania przemieszczonej pinezki:", error);
    }
  };

  const handleMapClick = (e) => {
    if (mode === 'view') {
      setHoveredPin(null);
      return;
    }
    
    if (mode !== 'edit' || draggingPin) return;
    
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Odrzucenie kliknięć poza widocznym obrazem
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return; 
    }

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setTempPos({ xPercent, yPercent });
      setEditingId('');
      if (currentSubmapId !== null) setEditingType('machine');
      setIsModalOpen(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!tempPos || !editingId) return;

    try {
      const collectionName = editingType === 'region' ? 'regions' : 'machines';
      const updateData = { xPercent: tempPos.xPercent, yPercent: tempPos.yPercent };
      if (editingType === 'machine') {
         updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
      }
      await updateDoc(doc(db, collectionName, editingId), updateData);
      setIsModalOpen(false);
      setTempPos(null);
    } catch (error) {
      console.error("Błąd podczas zapisywania pinezki: ", error);
      alert("Wystąpił błąd zapisu.");
    }
  };

  const handleDeletePin = async (id, type) => {
    if (confirm("Czy na pewno chcesz usunąć tę pinezkę z mapy?")) {
      try {
        const collectionName = type === 'region' ? 'regions' : 'machines';
        await updateDoc(doc(db, collectionName, id), {
          xPercent: null,
          yPercent: null
        });
      } catch (error) {
        console.error("Błąd usuwania pinezki: ", error);
      }
    }
  };

      const getUnpinnedItems = () => {
    if (editingType === 'region') {
      return regions.filter(r => r.xPercent == null || r.yPercent == null);
    } else {
      if (currentSubmapId !== null) {
        return machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null));
      }
      return machines.filter(m => m.xPercent == null || m.yPercent == null);
    }
  };
  const [tooltipPos, setTooltipPos] = useState({ isNearTop: false, isNearLeft: false, isNearRight: false });

  const handleMouseEnter = (pinId, e) => {
    if (mode === 'view') {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      
      // Obliczamy pozycję tylko gdy faktycznie wjeżdżamy na pinezkę, a nie podtrzymujemy tooltip
      if (hoveredPin !== pinId && e && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
          isNearTop: rect.top < 200,
          isNearLeft: rect.left < 250,
          isNearRight: window.innerWidth - rect.right < 250
        });
      }
      setHoveredPin(pinId);
    }
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredPin(null);
    }, 300); // 300ms delay to allow moving to tooltip
  };

  return (
    <div className={`flex flex-col animate-fade-in relative ${isFullscreen ? 'h-screen w-screen bg-slate-900 p-2 sm:p-4' : 'h-full space-y-2'}`} ref={isFullscreen ? null : mapContainerRef}>
      

      {/* Kontener Mapy */}
      <div 
        ref={isFullscreen ? mapContainerRef : null}
        className={`flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 relative group flex items-center justify-center select-none touch-none ${isFullscreen ? 'w-full h-full' : ''}`}
        style={{ minHeight: '600px' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerDown={(e) => {
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          if (!e.target.closest('.group\\/pin') && !e.target.closest('button')) {
            setIsPanningMap(true);
            setPanStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
          }
        }}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden touch-none"
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            setZoomScale(s => Math.min(Math.max(1, parseFloat((s + delta).toFixed(2))), 5));
          }}
          onTouchStart={(e) => {
            if (e.touches.length >= 2) {
              setIsPanningMap(false); // Blokujemy panoramowanie gdy uzytkownik zaczyna robic pinch to zoom
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              touchDistRef.current = dist;
              initialScaleRef.current = zoomScale;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && touchDistRef.current) {
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              const factor = dist / touchDistRef.current;
              setZoomScale(s => Math.min(Math.max(1, s * factor), 5));
              touchDistRef.current = dist;
            }
          }}
          onTouchEnd={() => { touchDistRef.current = null; }}
        >
          
            {/* Transform Wrapper dla Zoom i Pan */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center"
            style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 0 }}
          >
            {/* Obraz tła dopasowany do okna (contain) */}
            <img 
                ref={imgRef}
                src={currentMapUrl || 'https://placehold.co/1600x900/1e293b/94a3b8?text=BRAK+MAPY.%5CnWgraj+nowa+mape+w+trybie+Edycji.'} 
                alt="Mapa Stoczni" 
                className={`w-full h-full object-contain transition-opacity duration-300 ${mode === 'edit' ? 'opacity-80' : 'opacity-100'} cursor-${mode === 'edit' ? (draggingPin ? 'grabbing' : 'crosshair') : (isPanningMap ? 'grabbing' : 'grab')}`}
                onClick={handleMapClick}
                draggable="false"
                onLoad={(e) => {
                  setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                  setImageProgress(100);
                  setTimeout(() => setIsImageLoading(false), 200);
                }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://placehold.co/1600x900/1e293b/94a3b8?text=BRAK+MAPY.%5CnWgraj+nowa+mape+w+trybie+Edycji.';
                  setImageProgress(100);
                  setIsImageLoading(false);
                }}
              />
          </div>

          {isImageLoading && (
              <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
                <i className="ph ph-spinner-gap animate-spin text-5xl mb-4 text-blue-500"></i>
                <h3 className="text-xl font-bold mb-2">Ładowanie mapy...</h3>
                <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${imageProgress}%` }}></div>
                </div>
                <p className="mt-2 text-sm text-slate-400 font-mono">{imageProgress}%</p>
              </div>
            )}
            
            {/* Z-INDEX LAYER FOR PINS - Rendered above tools */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center pointer-events-none"
            style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 100 }}
          >

            {/* Wrapper na pinezki - ma dokładny rozmiar widzialnego obrazka! */}
            {imgBounds.width > 0 && (
              <div 
                id="map-bounds-container"
                className="absolute pointer-events-none"
                style={{ width: `${imgBounds.width}px`, height: `${imgBounds.height}px` }}
              >
                {/* Nakładka instruktażowa w trybie edycji */}
                {mode === 'edit' && !draggingPin && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none flex items-center justify-center z-10">
                    <div className="bg-amber-500/90 backdrop-blur text-white px-6 py-2 rounded-full font-bold shadow-xl animate-pulse text-sm whitespace-nowrap">
                      Kliknij aby przypiąć, lub chwyć pinezkę aby przesunąć
                    </div>
                  </div>
                )}

                {/* Rysowanie Pinezek */}
                {displayPins.map(pin => {
                  const isHovered = hoveredPin === pin.id;
                  const isDraggingThis = draggingPin?.id === pin.id;
                  
                  let bgColor = 'bg-emerald-500';
                  let ringColor = 'ring-emerald-500/40';
                  let isCritical = false;
                    let isInProgress = false;

                  if (pin.status === 'critical') {
                    bgColor = 'bg-red-500';
                    ringColor = 'ring-red-500/50';
                    isCritical = true;
                  } else if (pin.status === 'in_progress') {
                      bgColor = 'bg-blue-500';
                      ringColor = 'ring-blue-500/50';
                      isInProgress = true;
                    } else if (pin.status === 'warning') {
                    bgColor = 'bg-amber-500';
                    ringColor = 'ring-amber-500/40';
                  }

                  // Inteligentne pozycjonowanie chmurki bazujące na rzeczywistej pozycji ekranowej
                  const { isNearTop, isNearLeft, isNearRight } = tooltipPos;

                  let tooltipPosClass = "bottom-full left-1/2 -translate-x-1/2 mb-4";
                  let arrowClass = "top-full left-1/2 -translate-x-1/2 border-t-slate-900/95";

                  if (isNearTop) {
                    tooltipPosClass = "top-full left-1/2 -translate-x-1/2 mt-4";
                    arrowClass = "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95";
                  }
                  if (isNearLeft) {
                    tooltipPosClass = isNearTop ? "top-full left-0 mt-4" : "bottom-full left-0 mb-4";
                    arrowClass = isNearTop ? "bottom-full left-4 border-b-slate-900/95" : "top-full left-4 border-t-slate-900/95";
                  } else if (isNearRight) {
                    tooltipPosClass = isNearTop ? "top-full right-0 mt-4" : "bottom-full right-0 mb-4";
                    arrowClass = isNearTop ? "bottom-full right-4 border-b-slate-900/95" : "top-full right-4 border-t-slate-900/95";
                  }

                  return (
                    <div 
                      key={`${pin.type}-${pin.id}`}
                      className={`absolute group/pin ${isDraggingThis ? 'z-[60]' : (isHovered ? 'z-[50]' : 'z-20')} pointer-events-auto ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                      style={{ 
                        left: `${pin.xPercent}%`, 
                        top: `${pin.yPercent}%`,
                        transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
                        transformOrigin: 'center center'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === 'view') {
                          // Jeśli klikamy w telefonie, pokazujemy tooltip
                          if (hoveredPin !== pin.id) {
                            handleMouseEnter(pin.id, e);
                          } else {
                            setHoveredPin(null);
                          }
                        }
                      }}
                      onMouseEnter={(e) => handleMouseEnter(pin.id, e)}
                      onMouseLeave={handleMouseLeave}
                      onPointerDown={(e) => handlePointerDown(e, pin)}
                    >
                      {/* Obszar najechania (delikatny margines błędu) */}
                      <div className="absolute -inset-2 bg-transparent"></div>

                      {/* Pulsacja */}
                      {isCritical && !isDraggingThis && (
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>
                      )}
                      {isInProgress && !isDraggingThis && (
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>
                      )}
                      
                      
                        {/* Zwykła kropka lub kwadrat dla rejonu z podmapą */}
                        <div className={`
                          relative ${pin.type === 'region' && pin.hasSubmap ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-md' : 'w-3 h-3 sm:w-4 sm:h-4 rounded-full'} flex items-center justify-center
                          border-2 border-white shadow-lg transition-all duration-300
                          ${bgColor} ring-4 ${ringColor}
                          ${isHovered || isDraggingThis ? 'scale-150' : 'scale-100'}
                        `}></div>
                      
                      {/* Usuwanie w trybie edycji */}
                      {mode === 'edit' && !isDraggingThis && (
                                                  <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id, pin.type); }}
                            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:bg-red-700 hover:scale-110 z-30 pointer-events-auto"
                            title="Usuń z mapy"
                          >
                            <i className="ph ph-x text-xs font-bold"></i>
                          </button>
                        )}
  
                        {/* Tooltip w trybie View */}
                        {isHovered && mode === 'view' && (
                          <div 
                            className={`absolute ${tooltipPosClass} w-56 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-50 animate-fade-in`}
                            onMouseEnter={() => handleMouseEnter(pin.id)} // Podtrzymanie
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="font-black text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
                              <i className={`ph ${pin.type === 'machine' ? 'ph-engine' : 'ph-map-pin'} text-slate-400`}></i>
                              {pin.name}
                            </div>
                            
                            <div className="mt-3 space-y-2 mb-4">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Stan:</span>
                                {pin.status === 'critical' ? (
                                  <span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? 'ZALEGŁOŚCI' : 'AWARIA KRYTYCZNA'}</span>
                                ) : pin.status === 'in_progress' ? (
                                    <span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> Serwis w trakcie</span>
                                  ) : pin.status === 'warning' ? (
                                  <span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? 'Zbliża się serwis' : 'Usterka'}</span>
                                ) : (
                                  <span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? 'Brak pilnych' : 'Gotowe'}</span>
                                )}
                              </div>
                              {pin.type === 'region' && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400">Maszyny w rejonie:</span>
                                  <span className="font-bold">{pin.machineCount}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : 'Aktywne zgłoszenia:'}</span>
                                <span className="font-bold">{pin.itemCount}</span>
                              </div>
                            </div>

                                                        <div className="flex flex-col gap-2 w-full">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(isFullscreen) document.exitFullscreen?.();
                                  onNavigateToTickets(pin.name);
                                }}
                                className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2`}
                              >
                                {modeType === 'planned_maintenance' ? 'Przejdź do serwisów' : 'Przejdź do awarii'} <i className="ph ph-arrow-right"></i>
                              </button>

                              {pin.type === 'region' && pin.hasSubmap && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSubmapId(pin.id);
                                    setHoveredPin(null);
                                  }}
                                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                                >
                                  Wejdź do podmapy <i className="ph ph-arrow-right"></i>
                                </button>
                              )}
                            </div>

                          {/* Trójkącik tooltipa */}
                          <div className={`absolute ${arrowClass} border-[6px] border-transparent pointer-events-none`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          
          {/* Ustawienia Mapy (Wgrywanie tła i widok domyślny) */}
          {mode === 'edit' && currentSubmapId === null && (
            <div className="absolute top-14 sm:top-16 left-4 z-30 bg-white p-4 rounded-xl shadow-xl w-64 sm:w-72 border border-amber-200 animate-fade-in">
              <h3 className="font-bold text-slate-800 text-sm mb-3 border-b pb-2 flex items-center gap-2">
                <i className="ph ph-image text-amber-500"></i> Ustawienia Tła i Widoku
              </h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">1. Wgraj nową mapę (plik)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleMapFileChange}
                    disabled={uploadingMap}
                    className="absolute inset-0 w-full h-full z-50 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  
                  <div 
                    className={"w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + (mapDragActive ? 'border-amber-500 bg-amber-50' : (uploadingMap ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-blue-300 hover:bg-blue-50'))}
                    onDragEnter={handleMapDragEnter}
                    onDragLeave={handleMapDragLeave}
                    onDragOver={handleMapDragOver}
                    onDrop={handleMapDrop}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleMapFileChange}
                      disabled={uploadingMap}
                      className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploadingMap ? (
                      <span className="text-sm font-bold text-blue-600 flex items-center justify-center gap-2">
                        <i className="ph ph-spinner animate-spin"></i> {Math.round(uploadProgress)}%
                      </span>
                    ) : (
                      <span className={"text-xs font-bold " + (mapDragActive ? 'text-amber-600' : 'text-blue-600')}>
                        {mapDragActive ? 'Upuść tutaj!' : 'Kliknij lub upuść plik tu'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">2. Zapisz kadr startowy</label>
                <p className="text-[10px] text-slate-400 mb-2 leading-tight">Ustaw mapę (przybliż/przesuń) do optymalnego widoku startowego i zapisz.</p>
                <button 
                  onClick={saveDefaultView}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="ph ph-floppy-disk"></i> Ustaw jako domyślny kadr
                </button>
              </div>
            </div>
          )}

          {/* Przyciski Narzędzi i Widoku (umieszczone na mapie, napis usunięty) */}
          <div className="absolute top-4 left-4 z-[60] flex flex-wrap gap-2 pointer-events-auto">
              {currentSubmapId && (
                <button 
                  onClick={() => setCurrentSubmapId(null)}
                  className="px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md border border-indigo-500 flex items-center gap-2 transition-transform hover:scale-105 pointer-events-auto"
                >
                  <i className="ph ph-arrow-left text-base sm:text-lg"></i>
                  <span className="hidden sm:inline">Powrót do Mapy Głównej</span>
                </button>
              )}
            { (user?.role === 'admin' || user?.permissions?.includes('edit_map')) && (
              <>
                <button 
                  onClick={() => setMode('view')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'view' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-eye text-base sm:text-lg"></i> <span className="hidden sm:inline">Podgląd</span>
                </button>
                <button 
                  onClick={() => setMode('edit')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-pencil-simple text-base sm:text-lg"></i> <span className="hidden sm:inline">Edycja</span>
                </button>
              </>
            )}
            <button 
              onClick={toggleFullscreen} 
              className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white flex items-center gap-2 shadow-md"
            >
              <i className={`ph ${isFullscreen ? 'ph-corners-in' : 'ph-corners-out'} text-base sm:text-lg`}></i> 
              <span className="hidden sm:inline">{isFullscreen ? 'Zamknij' : 'Pełny ekran'}</span>
            </button>
          </div>

          
          {/* Statystyki na mapie */}
          {/* Statystyki na mapie */}
            {mode === 'view' && modeType === 'tickets' && (
                <div className="absolute top-4 right-4 z-40 bg-slate-900/80 backdrop-blur-md px-3 sm:px-5 py-3 sm:py-4 rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-2 sm:gap-3 min-w-[150px] sm:min-w-[220px] scale-80 sm:scale-100 origin-top-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">
                    {currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Awarii'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Wszystkie maszyny</span>
                    <span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-amber-500/80">Brak lokalizacji (nieprzypięte)</span>
                    <span className="font-bold text-lg text-amber-500/80">
                      {currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId && m.xPercent == null).length : machines.filter(m => m.xPercent == null).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Zgłoszone awarie</span>
                    <span className="font-bold text-lg text-amber-400">{
                      currentSubmapId 
                      ? tickets.filter(t => t.regionId === currentSubmapId && t.status !== 5 && t.status !== '5').length 
                      : tickets.filter(t => t.status !== 5 && t.status !== '5').length
                    }</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Krytyczne</span>
                    <span className="font-bold text-lg text-rose-500">{
                      currentSubmapId
                      ? tickets.filter(t => t.regionId === currentSubmapId && t.isCritical && t.status !== 5 && t.status !== '5').length
                      : tickets.filter(t => t.isCritical && t.status !== 5 && t.status !== '5').length
                    }</span>
                  </div>
                </div>
              )}

            {mode === 'view' && modeType === 'planned_maintenance' && (
                <div className="absolute top-4 right-4 z-40 bg-slate-900/80 backdrop-blur-md px-3 sm:px-5 py-3 sm:py-4 rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-2 sm:gap-3 min-w-[150px] sm:min-w-[240px] scale-80 sm:scale-100 origin-top-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">
                    {currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Serwisów'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Wszystkie maszyny</span>
                    <span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-amber-500/80">Brak lokalizacji (nieprzypięte)</span>
                    <span className="font-bold text-lg text-amber-500/80">
                      {currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId && m.xPercent == null).length : machines.filter(m => m.xPercent == null).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Planowane (30 dni)</span>
                    <span className="font-bold text-lg text-amber-400">{
                      (() => {
                        const now = new Date();
                        return plannedServices.filter(srv => {
                          if (srv.status === 'completed' || srv.status === 'in_progress') return false;
                          const machine = machines.find(m => m.id === srv.machineId);
                          if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false;
                          let isOverdue = false;
                          let isWarning = false;
                          if (srv.nextDate) {
                            const nDate = safeParseDate(srv.nextDate);
                            if (nDate < now) isOverdue = true;
                            else {
                              const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
                              if (diffDays <= 30) isWarning = true;
                            }
                          }
                          if (srv.targetWorkHours && machine) {
                            if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
                            else if (srv.hoursInterval && (srv.targetWorkHours - machine.currentWorkHours) <= 30 * 8) isWarning = true;
                          }
                          return !isOverdue && isWarning;
                        }).length;
                      })()
                    }</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-300">Przekroczone / Pilne</span>
                    <span className="font-bold text-lg text-rose-500">{
                      (() => {
                        const now = new Date();
                        return plannedServices.filter(srv => {
                          if (srv.status === 'completed' || srv.status === 'in_progress') return false;
                          const machine = machines.find(m => m.id === srv.machineId);
                          if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false;
                          if (srv.nextDate && safeParseDate(srv.nextDate) < now) return true;
                          if (srv.targetWorkHours && machine && machine.currentWorkHours >= srv.targetWorkHours) return true;
                          return false;
                        }).length;
                      })()
                    }</span>
                  </div>
                </div>
              )}

          {/* Przyciski Sterowania Zoomem */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl">
            <button 
              onClick={() => setZoomScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 4))} 
              className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-xl shadow-sm transition-colors"
              title="Powiększ (+)"
            >
              +
            </button>
            <button 
              onClick={() => { setZoomScale(1); setZoomPan({ x: 0, y: 0 }); }} 
              className="w-9 h-9 flex items-center justify-center text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-mono font-bold shadow-sm transition-colors"
              title="Resetuj powiększenie (100%) i pozycję"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button 
              onClick={() => setZoomScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 1))} 
              className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-xl shadow-sm transition-colors"
              title="Pomniejsz (-)"
            >
              -
            </button>
          </div>
        </div>
      </div>



      {/* Modal - Dodawanie / Edycja Pinezki */}
      {isModalOpen && mode === 'edit' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="ph ph-push-pin text-blue-600 text-xl"></i> 
                Przypnij Obiekt
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSavePin} className="p-6 space-y-5">
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    type="button"
                    disabled={currentSubmapId !== null}
                    onClick={() => { setEditingType('region'); setEditingId(''); }}
                    style={{ opacity: currentSubmapId !== null ? 0.3 : 1 }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Rejon / Hala
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingType('machine'); setEditingId(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Konkretna Maszyna
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Wybierz element z bazy</label>
                <select 
                  value={editingId} 
                  onChange={e => setEditingId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 font-medium"
                  required
                >
                  <option value="">-- Wybierz z listy --</option>
                  {getUnpinnedItems().map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                                                    {getUnpinnedItems().length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-2 font-semibold">
                      <i className="ph ph-check-circle mr-1"></i> 
                      {currentSubmapId !== null 
                        ? "Wszystkie przypisane maszyny są już na mapie! Możesz je złapać i swobodnie przesuwać." 
                        : "Brak obiektów do przypięcia. Wszystkie znajdują się już na mapie (możesz je przesuwać)."}
                    </p>
                  )}
              </div>

              <div className="pt-2">
                <button type="submit" disabled={!editingId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-sm">
                  Zapisz pinezkę na mapie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\MasterData.jsx
=========================================

```javascript
import { useState } from 'react';
import Machines from './Machines';
import Regions from './Regions';
import Roles from './Roles';
import Users from './Users';
import Settings from './Settings';
import Services from './Services';
import Topics from './Topics';
import Reporters from './Reporters';

export default function MasterData({ user, machines, regions, services, roles }) {
  const [activeSubTab, setActiveSubTab] = useState('machines');

  const tabs = [
    { id: 'machines', label: 'Baza Maszyn', icon: 'ph-engine' },
    { id: 'regions', label: 'Rejony na stoczni', icon: 'ph-map-pin' },
    { id: 'services', label: 'Podwykonawcy / Serwis', icon: 'ph-wrench' },
    { id: 'topics', label: 'Tematy Zgłoszeń', icon: 'ph-text-aa' },
    { id: 'reporters', label: 'Zgłaszający', icon: 'ph-user-list' }
  ];

  if (user.role === 'admin') {
    tabs.push({ id: 'users', label: 'Użytkownicy', icon: 'ph-users' });
    tabs.push({ id: 'roles', label: 'Role i Uprawnienia', icon: 'ph-shield-check' });
    tabs.push({ id: 'settings', label: 'Ustawienia', icon: 'ph-gear' });
  }

  // Odfiltruj zakładki jeśli użytkownik nie ma uprawnień (podobnie jak w ManagerView)
  let visibleTabs = tabs;
  if (user.role !== 'admin') {
    const userRoleDoc = roles.find(r => r.id === user.role);
    const perms = userRoleDoc?.permissions || [];
    visibleTabs = tabs.filter(t => perms.includes(t.id));
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sub-menu dla Master Data */}
      <div className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Konfiguracja</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {visibleTabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeSubTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <i className={`ph ${tab.icon} text-lg`}></i>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zawartość wybranej zakładki */}
      <div className="flex-1 min-w-0">
        {activeSubTab === 'machines' && <Machines />}
        {activeSubTab === 'regions' && <Regions />}
        {activeSubTab === 'services' && <Services services={services} />}
        {activeSubTab === 'topics' && <Topics />}
        {activeSubTab === 'reporters' && <Reporters />}
        {activeSubTab === 'users' && <Users />}
        {activeSubTab === 'roles' && <Roles />}
        {activeSubTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\PlannedMaintenance.jsx
=========================================

```javascript
import { exportToExcel } from '../../utils/reports/excelExport';
import PlannedMaintenanceFormModal from './PlannedMaintenanceFormModal';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, arrayUnion, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { addPlannedService, updatePlannedService, deletePlannedService, markServiceCompleted } from '../../services/plannedServices.service';
import { updateMachineWorkHours } from '../../services/machines.service';
import { safeParseDate } from '../../utils/dateHelpers';
import PlannedMaintenanceList from './PlannedMaintenanceList';
import PlannedMaintenanceFilters from './PlannedMaintenanceFilters';
import ChecklistExecutor from '../checklists/ChecklistExecutor';

export default function PlannedMaintenance({ machines, regions = [], user, plannedWarningDays = 30, isArchive = false, allowTicketDeletion = false, canEditPlanned = true, canDeletePlanned = true }) {
  const [services, setServices] = useState([]);
  const handleExportExcel = () => {
    const dataToExport = filteredServices.map(s => {
      const targetDate = safeParseDate(s.nextDate);
      return {
        'ID Serwisu': s.id,
        'Nazwa Serwisu': s.name || '-',
        'Maszyna': s.machineName || getMachine(s.machineId)?.name || '-',
        'Priorytet': s.priority === 'high' ? 'Wysoki (Krytyczny)' : 'Normalny',
        'Typ Wyzwalacza': s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Kalendarz' : 'Mieszany'),
        'Data Wykonania/Oczekiwana': targetDate ? targetDate.toLocaleDateString('pl-PL') : '-',
        'Cel RBG': s.targetWorkHours || '-',
        'Status': s.status === 'completed' ? 'Zakończony' : (s.status === 'in_progress' ? 'W trakcie' : 'Oczekujący'),
        'Historia': (s.history || []).map(h => `[${new Date(h.date).toLocaleDateString()}] ${h.user}: ${h.action}`).join(' | ')
      };
    });
    exportToExcel(dataToExport, isArchive ? 'Archiwum_Serwisow' : 'Planowane_Serwisy');
  };

  const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rbgUpdateModal, setRbgUpdateModal] = useState(null);
  const [newRbgValue, setNewRbgValue] = useState('');
  const [completionModal, setCompletionModal] = useState(null);
  const [checklistResponses, setChecklistResponses] = useState({});
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNewPlan, setCreateNewPlan] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [priority, setPriority] = useState('NieKrytyczny');
  const [triggerType, setTriggerType] = useState('calendar'); // calendar, hours, mixed
  const [calendarIntervalDays, setCalendarIntervalDays] = useState(30);
  const [nextDate, setNextDate] = useState('');
  const [hoursInterval, setHoursInterval] = useState(500);
  const [targetWorkHours, setTargetWorkHours] = useState('');
  const [estimatedDowntimeHours, setEstimatedDowntimeHours] = useState(4);
  const [estimatedManHours, setEstimatedManHours] = useState(8);
  const [requiredPersonnel, setRequiredPersonnel] = useState('');
  const [machineStatus, setMachineStatus] = useState('LOTO');
  const [checklist, setChecklist] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Akcje do realizacji
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItemProblem, setActionItemProblem] = useState('');
  const [actionItemDueDate, setActionItemDueDate] = useState('');
  
  // Uwagi na przyszłość (szczegóły serwisu)
  const [newFutureNote, setNewFutureNote] = useState('');


  // Filtry
  const [filterTime, setFilterTime] = useState('all'); // all, 30, 90
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  
  // Kolumny
  const [columns, setColumns] = useState({
    name: true,
    machine: true,
    region: true,
    nextDate: true,
    rbg: true,
    priority: true,
    status: true,
    actions: true
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'planned_services'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.isDeleted));
    });
    return () => unsub();
  }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getMachineName = (id) => getMachine(id)?.name || 'Nieznana maszyna';
  const getMachineRegionName = (regionId) => {
    if (!regionId) return '-';
    const found = regions.find(r => r.id === regionId || r.name === regionId);
    return found ? found.name : regionId;
  };

  // Logika Filtrówania
  const filteredServices = useMemo(() => {
    const now = new Date();
    const future30 = new Date(); future30.setDate(now.getDate() + 30);
    const future90 = new Date(); future90.setDate(now.getDate() + 90);

    const filtered = services.filter(srv => {
      // Archiwum
      if (isArchive) {
        if (srv.status !== 'completed') return false;
      } else {
        if (srv.status === 'completed') return false;
      }

      const machine = getMachine(srv.machineId);
      
      // Filtr Rejon
      if (filterRegion && machine?.regionId !== filterRegion) return false;
      
      // Filtr Maszyna
      if (filterMachine && srv.machineId !== filterMachine) return false;

      // Filtrów czasie)
      if (filterTime !== 'all' && !isArchive) {
        let isWithinTime = false;
        
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (filterTime === '30' && nDate <= future30) isWithinTime = true;
          if (filterTime === '90' && nDate <= future90) isWithinTime = true;
        }
        
        if (srv.targetWorkHours && machine) {
          const rbgThreshold = (filterTime === '30' ? 30 : 90) * 8;
          if ((srv.targetWorkHours) <= rbgThreshold) {
            isWithinTime = true;
          }
        }

        if (!isWithinTime) return false;
      }

      return true;
    });
    return filtered.sort((a, b) => {
      // 1. Status: W trakcie > Czerwony (Overdue) > Żółty (Warning) > Niebieski (Normal)
      const getStatusScore = (srv) => {
        if (srv.status === 'completed') return 0;
        if (srv.status === 'in_progress') return 5;
        
        const machine = getMachine(srv.machineId);
        let isOverdue = false;
        let isWarning = false;
        const now = new Date();

        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (nDate < now) isOverdue = true;
          else {
            const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= plannedWarningDays) isWarning = true;
          }
        }
        if (srv.targetWorkHours && machine) {
          if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
          else {
            if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true;
          }
        }

        if (isOverdue) return 4;
        if (isWarning) return 3;
        return 2;
      };

      const scoreA = getStatusScore(a);
      const scoreB = getStatusScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;

      // 2. Typ wyzwalacza (RBG > Kalendarz)
      const isRbgA = (a.triggerType === 'hours' || a.triggerType === 'mixed') ? 1 : 0;
      const isRbgB = (b.triggerType === 'hours' || b.triggerType === 'mixed') ? 1 : 0;
      if (isRbgA !== isRbgB) return isRbgB - isRbgA;

      // 3. Pilność (Remaining RBG lub data wymagalności)
      if (isRbgA === 1 && isRbgB === 1) {
         const machA = getMachine(a.machineId);
         const machB = getMachine(b.machineId);
         const remA = a.targetWorkHours ? a.targetWorkHours - (machA?.currentWorkHours || 0) : Infinity;
         const remB = b.targetWorkHours ? b.targetWorkHours - (machB?.currentWorkHours || 0) : Infinity;
         if (remA !== remB) return remA - remB;
      } else {
         const dateA = a.nextDate ? new Date(a.nextDate).getTime() : Infinity;
         const dateB = b.nextDate ? new Date(b.nextDate).getTime() : Infinity;
         if (dateA !== dateB) return dateA - dateB;
      }

      // 4. Priorytet
      const isCritA = a.priority === 'Krytyczny' ? 1 : 0;
      const isCritB = b.priority === 'Krytyczny' ? 1 : 0;
      return isCritB - isCritA;
    });
  }, [services, machines, filterTime, filterRegion, filterMachine, isArchive]);

  // Lista unikalnych rejonów z maszyn, które mają serwisy
  const regionsInUse = useMemo(() => {
    const rSet = new Set();
    services.forEach(s => {
      const m = getMachine(s.machineId);
      if (m && m.regionId) rSet.add(m.regionId);
    });
    return Array.from(rSet);
  }, [services, machines]);

  const toggleColumn = (key) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setFilterTime('all');
    setFilterRegion('');
    setFilterMachine('');
  };

  const getStatusColor = (srv, machine) => {
    if (srv.status === 'completed') return 'bg-emerald-100 text-emerald-700'; // Jak w awariach "Zakończone"
    if (srv.status === 'in_progress') return 'bg-purple-100 text-purple-700'; // W trakcie
    
    let isOverdue = false;
    let isWarning = false;
    const now = new Date();

    if (srv.nextDate) {
      const nDate = safeParseDate(srv.nextDate);
      if (nDate < now) isOverdue = true;
      else {
        const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= plannedWarningDays) isWarning = true;
      }
    }
    if (srv.targetWorkHours && machine) {
      if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
      else {
        if (srv.targetWorkHours - (machine.currentWorkHours || 0) <= plannedWarningDays * 8) isWarning = true;
      }
    }

    if (isOverdue) return 'bg-red-100 text-red-700';
    if (isWarning) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-50 text-blue-700'; // Domyślny kolor dla zaplanowanych
  };

  const openModalForNew = () => {
    setEditingId(null);
    setName('');
    setMachineId('');
    setPriority('NieKrytyczny');
    setTriggerType('calendar');
    setCalendarIntervalDays(30);
    setNextDate('');
    setHoursInterval(500);
    setTargetWorkHours('');
    setEstimatedDowntimeHours(4);
    setEstimatedManHours(8);
    setRequiredPersonnel('');
    setMachineStatus('LOTO');
    setChecklist([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (srv) => {
    setEditingId(srv.id);
    setName(srv.name || '');
    setMachineId(srv.machineId || '');
    setPriority(srv.priority || 'NieKrytyczny');
    setTriggerType(srv.triggerType || 'calendar');
    setCalendarIntervalDays(srv.calendarIntervalDays || 30);
    setNextDate(srv.nextDate ? safeParseDate(srv.nextDate).toISOString().slice(0,10) : '');
    setHoursInterval(srv.hoursInterval || 500);
    setTargetWorkHours(srv.targetWorkHours || '');
    setEstimatedDowntimeHours(srv.estimatedDowntimeHours || 4);
    setEstimatedManHours(srv.estimatedManHours || 8);
    setRequiredPersonnel(srv.requiredPersonnel || '');
    setMachineStatus(srv.machineStatus || 'LOTO');
    setChecklist(srv.checklist || []);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return alert('Błąd: Podaj nazwę / typ serwisu.');
    if (!machineId) return alert('Błąd: Wybierz maszynę.');
    if ((triggerType === 'calendar' || triggerType === 'mixed') && !nextDate) return alert('Błąd: Podaj datę planowaną (Kalendarz).');
    if ((triggerType === 'hours' || triggerType === 'mixed') && !targetWorkHours) return alert('Błąd: Podaj próg roboczogodzin (Roboczogodziny).');

    const serviceData = {
      name, machineId, priority, triggerType,
      estimatedDowntimeHours: Number(estimatedDowntimeHours),
      estimatedManHours: Number(estimatedManHours),
      requiredPersonnel, machineStatus, notified: false, checklist
    };

    if (triggerType === 'calendar' || triggerType === 'mixed') {
      serviceData.calendarIntervalDays = Number(calendarIntervalDays);
      serviceData.nextDate = nextDate ? new Date(nextDate) : null;
    }
    if (triggerType === 'hours' || triggerType === 'mixed') {
      serviceData.hoursInterval = Number(hoursInterval);
      serviceData.targetWorkHours = Number(targetWorkHours);
    }

    const historyEntry = {
      date: new Date().toISOString(),
      user: user.name,
      action: editingId ? 'Zaktualizowano plan' : 'Utworzono plan',
      note: ''
    };

    if (editingId) {
      serviceData.history = arrayUnion(historyEntry);
    } else {
      serviceData.history = [historyEntry];
    }

    try {
      if (editingId) await updatePlannedService(editingId, serviceData);
      else await addPlannedService(serviceData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas zapisywania: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Czy na pewno usunąć ten plan serwisowy?')) {
      await deletePlannedService(id);
    }
  };

  const handleUpdateRbg = async (e) => {
    e.preventDefault();
    if (!rbgUpdateModal) return;
    try {
      await updateMachineWorkHours(rbgUpdateModal.id, Number(newRbgValue));
      setRbgUpdateModal(null);
      setNewRbgValue('');
    } catch (err) {
      console.error(err);
      alert('Błąd aktualizacji roboczogodzin');
    }
  };

  
  const handleAddNote = async (srv) => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const historyEntry = {
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Dodano notatkę',
        note: newNote.trim()
      };
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      await updatePlannedService(srv.id, { history: newHistory });
      setNewNote('');
    } catch (err) {
      console.error(err);
      alert('Błąd dodawania notatki');
    } finally {
      setAddingNote(false);
    }
  };

  const handleSetInProgress = async (srv) => {
    if (confirm('Czy na pewno chcesz oznaczyć ten serwis jako "W trakcie"?')) {
      const historyEntry = {
        date: new Date().toISOString(),
        user: user?.name || 'System',
        action: 'Zmieniono status na: W trakcie',
        note: ''
      };
      
      const newHistory = srv.history ? [...srv.history, historyEntry] : [historyEntry];
      
      try {
        await updatePlannedService(srv.id, {
          status: 'in_progress',
          history: newHistory
        });
      } catch (err) {
        console.error(err);
        alert('Błąd aktualizacji statusu');
      }
    }
  };

  const handleCompleteService = async (e) => {
    e.preventDefault();
    if (!completionModal) return;

    try {
      let nextPlanData = null;
      if (createNewPlan) {
        nextPlanData = {
          name: completionModal.name, machineId: completionModal.machineId || '',
          priority: completionModal.priority, triggerType: completionModal.triggerType,
          estimatedDowntimeHours: completionModal.estimatedDowntimeHours,
          estimatedManHours: completionModal.estimatedManHours,
          requiredPersonnel: completionModal.requiredPersonnel,
          machineStatus: completionModal.machineStatus, notified: false,
          checklist: completionModal.checklist || [],
          futureNotes: completionModal.futureNotes || []
        };

        if (completionModal.triggerType === 'calendar' || completionModal.triggerType === 'mixed') {
          nextPlanData.calendarIntervalDays = completionModal.calendarIntervalDays;
          const nextD = new Date();
          nextD.setDate(nextD.getDate() + (completionModal.calendarIntervalDays || 30));
          nextPlanData.nextDate = nextD;
        }

        if (completionModal.triggerType === 'hours' || completionModal.triggerType === 'mixed') {
          nextPlanData.hoursInterval = completionModal.hoursInterval;
          const machine = getMachine(completionModal.machineId);
          const currentH = machine?.currentWorkHours || 0;
          nextPlanData.targetWorkHours = currentH + (completionModal.hoursInterval || 500);
        }
      }

      let checklistSummary = [];
      if (completionModal.checklist && completionModal.checklist.length > 0) {
         checklistSummary = completionModal.checklist.map(step => {
            const answer = checklistResponses[step.id];
            return {
               taskName: step.taskName,
               type: step.type,
               answer: answer === undefined ? null : answer
            };
         });
      }

      const historyEntry = {
        date: new Date().toISOString(),
        user: user.name,
        action: 'Zakończono serwis',
        note: completionNotes,
        checklistSummary: checklistSummary
      };

            await markServiceCompleted(completionModal.id, {
        completedBy: user.name, notes: completionNotes,
        checklistResponses: checklistResponses, historyEntry
      }, nextPlanData);

      if (createActionItem && actionItemProblem.trim()) {
        await addDoc(collection(db, 'action_items'), {
          machineId: completionModal.machineId || '',
          plannedServiceId: completionModal.id || '',
          problem: actionItemProblem.trim(),
          dueDate: actionItemDueDate ? new Date(actionItemDueDate).toISOString() : null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: user.name || 'Nieznany'
        });
      }

      setCompletionModal(null); setCompletionNotes(''); setChecklistResponses({}); setCreateNewPlan(true);
      setCreateActionItem(false); setActionItemProblem(''); setActionItemDueDate('');
    } catch (err) {
      console.error(err);
      alert('Błąd: ' + err.message);
    }
  };

  const handleAddFutureNote = async (serviceId) => {
    if (!newFutureNote.trim()) return;
    try {
      const noteObj = {
        text: newFutureNote.trim(),
        author: user?.name || 'Nieznany',
        createdAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'planned_services', serviceId), {
        futureNotes: arrayUnion(noteObj)
      });
      setNewFutureNote('');
    } catch (err) {
      console.error(err);
      alert('Błąd dodawania notatki: ' + err.message);
    }
  };

  if (selectedServiceId) {
    const srv = services.find(s => s.id === selectedServiceId);
    if (!srv) {
      setSelectedServiceId(null);
      return null;
    }
    const machine = getMachine(srv.machineId);
    const isCompleted = srv.status === 'completed';

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex gap-3 sm:gap-4 flex-wrap p-3 sm:p-4 bg-white/95 backdrop-blur border-b sm:border border-gray-200 sticky top-0 z-30 shadow-sm sm:rounded-xl mb-4">
          <button 
            onClick={() => setSelectedServiceId(null)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all w-fit"
          >
            <i className="ph ph-arrow-left text-lg"></i>
            Wróć do listy serwisów
          </button>
          <button 
            onClick={() => import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, machine))}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all w-fit"
          >
            <i className="ph ph-file-pdf text-xl text-red-600"></i>
            Karta Serwisu PDF
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEWA KOLUMNA (Karta Serwisu) */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{srv.name}</h2>
                    <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                      <i className="ph ph-engine text-lg text-slate-400"></i>
                      {machine?.name || 'Nieznana maszyna'} ({getMachineRegionName(machine?.regionId)})
                    </div>
                  </div>
                  <div>
                    {srv.priority === 'Krytyczny' ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-red-100 flex items-center gap-1 shadow-sm"><i className="ph ph-warning"></i> KRYTYCZNY</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm">Standard</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-clock text-base"></i> Wyzwalacz</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.triggerType === 'calendar' ? 'Kalendarz' : srv.triggerType === 'hours' ? 'RBG' : 'Mieszany'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-users text-base"></i> Personel</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.requiredPersonnel || '-'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-hourglass text-base"></i> Przestój (h)</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.estimatedDowntimeHours || 0} h</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><i className="ph ph-wrench text-base"></i> Status maszyny</div>
                    <div className="font-bold text-slate-800 text-sm">{srv.machineStatus || '-'}</div>
                  </div>
                </div>

                                <div className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="ph ph-list-checks text-xl text-blue-600"></i> Zakres prac do wykonania
                  </h3>
                  {srv.checklist && srv.checklist.length > 0 ? (
                    <ul className="space-y-3">
                      {srv.checklist.map((step, idx) => (
                        <li key={step.id} className="flex items-start gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <span className="font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{step.taskName}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              Wymagane: {step.type === 'CHECKBOX' ? 'Potwierdzenie (odhaczenie)' : step.type === 'PHOTO' ? 'Zdjęcie dokumentujące' : 'Wpisanie wartości'}
                              <span className={step.isRequired ? "text-red-500 font-medium ml-1" : "text-slate-400 ml-1"}>
                                {step.isRequired ? '(Obowiązkowe)' : '(Opcjonalne)'}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm font-medium text-slate-600 italic bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                      Przegląd według obowiązującego standardu DTR maszyny.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                  {!isCompleted && srv.status !== 'in_progress' && (
                    <button onClick={() => handleSetInProgress(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-play-circle text-xl"></i>
                      Rozpocznij Serwis
                    </button>
                  )}
                  {!isCompleted && srv.status === 'in_progress' && (
                    <>
                      {(!srv.checklist || srv.checklist.length === 0) ? (
                        <button onClick={() => setCompletionModal(srv)} className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                          <i className="ph ph-check-circle text-xl"></i>
                          Zakończ Serwis
                        </button>
                      ) : (
                        <div className="w-full mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Lista Kontrolna (Wymagana do zamknięcia)</h3>
                          <ChecklistExecutor 
                            steps={srv.checklist} 
                            onComplete={(responses) => {
                              setChecklistResponses(responses);
                              setCompletionModal(srv);
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {!isCompleted && srv.status !== 'in_progress' && canEditPlanned && (<button onClick={() => openModalForEdit(srv)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-slate-300">
                    <i className="ph ph-pencil-simple text-xl"></i>
                    Edytuj</button>)}
                  {canDeletePlanned && (!isArchive || allowTicketDeletion) && (
                  <button onClick={() => {
                    handleDelete(srv.id);
                    setSelectedServiceId(null);
                  }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 border border-red-200">
                    <i className="ph ph-trash text-xl"></i>
                    Usuń
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA (Historia Zdarzeń) */} \n<div className="w-full lg:w-1/3">
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ</h4>
              
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                {srv.history && [...srv.history].reverse().map((entry, index) => (
                  <div key={index} className="relative pl-8">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-slate-800"></div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-800 text-sm">{entry.user || 'System'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(entry.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium">{entry.action}</div>
                    {entry.note && (
                      <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        &quot;{entry.note}&quot;
                      </div>
                    )}
                    {entry.checklistSummary && entry.checklistSummary.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lista Kontrolna (Checklista):</div>
                        {entry.checklistSummary.map((item, i) => (
                           <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="font-semibold">{item.taskName}:</span>{' '}
                             {item.type === 'CHECKBOX' ? (
                               item.answer ? '✅ Wykonano' : '❌ Pominięto'
                             ) : item.type === 'PHOTO' ? (
                               item.answer && item.answer.length > 0 ? (
                                 <div className="mt-2 flex gap-2 flex-wrap">
                                   <img 
                                       src={item.answer} 
                                       alt="załącznik" 
                                       className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                       onClick={() => setLightboxImg(item.answer)}
                                     />
                                 </div>
                               ) : 'Brak zdjęć'
                             ) : (
                               <span className="font-mono text-blue-600">{item.answer || 'Brak danych'}</span>
                             )}
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!srv.history || srv.history.length === 0) && (
                  <div className="text-sm text-slate-400 italic pl-6">Brak historii zdarzeń.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reuse existing modals for editing/completing */}
        {/* Aktualizacja RBG Modal */}
        {rbgUpdateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleUpdateRbg} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aktualizuj licznik maszyny</h3>
              <p className="text-sm text-slate-600 mb-4">{rbgUpdateModal.name}</p>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">Nowy stan licznika (rbg)</label>
                <input type="number" value={newRbgValue} onChange={e => setNewRbgValue(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min={0} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRbgUpdateModal(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold">Anuluj</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Zapisz</button>
              </div>
            </form>
          </div>
        )}

        {/* Zakończenie Serwisu Modal */}
        {completionModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleCompleteService} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Zakończ Serwis</h3>
              <p className="text-sm text-slate-600 mb-4 font-bold">{completionModal.name}</p>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">Notatki z wykonania</label>
                <textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none" rows="3" placeholder="np. Wymieniono filtr, zalano 5L oleju..." />
              </div>
              <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" id="createNewPlan" checked={createNewPlan} onChange={e => setCreateNewPlan(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <label htmlFor="createNewPlan" className="text-sm font-bold text-gray-700 cursor-pointer">Wygeneruj automatycznie kolejny termin przeglądu</label>
            </div>
            
            <div className="mb-6 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="createActionItem" checked={createActionItem} onChange={e => setCreateActionItem(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <label htmlFor="createActionItem" className="text-sm font-bold text-gray-700 cursor-pointer">Dodaj do Tematy do Realizacji</label>
              </div>
              {createActionItem && (
                <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Problem / Akcja do wykonania</label>
                    <textarea value={actionItemProblem} onChange={e => setActionItemProblem(e.target.value)} required={createActionItem} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" placeholder="Wpisz problem..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Data wymaganej realizacji</label>
                    <input type="date" value={actionItemDueDate} onChange={e => setActionItemDueDate(e.target.value)} required={createActionItem} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCompletionModal(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-bold">Anuluj</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm">Zatwierdź Wykonanie</button>
              </div>
            </form>
          </div>
        )}

        
        {/* Sekcja: Spostrzeżenia i Uwagi na przyszłość */}
        <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
            <i className="ph ph-lightbulb text-xl text-amber-600"></i>
            Spostrzeżenia i uwagi na przyszłość
          </h3>
          
          <div className="space-y-4 mb-6">
            {(!srv.futureNotes || srv.futureNotes.length === 0) ? (
              <p className="text-sm text-amber-700 italic">Brak zapisanych uwag.</p>
            ) : (
              srv.futureNotes.map((note, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                  <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Dodał: {note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isCompleted && (
          <div className="flex flex-col gap-2">
            <textarea 
              value={newFutureNote} 
              onChange={e => setNewFutureNote(e.target.value)} 
              className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-y" 
              rows="3" 
              placeholder="Wpisz nowe spostrzeżenia lub uwagi..." 
            />
            <div className="flex justify-end">
              <button 
                onClick={() => handleAddFutureNote(srv.id)}
                disabled={!newFutureNote.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center"
              >
                <i className="ph ph-plus-circle mr-1"></i> Zapisz uwagę
              </button>
            </div>
          </div>
          )}
        </div>

      <PlannedMaintenanceFormModal 
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingId={editingId}
        name={name} setName={setName} machineId={machineId} setMachineId={setMachineId}
        priority={priority} setPriority={setPriority} triggerType={triggerType} setTriggerType={setTriggerType}
        calendarIntervalDays={calendarIntervalDays} setCalendarIntervalDays={setCalendarIntervalDays}
        nextDate={nextDate} setNextDate={setNextDate} hoursInterval={hoursInterval} setHoursInterval={setHoursInterval}
        targetWorkHours={targetWorkHours} setTargetWorkHours={setTargetWorkHours}
        estimatedDowntimeHours={estimatedDowntimeHours} setEstimatedDowntimeHours={setEstimatedDowntimeHours}
        estimatedManHours={estimatedManHours} setEstimatedManHours={setEstimatedManHours}
        requiredPersonnel={requiredPersonnel} setRequiredPersonnel={setRequiredPersonnel}
        machineStatus={machineStatus} setMachineStatus={setMachineStatus}
        checklist={checklist} setChecklist={setChecklist}
        machines={machines} handleSaveService={handleSaveService}
      />

      {/* Lightbox for details view */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img 
            src={lightboxImg} 
            alt="Powiększenie" 
            className="max-w-full max-h-full object-contain cursor-zoom-out"
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
  
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className={`ph ${isArchive ? 'ph-archive text-slate-600' : 'ph-calendar-check text-blue-600'} text-2xl`}></i>
            {isArchive ? 'Archiwum Serwisów' : 'Serwis Planowany'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isArchive ? 'Historia zakończonych prac prewencyjnych' : 'Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors shrink-0"
          >
            <i className="ph ph-file-xls text-lg"></i>
            Eksportuj (.xlsx)
          </button>
          {!isArchive && (
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <i className="ph ph-list-dashes mr-1"></i> Lista
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <i className="ph ph-calendar-blank mr-1"></i> Kalendarz
              </button>
            </div>
          )}
          
          {!isArchive && (
            <button 
              onClick={openModalForNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <i className="ph ph-plus-circle text-lg"></i>
              Dodaj Plan
            </button>
          )}
        </div>
      </div>


      <PlannedMaintenanceFilters 
        isArchive={isArchive}
        filterTime={filterTime} setFilterTime={setFilterTime}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterMachine={filterMachine} setFilterMachine={setFilterMachine}
        clearFilters={clearFilters}
        showColumnMenu={showColumnMenu} setShowColumnMenu={setShowColumnMenu}
        columns={columns} toggleColumn={toggleColumn}
        regions={regions} machines={machines}
        
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
    
      <PlannedMaintenanceList 
        viewMode={viewMode}
        filteredServices={filteredServices}
        columns={columns}
        getMachine={getMachine}
        getStatusColor={getStatusColor}
        getMachineRegionName={getMachineRegionName}
        machines={machines}
        setSelectedServiceId={setSelectedServiceId}
        setRbgUpdateModal={setRbgUpdateModal}
        setNewRbgValue={setNewRbgValue}
      />
      </div>
  
      {/* Modal - Dodaj / Edytuj */}
      {rbgUpdateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateRbg} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Aktualizuj licznik maszyny</h3>
            <p className="text-sm text-gray-600 mb-4">{rbgUpdateModal.name}</p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nowy stan licznika (rbg)</label>
              <input type="number" value={newRbgValue} onChange={e => setNewRbgValue(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min={0} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRbgUpdateModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold">Anuluj</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Zapisz</button>
            </div>
          </form>
        </div>
      )}

      {/* Zakończenie Serwisu Modal */}
      {completionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCompleteService} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Zakończ Serwis</h3>
            <p className="text-sm text-gray-600 mb-4 font-bold">{completionModal.name}</p>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Notatki z wykonania</label>
              <textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" rows="3" placeholder="np. Wymieniono filtr, zalano 5L oleju..." />
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input type="checkbox" id="createNewPlan" checked={createNewPlan} onChange={e => setCreateNewPlan(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <label htmlFor="createNewPlan" className="text-sm font-bold text-gray-700 cursor-pointer">Wygeneruj automatycznie kolejny termin przeglądu</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCompletionModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold">Anuluj</button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-sm">Zatwierdź Wykonanie</button>
            </div>
          </form>
        </div>
      )}

      <PlannedMaintenanceFormModal 
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingId={editingId}
        name={name} setName={setName} machineId={machineId} setMachineId={setMachineId}
        priority={priority} setPriority={setPriority} triggerType={triggerType} setTriggerType={setTriggerType}
        calendarIntervalDays={calendarIntervalDays} setCalendarIntervalDays={setCalendarIntervalDays}
        nextDate={nextDate} setNextDate={setNextDate} hoursInterval={hoursInterval} setHoursInterval={setHoursInterval}
        targetWorkHours={targetWorkHours} setTargetWorkHours={setTargetWorkHours}
        estimatedDowntimeHours={estimatedDowntimeHours} setEstimatedDowntimeHours={setEstimatedDowntimeHours}
        estimatedManHours={estimatedManHours} setEstimatedManHours={setEstimatedManHours}
        requiredPersonnel={requiredPersonnel} setRequiredPersonnel={setRequiredPersonnel}
        machineStatus={machineStatus} setMachineStatus={setMachineStatus}
        checklist={checklist} setChecklist={setChecklist}
        machines={machines} handleSaveService={handleSaveService}
      />

    
      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img 
            src={lightboxImg} 
            alt="Powiększenie" 
            className="max-w-full max-h-full object-contain cursor-zoom-out"
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\PlannedMaintenanceFilters.jsx
=========================================

```javascript
import React from 'react';

export default function PlannedMaintenanceFilters({
  isArchive,
  filterTime, setFilterTime,
  filterRegion, setFilterRegion,
  filterMachine, setFilterMachine,
  clearFilters,
  showColumnMenu, setShowColumnMenu,
  columns, toggleColumn,
  regions, machines,
  viewMode, setViewMode
}) {
  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center shrink-0">
        <span className="text-sm font-bold text-slate-700 mr-2"><i className="ph ph-funnel"></i> Filtruj:</span>
        
        {!isArchive && (
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setFilterTime('all')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === 'all' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Wszystkie</button>
            <button onClick={() => setFilterTime('30')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === '30' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Najbliższe 30 dni</button>
            <button onClick={() => setFilterTime('90')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filterTime === '90' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Najbliższe 90 dni</button>
          </div>
        )}

        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Rejony</option>
          {regions.map(r => <option key={r.id || r.name} value={r.id || r.name}>{r.name}</option>)}
        </select>

        <select value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie Maszyny</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {(filterTime !== 'all' || filterRegion || filterMachine) && (
          <button onClick={clearFilters} className="text-sm text-red-600 font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
            <i className="ph ph-x"></i> Wyczyść filtry
          </button>
        )}

        <div className="ml-auto relative">
          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="text-sm border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-lg flex items-center gap-2">
            <i className="ph ph-gear"></i> Kolumny
          </button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 text-sm">
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.name} onChange={() => toggleColumn('name')}/> Typ Serwisu</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.machine} onChange={() => toggleColumn('machine')}/> Maszyna</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.region} onChange={() => toggleColumn('region')}/> Rejon</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.nextDate} onChange={() => toggleColumn('nextDate')}/> Termin (Kalendarz)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.rbg} onChange={() => toggleColumn('rbg')}/> Termin (RBG)</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.priority} onChange={() => toggleColumn('priority')}/> Priorytet</label>
              <label className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={columns.status} onChange={() => toggleColumn('status')}/> Status</label>
            </div>
          )}
        </div>
      </div>

      
    </>
  );
}

```


=========================================
📄 PLIK: src\components\manager\PlannedMaintenanceFormModal.jsx
=========================================

```javascript
import React from 'react';
import ChecklistBuilder from '../checklists/ChecklistBuilder';

export default function PlannedMaintenanceFormModal({
  isModalOpen, setIsModalOpen, editingId,
  name, setName, machineId, setMachineId,
  priority, setPriority, triggerType, setTriggerType,
  calendarIntervalDays, setCalendarIntervalDays,
  nextDate, setNextDate, hoursInterval, setHoursInterval,
  targetWorkHours, setTargetWorkHours,
  estimatedDowntimeHours, setEstimatedDowntimeHours,
  estimatedManHours, setEstimatedManHours,
  requiredPersonnel, setRequiredPersonnel,
  machineStatus, setMachineStatus,
  checklist, setChecklist,
  machines, handleSaveService
}) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form onSubmit={handleSaveService} className="bg-white rounded-xl shadow-xl max-w-5xl w-11/12 p-6 my-8">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edytuj Plan Serwisowy' : 'Nowy Plan Serwisowy'}</h3>
          <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa / Typ serwisu</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Wymiana oleju - Serwis 500h" className="w-full p-2 border border-gray-300 rounded outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Maszyna</label>
            <select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
              <option value="">-- Wybierz --</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Kategoria / Priorytet</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
              <option value="NieKrytyczny">NieKrytyczny (w tle)</option>
              <option value="Krytyczny">Krytyczny (zatrzymuje linię)</option>
            </select>
          </div>
        </div>
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-800 mb-3">Typ wyzwalacza (Trigger)</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="calendar" checked={triggerType === 'calendar'} onChange={() => setTriggerType('calendar')} /> Kalendarzowy</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="hours" checked={triggerType === 'hours'} onChange={() => setTriggerType('hours')} /> Roboczogodziny</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="trigger" value="mixed" checked={triggerType === 'mixed'} onChange={() => setTriggerType('mixed')} /> Mieszany</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(triggerType === 'calendar' || triggerType === 'mixed') && (
              <div className="space-y-3 border-t md:border-t-0 md:border-r border-gray-200 pt-3 md:pt-0 pr-0 md:pr-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Interwał (co ile dni)</label>
                  <input type="number" value={calendarIntervalDays} onChange={e => setCalendarIntervalDays(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data planowana</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
              </div>
            )}
            {(triggerType === 'hours' || triggerType === 'mixed') && (
              <div className="space-y-3 pt-3 md:pt-0">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Interwał pracy (co ile rbg)</label>
                  <input type="number" value={hoursInterval} onChange={e => setHoursInterval(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Docelowy stan licznika (rbg)</label>
                  <input type="number" value={targetWorkHours} onChange={e => setTargetWorkHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="np. 1500" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Czas wyłączenia maszyny (h)</label>
            <input type="number" value={estimatedDowntimeHours} onChange={e => setEstimatedDowntimeHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" min={0} step="0.5" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Pracochłonność (Roboczogodziny ludzi)</label>
            <input type="number" value={estimatedManHours} onChange={e => setEstimatedManHours(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" min={0} step="0.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Wymagany personel / kwalifikacje</label>
            <input type="text" value={requiredPersonnel} onChange={e => setRequiredPersonnel(e.target.value)} placeholder="np. Elektryk SEP, 2x Mechanik" className="w-full p-2 border border-gray-300 rounded outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Wymagany status maszyny podczas serwisu</label>
            <select value={machineStatus} onChange={e => setMachineStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
              <option value="LOTO">LOTO (Całkowicie odłączona, Lockout/Tagout)</option>
              <option value="Wyłączona">Wyłączona, ale zasilanie doprowadzone</option>
              <option value="Ruch częściowy">Dopuszczony ruch częściowy (tryb serwisowy)</option>
              <option value="Bez wpływu">Maszyna może pracować normalnie</option>
            </select>
          </div>
        </div>
        <div className="mb-6"><ChecklistBuilder steps={checklist || []} onChange={setChecklist} /></div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors">Anuluj</button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-sm">Zapisz Plan</button>
        </div>
      </form>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\PlannedMaintenanceList.jsx
=========================================

```javascript
import React from 'react';
import ServiceCalendar from './ServiceCalendar';
import { safeParseDate } from '../../utils/dateHelpers';

export default function PlannedMaintenanceList({
  viewMode,
  filteredServices,
  columns,
  getMachine,
  getStatusColor,
  getMachineRegionName,
  machines,
  setSelectedServiceId,
  setRbgUpdateModal,
  setNewRbgValue
}) {
  return (
    <>
      {viewMode === 'calendar' ? (
        <div className="p-2 sm:p-4">
          <ServiceCalendar services={filteredServices} machines={machines} onSelectService={setSelectedServiceId} />
        </div>
      ) : (
        <div className="flex-1">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-white border-b-2 border-slate-100 sticky top-0 z-10">
                <tr>
                  {columns.actions && <th className="px-6 py-4 w-12 text-center">Akcje</th>}
{columns.name && <th className="px-6 py-4">Typ Serwisu</th>}
                  {columns.machine && <th className="px-6 py-4">Maszyna</th>}
                  {columns.region && <th className="px-6 py-4">Rejon</th>}
                  {columns.nextDate && <th className="px-6 py-4">Termin</th>}
                  {columns.rbg && <th className="px-6 py-4">Termin (RBG)</th>}
                  {columns.priority && <th className="px-6 py-4">Priorytet</th>}
                  {columns.status && <th className="px-6 py-4">Status</th>}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-400">Brak serwisów pasujących do kryteriów.</td>
                  </tr>
                ) : filteredServices.map(srv => {
                  const machine = getMachine(srv.machineId);
                  const isCompleted = srv.status === 'completed';
                  const rowColor = getStatusColor(srv, machine);

                  return (
                    <tr key={srv.id} className={`hover:bg-slate-50 transition-colors group ${isCompleted ? 'opacity-70' : ''}`}>
                      {columns.actions && (
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-1 group-hover:border-blue-300 group-hover:text-blue-600">
                              <i className="ph ph-caret-right"></i> Szczegóły
                            </button>
                          </td>
                        )}
{columns.name && (
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{srv.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status maszyny: <span className="text-slate-600">{srv.machineStatus}</span></div>
                        </td>
                      )}
                      {columns.machine && (
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{machine?.name || 'Nieznana'}</td>
                      )}
                      {columns.region && (
                        <td className="px-6 py-4 font-bold text-slate-600 text-sm">{getMachineRegionName(machine?.regionId)}</td>
                      )}
                      {columns.nextDate && (
                        <td className="px-6 py-4">
                          {srv.triggerType === 'calendar' || srv.triggerType === 'mixed' ? (
                            <div className="text-sm">
                              <div className="font-bold text-slate-800">{srv.nextDate ? safeParseDate(srv.nextDate).toLocaleDateString() : '-'}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">CO {srv.calendarIntervalDays} DNI</div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      )}
                      {columns.rbg && (
                        <td className="px-6 py-4">
                          {srv.triggerType === 'hours' || srv.triggerType === 'mixed' ? (
                            <div className="text-sm">
                              <div className="font-bold text-slate-800">Cel: <span className="font-mono">{srv.targetWorkHours}</span></div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400">OBECNIE: <span className="font-mono">{machine?.currentWorkHours || 0}</span></span>
                                {srv.status !== 'completed' && <button onClick={() => { setRbgUpdateModal(machine); setNewRbgValue(machine?.currentWorkHours || 0); }} className="text-blue-500 hover:text-blue-700 ml-1"><i className="ph ph-pencil-simple"></i></button>}
                              </div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      )}
                      {columns.priority && (
                        <td className="px-6 py-4">
                          {srv.priority === 'Krytyczny' ? <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-red-100 flex inline-flex items-center gap-1 w-max"><i className="ph ph-warning"></i> KRYTYCZNE</span> : <span className="text-slate-400 text-xs font-bold uppercase">Standard</span>}
                        </td>
                      )}
                      {columns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rowColor}`}>
                            {isCompleted ? 'Zakończone' : srv.status === 'in_progress' ? 'W trakcie' : 'Oczekuje'}
                          </span>
                        </td>
                      )}
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-4 mt-2 p-2">
            {filteredServices.length === 0 ? (
              <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak serwisów pasujących do kryteriów.</div>
            ) : filteredServices.map(srv => {
              const machine = getMachine(srv.machineId);
              const isCompleted = srv.status === 'completed';
              const rowColor = getStatusColor(srv, machine);

              return (
                <div key={srv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-20">
                      <h4 className="font-bold text-slate-800 text-[15px]">{srv.name}</h4>
                      <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{getMachineRegionName(machine?.regionId)}</div>
                    </div>
                    <span className={`absolute top-4 right-4 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${rowColor}`}>
                      {isCompleted ? 'Zakończone' : srv.status === 'in_progress' ? 'W trakcie' : 'Oczekuje'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <i className="ph ph-engine text-slate-400 text-base"></i>
                      {machine?.name || 'Nieznana maszyna'}
                    </div>
                    {srv.priority === 'Krytyczny' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 w-max px-2 py-1 rounded border border-red-100"><i className="ph ph-warning"></i> KRYTYCZNY</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      {(srv.triggerType === 'calendar' || srv.triggerType === 'mixed') && (
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <i className="ph ph-calendar-blank text-slate-400"></i>
                          {srv.nextDate ? safeParseDate(srv.nextDate).toLocaleDateString() : '-'}
                        </span>
                      )}
                      {(srv.triggerType === 'hours' || srv.triggerType === 'mixed') && (
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <i className="ph ph-hourglass text-slate-400"></i>
                          Cel: {srv.targetWorkHours} <span className="text-slate-400 font-normal">({machine?.currentWorkHours || 0})</span>
                        </span>
                      )}
                    </div>
                    <button onClick={() => setSelectedServiceId(srv.id)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-2 group-hover:border-blue-300 group-hover:text-blue-600">
                      Szczegóły
                      <i className="ph ph-caret-right"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Regions.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapFile, setMapFile] = useState(null);
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubRegions = onSnapshot(collection(db, "regions"), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    const unsubMachines = onSnapshot(collection(db, "machines"), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => {
      unsubRegions();
      unsubMachines();
    };
  }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = mapImageUrl;

      if (mapFile) {
        const fileRef = ref(storage, `regions_maps/${Date.now()}_${mapFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, mapFile);
        
        finalImageUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prog);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      if (editingId) {
        await updateDoc(doc(db, "regions", editingId), { 
          name: name.trim(), 
          description: description.trim(),
          mapImageUrl: finalImageUrl
        });
      } else {
        await addDoc(collection(db, "regions"), {
          name: name.trim(),
          description: description.trim(),
          mapImageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
      }
      setName('');
      setDescription('');
      setMapFile(null);
      setMapImageUrl('');
      setUploadProgress(0);
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
      alert("Błąd podczas zapisu: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setDescription(r.description || '');
    setEditingId(r.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const machinesQuery = query(collection(db, 'machines'), where('regionId', '==', id));
      const machinesSnapshot = await getDocs(machinesQuery);
      
      if (!machinesSnapshot.empty) {
        alert(`Nie można usunąć tego rejonu, ponieważ jest on przypisany do ${machinesSnapshot.size} maszyn. Zmień rejon w przypisanych maszynach przed usunięciem.`);
        return;
      }
      
      if (confirm("Czy na pewno chcesz usunąć ten rejon?")) {
        await updateDoc(doc(db, "regions", id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas usuwania rejonu');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Rejony (Miejsca)</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj rejonami stoczni używanymi w systemie.</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setDescription(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Rejon
        </button>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-xl font-extrabold text-gray-800">
                  {editingId ? 'Edytuj rejon' : 'Dodaj nowy rejon'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa Rejonu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Hala K3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Opis (opcjonalnie)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Główna hala montażowa"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Podmapa Rejonu (opcjonalnie)</label>
            {mapImageUrl && !mapFile && (
              <div className="mb-2 relative w-32 h-20 rounded-md overflow-hidden border border-gray-300">
                <img src={mapImageUrl} className="w-full h-full object-cover" alt="Podmapa" />
                <button type="button" onClick={() => setMapImageUrl('')} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"><i className="ph ph-x text-xs"></i></button>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setMapFile(e.target.files[0])}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 text-xs font-bold text-blue-600">Wgrywanie: {Math.round(uploadProgress)}%</div>
            )}
          </div>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setDescription(''); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rejon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Rejonu</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Opis</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Maszyny w rejonie</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Podmapa</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regions.map(r => {
                const regionMachines = machines.filter(m => m.regionId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 font-bold text-gray-800">{r.name || 'Bez nazwy'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {regionMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {regionMachines.map(m => (
                            <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Brak przypisanych maszyn</span>
                      )}
                    </td>
                      <td className="px-6 py-4 text-center">
                        {r.mapImageUrl ? (
                          <div className="flex justify-center">
                            <a href={r.mapImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shadow-sm relative group block" title="Kliknij by powiększyć mapę">
                              <img src={r.mapImageUrl} alt="Podmapa" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="ph ph-magnifying-glass-plus text-white"></i>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Brak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(r)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-pencil-simple"></i> Edytuj
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-trash"></i> Usuń
                          </button>
                        </div>
                      </td>
                  </tr>
                );
              })}
              {regions.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Brak zdefiniowanych rejonów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Reporters.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Reporters() {
  const [reporters, setReporters] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reporters'), (snapshot) => {
      setReporters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim()
      };
      if (editingId) {
        await updateDoc(doc(db, 'reporters', editingId), payload);
      } else {
        await addDoc(collection(db, 'reporters'), payload);
      }
      setName('');
      setPhone('');
      setPosition('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, reporterName) => {
    if (window.confirm(`Czy na pewno chcesz usunąć pracownika: ${reporterName}?`)) {
      try {
        await updateDoc(doc(db, 'reporters', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      } catch (err) {
        alert("Błąd podczas usuwania: " + err.message);
      }
    }
  };

  const handleEdit = (r) => {
    setName(r.name);
    setPhone(r.phone);
    setPosition(r.position || '');
    setEditingId(r.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pracownicy Zgłaszający</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj bazą osób zgłaszających awarie</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setPhone(''); setPosition(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Pracownika
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <i className="ph ph-user-plus text-blue-600"></i>
                {editingId ? 'Edytuj Pracownika' : 'Dodaj Nowego Pracownika'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 font-bold">{error}</div>}
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Jan Kowalski" 
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stanowisko</label>
            <input 
              type="text" 
              value={position} 
              onChange={(e) => setPosition(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Operator suwnicy" 
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer Telefonu</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 9);
                let formatted = val;
                if (val.length > 3 && val.length <= 6) {
                  formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
                } else if (val.length > 6) {
                  formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
                }
                setPhone(formatted);
              }}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. 500 600 700" 
              pattern="[0-9]{3} [0-9]{3} [0-9]{3}"
              minLength={11}
              maxLength={11}
              required
            />
          </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100 w-full">
            <button 
              type="button" 
              onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setPhone(''); setPosition(''); }}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors min-w-[150px]"
            >
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj pracownika')}
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Lista Pracowników Zgłaszających</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {reporters.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-4 border-b">Imię i Nazwisko</th>
                <th className="p-4 border-b">Stanowisko</th>
                <th className="p-4 border-b">Numer Telefonu</th>
                <th className="p-4 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {reporters.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">Brak pracowników w bazie.</td>
                </tr>
              ) : (
                reporters.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800 text-base">{r.name}</td>
                    <td className="p-4 text-gray-700">{r.position || '-'}</td>
                    <td className="p-4 font-mono text-gray-600">{r.phone}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(r)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-2 px-4 rounded transition-colors inline-flex items-center gap-2"
                        >
                          <i className="ph ph-pencil-simple"></i>
                          Edytuj
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id, r.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2 px-4 rounded transition-colors inline-flex items-center gap-2"
                          title="Usuń pracownika"
                        >
                          <i className="ph ph-trash"></i>
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\reports\KPIReportPanel.jsx
=========================================

```javascript
import React, { useState } from 'react';
import { generateKPIReportPDF } from '../../../utils/reports/pdfKPIReport';
import { safeParseDate } from '../../../utils/dateHelpers';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function KPIReportPanel({ machines }) {
  const [reportPeriod, setReportPeriod] = useState('30'); // '30', '90', 'all'
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // Pobieranie wszystkich danych na żądanie (w tym zamkniętych awarii)
      const ticketsSnap = await getDocs(collection(db, 'tickets'));
      const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
      
      const plannedSnap = await getDocs(collection(db, 'planned_services'));
      const plannedServices = plannedSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.isDeleted);

      const now = new Date();
      let filteredTickets = tickets;
      let filteredServices = plannedServices;
      let title = 'Wszystkie dane historyczne';

      if (reportPeriod !== 'all') {
        const days = parseInt(reportPeriod, 10);
        const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        filteredTickets = tickets.filter(t => {
          const d = safeParseDate(t.closedAt || t.createdAt);
          return d && d >= pastDate;
        });
        
        filteredServices = plannedServices.filter(s => {
          const d = safeParseDate(s.completedAt || s.createdAt);
          return d && d >= pastDate;
        });

        title = `Ostatnie ${days} dni`;
      }

      await generateKPIReportPDF(filteredTickets, filteredServices, machines, title);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas generowania raportu PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i className="ph ph-file-pdf text-red-600 text-2xl"></i>
          Raport KPI (PDF)
        </h2>
        <p className="text-sm text-gray-500 max-w-2xl mt-1">
          Wizualny raport podsumowujący statystyki, MTTR (Średni czas naprawy), czasy reakcji i statusy serwisów dla zarządu.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Okres:</label>
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="border-gray-300 rounded-md text-sm shadow-sm focus:border-red-500 focus:ring-red-500 bg-gray-50 p-1.5"
          >
            <option value="30">Ostatnie 30 dni</option>
            <option value="90">Ostatnie 90 dni</option>
            <option value="all">Od początku (Wszystko)</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
        >
          {loading ? (
            <>
              <i className="ph ph-spinner animate-spin text-lg"></i> Pobieranie z bazy...
            </>
          ) : (
            <>
              <i className="ph ph-download-simple text-lg"></i> Generuj PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Reports.jsx
=========================================

```javascript
import React, { useState, useEffect } from 'react';
import { generateAuditorReport } from '../../utils/reports/auditorExport';
import KPIReportPanel from './reports/KPIReportPanel';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Reports({ tickets, plannedServices, machines }) {
  const [loading, setLoading] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleGenerateAuditorReport = async () => {
    setLoading(true);
    try {
      await generateAuditorReport();
    } catch (err) {
      alert('Błąd podczas generowania raportu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveWarningDays = async (val) => {
    try {
      await setDoc(doc(db, "settings", "general"), {
        plannedWarningDays: parseInt(val, 10)
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Raportowanie oraz Ustawienia</h2>
          <p className="text-gray-500 mt-2">Dostęp do zaawansowanych raportów operacyjnych, zrzutów bazy danych oraz ustawień.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Panel PDF */}
        <KPIReportPanel machines={machines} />

        {/* Raport Audytorski */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="ph ph-file-xls text-blue-600 text-2xl"></i>
              Pełny Raport Audytorski (Baza Danych)
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">
              Kompletny zrzut awarii, serwisów i maszyn (wraz z usuniętymi obiektami). Idealny dla audytorów ISO, na wypadek kontroli wewnętrznej lub do analizy w Excelu.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAuditorReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
            >
              {loading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-lg"></i> Generowanie...
                </>
              ) : (
                <>
                  <i className="ph ph-download-simple text-lg"></i> Pobierz XLSX
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Ostrzeżenia Serwisu Planowanego (przeniesione z Ustawień) */}
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <i className="ph ph-warning-circle text-amber-600 text-2xl"></i>
              Ostrzeżenia Serwisu Planowanego
            </h2>
            <p className="text-sm text-amber-800 max-w-2xl mt-1">
              Pinezki na mapie będą podświetlone na żółto, gdy zbliża się termin przeglądu. Ustaw z jakim wyprzedzeniem system ma zacząć ostrzegać.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-sm">
            <input 
              type="number" 
              value={plannedWarningDays}
              onChange={(e) => {
                setPlannedWarningDays(e.target.value);
                saveWarningDays(e.target.value);
              }}
              min="1"
              max="365"
              className="w-20 font-bold text-amber-900 border-b-2 border-amber-300 focus:outline-none focus:border-amber-600 bg-transparent text-center"
            />
            <span className="text-amber-700 font-bold text-sm">Dni wcześniej</span>
          </div>
        </div>

      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Roles.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  
  // Lista wszystkich dostępnych zakładek (uprawnień) podzielona na moduły
  const availablePermissionsGrouped = [
    {
      module: 'Awarie UR',
      permissions: [
        { id: 'dashboard_tickets', label: 'Mapa Stoczni' },
        { id: 'edit_map', label: 'Edycja Mapy' },
        { id: 'tickets', label: 'Zgłoszenia Awarii' },
        { id: 'archive', label: 'Archiwum Awarii' },
        { id: 'kpi', label: 'Analiza' }
      ]
    },
    {
      module: 'Serwis UR',
      permissions: [
        { id: 'dashboard_planned', label: 'Mapa Serwisów' },
        { id: 'planned_maintenance', label: 'Planowane Serwisy' },
        { id: 'archive_planned', label: 'Archiwum Serwisów' },
        { id: 'edit_planned', label: 'Edycja Serwisów Planowanych' },
        { id: 'delete_planned', label: 'Usuwanie Serwisów Planowanych' }
      ]
    },
    {
      module: 'Administracja',
      permissions: [
        { id: 'machines', label: 'Rejestr Maszyn' },
        { id: 'regions', label: 'Rejony' },
        { id: 'services', label: 'Podwykonawcy / Serwis' },
        { id: 'topics', label: 'Tematy Zgłoszeń' },
        { id: 'reporters', label: 'Zgłaszający' },
        { id: 'users', label: 'Użytkownicy' },
        { id: 'roles', label: 'Role i Uprawnienia' },
        { id: 'reports', label: 'Raportowanie' }
      ]
    }
  ];

  // Helper do płaskiej listy
  const allPermissionsFlat = availablePermissionsGrouped.flatMap(g => g.permissions);

  const [permissions, setPermissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });

  useEffect(() => {
    const unsubMod = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    const unsub = onSnapshot(collection(db, "roles"), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => { unsub(); unsubMod(); };
  }, []);

  const handleTogglePermission = (id) => {
    if (permissions.includes(id)) {
      setPermissions(permissions.filter(p => p !== id));
    } else {
      setPermissions([...permissions, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "roles", editingId), { name, permissions });
      } else {
        await addDoc(collection(db, "roles"), {
          name,
          permissions,
          createdAt: serverTimestamp()
        });
      }
      setName('');
      setPermissions([]);
      setEditingId(null);
        setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setPermissions(r.permissions || []);
    setEditingId(r.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć tę rolę? UWAGA: Użytkownicy z tą rolą stracą wszystkie dostępy!")) {
      await updateDoc(doc(db, "roles", id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Role i Uprawnienia</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj dostępem do różnych części aplikacji dla grup pracowników.</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setPermissions([]); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Rolę
        </button>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <i className="ph ph-shield-star text-blue-600"></i>
                  {editingId ? 'Edytuj Rolę' : 'Dodaj nową rolę i ustawienia'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa Roli <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Pracownik Serwisu Zewnętrznego"
              required
            />
          </div>

          <div className="mb-6 space-y-6">
            <label className="block text-sm font-bold text-gray-700">Dostęp do zakładek według modułów:</label>
            
            <div className="space-y-6">
              {availablePermissionsGrouped.filter(g => {
              if (g.module === 'Awarie UR' && !modSettings.enableTickets) return false;
              if (g.module === 'Serwis UR' && !modSettings.enablePlanned) return false;
              return true;
            }).map(group => (
                <div key={group.module} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{group.module}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.permissions.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={permissions.includes(p.id)}
                          onChange={() => handleTogglePermission(p.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              Uwaga: Zakładki &quot;Użytkownicy i Dostępy&quot;, &quot;Role i Uprawnienia&quot; oraz &quot;Ustawienia Systemu&quot; są zarezerwowane wyłącznie dla systemowego Administratora i nie można ich przydzielić do innych ról.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setPermissions([]); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm transition-colors min-w-[150px]"
                  >
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rolę')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Roli</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dostępne Zakładki</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{r.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {r.permissions?.map(p => {
                        const found = allPermissionsFlat.find(ap => ap.id === p);
                        return found ? (
                          <span key={p} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">
                            {found.label}
                          </span>
                        ) : null;
                      })}
                      {(!r.permissions || r.permissions.length === 0) && (
                        <span className="text-gray-400 text-sm italic">Brak dostępów</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(r)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                          <i className="ph ph-pencil-simple"></i> Edytuj
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                          <i className="ph ph-trash"></i> Usuń
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Brak zdefiniowanych ról. Utwórz pierwszą powyżej.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\ServiceCalendar.jsx
=========================================

```javascript
import React, { useState, useMemo } from 'react';
import { safeParseDate } from '../../utils/dateHelpers';

export default function ServiceCalendar({ services, machines, onSelectService }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMonths, setViewMonths] = useState(1); // 1 = 1 miesiąc, 3 = 3 miesiące

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - viewMonths, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + viewMonths, 1));
  };
  const today = () => {
    setCurrentDate(new Date());
  };

  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'Nieznana maszyna';

  // Generowanie kalendarza dla danego miesiąca
  const renderMonth = (monthOffset) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Niedziela
    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Przesunięcie na poniedziałek = 0

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

    return (
      <div key={monthOffset} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1 min-w-[300px]">
        <h3 className="text-lg font-bold text-gray-800 text-center mb-4">{monthNames[month]} {year}</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="p-2 border border-transparent"></div>;
            
            // Znajdź serwisy na ten dzień
            const dayServices = services.filter(s => {
              if (!s.nextDate) return false;
              const dDate = safeParseDate(s.nextDate);
              return dDate.getFullYear() === day.getFullYear() && 
                     dDate.getMonth() === day.getMonth() && 
                     dDate.getDate() === day.getDate() &&
                     s.status !== 'completed';
            });

            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div 
                key={idx} 
                className={`min-h-[80px] p-1 border rounded flex flex-col ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'} hover:bg-gray-100 transition-colors`}
              >
                <div className={`text-right text-xs font-bold ${isToday ? 'text-blue-600' : 'text-gray-500'} mb-1`}>
                  {day.getDate()}
                </div>
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
                  {dayServices.map(srv => (
                    <div 
                      key={srv.id} 
                      onClick={() => onSelectService && onSelectService(srv.id)}
                      className={`cursor-pointer text-[10px] leading-tight p-1 rounded font-medium border
                        ${srv.priority === 'Krytyczny' ? 'bg-red-100 text-red-800 border-red-200' : 
                          srv.priority === 'Wysoki' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                          'bg-blue-100 text-blue-800 border-blue-200'}`}
                      title={`${srv.name} - ${getMachineName(srv.machineId)}`}
                    >
                      <div className="font-bold truncate">{srv.name}</div>
                      <div className="truncate text-gray-600">{getMachineName(srv.machineId)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div className="flex gap-2">
          <button onClick={prevMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors">
            &larr; Poprzedni
          </button>
          <button onClick={today} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded transition-colors">
            Dzisiaj
          </button>
          <button onClick={nextMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors">
            Następny &rarr;
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMonths(1)}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMonths === 1 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            1 Miesiąc
          </button>
          <button 
            onClick={() => setViewMonths(3)}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMonths === 3 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            3 Miesiące
          </button>
        </div>
      </div>

      <div className={`flex flex-col xl:flex-row gap-6 items-start ${viewMonths === 3 ? 'overflow-x-auto pb-4' : ''}`}>
        {Array.from({ length: viewMonths }).map((_, i) => renderMonth(i))}
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Services.jsx
=========================================

```javascript
import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Services({ services }) {
  const [newService, setNewService] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').substring(0, 9);
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handlePhoneChange = (e) => {
    setContactPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), {
          name: newService.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim()
        });
      } else {
        await addDoc(collection(db, 'services'), { 
          name: newService.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim()
        });
      }
      setNewService('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisywania serwisu:", error);
    }
  };

  const handleEdit = (s) => {
    setNewService(s.name);
    setContactName(s.contactName || '');
    setContactEmail(s.contactEmail || '');
    setContactPhone(s.contactPhone || '');
    setEditingId(s.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć dział "${name}" z bazy danych?\n(Historia powiązanych z nim napraw pozostanie nienaruszona)`)) {
      try {
        await updateDoc(doc(db, 'services', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      } catch (error) {
        console.error('Błąd usuwania serwisu:', error);
        alert('Nie udało się usunąć serwisu.');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Podwykonawcy / Serwis</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj dostępnymi jednostkami, do których można przypisać awarię</p>
        </div>
        <button onClick={() => { setEditingId(null); setNewService(''); setContactName(''); setContactEmail(''); setContactPhone(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Serwis
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800">
                {editingId ? 'Edytuj Serwis / Podwykonawcę' : 'Dodaj Serwis / Podwykonawcę'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <input 
              type="text" 
              placeholder="Nazwa działu (np. Elektrycy)" 
              value={newService} 
              onChange={e => setNewService(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
              required 
            />
            <input 
              type="text" 
              placeholder="Osoba kontaktowa (Opcjonalnie)" 
              value={contactName} 
              onChange={e => setContactName(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="email" 
              placeholder="Adres e-mail (Opcjonalnie)" 
              value={contactEmail} 
              onChange={e => setContactEmail(e.target.value)} 
              className="p-3 border rounded outline-none focus:border-blue-900" 
            />
            <input 
              type="tel" 
              placeholder="Telefon (np. 123 456 789)" 
              value={contactPhone} 
              onChange={handlePhoneChange} 
              pattern="^(\d{3}\s?){3}$"
              title="Wymagane 9 cyfr"
              className="p-3 border rounded outline-none focus:border-blue-900" 
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setNewService('');
                  setContactName('');
                  setContactEmail('');
                  setContactPhone('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
              >
                Anuluj
              </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors min-w-[120px]">
              {editingId ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
          Dostępne jednostki przypisania
        </div>
        <ul className="divide-y divide-gray-100">
          {services.map(s => (
            <li key={s.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <i className="ph ph-wrench"></i>
                </div>
                <span className="font-bold text-gray-800">{s.name}</span>
              </div>
              <div className="text-sm text-gray-600 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.contactName && <div><i className="ph ph-user mr-1 text-gray-400"></i> {s.contactName}</div>}
                {s.contactPhone && <div><i className="ph ph-phone mr-1 text-gray-400"></i> {s.contactPhone}</div>}
                {s.contactEmail && <div><i className="ph ph-envelope-simple mr-1 text-gray-400"></i> {s.contactEmail}</div>}
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => handleEdit(s)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                    <i className="ph ph-pencil-simple"></i> Edytuj
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                    <i className="ph ph-trash"></i> Usuń
                  </button>
                </div>
            </li>
          ))}
          {services.length === 0 && (
            <li className="p-4 text-gray-500 text-center">Brak zdefiniowanych serwisów.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\Settings.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Settings() {
  const [archiveDelayDays, setArchiveDelayDays] = useState(14);
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [enableTickets, setEnableTickets] = useState(true);
  const [enablePlanned, setEnablePlanned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  // Branding states
  const [companyName, setCompanyName] = useState('CRIST S.A.');
  const [systemSubtitle, setSystemSubtitle] = useState('MAINT SYSTEM PORTAL');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsubBranding = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.companyName) setCompanyName(data.companyName);
        if (data.systemSubtitle) setSystemSubtitle(data.systemSubtitle);
        if (data.companyLogoUrl) setCompanyLogoUrl(data.companyLogoUrl);
        if (data.appLogoUrl) setAppLogoUrl(data.appLogoUrl);
      }
    });
    return () => unsubBranding();
  }, []);

  
  const [dragActive, setDragActive] = useState({ app: false, company: false });

  const handleDragEnter = (e, type) => { e.preventDefault(); e.stopPropagation(); setDragActive(prev => ({...prev, [type]: true})); };
  const handleDragLeave = (e, type) => { e.preventDefault(); e.stopPropagation(); setDragActive(prev => ({...prev, [type]: false})); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({...prev, [type]: false}));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], type);
    }
  };

    const compressImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 200; // logo proportions usually wider
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.9));
        };
        img.onerror = () => resolve(null);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file, type) => {
    if (!file) return;
    setUploadingLogo(type);
    
    // Generuj Base64 od razu (aby PDF miał szybki dostęp)
    const base64Data = await compressImageToBase64(file);

    const storageRef = ref(storage, 'branding/' + type + '_' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error", error);
        alert("Błąd wgrywania: " + error.message);
        setUploadingLogo(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (type === 'app') setAppLogoUrl(downloadURL);
        if (type === 'company') setCompanyLogoUrl(downloadURL);
        
        // Auto Zapis do bazy
        await setDoc(doc(db, "settings", "branding"), {
          [type === 'app' ? 'appLogoUrl' : 'companyLogoUrl']: downloadURL,
          [type === 'app' ? 'appLogoBase64' : 'companyLogoBase64']: base64Data || ''
        }, { merge: true });

        setUploadingLogo(false);
        setUploadProgress(0);
      }
    );
  };

  const deleteLogo = async (type) => {
    if (type === 'app') setAppLogoUrl('');
    if (type === 'company') setCompanyLogoUrl('');
    await setDoc(doc(db, "settings", "branding"), {
      [type === 'app' ? 'appLogoUrl' : 'companyLogoUrl']: '',
      [type === 'app' ? 'appLogoBase64' : 'companyLogoBase64']: ''
    }, { merge: true });
  };



  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.archiveDelayDays !== undefined) {
          setArchiveDelayDays(data.archiveDelayDays);
        }
        if (data.allowTicketDeletion !== undefined) {
          setAllowTicketDeletion(data.allowTicketDeletion);
        }
        if (data.enableTickets !== undefined) setEnableTickets(data.enableTickets);
        if (data.enablePlanned !== undefined) setEnablePlanned(data.enablePlanned);
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, "settings", "general"), {
        archiveDelayDays: parseInt(archiveDelayDays, 10),
        allowTicketDeletion: false,
        enableTickets: enableTickets,
        enablePlanned: enablePlanned
      }, { merge: true });
      // Zapis nazwy firmy i podtytułu
      await setDoc(doc(db, "settings", "branding"), {
        companyName: companyName,
        systemSubtitle: systemSubtitle
      }, { merge: true });

      setSuccessMsg('Ustawienia zostały zapisane!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Błąd zapisu ustawień:", error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Ustawienia Systemu</h2>
          <p className="text-sm text-gray-500 mt-1">Konfiguracja globalnych parametrów aplikacji.</p>
        </div>
      </div>

      <div className="p-6">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center gap-2">
            <i className="ph ph-check-circle text-xl"></i>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">


          




          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 mb-2">Aktywne Moduły Firmy</h3>
            <p className="text-sm text-blue-800 mb-4">
              Wybierz, które moduły są włączone dla tej instalacji (firmy). Odznaczenie modułu ukryje go na ekranie głównym i zablokuje możliwość nadawania do niego uprawnień innym pracownikom.
            </p>
            
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-blue-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={enableTickets} onChange={e => setEnableTickets(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                <div>
                  <span className="block font-bold text-gray-800">Moduł Zgłoszeń i Awarii (Awarie UR)</span>
                  <span className="text-sm text-gray-500">Zarządzanie biletami, skanowanie kodów awarii, MTTR.</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-blue-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={enablePlanned} onChange={e => setEnablePlanned(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                <div>
                  <span className="block font-bold text-gray-800">Moduł Serwisów Planowanych (Serwis UR)</span>
                  <span className="text-sm text-gray-500">Przeglądy okresowe, harmonogramy z cyklami zliczania RBG i Dni.</span>
                </div>
              </label>
            </div>
          </div>


          </div>

        {/* Sekcja Branding */}
        <div className="mt-8 border-t border-gray-200 pt-8 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i className="ph ph-paint-brush text-blue-600"></i> Personalizacja i Branding
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nazwa Firmy (Klienta)</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. CRIST S.A."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Podtytuł Systemu</label>
                <input 
                  type="text" 
                  value={systemSubtitle}
                  onChange={e => setSystemSubtitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. MAINT SYSTEM PORTAL"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo Aplikacji (Lewy górny róg)</label>
                <div className="flex items-center gap-4">
                  {appLogoUrl && (
                    <div className="relative">
                      <img src={appLogoUrl} alt="App Logo" className="h-12 object-contain bg-slate-100 rounded border border-slate-200 p-1" />
                      <button 
                        type="button"
                        onClick={() => deleteLogo('app')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                        title="Usuń logo"
                      >
                        <i className="ph ph-x text-[10px] font-bold"></i>
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={"relative flex-1 w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + 
                      (dragActive.app ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50')
                    }
                    onDragEnter={(e) => handleDragEnter(e, 'app')}
                    onDragLeave={(e) => handleDragLeave(e, 'app')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'app')}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'app')}
                      disabled={uploadingLogo !== false}
                      className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploadingLogo === 'app' ? (
                      <span className="text-blue-600 font-bold">Wgrywanie... {Math.round(uploadProgress)}%</span>
                    ) : (
                      <span className={"text-sm font-bold " + (dragActive.app ? 'text-amber-600' : 'text-gray-500')}>
                        {dragActive.app ? 'Upuść tutaj!' : 'Wybierz lub przeciągnij plik'}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo Firmy Docelowej</label>
                <div className="flex items-center gap-4">
                  {companyLogoUrl && (
                    <div className="relative">
                      <img src={companyLogoUrl} alt="Company Logo" className="h-12 object-contain bg-slate-100 rounded border border-slate-200 p-1" />
                      <button 
                        type="button"
                        onClick={() => deleteLogo('company')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                        title="Usuń logo"
                      >
                        <i className="ph ph-x text-[10px] font-bold"></i>
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={"relative flex-1 w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + 
                      (dragActive.company ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50')
                    }
                    onDragEnter={(e) => handleDragEnter(e, 'company')}
                    onDragLeave={(e) => handleDragLeave(e, 'company')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'company')}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'company')}
                      disabled={uploadingLogo !== false}
                      className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploadingLogo === 'company' ? (
                      <span className="text-blue-600 font-bold">Wgrywanie... {Math.round(uploadProgress)}%</span>
                    ) : (
                      <span className={"text-sm font-bold " + (dragActive.company ? 'text-amber-600' : 'text-gray-500')}>
                        {dragActive.company ? 'Upuść tutaj!' : 'Wybierz lub przeciągnij plik'}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i className="ph ph-floppy-disk text-xl"></i>
            {loading ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
          </button>
        </form>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\TicketDetails.jsx
=========================================

```javascript
import React from 'react';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';
import Toast from './Toast';

export default function TicketDetails({

  currentTicket,
  setSelectedTicketId,
  user,
  services,
  handleUpdate,
  handleDeleteTicket,
  handleArchiveTicket,
  comment,
  setComment,
  selectedService,
  setSelectedService,
  etr,
  setEtr,
  loading,
  allowTicketDeletion,
  toastConfig,
  setToastConfig,
  confirmModalConfig,
  setConfirmModalConfig,
  STATUSES,
  isArchive
}) {
  const [lightboxImg, setLightboxImg] = React.useState(null);
  const [uploadedPhotos, setUploadedPhotos] = React.useState([]);
  const [uploadProgress, setUploadProgress] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  
  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  // Czas pracy
  const duration = currentTicket.closedAt && currentTicket.startedAt ? 
    ((new Date(currentTicket.closedAt) - new Date(currentTicket.startedAt))/1000/3600).toFixed(1) : 
    (currentTicket.status === 5 ? '0.0' : '-');

    return (
      <div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#111827]">
        
        <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig({ message: '', type: 'success' })} />
      
        <ConfirmModal 
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={closeConfirmModal}
        />

        {/* Górny pasek nawigacyjny z przyciskiem powrotu */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <div className="flex gap-4">
            <button onClick={() => setSelectedTicketId(null)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all">
              <i className="ph ph-arrow-left text-lg"></i> Powrót do rejestru
            </button>
            <button onClick={() => import('../../utils/reports/pdfTicketCard').then(m => m.generateTicketPDF(currentTicket))} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all">
              <i className="ph ph-file-pdf text-xl text-red-600"></i> Karta PDF
            </button>
          </div>
        </div>

        <div className="p-4 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* LEWA KOLUMNA */}
            <div className="w-full lg:w-2/3 space-y-5">
              
              {/* Główna sekcja danych (Tytuł i szczegóły) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  {/* Statusy i Tagi */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="font-bold text-gray-400 mr-2 text-lg">T{currentTicket.id?.slice(0, 4).toUpperCase() || "1"}</span>
                    <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider ${STATUSES[currentTicket.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {STATUSES[currentTicket.status]?.label || 'Nieznany'}
                    </span>
                    {currentTicket.isCritical && (
                      <span className="bg-red-600 animate-pulse text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                        POSTÓJ MASZYNY
                      </span>
                    )}
                  </div>
                  
                  {/* Tytuł */}
                  <h2 className="text-3xl font-extrabold text-[#111827] mb-8">{currentTicket.topic}</h2>
                  
                  {/* Podział na DANE OBIEKTU i INFORMACJE ZGŁOSZENIA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 border-t border-gray-100 pt-8">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">DANE OBIEKTU</h3>
                      <div className="font-bold text-[#111827] text-lg mb-1">{currentTicket.machineName}</div>
                      <div className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                        <i className="ph ph-map-pin"></i> {currentTicket.regionName || 'Brak Rejonu'} {currentTicket.bay ? ` / ${currentTicket.bay}` : ''}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">ID: {currentTicket.machineId}</div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">INFORMACJE ZGŁOSZENIA</h3>
                      <div className="font-bold text-[#111827] flex items-center gap-2 mb-1">
                        <i className="ph ph-user text-gray-400"></i> {currentTicket.reportedBy}
                      </div>
                      {currentTicket.reporterDeviceId && (
                          <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-xs bg-gray-100 p-2 rounded w-fit">
                            <i className="ph ph-device-mobile text-gray-500"></i> ID Urządzenia: #{currentTicket.reporterDeviceId}
                          </div>
                        )}
                        {currentTicket.reporterPhone && (
                        <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-sm">
                          <i className="ph ph-phone text-gray-400"></i> {currentTicket.reporterPhone}
                        </div>
                      )}
                      <div className="text-gray-500 text-sm mb-1">
                        Priorytet: <span className={currentTicket.isCritical ? "text-red-600 font-bold" : ""}>{currentTicket.isCritical ? "Wysoki" : "Standardowy"}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        Zgłoszono: {safeParseDate(currentTicket.createdAt)?.toLocaleString('pl-PL') || 'Brak daty'}
                      </div>
                      
                    </div>
                  </div>

                  {/* OPIS AWARII */}
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">OPIS AWARII</h3>
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
                    {currentTicket.description}
                  </div>
                  
                  {currentTicket.photos && currentTicket.photos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Załączone zdjęcia</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentTicket.photos.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt="załącznik" 
                            className="w-24 h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => setLightboxImg(url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL DYSPOZYTORA (Akcje) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#111827] text-white p-4 px-6 flex items-center gap-3">
                  <i className="ph ph-faders text-xl"></i>
                  <h3 className="font-bold text-sm tracking-widest uppercase">
                    {user?.role === 'kierownik' ? 'PANEL KIEROWNIKA - KOMENTARZE' : 'DZIAŁ TECHNICZNY - KROKI REALIZACJI'}
                  </h3>
                </div>
                
                <div className="p-4 md:p-5 space-y-6 bg-gray-50/50">
                  
                  {/* NOWY LAYOUT - STEPPER (4 KROKI) */}
                  <div className="mt-2">
                    {[
                      { id: 1, label: 'Przyjęcie zgłoszenia' },
                        { id: 2, label: 'Wybór wykonawcy' },
                        { id: 3, label: 'Rozpoczęcie naprawy' },
                        { id: 4, label: 'Naprawa w trakcie' },
                        { id: 5, label: 'Zakończenie naprawy' }
                    ].map(step => {
                      const currentStatus = Number(currentTicket.status === 'new' ? 1 : currentTicket.status === 'closed' ? 5 : currentTicket.status);
                      const currentStepNum = currentStatus;
                      const isActive = step.id === currentStepNum;
                      const isPast = step.id < currentStepNum;

                      return (
                        <div key={step.id} className="relative flex items-start group min-h-[80px]">
                          {/* Liniowa łączówka */}
                          {step.id !== 5 && (
                            <div className="absolute left-4 top-10 bottom-[-10px] w-0.5 bg-gray-200 z-0"></div>
                          )}
                          
                          {/* Kółko z numerem */}
                          <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm mt-1 mr-4 transition-all ${isActive ? 'bg-[#111827] border-[#111827] text-white shadow-md' : isPast ? 'bg-white border-green-500 text-green-500' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {isPast ? <i className="ph ph-check font-bold"></i> : step.id}
                          </div>
                          
                          {/* Karta z treścią */}
                          <div className={`flex-1 mb-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#f4f1eb] p-4 shadow-sm border border-[#e8e4db]' : 'p-3'}`}>
                            <h4 className={`text-lg transition-colors ${isActive ? 'font-extrabold text-gray-900' : isPast ? 'font-bold text-gray-500' : 'font-medium text-gray-400'}`}>
                              {step.label}
                            </h4>
                            
                            {isActive && (
                              <div className="mt-5 space-y-5 animate-fade-in">
                                
                                {/* Specyficzna akcja dla kroku */}
                                {user?.role !== 'kierownik' && (
                                  <div className="space-y-4">
                                    {step.id === 1 && (
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Weryfikacja zgłoszenia", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all">
                                          Przyjęcie zgłoszenia (Rozpocznij weryfikację)
                                        </button>
                                        {user?.role === 'admin' && (
                                          <button 
                                            disabled={loading} 
                                            onClick={() => {
                                              setConfirmModalConfig({
                                                isOpen: true,
                                                title: 'Zamknąć bez naprawy?',
                                                message: 'Czy na pewno chcesz zamknąć zgłoszenie bez wykonywania prac?',
                                                confirmText: 'Tak, zamknij',
                                                onConfirm: async () => {
                                                  closeConfirmModal();
                                                  handleUpdate(currentTicket.id, 5, "Zamknięto bez naprawy (Admin)", etr);
                                                }
                                              });
                                            }}
                                            className="bg-white border border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-amber-900 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                            title="Tylko dla Administratora: Szybkie zamknięcie"
                                          >
                                            <i className="ph ph-crown text-amber-600 text-lg"></i>
                                            Zamknij od razu (brak awarii)
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {step.id === 2 && (
                                      <div className="bg-white border border-[#e8e4db] rounded-xl p-5 shadow-sm space-y-4">
                                        <label className="block text-sm font-bold text-gray-800">Wybierz jednostkę wykonawczą (Serwis/Utrzymanie Ruchu)</label>
                                        <select 
                                          value={selectedService}
                                          onChange={(e) => setSelectedService(e.target.value)}
                                          className="w-full p-3.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none text-gray-800 transition-colors"
                                        >
                                          <option value="">-- Kto się tym zajmie? --</option>
                                          {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                        <button disabled={loading || !selectedService} onClick={() => handleUpdate(currentTicket.id, 3, "Przekazano do: " + selectedService, etr)} className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all mt-2">
                                          Zatwierdź Wykonawcę i Przejdź Dalej
                                        </button>
                                      </div>
                                    )}

                                    {step.id === 3 && (
                                        <>
                                          {currentStatus === 3 && (
                                            <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Rozpoczęto realizację (Naprawa w trakcie)", etr)} className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all">
                                              Rozpocznij Naprawę
                                            </button>
                                          )}
                                        </>
                                      )}
                                      
                                      {step.id === 4 && (
                                        <>
                                          {currentStatus === 4 && (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 5, "Zakończono naprawę", etr)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all">
                                                Zakończ Naprawę
                                              </button>
                                              <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 2, "Cofnięto do wyboru wykonawcy", etr)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all">
                                                Zmień wykonawcę (Cofnij)
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}

                                    {step.id === 5 && !isArchive && (
                                        <button disabled={loading} onClick={() => handleUpdate(currentTicket.id, 4, "Wznowiono prace (awaria powróciła)", etr)} className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-700 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all mt-4">
                                          Otwórz ponownie to zgłoszenie (Awaria powróciła)
                                        </button>
                                      )}
                                  </div>
                                )}

                                {/* Admin Actions for closed/archived */}
                                {user?.role === 'admin' && step.id === 5 && (
                                  <div className="space-y-3 pt-3 border-t border-[#e8e4db]">
                                    {!isArchive && (
                                      <button 
                                        disabled={loading} 
                                        onClick={() => handleArchiveTicket(currentTicket.id)}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                      >
                                        <i className="ph ph-archive text-lg"></i>
                                        Przenieś do Archiwum
                                      </button>
                                    )}
                                    {allowTicketDeletion && (
                                      <button 
                                        disabled={loading} 
                                        onClick={() => handleDeleteTicket(currentTicket.id)}
                                        className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-700 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                      >
                                        <i className="ph ph-trash text-lg"></i>
                                        Usuń trwale z bazy
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Pole Komentarza i Zdjęć wewnątrz aktywnego kroku */}
                                {!isArchive && (
                                  <div className="pt-5 mt-5 border-t border-[#e8e4db] flex flex-col gap-4">
                                    <div className="w-full">
                                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        {user?.role === 'kierownik' ? 'TWÓJ KOMENTARZ' : 'NOTATKA / WYNIK KROKU (WIDOCZNE W HISTORII)'}
                                      </label>
                                      <textarea 
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none bg-white text-gray-800 shadow-sm transition-all" rows="3"
                                        placeholder="Opcjonalnie dodaj szczegóły..."
                                      ></textarea>
                                      
                                      <div className="mt-3 space-y-3">
                                        <div className="flex gap-2">
                                          <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm">
                                            <i className="ph ph-image text-lg text-slate-500"></i> Dodaj zdjęcie
                                            <input 
                                              type="file" 
                                              multiple 
                                              accept="image/*"
                                              className="hidden"
                                              onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                if (!files.length) return;
                                                setUploadProgress('Trwa wysyłanie...');
                                                setIsUploading(true);
                                                setUploadError(null);
                                                let newUrls = [];
                                                try {
                                                  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                  const { storage } = await import('../../firebase');
                                                  const { compressImage } = await import('../../utils/imageCompressor');
                                                  for (let i = 0; i < files.length; i++) {
                                                    const file = files[i];
                                                    const compressedFile = await compressImage(file, 2);
                                                    const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                                    const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                                    const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
                                                    const url = await Promise.race([uploadPromise, timeoutPromise]);
                                                    newUrls.push(url);
                                                  }
                                                  setUploadedPhotos(prev => [...(prev || []), ...newUrls]);
                                                } catch (err) {
                                                  setUploadError(err.message);
                                                } finally {
                                                  setUploadProgress('');
                                                  setIsUploading(false);
                                                }
                                              }}
                                            />
                                          </label>
                                          <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm sm:hidden">
                                            <i className="ph ph-camera text-lg text-slate-500"></i> Aparat
                                            <input 
                                              type="file" 
                                              multiple 
                                              accept="image/*"
                                              capture="environment"
                                              className="hidden"
                                              // onChange handled same as above, react merges it visually
                                              onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                if (!files.length) return;
                                                setUploadProgress('Trwa wysyłanie...');
                                                setIsUploading(true);
                                                setUploadError(null);
                                                let newUrls = [];
                                                try {
                                                  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                  const { storage } = await import('../../firebase');
                                                  const { compressImage } = await import('../../utils/imageCompressor');
                                                  for (let i = 0; i < files.length; i++) {
                                                    const file = files[i];
                                                    const compressedFile = await compressImage(file, 2);
                                                    const fileName = Date.now() + '_' + compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                                    const fileRef = ref(storage, `tickets/${currentTicket.id}/${fileName}`);
                                                    const uploadPromise = uploadBytes(fileRef, compressedFile).then(() => getDownloadURL(fileRef));
                                                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
                                                    const url = await Promise.race([uploadPromise, timeoutPromise]);
                                                    newUrls.push(url);
                                                  }
                                                  setUploadedPhotos(prev => [...(prev || []), ...newUrls]);
                                                } catch (err) {
                                                  setUploadError(err.message);
                                                } finally {
                                                  setUploadProgress('');
                                                  setIsUploading(false);
                                                }
                                              }}
                                            />
                                          </label>
                                        </div>
                                        
                                        {uploadError && <div className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-3 rounded-lg border border-red-200">BŁĄD: {uploadError}</div>}
                                        {uploadedPhotos && uploadedPhotos.length > 0 && (
                                          <div className="flex gap-2 overflow-x-auto py-2">
                                            {uploadedPhotos.map((url, i) => (
                                              <img key={i} src={url} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-pointer shadow-sm" onClick={() => setLightboxImg(url)} />
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <button 
                                        disabled={loading || isUploading || (!comment.trim() && (!uploadedPhotos || uploadedPhotos.length === 0))} 
                                        onClick={() => {
                                          handleUpdate(currentTicket.id, null, user?.role === 'kierownik' ? "Komentarz kierownika" : "Dodano notatkę", currentTicket.etr, uploadedPhotos, comment);
                                          setUploadedPhotos([]);
                                          setComment('');
                                        }} 
                                        className="mt-4 w-full text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                      >
                                        {uploadProgress ? (
                                          <><i className="ph ph-spinner animate-spin text-lg"></i> {uploadProgress}</>
                                        ) : (
                                          <><i className="ph ph-paper-plane-tilt text-lg"></i> Dodaj sam komentarz/zdjęcie (bez zmiany kroku)</>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PRAWA KOLUMNA (Historia Zdarzeń) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h4 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
                </h4>
                
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-5 pb-4">
                  {Array.isArray(currentTicket.history) && [...currentTicket.history].reverse().map((entry, index) => (
                    <div key={index} className="relative pl-8">
                      {/* Punkt na osi */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#111827]"></div>
                      
                      {/* Treść */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-[#111827] text-sm">{entry.user || 'System'}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {safeParseDate(entry.date)?.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Brak daty'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{entry.action}</div>
                      {entry.note && (
                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 italic">
                          &quot;{entry.note}&quot;
                        </div>
                      )}
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {entry.photos.map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt="załącznik" 
                              className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              onClick={() => setLightboxImg(url)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img 
            src={lightboxImg} 
            alt="Powiększenie" 
            className="max-w-full max-h-full object-contain cursor-zoom-out"
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
            onClick={() => setLightboxImg(null)}
          >
            &times;
          </button>
        </div>
      )}
      </div>
    );
}
```


=========================================
📄 PLIK: src\components\manager\Tickets.jsx
=========================================

```javascript
import { exportToExcel } from '../../utils/reports/excelExport';
import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, arrayUnion, collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import TicketDetails from './TicketDetails';

export default function Tickets({ tickets, machines = [], user, services, isArchive, initialTicketId, onClearTicketId, initialSearchQuery, allowTicketDeletion }) {
  const handleExportExcel = () => {
    const dataToExport = filteredTickets.map(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      return {
        'ID Zgłoszenia': t.id,
        'Data Zgłoszenia': openD ? openD.toLocaleString('pl-PL') : '-',
        'Data Zamknięcia': closeD ? closeD.toLocaleString('pl-PL') : '-',
        'Maszyna': t.machineName || (machines && machines.find(m => m.id === t.machineId)?.name) || '-',
        'Temat Zgłoszenia': t.topic || '-',
        'Opis Problemu': t.description || '-',
        'Zgłaszający': t.reportedBy || '-',
        'Status': (t.status === 1 ? 'Otwarte' : t.status === 2 ? 'Weryfikacja' : t.status === 3 ? 'Oczekujące' : t.status === 4 ? 'W trakcie' : t.status === 5 ? 'Zakończone' : 'Nieznany')
      };
    });
    exportToExcel(dataToExport, isArchive ? 'Archiwum_Awarii' : 'Zgloszenia_Awarii');
  };

  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);

  const [internalArchive, setInternalArchive] = useState([]);
  const [lastArchiveDoc, setLastArchiveDoc] = useState(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);

  useEffect(() => {
    if (isArchive) {
      fetchArchive(false);
    }
  }, [isArchive]);

  const fetchArchive = async (loadMore = false) => {
    if (loadingArchive || (!hasMoreArchive && loadMore)) return;
    setLoadingArchive(true);
    try {
      let q = query(
        collection(db, 'tickets'),
        where('status', '==', 5),
        orderBy('closedAt', 'desc'),
        limit(50)
      );
      if (loadMore && lastArchiveDoc) {
        q = query(
          collection(db, 'tickets'),
          where('status', '==', 5),
          orderBy('closedAt', 'desc'),
          startAfter(lastArchiveDoc),
          limit(50)
        );
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const newTickets = docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.isDeleted);
      
      if (loadMore) {
        setInternalArchive(prev => {
          const combined = [...prev, ...newTickets];
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
      } else {
        setInternalArchive(newTickets);
      }
      
      setLastArchiveDoc(docs[docs.length - 1] || null);
      setHasMoreArchive(docs.length === 50);
    } catch (err) {
      console.error("Błąd pobierania archiwum:", err);
    }
    setLoadingArchive(false);
  };

  const activeTicketsArray = isArchive ? internalArchive : tickets;

  const [comment, setComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);

  const [etr, setEtr] = useState('');
  const [filterMachine, setFilterMachine] = useState(initialSearchQuery || '');
  const [filterStatus, setFilterStatus] = useState('');

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const [confirmModalConfig, setConfirmModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    confirmText: 'Tak'
  });

  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  // Domyślne kolumny tabeli
  const DEFAULT_COLS = {
    date: true,
    region: true,
    machine: true,
    bay: true,
    topic: true,
    reporter: true,
    status: true,
    service: true,
    duration: true,
  };

  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('ticket_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLS;
    } catch (e) {
      return DEFAULT_COLS;
    }
  });

  const toggleColumn = (key) => {
    setVisibleCols(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ticket_columns', JSON.stringify(updated));
      return updated;
    });
  };



  const handleDeleteTicket = (ticketId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Usunąć zgłoszenie?',
      message: 'Czy na pewno chcesz BEZPOWROTNIE USUNĄĆ to zgłoszenie z bazy?',
      confirmText: 'Tak, usuń',
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          await updateDoc(doc(db, 'tickets', ticketId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
          setSelectedTicketId(null);
          showToast('Zgłoszenie zostało trwale usunięte.');
        } catch (err) {
          console.error("Błąd usuwania zgłoszenia:", err);
          showToast("Nie udało się usunąć zgłoszenia: " + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  const handleArchiveTicket = (ticketId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Zarchiwizować zgłoszenie?',
      message: 'Czy na pewno chcesz przenieść to zgłoszenie do Archiwum?',
      confirmText: 'Tak, archiwizuj',
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          const currentData = activeTicketsArray.find(t => t.id === ticketId);
          await updateDoc(doc(db, 'tickets', ticketId), {
            isManuallyArchived: true, status: 5,
            closedAt: currentData?.closedAt || new Date().toISOString(),
            completedBy: currentData?.completedBy || user.name,
            history: arrayUnion({
              date: new Date().toISOString(),
              user: user.name,
              action: "Przeniesiono do Archiwum",
              note: "Zamknięto i przeniesiono ręcznie",
              photos: []
            })
          });
          setSelectedTicketId(null);
          showToast('Zgłoszenie pomyślnie zarchiwizowane.');
        } catch (err) {
          console.error("Błąd archiwizacji zgłoszenia:", err);
          showToast("Nie udało się zarchiwizować zgłoszenia: " + err.message, 'error');
        }
        setLoading(false);
      }
    });
  };

  // Nasłuchiwanie na zmiany globalnego filtru z mapy
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setFilterMachine(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Handle external selection
  useEffect(() => {
    if (initialTicketId) {
      setSelectedTicketId(initialTicketId);
      if (onClearTicketId) onClearTicketId(); // clear it so it doesn't get stuck
    }
  }, [initialTicketId, onClearTicketId]);

  const STATUSES = {
    1: { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
    'new': { label: 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200' },
    2: { label: 'Weryfikacja UT', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    3: { label: 'Oczek. na naprawę', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    4: { label: 'Naprawa w trakcie', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    5: { label: 'Zakończone', color: 'bg-green-100 text-green-800 border-green-200' }
  };

  // safeParseDate is now imported globally
  const calculateDuration = (createdAt, closedAt) => {
    const start = safeParseDate(createdAt);
    const end = safeParseDate(closedAt) || new Date();
    if (!start) return 'Brak danych';
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / 1440);
    const hours = Math.floor((diffMins % 1440) / 60);
    const mins = diffMins % 60;

    let res = [];
    if (days > 0) res.push(`${days}d`);
    if (hours > 0) res.push(`${hours}g`);
    res.push(`${mins}m`);
    return res.join(' ');
  };

  // Bezpieczna aktualizacja (zmieniona z transakcji na updateDoc dla wsparcia offline)
  const handleUpdate = async (ticketId, newStatus, actionText, newEtr = null, photoUrls = [], noteText = '') => {
    setLoading(true);
    const ticketRef = doc(db, 'tickets', ticketId);

    try {
      const currentData = activeTicketsArray.find(t => t.id === ticketId);
      if (!currentData) {
        throw new Error("Zgłoszenie nie istnieje w aktualnym widoku!");
      }
      
      const updateData = {
        history: arrayUnion({
          date: new Date().toISOString(),
          user: user.name,
          action: actionText,
          note: noteText || comment || '',
          photos: photoUrls
        })
      };

      if (photoUrls.length > 0) {
        // Appends new photos to the global ticket photos array (if it exists)
        // Since arrayUnion needs the spread operator for multiple items
        updateData.photos = arrayUnion(...photoUrls);
      }

      if (newEtr !== null && newEtr !== undefined) {
        updateData.etr = newEtr;
      }

      if (newStatus !== null) {
        updateData.status = newStatus;
        if (newStatus === 5) {
          updateData.closedAt = serverTimestamp();
          updateData.completedBy = user.name;
        } else if (newStatus !== 5 && isArchive) {
          updateData.closedAt = null;
        }
      }

      if (selectedService !== '') {
        updateData.assignedTo = selectedService;
      } else if (selectedService === '' && currentData.assignedTo) {
        // Jeśli wyczyszczono serwis
        updateData.assignedTo = currentData.assignedTo;
      }

      // Wykonanie zapisu asynchronicznie (bez blokowania)
      updateDoc(ticketRef, updateData).then(() => {
        showToast('Zgłoszenie zostało zaktualizowane.');
      }).catch(error => {
        console.error("Błąd aktualizacji w tle:", error);
        showToast('Błąd aktualizacji: ' + error.message, 'error');
      });

      // Zamiast zamykać, zostajemy w widoku (selectedTicketId pozostaje)
      setComment('');
      setLoading(false); // Odblokowujemy interfejs natychmiast
    } catch (error) {
      console.error("Błąd aktualizacji zgłoszenia:", error);
      showToast('Nie udało się zapisać zmian. Błąd: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const currentTicket = selectedTicketId ? activeTicketsArray.find(t => t.id === selectedTicketId) : null;

  // Pełny widok szczegółów zgłoszenia

  if (selectedTicketId && currentTicket) {
    return (
      <TicketDetails
        currentTicket={currentTicket}
        setSelectedTicketId={setSelectedTicketId}
        user={user}
        services={services}
        handleUpdate={handleUpdate}
        handleDeleteTicket={handleDeleteTicket}
        handleArchiveTicket={handleArchiveTicket}
        comment={comment}
        setComment={setComment}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        etr={etr}
        setEtr={setEtr}
        loading={loading}
        allowTicketDeletion={allowTicketDeletion}
        toastConfig={toastConfig}
        setToastConfig={setToastConfig}
        confirmModalConfig={confirmModalConfig}
        setConfirmModalConfig={setConfirmModalConfig}
        STATUSES={STATUSES}
        isArchive={isArchive}
      />
    );
  }

  // Sortowanie i filtrowanie
  const sortedTickets = [...activeTicketsArray].sort((a, b) => {
    const isAClosed = a.status === 5;
    const isBClosed = b.status === 5;
    if (isAClosed && !isBClosed) return 1;
    if (!isAClosed && isBClosed) return -1;

    const timeA = safeParseDate(a.createdAt)?.getTime() || 0;
    const timeB = safeParseDate(b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const filteredTickets = sortedTickets.filter(t => {
    const searchStr = filterMachine.toLowerCase();
    const matchMachine = (t.machineName?.toLowerCase() || '').includes(searchStr) || 
                         (t.department?.toLowerCase() || '').includes(searchStr) ||
                         (t.regionName?.toLowerCase() || '').includes(searchStr);
    const matchStatus = filterStatus ? String(t.status) === filterStatus : true;
    return matchMachine && matchStatus;
  });

  // Obliczenia statystyk dla Dashboardu
  const activeTickets = tickets.filter(t => t.status !== 5);
  const criticalTickets = activeTickets.filter(t => t.isCritical);
  const completedToday = tickets.filter(t => {
    if (t.status !== 5 || !t.closedAt) return false;
    const closedDate = safeParseDate(t.closedAt) || new Date(0);
    const today = new Date();
    return closedDate.toDateString() === today.toDateString();
  });

  // Jeśli brak wybranego zgłoszenia, pokaż widok tabelaryczny
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Statystyki Dashboard (tylko w widoku głównym) */}
      {!isArchive && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-6">
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-warning-circle"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{activeTickets.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktywne</div>
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-siren"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{criticalTickets.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Krytyczne</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-check-circle"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{completedToday.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Zakończone</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <i className="ph ph-engine"></i>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{machines.length}</div>
              <div className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maszyn</div>
            </div>
          </div>
        </div>
      )}

      {/* Pasek filtrów i opcji */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Szukaj po maszynie, dziale lub zgłaszającym..." 
              value={filterMachine}
              onChange={e => setFilterMachine(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          {!isArchive && (
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[200px]"
            >
              <option value="">Wszystkie statusy</option>
              <option value="1">1 - Zgłoszone</option>
              <option value="2">2 - Weryfikacja UT</option>
              <option value="3">3 - Wybór wykonawcy</option>
              <option value="4">4 - W realizacji</option>
            </select>
          )}

          {/* Przycisk czyszczenia filtrów */}
          <button
            onClick={() => {
              setFilterMachine('');
              setFilterStatus('');
            }}
            disabled={!filterMachine && !filterStatus}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm rounded-lg border border-red-200 transition-colors whitespace-nowrap"
            title="Wyczyść wszystkie filtry wyszukiwania"
          >
            <i className="ph ph-funnel-x text-lg"></i>
            Wyczyść filtry
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors"
          >
            <i className="ph ph-file-xls text-lg"></i>
            Eksportuj (.xlsx)
          </button>
          {/* Przycisk Dostosuj Kolumny */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-gray-300 transition-colors"
            >
              <i className="ph ph-[#111827] ph-columns text-base"></i>
              Dostosuj kolumny
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in">
                <div className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span>Widoczne Kolumny</span>
                  <button onClick={() => setShowColumnPicker(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="ph ph-x text-sm"></i>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.date} onChange={() => toggleColumn('date')} className="rounded text-blue-600" />
                    Data zgłoszenia
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.region} onChange={() => toggleColumn('region')} className="rounded text-blue-600" />
                    Miejsce (Rejon)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.machine} onChange={() => toggleColumn('machine')} className="rounded text-blue-600" />
                    Maszyna
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.bay} onChange={() => toggleColumn('bay')} className="rounded text-blue-600" />
                    Przelot / Inf. dodatkowa
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.topic} onChange={() => toggleColumn('topic')} className="rounded text-blue-600" />
                    Temat zgłoszenia
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.reporter} onChange={() => toggleColumn('reporter')} className="rounded text-blue-600" />
                    Zgłaszający (Kto zgłosił)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.status} onChange={() => toggleColumn('status')} className="rounded text-blue-600" />
                    Status
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.service} onChange={() => toggleColumn('service')} className="rounded text-blue-600" />
                    Przypisany Serwis
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={visibleCols.duration} onChange={() => toggleColumn('duration')} className="rounded text-blue-600" />
                    Czas trwania
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm font-bold text-gray-500">
            Zgłoszeń: {filteredTickets.length}
          </div>
        </div>
      </div>

      {/* Tabela zgłoszeń */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
<tr>
<th className="px-6 py-4 w-12 text-center">Akcje</th>
                {visibleCols.date && <th className="px-6 py-4">Data zgłoszenia</th>}
                {visibleCols.region && <th className="px-6 py-4">Miejsce (Rejon)</th>}
                {visibleCols.machine && <th className="px-6 py-4">Maszyna</th>}
                {visibleCols.bay && <th className="px-6 py-4">Przelot/Inf.</th>}
                {visibleCols.topic && <th className="px-6 py-4">Temat</th>}
                {visibleCols.reporter && <th className="px-6 py-4">Zgłaszający</th>}
                {visibleCols.status && <th className="px-6 py-4">Status</th>}
                {visibleCols.service && <th className="px-6 py-4">Przypisany Serwis</th>}
                {visibleCols.duration && <th className="px-6 py-4">Czas trwania</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500 border-dashed border-2 border-gray-100 m-4">
                    Brak zgłoszeń spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">

                      <td className="px-6 py-4">
                        <button 
                          onClick={() => { setSelectedTicketId(ticket.id); setSelectedService(ticket.assignedTo || ''); setEtr(ticket.etr || ''); }}
                          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-1 group-hover:border-blue-300 group-hover:text-blue-600"
                        >
                          <i className="ph ph-caret-right"></i> Szczegóły
                        </button>
                      </td>
{visibleCols.date && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">
                          {safeParseDate(ticket.createdAt)?.toLocaleDateString('pl-PL') || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {safeParseDate(ticket.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '-'}
                        </div>
                      </td>
                    )}
                    
                    {visibleCols.region && (
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {ticket.regionName || '-'}
                      </td>
                    )}

                    {visibleCols.machine && (
                      <td className="px-6 py-4 font-bold text-[#111827]">
                        {ticket.machineName}
                      </td>
                    )}

                    {visibleCols.bay && (
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {ticket.bay || '-'}
                      </td>
                    )}

                    {visibleCols.topic && (
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 max-w-[150px] truncate" title={ticket.topic}>{ticket.topic}</div>
                        {ticket.isCritical && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
                            <i className="ph ph-siren"></i> KRYTYCZNE
                          </div>
                        )}
                      </td>
                    )}

                    {visibleCols.reporter && (
                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-gray-800">{ticket.reportedBy || 'Nieznany'}</div>
                        <div className="text-gray-500 font-mono">{ticket.reporterPhone || ''}</div>
                      </td>
                    )}

                    {visibleCols.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STATUSES[ticket.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {STATUSES[ticket.status]?.label || 'Nieznany'}
                        </span>
                      </td>
                    )}

                    {visibleCols.service && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-[120px] truncate" title={ticket.assignedTo || 'Brak'}>
                        {ticket.assignedTo ? ticket.assignedTo : <span className="text-gray-400 italic">Brak przypisania</span>}
                      </td>
                    )}

                    {visibleCols.duration && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 flex items-center gap-1 font-mono">
                          <i className="ph ph-clock text-gray-400"></i> {calculateDuration(ticket.createdAt, ticket.closedAt)}
                        </div>
                      </td>
                    )}

                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {isArchive && hasMoreArchive && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
            <button
              onClick={() => fetchArchive(true)}
              disabled={loadingArchive}
              className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded transition-colors disabled:opacity-50"
            >
              {loadingArchive ? 'Ładowanie...' : 'Załaduj więcej'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\manager\Toast.jsx
=========================================

```javascript
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${isError ? 'bg-red-600' : 'bg-slate-900'}`}>
        <i className={`ph ${isError ? 'ph-warning-circle text-red-200' : 'ph-check-circle text-emerald-400'} text-2xl`}></i>
        {message}
        <button onClick={onClose} className="ml-4 text-white/50 hover:text-white transition-colors">
          <i className="ph ph-x"></i>
        </button>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Topics.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'topics'), (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return alert('Podaj treść tematu');
    
    setLoading(true);
    try {
      if (editingId) {
        import('firebase/firestore').then(({ updateDoc }) => {
          updateDoc(doc(db, 'topics', editingId), { text: newTopic.trim() });
        });
      } else {
        const newTopicRef = doc(collection(db, 'topics'));
        setDoc(newTopicRef, {
          text: newTopic.trim(),
        }).catch(err => console.error(err));
      }
      setNewTopic('');
      setEditingId(null);
        setIsFormOpen(false);
    } catch (error) {
      console.error('Błąd dodawania tematu:', error);
      alert('Nie udało się dodać tematu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten temat z listy podpowiedzi?')) {
      await updateDoc(doc(db, 'topics', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
    }
  };

  const handleEdit = (t) => {
    setNewTopic(t.text);
    setEditingId(t.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dodajemy domyślne tematy, jeśli baza jest zupełnie pusta
  const handleSeedDefaults = async () => {
    const defaults = [
      "Awaria elektryczna / Brak zasilania",
      "Wyciek oleju / Awaria hydrauliki",
      "Problem z pneumatyką",
      "Uszkodzenie mechaniczne elementu",
      "Błąd sterownika / elektroniki",
      "Wymiana części eksploatacyjnych"
    ];
    for (const text of defaults) {
      const newDocRef = doc(collection(db, 'topics'));
      setDoc(newDocRef, { text }).catch(err => console.error(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tematy Zgłoszeń (Podpowiedzi)</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj szybkimi tematami awarii dla zgłaszających</p>
        </div>
        <button onClick={() => { setEditingId(null); setNewTopic(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Temat
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <i className="ph ph-chat-text text-blue-600"></i>
                {editingId ? 'Edytuj temat podpowiedzi' : 'Dodaj nowy temat do podpowiedzi'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Treść zgłoszenia (Temat)</label>
            <input 
              type="text" 
              value={newTopic} 
              onChange={e => setNewTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Przepalona żarówka"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setNewTopic(''); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz' : 'Dodaj temat')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Lista Zapisanych Tematów</h3>
          {topics.length === 0 && (
            <button onClick={handleSeedDefaults} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold hover:bg-blue-200 transition-colors">
              Wgraj domyślne tematy
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-100">
          {topics.length === 0 ? (
            <li className="p-8 text-center text-gray-500">Brak zapisanych tematów. Wgraj domyślne lub dodaj własny.</li>
          ) : (
            topics.map(t => (
              <li key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <span className="font-medium text-gray-800">{t.text}</span>
                <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(t)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                      <i className="ph ph-pencil-simple"></i> Edytuj
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                      <i className="ph ph-trash"></i> Usuń
                    </button>
                  </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\manager\Users.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '../../firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Inicjalizacja dodatkowej instancji Firebase Auth tylko do tworzenia kont,
// aby nie wylogowało aktualnie zalogowanego Managera
let secondaryApp;
const apps = getApps();
const existingApp = apps.find(app => app.name === 'SecondaryApp');
if (existingApp) {
  secondaryApp = existingApp;
} else {
  secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
}
const secondaryAuth = getAuth(secondaryApp);

export default function Users() {
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRolesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return alert('Podaj e-mail i imię z nazwiskiem');
    if (!editingId && !password.trim()) return alert('Podaj hasło dla nowego użytkownika');
    
    setLoading(true);
    try {
      if (editingId) {
        // Zmiana nazwy/roli istniejącego usera
        await updateDoc(doc(db, 'users', editingId), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          phone: phone
        });
        setEditingId(null);
        setIsFormOpen(false);
        setEmail('');
        setPassword('');
        setName('');
        setRole('admin');
        setPhone('');
      } else {
        // Tworzenie NOWEGO konta w bezpiecznym module Authentication
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), password.trim());
        const newUid = userCredential.user.uid;

        // Zapisanie roli i nazwy do bazy danych (BEZ HASŁA!)
        await setDoc(doc(db, 'users', newUid), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role,
          phone: phone
        });

        setEmail('');
        setPassword('');
        setName('');
        setRole('admin');
        setPhone('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Ten e-mail jest już zarejestrowany w systemie.');
      } else if (err.code === 'auth/weak-password') {
        alert('Hasło jest za słabe. Musi mieć co najmniej 6 znaków.');
      } else {
        alert('Nie udało się zapisać użytkownika: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć uprawnienia tego użytkownika? Uwaga: Usunie to jego dostęp, ale samo konto logowania (Firebase Auth) musi zostać usunięte w panelu Firebase.')) {
      await updateDoc(doc(db, 'users', id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
    }
  };

  const handleEdit = (u) => {
    setEmail(u.email);
    setPassword(''); // Hasła nie da się podejrzeć
    setName(u.name || '');
    setRole(u.role || 'admin');
    setPhone(u.phone || '');
    setEditingId(u.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Użytkownicy (Konta dostępowe)</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj autoryzowanymi użytkownikami systemu (logowanie, aplikacja)</p>
        </div>
        <button onClick={() => { setEditingId(null); setEmail(''); setPassword(''); setName(''); setRole('admin'); setPhone(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
          <i className="ph ph-plus text-lg"></i> Dodaj Użytkownika
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <i className="ph ph-shield-check text-blue-600"></i>
                {editingId ? 'Edytuj Użytkownika' : 'Zarejestruj nowego użytkownika'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <i className="ph ph-info text-blue-600 text-xl mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-blue-800 text-sm">System Bezpieczeństwa (Firebase Auth)</h4>
                  <p className="text-blue-700 text-xs mt-1">Hasła są szyfrowane. Tworząc pracownika, nadajesz mu dostęp do platformy.</p>
                </div>
              </div>
              <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. Jan Kowalski"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres e-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="np. jan@crist.pl"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer telefonu</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => {
                let val = e.target.value.replace(/[^\d]/g, '');
                if (val.length > 3) val = val.slice(0,3) + ' ' + val.slice(3);
                if (val.length > 7) val = val.slice(0,7) + ' ' + val.slice(7);
                if (val.length > 11) val = val.slice(0, 11);
                setPhone(val);
              }}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="xxx xxx xxx"
              pattern="\d{3} \d{3} \d{3}"
              title="Format: xxx xxx xxx"
              required
            />
          </div>
          {!editingId && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasło (min. 6 znaków)</label>
              <input 
                type="text" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. trudnehaslo123"
                required={!editingId}
              />
            </div>
          )}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Uprawnienia</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="admin">Pełny Administrator (Systemowa)</option>
              {rolesList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100 w-full">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setEmail('');
                      setPassword('');
                      setName('');
                      setRole('admin');
                      setPhone('');
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Autoryzowani użytkownicy</h3>
          <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded">
            Łącznie: {usersList.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Imię i Nazwisko</th>
                <th className="px-6 py-4">E-mail (Login)</th>
                <th className="px-6 py-4">Hasło</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rola</th>
                <th className="px-6 py-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Brak użytkowników. Dodaj pierwszego powyżej.
                  </td>
                </tr>
              ) : (
                usersList.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-gray-600">{u.phone || "-"}</td>
                    <td className="px-6 py-4 text-green-600 font-bold text-sm">
                      <i className="ph ph-shield-check mr-1"></i>
                      Zaszyfrowane
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 
                         rolesList.find(r => r.id === u.role)?.name || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                      >
                        <i className="ph ph-pencil-simple"></i>
                        Edytuj
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm"
                        title="Usuń"
                      >
                        <i className="ph ph-trash"></i>
                        Usuń
                      </button>
                    </div>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\ManagerView.jsx
=========================================

```javascript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Importy zakładek
import Dashboard from './manager/Dashboard';
import HomeDashboard from './manager/HomeDashboard';
import Tickets from './manager/Tickets';
import KPIDashboard from './manager/KPIDashboard';
import MapComponent from './manager/Map';

// Importy dla Master Data (konfiguracja)
import Machines from './manager/Machines';
import Regions from './manager/Regions';
import Roles from './manager/Roles';
import Users from './manager/Users';
import Settings from './manager/Settings';
import Reports from './manager/Reports';
import Services from './manager/Services';
import Topics from './manager/Topics';
import Reporters from './manager/Reporters';
import PlannedMaintenance from './manager/PlannedMaintenance';
import ActionItems from './manager/ActionItems';

export default function ManagerView({ user, onLogout, onSwitchView }) {
  const [currentModule, setCurrentModule] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('module') || 'home';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('module') || 'home';
    return params.get('tab') || (m === 'home' ? 'home' : (m === 'planned_maintenance' ? 'dashboard_planned' : (m === 'master_data' ? 'machines' : 'dashboard_tickets')));
  });

  const [globalTicketId, setGlobalTicketId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Obsługa przycisku "Wstecz" przeglądarki (Popstate)
  useEffect(() => {
    window.history.replaceState({ tab: activeTab, module: currentModule }, '', `?module=${currentModule}&tab=${activeTab}`);
    
    const handlePopState = (e) => {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module');
      const t = params.get('tab');
      if (mod) setCurrentModule(mod);
      if (t) setActiveTab(t);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.history.pushState({ tab: tabId, module: currentModule }, '', `?module=${currentModule}&tab=${tabId}`);
  };

  // Stany na dane z chmury
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [services, setServices] = useState([]);
  const [plannedServices, setPlannedServices] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  const [branding, setBranding] = useState({
    companyName: 'CRIST S.A.',
    systemSubtitle: 'DYSPOZYTORNIA UR',
    companyLogoUrl: '',
    appLogoUrl: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBranding(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsub();
  }, []);

  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  
  const [allowTicketDeletion, setAllowTicketDeletion] = useState(false);
  const [plannedWarningDays, setPlannedWarningDays] = useState(30);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const safeParseDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };
  
  // Stany dla powiadomień (dzwoneczek)
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Pobieranie danych z Firebase (Real-time)
  useEffect(() => {
    const qTickets = query(collection(db, 'tickets'), where('status', 'in', [1,2,3,4]));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPlanned = onSnapshot(collection(db, 'planned_services'), (snapshot) => {
      setPlannedServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Nasłuchiwanie powiadomień dla użytkownika
    const qNotifications = collection(db, 'notifications');
    const unsubNotifications = onSnapshot(qNotifications, async (snapshot) => {
      const now = new Date();
      const notifs = [];
      const docsToDelete = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const d = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
        if (!isNaN(d.getTime()) && (now - d) / (1000 * 60 * 60 * 24) > 7) {
          docsToDelete.push(docSnap.id);
        } else {
          notifs.push({ id: docSnap.id, ...data });
        }
      });

    const unsubActionItems = onSnapshot(collection(db, 'action_items'), (snapshot) => {
      setActionItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted));
    });
      
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
        return timeB - timeA;
      });
      notifs.sort((a,b) => {
  const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
  const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
  return tb - ta;
});
setNotifications(notifs);
      
      if (docsToDelete.length > 0) {
        try {
          const { writeBatch, doc } = await import('firebase/firestore');
          const batch = writeBatch(db);
          docsToDelete.forEach(id => {
            batch.delete(doc(db, 'notifications', id));
          });
          await batch.commit();
        } catch (e) {
          console.error('Błąd podczas usuwania starych powiadomień:', e);
        }
      }
    });

    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRegions = onSnapshot(collection(db, 'regions'), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(x => !x.isDeleted)); //(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.allowTicketDeletion !== undefined) {
          setAllowTicketDeletion(data.allowTicketDeletion);
        }
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDays(data.plannedWarningDays);
        }
      }
    });

    return () => {
      unsubTickets();
      unsubMachines();
      unsubServices();
      unsubPlanned();
      unsubNotifications();
      unsubRoles();
      unsubRegions();
      unsubSettings();
    };
  }, []);

  // Weryfikacja zbliżających się przeglądów (uruchamiana raz po pobraniu maszyn)
  useEffect(() => {
    if (machines.length > 0 && user.role !== 'operator') {
      import('../services/plannedServices.service').then(m => {
        const machinesMap = machines.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        m.checkAndTriggerDueServices(machinesMap);
      });
    }
  }, [machines.length]); // Tylko kiedy zmieni się ilośc maszyn lub po załadowaniu


  // Oznaczanie powiadomienia jako przeczytane
  const markAsRead = async (notifId) => {
    if (notifId && notifId.toString().startsWith('dyn_')) return;
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Błąd aktualizacji powiadomienia:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie widoczne powiadomienia?")) {
      try {
        import('firebase/firestore').then(async ({ writeBatch, doc }) => {
          const batch = writeBatch(db);
          relevantNotifications.forEach(n => {
            batch.delete(doc(db, 'notifications', n.id));
          });
          await batch.commit();
        });
      } catch (err) {
        console.error("Błąd usuwania", err);
      }
    }
  };

  const relevantNotifications = [];

  // Dynamiczne powiadomienia z nowo dodanych awarii (status 1)
  if (currentModule === 'tickets') {
    tickets.filter(t => t.status !== 5 && t.status !== '5').forEach(t => {
      relevantNotifications.push({
        id: 'dyn_ticket_' + t.id,
        title: t.isCritical ? "KRYTYCZNA AWARIA!" : "Nowe zgłoszenie awarii",
        message: 'Maszyna: ' + (t.machineName || 'Nieznana') + ' - ' + (t.topic || 'Inne'),
        isCritical: t.isCritical,
        read: false,
        ticketId: t.id,
        createdAt: { toDate: () => safeParseDate(t.createdAt) || new Date() },
        isDynamic: true
      });
    });
  }

  // Indywidualne powiadomienia dla przedawnionych serwisow
  if (currentModule === 'planned_maintenance') {
    const now = new Date();
    plannedServices.forEach(srv => {
      if (srv.status === 'completed' || srv.status === 'in_progress') return;
      
      let isOverdue = false;
      const machine = machines.find(m => m.id === srv.machineId);
      
      if (srv.nextDate) {
        const nDate = safeParseDate(srv.nextDate);
        if (nDate && nDate < now) isOverdue = true;
      }
      
      if (srv.targetWorkHours && machine) {
        if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
      }

      if (isOverdue) {
        relevantNotifications.push({
          id: 'dyn_srv_' + srv.id,
          title: "PRZEKROCZONY TERMIN SERWISU!",
          message: 'Maszyna: ' + (machine?.name || 'Nieznana') + ' - ' + srv.name,
          isCritical: true,
          read: false,
          linkTo: 'planned_maintenance',
          createdAt: { toDate: () => safeParseDate(srv.nextDate) || new Date() },
          isDynamic: true
        });
      }
    });

    // Zbiorcze powiadomienie dla tematow do realizacji
    let openActionItems = 0;
    actionItems.forEach(item => {
      if (item.status !== 'completed') {
        openActionItems++;
      }
    });

    if (openActionItems > 0) {
      relevantNotifications.push({
        id: 'dyn_action_grouped',
        title: "TEMATY DO REALIZACJI",
        message: 'Liczba tematow do realizacji: ' + openActionItems,
        isCritical: true,
        read: false,
        linkTo: 'action_items',
        createdAt: { toDate: () => new Date() },
        isDynamic: true
      });
    }
  }

  
  // Oryginalne powiadomienia (np. inne systemowe)
  notifications.forEach(n => {
    if (n.ticketId) return; // Mamy dynamiczne
    if (n.linkTo === 'planned_maintenance') return; // Mamy dynamiczne
    relevantNotifications.push(n);
  });

  // Sortowanie dynamicznych + bazowych
  relevantNotifications.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
    return (timeB || 0) - (timeA || 0);
  });

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  let workItems = [];
  if (currentModule === 'tickets') {
    workItems = [
      { id: 'dashboard_tickets', label: 'Mapa Stoczni', icon: 'ph-map-trifold' },
      { id: 'tickets', label: 'Zgłoszenia Awarii', icon: 'ph-warning-circle' },
      { id: 'archive', label: 'Archiwum Awarii', icon: 'ph-archive' },
      { id: 'kpi', label: 'Analiza', icon: 'ph-chart-line-up' }
    ];
  } else if (currentModule === 'planned_maintenance') {
    workItems = [
      { id: 'dashboard_planned', label: 'Mapa Serwisów', icon: 'ph-map-trifold' },
      { id: 'planned_maintenance', label: 'Serwis Planowany', icon: 'ph-calendar-check' },
      { id: 'action_items', label: 'Tematy do Realizacji', icon: 'ph-clipboard-text' },
      { id: 'archive_planned', label: 'Archiwum Serwisów', icon: 'ph-archive' }
    ];
  } else if (currentModule === 'master_data') {
    workItems = [
      { id: 'machines', label: 'Baza Maszyn', icon: 'ph-engine' },
      { id: 'regions', label: 'Rejony na stoczni', icon: 'ph-map-pin' },
      { id: 'services', label: 'Podwykonawcy / Serwis', icon: 'ph-wrench' },
      { id: 'topics', label: 'Tematy Zgłoszeń', icon: 'ph-text-aa' },
      { id: 'reporters', label: 'Zgłaszający', icon: 'ph-user-list' }
    ];
    if (user.role === 'admin') {
      workItems.push({ id: 'users', label: 'Użytkownicy', icon: 'ph-users' });
      workItems.push({ id: 'roles', label: 'Role i Uprawnienia', icon: 'ph-shield-check' });
      workItems.push({ id: 'reports', label: 'Raportowanie & Ustawienia', icon: 'ph-chart-bar' });
      workItems.push({ id: 'settings', label: 'Administrator Programu', icon: 'ph-gear' });
    }
  }

  const dataItems = [];

  let visibleWorkItems = workItems;
  let visibleDataItems = dataItems;

  if (user.role !== 'admin') {
    const userRoleDoc = roles.find(r => r.id === user.role);
    const perms = userRoleDoc?.permissions || [];
    const canEditPlanned = user.role === 'admin' || perms.includes('edit_planned');
    const canDeletePlanned = user.role === 'admin' || perms.includes('delete_planned');
    visibleWorkItems = workItems.filter(item => perms.includes(item.id));
    visibleDataItems = dataItems.filter(item => perms.includes(item.id));
  }

  // Zabezpieczenie przed niewłaściwą zakładką
  useEffect(() => {
    const validTabIds = [...visibleWorkItems, ...visibleDataItems].map(item => item.id);
    if (validTabIds.length > 0 && !validTabIds.includes(activeTab)) {
      setActiveTab(validTabIds[0]);
    }
  }, [currentModule, activeTab, visibleWorkItems, visibleDataItems]);

  
  const userRoleForPerms = roles.find(r => r.id === user.role);
  const allUserPerms = userRoleForPerms?.permissions || [];
  const canEditPlanned = user.role === 'admin' || allUserPerms.includes('edit_planned');
  const canDeletePlanned = user.role === 'admin' || allUserPerms.includes('delete_planned');

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Menu Boczne */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-0 -translate-x-full'} 
        md:translate-x-0 md:static fixed inset-y-0 left-0 z-50 bg-[#111827] text-gray-300 transition-all duration-300 ease-in-out flex flex-col no-print overflow-hidden border-r border-gray-800 shadow-xl`}
      >
        <div className="p-6 bg-[#0f172a] min-w-[288px] border-b border-gray-800">

          <div className="flex items-center gap-3">
            {branding.companyLogoUrl ? (
              <img src={branding.companyLogoUrl} alt="Company Logo" className="max-h-12 max-w-[48px] object-contain rounded-xl overflow-hidden bg-white p-0.5" />
            ) : (
              <i className="ph ph-buildings text-3xl text-white"></i>
            )}
            <div>
              <div className="font-extrabold text-xl tracking-wider text-white leading-none">{branding.companyName}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{branding.systemSubtitle}</div>
            </div>
          </div>

          <button className="md:hidden absolute top-6 right-6 text-gray-400" onClick={() => setIsSidebarOpen(false)}>
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>

        <nav className="flex-1 py-8 overflow-y-auto min-w-[288px]">
          {/* Sekcja BIEŻĄCA PRACA */}
          <div className="px-6 mb-3">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BIEŻĄCA PRACA</h3>
          </div>
          <ul className="mb-8 space-y-1 px-3">
            {visibleWorkItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    handleTabChange(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-[#1f2937] text-white shadow-sm' 
                      : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                  }`}
                >
                  <i className={`ph ${item.icon} text-lg`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {visibleDataItems.length > 0 && (
            <>
              <div className="px-6 mb-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BAZA DANYCH</h3>
              </div>
              <ul className="space-y-1 px-3">
                {visibleDataItems.map(item => (
                  <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setGlobalSearchQuery('');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-[#1f2937] text-white shadow-sm' 
                      : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                  }`}
                >
                  <i className={`ph ${item.icon} text-lg`}></i>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          </>
          )}
        </nav>

        <div className="p-6 bg-[#0f172a] min-w-[288px] border-t border-gray-800 space-y-2">
          <button 
            onClick={() => {
              // Wróć do portalu
              window.history.pushState({ module: '' }, '', window.location.pathname);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-3 rounded-lg transition-colors shadow-sm mb-2"
          >
            <i className="ph ph-squares-four text-xl"></i>
            Wróć do Panelu UR
          </button>
        </div>

        </aside>


      {/* Główna zawartość */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
            >
              <i className="ph ph-list text-2xl"></i>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">
              {workItems.find(m => m.id === activeTab)?.label || dataItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          {/* DZWONECZEK POWIADOMIEŃ */}
          {currentModule !== 'master_data' && (
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
              >
                <i className="ph ph-bell text-2xl"></i>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Rozwijane okno powiadomień */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                    <span className="font-bold text-sm">Powiadomienia systemowe</span>
                    <span className="text-xs bg-blue-900 px-2 py-0.5 rounded">{unreadCount} nowych</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {relevantNotifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">Brak powiadomień</div>
                    ) : (
                      relevantNotifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.ticketId) {
                                setGlobalTicketId(n.ticketId);
                                setIsNotificationsOpen(false);
                                setCurrentModule('tickets');
                                setActiveTab('tickets');
                                window.history.pushState({ module: 'tickets', tab: 'tickets' }, '', '?module=tickets&tab=tickets');
                              } else if (n.linkTo === 'planned_maintenance') {
                                setIsNotificationsOpen(false);
                                setCurrentModule('planned_maintenance');
                                setActiveTab('planned_maintenance');
                                window.history.pushState({ module: 'planned_maintenance', tab: 'planned_maintenance' }, '', '?module=planned_maintenance&tab=planned_maintenance');
                              } else if (n.linkTo === 'action_items') {
                                  setIsNotificationsOpen(false);
                                  setCurrentModule('planned_maintenance');
                                  setActiveTab('action_items');
                                  window.history.pushState({ module: 'planned_maintenance', tab: 'action_items' }, '', '?module=planned_maintenance&tab=action_items');
                                }
                          }}
                          className={`p-4 transition-colors cursor-pointer flex gap-3 items-start ${n.read ? 'bg-white opacity-60' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.isCritical ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <i className={`ph ${n.isCritical ? 'ph-siren' : 'ph-info'} text-lg`}></i>
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="font-bold text-gray-800 mb-0.5">{n.title}</div>
                            <div className="text-gray-600 leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {safeParseDate(n.createdAt)?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || 'Przed chwilą'}
                            </div>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                        </div>
                      ))
                    )}
                  </div>
                  
                </div>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          {activeTab === 'dashboard_tickets' && (
            <MapComponent 
              tickets={tickets} 
              plannedServices={[]}
              modeType="tickets"
              machines={machines} 
              regions={regions} 
              user={user} 
              onNavigateToTickets={(query) => {
                setGlobalSearchQuery(query);
                setActiveTab('tickets');
              }}
            />
          )}
          {activeTab === 'dashboard_planned' && (
            <MapComponent 
              tickets={[]} 
              plannedServices={plannedServices}
              modeType="planned_maintenance"
              machines={machines} 
              regions={regions} 
              user={user} 
              plannedWarningDays={plannedWarningDays}
              onNavigateToTickets={() => {
                setActiveTab('planned_maintenance');
              }}
            />
          )}
          {activeTab === 'home' && <HomeDashboard setActiveTab={setActiveTab} setCurrentModule={setCurrentModule} user={user} />}
          {activeTab === 'tickets' && <Tickets machines={machines} initialSearchQuery={globalSearchQuery} tickets={tickets} user={user} services={services} allowTicketDeletion={allowTicketDeletion} initialTicketId={globalTicketId} onClearTicketId={() => setGlobalTicketId(null)} />}
          {activeTab === 'archive' && <Tickets tickets={[]} user={user} services={services} allowTicketDeletion={allowTicketDeletion} isArchive={true} />}
          {activeTab === 'planned_maintenance' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={false} allowTicketDeletion={allowTicketDeletion} canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned} />}
          {activeTab === 'archive_planned' && <PlannedMaintenance machines={machines} regions={regions} user={user} plannedWarningDays={plannedWarningDays} isArchive={true} allowTicketDeletion={allowTicketDeletion} canEditPlanned={canEditPlanned} canDeletePlanned={canDeletePlanned} />}
          {activeTab === 'action_items' && <ActionItems machines={machines} user={user} />}
          {activeTab === 'kpi' && <KPIDashboard tickets={tickets} machines={machines} plannedServices={plannedServices} />}

          {/* Master Data */}
          {activeTab === 'machines' && <Machines tickets={tickets} plannedServices={plannedServices} />}
          {activeTab === 'regions' && <Regions />}
          {activeTab === 'services' && <Services services={services} />}
          {activeTab === 'topics' && <Topics />}
          {activeTab === 'reporters' && <Reporters />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'roles' && <Roles />}
          {activeTab === 'settings' && <Settings />}
            {activeTab === 'reports' && <Reports tickets={tickets} plannedServices={plannedServices} machines={machines} />}
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
```


=========================================
📄 PLIK: src\components\OfflineSyncManager.jsx
=========================================

```javascript
import { useEffect } from 'react';
import { getOfflinePhotos, removeOfflinePhoto } from '../utils/offlineStorage';
import { db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function OfflineSyncManager() {
  useEffect(() => {
    const syncPhotos = async () => {
      if (!navigator.onLine) return;
      
      try {
        const photos = await getOfflinePhotos();
        if (photos.length === 0) return;
        
        console.log(`Znaleziono ${photos.length} zdjęć w kolejce offline do synchronizacji.`);
        
        for (const photo of photos) {
          try {
            const fileName = Date.now() + '_' + photo.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileRef = ref(storage, `tickets/${photo.ticketId}/${fileName}`);
            
            await uploadString(fileRef, photo.base64Data, 'data_url');
            const url = await getDownloadURL(fileRef);
            
            const ticketRef = doc(db, 'tickets', photo.ticketId);
            await updateDoc(ticketRef, {
              photos: arrayUnion(url)
            });
            
            await removeOfflinePhoto(photo.id);
            console.log(`Zdjęcie dla awarii ${photo.ticketId} zostało zsynchronizowane.`);
          } catch (uploadErr) {
            console.error(`Błąd synchronizacji zdjęcia (Ticket ID: ${photo.ticketId}):`, uploadErr);
          }
        }
      } catch (err) {
        console.error("Błąd dostępu do kolejki zdjęć offline:", err);
      }
    };

    window.addEventListener('online', syncPhotos);
    
    // Próba synchronizacji przy każdym starcie aplikacji
    if (navigator.onLine) {
      syncPhotos();
    }

    return () => window.removeEventListener('online', syncPhotos);
  }, []);

  return null; // Komponent nie renderuje nic na ekranie, działa w tle
}

```


=========================================
📄 PLIK: src\components\OperatorForm.jsx
=========================================

```javascript
import React, { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp, getDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { savePhotoToIndexedDB } from '../utils/offlineStorage';
import { db, storage } from '../firebase';
import { compressImage } from '../utils/imageCompressor';

export default function OperatorForm({
  selectedMachine,
  setSelectedMachine,
  regions,
  initialMachineId,
  handleStepChange,
  isOnline,
  topicsList,
  reportersList,
  stopLiveScanner
}) {
  const [topicMode, setTopicMode] = useState('select'); // 'select' lub 'manual'
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterDeviceId] = useState(() => {
    let id = localStorage.getItem('device_id_token');
    if (!id) {
      id = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('device_id_token', id);
    }
    return id;
  });
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');

  
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (selectedMachine.id === 'manual' && (!selectedMachine.name || !selectedMachine.name.trim())) {
      return alert('Podaj nazwę maszyny!');
    }
    if (!topic || !description || !reporterName.trim() || !reporterPhone.trim()) {
      return alert('Wypełnij wszystkie wymagane pola (Imię, Telefon, Temat, Opis)!');
    }
    const cleanedPhone = reporterPhone.replace(/\D/g, '');
    if (cleanedPhone.length !== 9) {
      return alert('Numer telefonu musi składać się z dokładnie 9 cyfr.');
    }
    
    if (!isOnline) {
      alert('Jesteś offline. Zgłoszenie zostanie zapisane lokalnie i wysłane automatycznie po odzyskaniu połączenia z siecią.');
    }

    // 1. Zabezpieczenie przed duplikowaniem (2 godziny)
    if (selectedMachine.id !== 'manual') {
      try {
        const q = query(collection(db, 'tickets'), where('machineId', '==', selectedMachine.id));
        const snap = await getDocs(q);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        let foundDuplicate = null;
        snap.forEach(doc => {
          const t = doc.data();
          const d = new Date(t.createdAt);
          const st = Number(t.status);
          if (d > twoHoursAgo && st !== 5) foundDuplicate = d;
        });
        
        if (foundDuplicate) {
          const proceed = window.confirm(`UWAGA: Awaria dla tej maszyny została już zgłoszona dzisiaj o godzinie ${foundDuplicate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.\n\nCzy na pewno chcesz wysłać KOLEJNE zgłoszenie dla tego samego urządzenia?`);
          if (!proceed) return;
        }
      } catch (err) {
        console.error('Błąd weryfikacji duplikatów:', err);
      }
    }

    setLoading(true);
    setErrorMsg(null);

    // 2. Dodawanie Zgłaszającego do bazy
    const reporterNameTrimmed = reporterName.trim();
    if (reporterNameTrimmed) {
      try {
        const repQ = query(collection(db, 'reporters'), where('name', '==', reporterNameTrimmed));
        const repSnap = await getDocs(repQ);
        if (repSnap.empty) {
          await addDoc(collection(db, 'reporters'), {
            name: reporterNameTrimmed,
            phone: reporterPhone.trim(),
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Błąd zapisywania zgłaszającego:", e);
      }
    }

    try {
      let finalMachineId = selectedMachine.id;
      
      
        if (finalMachineId === 'manual') {
          // Użytkownik dodał "Inną" maszynę
          // Zgodnie z prośbą, dodajemy ją do bazy, by w przyszłości mogła zostać edytowana przez admina.
          const newMachineRef = await addDoc(collection(db, 'machines'), {
            name: selectedMachine.name + ' (DO WERYFIKACJI)',
            regionId: selectedMachine.regionId || '',
            bay: selectedMachine.bay || '',
            currentWorkHours: 0,
            status: 'active',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            createdBy: reporterName.trim() || 'Operator',
            description: 'Maszyna dodana z poziomu zgłoszenia awarii. Wymaga uzupełnienia danych i wygenerowania QR.'
          });
          finalMachineId = newMachineRef.id;
        }


      
      const ticketRef = doc(collection(db, 'tickets'));
      const regionObj = regions.find(r => r.id === selectedMachine.regionId);
      let uploadedUrls = [];
      let saveToOfflineQueue = false;

      // 3. Wgrywamy zdjęcia NAJPIERW (jeśli online)
      if (pendingPhotos.length > 0) {
        if (navigator.onLine) {
          try {
            for (const p of pendingPhotos) {
              const fileName = Date.now() + '_' + p.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileRef = ref(storage, `tickets/${ticketRef.id}/${fileName}`);
              await uploadString(fileRef, p.base64, 'data_url');
              const url = await getDownloadURL(fileRef);
              uploadedUrls.push(url);
            }
          } catch (uploadErr) {
            console.error("Błąd wgrywania zdjęć online, przechodzę w tryb offline:", uploadErr);
            saveToOfflineQueue = true;
          }
        } else {
          saveToOfflineQueue = true;
        }
      }

      // 4. Tworzymy zgłoszenie ATOMOWO (z linkami do zdjęć od razu)
      const ticketPayload = {
        machineId: finalMachineId,
        machineName: selectedMachine.name,
        bay: selectedMachine.bay || '',
        regionId: selectedMachine.regionId || '',
        regionName: regionObj ? regionObj.name : '',
        topic,
        description,
        isCritical,
        reportedBy: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        reporterDevice: navigator.userAgent,
        reporterDeviceId: reporterDeviceId,
        status: 1,
        createdAt: new Date().toISOString(),
        photos: uploadedUrls, // Gotowe linki, zero potrzeby updateDoc dla niezalogowanych (w trybie online)
        updates: [{
          timestamp: new Date().toISOString(),
          status: 1,
          comment: 'Zgłoszenie awarii w systemie.',
          author: reporterName.trim()
        }]
      };

      await setDoc(ticketRef, ticketPayload);

      // 5. Tryb offline dla zdjęć (jeśli nie udało się wgrać online)
      if (saveToOfflineQueue && pendingPhotos.length > 0) {
        for (const p of pendingPhotos) {
          await savePhotoToIndexedDB(ticketRef.id, p.base64, p.name);
        }
      }


      // Zapis powiadomienia w tle
      const newNotifRef = doc(collection(db, "notifications"));
      setDoc(newNotifRef, {
        title: isCritical ? "KRYTYCZNA AWARIA!" : "Nowe zgłoszenie awarii",
        message: `Maszyna: ${selectedMachine.name} - ${topic}`,
        isCritical: isCritical,
        read: false,
        ticketId: ticketRef.id,
        createdAt: serverTimestamp()
      }).catch(err => console.error("Błąd powiadomienia w tle:", err));
      
      setTopicMode('select');
      
      // Zapisujemy w tle, jeśli offline Firebase zadba o to
      handleStepChange('success');
    } catch (error) {
      console.error("Szczegóły błędu Firebase:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm font-bold flex items-center gap-3">
          <i className="ph ph-warning-circle text-2xl"></i>
          {errorMsg}
        </div>
      )}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Karta szczegółów wybranej maszyny */}
            <div className="bg-blue-50/70 p-5 border-b border-blue-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full sm:mr-4">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded">Zgłoszenie dla maszyny</span>
                  {selectedMachine.id === 'manual' ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={selectedMachine.name || ''} 
                        onChange={(e) => setSelectedMachine({...selectedMachine, name: e.target.value})} 
                        className="w-full p-2 border border-blue-300 rounded font-bold text-lg focus:outline-none focus:border-blue-900 bg-white" 
                        placeholder="Wpisz nazwę maszyny..." 
                        autoFocus
                      />
                      <select
                        value={selectedMachine.regionId || ''}
                        onChange={(e) => setSelectedMachine({...selectedMachine, regionId: e.target.value})}
                        className="w-full p-2 border border-blue-300 rounded font-medium text-sm text-slate-700 focus:outline-none focus:border-blue-900 bg-white"
                      >
                        <option value="" disabled>-- Wybierz rejon (opcjonalnie) --</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="font-black text-xl text-slate-800 break-words mt-1">{selectedMachine.name}</div>
                  )}
                </div>
                {!initialMachineId && (
                  <button 
                    onClick={() => {
                      stopLiveScanner();
                      setSelectedMachine(null);
                      handleStepChange('scan');
                    }} 
                    className="mb-6 flex items-center gap-2 text-white hover:text-white font-bold text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <i className="ph ph-arrow-left text-lg"></i> Cofnij i skanuj ponownie
                  </button>
                )}
              </div>

              {selectedMachine.id !== 'manual' && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Rejon / Numer Hali:</span>
                    <div className="font-bold text-slate-800">
                      {regions.find(r => r.id === selectedMachine.regionId)?.name || 'Nieokreślono'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Przelot / Dodatkowe:</span>
                    <div className="font-bold text-slate-800">
                      {selectedMachine.bay || 'Brak'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isOnline && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 mb-0 rounded-r shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="ph ph-wifi-slash text-yellow-500 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-bold">
                      Brak połączenia z siecią (Offline)
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Możesz bezpiecznie wypełnić i wysłać formularz. Zgłoszenie zostanie zapisane w pamięci urządzenia i zsynchronizowane automatycznie, gdy tylko odzyskasz zasięg.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 pb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Imię i Nazwisko Zgłaszającego <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="reporters-list"
                    value={reporterName}
                    onChange={e => {
                      const val = e.target.value;
                      setReporterName(val);
                      const found = reportersList.find(r => r.name.toLowerCase() === val.toLowerCase());
                      if (found) {
                        setReporterPhone(found.phone);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. Jan Kowalski"
                    required
                  />
                  <datalist id="reporters-list">
                    {reportersList.map(r => (
                      <option key={r.id} value={r.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Numer Telefonu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      let formatted = val;
                      if (val.length > 3 && val.length <= 6) {
                        formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
                      } else if (val.length > 6) {
                        formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
                      }
                      setReporterPhone(formatted);
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. 500 600 700"
                    pattern="[0-9]{3} [0-9]{3} [0-9]{3}"
                    minLength={11}
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Co się stało? (Temat)</label>
                {topicMode === 'select' ? (
                  <select
                    value={topicsList.includes(topic) ? topic : ''}
                    onChange={(e) => {
                      if (e.target.value === 'manual') {
                        setTopicMode('manual');
                        setTopic('');
                      } else {
                        setTopic(e.target.value);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none bg-white text-gray-800"
                    required
                  >
                    <option value="" disabled>Wybierz z podpowiedzi...</option>
                    
                      <option value="manual" className="font-bold text-blue-900">+ Wpisz własny temat...</option>
                    {topicsList.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)} 
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
                      placeholder="Wpisz własny temat..."
                      required 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setTopicMode('select');
                        setTopic('');
                      }}
                      className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                      title="Wróć do listy"
                    >
                      <i className="ph ph-x text-lg"></i>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis problemu</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded h-32 resize-none focus:ring-2 focus:ring-blue-900 outline-none" required></textarea>
              </div>
              <label className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded cursor-pointer transition-colors hover:bg-red-100">
                <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                <span className="text-red-900 font-medium">Maszyna jest całkowicie unieruchomiona (Krytyczne)</span>
              </label>
              {/* Zdjęcia */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ph ph-camera text-blue-900 text-lg"></i>
                  Załącz zdjęcia (opcjonalnie)
                </h3>
                <div className="space-y-3">
                  
                  {uploadProgress && <div className="text-sm font-bold text-blue-600 mb-2">{uploadProgress}</div>}
                  <div className="flex gap-2">
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-image text-xl"></i> Galeria
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          
                            const files = Array.from(e.target.files);
                            if (!files.length) return;
                            setUploadProgress('Przetwarzanie zdjęć...');
                            setLoading(true);
                            try {
                              let newPhotos = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const compressedFile = await compressImage(file, 2);
                                const base64 = await fileToBase64(compressedFile);
                                const preview = URL.createObjectURL(compressedFile);
                                newPhotos.push({ file: compressedFile, base64, preview, name: compressedFile.name });
                              }
                              setPendingPhotos(prev => [...prev, ...newPhotos]);
                            } catch (err) {
                              console.error(err);
                              alert("Błąd przetwarzania: " + err.message);
                            }
                            setUploadProgress('');
                            setLoading(false);

                        }}
                      />
                    </label>
                    <label className="flex-1 text-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 py-3 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <i className="ph ph-camera text-xl"></i> Aparat
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          
                            const files = Array.from(e.target.files);
                            if (!files.length) return;
                            setUploadProgress('Przetwarzanie zdjęć...');
                            setLoading(true);
                            try {
                              let newPhotos = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const compressedFile = await compressImage(file, 2);
                                const base64 = await fileToBase64(compressedFile);
                                const preview = URL.createObjectURL(compressedFile);
                                newPhotos.push({ file: compressedFile, base64, preview, name: compressedFile.name });
                              }
                              setPendingPhotos(prev => [...prev, ...newPhotos]);
                            } catch (err) {
                              console.error(err);
                              alert("Błąd przetwarzania: " + err.message);
                            }
                            setUploadProgress('');
                            setLoading(false);

                        }}
                      />
                    </label>
                  </div>
                  {pendingPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {pendingPhotos.map((p, i) => (
                        <div key={i} className="relative w-20 h-20 shrink-0 border border-gray-300 rounded overflow-hidden">
                          <img src={p.preview} alt="preview" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full font-bold py-4 rounded text-lg transition-colors flex items-center justify-center gap-2 ${
                  loading ? 'bg-blue-400 text-white cursor-not-allowed' : 
                  !isOnline ? 'bg-orange-500 hover:bg-orange-600 text-white' : 
                  'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {loading ? (
                  uploadProgress ? uploadProgress : <><i className="ph ph-spinner animate-spin text-2xl"></i> Zapisywanie...</>
                ) : !isOnline ? (
                  <><i className="ph ph-wifi-slash text-xl"></i> Oczekuję na zasięg...</>
                ) : (
                  <><i className="ph ph-paper-plane-tilt text-xl"></i> Wyślij zgłoszenie</>
                )}
              </button>
            </form>
          </div>
    </div>
  );
}

```


=========================================
📄 PLIK: src\components\OperatorView.jsx
=========================================

```javascript
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import OperatorForm from './OperatorForm';

export default function OperatorView({ user, onLogout, initialMachineId, onSwitchView }) {
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [reportersList, setReportersList] = useState([]);
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('step') || 'scan';
  }); // 'scan', 'form', 'success'
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Do debuggowania na telefonie

  // Obsługa przycisku Wstecz (Popstate)
  useEffect(() => {
    window.history.replaceState({ step: step }, '', `?module=operator&step=${step}`);
    const handlePopState = (e) => {
      if (e.state && e.state.step) {
        setStep(e.state.step);
      }
    };
    window.addEventListener('popstate', handlePopState);
return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStepChange = (newStep) => {
    setStep(newStep);
    window.history.pushState({ step: newStep }, '', `?module=operator&step=${newStep}`);
  };
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const html5QrcodeRef = useRef(null);

  // Status sieci
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    try {
      unsubscribeMachines = onSnapshot(collection(db, "machines"), async (querySnapshot) => {
        const machinesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => !m.isDeleted);
        setMachines(machinesData);

        if (initialMachineId && step === 'scan') {
          const targetMachine = machinesData.find(m => m.id === initialMachineId);
          if (targetMachine) {
            setSelectedMachine(targetMachine);
            handleStepChange('form');
          } else {
            const docRef = doc(db, "machines", initialMachineId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setSelectedMachine({ id: docSnap.id, ...docSnap.data() });
              handleStepChange('form');
            }
          }
        }
      }, (error) => console.error("SNAPSHOT ERROR FOR machines:", error));

      unsubscribeTopics = onSnapshot(collection(db, "topics"), (querySnapshot) => {
        setTopicsList(querySnapshot.docs.map(d => d.data()).filter(d => !d.isDeleted).map(d => d.text));
      }, (error) => console.error("SNAPSHOT ERROR FOR topics:", error));

      unsubscribeReporters = onSnapshot(collection(db, "reporters"), (querySnapshot) => {
        setReportersList(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR reporters:", error));

      unsubscribeRegions = onSnapshot(collection(db, "regions"), (querySnapshot) => {
        setRegions(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.isDeleted));
      }, (error) => console.error("SNAPSHOT ERROR FOR regions:", error));
    } catch (error) {
      console.error("Błąd inicjalizacji:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    }
    return () => {
      unsubscribeMachines();
      unsubscribeTopics();
      unsubscribeReporters();
      unsubscribeRegions();
    };
  }, [initialMachineId]);

  const machinesRef = useRef([]);
  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);

  const startLiveScanner = async () => {
    setIsLiveScanning(true);
    setErrorMsg(null);
    setTimeout(async () => {
      try {
        if (html5QrcodeRef.current) {
          try { await html5QrcodeRef.current.stop(); } catch(e) { /* ignore */ }
        }
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopLiveScanner();
            let machineId = decodedText;
            if (decodedText.includes('?machine=')) {
              const urlParams = new URLSearchParams(decodedText.split('?')[1]);
              machineId = urlParams.get('machine');
            }
            const currentMachines = machinesRef.current;
            const foundMachine = currentMachines.find(m => m.id === machineId);
            if (foundMachine) {
              setSelectedMachine(foundMachine);
              handleStepChange('form');
            } else {
              alert('Nie znaleziono maszyny o kodzie: ' + machineId);
              handleStepChange('scan');
            }
          },
          () => {} // Ignoruj powtarzalne ramki bez QR
        );
      } catch (err) {
        console.error("Błąd uruchamiania kamery:", err);
        setErrorMsg("Błąd kamery: " + (err.message || err) + ". Zezwól na dostęp do aparatu w przeglądarce.");
        setIsLiveScanning(false);
      }
    }, 150);
  };

  const stopLiveScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error("Stop scanner err:", e);
      }
      html5QrcodeRef.current = null;
    }
    setIsLiveScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.stop(); } catch(e) { /* ignore */ }
      }
    };
  }, []);
  const handleFileScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Skalowanie obrazu
        let w = img.width;
        let h = img.height;
        if (w > 1200 || h > 1200) {
          const ratio = Math.min(1200 / w, 1200 / h);
          w = w * ratio;
          h = h * ratio;
        }
        canvas.width = w;
        canvas.height = h;
        context.drawImage(img, 0, 0, w, h);
        
        const imageData = context.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          let machineId = code.data;
          if (code.data.includes('?machine=')) {
            const urlParams = new URLSearchParams(code.data.split('?')[1]);
            machineId = urlParams.get('machine');
          }
          const currentMachines = machinesRef.current;
          const foundMachine = currentMachines.find(m => m.id === machineId);
          if (foundMachine) {
            setSelectedMachine(foundMachine);
            handleStepChange('form');
          } else {
            alert('Nie znaleziono maszyny o tym kodzie w bazie.');
            handleStepChange('scan');
          }
        } else {
          setErrorMsg('Nie wykryto kodu QR na zdjęciu. Spróbuj jeszcze raz (zrób wyraźne zdjęcie).');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };


  const resetFlow = () => {
    
    
    
    setSelectedMachine(null);
    setErrorMsg(null);
    if (initialMachineId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    handleStepChange('scan');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">


      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <div>
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
          <button onClick={onLogout} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded transition-colors">
            <i className="ph ph-sign-out text-xl"></i>
            <span className="hidden sm:inline">Wyjdź</span>
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-semibold mb-4">Skanuj kod QR na maszynie</h2>
            
            {isLiveScanning ? (
              <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    Skanowanie na żywo (Skieruj aparat na QR)
                  </span>
                  <button 
                    onClick={stopLiveScanner}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    Zamknij kamerę
                  </button>
                </div>
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                    onClick={startLiveScanner}
                    className="w-full max-w-md mx-auto py-5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden">
                      <i className="ph ph-qr-code text-[80px] text-white/90"></i>
                      <div className="absolute left-0 w-full h-1 bg-red-500 opacity-90 shadow-[0_0_12px_4px_rgba(239,68,68,0.9)] animate-scan z-10"></div>
                    </div>
                    <span className="text-2xl tracking-wide">Skanuj kod QR</span>
                  </button>
              </div>
            )}
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Lub wpisz nazwę i wybierz z listy</h3>
              <input 
                type="text"
                list="machine-datalist"
                placeholder="Zacznij wpisywać nazwę maszyny..."
                className="w-full max-w-md mx-auto block p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white text-left mb-4 shadow-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  const m = machines.find(machine => `${machine.name} ${machine.bay ? `(${machine.bay})` : ''}` === val);
                  if (m) {
                    setSelectedMachine(m);
                    handleStepChange('form');
                  }
                }}
              />
              <datalist id="machine-datalist">
                {machines.map(m => (
                  <option key={m.id} value={`${m.name} ${m.bay ? `(${m.bay})` : ''}`} />
                ))}
              </datalist>
              
              <button 
                onClick={() => {
                  setSelectedMachine({ id: 'manual', name: '' });
                  handleStepChange('form');
                }}
                className="w-full max-w-md mx-auto p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                + Brak na liście? Dodaj maszynę ręcznie
              </button>
            </div>
          </div>
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
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            regions={regions}
            initialMachineId={initialMachineId}
            handleStepChange={handleStepChange}
            isOnline={isOnline}
            topicsList={topicsList}
            reportersList={reportersList}
            stopLiveScanner={stopLiveScanner}
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
            <button 
              onClick={() => {
                window.history.pushState({ module: '' }, '', window.location.pathname);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="w-full sm:w-auto mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-red-600/20 active:scale-95"
            >
              Powrót
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
```


=========================================
📄 PLIK: src\firebase.js
=========================================

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Włączenie trwałego cache offline dla Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);

```


=========================================
📄 PLIK: src\main.jsx
=========================================

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```


=========================================
📄 PLIK: src\services\api.js
=========================================

```javascript
export { 
  addMachine, 
  updateMachine, 
  deleteMachine,
  updateMachineWorkHours 
} from './machines.service';

export { 
  addPlannedService, 
  updatePlannedService, 
  deletePlannedService, 
  markServiceCompleted,
  checkAndTriggerDueServices
} from './plannedServices.service';

export {
  createNotification,
  markNotificationAsRead
} from './notifications.service';

```


=========================================
📄 PLIK: src\services\machines.service.js
=========================================

```javascript
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Zwiększa lub ustawia licznik roboczogodzin dla maszyny.
 * W przyszłości ta funkcja może być zintegrowana z API zewnętrznym (np. ERP/MES).
 */
export const updateMachineWorkHours = async (machineId, newHours, isDelta = false) => {
  try {
    const machineRef = doc(db, 'machines', machineId);
    
    // Jeśli isDelta, dodajemy wartość, w przeciwnym razie nadpisujemy. 
    // Ponieważ potrzebujemy odczytać starą wartość dla delty, najpierw moglibyśmy ją pobrać.
    // Dla uproszczenia (i bezpieczeństwa transakcji) tu po prostu aktualizujemy pole absolute.
    
    // Z uwagi na brak transakcji w tym snippet-cie, zalecamy `isDelta=false` w prostym widoku, 
    // użytkownik wpisuje po prostu aktualny stan licznika.
    await updateDoc(machineRef, {
      currentWorkHours: newHours,
      lastWorkHoursUpdate: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Błąd aktualizacji roboczogodzin maszyny:", error);
    throw error;
  }
};

export const addMachine = async (machineData) => {
  return await addDoc(collection(db, 'machines'), machineData);
};

export const updateMachine = async (machineId, machineData) => {
  return await updateDoc(doc(db, 'machines', machineId), machineData);
};

export const deleteMachine = async (machineId) => {
  return await updateDoc(doc(db, 'machines', machineId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: 'System' });
};

```


=========================================
📄 PLIK: src\services\notifications.service.js
=========================================

```javascript
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const createNotification = async (notifData) => {
  return await addDoc(collection(db, 'notifications'), {
    ...notifData,
    createdAt: serverTimestamp(),
    read: false
  });
};

export const markNotificationAsRead = async (notifId) => {
  const notifRef = doc(db, 'notifications', notifId);
  return await updateDoc(notifRef, { read: true });
};

```


=========================================
📄 PLIK: src\services\plannedServices.service.js
=========================================

```javascript
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notifications.service';

export const addPlannedService = async (serviceData) => {
  return await addDoc(collection(db, 'planned_services'), {
    ...serviceData,
    createdAt: serverTimestamp(),
    status: 'pending', // pending, in_progress, completed
    history: serviceData.history || []
  });
};

export const updatePlannedService = async (serviceId, data) => {
  return await updateDoc(doc(db, 'planned_services', serviceId), data);
};

export const deletePlannedService = async (serviceId) => {
  return await updateDoc(doc(db, 'planned_services', serviceId), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
};

export const markServiceCompleted = async (serviceId, completionData, nextPlanData = null) => {
  const serviceRef = doc(db, 'planned_services', serviceId);
  const payload = {
    status: 'completed',
    completedAt: serverTimestamp(),
    completionDetails: completionData
  };
  
  if (completionData.historyEntry) {
    payload.history = arrayUnion(completionData.historyEntry);
    delete payload.completionDetails.historyEntry;
  }
  
  await updateDoc(serviceRef, payload);

  // Jeśli zdefiniowano interwał odnowienia, generujemy nowy plan serwisowy w oparciu o poprzedni
  if (nextPlanData) {
    await addPlannedService(nextPlanData);
  }
};

/**
 * Mechanizm sprawdzający czy zbliża się termin planowanego przeglądu dla wszystkich zaplanowanych serwisów.
 * Jeśli termin jest blisko, a powiadomienie nie zostało jeszcze wysłane (flaga), wysyłamy powiadomienie.
 * Wywoływane przy starcie aplikacji przez uprawnionego użytkownika (np. Kierownika).
 */
export const checkAndTriggerDueServices = async (machinesMap) => {
  try {
    const q = query(collection(db, 'planned_services'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    const now = new Date();
    
    // Używamy dynamicznego importu lub zaimportowanego writeBatch, doc
    const { writeBatch, doc, collection: firestoreCollection } = await import('firebase/firestore');
    const batch = writeBatch(db);
    let hasWrites = false;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const machine = machinesMap[data.machineId];
      if (!machine) continue;

      let shouldAlert = false;
      let alertMessage = '';
      
      if (!data.notified) {
        // Sprawdzanie dla triggera KALENDARZOWEGO
        if (data.triggerType === 'calendar' || data.triggerType === 'mixed') {
          if (data.nextDate) {
            const nextDate = data.nextDate.toDate ? data.nextDate.toDate() : new Date(data.nextDate);
            const daysLeft = (nextDate - now) / (1000 * 60 * 60 * 24);
            
            if (daysLeft <= 7) { // Alert 7 dni przed przeglądem
              shouldAlert = true;
              alertMessage = `Zbliża się termin planowanego przeglądu "${data.name}" (zostało ${Math.max(0, Math.ceil(daysLeft))} dni).`;
            }
          }
        }

        // Sprawdzanie dla triggera LICZNIKOWEGO
        if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
          if (data.targetWorkHours && machine.currentWorkHours) {
            const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
            if (hoursLeft <= 50 && hoursLeft >= 0) { // Alert np. 50 rbg przed
              shouldAlert = true;
              alertMessage = `Zbliża się termin przeglądu liczonego w roboczogodzinach "${data.name}" (zostało ${hoursLeft} rbg).`;
            }
          }
        }

        if (shouldAlert) {
          // Wysyłamy powiadomienie do batcha
          const newNotifRef = doc(firestoreCollection(db, 'notifications'));
          batch.set(newNotifRef, {
            title: `Planowany Serwis: ${machine.name}`,
            message: alertMessage,
            isCritical: data.priority === 'Krytyczny',
            linkTo: 'planned_maintenance',
            machineId: data.machineId,
            createdAt: serverTimestamp(),
            read: false
          });
          
          // Aktualizujemy status dokumentu w batchu
          batch.update(docSnap.ref, { notified: true });
          hasWrites = true;
        }
      }
    }
    
    if (hasWrites) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Błąd przy sprawdzaniu terminów Serwisu Planowanego:", error);
  }
};

```


=========================================
📄 PLIK: src\utils\dateHelpers.js
=========================================

```javascript
/**
 * Bezpiecznie parsuje datę z dowolnego formatu (Firebase Timestamp, JS Date, String, Number).
 * @param {any} dateVal Wartość daty do przetworzenia.
 * @returns {Date|null} Zwraca obiekt JS Date lub null w przypadku błędu.
 */
export const safeParseDate = (dateVal) => {
  if (!dateVal) return null;
  // Firestore Timestamp
  if (typeof dateVal.toDate === 'function') return dateVal.toDate();
  // Firestore Timestamp stored as plain object
  if (dateVal.seconds !== undefined) return new Date(dateVal.seconds * 1000);
  
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};

```


=========================================
📄 PLIK: src\utils\imageCompressor.js
=========================================

```javascript
export const compressImage = (file, maxSizeMB = 3) => {
  return new Promise((resolve, reject) => {
    // If it's not an image (e.g., pdf or something else), return the original file
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // If it's already smaller than the max size, just return the file
    if (file.size <= maxSizeBytes) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Target dimensions. Start by checking if we need to scale down
        let width = img.width;
        let height = img.height;
        
        // Reduce resolution significantly if file is large. Max 1920x1080 bounding box.
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive function to find the best quality that fits the size limit
        const getBlobWithQuality = (quality) => {
          return new Promise((res) => {
            canvas.toBlob(
              (blob) => {
                res(blob);
              },
              'image/jpeg',
              quality
            );
          });
        };

        const attemptCompression = async () => {
          let quality = 0.9;
          let blob = await getBlobWithQuality(quality);
          
          while (blob.size > maxSizeBytes && quality > 0.3) {
            quality -= 0.15;
            blob = await getBlobWithQuality(quality);
          }

          // If still too large, aggressive resize
          if (blob.size > maxSizeBytes) {
             const scale = Math.sqrt(maxSizeBytes / blob.size);
             canvas.width = width * scale;
             canvas.height = height * scale;
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             blob = await getBlobWithQuality(0.7);
          }

          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        };

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

```


=========================================
📄 PLIK: src\utils\offlineStorage.js
=========================================

```javascript
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CristOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_photos')) {
        db.createObjectStore('offline_photos', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePhotoToIndexedDB = async (ticketId, base64Data, fileName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readwrite');
    const store = transaction.objectStore('offline_photos');
    const request = store.add({
      ticketId,
      base64Data,
      fileName,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getOfflinePhotos = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readonly');
    const store = transaction.objectStore('offline_photos');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeOfflinePhoto = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_photos'], 'readwrite');
    const store = transaction.objectStore('offline_photos');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

```


=========================================
📄 PLIK: src\utils\reports\auditorExport.js
=========================================

```javascript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';
import { safeParseDate } from '../dateHelpers';

export const generateAuditorReport = async () => {
  try {
    const reportData = {};

    // Helper to fetch collection
    const fetchCol = async (colName) => {
      const snap = await getDocs(collection(db, colName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const tickets = await fetchCol('tickets');
    const machines = await fetchCol('machines');
    const planned = await fetchCol('planned_services');
    const actions = await fetchCol('action_items');

    const machineMap = machines.reduce((acc, m) => { acc[m.id] = m.name; return acc; }, {});
    
    // Formatting Tickets
    const ticketRows = tickets.map(t => {
      const isDeleted = t.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(t.createdAt);
      const closed = safeParseDate(t.closedAt);
      const deleted = safeParseDate(t.deletedAt);
      
      let historyStr = '';
      if (t.history && t.history.length > 0) {
        historyStr = t.history.map(h => `[${safeParseDate(h.date)?.toLocaleString('pl-PL')}] ${h.user}: ${h.action} - ${h.note || ''}`).join(' | ');
      }

      return {
        'ID Zgłoszenia': t.id,
        'Maszyna (Nazwa)': machineMap[t.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': t.machineId,
        'Temat': t.topic || '-',
        'Opis': t.description || '-',
        'Status': t.status === 5 ? 'Zamknięte' : (t.status === 2 ? 'W trakcie' : 'Otwarte'),
        'Zgłaszający': t.reportedBy || '-',
        'Urządzenie zgłaszającego': t.reporterDevice || '-',
        'Zakończone przez': t.completedBy || '-',
        'Data Zgłoszenia': created ? created.toLocaleString('pl-PL') : '-',
        'Data Zamknięcia': closed ? closed.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': t.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-',
        'Pełna Historia Akcji': historyStr
      };
    });

    // Formatting Planned Services
    const plannedRows = planned.map(p => {
      const isDeleted = p.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(p.createdAt);
      const deleted = safeParseDate(p.deletedAt);
      
      let execStr = '';
      if (p.executions && p.executions.length > 0) {
        execStr = p.executions.map(e => `[${safeParseDate(e.date)?.toLocaleString('pl-PL')}] ${e.user}: ${e.note || 'Zrealizowano'}`).join(' | ');
      }

      return {
        'ID Serwisu': p.id,
        'Maszyna (Nazwa)': machineMap[p.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': p.machineId,
        'Nazwa Serwisu': p.name || '-',
        'Typ wyzwalacza': p.triggerType || '-',
        'Wykonawca': p.completedBy || '-',
        'Data Dodania': created ? created.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': p.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-',
        'Historia Wykonań': execStr
      };
    });

    
    // Formatting Action Items (Uwagi/Tematy do realizacji)
    const actionRows = actions.map(a => {
      const isDeleted = a.isDeleted ? 'TAK' : 'NIE';
      const created = safeParseDate(a.createdAt);
      const closed = safeParseDate(a.completedAt);
      const deleted = safeParseDate(a.deletedAt);
      
      return {
        'ID Tematu': a.id,
        'Maszyna (Nazwa)': machineMap[a.machineId] || 'Nieznana (Usunięta)',
        'Maszyna ID': a.machineId,
        'Opis Problemu': a.problem || '-',
        'Termin (Wymagany)': a.dueDate ? safeParseDate(a.dueDate)?.toLocaleDateString('pl-PL') : '-',
        'Status': a.status === 'completed' ? 'Wykonano' : 'Otwarte',
        'Zakończone przez': a.completedBy || '-',
        'Data Zgłoszenia': created ? created.toLocaleString('pl-PL') : '-',
        'Data Wykonania': closed ? closed.toLocaleString('pl-PL') : '-',
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': a.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-'
      };
    });

    // Formatting Machines
    const machineRows = machines.map(m => {
      const isDeleted = m.isDeleted ? 'TAK' : 'NIE';
      const deleted = safeParseDate(m.deletedAt);
      return {
        'ID Maszyny': m.id,
        'Nazwa': m.name || '-',
        'Kod QR': m.qrCode || '-',
        'Rejon': m.regionName || '-',
        'Aktualne RBG': m.currentWorkHours || 0,
        'Usunięte (Ciche)': isDeleted,
        'Kto usunął': m.deletedBy || '-',
        'Data Usunięcia': deleted ? deleted.toLocaleString('pl-PL') : '-'
      };
    });

    const wb = XLSX.utils.book_new();
    
    if (ticketRows.length > 0) {
      const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
      XLSX.utils.book_append_sheet(wb, wsTickets, "Awarie i Historia");
    }
    
    if (plannedRows.length > 0) {
      const wsPlanned = XLSX.utils.json_to_sheet(plannedRows);
      XLSX.utils.book_append_sheet(wb, wsPlanned, "Serwisy Planowane");
    }
    
    
    if (actionRows.length > 0) {
      const wsActions = XLSX.utils.json_to_sheet(actionRows);
      XLSX.utils.book_append_sheet(wb, wsActions, "Tematy do realizacji");
    }

    if (machineRows.length > 0) {
      const wsMachines = XLSX.utils.json_to_sheet(machineRows);
      XLSX.utils.book_append_sheet(wb, wsMachines, "Maszyny");
    }

    XLSX.writeFile(wb, `Raport_Audytorski_CRIST_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error("Błąd generowania raportu audytorskiego:", error);
    throw error;
  }
};

```


=========================================
📄 PLIK: src\utils\reports\excelExport.js
=========================================

```javascript
import * as XLSX from 'xlsx';

/**
 * Eksportuje podane dane do pliku Excel (.xlsx)
 * @param {Array<Object>} data - Tablica obiektów (wierszy) z przetworzonymi danymi (nagłówki kolumn powinny odpowiadać kluczom).
 * @param {string} filename - Nazwa pliku wyjściowego (bez rozszerzenia).
 * @param {string} sheetName - Nazwa arkusza w pliku.
 */
export const exportToExcel = (data, filename = 'raport', sheetName = 'Dane') => {
  if (!data || data.length === 0) {
    alert('Brak danych do wyeksportowania.');
    return;
  }

  try {
    // 1. Tworzymy nowy skoroszyt
    const workbook = XLSX.utils.book_new();

    // 2. Zamieniamy dane JSON na arkusz kalkulacyjny
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Domyślna szerokość kolumn dla wygody
    const cols = Object.keys(data[0]).map(key => ({ wch: Math.max(20, key.length + 5) }));
    worksheet['!cols'] = cols;

    // 3. Dodajemy arkusz do skoroszytu
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 4. Pobieramy plik
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Błąd podczas generowania pliku Excel:', error);
    alert('Wystąpił błąd podczas generowania pliku.');
  }
};

```


=========================================
📄 PLIK: src\utils\reports\logoBase64.js
=========================================

```javascript
export const FALLBACK_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb8AAAG/CAMAAAD/zSlAAAAAk1BMVEUlQI6SlJf///+UlpeampcfPI4cOo5PX5EiPo5yeZNEVZCGi5ZaZ5IAKIQ3TI8ALofu7/TKz+F/hZUAC30uRo/Q1OOnr8wOM4pHW5ugqMmIk7q3u9IAJYRRYp0ySY8/UpB+iLTj5/Bpc5MAGoBjbpNJWpDZ3ep3fpQAIIJkcqfAxtqXocRxf69bbKY+U5gAE38AAHk92TGPAAAa9ElEQVR4nO2da3vauhKFHRypalOCyTaYe6FtSLj2/P9fd2ySEDwj2WMDweD1ftpPd3zBy5JnNBd5HgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwRkyFufSzAeC8mOfvVUZf+vlUHOM93PuV5f4uuvQDqjjR3/u76uI/QL9MzOOdf2mRMoB+OejvVZYP+uWgflR6+EG/PF4qLR/0y0b99KHf9WLCp2rLB/0y0T8rLh/0y8KYahsvd9Avk4r7DgnQz03VfYcE6OfEeNUfftDPjXqu/vCDfhkIfYfLBiAQf3Cgha67//DEefg6EP+zox5k8vk/Q8bk8fT8coAMCivSsJ//En5Nooty/POlH1Q1Mb9kxot/94wnWD3EvoP/HfJVECP0HXz/F/SrHkYa9rv/DfOvgqhv90LfIbz0rQILRuY73PnfMHtWELHv8IThV0HMROi632H4VRAjDfv5LygfqSDmh3T4Ud/BqAtwmYdUXcSue+w7pIef+nkJLvSYKovYdb+bpOXTzxcJF04u9Jyqihb6Dvc/01OX8Z4uEP3zoV8a/VMcd6AHXmL4Qb80JhQOvzs6/CYXSfWFfmn0b6Hv8BSmv37mMqm+0C+F+SUdfiTsp4Q+/6mBfofIfYfvxHeIvl+mShf6HVLad1CPsoDFyYF+hyhp2O+vogdeqEge+h2gvwl9h4dH4rp/u1SqL/T7RFpu5Ps/01H3C5YJQr9PxL7DS0gXPi+WaQ/99qhHqQvwrRKu+w7ot8eIhx8xXvQFO/xAvw+kvsOdT3wHE4p7HHyuO58K6PdO+ZRBLXXdD85/wggE9Nuhn6XlRuSByat0/d/P3945YfwWKVQJJpKmDNK4g5F2+PGfJvoj6UGfDORP7NB/pXEHunImdd2RrXZGpCmDPOwndt397wrZaufCSIffi0ddd6Ex6d89YvidCyUN+93/IManNNP+7v4vKl3OhpGH/dIHipvz+g+X+WW1QNophDlbStyc10eZ7vmQpgz6LOwnXHKLB64H4+VclA77KWGmfXzkDwy/c2G8sr6DuMGWD+PlfIjjDk/kQPVN6js8kcmzVAORL3sg14U0ZdD32RwobrD1TOP1Jfi6J3JdSIff/QuNOwg/m9zrUN8tLbfywBRsRdyoh3UKETbYio2XXzzbqTj0LGBHJJwE7/+SxyfNluERi3LpFj5cEAv6Wew7EBWkS24sYlGyUgKduqxIbRA6/Dzp8Lv7RoyXstlO/hO+gBRp0Z7/EJJ6FfGK9wutlCid7XT/DAHTiFMG/W/00QkT5v07Irx5LJ295D/gC0iQ+g5P1PYUJ6v9pL7DEZUSWMZJU951F6940zJP/VxaPcsCbM2JxCmDinpw4pwX8sDDo/Yz41ZUndE/SsYdxEXy/nfyvI+slIATf4AxUkOevvVKmi3z8OvElRL3SILaI/YdmAMutVrvqfEizVJ03wtfRK8r4sw/uv4ljrr7D7Q/Wnh0nZn/FGEAvvFXmDD/REJv8hVvZrWeoMkB90TriXj98p6qED0JzZ7f9LP54xjhPs76EGIAevK9/e6pCal/SAtdqPFyor2Q6XReS8wvoQq8yad4xZvOnqdpcgAnPkEa9vN/kwPlVivNeDhVkwPWvKSGiBdQmOv+KFPB93/RTHthY8P8U9891t2EkfsOdMVY6rqzBlvyxob5N/VS9z3/lHgSpBEbaWt69pHSv0/W5KD2Trx8AYWmLAjb1Pm0OW98yRO2iGH5pDVDCceCT1MGldRqfWGXPI3v8EGtfQj53n50tV/LVOCpRuIqaxlsSbZWyMN+VL5vwsf7nWa7Hxf2s1zhZ331k/b5L72AwrqDJpUSR8llubfarqIZecog/foJa93v6RKzvDuCmPvfdfUh1E/ZE+KvuDD4yq3D8imD7ov4NV1Fky6g8FEkDL7GxgudPY8P+1kuQ23jmiDPfVB0AUWmQmz1kAPP0tu8pun04o4DbI1D6rqzlZcT+w77C9ENYGpBJEyfvf9ODpQGX1nCrneisB+70F0NfQglDb7e/SjpO9BsC8+cq7c5yw2+fYwWh/3KTYK8yvOMvc39n3XzIeS+A/XAhQsofD/4MzZX9u9qNv7E6bMscVPouse6nz5lMONy7G25bcRhP5q46UlbxLC4wAnDfjbobH3TiPcFZ83KIqHrTrtLFmiuXApWX3HTROJ9wcmBaiIzXqjR6p3Ld/i8Yo16+korX2MZaNxIJjw3Xs7mO+zvtUZOvDD4mqQMlmpTx8ubzanDfvya9UmnN9LgK6/2kw0/n81lUnvpCCym1o0iX7imHQeEbQZZspNnhKs9R3Bfn6Yi4lbVrFxTPH+yS4qbxJSEp+jcLgVaLVEBhQOQLV2Lu8SUhaX33zLimgc2AIX+A02YKdBguRz1qodX4rzBkJYOyRYxuTt9hsyX1AV/18V62SEdDaxhp5F9Oy3utLhJaBnq1pBJ3q+H7pViZAmAFndanXFvTv7BvXHUX+GDKZuAy6Pv0n3pSuA/6FoNvwThALyjrf6k8dsHFn73zpG9tLtWDfcEEddt0i2mpatvljVQ6SYRRalX8OENI/QheOMyofFqiUGcyYfwH+gyex0QJzDRzR6kkVgeAxRXGxaDpejUAyX8HPEiBlkmhE/7JSctD86Rv1vTNhRiH+KOWiLCzhO8Ns+cw4ew5JnWA3EHAvaAhJmA9yyvVlqxVoDYd/iqB1YxxFkwbIISRtP9O55Xe2ofwmfTe30Qd+DhBoLQh6DLb6f3Ie5ZgX2NECZh83CCFmaTccf6xIHAmhYfvSP2IWgNixE2gOSVCeKNCmTUfC8d4XbFPBFNGAi05fEe23k3dWM80FgrpGFxtmWcFwmdeEt/jxMOwLrlzTOM1Iegi2HStRTeI/CEgUD/oT5Jn3bEPgTrfyZMCeRtQz1zslzQ+uR8OhH7ENSJl5bz8anXnKoUgi/N1g/pklZsSfIuuqID6Z633qmceB4aqSNKmkzILElhJzqLD3GaZEIemqwl0lZ0PBn0sWT/69P4ELYipzoi9iHYllGlG4l4p2jB67PFuZoi9CEszeiEPgRfPz2BDxHfDobfDrErx1ejhdm8dywLUbxjlvtu/tat54QTqQ/BPjjSNgj+E83vO9qH4PltNUZYkOS/sHlQ2IaE52AIS9Hc91Kjeulc9PN9yax4YQtR3oLySB+iTuXSArSsGZqlG7nUe2QbDutjAoG1alcgQJjL5PNZS9hCm9d3mWPiEP4L5EsjGw28slbcwp6GgI/xISyL4jVHmkxoyRYSKs8THcr7EDw3v/ZIeyLzshRpGinrL6CeS/oQtry2uiP9HFkMkdJppMKhy++h1puuOBA2NbBknAgDgZYF8HLJhHxDQeCJmxrYFjPLppGWKkiqZbtkAcIOgbzRirSXLw/4qMnDfXEQdbcjTK1lDc2TNFLJgbEPwWpBf30rDl0MB28Il7R8/wezJIVppNz9N7o4mD0dCAuSLBlJUh/iAc/+jAh3puUZSUbcT4Z5H+CECJe0LMmg4gGIj9cZkTY14FUNwr7Ylg0dwQkRhsUtldHyfjIYgOdEaEnysiJhNAGB17Mi9SHY9hziaAISH86K1IewdFcSBgLru2HtVyD1IVj2pZFGExC8OyvCZML776wcQhhNQPD8vETCAciqD6QZSf5L1IrOAKblHeqXMBmUtTcTZyQ9nAV8V9+QNTWwtUiW1oKeh8lFnlb1kCYTsvI7YXPs8xBbVJd5XJXDCH0IXn2uvp19mxX33UC/D4RNDdjG8PEAPLKq4Qig3ydSH4Jvs/J8sRkU+n1ilHAAMpPvcgMQ+h2gZL3+eTKoejzzPo3ue4F+ByhRQZL/wJ34c7RIlgD9DhGWpVh2/bqUDwH9DhGuRlt23dOyDeJPDvRLIWxqwJexpRvsnBrol0bqQ7Bggj73VtN2oB9By3yIJ56QdBEfAvoRpE0N+GbTp+ovWAjoRzBCH4K1p0s22DlTiCEL6EeQjSOf739iwvME+BD/K4jMh3jgLa5LVKUcD+QjSH0I1h8SVANZaTvaCVQX2QD8jVaA1UTY1AAZgRVFWNpexw1orwNZVjyqiqqLqMd1zbeRqjCyZEJLZwJQDWTJhNgKpaoIC5JqvI1pxZFltPgPRl0WfIAdyJoa+L9//bgsENCOMJ5XopPZSfGxCOTi1Jt+nwP/Afo5kLbHuijQz81Rvf6/COjnRrrL6iWBfhmId0i6HNAvA+kuqxcE+mUhLEi6INAvkwtW1sqAfpmYcr3+vw7ol4kRdje/GNAvm6r7ENAvh6jaPgT0y0HY1OBSQL88qu1DQL9czMulY0RZIH6Uh5qU2O3m60D8Ng+lLlJYJOTSTwcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACIMUpHreaOVhRpvkXc197Nx820Io02zXkY3Wx6vcV00O/2+/3uarrebPUocj04XpKkRHKnj3PLYqKmN14nN9PtDqabbavF/tYkJzg8Gbsj+o/qVt8DpUdqs1p2ZkHQeCcIgll7uAhH/MElB/QYE0+NXptRdkNcM0kds7X/sdGv4Xo4nwX7e5m3B+EovVWVCfk95HOD1YLxexwuhnvh0gTzwaPie3z9Z/nzYDZvd9fjicrYE0x3U4e0W9b7UT3L7QTLRepGoqn9jjMJ/pzkkVUIE4WLrkO89988XG/pILTp9/Hn7dViGzmqmgX6ab1YOk7dXnif5Zql9JvdmH6m5Q1cT+uAziBspcZUhn67v+8u7Arm6xf1st6mYW9/WugXP85o3ZH98M40OqxUztEvme3GTUtpc65+0WKeLcCi+f4iQT8T9dryn97uRZ9DMFe/mGHIv4N5+rWmuScevM8EtdcvCgfFfvwg3I8oiX6N2Tpiexxn6mdEmqzeTNya62eiRYHB98Zy/GHGiPSLFTfE7snUTyZfLODutai5fs3BrPjPn3/4T0L9Gn0yhWbqFy2EZ52OvJrrZ0b9Er++0fgYgFL94rGSum6WfmqbbbocsNX11k+FAqfBRmH9GtOUgFn6tbqOU3DmxtRZP70t/Ol7p7h+QXjoRmToF40L3Edf11g/5ZWVr4R+jWHz4NJu/UxUZEqYbXRt9TN/3PJ1uoPpYrFYT1f2BdES+gWbgxnUrZ8e25Y8B+vNYtq3WFpdHRX0fnbcgH4mGtqf86y7Gf1rRpHWOopao//C9ZI9Uod+8353uJzPDsIXBywPlt7c+jXZXQWD0WsruZnmP8t8v4jGXUo/vZg0Y3/QXV19t0mjrJZnsFxHo/SCl4r+hKtOWhGHfsP/NUd//vxR42m3wySM57r9OZ36ceNzuW3uddfNATltMI10k/K/VfrsoxH9C1u847rQ1hWq4SJiayUxquWtU58ll36j3b+aeKyEU7aiOvh86Z36RWtyW8tJaqg007e9XNhiVM30q9lJR5RV1Gq1nAHpK0FtLfLNFsrVRtNo7/DJZeu3OyBivkn3M6br1K+VHjqNYJu+I5P63A08a4gxQz+TvFmr1WoTNt3RySvg1RJv6EZZTVBN5H1+mvL1i1+RVyLgfLt/6d3jjzh/00OrdXcben8XbRLM2uPWL34LP+bntvtlrT5NbrTNpo6nsUe97tfaJPp5Kkz/3+DzA+jSz3hp8yXgyTS693YT82nTNQc69YvGsQHUGQ5iszqWsTu5VitG9ZgpPtvkyRcz2swL6McG0zpfPzLpLi2GRmv37nW3bhvEpV+0mDU6U2/UilrNbfwutnvXOQItrsNsI3oXo/G8gH5qnb7IIF8/Yn7a7HzTmjdm66yG1w79dHzzw/DNGB2NovhSy/Aqv4GaLfDPxsKpJNp2CuhHhvmnGlL9Brbb0puuybxdu37J2F7+C4fzHatt5M0aq2scgEbR4ResxQ5RNOmI9TOTtJXU3V/FPX+mPfSuPXummT1s7PrpRWPm6Uk8eGOC2JqKNkFwjQNQbYh8jWkBfzaZd6T6ka+ZRL/0EbNSFoZDv2E8gZuw09iMx+N1pzHV8Xs8uEJP/pUGaIaFfkTyDRTq5xXWz1CTh/oPEhzzZzAbq0S/sBVFr4NYzGjaWL6WOP9lMZrINwuLLUZE49mmlH793O+fxX8vMQKt+qlJYq4k+o23vW1sia518n3+r/jpLwzz/dZFH1G02drzJ9j3L/01y7c/vYgu68WWVeFPlFU/PW4M9U6/N3ZizhvXN3+OyApxCSN6v/RUzP6c5uunx9QznQ1U0ffLqZ/a6bdcBo3OYKLi92veKDM/XxQaYAsKD78DsvWjfkq+/x7/Hx4isqcAZ2CfPx8bS2+n3zZaNTr/1Nv79a/8j78MEfnCtLMrhbLJWX9JXyrY5K9/ei1LOD0YbnPqmdJY9TNeMOvt7JdJ4vkl+TjROuhcWyDXGPKCHzP8svXTZP1zvs2PP8TOqTX7bDgO5d9Bu/0ZLWPRduNPtRaNeTx/xnexurbvn+qln09wVBglM/5AV+mGgvhRPADJotsHy+nWuWBNcPh/68Y8fqcS/bzXdmOl9CZoXJ3/rkmAtHvUBzxDv0hTN1MSv00WZ11pOfPVxFpEynCtn3Ua3T9hO9FPbxrznu441neqjCLew+aoFUBH/N0YPRpTGUT5E57NBP08RT+UKOhav47NqdXrpLe7xe1WLxsdR+FvdaELHIF31C+g+v3RUYwJe5aiCln+kpfMoBlZbd2xlztmXPGj5MTLsWkl9+jFHvy8d3XDjy6JHGV9Mv2Wm8V6OlgN2zYB1qL8wYTs6rHhOjNPwMuI37aSqsLlYDqdrjpJZtS1GS/ezmU9pH9cAIXoFwTWzME3jYT517v/nTUCY3dinB1rdudPRL19Eul84F1h8MiQvKXpSfXLIhVhzKvfzClBCgatrPvOyF9SarvuL5fD1cJSVXoFKFJdsP4q/bpp1zC3ftpkp9HPexnuYGb+oNKt0WuzdZXqsdhfsPgi/dppRyu/f4FqTTPLyIKB57REs/M/rxq9SD+F49wHsX6zcfo6gv4hppXZgSIe0c6w1y3rl17dCMZfol+wIIa6pH9P/K3a2Es03hm6ptD66EfHRVFk+gU9qo9IP8+o0ZbXznyydDjzN6wfzX35iu9fh8fQZfol9/vaG7oL9Id2K+SG9TNfrt9sFfJriPVLks16K2dzoYF1Cr1l/XrpB3B2/284to2RAvolFv926ljTnm1sM+gt60f89yMTWHP0C7rblnWBrpB+O59tbPcHh7bT37J+JKV2eVwdXKZ+7al+dZy+oH7JEa9jqylDLduEG9bPIwU+s+MCmNn6uYski+sXHzOyNZRsWxIgblg/liDbO2oAZs+f/ZHruDL67ar3uC1q+QE3rJ+nSfzW/Ywl5Hz/Fi5dyumXtORlpqglg+Wm9SMr+8FRIcwc/WauAruS+iXLonRJZs4z4G9ZP7Ulb7DNABBD9JtROZeO8H5p/TxNy+pnWzaB3rJ+rHZzeUwkheZPsPXKqf3tKK8fCw1a8o9vWT+P9isKZJW3dqh+ig5A2j/inXz9nM/ckA4/Aa/xvGn9jKEdVoqnMO0PYP17WGnh3JrqkNN/V7fMduu6eESuwQ2Ym9bPY23PCsfg1SR8/y+WP8hqCxt92xJlhn5KN8PxYDhru3L7lJe+QLdm+kXpEG48RAoOQO0NnfWbtIDdUR/j0M8k7XU2w3bi5QUuz9S00k5g3fTz/tCP1KqQD5hYQO76TdYAq9HhBqJdP9Ma6enyw4YNrEvTCaQArnb6tVjznkWBGkmll5n17+ThJf8qix+ZbT8ljHNaJ+OvXzf9zISuQhVIg9G7BdQM/RRfIuFNAmz6kdQAa++X3e0TA6xm9meMJiWASTqeUMA3+TL7F/AGyLyI3aafInUP85HD9ycpdNzFvHX9LB3eO0YkoHpvHZPZf4LPoG3qRNjnT2IY211H7zV9eksK5K3rZytynVmyHBjRR/QwUz+jWZynTwS02i+0XVrXalZpEoGecev55vUzTR5Js+xyQ1BJ/zeBfvEMxz6wa0H+J7OrbCtDJiKj21IBffP6sZd494xX2Q0xo7C/Pyinfw/vKT6f5Odfs8K/pSU5IimaTWHpoHT7+tkagMY/NHQ3FlOv4wO7Mkc/o9j47qasEbv/rqnlytdu9IR+ui3eZQ308+zd51cT66anRutt6u/z+mcpj43vRX79Ef8sr9IpGCbpHJFmbmkAUgf91MSakhf0x16UktCoKJqsidq5/c+4FEEvt35TsfBFo7v9VNBEZs3yJ2wBqjro5ywzD5aDsddqxeMwKWOPmq3Jos+kzu9fp9n4PoxzONY/m8wxbcwH22Qz6/gtapo130xkbsu/qoV+LA7zyawzHIy3XhiGvXV/yYLqIv1on5KGpP8E7Zj9JlF3sQ29yabPt5Rw5K/WQz+v5RQwF0H/SNaJTtK/vOhmOO1JzfKvU7SkGyUyJP0/RywUON+XXEr7t+bg6N1WF/08vSix+WaCaP8Hj82g3Y9lGHf/yEKvFA8d7aiNfuajn3xRRP13WaC4EXw0anbqZ2h7vSw6jhWj2uiXxBNK7cD5UfaZ03+QLWR/xDky+tfJt9+cORa466SfZ0psYDzf++J5/cuZ4/HuRGT1PxsJ3yh37XCd9EvM0GJDMOnG+XFstn62r9lbVDYr/8yYzKr3vSruLSvqpZ8XhasCQ3C+Vp82e45+rFlssgyTjJrM/EEVCqbQdkbvsprp5xm9lX50glWqb1GefiZiyRTzZI08J/8zcvQA/aTr7v5SP/3iJ/aq7RvdppmtRukIRZ5+thWVZLeJvPzrVpjVdyKeOx25FW/UT7/4QTe3K2vbwD3BcmBofClXP8uKSjCNTG7+vG5NnXczz+tIX0f9kvB6uO67Oj0E7dXC4+5Wvn60YWUjMRypfh2LHx6FU+sYbA+2eYkCzfTZ5/XQb1ceGY4H/KkFy2nPU7bAYDQdHGLrRqJ6A8pYqUXqH9a2j5nRXm9AHJB5f+zp3IphvUmfvS76JaNFRaP//emtV/3hsN0ZDrur6Xb0v5Gzkj1KYXXITESJ/0znH+fttr7+L5yuurtb6Q96r/9kDbBV+uy1ke+dJNjWHI1e/yR7HRbaeeEM7O4lvpVm096KBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4Pz8H/sYuod5kll9AAAAAElFTkSuQmCC";

```


=========================================
📄 PLIK: src\utils\reports\pdfHelpers.js
=========================================

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FALLBACK_LOGO_BASE64 } from './logoBase64';

export const getBrandingLogoBase64 = async () => {
  try {
    const d = await getDoc(doc(db, "settings", "branding"));
    if (d.exists()) {
      const data = d.data();
      // Jeśli w bazie mamy zapisaną miniaturę Base64, zwracamy ją natychmiast bez żadnych zapytań sieciowych (0ms, 0 błędów CORS).
      if (data.companyLogoBase64 && data.companyLogoBase64.length > 100) {
        return data.companyLogoBase64;
      }
    }
  } catch (e) {
     console.error('Błąd pobierania ustawień brandingu', e);
  }
  // Zwracamy logo wbudowane w kod (z awaryjnego pliku)
  return FALLBACK_LOGO_BASE64;
};

export const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};

```


=========================================
📄 PLIK: src\utils\reports\pdfKPIReport.js
=========================================

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64 } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};

export const generateKPIReportPDF = async (tickets, plannedServices, machines, dateRangeTitle) => {
  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      const maxSize = 24;
      let w = maxSize;
      let h = maxSize;
      if (dims.width > dims.height) {
        h = (dims.height / dims.width) * maxSize;
      } else {
        w = (dims.width / dims.height) * maxSize;
      }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    // Tytuł dokumentu
    doc.setFontSize(22);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Raport Zarzadczy UR'), 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(n(`Okres raportowy: ${dateRangeTitle}`), 14, 30);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), 14, 36);

    // --- OBLICZENIA ---
    const closedTickets = tickets.filter(t => t.status === 5);
    const completedServices = plannedServices.filter(s => s.status === 'completed');

    // 1. MTTR
    let totalRepairTimeMs = 0;
    let repairCount = 0;
    closedTickets.forEach(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      if (openD && closeD) {
        totalRepairTimeMs += (closeD.getTime() - openD.getTime());
        repairCount++;
      }
    });
    const mttrHours = repairCount > 0 ? (totalRepairTimeMs / repairCount / (1000 * 60 * 60)).toFixed(1) : 0;

    // 2. Proporcja
    const totalInterventions = repairCount + completedServices.length;
    const preventivePercent = totalInterventions > 0 ? Math.round((completedServices.length / totalInterventions) * 100) : 0;
    const reactivePercent = totalInterventions > 0 ? Math.round((repairCount / totalInterventions) * 100) : 0;

    // 3. TOP 5 Awaryjnych Maszyn
    const machineFaultCounts = {};
    closedTickets.forEach(t => {
      if (t.machineId) {
        machineFaultCounts[t.machineId] = (machineFaultCounts[t.machineId] || 0) + 1;
      }
    });
    
    const top5Machines = Object.entries(machineFaultCounts)
      .map(([id, count]) => {
        const mach = machines.find(m => m.id === id);
        return { name: mach?.name || 'Nieznana Maszyna', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- WIZUALIZACJA NA PDF ---
    let currentY = 50;
    
    // Tabela Głównych KPI
    autoTable(doc, {
      startY: currentY,
      head: [[n('Wskaznik (KPI)'), n('Wynik'), n('Opis Wskaznika')]],
      body: [
        [n('MTTR (Sredni Czas Naprawy)'), `${mttrHours} h`, n('Sredni czas od zgloszenia do usuniecia awarii')],
        [n('Stosunek Pracy (Prewencja / Reakcja)'), `${preventivePercent}% / ${reactivePercent}%`, n('Ilosc serwisow planowanych vs napraw awaryjnych')],
        [n('Laczna liczba wykonanych serwisow'), `${completedServices.length}`, n('Zrealizowane prace z kalendarza/RBG')],
        [n('Laczna liczba naprawionych awarii'), `${repairCount}`, n('Zakonczone zgloszenia awaryjne w systemie')]
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [40, 80, 140] },
      theme: 'grid'
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Tabela: Top 5 Awaryjnych Maszyn
    doc.setFontSize(14);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Ranking: Top 5 Najbardziej Usterkowych Maszyn'), 14, currentY);
    currentY += 6;

    if (top5Machines.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Miejsce'), n('Nazwa Maszyny'), n('Ilosc Zgloszonych Awarii')]],
        body: top5Machines.map((m, i) => [i + 1, n(m.name), m.count]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [180, 60, 60] },
      });
    } else {
      doc.setFontSize(10);
      doc.text(n('Brak danych o awariach w podanym okresie.'), 14, currentY + 5);
    }

    // Stopka dokumentu
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        n(`Wygenerowano z systemu VexoNT (Modul Zarzadczy) | Strona ${i} z ${pageCount}`), 
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(n(`Raport_Zarzadczy_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania raportu KPI PDF:', error);
    alert('Wystąpił błąd podczas generowania raportu.');
  }
};

```


=========================================
📄 PLIK: src\utils\reports\pdfMachineCard.js
=========================================

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64 } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};

export const generateMachineHistoryPDF = async (machine, tickets, plannedServices) => {
  if (!machine) return;

  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      // Obliczamy proporcje, tak by maksymalna szerokość lub wysokość wynosiła 24
      const maxSize = 24;
      let w = maxSize;
      let h = maxSize;
      if (dims.width > dims.height) {
        h = (dims.height / dims.width) * maxSize;
      } else {
        w = (dims.width / dims.height) * maxSize;
      }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    // Tytuł dokumentu
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Historii Maszyny'), 14, 20);

    // Informacje podstawowe
    doc.setFontSize(11);
    doc.text(n(`Nazwa Maszyny: ${machine.name || 'Brak'}`), 14, 30);
    doc.text(n(`Numer Seryjny (QR): ${machine.qrCode || 'Brak'}`), 14, 36);
    doc.text(n(`Rejon: ${machine.regionName || 'Nieznany'}`), 14, 42);
    doc.text(n(`Stan Licznika: ${machine.currentWorkHours || 0} RBG`), 14, 48);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), 14, 54);

    let currentY = 62;

    // ----- Tabela Awarii (Tickets) -----
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Historia Zgloszonych Awarii'), 14, currentY);
    currentY += 4;

    const ticketRows = tickets.map(t => {
      const date = safeParseDate(t.createdAt);
      const problemDesc = t.topic ? `${t.topic}${t.description ? ' - ' + t.description : ''}` : (t.description || '-');
      return [
        date ? date.toLocaleDateString('pl-PL') : '-',
        n(t.reportedBy || '-'),
        n(problemDesc),
        n(t.status === 5 ? 'Zamkniete' : 'Otwarte'),
        n(t.completedBy || (t.history?.length ? t.history[t.history.length - 1].user : '-'))
      ];
    });

    if (ticketRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Zgloszenia'), n('Zglaszajacy'), n('Opis Usterki'), n('Status'), n('Naprawil(a)')]],
        body: ticketRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 50, 50] },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      currentY += 6;
      doc.setFontSize(10);
      doc.text(n('Brak zgloszonych awarii dla tej maszyny.'), 14, currentY);
      currentY += 15;
    }

    // ----- Tabela Serwisów (Planned) -----
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.text(n('Historia Serwisow Planowanych'), 14, currentY);
    currentY += 4;

    const serviceRows = plannedServices.map(s => {
      const date = safeParseDate(s.completedAt || s.createdAt);
      return [
        date ? date.toLocaleDateString('pl-PL') : '-',
        n(s.name || '-'),
        n(s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Czasowy' : 'RBG + Czas')),
        n(s.status === 'completed' ? 'Zakonczony' : 'Oczekujacy'),
        n(s.completionDetails?.completedBy || s.completedBy || '-')
      ];
    });

    if (serviceRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Wykonania'), n('Rodzaj Serwisu'), n('Tryb'), n('Status'), n('Wykonal(a)')]],
        body: serviceRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [50, 100, 200] },
      });
    } else {
      currentY += 6;
      doc.setFontSize(10);
      doc.text(n('Brak zaplanowanych lub zrealizowanych serwisow dla tej maszyny.'), 14, currentY);
    }

    doc.save(n(`Karta_Maszyny_${(machine.name || machine.qrCode || 'Nieznana').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};

```


=========================================
📄 PLIK: src\utils\reports\pdfServiceCard.js
=========================================

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64, getImageDimensions } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const fetchPhotoData = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const MAX = 800;
        if (w > h && w > MAX) { h = (h / w) * MAX; w = MAX; }
        else if (h > w && h > MAX) { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ b64: canvas.toDataURL('image/jpeg', 0.85), w, h });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => resolve(null);
      img.src = objectUrl;
    });
  } catch (e) {
    return null;
  }
};

export const generateServicePDF = async (service, machine) => {
  if (!service) return;

  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      const maxSize = 24;
      let w = maxSize, h = maxSize;
      if (dims.width > dims.height) { h = (dims.height / dims.width) * maxSize; } 
      else { w = (dims.width / dims.height) * maxSize; }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Serwisu Planowanego'), 14, 22);
    
    doc.setFontSize(14);
    const isCompleted = service.status === 'completed';
    doc.setTextColor(isCompleted ? 30 : 200, isCompleted ? 150 : 100, 50);
    doc.text(n(isCompleted ? 'Zakonczony' : 'Oczekujacy / W trakcie'), 14, 30);

    let currentY = 45;

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Serwisie'), '']],
      body: [
        [n('Nazwa Serwisu:'), n(service.name || 'Brak')],
        [n('Maszyna:'), n(service.machineName || machine?.name || 'Nieznana')],
        [n('Typ Wyzwalacza:'), n(service.triggerType === 'calendar' ? 'Czasowy (Kalendarz)' : service.triggerType === 'hours' ? 'Licznikowy (RBG)' : 'Mieszany')],
        [n('Data Planowana:'), service.nextDate ? safeParseDate(service.nextDate)?.toLocaleDateString('pl-PL') : '-'],
        [n('Wykonano Dnia:'), service.completedAt ? safeParseDate(service.completedAt)?.toLocaleString('pl-PL') : '-'],
        [n('Wykonawca:'), n(service.completionDetails?.completedBy || service.completedBy || '-')],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 140, 80] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    if (service.completionDetails?.checklistSummary) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Wyniki Listy Kontrolnej'), 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitChecklist = doc.splitTextToSize(n(service.completionDetails.checklistSummary), doc.internal.pageSize.getWidth() - 28);
      doc.text(splitChecklist, 14, currentY);
      
      currentY += splitChecklist.length * 5 + 10;
    }

    if (service.completionDetails?.notes) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Uwagi Wykonawcy'), 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitNotes = doc.splitTextToSize(n(service.completionDetails.notes), doc.internal.pageSize.getWidth() - 28);
      doc.text(splitNotes, 14, currentY);
      
      currentY += splitNotes.length * 5 + 10;
    }

    const allNotes = [...(service.history || []), ...(service.futureNotes || [])].sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
    
    if (allNotes.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Historia i Notatki'), 14, currentY);
      currentY += 6;

      const historyRows = allNotes.map(h => {
        const d = safeParseDate(h.date || h.timestamp || h.createdAt);
        return [
          d ? d.toLocaleString('pl-PL') : '-',
          n(h.user || h.userName || h.author || h.createdBy || '-'),
          n(h.action || 'Notatka'),
          n(h.note || h.comment || h.text || '-')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Autor'), n('Akcja'), n('Szczegoly')]],
        body: historyRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      for (const h of allNotes) {
         if (h.photos && h.photos.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            const dStr = safeParseDate(h.date || h.timestamp || h.createdAt)?.toLocaleString('pl-PL') || '';
            doc.text(n(`Zdjecia z logu (${dStr}):`), 14, currentY);
            currentY += 8;
            
            let xOffset = 14;
            let maxHeightInRow = 0;
            for (const photoUrl of h.photos) {
              if (xOffset > 150) {
                 xOffset = 14;
                 currentY += maxHeightInRow + 5;
                 maxHeightInRow = 0;
                 if (currentY > 240) { doc.addPage(); currentY = 20; }
              }
              const photoData = await fetchPhotoData(photoUrl);
              if (photoData) {
                let pw = 60;
                let ph = (photoData.h / photoData.w) * pw;
                if (ph > 80) { ph = 80; pw = (photoData.w / photoData.h) * ph; }
                
                doc.addImage(photoData.b64, 'JPEG', xOffset, currentY, pw, ph, '', 'FAST');
                xOffset += pw + 10;
                if (ph > maxHeightInRow) maxHeightInRow = ph;
              }
            }
            currentY += maxHeightInRow + 10;
         }
      }
    }

    doc.save(n(`Serwis_${(service.machineName || '').replace(/\s+/g, '_')}_${(service.name || '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF serwisu:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};

```


=========================================
📄 PLIK: src\utils\reports\pdfTicketCard.js
=========================================

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64, getImageDimensions } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const STATUSES = {
  1: 'Otwarte',
  2: 'W trakcie',
  3: 'Oczekuje na czesci',
  4: 'Serwis Zewnetrzny',
  5: 'Zakonczone'
};

const fetchPhotoData = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const MAX = 800; // Zmniejszamy rozdzielczość dla mniejszego PDF i usuwamy metadane EXIF
        if (w > h && w > MAX) { h = (h / w) * MAX; w = MAX; }
        else if (h > w && h > MAX) { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ b64: canvas.toDataURL('image/jpeg', 0.85), w, h });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => resolve(null);
      img.src = objectUrl;
    });
  } catch (e) {
    return null;
  }
};

export const generateTicketPDF = async (ticket) => {
  if (!ticket) return;

  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      const maxSize = 24;
      let w = maxSize, h = maxSize;
      if (dims.width > dims.height) { h = (dims.height / dims.width) * maxSize; } 
      else { w = (dims.width / dims.height) * maxSize; }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Zgloszenia Awarii'), 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 50);
    doc.text(`T${ticket.id?.slice(0, 4).toUpperCase() || '1'} - ${n(STATUSES[ticket.status] || 'Nieznany')}`, 14, 30);

    let currentY = 45;

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Zgloszeniu'), '']],
      body: [
        [n('Maszyna:'), n(ticket.machineName || 'Nieznana')],
        [n('Lokalizacja:'), n(`${ticket.regionName || 'Brak'} ${ticket.bay ? '/ ' + ticket.bay : ''}`)],
        [n('Zglaszajacy:'), n(`${ticket.reportedBy || 'Nieznany'} ${ticket.reporterPhone ? '(' + ticket.reporterPhone + ')' : ''}`)],
        [n('Data Zgloszenia:'), safeParseDate(ticket.createdAt)?.toLocaleString('pl-PL') || '-'],
        [n('Priorytet:'), n(ticket.isCritical ? 'Krytyczny (Wysoki)' : 'Standardowy')],
        [n('Data Zamkniecia:'), ticket.closedAt ? safeParseDate(ticket.closedAt)?.toLocaleString('pl-PL') : '-'],
        [n('Wykonawca (Zamykajacy):'), n(ticket.completedBy || ticket.assignedTo || '-')],
      ],
      theme: 'grid',
      headStyles: { fillColor: [60, 100, 180] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Temat: ' + (ticket.topic || 'Brak')), 14, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(n(ticket.description || 'Brak opisu...'), doc.internal.pageSize.getWidth() - 28);
    doc.text(splitDescription, 14, currentY);
    
    currentY += splitDescription.length * 5 + 10;

    // Zdjęcia z awarii (główne zgłoszenie)
    if (ticket.photos && ticket.photos.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Zdjecia zgloszenia:'), 14, currentY);
      currentY += 10;
      
      let xOffset = 14;
      let maxHeightInRow = 0;
      for (const photoUrl of ticket.photos) {
        if (xOffset > 150) {
           xOffset = 14;
           currentY += maxHeightInRow + 5;
           maxHeightInRow = 0;
           if (currentY > 240) { doc.addPage(); currentY = 20; }
        }
        
        const photoData = await fetchPhotoData(photoUrl);
        if (photoData) {
          let pw = 60; // Średnia wielkość
          let ph = (photoData.h / photoData.w) * pw;
          if (ph > 80) { ph = 80; pw = (photoData.w / photoData.h) * ph; }
          
          doc.addImage(photoData.b64, 'JPEG', xOffset, currentY, pw, ph, '', 'FAST');
          xOffset += pw + 10;
          if (ph > maxHeightInRow) maxHeightInRow = ph;
        } else {
          doc.setFontSize(9);
          doc.text(n('[Zdjecie niedostepne - blokada CORS]'), xOffset, currentY + 10);
          xOffset += 60;
          if (20 > maxHeightInRow) maxHeightInRow = 20;
        }
      }
      currentY += maxHeightInRow + 15;
    }

    if (ticket.history && ticket.history.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Historia i Notatki'), 14, currentY);
      currentY += 6;

      const historyRows = [...ticket.history].reverse().map(h => {
        const d = safeParseDate(h.date || h.timestamp || h.createdAt);
        return [
          d ? d.toLocaleString('pl-PL') : '-',
          n(h.user || h.userName || h.author || '-'),
          n(h.action || '-'),
          n(h.note || h.comment || '-')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Autor'), n('Akcja'), n('Szczegoly / Notatka')]],
        body: historyRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Zdjęcia w historii
      for (const h of [...ticket.history].reverse()) {
         if (h.photos && h.photos.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            const dStr = safeParseDate(h.date || h.timestamp || h.createdAt)?.toLocaleString('pl-PL') || '';
            doc.text(n(`Zdjecia z notatki (${dStr}):`), 14, currentY);
            currentY += 8;
            
            let xOffset = 14;
            let maxHeightInRow = 0;
            for (const photoUrl of h.photos) {
              if (xOffset > 150) {
                 xOffset = 14;
                 currentY += maxHeightInRow + 5;
                 maxHeightInRow = 0;
                 if (currentY > 240) { doc.addPage(); currentY = 20; }
              }
              const photoData = await fetchPhotoData(photoUrl);
              if (photoData) {
                let pw = 60;
                let ph = (photoData.h / photoData.w) * pw;
                if (ph > 80) { ph = 80; pw = (photoData.w / photoData.h) * ph; }
                
                doc.addImage(photoData.b64, 'JPEG', xOffset, currentY, pw, ph, '', 'FAST');
                xOffset += pw + 10;
                if (ph > maxHeightInRow) maxHeightInRow = ph;
              }
            }
            currentY += maxHeightInRow + 10;
         }
      }
    }

    doc.save(n(`Zgloszenie_T${ticket.id?.slice(0, 4).toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF zgłoszenia:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};

```


=========================================
📄 PLIK: package.json
=========================================

```
{
  "name": "crist-awarie",
  "homepage": "https://piotrpallach1985-coder.github.io/Serwis-CRIST",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "firebase": "^10.8.0",
    "html5-qrcode": "^2.3.8",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.8",
    "jsqr": "^1.4.0",
    "lucide-react": "^0.344.0",
    "qrcode.react": "^4.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.39.5",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.1.1",
    "gh-pages": "^6.3.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4",
    "vite-plugin-pwa": "^1.3.0"
  }
}

```


=========================================
📄 PLIK: firestore.rules
=========================================

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- FUNKCJE POMOCNICZE ---
    function isSignedIn() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && getUserData().role == 'admin';
    }

    // 1. ZGŁASZAJĄCY (Pracownicy)
    match /reporters/{document=**} {
      allow read: if true;
      allow create: if isSignedIn() || (
        request.resource.data.name is string 
        && request.resource.data.name.size() >= 3 
        && request.resource.data.name.size() <= 80
      );
      allow update, delete: if isSignedIn();
    }

    // 2. MASZYNY
    match /machines/{document=**} {
      allow read: if true;
      
      // Zalogowany tworzy dowolnie, niezalogowany operator podlega restrykcjom:
      allow create: if isSignedIn() || (
        request.resource.data.name is string
        && request.resource.data.name.size() >= 3
        && request.resource.data.name.size() <= 120
        && request.resource.data.name.matches('.*\\(DO WERYFIKACJI\\).*')
        && (!('xPercent' in request.resource.data) || request.resource.data.xPercent == null)
        && (!('yPercent' in request.resource.data) || request.resource.data.yPercent == null)
      );
                    
      allow update, delete: if isSignedIn();
    }

    // 3. ZGŁOSZENIA AWARII (Tickets) - ZERO WYCIEKU
    match /tickets/{ticketId} {
      // Tylko zalogowany personel widzi historię awarii
      allow read: if isSignedIn();   
      // Niezalogowany może TYLKO wrzucić zgłoszenie (jak do skrzynki)
      allow create: if true;          
      // Zezwól na dopisanie zdjęć przez system offline sync (OfflineSyncManager), blokując modyfikację innych pól
      allow update: if isSignedIn() || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['photos']);
      allow delete: if isSignedIn();
    }

    // 4. SŁOWNIKI PUBLICZNE (Odczyt dla formularza, edycja dla zalogowanych)
    match /regions/{document=**} {
      allow read: if true;
      allow write: if isSignedIn();
    }
    match /topics/{document=**} {
      allow read: if true;
      allow write: if isSignedIn();
    }
    match /services/{document=**} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // 5. POWIADOMIENIA (Operator wysyła, zalogowany zarządza)
    match /notifications/{document=**} {
      allow read: if isSignedIn();
      allow create: if true;
      allow update, delete: if isSignedIn();
    }

    // 6. MODUŁY KRYTYCZNE / ADMIN (Tylko rola 'admin' może modyfikować)
    match /users/{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    match /roles/{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    match /settings/{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // 7. ZADANIA I SERWISY PLANOWANE (Zalogowany personel)
    match /planned_services/{document=**} {
      allow read, write: if isSignedIn();
    }
    match /action_items/{document=**} {
      allow read, write: if isSignedIn();
    }
  }
}
```
