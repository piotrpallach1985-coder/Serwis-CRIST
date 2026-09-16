import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useManagerStore } from '../../store/managerStore';

export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title,
  subtitle,
  mode = 'qr' // 'qr' lub 'nfc'
}) {
  const html5QrcodeRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState('unsupported'); // unsupported, supported, active, error

  // Ustawienie domyślnych tytułów w zależności od trybu
  const displayTitle = title || (mode === 'nfc' ? "Odczyt NFC" : "Skanuj kod QR");
  const displaySubtitle = subtitle || (mode === 'nfc' ? "Zbliż telefon do znacznika NFC, aby automatycznie odczytać maszynę." : "Skieruj aparat na kod QR, aby automatycznie odczytać maszynę.");

  // Efekt dla kamery QR
  useEffect(() => {
    if (!isOpen || mode !== 'qr') return;

    setInitError(null);
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
  }, [isOpen, onScanSuccess, mode]);

  // Efekt dla autostartu NFC
  useEffect(() => {
    if (!isOpen || mode !== 'nfc') return;
    
    if (!('NDEFReader' in window)) {
      setNfcStatus('unsupported');
      return;
    }
    
    let isMounted = true;
    let ndef = null;
    let abortController = new AbortController();

    const startAutoNfc = async () => {
      try {
        ndef = new window.NDEFReader();
        // Skanowanie NFC po otwarciu okna (o ile przeglądarka pozwoli z automatu, 
        // ale modal wywoływany jest z kliknięcia więc powinno przejść)
        await ndef.scan({ signal: abortController.signal });
        if (isMounted) setNfcStatus('active');
        
        ndef.addEventListener("reading", event => {
          try {
            const decoder = new TextDecoder();
            for (const record of event.message.records) {
              let decodedText = decoder.decode(record.data);
              
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
              machineId = machineId.replace(/^[^\w]+/, ''); // usuń binarne prefixy URL
              
              if (isMounted) onScanSuccess(machineId, decodedText);
            }
          } catch (e) {
            console.error("Błąd dekodowania NFC:", e);
            alert("Błąd dekodowania NFC: " + e.message);
          }
        });
        
        ndef.addEventListener("readingerror", () => {
          if (isMounted) alert("NFC nie mogło odczytać tagu. Może tag jest pusty lub niekompatybilny?");
        });
      } catch (error) {
        console.error("NFC start error:", error);
        if (isMounted) setNfcStatus('error');
      }
    };

    startAutoNfc();

    return () => {
      isMounted = false;
      abortController.abort(); // Zatrzymaj czytnik NFC przy zamykaniu
    };
  }, [isOpen, onScanSuccess, mode]);


  const startManualNfc = async () => {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xl text-slate-800">{displayTitle}</h3>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-md"
          >
            <i className="ph ph-x text-lg"></i> Zamknij
          </button>
        </div>
        
        {mode === 'qr' && (
          <>
            {initError ? (
              <div className="text-red-600 text-center p-4 bg-red-50 rounded-xl border border-red-200">
                Błąd dostępu do kamery: {initError}
              </div>
            ) : (
              <div id="unified-qr-reader" className="w-full rounded-2xl overflow-hidden bg-black min-h-[300px] shadow-inner"></div>
            )}
          </>
        )}

        {mode === 'nfc' && (
          <div className="flex flex-col items-center justify-center py-10 gap-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            {nfcStatus === 'active' ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                  <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <i className="ph ph-waves text-6xl"></i>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-black uppercase tracking-wider text-slate-800">Odczyt Aktywny</h4>
                  <p className="text-sm text-slate-500 mt-2">Zbliż telefon do naklejki NFC (zazwyczaj na pleckach telefonu)</p>
                </div>
              </>
            ) : nfcStatus === 'unsupported' ? (
              <>
                <div className="w-20 h-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-inner">
                  <i className="ph ph-waves text-5xl opacity-50"></i>
                </div>
                <div className="text-center px-4">
                  <h4 className="text-lg font-bold text-slate-700">NFC niedostępne</h4>
                  <p className="text-sm text-slate-500 mt-2">Twoje urządzenie lub przeglądarka nie wspiera aktywnego czytnika Web NFC.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                  <i className="ph ph-warning text-5xl"></i>
                </div>
                <div className="text-center px-4">
                  <h4 className="text-lg font-bold text-red-600">Brak uprawnień</h4>
                  <p className="text-sm text-slate-500 mt-2">Odrzucono zgodę na NFC lub wystąpił błąd sprzętowy.</p>
                  <button onClick={startManualNfc} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md">Spróbuj ponownie</button>
                </div>
              </>
            )}
          </div>
        )}
        
        <p className="text-xs text-center text-slate-400 font-medium">
          {displaySubtitle}
        </p>
      </div>
    </div>
  );
}
