import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [name, setName] = useState('');
  const [bay, setBay] = useState('');
  const [regionId, setRegionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrModalMachine, setQrModalMachine] = useState(null);

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
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubRegions = onSnapshot(collection(db, "regions"), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubMachines();
      unsubRegions();
    };
  }, []);

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!name.trim() || !bay.trim() || !regionId) {
      return showToast('Proszę wypełnić wszystkie pola.', 'error');
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'machines'), {
        name: name.trim(),
        bay: bay.trim(),
        regionId: regionId
      });
      setName('');
      setBay('');
      setRegionId('');
      showToast('Maszyna została dodana pomyślnie.');
    } catch (error) {
      console.error('Błąd dodawania maszyny:', error);
      showToast('Nie udało się dodać maszyny.', 'error');
    }
    setLoading(false);
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
          
          // Następnie usuń samą maszynę
          await deleteDoc(doc(db, 'machines', id));
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Dodaj nową maszynę i wygeneruj kod QR
        </h2>
        <form onSubmit={handleAddMachine} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rejon / Numer Hali</label>
            <select value={regionId} onChange={e => setRegionId(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none bg-white" required>
              <option value="">-- Wybierz Rejon --</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Przelot / Inf. dodatkowa</label>
            <input type="text" value={bay} onChange={(e) => setBay(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Przelot 2 / Magazyn" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa maszyny</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Suwnica S-01" required />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-900 text-white font-semibold py-2 px-6 rounded hover:bg-blue-800">
            {loading ? 'Dodawanie...' : 'Dodaj'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden m-6 mt-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Rejestr Maszyn</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {machines.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="px-6 py-3 border-b">Nazwa Maszyny</th>
                <th className="px-6 py-3 border-b">Rejon / Hala</th>
                <th className="px-6 py-3 border-b">Przelot / Inf.</th>
                <th className="px-6 py-3 border-b">Kod QR</th>
                <th className="px-6 py-3 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">Brak maszyn w bazie. Dodaj pierwszą powyżej.</td>
                </tr>
              ) : (
                machines.map(m => {
                  const baseUrl = window.location.origin + window.location.pathname;
                  const qrValue = `${baseUrl}?machine=${m.id}`;
                  return (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-800 text-base">{m.name}</div>
                        <div className="text-xs font-mono text-gray-400 mt-1">ID: {m.id}</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {regions.find(r => r.id === m.regionId)?.name || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {m.bay || '-'}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setQrModalMachine(m)}
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm"
                          title="Kliknij, aby podglądnąć kod QR"
                        >
                          <i className="ph ph-qr-code text-xl"></i>
                          <span>Pokaż QR</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handlePrint(m.id, m.name)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-semibold py-2 px-4 rounded transition-colors"
                          >
                            <i className="ph ph-printer"></i>
                            Drukuj
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id, m.name)}
                            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2 px-4 rounded transition-colors"
                            title="Usuń maszynę"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
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
    </div>
  );
}