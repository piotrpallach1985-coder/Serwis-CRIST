import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../../store/managerStore';
import { QRCodeCanvas } from 'qrcode.react';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { safeParseDate } from '../../../utils/dateHelpers';

export default function PartsQRCodes() {
  const { t } = useTranslation();
  const parts = useManagerStore(state => state.parts || []);
  const tenantId = getCurrentTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtering
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchSearch = (part.name?.toLowerCase().includes(searchTerm.toLowerCase()) || part.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchDate = true;
      const partDate = safeParseDate(part.createdAt || part.qrCreatedAt);
      
      if (partDate) {
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (partDate < from) matchDate = false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (partDate > to) matchDate = false;
        }
      } else {
        if (dateFrom || dateTo) {
            matchDate = false; 
        }
      }

      return matchSearch && matchDate;
    });
  }, [parts, searchTerm, dateFrom, dateTo]);

  const handleSelectAll = () => {
    const allFilteredIds = filteredParts.map(p => p.id);
    setSelectedIds(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert(t('parts.qr.print_alert'));
      return;
    }
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      {/* Niewidoczne do druku: Pasek akcji i filtry */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 print:hidden">
        {/* Nagłówek i Drukuj */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('parts.qr.title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('parts.qr.subtitle')}</p>
          </div>
          <button 
            onClick={handlePrint} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
          >
            <i className="ph ph-printer text-lg"></i> {t('parts.buttons.print_selected')} </button>
        </div>

        {/* Filtry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('parts.qr.search_label')}</label>
            <div className="relative">
              <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder={t('parts.qr.search_placeholder')} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('parts.qr.date_from')}</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('parts.qr.date_to')}</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Akcje zaznaczania */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex gap-2">
            <button 
              onClick={handleSelectAll}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-700 transition-colors"
            > {t('parts.buttons.select_all')} </button>
            <button 
              onClick={handleDeselectAll}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-700 transition-colors"
            > {t('parts.buttons.deselect_all')} </button>
          </div>
          <div className="text-sm font-bold text-slate-600"> {t('parts.qr.selected')} <span className="text-blue-600">{selectedIds.length}</span> {t('parts.qr.of_visible').replace('{total}', filteredParts.length)}
          </div>
        </div>
      </div>

      {filteredParts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm print:hidden">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-qr-code text-3xl text-slate-300"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">{t('parts.qr.no_parts')}</h3>
          <p className="text-slate-500">{t('parts.list.no_results_desc')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 print:bg-transparent">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 gap-6 print:gap-4">
            {filteredParts.map(part => {
              const qrValue = `tenant=${tenantId}&part=${part.id}`;
              const isSelected = selectedIds.includes(part.id);

              return (
                <div 
                  key={part.id} 
                  onClick={() => toggleSelect(part.id)}
                  className={`relative cursor-pointer border rounded-xl p-4 flex flex-col items-center text-center break-inside-avoid transition-all 
                    ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 print:border-slate-300 print:ring-0' : 'border-slate-200 hover:border-slate-300 print:hidden'}`}
                >
                  {/* Checkbox wizualny */}
                  <div className="absolute top-2 right-2 print:hidden">
                    {isSelected ? (
                      <i className="ph-fill ph-check-circle text-blue-500 text-xl"></i>
                    ) : (
                      <i className="ph ph-circle text-slate-300 text-xl"></i>
                    )}
                  </div>
                  
                  <QRCodeCanvas value={qrValue} size={100} level="M" />
                  <div className="mt-3 font-black text-slate-800 text-sm leading-tight">{part.name}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{part.code || '-'}</div>
                  {part.location && (
                    <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-2 font-bold print:bg-white print:border print:border-slate-200">{part.location}</div>
                  )}
                  <div className="text-[9px] text-slate-400 font-semibold mt-2 print:text-slate-500">{t('parts.qr.edited')} {safeParseDate(part.updatedAt || part.createdAt)?.toLocaleDateString('pl-PL') || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .bg-white { background: transparent !important; }
          
          /* Szukamy głównego kontenera druku */
          .grid { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; display: grid; gap: 1rem; }
          .grid > div:not(.print\\:hidden) { visibility: visible; }
          .grid > div:not(.print\\:hidden) * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
