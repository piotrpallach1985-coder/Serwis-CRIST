import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useManagerStore } from '../../store/managerStore';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import {
  filterMachinesForFieldTechnician,
  filterTasksForFieldTechnician,
  findMachineByIdentifierOrPlate,
  isVehicleAsset,
} from '../../utils/fieldServiceHelpers';
import { generateMachineHistoryPDF } from '../../utils/reports/pdfMachineCard';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';

import MachineDetails from './MachineDetails';
import MachineFilters from './MachineFilters';
import MachineTable from './MachineTable';
import MachineForm from './MachineForm';
import ConfirmModal from './ConfirmModal';
import QRScannerModal from '../shared/QRScannerModal';
import NFCScannerModal from '../shared/NFCScannerModal';
import Toast from './Toast';
import { useMachines } from '../../hooks/useMachines';
import { updateMachine } from '../../services/machines.service';
import { fetchMachineTickets } from '../../services/tickets.service';
import { fetchMachineServices } from '../../services/plannedServices.service';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { getCurrentTenant } from '../../utils/tenantHelper';
import {
  getOrCreateQrKey,
  buildMachineQrValue,
  resolveTenantDisplayName,
  formatQrDate,
  parseQrPayload,
  PART_QR_IN_MACHINE_SCANNER_MSG,
} from '../../services/qrAccess.service';

export default function Machines({
  onOpenTicket,
  onOpenService,
  initialMachineId,
  onClearMachineId,
  onOpenMachinesQR,
}) {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tickets = useManagerStore(state => state.tickets);
  const machines = useManagerStore(state => state.machines);
  const plannedServices = useManagerStore(state => state.plannedServices);
  const regions = useManagerStore(state => state.regions);
  const roles = useManagerStore(state => state.roles);
  const branding = useManagerStore(state => state.branding);
  const { onlyAssignedTasks } = usePermissions(user, roles);

  const visibleMachines = useMemo(
    () =>
      filterMachinesForFieldTechnician(
        machines,
        tickets,
        plannedServices,
        user,
        onlyAssignedTasks
      ),
    [machines, tickets, plannedServices, user, onlyAssignedTasks]
  );

  const [editingId, setEditingId] = useState(null);

  const {
    searchQuery,
    setSearchQuery,
    filterRegion,
    setFilterRegion,
    filterAssetCategory,
    setFilterAssetCategory,
    filteredMachines,
    handleExportExcel,
    toggleNode,
  } = useMachines(visibleMachines, regions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialParentId, setFormInitialParentId] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineHistoryStack, setMachineHistoryStack] = useState([]);
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);

  const { toastConfig, showToast, hideToast } = useToast();
  const {
    confirmConfig: confirmModalConfig,
    hideConfirm: closeConfirmModal,
    setConfirmConfig: setConfirmModalConfig,
  } = useConfirmModal();
  const [initialOpenProcessed, setInitialOpenProcessed] = useState(false);
  const {
    currentItems,
    hasMore: hasMoreLocalItems,
    loadMore,
  } = usePagination(filteredMachines, 50, [searchQuery, filterRegion, filterAssetCategory]);

  useEffect(() => {
    if (initialMachineId && visibleMachines.length > 0) {
      const targetMachine = visibleMachines.find(m => m.id === initialMachineId);
      if (targetMachine) {
        handleViewMachine(targetMachine, true);
        if (onClearMachineId) onClearMachineId();
      }
    }
  }, [initialMachineId, visibleMachines, onClearMachineId]);

  useEffect(() => {
    if (!initialOpenProcessed && visibleMachines.length > 0) {
      const openMachineId = searchParams.get('openMachine');
      if (openMachineId) {
        const targetMachine = findMachineByIdentifierOrPlate(
          visibleMachines,
          openMachineId,
          openMachineId
        );

        if (targetMachine) {
          handleViewMachine(targetMachine, true);
        } else {
          alert(t('machines.alerts.notFoundScanned'));
        }

        setSearchParams(
          prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('openMachine');
            return newParams;
          },
          { replace: true }
        );
      }

      setInitialOpenProcessed(true);
    }
  }, [machines, initialOpenProcessed]);

  const handleDeleteMachine = (id, name) => {
    setConfirmModalConfig({
      isOpen: true,
      title: t('machines.alerts.confirmDeleteTitle'),
      message: t('machines.alerts.confirmDeleteMessage', { name: name }),
      confirmText: t('machines.alerts.deleteMachine'),
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
          const ticketsQ = query(
            collection(db, 'tenants', tenantId, 'tickets'),
            where('machineId', '==', id)
          );
          const ticketsSnapshot = await getDocs(ticketsQ);
          ticketsSnapshot.forEach(docSnap => {
            const status = docSnap.data().status;
            if (status == 5 || status == 'closed') return;
            batch.update(docSnap.ref, {
              status: 5, // Zamknięte/Zarchiwizowane
              closedAt: new Date().toISOString(),
              history: arrayUnion({
                action: t('machines.history.autoClose'),
                date: new Date().toISOString(),
                user: t('machines.history.system'),
                note: t('machines.history.machineDeleted'),
              }),
            });
          });

          // 3. Aktywne serwisy
          const servicesQ = query(
            collection(db, 'tenants', tenantId, 'planned_services'),
            where('machineId', '==', id)
          );
          const servicesSnapshot = await getDocs(servicesQ);
          servicesSnapshot.forEach(docSnap => {
            if (docSnap.data().status !== 'pending') return;
            batch.update(docSnap.ref, {
              status: 'completed',
              completedAt: new Date().toISOString(),
              history: arrayUnion({
                action: t('machines.history.autoClose'),
                date: new Date().toISOString(),
                user: t('machines.history.system'),
                note: t('machines.history.machineDeleted'),
              }),
            });
          });

          await batch.commit();
          const { logAudit } = await import('../../services/audit.service');
          logAudit('DELETE', 'MACHINE', id, { name, isDeleted: true });

          showToast(t('machines.toasts.machineArchived'));
          if (selectedMachine?.id === id) setSelectedMachine(null);
        } catch (err) {
          showToast(t('machines.toasts.error') + err.message, 'error');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const handlePrint = machine => {
    const id = machine.id;
    const name = machine.name;

    const escapeHtml = unsafe => {
      return (unsafe || '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const svgElement =
      document.getElementById(`qr-svg-${id}`) ||
      document.getElementById('machine-qr-code-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const tenantDisplayName = resolveTenantDisplayName(getCurrentTenant(), branding);
    const qrDateFormatted = formatQrDate(machine, machines, '-');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(t('machines.print.printQr'))}${escapeHtml(name)}</title>
          <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .qr-container { text-align: center; border: 2px dashed #ccc; padding: 20px; border-radius: 10px; }
              .tenant { font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
              .qr-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 6px 0; }
              .qr-side-brand { writing-mode: vertical-rl; font-size: 9px; font-weight: 600; color: #9ca3af; letter-spacing: 0.14em; user-select: none; }
              .qr-side-brand.left { transform: rotate(180deg); }
              h2 { margin: 10px 0 5px; font-size: 22px; }
              p { margin: 2px 0; color: #555; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="tenant">${escapeHtml(tenantDisplayName)}</div>
              <div class="qr-row">
                <span class="qr-side-brand left">system VexoNT</span>
                ${svgData}
                <span class="qr-side-brand">system VexoNT</span>
              </div>
              <h2>${escapeHtml(name)}</h2>
              <p>${escapeHtml(t('machines.print.date'))}${escapeHtml(qrDateFormatted)}</p>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
    printWindow.document.close();
  };

  const handleCopyNfc = async machine => {
    const currentTenantId = getCurrentTenant();
    try {
      const key = await getOrCreateQrKey(currentTenantId);
      await navigator.clipboard.writeText(
        buildMachineQrValue(machine, currentTenantId, key, { allMachines: machines, branding })
      );
      showToast(t('machines.toasts.copiedNfc'), 'success');
    } catch {
      showToast(t('machines.toasts.copyNfcError'), 'error');
    }
  };

  const handleGenerateNewQR = async machineId => {
    try {
      const machineRef = doc(db, 'tenants', getCurrentTenant(), 'machines', machineId);
      await updateDoc(machineRef, { qrCreatedAt: serverTimestamp() });
      showToast(t('machines.toasts.newQrGenerated'), 'success');
    } catch {
      showToast(t('machines.toasts.newQrError'), 'error');
    }
  };

  const handleViewMachine = async (m, fromQR = false, pushToHistory = false) => {
    if (pushToHistory && selectedMachine) {
      setMachineHistoryStack(prev => [...prev, selectedMachine]);
    } else if (!pushToHistory) {
      setMachineHistoryStack([]);
    }

    // Synchroniczna pre-populacja z pamięci store zapobiega mignięciu ramek przy otwarciu detali
    const localTickets = filterTasksForFieldTechnician(tickets || [], user, onlyAssignedTasks)
      .filter(
        tk =>
          tk.machineId === m.id ||
          (tk.machineName && m.name && tk.machineName.toLowerCase().includes(m.name.toLowerCase()))
      )
      .slice()
      .sort((a, b) => {
        const dA = safeParseDate(a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.createdAt)?.getTime() || 0;
        return dB - dA;
      });
    const localServices = filterTasksForFieldTechnician(
      plannedServices || [],
      user,
      onlyAssignedTasks
    )
      .filter(s => s.machineId === m.id)
      .slice()
      .sort((a, b) => {
        const dA = safeParseDate(a.completedAt || a.nextDate || a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.completedAt || b.nextDate || b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

    setMachineHistory({ tickets: localTickets, services: localServices });
    setSelectedMachine(m);
    setIsFromQRScan(fromQR);
    setLoadingHistory(false);
    try {
      let machineTickets = filterTasksForFieldTechnician(
        await fetchMachineTickets(m.id, m.name),
        user,
        onlyAssignedTasks
      );

      // Sortuj zgloszenia od najnowszych
      machineTickets.sort((a, b) => {
        const dA = safeParseDate(a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

      // 2. Pobierz wszystkie serwisy
      let machineServices = filterTasksForFieldTechnician(
        await fetchMachineServices(m.id),
        user,
        onlyAssignedTasks
      );

      // Sortuj serwisy od najnowszych
      machineServices.sort((a, b) => {
        const dA = safeParseDate(a.completedAt || a.nextDate || a.createdAt)?.getTime() || 0;
        const dB = safeParseDate(b.completedAt || b.nextDate || b.createdAt)?.getTime() || 0;
        return dB - dA;
      });

      setMachineHistory({ tickets: machineTickets, services: machineServices });
    } catch (err) {
      console.error('Błąd pobierania historii maszyny z Firestore:', err);
    }
  };

  const handleScanSuccess = (decoded, rawQr) => {
    setIsScanning(false);
    if (!decoded) {
      showToast(t('machines.toasts.qrReadError'), 'error');
      return;
    }

    const rawText = rawQr || (typeof decoded === 'string' ? decoded.trim() : String(decoded));
    const parsed = parseQrPayload(rawText);
    const storeParts = useManagerStore.getState().parts || [];
    const candidatePartId = parsed.partId || parsed.machineId || String(decoded).trim();
    const matchedPart = storeParts.find(
      p => p.id === candidatePartId || (p.code && p.code === candidatePartId)
    );
    if (parsed.isPartQr || matchedPart) {
      showToast(
        t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG),
        'error'
      );
      return;
    }

    let machineId =
      parsed.machineId || (typeof decoded === 'string' ? decoded.trim() : String(decoded));
    const originalRaw = rawQr || machineId;
    let tenantFromQr = parsed.tenantId;

    const tMatch = String(decoded).match(/tenant=([^&#]+)/);
    if (tMatch && !tenantFromQr) tenantFromQr = tMatch[1];

    const mMatch = String(decoded).match(/machine=([^&#]+)/);
    if (mMatch) machineId = mMatch[1];

    if (tenantFromQr && tenantFromQr !== getCurrentTenant() && user?.role !== 'superadmin') {
      showToast('Ta maszyna należy do innej firmy!', 'error');
      return;
    }

    const found = findMachineByIdentifierOrPlate(visibleMachines, machineId, originalRaw);

    if (found) {
      handleViewMachine(found, true);
      showToast(
        t('machines.toasts.machineLoaded') +
          found.name +
          (found.licensePlate ? ` (${found.licensePlate})` : ''),
        'success'
      );
    } else {
      showToast(t('machines.toasts.machineNotFound') + machineId, 'error');
    }
  };

  const handleBackMachine = () => {
    if (machineHistoryStack.length > 0) {
      const prevMachine = machineHistoryStack[machineHistoryStack.length - 1];
      setMachineHistoryStack(prev => prev.slice(0, -1));
      handleViewMachine(prevMachine, false, false);
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
        title={t('machines.scanner.qrTitle')}
        subtitle={t('machines.scanner.qrSubtitle')}
      />
      <NFCScannerModal
        isOpen={isNfcScanning}
        onClose={() => setIsNfcScanning(false)}
        onScanSuccess={decoded => {
          setIsNfcScanning(false);
          handleScanSuccess(decoded);
        }}
        title={t('machines.scanner.nfcTitle')}
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
          onViewRelatedMachine={m => handleViewMachine(m, false, true)}
          onAddChildMachine={pid => {
            setEditingId(null);
            setFormInitialParentId(pid);
            setIsFormOpen(true);
          }}
          onPrint={handlePrint}
          onGeneratePDF={() =>
            generateMachineHistoryPDF(
              {
                ...selectedMachine,
                regionName:
                  selectedMachine.regionId === 'main_map'
                    ? isVehicleAsset(selectedMachine, branding?.industryProfile)
                      ? t('machines.form.wholeCompanyRegion', 'Cała Firma')
                      : t('machines.form.mainMapRegion', 'Mapa Główna')
                    : regions.find(r => r.id === selectedMachine.regionId)?.name,
              },
              machineHistory.tickets,
              machineHistory.services
            )
          }
          onGenerateNewQR={() => handleGenerateNewQR(selectedMachine.id)}
          regions={regions}
          onOpenTicket={onOpenTicket}
          onOpenService={onOpenService}
          onEdit={() => {
            setEditingId(selectedMachine.id);
            setIsFormOpen(true);
          }}
          onDelete={() => handleDeleteMachine(selectedMachine.id, selectedMachine.name)}
        />
      ) : (
        <>
          <MachineFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterRegion={filterRegion}
            setFilterRegion={setFilterRegion}
            filterAssetCategory={filterAssetCategory}
            setFilterAssetCategory={setFilterAssetCategory}
            regions={regions}
            onAddMachine={() => {
              setEditingId(null);
              setFormInitialParentId(selectedMachine ? selectedMachine.id : null);
              setIsFormOpen(true);
            }}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsScanning(true)}
                  className="flex-1 md:flex-none bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                >
                  <i className="ph ph-qr-code text-lg"></i> {t('machines.buttons.scan')}
                </button>
                <button
                  onClick={() => setIsNfcScanning(true)}
                  className="flex-1 md:flex-none bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                >
                  <i className="ph ph-waves text-lg"></i> {t('machines.buttons.nfc')}
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex-1 md:flex-none bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                >
                  <i className="ph ph-file-xls text-lg"></i> {t('machines.buttons.excel')}
                </button>

                {onOpenMachinesQR && (
                  <button
                    onClick={onOpenMachinesQR}
                    className="flex-1 md:flex-none bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                  >
                    <i className="ph ph-printer text-lg"></i>{' '}
                    {t('machines.buttons.qrList', 'Baza QR Urządzeń')}
                  </button>
                )}
              </div>
            </div>
            <MachineTable
              filteredMachines={filteredMachines}
              toggleNode={toggleNode}
              currentItems={currentItems}
              regions={regions}
              handleViewMachine={handleViewMachine}
              handleCopyNfc={handleCopyNfc}
            />
            {hasMoreLocalItems && (
              <div className="p-4 flex justify-center border-t border-slate-200">
                <button
                  onClick={loadMore}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all cursor-pointer"
                >
                  {t('machines.buttons.loadMore', 'Wczytaj więcej')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {toastConfig.show && (
        <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />
      )}
      <MachineForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
        initialParentId={formInitialParentId}
        regions={regions}
        onSaved={(msg, newMachineId) => {
          showToast(msg, 'success');
          if (newMachineId) {
            setTimeout(() => {
              const machinesList = useManagerStore.getState().machines;
              const newM = machinesList.find(m => m.id === newMachineId);
              if (newM && !formInitialParentId) handleViewMachine(newM, false, true);
            }, 600);
          }
        }}
        onError={err => showToast(err, 'error')}
      />
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

Machines.propTypes = {
  onOpenTicket: PropTypes.func,
  onOpenService: PropTypes.func,
  initialMachineId: PropTypes.string,
  onClearMachineId: PropTypes.func,
  onOpenMachinesQR: PropTypes.func,
};
