import { generateAuditorReport } from '../../utils/reports/auditorExport';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function HomeDashboard({ setActiveTab, setCurrentModule, user }) {
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    return () => unsub();
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[600px] p-6 animate-fade-in bg-slate-50">
      <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">Witaj w systemie zarządzania</h2>
      <p className="text-slate-500 mb-12 text-center max-w-lg">
        Wybierz moduł, do którego chcesz przejść, aby rozpocząć pracę.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {modSettings.enableTickets && (
      <>
        {/* AWARIE UR */}
        <button 
          onClick={() => {
            setCurrentModule('tickets'); setActiveTab('dashboard_tickets'); window.history.pushState({ module: 'tickets', tab: 'dashboard_tickets' }, '', '?module=tickets&tab=dashboard_tickets');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i className="ph ph-warning-circle"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Awarie UR</h3>
          <p className="text-sm text-slate-500 text-center">Zarządzanie bieżącymi awariami i usterkami zgłaszanymi z produkcji.</p>
        </button>
      </>
    )}

        {modSettings.enablePlanned && (
      <>
        {/* SERWIS UR */}
        <button 
          onClick={() => {
            setCurrentModule('planned_maintenance'); setActiveTab('dashboard_planned'); window.history.pushState({ module: 'planned_maintenance', tab: 'dashboard_planned' }, '', '?module=planned_maintenance&tab=dashboard_planned');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:emerald-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <i className="ph ph-calendar-check"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Serwis UR</h3>
          <p className="text-sm text-slate-500 text-center">Harmonogramy przeglądów, prewencja i zaplanowane prace serwisowe.</p>
        </button>
      </>
    )}

        {/* ADMINISTRACJA */}
        <button 
          onClick={() => {
            setCurrentModule('master_data');
            const t = user?.role === 'admin' ? 'settings' : 'machines';
            setActiveTab(t);
            window.history.pushState({ module: 'master_data', tab: t }, '', '?module=master_data&tab='+t);
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:purple-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <i className="ph ph-gear"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Administracja</h3>
          <p className="text-sm text-slate-500 text-center">Baza maszyn, ustawienia, pracownicy i konfiguracja systemu.</p>
        </button>
      
        
      </div>
    </div>
  );
}
