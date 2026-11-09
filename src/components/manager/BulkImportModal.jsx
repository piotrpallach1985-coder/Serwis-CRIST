import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useManagerStore } from '../../store/managerStore';
import { logAudit } from '../../services/audit.service';
import {
  MACHINE_IMPORT_FIELDS,
  PART_IMPORT_FIELDS,
  autoDetectColumnMapping,
  prepareMachinesImportPreview,
  preparePartsImportPreview,
  getSampleTemplateRows,
  getImportLegendRows,
} from '../../utils/bulkImportHelper';
import { parseIfcFileContent } from '../../utils/ifcCoordinatesHelper';

export default function BulkImportModal({
  isOpen,
  onClose,
  mode = 'machines', // 'machines' | 'parts'
  onImportSuccess,
  initialRowsForTest = null,
}) {
  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  const parts = useManagerStore(state => state.parts || []);
  const limits = useManagerStore(state => state.limits);
  const branding = useManagerStore(state => state.branding);
  const industryProfile = branding?.industryProfile || 'industrial';

  const [step, setStep] = useState(1); // 1: Plik i Legenda, 2: Mapowanie, 3: Podgląd i Weryfikacja, 4: Podsumowanie
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // 'skip' | 'update'
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);

  const fieldsConfig = mode === 'parts' ? PART_IMPORT_FIELDS : MACHINE_IMPORT_FIELDS;

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFileName('');
      setRawHeaders([]);
      setRawRows([]);
      setColumnMap({});
      setDuplicateStrategy('skip');
      setParseError('');
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
      setImportResult(null);
    } else if (Array.isArray(initialRowsForTest) && initialRowsForTest.length > 0) {
      const headers = Object.keys(initialRowsForTest[0] || {});
      setRawHeaders(headers);
      setRawRows(initialRowsForTest);
      setColumnMap(autoDetectColumnMapping(headers, mode));
      setFileName('test-import.xlsx');
      setStep(3);
    }
  }, [isOpen, initialRowsForTest, mode]);

  const previewData = useMemo(() => {
    if (!rawRows.length) {
      return {
        rows: [],
        summary: {
          totalRows: 0,
          readyWithQrCount: 0,
          incompleteWithoutQrCount: 0,
          subassembliesCount: 0,
          createTotalCount: 0,
          createCount: 0,
          updateCount: 0,
          skipCount: 0,
          newRegions: [],
        },
      };
    }
    if (mode === 'parts') {
      return preparePartsImportPreview(rawRows, columnMap, {
        existingParts: parts,
        existingMachines: machines,
        duplicateStrategy,
      });
    }
    return prepareMachinesImportPreview(rawRows, columnMap, {
      existingMachines: machines,
      existingRegions: regions,
      duplicateStrategy,
      industryProfile,
    });
  }, [rawRows, columnMap, mode, machines, regions, parts, duplicateStrategy, industryProfile]);

  if (!isOpen) return null;

  const activeMachinesCount = machines.filter(m => !m.isDeleted).length;
  const maxMachinesLimit = limits?.maxMachines || 500;
  const remainingQuota = Math.max(0, maxMachinesLimit - activeMachinesCount);
  const exceedsMachineLimit =
    mode === 'machines' &&
    limits?.maxMachines &&
    previewData.summary.createTotalCount > remainingQuota;

  const handleDownloadTemplate = () => {
    const sampleRows = getSampleTemplateRows(mode, industryProfile);
    const legendRows = getImportLegendRows(mode);

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const legendSheet = XLSX.utils.json_to_sheet(legendRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      mode === 'parts' ? 'Szablon_Czesci' : 'Szablon_Urzadzen'
    );
    XLSX.utils.book_append_sheet(workbook, legendSheet, 'Legenda_Kolumn');

    const fileLabel =
      mode === 'parts'
        ? 'VexoNT_Szablon_Importu_Czesci.xlsx'
        : 'VexoNT_Szablon_Importu_Urzadzen.xlsx';
    XLSX.writeFile(workbook, fileLabel);
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setFileName(file.name);

    const isIfcFile =
      mode === 'machines' && /\.ifc$/i.test(String(file.name || '').trim());

    if (isIfcFile) {
      const textReader = new FileReader();
      textReader.onload = evt => {
        try {
          const textContent = String(evt.target.result || '');
          const ifcParsed = parseIfcFileContent(textContent);
          if (!ifcParsed.rows || ifcParsed.rows.length === 0) {
            setParseError(
              'Nie znaleziono żadnych obiektów wyposażenia/urządzeń (IfcFlowTerminal, IfcElectricAppliance, IfcBuildingElementProxy itp.) w pliku IFC.'
            );
            return;
          }
          const headers = Object.keys(ifcParsed.rows[0] || {});
          const detectedMap = autoDetectColumnMapping(headers, mode);
          setRawHeaders(headers);
          setRawRows(ifcParsed.rows);
          setColumnMap(detectedMap);
          setStep(2);
        } catch (err) {
          setParseError('Błąd odczytu pliku IFC: ' + (err?.message || String(err)));
        }
      };
      textReader.readAsText(file, 'utf-8');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setParseError('Plik nie zawiera żadnego arkusza.');
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!jsonRows || jsonRows.length === 0) {
          setParseError('Wybrany arkusz jest pusty lub nie zawiera wierszy danych.');
          return;
        }
        const headers = Object.keys(jsonRows[0] || {});
        const detectedMap = autoDetectColumnMapping(headers, mode);
        setRawHeaders(headers);
        setRawRows(jsonRows);
        setColumnMap(detectedMap);
        setStep(2);
      } catch (err) {
        setParseError('Błąd odczytu pliku Excel/CSV: ' + (err?.message || String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const commitBatchSafe = async batch => {
    if (!batch || typeof batch.commit !== 'function') return;
    const timeoutMs =
      typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test' ? 15 : 6000;
    try {
      await Promise.race([
        batch.commit().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, timeoutMs)),
      ]);
    } catch (err) { console.warn('[BulkImport: zapis paczki]', err); }
  };

  const handleExecuteImport = async () => {
    const actionableRows = previewData.rows.filter(
      r => r.status === 'ready' || r.status === 'incomplete' || r.status === 'update'
    );
    if (actionableRows.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: actionableRows.length });

    const tenantId = getCurrentTenant();
    const nowIso = new Date().toISOString();

    try {
      if (mode === 'machines') {
        // 1. Automatyczne utworzenie brakujących rejonów
        const createdRegionIdsByLowerName = new Map();
        const newRegionsList = previewData.summary.newRegions || [];
        const newRegionsForStore = [];

        if (newRegionsList.length > 0) {
          try {
            const regBatch = writeBatch(db);
            newRegionsList.forEach(regName => {
              const regRef = doc(collection(db, 'tenants', tenantId, 'regions'));
              const regId =
                regRef?.id || `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              createdRegionIdsByLowerName.set(regName.toLowerCase(), regId);
              const regObj = {
                id: regId,
                name: regName,
                description: 'Utworzono automatycznie podczas importu z Excela',
                isDeleted: false,
                createdAt: serverTimestamp(),
              };
              if (regRef && typeof regBatch?.set === 'function') {
                regBatch.set(regRef, regObj);
              }
              newRegionsForStore.push({ ...regObj, createdAt: nowIso });
            });
            await commitBatchSafe(regBatch);
          } catch {
            newRegionsList.forEach(regName => {
              if (!createdRegionIdsByLowerName.has(regName.toLowerCase())) {
                const fallbackId = `reg-${regName.toLowerCase().replace(/\s+/g, '-')}`;
                createdRegionIdsByLowerName.set(regName.toLowerCase(), fallbackId);
                newRegionsForStore.push({
                  id: fallbackId,
                  name: regName,
                  description: 'Utworzono automatycznie podczas importu z Excela',
                  isDeleted: false,
                  createdAt: nowIso,
                });
              }
            });
          }

          if (newRegionsForStore.length > 0) {
            const currentRegions = useManagerStore.getState().regions || [];
            useManagerStore.getState().setRegions([...currentRegions, ...newRegionsForStore]);
          }
        }

        // 2. Wstępna alokacja ID i referencji dokumentów dla wszystkich wierszy z arkusza
        // (Dzięki temu podzespół w tym samym pliku Excela otrzymuje dokładne parentId swojego urządzenia nadrzędnego!)
        const allocatedRefByRowIndex = new Map();
        const allocatedIdByRowIndex = new Map();

        previewData.rows.forEach((row, idx) => {
          if (row.existingId) {
            allocatedIdByRowIndex.set(row.rowIndex, row.existingId);
            return;
          }
          if (row.status === 'ready' || row.status === 'incomplete') {
            let docId = `imp-m-${Date.now()}-${idx}`;
            try {
              const ref = doc(collection(db, 'tenants', tenantId, 'machines'));
              if (ref?.id) {
                docId = ref.id;
                allocatedRefByRowIndex.set(row.rowIndex, ref);
              }
            } catch (err) { console.warn('[BulkImport: przydział ID urządzenia]', err); }
            allocatedIdByRowIndex.set(row.rowIndex, docId);
          }
        });

        // 3. Zapis urządzeń i podzespołów w paczkach po 400 (limit Firestore writeBatch to 500)
        const CHUNK_SIZE = 400;
        const addedForStore = [];
        const updatedById = new Map();

        for (let i = 0; i < actionableRows.length; i += CHUNK_SIZE) {
          const chunk = actionableRows.slice(i, i + CHUNK_SIZE);
          let batch = null;
          try {
            batch = writeBatch(db);
          } catch {
            batch = null;
          }

          chunk.forEach(row => {
            let finalRegionId = row.payload.regionId;
            if (!finalRegionId && row.newRegionToCreate) {
              finalRegionId =
                createdRegionIdsByLowerName.get(row.newRegionToCreate.toLowerCase()) || '';
            }

            let finalParentId = row.payload.parentId || null;
            if (!finalParentId && row.parentRowIndex) {
              finalParentId = allocatedIdByRowIndex.get(row.parentRowIndex) || null;
            }

            // Zasada QR: Kod QR tworzony TYLKO dla kompletnych urządzeń (posiadających rejon i nieoznaczonych jako DO WERYFIKACJI)
            const hasCompleteDataForQr = Boolean(finalRegionId && !row.isIncomplete);

            const firestoreDocData = {
              ...row.payload,
              regionId: finalRegionId,
              parentId: row.payload.assetCategory === 'vehicle' ? null : finalParentId,
              needsVerification: !hasCompleteDataForQr,
              updatedAt: serverTimestamp(),
              qrCreatedAt: hasCompleteDataForQr ? serverTimestamp() : null,
              qrNeedsPrint: hasCompleteDataForQr,
              qrPrintedAt: null,
            };

            const storeDocData = {
              ...row.payload,
              regionId: finalRegionId,
              parentId: row.payload.assetCategory === 'vehicle' ? null : finalParentId,
              needsVerification: !hasCompleteDataForQr,
              updatedAt: nowIso,
              qrCreatedAt: hasCompleteDataForQr ? nowIso : null,
              qrNeedsPrint: hasCompleteDataForQr,
              qrPrintedAt: null,
            };

            if (row.status === 'update' && row.existingId) {
              try {
                const ref = doc(db, 'tenants', tenantId, 'machines', row.existingId);
                if (batch && ref) {
                  batch.update(ref, firestoreDocData);
                }
              } catch (err) { console.warn('[BulkImport: aktualizacja urządzenia]', err); }
              updatedById.set(row.existingId, storeDocData);
            } else {
              const docId =
                allocatedIdByRowIndex.get(row.rowIndex) || `imp-m-${Date.now()}-${row.rowIndex}`;
              const ref = allocatedRefByRowIndex.get(row.rowIndex);
              try {
                if (batch && ref) {
                  batch.set(ref, {
                    ...firestoreDocData,
                    createdAt: serverTimestamp(),
                  });
                }
              } catch (err) { console.warn('[BulkImport: utworzenie rejonu/urządzenia]', err); }
              addedForStore.push({
                id: docId,
                ...storeDocData,
                createdAt: nowIso,
              });
            }
          });

          await commitBatchSafe(batch);
          setProgress({
            current: Math.min(actionableRows.length, i + chunk.length),
            total: actionableRows.length,
          });
        }

        const currentMachines = useManagerStore.getState().machines || [];
        const mergedMachines = currentMachines.map(m =>
          updatedById.has(m.id) ? { ...m, ...updatedById.get(m.id) } : m
        );
        useManagerStore.getState().setMachines([...mergedMachines, ...addedForStore]);

        try {
          logAudit(
            'IMPORT',
            'MACHINE',
            'BULK_IMPORT',
            `Zaimportowano z Excela: ${previewData.summary.readyWithQrCount} kompletnych (z QR), ${previewData.summary.incompleteWithoutQrCount} do weryfikacji (bez QR), podzespołów: ${previewData.summary.subassembliesCount || 0}`
          );
        } catch (err) { console.warn('[BulkImport: wpis do dziennika zdarzeń]', err); }

        const summaryResult = {
          mode: 'machines',
          readyWithQrCount: previewData.summary.readyWithQrCount,
          incompleteWithoutQrCount: previewData.summary.incompleteWithoutQrCount,
          subassembliesCount: previewData.summary.subassembliesCount || 0,
          updateCount: previewData.summary.updateCount,
          skipCount: previewData.summary.skipCount,
          newRegionsCount: newRegionsList.length,
        };
        setImportResult(summaryResult);
        setStep(4);
        if (onImportSuccess) onImportSuccess(summaryResult);
      } else {
        // IMPORT CZĘŚCI MAGAZYNOWYCH (paczki po 200, bo tworzymy też partTransactions dla stock > 0)
        const CHUNK_SIZE = 200;
        const addedPartsForStore = [];
        const updatedPartsById = new Map();

        for (let i = 0; i < actionableRows.length; i += CHUNK_SIZE) {
          const chunk = actionableRows.slice(i, i + CHUNK_SIZE);
          let batch = null;
          try {
            batch = writeBatch(db);
          } catch {
            batch = null;
          }

          chunk.forEach((row, idxInChunk) => {
            const firestorePartData = {
              ...row.payload,
              updatedAt: serverTimestamp(),
              qrCreatedAt: serverTimestamp(),
              qrNeedsPrint: true,
              qrPrintedAt: null,
            };
            const storePartData = {
              ...row.payload,
              updatedAt: nowIso,
              qrCreatedAt: nowIso,
              qrNeedsPrint: true,
              qrPrintedAt: null,
            };

            if (row.status === 'update' && row.existingId) {
              try {
                const ref = doc(db, 'tenants', tenantId, 'parts', row.existingId);
                if (batch && ref) {
                  batch.update(ref, firestorePartData);
                }
              } catch (err) { console.warn('[BulkImport: aktualizacja części]', err); }
              updatedPartsById.set(row.existingId, storePartData);
            } else {
              let partId = `imp-p-${Date.now()}-${i + idxInChunk}`;
              try {
                const ref = doc(collection(db, 'tenants', tenantId, 'parts'));
                if (ref?.id) partId = ref.id;
                if (batch && ref) {
                  batch.set(ref, {
                    ...firestorePartData,
                    createdAt: serverTimestamp(),
                  });
                }
                if (row.payload.stock > 0 && batch) {
                  const txRef = doc(collection(db, 'tenants', tenantId, 'partTransactions'));
                  if (txRef) {
                    batch.set(txRef, {
                      partId,
                      partName: row.payload.name,
                      partCode: row.payload.code,
                      type: 'receive',
                      quantity: row.payload.stock,
                      price: row.payload.unitPrice || 0,
                      totalCost: Number(row.payload.stock) * Number(row.payload.unitPrice || 0),
                      date: nowIso,
                      user: 'Import Excel',
                      notes: 'Stan początkowy z kreatora importu Excel/CSV',
                    });
                  }
                }
              } catch (err) { console.warn('[BulkImport: utworzenie części]', err); }
              addedPartsForStore.push({
                id: partId,
                ...storePartData,
                createdAt: nowIso,
              });
            }
          });

          await commitBatchSafe(batch);
          setProgress({
            current: Math.min(actionableRows.length, i + chunk.length),
            total: actionableRows.length,
          });
        }

        const currentParts = useManagerStore.getState().parts || [];
        const mergedParts = currentParts.map(p =>
          updatedPartsById.has(p.id) ? { ...p, ...updatedPartsById.get(p.id) } : p
        );
        useManagerStore.getState().setParts([...mergedParts, ...addedPartsForStore]);

        try {
          logAudit(
            'IMPORT',
            'PART',
            'BULK_IMPORT',
            `Zaimportowano części z Excela: ${previewData.summary.createCount} nowych, zaktualizowano: ${previewData.summary.updateCount}`
          );
        } catch (err) { console.warn('[BulkImport: wpis do dziennika zdarzeń (części)]', err); }

        const summaryResult = {
          mode: 'parts',
          createCount: previewData.summary.createCount,
          updateCount: previewData.summary.updateCount,
          skipCount: previewData.summary.skipCount,
        };
        setImportResult(summaryResult);
        setStep(4);
        if (onImportSuccess) onImportSuccess(summaryResult);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const renderBadgeForRequirement = field => {
    if (field.requirementLevel === 'unconditional') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 text-[10px] font-black uppercase tracking-tight">
          {field.requirementBadge}
        </span>
      );
    }
    if (field.requirementLevel === 'for_qr') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-tight">
          {field.requirementBadge}
        </span>
      );
    }
    if (field.key === 'parentMachine' || field.key === 'compatibleMachines') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black uppercase tracking-tight">
          {field.requirementBadge}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-tight">
        {field.requirementBadge}
      </span>
    );
  };

  return (
    <div
      data-testid="bulk-import-modal"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-fade-in">
        {/* NAGŁÓWEK */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
              <i className="ph ph-file-xls text-2xl"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {mode === 'parts'
                  ? 'Kreator Masowego Importu Części Zapasowych (Excel / CSV)'
                  : 'Kreator Masowego Importu Urządzeń, Podzespołów i Pojazdów (Excel / CSV)'}
              </h2>
              <p className="text-xs text-slate-300">
                {mode === 'parts'
                  ? 'Szybkie wdrożenie magazynu z partiami FIFO i kodami QR. Kompatybilne urządzenia możesz też dopisać później.'
                  : 'Obsługa drzewa podzespołów (Urządzenie nadrzędne). Kod QR generowany wyłącznie dla kompletu danych (z rejonem).'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        {/* PASEK KROKÓW */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
          {[
            { id: 1, label: '1. Szablon, Plik i Legenda' },
            { id: 2, label: '2. Mapowanie Kolumn' },
            { id: 3, label: '3. Weryfikacja i Zasady QR' },
            { id: 4, label: '4. Podsumowanie' },
          ].map(s => (
            <div
              key={s.id}
              className={`flex items-center gap-2 ${
                step === s.id
                  ? 'text-blue-700 font-black'
                  : step > s.id
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  step === s.id
                    ? 'bg-blue-600 text-white'
                    : step > s.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* TREŚĆ KROKU */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
                    <i className="ph-fill ph-download-simple text-blue-600 text-lg"></i>
                    Krok 1A: Pobierz wzorcowy szablon Excel (.xlsx) wraz z arkuszem Legendy
                  </h3>
                  <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                    {mode === 'parts'
                      ? 'Szablon zawiera arkusz danych oraz drugi arkusz "Legenda_Kolumn". Kompatybilne urządzenia możesz wpisać od razu po przecinku lub dodać później w edycji części.'
                      : 'Szablon zawiera arkusz danych (w tym przykład urządzenia głównego, podzespołu i maszyny bez rejonu) oraz arkusz "Legenda_Kolumn".'}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="download-import-template-btn"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <i className="ph ph-file-xls text-base"></i>
                  Pobierz szablon + Legendę (.xlsx)
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                <i className="ph ph-upload-simple text-4xl text-blue-600 mb-2 inline-block"></i>
                <h3 className="text-base font-extrabold text-slate-800">
                  {mode === 'machines'
                    ? 'Wgraj wypełniony arkusz Excel (.xlsx, .xls), plik CSV lub model BIM (.ifc)'
                    : 'Wgraj wypełniony arkusz Excel (.xlsx, .xls) lub plik CSV'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  {mode === 'machines'
                    ? 'Możesz użyć naszego szablonu, eksportu z systemu ERP / SAP albo wgrać bezpośrednio plik .IFC (ISO 16739) ze współrzędnymi 3D.'
                    : 'Możesz użyć naszego szablonu albo dowolnego eksportu z systemu ERP / SAP — w kolejnym kroku dopasujesz kolumny.'}
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition-colors">
                  <i className="ph ph-folder-open text-lg"></i>
                  <span>Wybierz plik z dysku</span>
                  <input
                    type="file"
                    data-testid="bulk-import-file-input"
                    accept={mode === 'machines' ? '.xlsx,.xls,.csv,.ifc' : '.xlsx,.xls,.csv'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* LEGENDA KOLUMN I WYMAGALNOŚCI DLA OBU PLIKÓW */}
              <div
                data-testid="bulk-import-legend-section"
                className="border border-slate-200 rounded-xl overflow-hidden bg-white"
              >
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <i className="ph-fill ph-book-open-text text-blue-600 text-base"></i>
                    <span>
                      Legenda kolumn i wymagalności ({mode === 'parts' ? 'Plik Części' : 'Plik Urządzeń i Podzespołów'})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-black">
                      WYMAGANE BEZWARUNKOWO
                    </span>
                    {mode === 'machines' && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                        WYMAGANE DO KODU QR
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      OPCJONALNE
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {fieldsConfig.map(field => (
                    <div
                      key={field.key}
                      data-testid={`legend-row-${field.key}`}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">{field.label}</span>
                        {renderBadgeForRequirement(field)}
                      </div>
                      <p className="text-[11px] text-slate-600 sm:max-w-md sm:text-right leading-snug">
                        {field.legendDesc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {parseError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <i className="ph ph-warning-circle text-lg"></i>
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700">
                  Wczytano plik: <span className="font-black text-slate-900">{fileName}</span> (
                  {rawRows.length} wierszy)
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Gdy wykryto duplikat:</span>
                  <select
                    data-testid="duplicate-strategy-select"
                    value={duplicateStrategy}
                    onChange={e => setDuplicateStrategy(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="skip">Pomiń duplikaty (Zostaw bez zmian)</option>
                    <option value="update">Zaktualizuj istniejące rekordy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fieldsConfig.map(field => (
                  <div
                    key={field.key}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                      field.requirementLevel === 'unconditional'
                        ? 'border-red-200 bg-red-50/20'
                        : field.requirementLevel === 'for_qr'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold text-slate-800">{field.label}</label>
                      {renderBadgeForRequirement(field)}
                    </div>
                    <select
                      data-testid={`map-col-${field.key}`}
                      value={columnMap[field.key] || ''}
                      onChange={e =>
                        setColumnMap(prev => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
                    >
                      <option value="">-- Nie importuj / Brak kolumny --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {field.legendDesc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* KAFELKI PODSUMOWANIA */}
              {mode === 'machines' ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div
                    data-testid="summary-ready-qr"
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950"
                  >
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Kompletne (Z QR)
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.readyWithQrCount}
                    </div>
                    <div className="text-[10px] text-emerald-800 mt-0.5">
                      Posiadają rejon — gotowe do druku QR
                    </div>
                  </div>

                  <div
                    data-testid="summary-incomplete-no-qr"
                    className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950"
                  >
                    <div className="text-[10px] font-bold uppercase text-amber-800">
                      Do weryfikacji (Bez QR)
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.incompleteWithoutQrCount}
                    </div>
                    <div className="text-[10px] text-amber-900 mt-0.5">
                      Brak rejonu / oznaczone — QR później
                    </div>
                  </div>

                  <div
                    data-testid="summary-subassemblies"
                    className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950"
                  >
                    <div className="text-[10px] font-bold uppercase text-indigo-700">
                      Podzespoły
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.subassembliesCount || 0}
                    </div>
                    <div className="text-[10px] text-indigo-800 mt-0.5">
                      Przypięte pod urządzenie główne
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                    <div className="text-[10px] font-bold uppercase text-blue-700">
                      Nowe rejony
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.newRegions?.length || 0}
                    </div>
                    <div className="text-[10px] text-blue-800 mt-0.5 truncate">
                      {previewData.summary.newRegions?.length
                        ? previewData.summary.newRegions.join(', ')
                        : 'Wszystkie istnieją'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-600">
                      Aktualizacje / Pominięte
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.updateCount} / {previewData.summary.skipCount}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Tryb: {duplicateStrategy === 'update' ? 'Aktualizuj' : 'Pomiń'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <div className="text-[11px] font-bold uppercase text-emerald-700">
                      Nowe części (FIFO + QR)
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.createCount}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                    <div className="text-[11px] font-bold uppercase text-blue-700">
                      Do aktualizacji
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.updateCount}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                    <div className="text-[11px] font-bold uppercase text-slate-600">
                      Pominięte duplikaty
                    </div>
                    <div className="text-2xl font-black mt-0.5">
                      {previewData.summary.skipCount}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'machines' && previewData.summary.incompleteWithoutQrCount > 0 && (
                <div
                  data-testid="incomplete-qr-warning-banner"
                  className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5"
                >
                  <i className="ph-fill ph-warning-circle text-amber-600 text-lg shrink-0 mt-0.5"></i>
                  <div>
                    <span className="font-black">
                      Zabezpieczenie kodów QR dla niekompletnych danych:
                    </span>{' '}
                    Wykryto <strong>{previewData.summary.incompleteWithoutQrCount}</strong> urządzeń bez przypisanego rejonu lub oznaczonych do weryfikacji. Zostaną one dodane do bazy z dopiskiem{' '}
                    <strong>(DO WERYFIKACJI)</strong> bez aktywnego kodu QR. Kod QR wygeneruje się automatycznie dopiero po uzupełnieniu rejonu i zatwierdzeniu w edycji urządzenia.
                  </div>
                </div>
              )}

              {exceedsMachineLimit && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                  Uwaga: Liczba nowych urządzeń ({previewData.summary.createTotalCount}) przekracza pozostały limit licencji ({remainingQuota} z {maxMachinesLimit}).
                </div>
              )}

              {/* TABELA PODGLĄDU */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Nazwa / Hierarchia</th>
                      <th className="py-2.5 px-3">
                        {mode === 'parts' ? 'Kod / Stan' : 'Rejon / Nr wew.'}
                      </th>
                      <th className="py-2.5 px-3">Status QR / Operacja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.rows.slice(0, 100).map(row => (
                      <tr
                        key={row.rowIndex}
                        className={
                          row.status === 'incomplete'
                            ? 'bg-amber-50/50'
                            : row.status === 'skip'
                            ? 'bg-slate-50 text-slate-400'
                            : 'bg-white'
                        }
                      >
                        <td className="py-2 px-3 font-mono font-bold">{row.rowIndex}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          {row.parentDisplay && (
                            <div className="text-[11px] font-bold text-indigo-700 mt-0.5 flex items-center gap-1">
                              <span>↳ Podlega pod:</span>
                              <span>{row.parentDisplay}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {mode === 'parts'
                            ? `${row.code} • ${row.stock ?? 0} ${row.unit || 'szt.'}`
                            : `${row.regionDisplay || '-'} ${
                                row.internalId ? `(${row.internalId})` : ''
                              }`}
                        </td>
                        <td className="py-2 px-3">
                          {row.status === 'ready' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                              ✓ Gotowy + Kod QR
                            </span>
                          )}
                          {row.status === 'incomplete' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                              ⚠ DO WERYFIKACJI (Kod QR później)
                            </span>
                          )}
                          {row.status === 'update' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[11px]">
                              ↻ Aktualizacja
                            </span>
                          )}
                          {row.status === 'skip' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[11px]">
                              Pominięto ({row.reason})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 4 && importResult && (
            <div
              data-testid="bulk-import-success-summary"
              className="py-6 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <i className="ph-fill ph-check-circle text-4xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900">Import zakończony pomyślnie!</h3>
              {importResult.mode === 'machines' ? (
                <div className="max-w-lg mx-auto space-y-2 text-xs sm:text-sm text-slate-700">
                  <p>
                    • Dodano kompletnych urządzeń z wygenerowanym kodem QR:{' '}
                    <strong className="text-emerald-700">{importResult.readyWithQrCount}</strong>
                  </p>
                  {importResult.subassembliesCount > 0 && (
                    <p>
                      • W tym podzespołów przypiętych pod urządzenia nadrzędne:{' '}
                      <strong className="text-indigo-700">
                        {importResult.subassembliesCount}
                      </strong>
                    </p>
                  )}
                  <p>
                    • Dodano urządzeń jako <strong>(DO WERYFIKACJI)</strong> (bez kodu QR do czasu uzupełnienia rejonu):{' '}
                    <strong className="text-amber-700">
                      {importResult.incompleteWithoutQrCount}
                    </strong>
                  </p>
                  {importResult.newRegionsCount > 0 && (
                    <p>
                      • Utworzono automatycznie nowych rejonów:{' '}
                      <strong className="text-blue-700">{importResult.newRegionsCount}</strong>
                    </p>
                  )}
                  {importResult.updateCount > 0 && (
                    <p>
                      • Zaktualizowano istniejących urządzeń:{' '}
                      <strong>{importResult.updateCount}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="max-w-lg mx-auto space-y-2 text-xs sm:text-sm text-slate-700">
                  <p>
                    • Zaimportowano nowych części magazynowych (wraz z partiami FIFO i kodami QR):{' '}
                    <strong className="text-emerald-700">{importResult.createCount}</strong>
                  </p>
                  {importResult.updateCount > 0 && (
                    <p>
                      • Zaktualizowano istniejących części:{' '}
                      <strong>{importResult.updateCount}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {isImporting && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-2">
              <div className="text-xs font-extrabold text-blue-900">
                Trwa zapisywanie paczek do bazy danych ({progress.current} / {progress.total})...
              </div>
            </div>
          )}
        </div>

        {/* STOPKA */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              disabled={isImporting}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              ← Wstecz
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                type="button"
                data-testid="go-to-preview-step-btn"
                onClick={() => setStep(3)}
                disabled={mode === 'parts' ? !columnMap.name || !columnMap.code : !columnMap.name}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-sm cursor-pointer"
              >
                Dalej: Podgląd i Weryfikacja →
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                data-testid="execute-bulk-import-btn"
                onClick={handleExecuteImport}
                disabled={
                  isImporting ||
                  exceedsMachineLimit ||
                  previewData.rows.filter(
                    r => r.status === 'ready' || r.status === 'incomplete' || r.status === 'update'
                  ).length === 0
                }
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <i className="ph-fill ph-check-circle text-base"></i>
                <span>
                  {isImporting
                    ? 'Importowanie...'
                    : `Importuj teraz (${
                        previewData.rows.filter(
                          r =>
                            r.status === 'ready' ||
                            r.status === 'incomplete' ||
                            r.status === 'update'
                        ).length
                      })`}
                </span>
              </button>
            )}

            {step === 4 ? (
              <button
                type="button"
                data-testid="close-import-modal-btn"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl cursor-pointer"
              >
                Zamknij kreator
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                Anuluj
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

BulkImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['machines', 'parts']),
  onImportSuccess: PropTypes.func,
  initialRowsForTest: PropTypes.array,
};
