import { useTranslation } from 'react-i18next';
import React, { useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useManagerStore } from '../../../store/managerStore';
import { safeParseDate } from '../../../utils/dateHelpers';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { buildPartQrValue } from '../../../services/qrAccess.service';

export default function PartsQRCodes() {
  const { t } = useTranslation();
  const parts = useManagerStore(state => state.parts) || [];
  const branding = useManagerStore(state => state.branding);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const tenantId = getCurrentTenant();
  const tenantDisplayName = branding?.companyName || branding?.name || tenantId?.toUpperCase() || 'FIRMA';

  const getPartQrDateObj = (p) => safeParseDate(p.qrCreatedAt || p.createdAt || p.updatedAt);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      if (search) {
        const s = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(s);
        const matchCode = p.code?.toLowerCase().includes(s);
        if (!matchName && !matchCode) return false;
      }

      if (dateFrom || dateTo) {
        const itemDate = getPartQrDateObj(p);
        if (!itemDate) return false;

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (itemDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (itemDate > to) return false;
        }
      }

      return true;
    }).slice().sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'pl', {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [parts, search, dateFrom, dateTo]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = filteredParts.map(p => p.id);
    setSelectedIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-qr-area, #printable-qr-area * {
              visibility: visible;
            }
            #printable-qr-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 16px !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-only-selected:not(.is-selected) {
              display: none !important;
            }
            .qr-card {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 2px solid #0f172a !important;
              border-radius: 16px !important;
              background: #ffffff !important;
              opacity: 1 !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      {/* Pasek narzędzi (ukryty w druku) */}
      <div className="no-print bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{t("parts.qr.title")}</h2>
            <p className="text-sm text-gray-500 mt-1">{t("parts.qr.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              {t("parts.buttons.select_all")}
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              {t("parts.buttons.deselect_all")}
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ph ph-printer text-lg"></i> {t("parts.buttons.print_selected")} ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Filtry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("parts.qr.search_label")}</label>
            <input
              type="text"
              placeholder={t("parts.qr.search_placeholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("parts.qr.date_from")}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t("parts.qr.date_to")}</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end pb-1">
            <span className="text-xs font-bold text-gray-500">
              {t("parts.qr.selected")} {selectedIds.size} {t("parts.qr.of_visible", { total: filteredParts.length })}
            </span>
          </div>
        </div>
      </div>

      {/* Siatka Kodów QR */}
      {filteredParts.length === 0 ? (
        <div className="no-print bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
          {t("parts.qr.no_parts")}
        </div>
      ) : (
        <div id="printable-qr-area" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredParts.map(p => {
            const isSelected = selectedIds.has(p.id);
            const dateObj = getPartQrDateObj(p);
            const dateStr = dateObj ? dateObj.toLocaleDateString('pl-PL') : '—';
            const partLocationStr = [p.building, p.location].filter(Boolean).join(' / ') || '-';
            const partCodeStr = p.code || '-';
            const qrValue = buildPartQrValue(tenantId, p.id, {
              tenantName: tenantDisplayName,
              partName: p.name,
              partCode: p.code,
              qrDate: dateStr !== '—' ? dateStr : ''
            });

            return (
              <div
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`qr-card print-only-selected ${isSelected ? 'is-selected' : ''} cursor-pointer bg-white p-5 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative ${
                  isSelected ? 'border-slate-900 ring-2 ring-blue-500/40 shadow-md' : 'border-slate-300 hover:border-slate-500 shadow-sm opacity-90'
                }`}
              >
                {/* Checkbox (ukryty w druku) */}
                <div className="no-print absolute top-3 right-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <i className="ph ph-check text-xs font-bold"></i>}
                  </div>
                </div>

                {/* Nazwa tenanta na górze */}
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
                    {tenantDisplayName}
                  </span>
                </div>

                <div className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider leading-snug mb-3">
                  VexoNT - MAGAZYN CZĘŚCI UR
                </div>

                <div className="my-1 flex items-center justify-center">
                  <QRCodeCanvas value={qrValue} size={136} level="M" />
                </div>

                <div className="font-extrabold text-slate-900 text-sm leading-snug mt-3 mb-2.5 w-full break-words">
                  {p.name}
                </div>

                <div className="w-full border-t-2 border-dashed border-slate-300 mb-2.5"></div>

                <div className="w-full text-left space-y-1.5">
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      LOKALIZACJA
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                      {partLocationStr}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      NUMER WEWNĘTRZNY UR
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900 leading-snug break-words">
                      {partCodeStr}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                      DATA KODU (OST. EDYCJA)
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900 leading-snug">
                      {dateStr}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedIds.size === 0 && filteredParts.length > 0 && (
        <div className="no-print bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-bold text-center">
          {t("parts.qr.print_alert")}
        </div>
      )}
    </div>
  );
}
