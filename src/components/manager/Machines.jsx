import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import {  useManagerStore } from '../../store/managerStore';
import { useState, useEffect , useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, arrayUnion } from 'firebase/firestore';
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
import NFCScannerModal from '../shared/NFCScannerModal';
import Toast from './Toast';
import { useMachines } from '../../hooks/useMachines';
import { fetchMachineTickets } from '../../services/tickets.service';
import { fetchMachineServices } from '../../services/plannedServices.service';
import { usePagination } from '../../hooks/usePagination';
import DebouncedInput from './DebouncedInput';
import { useToast } from '../../hooks/useToast';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { getCurrentTenant } from '../../utils/tenantHelper';


export default function Machines({ onOpenTicket, onOpenService, initialMachineId, onClearMachineId }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

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
  
  const { searchQuery, setSearchQuery, filterRegion, setFilterRegion, filteredMachines, handleExportExcel } = useMachines(machines, regions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialParentId, setFormInitialParentId] = useState(null);
  const [qrModalMachine, setQrModalMachine] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineHistoryStack, setMachineHistoryStack] = useState([]);
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  
  const { toastConfig, showToast, hideToast } = useToast();
  const { confirmConfig: confirmModalConfig, showConfirm, hideConfirm: closeConfirmModal, setConfirmConfig: setConfirmModalConfig } = useConfirmModal();
  const [initialOpenProcessed, setInitialOpenProcessed] = useState(false);
  const { currentItems, hasMore: hasMoreLocalItems, setCurrentPage, loadMore } = usePagination(filteredMachines, 50, [searchQuery, filterRegion]);

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
      
      const openMachineId = searchParams.get('openMachine');
      if (openMachineId) {
        const targetMachine = machines.find(m => 
          m.id === openMachineId || 
          (m.qrCode && m.qrCode === openMachineId) || 
          (m.internalId && m.internalId.toLowerCase() === openMachineId.toLowerCase())
        );
        
        if (targetMachine) {
          handleViewMachine(targetMachine, true);
        } else {
          alert('Nie znaleziono zeskanowanej maszyny w bazie tej firmy.');
        }
        
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('openMachine');
          return newParams;
        }, { replace: true });
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
          const tenantId = getCurrentTenant();
          const batch = writeBatch(db);
          
          // 1. Maszyna
          const machineRef = doc(db, 'tenants', tenantId, 'machines', id);
          batch.update(machineRef, { isDeleted: true, deletedAt: serverTimestamp() });
          
          // 1a. Dzieci maszyny (Drzewo aktywów)
          const childMachines = machines.filter(m => m.parentId === id);
          childMachines.forEach(child => {
            const childRef = doc(db, 'tenants', tenantId, 'machines', child.id);
            batch.update(childRef, { parentId: null });
          });
          
          // 2. Aktywne zgłoszenia
          const ticketsQ = query(collection(db, 'tenants', tenantId, 'tickets'), where('machineId', '==', id));
          const ticketsSnapshot = await getDocs(ticketsQ);
          ticketsSnapshot.forEach(docSnap => {
              const status = docSnap.data().status;
              if (status == 5 || status == 'closed') return;
            batch.update(docSnap.ref, { 
              status: 5, // Zamknięte/Zarchiwizowane
              closedAt: new Date().toISOString(),
              history: arrayUnion({ action: 'Automatyczne zamknięcie', date: new Date().toISOString(), user: 'System', note: 'Maszyna została usunięta' })
            });
          });

          // 3. Aktywne serwisy
          const servicesQ = query(collection(db, 'tenants', tenantId, 'planned_services'), where('machineId', '==', id));
          const servicesSnapshot = await getDocs(servicesQ);
          servicesSnapshot.forEach(docSnap => {
              if (docSnap.data().status !== 'pending') return;
            batch.update(docSnap.ref, { 
              status: 'completed',
              completedAt: new Date().toISOString(),
              history: arrayUnion({ action: 'Automatyczne zamknięcie', date: new Date().toISOString(), user: 'System', note: 'Maszyna została usunięta' })
            });
          });

          await batch.commit();

          showToast('Maszyna i powiązane zadania zostały zarchiwizowane');
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
      await updateMachine(id, { name: cleanName });
      showToast('Maszyna zweryfikowana.');
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handlePrint = (machine) => {
      const id = machine.id;
      const name = machine.name;
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
              p { margin: 0; color: #555; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${svgData}
              <h2>${name}</h2>
              <p>Data: ${(() => {
                try {
                  const d = safeParseDate(machine.updatedAt || machine.qrCreatedAt || machine.createdAt) || new Date();
                  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                } catch(e) { return 'Brak danych'; }
              })()}</p>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    
    const handleCopyNfc = (machine) => {
      const baseUrl = window.location.origin;
      const currentTenantId = getCurrentTenant();
      const qrValue = `tenant=${currentTenantId}&machine=${machine.id}`;
      navigator.clipboard.writeText(qrValue)
        .then(() => showToast('Skopiowano ID maszyny do schowka (NFC)', 'success'))
        .catch(() => showToast('Błąd kopiowania do schowka', 'error'));
    };

    const handleGenerateNewQR = async (machineId) => {
      try {
        const machineRef = doc(db, 'tenants', getCurrentTenant(), 'machines', machineId);
        await updateDoc(machineRef, { qrCreatedAt: serverTimestamp() });
        showToast('Wygenerowano nowy kod QR', 'success');
      } catch (error) {
        showToast('Błąd generowania kodu QR', 'error');
      }
    };

    const handleViewMachine = async (m, fromQR = false, pushToHistory = false) => {
    if (pushToHistory && selectedMachine) {
      setMachineHistoryStack(prev => [...prev, selectedMachine]);
    } else if (!pushToHistory) {
      setMachineHistoryStack([]);
    }
    setSelectedMachine(m);
    setIsFromQRScan(fromQR);
    setLoadingHistory(true);
    try {
      let machineTickets = await fetchMachineTickets(m.id, m.name);
      
      // Sortuj zgloszenia od najnowszych
      machineTickets.sort((a, b) => {
        const dA = safeParseDate(a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

      // 2. Pobierz wszystkie serwisy
      let machineServices = await fetchMachineServices(m.id);
      
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

  const handleScanSuccess = (decoded, rawQr) => {
    setIsScanning(false);
    if (!decoded) {
      showToast('Błąd odczytu QR: brak danych.', 'error');
      return;
    }

    let machineId = typeof decoded === 'string' ? decoded.trim() : String(decoded);
    const originalRaw = rawQr || machineId;

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
      (m.qrCode && (m.qrCode === machineId || m.qrCode === originalRaw)) ||
      (m.internalId && m.internalId.toLowerCase() === machineId.toLowerCase())
    );

    if (found) {
      handleViewMachine(found, true);
      showToast('Wczytano maszyne: ' + found.name, 'success');
    } else {
      showToast('Nie znaleziono maszyny: ' + machineId, 'error');
    }
  };

  const handleBackMachine = () => {
    if (machineHistoryStack.length > 0) {
      const prevMachine = machineHistoryStack[machineHistoryStack.length - 1];
      setMachineHistoryStack(prev => prev.slice(0, -1));
      
      setSelectedMachine(prevMachine);
      setIsFromQRScan(false);
      setLoadingHistory(true);
      
      const fetchPrevHistory = async () => {
        try {
          const { fetchMachineTickets, fetchMachineServices } = await import('../../services/machines.service');
          let machineTickets = await fetchMachineTickets(prevMachine.id, prevMachine.name);
          let machineServices = await fetchMachineServices(prevMachine.id, prevMachine.name);
          setMachineHistory({ tickets: machineTickets, services: machineServices });
        } catch (error) {
          const tickets = useManagerStore.getState().tickets || [];
          const plannedServices = useManagerStore.getState().plannedServices || [];
          setMachineHistory({
            tickets: tickets.filter(t => t.machineId === prevMachine.id),
            services: plannedServices.filter(s => s.machineId === prevMachine.id)
          });
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchPrevHistory();
    } else {
      setSelectedMachine(null);
      setIsFromQRScan(false);
      setMachineHistoryStack([]);
    }
  };

  return (
    <div className="space-y-6">
      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title="Skanuj kod QR (Baza Urzadzen)"
        subtitle="Skieruj aparat na kod QR maszyny, aby otworzyć jej detale."
      />
        <NFCScannerModal
          isOpen={isNfcScanning}
          onClose={() => setIsNfcScanning(false)}
          onScanSuccess={(decoded) => {
            setIsNfcScanning(false);
            handleScanSuccess(decoded);
          }}
          title="Odczyt NFC (Baza Urządzeń)"
        />

      {selectedMachine ? (
        <MachineDetails
          machine={machines.find(m => m.id === selectedMachine.id) || selectedMachine}
          history={machineHistory}
          loading={loadingHistory}
          isFromQR={isFromQRScan}
          onScanNext={() => setIsScanning(true)}
          onNfcNext={() => setIsNfcScanning(true)}
          onBack={handleBackMachine}
            onViewRelatedMachine={(m) => handleViewMachine(m, false, true)}
            onAddChildMachine={(pid) => { setEditingId(null); setFormInitialParentId(pid); setIsFormOpen(true); }}
          onPrint={handlePrint}
          onGeneratePDF={() => generateMachineHistoryPDF({...selectedMachine, regionName: regions.find(r => r.id === selectedMachine.regionId)?.name}, machineHistory.tickets, machineHistory.services)}
            onGenerateNewQR={() => handleGenerateNewQR(selectedMachine.id)}
          regions={regions}
          onOpenTicket={onOpenTicket}
          onOpenService={onOpenService}
          onEdit={() => { setEditingId(selectedMachine.id); setIsFormOpen(true); }}
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
            
            onAddMachine={() => { setEditingId(null); setIsFormOpen(true); }}
          />
          <MachineForm 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
        initialParentId={formInitialParentId}
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
                  <button onClick={() => setIsNfcScanning(true)} className="flex-1 md:flex-none bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                    <i className="ph ph-waves text-lg"></i> NFC
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
                handleCopyNfc={handleCopyNfc}
            />
          </div>
        </>
      )}

      {toastConfig.show && <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />}
      <MachineForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
        regions={regions}
        onSaved={showToast}
        onError={(err) => showToast(err, 'error')}
      />
      <ConfirmModal isOpen={confirmModalConfig.isOpen} title={confirmModalConfig.title} message={confirmModalConfig.message} onConfirm={confirmModalConfig.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModalConfig.confirmText} />
    </div>
  );
}

Machines.propTypes = {
  onOpenTicket: PropTypes.func,
  onOpenService: PropTypes.func,
  initialMachineId: PropTypes.string,
  onClearMachineId: PropTypes.func,
};
