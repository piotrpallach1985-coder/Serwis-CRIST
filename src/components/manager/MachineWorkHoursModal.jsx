import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { safeParseDate } from '../../utils/dateHelpers';

export default function MachineWorkHoursModal({ isOpen, onClose, machine, user }) {
  const [newHours, setNewHours] = useState(machine.currentWorkHours || 0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(newHours) < 0) {
      setErrorMsg('Roboczogodziny nie mogą być ujemne.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const tenantId = getCurrentTenant();
      const machineRef = doc(db, 'tenants', tenantId, 'machines', machine.id);
      
      const updateData = {
        currentWorkHours: Number(newHours),
        lastWorkHoursUpdate: serverTimestamp(),
        workHoursHistory: arrayUnion({
          hours: Number(newHours),
          date: new Date().toISOString(),
          user: user?.name || 'System'
        })
      };

      await updateDoc(machineRef, updateData);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Wystąpił błąd podczas zapisywania.');
    }
    setLoading(false);
  };

  const history = machine.workHoursHistory || [];
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-2 sm:p-4" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-800 leading-tight pr-2">Aktualizacja Roboczogodzin (RBG)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 shrink-0">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100">
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mb-8 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Nowy stan licznika (RBG)</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <input 
                type="number" 
                value={newHours} 
                onChange={(e) => setNewHours(e.target.value)}
                className="w-full sm:flex-1 p-3 border border-gray-300 rounded-lg outline-none text-lg font-bold"
                required
                min="0"
                step="0.1"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading ? 'Zapis...' : 'Zapisz'}
              </button>
            </div>
          </form>

          <div className="w-full">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <i className="ph ph-clock-counter-clockwise text-gray-500"></i>
              Historia Aktualizacji
            </h3>
            {sortedHistory.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">Brak historii aktualizacji.</p>
            ) : (
              <div className="space-y-2 sm:space-y-3 w-full">
                {sortedHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-2 sm:p-3 border border-gray-100 rounded-lg bg-gray-50 text-sm gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800">{h.hours} RBG</div>
                      <div className="text-xs text-gray-500 truncate">Dodał: {h.user}</div>
                    </div>
                    <div className="text-gray-400 text-[10px] sm:text-xs text-right shrink-0">
                      <div>{safeParseDate(h.date)?.toLocaleDateString('pl-PL')}</div>
                      <div>{safeParseDate(h.date)?.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
