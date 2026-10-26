import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { useManagerStore } from '../../../store/managerStore';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import {
  getOrCreateQrKey,
  buildMachineQrValue,
  resolveTenantDisplayName,
  resolveEntityQrDate,
  formatQrDate,
} from '../../../services/qrAccess.service';

export default function MachinesQRCodes({ onBack }) {
  const { t } = useTranslation();
  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  const branding = useManagerStore(state => state.branding);

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [qrKey, setQrKey] = useState(null);

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
    return (machines || []).filter(
      m => !m.isDeleted && !(m.name && m.name.includes('(DO WERYFIKACJI)'))
    );
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

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
          }
          .no-print {
            display: none !important;
          }
          .print-only-selected {
            display: none !important;
          }
          .print-only-selected.is-selected {
            display: flex !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div
        id="printable-machines-qr-area"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {filteredMachines.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 no-print">
            <i className="ph ph-qr-code text-4xl text-gray-300 mb-2"></i>
            <h3 className="text-lg font-bold text-gray-700">
              {t('machines.table.empty', 'Brak urządzeń spełniających kryteria.')}
            </h3>
          </div>
        ) : (
          filteredMachines.map(machine => {
            const qrDateStr = formatQrDate(machine, machines, '-');
            const qrVal = buildMachineQrValue(machine, tenantId, qrKey, {
              branding,
              tenantName,
              allMachines: machines,
              date: qrDateStr,
            });
            const isSelected = selectedIds.includes(machine.id);
            const regionName = getRegionName(machine.regionId);
            const parentMachine = machine.parentId
              ? machines.find(m => m.id === machine.parentId)
              : null;

            return (
              <div
                key={machine.id}
                onClick={() => toggleSelect(machine.id)}
                className={`print-only-selected cursor-pointer bg-white p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative ${
                  isSelected
                    ? 'is-selected border-blue-600 shadow-md bg-blue-50/10'
                    : 'border-gray-100 hover:border-gray-200 shadow-sm opacity-80'
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

                <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1 truncate w-full px-5">
                  {tenantName}
                </div>

                <div className="p-2 bg-white rounded-xl mb-2 border border-gray-100 flex items-center justify-center gap-1.5">
                  <span
                    className="text-[8px] font-semibold text-slate-400 tracking-widest select-none"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    system VexoNT
                  </span>
                  <QRCodeCanvas value={qrVal} size={120} level="M" />
                  <span
                    className="text-[8px] font-semibold text-slate-400 tracking-widest select-none"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    system VexoNT
                  </span>
                </div>

                <div className="font-extrabold text-gray-900 text-xs line-clamp-2 leading-tight mb-1 w-full">
                  {machine.name}
                </div>

                {parentMachine && (
                  <div className="text-[9px] font-semibold text-slate-500 truncate w-full mb-0.5">
                    ↳ {parentMachine.name}
                  </div>
                )}

                {(machine.internalId || regionName) && (
                  <div className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-full truncate">
                    {[machine.internalId, regionName].filter(Boolean).join(' • ')}
                  </div>
                )}

                <div className="text-[9px] text-gray-500 mt-1.5 font-mono font-bold">
                  {t('parts.qr.generated', 'Wygenerowano:')} {qrDateStr}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
