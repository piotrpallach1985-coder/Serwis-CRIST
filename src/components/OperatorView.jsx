import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function OperatorView({ user, onLogout, initialMachineId, onSwitchView }) {
  const [machines, setMachines] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [step, setStep] = useState('scan'); // 'scan', 'form', 'success'
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Do debuggowania na telefonie

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
  const [topicMode, setTopicMode] = useState('select'); // 'select' lub 'manual'
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  // Pobieranie maszyn i tematów
  useEffect(() => {
    let unsubscribeMachines = () => {};
    let unsubscribeTopics = () => {};
    try {
      unsubscribeMachines = onSnapshot(collection(db, "machines"), async (querySnapshot) => {
        const machinesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMachines(machinesData);

        if (initialMachineId && step === 'scan') {
          const targetMachine = machinesData.find(m => m.id === initialMachineId);
          if (targetMachine) {
            setSelectedMachine(targetMachine);
            setStep('form');
          } else {
            const docRef = doc(db, "machines", initialMachineId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setSelectedMachine({ id: docSnap.id, ...docSnap.data() });
              setStep('form');
            }
          }
        }
      }, (error) => {
        console.error("Błąd nasłuchu maszyn:", error);
        setErrorMsg("Błąd połączenia z bazą maszyn: " + error.message);
      });

      unsubscribeTopics = onSnapshot(collection(db, "topics"), (querySnapshot) => {
        setTopicsList(querySnapshot.docs.map(d => d.data().text));
      });
    } catch (error) {
      console.error("Błąd inicjalizacji:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    }
    return () => {
      unsubscribeMachines();
      unsubscribeTopics();
    };
  }, [initialMachineId]);

  // Inicjalizacja skanera wbudowanego w aplikację
  useEffect(() => {
    if (step === 'scan' && !initialMachineId) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          let machineId = decodedText;
          if (decodedText.includes('?machine=')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            machineId = urlParams.get('machine');
          }
          const foundMachine = machines.find(m => m.id === machineId);
          if (foundMachine) {
            setSelectedMachine(foundMachine);
            setStep('form');
          } else {
            alert('Nie znaleziono maszyny o tym kodzie w bazie.');
            setStep('scan');
          }
        },
        (error) => {
          // ignorujemy błędy skanowania klatki
        }
      );

      return () => {
        scanner.clear().catch(err => console.error(err));
      };
    }
  }, [step, machines, initialMachineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Zapobieganie dublowaniu
    
    if (selectedMachine.id === 'manual' && (!selectedMachine.name || !selectedMachine.name.trim())) {
      return alert('Podaj nazwę maszyny!');
    }
    if (!topic || !description || !reporterName.trim() || !reporterPhone.trim()) {
      return alert('Wypełnij wszystkie wymagane pola (Imię, Telefon, Temat, Opis)!');
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      let finalMachineId = selectedMachine.id;
      
      if (finalMachineId === 'manual') {
        const newMachineRef = doc(collection(db, 'machines'));
        await setDoc(newMachineRef, {
          name: selectedMachine.name,
          department: 'Dodana z palca',
          bay: '',
          createdAt: new Date().toISOString()
        });
        finalMachineId = newMachineRef.id;
      }

      const ticketRef = doc(collection(db, 'tickets'));
      await setDoc(ticketRef, {
        machineId: finalMachineId,
        machineName: selectedMachine.name,
        department: selectedMachine.department || '',
        bay: selectedMachine.bay || '',
        topic,
        description,
        isCritical,
        reportedBy: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
        updates: [{
          timestamp: new Date().toISOString(),
          status: 'new',
          comment: 'Zgłoszenie awarii w systemie.',
          author: reporterName.trim()
        }]
      });

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

      // Natychmiastowe przejście do ekranu sukcesu
      setStep('success');
    } catch (error) {
      console.error("Szczegóły błędu Firebase:", error);
      setErrorMsg("Krytyczny błąd: " + error.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const resetFlow = () => {
    setTopic('');
    setDescription('');
    setIsCritical(false);
    setSelectedMachine(null);
    setErrorMsg(null);
    if (initialMachineId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setStep('scan');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Wskaźnik stanu sieci */}
      <div className={`w-full text-center text-xs font-bold py-1 text-white transition-colors ${isOnline ? 'bg-green-600' : 'bg-orange-500'}`}>
        {isOnline ? 'Połączono z serwerem (Online)' : 'Brak internetu - praca w trybie Offline'}
      </div>

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
            <h2 className="text-xl font-semibold mb-4">Nakieruj aparat na kod QR maszyny</h2>
            <div id="qr-reader" className="mx-auto overflow-hidden rounded-lg border-2 border-dashed border-gray-300 w-full max-w-md"></div>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Lub wybierz maszynę ręcznie</h3>
              <select 
                className="w-full max-w-md mx-auto block p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none bg-white text-left"
                onChange={(e) => {
                  const val = e.target.value;
                  
                  if (val === 'manual') {
                    setSelectedMachine({ id: 'manual', name: '', department: 'Wpisano ręcznie' });
                    setStep('form');
                  } else if (val !== '') {
                    const m = machines.find(machine => machine.id === val);
                    if (m) {
                      setSelectedMachine(m);
                      setStep('form');
                    }
                  }
                }}
                value=""
              >
                <option value="" disabled>Wybierz z listy...</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.department ? `(${m.department})` : ''}
                  </option>
                ))}
                <option value="manual" className="font-bold text-blue-900">
                  + Inna maszyna (wpisz ręcznie)...
                </option>
              </select>
              <p className="text-sm text-gray-400 mt-2">
                Użyj tej opcji, jeśli kod QR jest zniszczony lub nieczytelny.
              </p>
            </div>
          </div>
        )}

        {step === 'form' && selectedMachine && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <div className="flex-1 mr-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wybrana maszyna</span>
                {selectedMachine.id === 'manual' ? (
                  <input 
                    type="text" 
                    value={selectedMachine.name} 
                    onChange={(e) => setSelectedMachine({...selectedMachine, name: e.target.value})} 
                    className="w-full mt-1 p-2 border border-blue-300 rounded font-bold text-lg focus:outline-none focus:border-blue-900" 
                    placeholder="Wpisz nazwę maszyny..." 
                    autoFocus
                  />
                ) : (
                  <div className="font-bold text-lg text-gray-800 break-words">{selectedMachine.name}</div>
                )}
              </div>
              {!initialMachineId && (
                <button onClick={() => setStep('scan')} className="text-blue-600 text-sm hover:underline whitespace-nowrap">Zmień</button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 pb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Imię i Nazwisko Zgłaszającego <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. Jan Kowalski"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Numer Telefonu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={e => setReporterPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="np. 500 600 700"
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
              <button 
                type="submit" 
                disabled={loading || !isOnline} 
                className={`w-full font-bold py-4 rounded text-lg transition-colors flex items-center justify-center gap-2 ${
                  loading ? 'bg-blue-400 text-white cursor-not-allowed' : 
                  !isOnline ? 'bg-orange-500 hover:bg-orange-600 text-white' : 
                  'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {loading ? (
                  <><i className="ph ph-spinner animate-spin text-2xl"></i> Zapisywanie...</>
                ) : !isOnline ? (
                  <><i className="ph ph-wifi-slash text-xl"></i> Oczekuję na zasięg...</>
                ) : (
                  <><i className="ph ph-paper-plane-tilt text-xl"></i> Wyślij zgłoszenie</>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner">
              <i className="ph ph-check text-4xl text-green-600 animate-bounce"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Zgłoszenie pomyślnie wysłane!</h2>
            <p className="text-gray-500 mb-6">Dziękujemy, zespół UR został już powiadomiony.</p>
            <button onClick={resetFlow} className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded transition-colors shadow-sm">
              Zgłoś kolejną awarię
            </button>
          </div>
        )}
      </main>
    </div>
  );
}