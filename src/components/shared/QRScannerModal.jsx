import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useManagerStore } from '../../store/managerStore';

export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Skanuj kod QR lub zbliż NFC",
  subtitle = "Skieruj aparat na kod QR, aby automatycznie odczytać maszynę."
}) {
  const html5QrcodeRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState('unsupported'); // unsupported, active, error

  useEffect(() => {
    if (!isOpen) return;

    setInitError(null);
    setNfcStatus('unsupported');
    let isMounted = true;
    let scanner = null;
    let nfcAbortController = new AbortController();

    const handleDecodedText = (decodedText) => {
        let machineId = decodedText;
        let tenantFromQr = null;
        
        if (decodedText.includes('?')) {
          try {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            machineId = urlParams.get('machine') || machineId;
            tenantFromQr = urlParams.get('tenant');
          } catch (e) {}
        }

        // Walidacja cross-tenant
        const currentTenantId = useManagerStore.getState().tenantId;
        if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
          alert('Błąd: Skanowana maszyna należy do innej firmy! Zmień aktywną firmę, aby uzyskać dostęp.');
          // Zatrzymujemy działanie - nie wywołujemy onScanSuccess
          return;
        }

        // Oczyszczamy z ewentualnych spacji
        machineId = typeof machineId === 'string' ? machineId.trim() : machineId;

        if (isMounted) onScanSuccess(machineId, decodedText);
    };

    // Krótkie opóźnienie by upewnić się, że DOM wyrenderował diva
    const timer = setTimeout(() => {
      if (!isMounted) return;
      
      // 1. Inicjalizacja skanera QR
      try {
        scanner = new Html5Qrcode("unified-qr-reader");
        html5QrcodeRef.current = scanner;
        
        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleDecodedText,
          () => {} // Ignoruj błędy odczytu (np. brak kodu w kadrze)
        ).catch(err => {
          console.error("Scanner start error:", err);
          if (isMounted) setInitError(err.message);
        });
      } catch (err) {
        console.error("Scanner init error:", err);
        if (isMounted) setInitError(err.message);
      }
      
      // 2. Inicjalizacja czytnika NFC (jeśli wspierany na Android Chrome)
      if ('NDEFReader' in window) {
        try {
          const ndef = new window.NDEFReader();
          ndef.scan({ signal: nfcAbortController.signal }).then(() => {
            if (isMounted) setNfcStatus('active');
            ndef.onreading = event => {
              try {
                const decoder = new TextDecoder();
                for (const record of event.message.records) {
                  const decodedText = decoder.decode(record.data);
                  handleDecodedText(decodedText);
                }
              } catch (e) {
                console.error("Błąd dekodowania NFC:", e);
              }
            };
          }).catch(err => {
            console.error("NFC start error:", err);
            if (isMounted) setNfcStatus('error');
          });
        } catch (e) {
          console.error("NFC API error:", e);
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      try {
          nfcAbortController.abort(); // Zatrzymuje czytnik NFC
      } catch (e) {}
      
      if (html5QrcodeRef.current) {
        try {
          // Promise based stop, handled cleanly
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
        
        {nfcStatus === 'active' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border-2 border-blue-200 shadow-inner animate-pulse">
            <i className="ph ph-wifi-high text-3xl"></i>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider">Odczyt NFC Aktywny</span>
              <span className="text-xs">Zbliż telefon do naklejki...</span>
            </div>
          </div>
        )}
        
        <p className="text-xs text-center text-slate-500">
          {subtitle} {nfcStatus === 'active' ? "Możesz także zbliżyć telefon do naklejki NFC." : ""}
        </p>
      </div>
    </div>
  );
}
