import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import DataTable from '../../shared/DataTable';
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useManagerStore } from '../../../store/managerStore';
import PartForm from './PartForm';
import PartDetails from './PartDetails';
import QRScannerModal from '../../shared/QRScannerModal';

export default function PartsList({ }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const parts = useManagerStore(state => state.parts || []);
  const plannedServices = useManagerStore(state => state.plannedServices || []);
  const machines = useManagerStore(state => state.machines || []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'low'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(null); // for details
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openPart = params.get('openPart');
    if (openPart) {
      setSelectedPartId(openPart);
      // remove param so it doesn't re-trigger on every render
      params.delete('openPart');
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true }
      );
    }
  }, [location.search, navigate]);

  // calculate reserved quantities on the fly
  const partsWithStats = useMemo(() => {
    return parts.map(p => {
      let reserved = 0;
      plannedServices.filter(s => s.status !== 'completed').forEach(s => {
        if (s.requiredParts) {
          const req = s.requiredParts.find(rp => rp.partId === p.id);
          if (req) reserved += Number(req.quantity || 0);
        }
      });
      const available = Number(p.stock) - reserved;
      return { ...p, reserved, available };
    });
  }, [parts, plannedServices]);

  const filteredParts = useMemo(() => {
    return partsWithStats.filter(p => {
      if (filter === 'available' && p.available <= 0) return false;
      if (filter === 'low' && p.available >= Number(p.minStock)) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [partsWithStats, filter, searchQuery]);

  const handleScan = (text) => {
    try {
      setIsScannerOpen(false);
      // expect "tenant=xxx&part=yyy" or just "yyy"
      const urlParams = new URLSearchParams(text.includes('?') ? text.split('?')[1] : text);
      const partId = urlParams.get('part') || text;
      const found = partsWithStats.find(p => p.id === partId);
      if (found) {
        setSelectedPartId(found.id);
      } else {
        alert("Nie znaleziono części o kodzie: " + partId);
      }
    } catch (err) {
      alert("Błąd skanowania kodu QR.");
    }
  };

  const currentPart = partsWithStats.find(p => p.id === selectedPartId);
  if (selectedPartId && currentPart) {
    return (
      <div className="w-full">
        <PartDetails part={currentPart} onBack={() => setSelectedPartId(null)} onEdit={() => setIsFormOpen(true)} />
        {isFormOpen && <PartForm part={currentPart} onClose={() => setIsFormOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="hidden md:block">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('parts.layout.title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('parts.layout.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-qr-code text-lg"></i>
              {t('parts.buttons.scan_qr')}
            </button>
            <button
              onClick={() => { setIsFormOpen(true); setSelectedPartId(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-plus text-lg"></i>
              {t('parts.buttons.add_part')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input
              type="text"
              placeholder={t('parts.list.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'available', 'low'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? t('parts.list.filter_all') : f === 'available' ? t('parts.list.filter_available') : t('parts.list.filter_low')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredParts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ph ph-archive-box text-3xl text-slate-300"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('parts.list.no_results_title')}</h3>
            <p className="text-slate-500">{t('parts.list.no_results_desc')}</p>
          </div>
        ) : (
                      <div className="w-full">
              {/* WIDOK Z DATATABLE */}
              <DataTable 
                data={filteredParts}
                columns={[
                  {
                    header: t('parts.table.name_code'),
                    accessor: 'name',
                    render: (part) => {
                      const isOut = part.available <= 0;
                      const isLow = part.available <= (part.minStock || 0) && !isOut;
                      return (
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-sm ${isOut ? 'bg-red-50 text-red-500' : isLow ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            <i className="ph ph-nut text-lg"></i>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{part.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{part.code || '-'}</div>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    header: t('parts.table.location'),
                    accessor: 'location',
                    render: (part) => <span className="text-xs font-medium text-slate-600">{part.location || '-'}</span>
                  },
                  {
                    header: t('parts.table.available'),
                    accessor: 'available',
                    align: 'center',
                    render: (part) => {
                      const isOut = part.available <= 0;
                      const isLow = part.available <= (part.minStock || 0) && !isOut;
                      return (
                        <div className={`inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg ${isOut ? 'bg-red-50 text-red-700' : isLow ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          <span className="text-sm font-black">{part.available}</span>
                          <span className="text-[9px] font-bold uppercase opacity-70">{part.unit || 'szt.'}</span>
                        </div>
                      );
                    }
                  },
                  {
                    header: t('parts.table.actions'),
                    accessor: 'actions',
                    align: 'right',
                    render: (part) => (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPartId(part.id); }} 
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 text-sm ml-auto"
                      >
                        {t('parts.buttons.details')} <i className="ph ph-caret-right font-bold"></i>
                      </button>
                    )
                  }
                ]}
                rowClassName={() => 'group'}
                onRowClick={(part) => setSelectedPartId(part.id)}
                renderMobileCard={(part) => {
                  const isOut = part.available <= 0;
                  const isLow = part.available <= (part.minStock || 0) && !isOut;
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => setSelectedPartId(part.id)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isOut ? 'bg-red-50 text-red-500 border border-red-100' : isLow ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                            <i className="ph ph-nut text-xl"></i>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 leading-tight">{part.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1">{part.code || '-'}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('parts.table.available')}</div>
                          <div className={`text-lg font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-emerald-600'}`}>
                            {part.available} <span className="text-xs font-semibold text-slate-400 ml-0.5">{part.unit || 'szt.'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('parts.table.location')}</div>
                          <div className="text-sm font-semibold text-slate-700 mt-1">{part.location || '-'}</div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
        )}
      </div>

      {isFormOpen && (
        <PartForm 
          part={currentPart || null} 
          onClose={() => setIsFormOpen(false)} 
          />
      )}
      
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScan}
          title={t('parts.details.qr_title')}
        />
      )}
    </div>
  );
}
