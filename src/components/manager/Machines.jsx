import { useManagerStore } from '../../store/managerStore';

import { useState, useEffect } from 'react';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';
import { QRCodeSVG } from 'qrcode.react';

import MachineDetails from './MachineDetails';
import MachineFilters from './MachineFilters';
import MachineTable from './MachineTable';
import MachineForm from './MachineForm';
import MachineCard from './MachineCard';
import ConfirmModal from './ConfirmModal';
import QRScannerModal from '../shared/QRScannerModal';
import Toast from './Toast';
import { useMachines } from '../../hooks/useMachines';
import DebouncedInput from './DebouncedInput';
import { useToast } from '../../hooks/useToast';
import { useConfirmModal } from '../../hooks/useConfirmModal';

export default function Machines({ user, onOpenTicket, onOpenService, initialMachineId, onClearMachineId }) {
  const tickets = useManagerStore(state => state.tickets);
  const machines = useManagerStore(state => state.machines);
  const reporters = useManagerStore(state => state.reporters);
  const services = useManagerStore(state => state.services);
  const plannedServices = useManagerStore(state => state.plannedServices);
  const notifications = useManagerStore(state => state.notifications);
  const actionItems = useManagerStore(state => state.actionItems);
  const roles = useManagerStore(state => state.roles);
  const regions = useManagerStore(state => state.regions);
  const allowTicketDeletion = useManagerStore(state => state.allowTicketDeletion);
  const plannedWarningDays = useManagerStore(state => state.plannedWarningDays);
  const branding = useManagerStore(state => state.branding);

  const [editingId, setEditingId] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { searchQuery, setSearchQuery, filterRegion, setFilterRegion, filteredMachines, handleExportExcel } = useMachines(machines, regions, showDeleted);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [qrModalMachine, setQrModalMachine] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const { toastConfig, showToast, hideToast } = useToast();
  const { confirmConfig: confirmModalConfig, showConfirm, hideConfirm: closeConfirmModal, setConfirmConfig: setConfirmModalConfig } = useConfirmModal();
  const [initialOpenProcessed, setInitialOpenProcessed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRegion]);

  const currentItems = filteredMachines.slice(0, currentPage * itemsPerPage);
  const hasMoreLocalItems = currentItems.length < filteredMachines.length;

  useEffect(() => {
    if (initialMachineId && machines.length > 0) {
      const targetMachine = machines.find(m => m.id === initialMachineId);
      if (targetMachine) {
        handleViewMachine(targetMachine, true);
        if (onClearMachineId) onClearMachineId();
      }
    }
  }, [initialMachineId, machines, onClearMachineId]);  useEffect(() => {
    if (!initialOpenProcessed && machines.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const openMachineId = params.get('openMachine');
      if (openMachineId) {
        const targetMachine = machines.find(m => m.id === openMachineId);
        if (targetMachine) {
          handleViewMachine(targetMachine, true);
        }
        params.delete('openMachine');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState(window.history.state, '', newUrl);
      }
      setInitialOpenProcessed(true);
    }
  }, [machines, initialOpenProcessed]);



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
          machine={machines.find(m => m.id === selectedMachine.id) || selectedMachine}
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


                    <MachineFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterRegion={filterRegion}
            setFilterRegion={setFilterRegion}
            regions={regions}
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
            onAddMachine={() => { setEditingId(null); setIsFormOpen(true); }}
          />
          <MachineForm 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
            regions={regions}
            onSaved={showToast}
            onError={(err) => showToast(err, 'error')}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setIsScanning(true)} className="flex-1 md:flex-none bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                  <i className="ph ph-qr-code text-lg"></i> Skanuj
                </button>
                <button onClick={handleExportExcel} className="flex-1 md:flex-none bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                  <i className="ph ph-file-xls text-lg"></i> Excel
                </button>
              </div>
            </div>
            <MachineTable
              filteredMachines={filteredMachines}
              currentItems={currentItems}
              regions={regions}
              handleViewMachine={handleViewMachine}
            />
          </div>
        </>
      )}

      {toastConfig.show && <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />}
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </div>
  );
}
