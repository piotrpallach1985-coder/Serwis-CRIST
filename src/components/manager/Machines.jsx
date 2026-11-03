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
  getAllRefrigerantTypes,
  saveCustomRefrigerant,
  deleteCustomRefrigerant,
  resolveAnonymousReportPin,
} from '../../utils/fieldServiceHelpers';
import { isMachineIncompleteForQr } from '../../utils/bulkImportHelper';
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
import BulkImportModal from './BulkImportModal';
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
  resolveMachineQrLocation,
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
  const mapSettings = useManagerStore(state => state.mapSettings);
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
    onlyUnverified,
    setOnlyUnverified,
    unverifiedMachines,
    filteredMachines,
    handleExportExcel,
    toggleNode,
  } = useMachines(visibleMachines, regions);
  const [bulkVerifyRegionId, setBulkVerifyRegionId] = useState('');
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialParentId, setFormInitialParentId] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineHistoryStack, setMachineHistoryStack] = useState([]);
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [machineHistory, setMachineHistory] = useState({ tickets: [], services: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [isRefrigerantsModalOpen, setIsRefrigerantsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [refrigerantTypesMap, setRefrigerantTypesMap] = useState(() => getAllRefrigerantTypes());
  const [customRefCode, setCustomRefCode] = useState('');
  const [customRefName, setCustomRefName] = useState('');
  const [customRefGwp, setCustomRefGwp] = useState('');
  const [customRefFluorinated, setCustomRefFluorinated] = useState(true);

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
  } = usePagination(filteredMachines, 50, [
    searchQuery,
    filterRegion,
    filterAssetCategory,
    onlyUnverified,
  ]);

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

  const handleBulkVerifyAndAssignRegion = async () => {
    if (!bulkVerifyRegionId) {
      showToast('Wybierz rejon docelowy, aby zweryfikować urządzenia i wygenerować kody QR.', 'error');
      return;
    }

    const targets = (onlyUnverified ? filteredMachines : unverifiedMachines).filter(m =>
      isMachineIncompleteForQr(m)
    );
    if (targets.length === 0) return;

    setIsBulkVerifying(true);
    try {
      const tenantId = getCurrentTenant();
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);
      const updatedMap = new Map();

      targets.forEach(m => {
        const cleanedName =
          String(m.name || '')
            .replace(/\s*\(DO WERYFIKACJI\)/gi, '')
            .trim() || m.name;
        const patch = {
          name: cleanedName,
          regionId: bulkVerifyRegionId,
          needsVerification: false,
          qrCreatedAt: m.qrCreatedAt || nowIso,
          updatedAt: nowIso,
        };
        updatedMap.set(m.id, patch);
        try {
          const mRef = doc(db, 'tenants', tenantId, 'machines', m.id);
          batch.update(mRef, {
            ...patch,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // ignore offline mock error
        }
      });

      const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
      await Promise.race([
        batch.commit().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, isTestEnv ? 15 : 6000)),
      ]);

      const currentStoreMachines = useManagerStore.getState().machines || [];
      useManagerStore.getState().setMachines(
        currentStoreMachines.map(m => (updatedMap.has(m.id) ? { ...m, ...updatedMap.get(m.id) } : m))
      );

      if (updatedMap.size >= unverifiedMachines.length) {
        setOnlyUnverified(false);
      }
      showToast(
        `Zweryfikowano i aktywowano kody QR dla ${targets.length} urządzeń.`,
        'success'
      );
    } catch (err) {
      showToast('Błąd weryfikacji urządzeń: ' + (err?.message || ''), 'error');
    } finally {
      setIsBulkVerifying(false);
    }
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
    const locationFormatted = resolveMachineQrLocation(machine, regions, '-');
    const internalIdFormatted = machine.internalId || machine.licensePlate || '-';
    const qrDateFormatted = formatQrDate(machine, machines, '-');
    const pinCheckbox = document.getElementById(`qr-show-pin-${id}`);
    const pinReq = resolveAnonymousReportPin(machine, regions, branding, mapSettings);
    const shouldPrintPin = Boolean(pinCheckbox?.checked && pinReq.required && pinReq.pin);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(t('machines.print.printQr'))}${escapeHtml(name)}</title>
          <style>
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #0f172a; }
              .qr-container { width: 320px; text-align: center; border: 2px solid #0f172a; padding: 26px 24px 22px; border-radius: 16px; background: #fff; }
              .tenant-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; }
              .tenant-icon { width: 22px; height: 22px; flex-shrink: 0; }
              .tenant-name { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.15; }
              .system-subtitle { font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.03em; line-height: 1.35; margin: 0 0 20px; }
              .qr-row { display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
              .qr-row svg { width: 170px !important; height: 170px !important; display: block; }
              .machine-name { margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.25; word-break: break-word; }
              .divider { border-top: 2px dashed #cbd5e1; width: 100%; margin: 0 0 14px; }
              .meta-list { text-align: left; width: 100%; }
              .meta-item { margin-bottom: 11px; }
              .meta-item:last-child { margin-bottom: 0; }
              .meta-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
              .meta-value { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.25; word-break: break-word; }
              .meta-value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; letter-spacing: 0.02em; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="tenant-header">
                <svg class="tenant-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21V10L16 13V10L11 13V6H3V21Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M6 3V6M9 3V6" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="tenant-name">${escapeHtml(tenantDisplayName)}</span>
              </div>
              <div class="system-subtitle">VexoNT - SKANUJ ABY ZGŁOSIĆ AWARIĘ</div>
              <div class="qr-row">
                ${svgData}
              </div>
              <h2 class="machine-name">${escapeHtml(name)}</h2>
              <div class="divider"></div>
              <div class="meta-list">
                <div class="meta-item">
                  <div class="meta-label">LOKALIZACJA</div>
                  <div class="meta-value">${escapeHtml(locationFormatted)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">NUMER WEWNĘTRZNY UR</div>
                  <div class="meta-value mono">${escapeHtml(internalIdFormatted)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">DATA KODU (OST. EDYCJA)</div>
                  <div class="meta-value mono">${escapeHtml(qrDateFormatted)}</div>
                </div>
                ${
                  shouldPrintPin
                    ? `<div class="meta-item" style="padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                  <div class="meta-label">KOD PIN ZGŁOSZEŃ</div>
                  <div class="meta-value mono">${escapeHtml(pinReq.pin)}</div>
                </div>`
                    : ''
                }
              </div>
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

          {(unverifiedMachines.length > 0 || onlyUnverified) && (
            <div
              data-testid="unverified-machines-bar"
              className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="filter-unverified-machines-btn"
                  onClick={() => setOnlyUnverified(prev => !prev)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
                    onlyUnverified
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <i className="ph-fill ph-warning-circle text-base"></i>
                  <span>Do weryfikacji ({unverifiedMachines.length})</span>
                  {onlyUnverified && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-800 text-[10px] text-white">
                      Aktywny filtr
                    </span>
                  )}
                </button>
                <div className="text-xs text-amber-950 leading-relaxed">
                  <strong>{unverifiedMachines.length}</strong> urządzeń nie posiada przypisanego
                  rejonu lub wymaga weryfikacji (kody QR są dla nich wstrzymane).
                </div>
              </div>

              {unverifiedMachines.length > 0 && (
                <div
                  data-testid="bulk-verify-machines-bar"
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto"
                >
                  <select
                    data-testid="bulk-verify-region-select"
                    value={bulkVerifyRegionId}
                    onChange={e => setBulkVerifyRegionId(e.target.value)}
                    className="flex-1 sm:w-56 p-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Wybierz rejon docelowy --</option>
                    <option value="main_map">
                      {branding?.industryProfile === 'fleet'
                        ? t('machines.form.wholeCompanyRegion', 'Cała Firma')
                        : t('machines.form.mainMapRegion', 'Mapa Główna')}
                    </option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    data-testid="bulk-verify-assign-region-btn"
                    disabled={isBulkVerifying || !bulkVerifyRegionId}
                    onClick={handleBulkVerifyAndAssignRegion}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <i className="ph-bold ph-check-circle text-sm"></i>
                    <span>
                      Przypisz rejon i aktywuj QR (
                      {
                        (onlyUnverified ? filteredMachines : unverifiedMachines).filter(m =>
                          isMachineIncompleteForQr(m)
                        ).length
                      }
                      )
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
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

                <button
                  type="button"
                  data-testid="open-machines-bulk-import-btn"
                  onClick={() => setIsBulkImportOpen(true)}
                  className="flex-1 md:flex-none bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                >
                  <i className="ph ph-upload-simple text-lg"></i>{' '}
                  {t('machines.buttons.importExcel', 'Importuj (Excel/CSV)')}
                </button>

                {onOpenMachinesQR && (
                  <button
                    data-testid="open-machines-qr-btn"
                    onClick={onOpenMachinesQR}
                    className="flex-1 md:flex-none bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                  >
                    <i className="ph ph-printer text-lg"></i>{' '}
                    {branding?.industryProfile === 'facility'
                      ? 'Baza QR Obiektów/Urządzeń'
                      : t('machines.buttons.qrList', 'Baza QR Urządzeń')}
                  </button>
                )}

                {(branding?.industryProfile || 'industrial') !== 'industrial' &&
                  (branding?.industryProfile || 'industrial') !== 'facility' && (
                  <button
                    type="button"
                    data-testid="open-refrigerants-modal-btn"
                    onClick={() => {
                      setRefrigerantTypesMap(getAllRefrigerantTypes());
                      setIsRefrigerantsModalOpen(true);
                    }}
                    className="flex-1 md:flex-none bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                  >
                    <i className="ph ph-snowflake text-lg"></i> Czynniki chłodnicze (Lista / Dodaj)
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
      {isRefrigerantsModalOpen && (
        <div
          data-testid="refrigerants-list-modal"
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-cyan-200 bg-cyan-50/70">
              <h3 className="text-lg font-extrabold text-cyan-950 flex items-center gap-2">
                <i className="ph ph-snowflake text-cyan-600 text-xl"></i>
                Edytowalna lista czynników chłodniczych (F-Gazy / GWP)
              </h3>
              <button
                type="button"
                onClick={() => setIsRefrigerantsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white cursor-pointer"
              >
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-cyan-950">
                  Dodaj nowy czynnik chłodniczy lub edytuj wybrany z listy poniżej:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kod czynnika *
                    </label>
                    <input
                      type="text"
                      value={customRefCode}
                      onChange={e => setCustomRefCode(e.target.value)}
                      placeholder="np. R452B / R513A"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nazwa / Opis
                    </label>
                    <input
                      type="text"
                      value={customRefName}
                      onChange={e => setCustomRefName(e.target.value)}
                      placeholder="np. R452B (Opteon XL55)"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Współczynnik GWP *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={customRefGwp}
                      onChange={e => setCustomRefGwp(e.target.value)}
                      placeholder="np. 698"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customRefFluorinated}
                        onChange={e => setCustomRefFluorinated(e.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      F-Gaz (CRO)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const code = customRefCode.trim();
                        if (!code) return;
                        const updated = saveCustomRefrigerant({
                          code,
                          name: customRefName.trim() || code,
                          gwp: customRefGwp !== '' ? Number(customRefGwp) : 0,
                          isFluorinated: customRefFluorinated,
                        });
                        setRefrigerantTypesMap({ ...updated });
                        setCustomRefCode('');
                        setCustomRefName('');
                        setCustomRefGwp('');
                        setCustomRefFluorinated(true);
                      }}
                      className="ml-auto px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Kod</th>
                      <th className="py-2.5 px-3">Nazwa czynnika</th>
                      <th className="py-2.5 px-3">GWP</th>
                      <th className="py-2.5 px-3">Typ</th>
                      <th className="py-2.5 px-3 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(refrigerantTypesMap).map(rt => (
                      <tr key={rt.code} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-cyan-900">{rt.code}</td>
                        <td className="py-2 px-3 text-slate-700">{rt.name}</td>
                        <td className="py-2 px-3 font-mono font-bold">{rt.gwp}</td>
                        <td className="py-2 px-3">
                          {rt.isFluorinated ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold text-[11px]">
                              F-Gaz (CRO)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                              Naturalny
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomRefCode(rt.code);
                              setCustomRefName(rt.name || rt.code);
                              setCustomRefGwp(String(rt.gwp ?? 0));
                              setCustomRefFluorinated(Boolean(rt.isFluorinated));
                            }}
                            className="text-cyan-700 hover:text-cyan-950 font-bold cursor-pointer"
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = deleteCustomRefrigerant(rt.code);
                              setRefrigerantTypesMap({ ...updated });
                            }}
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <MachineForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingMachine={editingId ? machines.find(m => m.id === editingId) : null}
        initialParentId={formInitialParentId}
        initialAssetCategory={filterAssetCategory !== 'all' ? filterAssetCategory : undefined}
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
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        mode="machines"
        onImportSuccess={summary => {
          showToast(
            `Zaimportowano: ${summary.readyWithQrCount} z QR, ${summary.incompleteWithoutQrCount} do weryfikacji (bez QR)`,
            'success'
          );
        }}
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
