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
    });
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
              grid-template-columns: repeat(4, 1fr) !important;
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
              border: 1px solid #ccc !important;
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
        <div id="printable-qr-area" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredParts.map(p => {
            const isSelected = selectedIds.has(p.id);
            const dateObj = getPartQrDateObj(p);
            const dateStr = dateObj ? dateObj.toLocaleDateString('pl-PL') : '—';
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
                className={`qr-card print-only-selected ${isSelected ? 'is-selected' : ''} cursor-pointer bg-white p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative ${
                  isSelected ? 'border-blue-500 shadow-md bg-blue-50/10' : 'border-gray-100 hover:border-gray-200 shadow-sm opacity-80'
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
                <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1 truncate w-full px-5">
                  {tenantDisplayName}
                </div>

                <div className="p-2 bg-white rounded-xl mb-2 border border-gray-100">
                  <QRCodeCanvas value={qrValue} size={110} level="M" />
                </div>

                <div className="font-extrabold text-gray-900 text-xs line-clamp-2 leading-tight mb-1 w-full">
                  {p.name}
                </div>
                <div className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-full truncate">
                  {p.code}
                </div>
                <div className="text-[9px] text-gray-500 mt-1.5 font-mono font-bold">
                  {t("parts.qr.edited")} {dateStr}
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
