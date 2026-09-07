import { useManagerContext } from '../../context/ManagerDataContext';
import { useState, useEffect } from 'react';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { QRCodeSVG } from 'qrcode.react';

import MachineDetails from './MachineDetails';
import MachineForm from './MachineForm';
import MachineCard from './MachineCard';
import ConfirmModal from './ConfirmModal';
import QRScannerModal from '../shared/QRScannerModal';
import Toast from './Toast';
import { useMachines } from '../../hooks/useMachines';

export default function Machines({ user, onOpenTicket, onOpenService }) {
  const { tickets, machines, reporters, services, plannedServices, notifications, actionItems, roles, regions, allowTicketDeletion, plannedWarningDays, branding } = useManagerContext();

  const { searchQuery, setSearchQuery, filterRegion, setFilterRegion, filteredMachines, handleExportExcel } = useMachines(machines, regions);
  
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [qrModalMachine, setQrModalMachine] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Tak' });
  const [initialOpenProcessed, setInitialOpenProcessed] = useState(false);

  useEffect(() => {
    if (!initialOpenProcessed && machines.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const openMachineId = params.get('openMachine');
      if (openMachineId) {
        const targetMachine = machines.find(m => m.id === openMachineId);
        if (targetMachine) {
          handleViewMachine(targetMachine, true);
        }
      }
      setInitialOpenProcessed(true);
    }
  }, [machines, initialOpenProcessed]);

  const showToast = (message, type = 'success') => setToastConfig({ message, type });
  const closeConfirmModal = () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleDeleteMachine = (id, name) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Potwierdź usunięcie maszyny',
      message: `Czy na pewno chcesz usunąć maszynę "${name}"? Tej operacji nie można cofnąć (maszyna zostanie oznaczona jako usunięta).`,
      confirmText: 'Usuń maszynę',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'machines', id), { isDeleted: true, deletedAt: serverTimestamp() });
          showToast('Maszyna usunięta z widoku');
          if (selectedMachine?.id === id) setSelectedMachine(null);
        } catch (err) {
          showToast('Błąd: ' + err.message, 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleVerifyMachine = async (id, name) => {
    try {
      const cleanName = name.replace('(DO WERYFIKACJI)', '').trim();
      await updateDoc(doc(db, 'machines', id), { name: cleanName });
      showToast('Maszyna zweryfikowana.');
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handlePrint = (id, name) => {
    const svgElement = document.getElementById(`qr-svg-${id}`);
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Drukuj QR - ${name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .qr-container { text-align: center; border: 2px dashed #ccc; padding: 20px; border-radius: 10px; }
            h2 { margin: 10px 0 5px; font-size: 24px; }
            p { margin: 0; color: #555; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <h2>${name}</h2>
            <p>ID: ${id}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleViewMachine = async (m, fromQR = false) => {
    setSelectedMachine(m);
    setIsFromQRScan(fromQR);
    setLoadingHistory(true);
    try {
      // 1. Pobierz wszystkie zgłoszenia powiązane z tą maszyną (włącznie ze statusem 5 / archiwalnymi)
      const qTicketsById = query(collection(db, 'tickets'), where('machineId', '==', m.id));
      const snapTickets = await getDocs(qTicketsById);
      let machineTickets = snapTickets.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);

      // Sprawdź powiązania po nazwie maszyny (obsługa wariantów z dopiskiem i bez dopisku np. "(DO WERYFIKACJI)")
      const cleanName = m.name ? m.name.replace(/\s*\(DO WERYFIKACJI\)/gi, '').trim() : '';
      if (cleanName) {
        const qTicketsByName = query(collection(db, 'tickets'), where('machineName', '==', m.name));
        const snapByName = await getDocs(qTicketsByName);
        const byNameDocs = snapByName.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);

        let byCleanDocs = [];
        if (cleanName !== m.name) {
          const qTicketsByClean = query(collection(db, 'tickets'), where('machineName', '==', cleanName));
          const snapByClean = await getDocs(qTicketsByClean);
          byCleanDocs = snapByClean.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.isDeleted);
        }

        const ticketMap = new Map();
        machineTickets.forEach(t => ticketMap.set(t.id, t));
        byNameDocs.forEach(t => ticketMap.set(t.id, t));
        byCleanDocs.forEach(t => ticketMap.set(t.id, t));
        machineTickets = Array.from(ticketMap.values());
      }

      // Sortuj zgłoszenia od najnowszych
      machineTickets.sort((a, b) => {
        const dA = safeParseDate(a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

      // 2. Pobierz wszystkie serwisy powiązane z tą maszyną (włącznie ze statusem 'completed')
      const qServices = query(collection(db, 'planned_services'), where('machineId', '==', m.id));
      const snapServices = await getDocs(qServices);
      let machineServices = snapServices.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.isDeleted);

      // Sortuj serwisy od najnowszych
      machineServices.sort((a, b) => {
        const dA = safeParseDate(a.completedAt || a.nextDate || a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.completedAt || b.nextDate || b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

      setMachineHistory({ tickets: machineTickets, services: machineServices });
    } catch (err) {
      console.error("Błąd pobierania historii maszyny z Firestore:", err);
      // Fallback do danych lokalnych z kontekstu
      const relatedTickets = tickets.filter(t => t.machineId === m.id || (t.machineName && m.name && t.machineName.toLowerCase().includes(m.name.toLowerCase())));
      setMachineHistory({ tickets: relatedTickets, services: plannedServices.filter(s => s.machineId === m.id) });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleScanSuccess = (decoded) => {
    setIsScanning(false);
    if (!decoded) {
      showToast('Błąd odczytu QR: brak danych.', 'error');
      return;
    }

    let machineId = typeof decoded === 'string' ? decoded.trim() : String(decoded);
    if (machineId.includes('?machine=')) {
      try {
        const queryPart = machineId.split('?')[1];
        const urlParams = new URLSearchParams(queryPart);
        machineId = urlParams.get('machine') || machineId;
      } catch (e) {}
    } else if (machineId.startsWith('http://') || machineId.startsWith('https://')) {
      try {
        const parsedUrl = new URL(machineId);
        machineId = parsedUrl.searchParams.get('machine') || machineId;
      } catch (e) {}
    }

    const found = machines.find(m =>
      m.id === machineId ||
      (m.qrCode && m.qrCode === machineId) ||
      (m.internalId && m.internalId.toLowerCase() === machineId.toLowerCase())
    );

    if (found) {
      handleViewMachine(found, true);
      showToast(`Wczytano maszynę: ${found.name}`, 'success');
    } else {
      showToast('Nie znaleziono maszyny z tego kodu QR.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title="Skanuj kod QR (Baza Urządzeń)"
        subtitle="Skieruj aparat na kod QR maszyny, aby otworzyć jej detale."
      />
      {selectedMachine ? (
        <MachineDetails
          machine={selectedMachine}
          history={machineHistory}
          loading={loadingHistory}
          isFromQR={isFromQRScan}
          onScanNext={() => setIsScanning(true)}
          onBack={() => { setSelectedMachine(null); setIsFromQRScan(false); }}
          onPrint={handlePrint}
          onGeneratePDF={generateMachineHistoryPDF}
          regions={regions}
          user={user}
          onOpenTicket={onOpenTicket}
          onOpenService={onOpenService}
          onEdit={() => { setSelectedMachine(null); setEditingId(selectedMachine.id); setIsFormOpen(true); }}
          onDelete={() => handleDeleteMachine(selectedMachine.id, selectedMachine.name)}
        />
      ) : (
        <>


          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Rejestr Urządzeń</h2>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj maszynami i generuj kody QR</p>
            </div>
            <button onClick={() => { setEditingId(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
              <i className="ph ph-plus text-lg"></i> Dodaj Maszynę
            </button>
          </div>

          <MachineForm 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
            regions={regions}
            onSaved={showToast}
            onError={(err) => showToast(err, 'error')}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input type="text" placeholder="Szukaj (nazwa, nr wew)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all shadow-sm" />
                </div>
                <div className="relative w-full sm:w-48">
                  <i className="ph ph-funnel absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 appearance-none shadow-sm cursor-pointer">
                    <option value="">Wszystkie Rejony</option>
                    <option value="bez_rejonu">Bez rejonu</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setIsScanning(true)} className="flex-1 md:flex-none bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                  <i className="ph ph-qr-code text-lg"></i> Skanuj
                </button>
                <button onClick={handleExportExcel} className="flex-1 md:flex-none bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                  <i className="ph ph-file-xls text-lg"></i> Excel
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:hidden">
                {filteredMachines.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">Brak maszyn spełniających kryteria.</div>
                ) : (
                  filteredMachines.map(m => (
                    <MachineCard key={m.id} machine={m} regions={regions} onClick={handleViewMachine} />
                  ))
                )}
              </div>
              <table className="w-full text-left hidden lg:table border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm">
                    <th className="px-6 py-3 border-b">Nazwa Maszyny</th>
                    <th className="px-6 py-3 border-b">Nr wew. / Opis</th>
                    <th className="px-6 py-3 border-b">Rejon / Hala</th>
                    <th className="px-6 py-3 border-b text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">Brak maszyn spełniających kryteria.</td></tr>
                  ) : (
                    filteredMachines.map(m => (
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
                          {m.bay && ` / ${m.bay}`}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => handleViewMachine(m)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm">
                              Szczegóły <i className="ph ph-caret-right"></i>
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
        </>
      )}

      {toastConfig.message && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig({ message: '', type: 'success' })} />}
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </div>
  );
}
