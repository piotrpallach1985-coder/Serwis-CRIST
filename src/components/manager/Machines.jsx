import { useState, useEffect } from 'react';
import { exportToExcel } from '../../utils/reports/excelExport';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { QRCodeSVG } from 'qrcode.react';
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

  
  const handleExportExcel = () => {
    const filteredMachines = machines.filter(m => {
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

  const handleDownloadPDF = (machine) => {
    const mTickets = tickets.filter(t => t.machineId === machine.id);
    const mServices = plannedServices.filter(s => s.machineId === machine.id);
    generateMachineHistoryPDF(machine, mTickets, mServices);
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
          const plannedPromises = plannedSnapshot.docs.map(planDoc => deleteDoc(doc(db, 'planned_services', planDoc.id)));
          await Promise.all(plannedPromises);

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
          {editingId ? 'Edytuj maszynę' : 'Dodaj nową maszynę i wygeneruj kod QR'}
        </h2>
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
          <div className="flex justify-end gap-2">
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setBay('');
                  setRegionId('');
                  setInternalId('');
                  setAdditionalDescription('');
                }}
                className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded hover:bg-gray-300"
              >
                Anuluj
              </button>
            )}
            <button type="submit" disabled={loading} className="bg-blue-900 text-white font-semibold py-2 px-6 rounded hover:bg-blue-800">
              {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj')}
            </button>
          </div>
        </form>
      </div>

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
                <th className="px-6 py-3 border-b">Kod QR</th>
                <th className="px-6 py-3 border-b text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredMachines = machines.filter(m => {
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
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
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
                        <button 
                          onClick={() => setQrModalMachine(m)}
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm"
                          title="Kliknij, aby podglądnąć kod QR"
                        >
                          <i className="ph ph-qr-code text-xl"></i>
                          <span>Pokaż QR</span>
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(m)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm"
                          title="Generuj Kartę Maszyny w PDF"
                        >
                          <i className="ph ph-file-pdf text-xl"></i>
                          <span>Karta PDF</span>
                        </button>
                        
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEdit(m)}
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-2 px-4 rounded transition-colors"
                          >
                            <i className="ph ph-pencil-simple"></i>
                            Edytuj
                          </button>
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