import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useManagerStore } from '../../store/managerStore';

export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Skanuj kod QR lub użyj NFC",
  subtitle = "Skieruj aparat na kod QR, aby automatycznie odczytać maszynę."
}) {
  const html5QrcodeRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState('unsupported'); // unsupported, supported, active, error

  useEffect(() => {
    if (!isOpen) return;

    setInitError(null);
    setNfcStatus('NDEFReader' in window ? 'supported' : 'unsupported');
    
    let isMounted = true;
    let scanner = null;

    const timer = setTimeout(() => {
      if (!isMounted) return;
      try {
        scanner = new Html5Qrcode("unified-qr-reader");
        html5QrcodeRef.current = scanner;
        
        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            let machineId = decodedText;
            let tenantFromQr = null;
            
            if (decodedText.includes('?')) {
              try {
                const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                machineId = urlParams.get('machine') || machineId;
                tenantFromQr = urlParams.get('tenant');
              } catch (e) {}
            }

            const currentTenantId = useManagerStore.getState().tenantId;
            if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
              alert('Błąd: Skanowana maszyna należy do innej firmy!');
              return;
            }

            machineId = typeof machineId === 'string' ? machineId.trim() : machineId;
            if (isMounted) onScanSuccess(machineId, decodedText);
          },
          () => {} // Ignore read errors
        ).catch(err => {
          console.error("Scanner start error:", err);
          if (isMounted) setInitError(err.message);
        });
      } catch (err) {
        console.error("Scanner init error:", err);
        if (isMounted) setInitError(err.message);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().then(() => {
            html5QrcodeRef.current.clear();
            html5QrcodeRef.current = null;
          }).catch(() => {
            html5QrcodeRef.current = null;
          });
        } catch (e) {
          console.error("Error stopping scanner", e);
        }
      }
    };
  }, [isOpen, onScanSuccess]);

  const startNfc = async () => {
    if (!('NDEFReader' in window)) {
        alert("Twoja przeglądarka nie wspiera Web NFC.");
        return;
    }
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setNfcStatus('active');
      
      ndef.addEventListener("reading", event => {
        try {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            let decodedText = decoder.decode(record.data);
            
            alert("TEST NFC W APCE. Złapano: " + decodedText);
            
            let machineId = decodedText;
            let tenantFromQr = null;
            if (decodedText.includes('?')) {
              try {
                const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                machineId = urlParams.get('machine') || machineId;
                tenantFromQr = urlParams.get('tenant');
              } catch (e) {}
            }

            const currentTenantId = useManagerStore.getState().tenantId;
            if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
              alert('Błąd: Skanowana maszyna należy do innej firmy!');
              return;
            }

            machineId = typeof machineId === 'string' ? machineId.trim() : machineId;
            machineId = machineId.replace(/^[^\w]+/, '');
            
            onScanSuccess(machineId, decodedText);
          }
        } catch (e) {
          console.error("Błąd dekodowania NFC:", e);
          alert("Błąd dekodowania NFC: " + e.message);
        }
      });
      
      ndef.addEventListener("readingerror", () => {
          alert("NFC nie mogło odczytać tagu. Może tag jest pusty lub niekompatybilny?");
      });
    } catch (error) {
      console.error("NFC start error:", error);
      alert("NFC Error: " + error.message);
      setNfcStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 relative flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shadow-md"
          >
            <i className="ph ph-arrow-left"></i> Powrót
          </button>
        </div>
        
        {initError ? (
          <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg border border-red-200">
            Błąd dostępu do kamery: {initError}
          </div>
        ) : (
          <div id="unified-qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
        )}
        
        {nfcStatus === 'supported' && (
          <button 
            onClick={startNfc}
            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-blue-300 shadow-sm"
          >
            <i className="ph ph-wifi-high text-xl"></i> Włącz czytnik NFC
          </button>
        )}

        {nfcStatus === 'active' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border-2 border-blue-200 shadow-inner animate-pulse">
            <i className="ph ph-wifi-high text-3xl"></i>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider">Odczyt NFC Aktywny</span>
              <span className="text-xs">Zbliż telefon do naklejki...</span>
            </div>
          </div>
        )}
        
        {nfcStatus === 'error' && (
          <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-100">
            Odczyt NFC odrzucony (wymagana zgoda systemu).
          </div>
        )}
        
        <p className="text-xs text-center text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
