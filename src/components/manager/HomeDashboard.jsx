import { generateAuditorReport } from '../../utils/reports/auditorExport';
import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Html5Qrcode } from 'html5-qrcode';

export default function HomeDashboard({ setActiveTab, setCurrentModule, user }) {
  const [modSettings, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scanner') === 'true') {
      startScanner();
      // Remove it from URL so it doesn't trigger again on reload
      const newUrl = window.location.pathname + '?module=home&tab=home';
      window.history.replaceState({ module: 'home', tab: 'home' }, '', newUrl);
    }
  }, []);

  const html5QrcodeRef = useRef(null);
  const machinesRef = useRef([]);

  // Fetch machines for validation
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setModSettings({ enableTickets: d.enableTickets !== false, enablePlanned: d.enablePlanned !== false });
      }
    });
    
    // We also need machines list for validation. We can get it from 'machines' collection.
    // Instead of doing onSnapshot here just for machines, we can just rely on the openMachine parameter handled in ManagerView/Machines,
    // which will validate if it exists anyway!
    return () => unsub();
  }, []);

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        if (html5QrcodeRef.current) {
          try { await html5QrcodeRef.current.stop(); } catch(e) {}
        }
        const html5QrCode = new Html5Qrcode("dashboard-qr-reader");
        html5QrcodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopScanner();
            let machineId = decodedText;
            if (decodedText.includes('?machine=')) {
              const urlParams = new URLSearchParams(decodedText.split('?')[1]);
              machineId = urlParams.get('machine');
            }
            // Switch to MasterData -> Machines with openMachine
            setCurrentModule('master_data');
            setActiveTab('machines');
            window.history.pushState({ module: 'master_data', tab: 'machines' }, '', `?module=master_data&tab=machines&openMachine=${machineId}`);
          },
          () => {} // Ignore errors
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        alert("Błąd dostępu do kamery: " + err.message);
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error("Stop scanner err:", e);
      }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[600px] p-6 animate-fade-in bg-slate-50 relative">
      <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">Witaj w systemie zarządzania</h2>
      <p className="text-slate-500 mb-12 text-center max-w-lg">
        Wybierz moduł, do którego chcesz przejść, aby rozpocząć pracę.
      </p>

      {isScanning && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-slate-800">Skanuj kod QR maszyny</h3>
              <button onClick={stopScanner} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <i className="ph ph-x"></i>
              </button>
            </div>
            <div id="dashboard-qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
            <p className="text-xs text-center text-slate-500">
              Skieruj aparat na kod QR znajdujący się na maszynie, aby otworzyć jej dokumentację DTR oraz szczegóły.
            </p>
          </div>
        </div>
      )}

      {/* Zmieniono grid na 4 kolumny i pomniejszono kafelki (p-6, w-16 h-16, text-3xl) zgodnie z życzeniem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
        
        {/* SKANER MASZYN / DTR (Nowa Kafelka) */}
        <button 
          onClick={startScanner}
          className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all overflow-hidden">
            <i className="ph ph-qr-code z-10"></i>
            <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-blue-400 opacity-50 rounded-full z-0"></div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 text-center leading-tight">Maszyny / DTR</h3>
          <p className="text-xs text-slate-500 text-center">Skanuj QR na hali aby otworzyć Dokumentację Techniczno-Ruchową.</p>
        </button>

        {modSettings.enableTickets && (
          <button 
            onClick={() => {
              setCurrentModule('tickets'); setActiveTab('dashboard_tickets'); window.history.pushState({ module: 'tickets', tab: 'dashboard_tickets' }, '', '?module=tickets&tab=dashboard_tickets');
            }}
            className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-400 transition-all cursor-pointer transform hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <i className="ph ph-warning-circle"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 text-center leading-tight">Awarie UR</h3>
            <p className="text-xs text-slate-500 text-center">Zarządzanie awariami zgłaszanymi z produkcji.</p>
          </button>
        )}

        {modSettings.enablePlanned && (
          <button 
            onClick={() => {
              setCurrentModule('planned_maintenance'); setActiveTab('dashboard_planned'); window.history.pushState({ module: 'planned_maintenance', tab: 'dashboard_planned' }, '', '?module=planned_maintenance&tab=dashboard_planned');
            }}
            className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all cursor-pointer transform hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <i className="ph ph-calendar-check"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 text-center leading-tight">Serwis UR</h3>
            <p className="text-xs text-slate-500 text-center">Harmonogramy przeglądów, prewencja i zaplanowane prace.</p>
          </button>
        )}

        <button 
          onClick={() => {
            setCurrentModule('master_data');
            const t = user?.role === 'admin' ? 'settings' : 'machines';
            setActiveTab(t);
            window.history.pushState({ module: 'master_data', tab: t }, '', '?module=master_data&tab='+t);
          }}
          className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-400 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <i className="ph ph-gear"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 text-center leading-tight">Administracja</h3>
          <p className="text-xs text-slate-500 text-center">Baza urządzeń, ustawienia, pracownicy i system.</p>
        </button>
        
      </div>
    </div>
  );
}
