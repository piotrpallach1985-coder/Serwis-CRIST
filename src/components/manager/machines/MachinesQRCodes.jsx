import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { useManagerStore } from '../../../store/managerStore';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import {
  getOrCreateQrKey,
  buildMachineQrValue,
  resolveTenantDisplayName,
  resolveMachineQrLocation,
  resolveEntityQrDate,
  formatQrDate,
} from '../../../services/qrAccess.service';
import { isMachineIncompleteForQr } from '../../../utils/bulkImportHelper';
import { resolveAnonymousReportPin } from '../../../utils/fieldServiceHelpers';

export default function MachinesQRCodes({ onBack }) {
  const { t } = useTranslation();
  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  const branding = useManagerStore(state => state.branding);
  const mapSettings = useManagerStore(state => state.mapSettings);

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [qrKey, setQrKey] = useState(null);
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [showPinOnQr, setShowPinOnQr] = useState(false);

  const machineByIdMap = useMemo(() => {
    const map = new Map();
    (machines || []).forEach(m => {
      if (m?.id) map.set(m.id, m);
    });
    return map;
  }, [machines]);

  const tenantId = getCurrentTenant();
  const tenantName = resolveTenantDisplayName(tenantId, branding);

  useEffect(() => {
    let active = true;
    getOrCreateQrKey(tenantId)
      .then(k => {
        if (active) setQrKey(k);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tenantId]);

  const activeMachines = useMemo(() => {
    return (machines || []).filter(m => !m.isDeleted && !isMachineIncompleteForQr(m));
  }, [machines]);

  const unverifiedMachinesCount = useMemo(() => {
    return (machines || []).filter(m => !m.isDeleted && isMachineIncompleteForQr(m)).length;
  }, [machines]);

  const filteredMachines = useMemo(() => {
    return activeMachines.filter(m => {
      if (filterRegion) {
        if (filterRegion === 'bez_rejonu') {
          if (m.regionId) return false;
        } else if (m.regionId !== filterRegion) {
          return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchCode = (m.internalId || '').toLowerCase().includes(q);
        const matchBay = (m.bay || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBay) return false;
      }

      if (dateFrom || dateTo) {
        const itemDate = resolveEntityQrDate(m, machines);
        if (!itemDate) return false;
        const dTime = new Date(itemDate).setHours(0, 0, 0, 0);
        if (dateFrom) {
          const fromTime = new Date(dateFrom).setHours(0, 0, 0, 0);
          if (dTime < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).setHours(23, 59, 59, 999);
          if (dTime > toTime) return false;
        }
      }

      return true;
    }).slice().sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'pl', {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [activeMachines, filterRegion, searchQuery, dateFrom, dateTo, machines]);

  const toggleSelect = id => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(filteredMachines.map(m => m.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert(t('machines.qr.print_alert', 'Wybierz przynajmniej jedno urządzenie do druku.'));
      return;
    }
    window.print();
  };

  const getRegionName = regionId => {
    if (!regionId) return '';
    return regions.find(r => r.id === regionId)?.name || '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="no-print bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-3.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 text-sm shrink-0"
              >
                <i className="ph ph-arrow-left text-lg"></i>
                <span>{t('machines.buttons.back', 'Powrót')}</span>
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t('machines.qr.title', 'Baza QR Urządzeń')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('machines.qr.subtitle', 'Wybierz urządzenia i podzespoły, aby wydrukować ich etykiety QR.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                data-testid="qr-print-show-pin-checkbox"
                checked={showPinOnQr}
                onChange={e => setShowPinOnQr(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <i className="ph ph-key text-sm text-amber-600"></i>
              <span>Drukuj PIN zgłoszeń na etykiecie QR (jeśli nadano)</span>
            </label>
            <button
              type="button"
              onClick={selectAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              {t('parts.buttons.select_all', 'Zaznacz wszystkie')}
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              {t('parts.buttons.deselect_all', 'Odznacz wszystkie')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ph ph-printer text-lg"></i>
              {t('parts.buttons.print_selected', 'Drukuj wybrane')} ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              {t('parts.qr.search_label', 'Wyszukaj')}
            </label>
            <input
              type="text"
              placeholder={t('machines.filters.searchPlaceholder', 'Szukaj (nazwa, nr wew)...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              {t('machines.form.region', 'Miejsce montażu')}
            </label>
            <select
              value={filterRegion}
              onChange={e => setFilterRegion(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('machines.filters.allRegions', 'Wszystkie miejsca montażu')}</option>
              <option value="bez_rejonu">{t('machines.filters.noRegion', 'Bez miejsca montażu')}</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              {t('parts.qr.date_from', 'Data od')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              {t('parts.qr.date_to', 'Data do')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end pb-1">
            <span className="text-xs font-bold text-gray-500">
              {t('parts.qr.selected', 'Zaznaczono:')} {selectedIds.length}{' '}
              {t('parts.qr.of_visible', { total: filteredMachines.length })}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-machines-qr-area, #printable-machines-qr-area * {
            visibility: visible;
          }
          #printable-machines-qr-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-selected {
            display: none !important;
          }
          .print-only-selected.is-selected {
            display: flex !important;
            border: 2px solid #0f172a !important;
            border-radius: 16px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            opacity: 1 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {unverifiedMachinesCount > 0 && (
        <div
          data-testid="qr-unverified-machines-notice"
          className="no-print bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-xl text-xs font-semibold flex flex-wrap items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2.5">
            <i className="ph-fill ph-warning-circle text-amber-600 text-lg shrink-0"></i>
            <span>
              Ukryto <strong>{unverifiedMachinesCount}</strong> urządzeń oznaczonych jako{' '}
              <strong>(DO WERYFIKACJI)</strong> lub bez przypisanego rejonu. Kody QR zostaną dla nich
              wygenerowane po uzupełnieniu rejonu i zatwierdzeniu w bazie urządzeń.
            </span>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Przejdź do weryfikacji urządzeń
            </button>
          )}
        </div>
      )}

      <div
        id="printable-machines-qr-area"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      >
        {filteredMachines.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 no-print">
            <i className="ph ph-qr-code text-4xl text-gray-300 mb-2"></i>
            <h3 className="text-lg font-bold text-gray-700">
              {t('machines.table.empty', 'Brak urządzeń spełniających kryteria.')}
            </h3>
          </div>
        ) : (
          filteredMachines.slice(0, visibleLimit).map(machine => {
            const qrDateStr = formatQrDate(machine, machines, '-');
            const qrVal = buildMachineQrValue(machine, tenantId, qrKey, {
              branding,
              tenantName,
              allMachines: machines,
              date: qrDateStr,
            });
            const isSelected = selectedIds.includes(machine.id);
            const locationStr = resolveMachineQrLocation(machine, regions, '-');
            const internalIdStr = machine.internalId || machine.licensePlate || '-';
            const parentMachine = machine.parentId
              ? machineByIdMap.get(machine.parentId) || null
              : null;
            const pinReq = resolveAnonymousReportPin(machine, regions, branding, mapSettings);

            return (
              <div
                key={machine.id}
                onClick={() => toggleSelect(machine.id)}
                className={`print-only-selected cursor-pointer bg-white p-5 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative ${
                  isSelected
                    ? 'is-selected border-slate-900 ring-2 ring-blue-500/40 shadow-md'
                    : 'border-slate-300 hover:border-slate-500 shadow-sm opacity-90'
                }`}
              >
                <div className="no-print absolute top-3 right-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <i className="ph ph-check text-xs font-bold"></i>}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-1.5 px-4 w-full">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 21H21V10L16 13V10L11 13V6H3V21Z"
                      fill="#cbd5e1"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 3V6M9 3V6"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                    {tenantName}
                  </span>
                </div>

                <div className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider leading-snug mb-3">
                  VexoNT - SKANUJ ABY ZGŁOSIĆ AWARIĘ
                </div>

                <div className="my-1 flex items-center justify-center">
                  <QRCodeCanvas value={qrVal} size={136} level="M" />
                </div>

                <div className="font-extrabold text-slate-900 text-sm leading-snug mt-3 mb-1 w-full break-words">
                  {machine.name}
                </div>

                {parentMachine && (
                  <div className="text-[10px] font-semibold text-slate-500 truncate w-full mb-1">
                    ↳ {parentMachine.name}
                  </div>
                )}

                <div className="w-full border-t-2 border-dashed border-slate-300 my-2.5"></div>

                <div className="w-full text-left space-y-1.5">
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      LOKALIZACJA
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                      {locationStr}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      NUMER WEWNĘTRZNY UR
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900 leading-snug break-words">
                      {internalIdStr}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      DATA KODU (OST. EDYCJA)
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900 leading-snug">
                      {qrDateStr}
                    </div>
                  </div>
                  {showPinOnQr && pinReq.required && pinReq.pin && (
                    <div
                      data-testid={`qr-card-pin-${machine.id}`}
                      className="pt-1.5 mt-1 border-t border-dashed border-slate-300"
                    >
                      <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        KOD PIN ZGŁOSZEŃ
                      </div>
                      <div className="text-xs font-extrabold font-mono text-slate-900 tracking-widest leading-snug">
                        {pinReq.pin}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredMachines.length > visibleLimit && (
        <div className="no-print flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleLimit(prev => prev + 60)}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Pokaż kolejne kody QR ({visibleLimit} z {filteredMachines.length})
          </button>
        </div>
      )}
    </div>
  );
}
