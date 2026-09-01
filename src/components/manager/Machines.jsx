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

export default function Machines({ tickets = [], plannedServices = [], user }) {
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
  const [initialOpenProcessed, setInitialOpenProcessed] = useState(false);

  useEffect(() => {
    if (!initialOpenProcessed && machines.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const openMachineId = params.get('openMachine');
      if (openMachineId) {
        const targetMachine = machines.find(m => m.id === openMachineId);
        if (targetMachine) {
          handleViewMachine(targetMachine);
        }
      }
      setInitialOpenProcessed(true);
    }
  }, [machines, initialOpenProcessed]);
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
    }).sort((a, b) => {
      const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
      const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
      if (aVerify && !bVerify) return -1;
      if (!aVerify && bVerify) return 1;
      return (a.name || '').localeCompare(b.name || '');
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
      <>
        <MachineDetails 
            machine={selectedMachine} 
            user={user} 
        onEdit={() => handleEdit(selectedMachine)}
        onDelete={() => handleDelete(selectedMachine.id, selectedMachine.name)} 
        history={machineHistory} 
        loading={loadingHistory} 
        regions={regions}
        onBack={() => setSelectedMachine(null)} 
        onPrint={handlePrint} 
        onGeneratePDF={() => handleDownloadPDF(selectedMachine, machineHistory)} 
      />
        
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
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
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa maszyny</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" placeholder="np. Suwnica S-01" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Dodatkowy opis awaryjny (Opcjonalnie)</label>
                  <textarea value={additionalDescription} onChange={(e) => setAdditionalDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none resize-y min-h-[80px]" placeholder="Opis pomocniczy widoczny dla pracowników..."></textarea>
                  <p className="text-xs text-gray-400 mt-1">Ten opis będzie widoczny pod nazwą maszyny, może pomóc w dokładniejszej identyfikacji.</p>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
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
                  <button disabled={loading} type="submit" className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 min-w-[150px] shadow-sm">
                    {loading ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-check font-bold"></i>}
                    {editingId ? 'Zapisz zmiany' : 'Dodaj maszynę'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModalConfig.confirmText}
      />
      {toastConfig.message && (
        <Toast 
          message={toastConfig.message} 
          type={toastConfig.type} 
          onClose={() => setToastConfig({ message: '', type: 'success' })} 
        />
      )}

      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Rejestr Maszyn</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj maszynami i generuj kody QR</p>
        </div>
        <button onClick={() => { 
          setEditingId(null); 
          setName(''); setBay(''); setRegionId(''); setInternalId(''); setAdditionalDescription(''); 
          setIsFormOpen(true); 
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
          <i className="ph ph-plus text-lg"></i> Dodaj Maszynę
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
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
            <button disabled={loading} type="submit" className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 min-w-[150px] shadow-sm">
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
              className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-green-200 transition-colors"
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
        <div className="overflow-x-auto w-full">
<div className="lg:hidden flex flex-col gap-1.5 p-2">
    {(() => {
    const filteredMachines = machines.filter(m => !m.isDeleted).filter(m => {
        const queryLower = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(queryLower) || (m.internalId && m.internalId.toLowerCase().includes(queryLower));
        const matchRegion = filterRegion ? m.regionId === filterRegion : true;
        return matchName && matchRegion;
    }).sort((a, b) => {
      const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
      const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
      if (aVerify && !bVerify) return -1;
      if (!aVerify && bVerify) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    return filteredMachines.length === 0 ? (
      <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak maszyn.</div>
    ) : (
      filteredMachines.map(m => {
        const baseUrl = window.location.origin + window.location.pathname;
        const qrValue = `${baseUrl}?machine=${m.id}`;
        const isVerifying = m.name.includes('(DO WERYFIKACJI)');
        
        return (
          <div key={m.id} onClick={() => handleViewMachine(m)} className={`cursor-pointer bg-white p-2 rounded-lg shadow-sm border flex flex-col relative transition-colors hover:bg-slate-50 ${isVerifying ? 'border-orange-500 border-l-4' : 'border-slate-200 border-l-4 border-l-[#002b5e]'}`}>
            {isVerifying && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-2.5 py-1 rounded-tr-xl rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 shadow-sm">
                WERYFIKACJA
              </div>
            )}
            
            <div className="pt-1">
              <h4 className="font-bold text-[#002b5e] text-base leading-tight mb-1">{m.name}</h4>
              <p className="text-xs font-mono text-gray-400 mb-1">ID: {m.id}</p>
              
              <div className="text-sm font-semibold text-slate-700 mb-2">
                Nr wew: {m.internalId || '-'}
              </div>
              
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1"><i className="ph ph-map-pin"></i> Rejon: {regions.find(r => r.id === m.regionId)?.name || '-'}</div>
                <div className="flex items-center gap-1"><i className="ph ph-door-open"></i> Hala/Przelot: {m.bay || '-'}</div>
                <div className="flex items-center gap-1"><i className="ph ph-hourglass"></i> RBG: {m.currentWorkHours || 0}</div>
              </div>
            </div>
            
            <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(m); }} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-pencil-simple text-sm"></i> Edytuj</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id, m.name); }} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-trash text-sm"></i> Usuń</button>
              </div>
          </div>
        );
      })
    )})()}
  </div>
  <table className="w-full text-left hidden lg:table border-collapse">
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
    }).sort((a, b) => {
      const aVerify = (a.name || '').includes('(DO WERYFIKACJI)');
      const bVerify = (b.name || '').includes('(DO WERYFIKACJI)');
      if (aVerify && !bVerify) return -1;
      if (!aVerify && bVerify) return 1;
      return (a.name || '').localeCompare(b.name || '');
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
                        <div className="flex gap-1.5 justify-end">
            <button 
              onClick={() => handleViewMachine(m)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
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
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-gray-800">Kod QR Maszyny</h3>
              <button 
                onClick={() => setQrModalMachine(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ph ph-x text-xl font-bold"></i>
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 inline-block mb-2 shadow-inner">
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
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