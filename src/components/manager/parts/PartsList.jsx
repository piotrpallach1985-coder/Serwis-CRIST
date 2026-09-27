import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useManagerStore } from '../../../store/managerStore';
import PartForm from './PartForm';
import PartDetails from './PartDetails';
import QRScannerModal from '../../shared/QRScannerModal';

export default function PartsList({ user }) {
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
        <PartDetails part={currentPart} onBack={() => setSelectedPartId(null)} user={user} onEdit={() => setIsFormOpen(true)} />
        {isFormOpen && <PartForm part={currentPart} onClose={() => setIsFormOpen(false)} user={user} />}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="hidden md:block">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Baza Magazynowa</h2>
            <p className="text-sm text-slate-500 mt-1">Zarządzaj częściami zapasowymi, przypisuj je do maszyn i śledź stany</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-qr-code text-lg"></i>
              Skanuj QR
            </button>
            <button
              onClick={() => { setIsFormOpen(true); setSelectedPartId(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-plus text-lg"></i>
              Dodaj Część
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input
              type="text"
              placeholder="Szukaj po nazwie, kodzie, lokalizacji..."
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
                {f === 'all' ? 'Wszystkie' : f === 'available' ? 'Dostępne' : 'Na wyczerpaniu'}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Brak wyników</h3>
            <p className="text-slate-500">Nie znaleziono części spełniających kryteria.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* WIDOK PWA / MOBILE */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredParts.map(part => {
                const isOut = part.stock.available <= 0;
                const isLow = part.stock.available <= (part.minStock || 0) && !isOut;
                return (
                  <div key={part.id} onClick={() => setSelectedPartId(part.id)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
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
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dostępne</div>
                        <div className={`text-lg font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-emerald-600'}`}>
                          {part.stock.available} <span className="text-xs font-semibold text-slate-400 ml-0.5">{part.unit || 'szt.'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lokalizacja</div>
                        <div className="text-sm font-semibold text-slate-700 mt-1">{part.location || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WIDOK DESKTOP */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Nazwa Części / Kod</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Lokalizacja</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Zgodne Maszyny</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Dostępne</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Rezerwa</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Fizycznie (Min)</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.map(part => {
                    const isOut = part.stock.available <= 0;
                    const isLow = part.stock.available <= (part.minStock || 0) && !isOut;
                    
                    return (
                      <tr key={part.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedPartId(part.id)}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-sm ${isOut ? 'bg-red-50 text-red-500' : isLow ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              <i className="ph ph-nut text-lg"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{part.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">{part.code || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-600">
                          {part.location || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex gap-1 flex-wrap max-w-[200px]">
                            {(part.compatibleMachines || []).slice(0, 2).map(mid => {
                              const mName = machines.find(m => m.id === mid)?.name || 'Nieznana maszyna';
                              return <span key={mid} className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600">{mName}</span>
                            })}
                            {(part.compatibleMachines || []).length > 2 && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500">+{part.compatibleMachines.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-black ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {part.stock.available} {part.unit || 'szt.'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-bold text-slate-500">
                          {part.stock.reserved} {part.unit || 'szt.'}
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">
                          {part.stock.physical} <span className="text-[9px] text-slate-400 ml-1">({part.minStock || 0})</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPartId(part.id); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                            <i className="ph ph-caret-right text-lg"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
        )}
      </div>

      {isFormOpen && (
        <PartForm 
          part={currentPart || null} 
          onClose={() => setIsFormOpen(false)} 
          user={user} 
        />
      )}
      
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScan}
          title="Skanuj Kod QR Części"
        />
      )}
    </div>
  );
}
