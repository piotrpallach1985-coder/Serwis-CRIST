import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerModal({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Skanuj kod QR maszyny",
  subtitle = "Skieruj aparat na kod QR, aby automatycznie odczytać maszynę."
}) {
  const html5QrcodeRef = useRef(null);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setInitError(null);
    let isMounted = true;
    let scanner = null;

    // Krótkie opóźnienie by upewnić się, że DOM wyrenderował diva
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
            if (decodedText.includes('?machine=')) {
              const urlParams = new URLSearchParams(decodedText.split('?')[1]);
              machineId = urlParams.get('machine');
            }
            if (isMounted) onScanSuccess(machineId);
          },
          () => {} // Ignoruj błędy odczytu (np. brak kodu w kadrze)
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
        
        <p className="text-xs text-center text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
