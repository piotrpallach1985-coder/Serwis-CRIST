
import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';

export default function OperatorScanner({ onScanSuccess, onManualEntry }) {
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState("unsupported");
  const [errorMsg, setErrorMsg] = useState(null);
  
  const nfcAbortControllerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // NFC toggle i cooldown
      
  useEffect(() => {
    return () => {
      if (nfcAbortControllerRef.current) {
        nfcAbortControllerRef.current.abort();
      }
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.stop().catch(() => {}); } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (isLiveScanning) {
      setTimeout(() => {
        try {
          html5QrcodeRef.current = new Html5Qrcode("qr-reader");
          html5QrcodeRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              stopLiveScanner();
              onScanSuccess(decodedText);
            },
            () => {} // ignore warnings
          ).catch((err) => {
            console.error("Camera start error:", err);
            setErrorMsg("Błąd uruchamiania kamery: " + err);
            setIsLiveScanning(false);
          });
        } catch (e) {
          setErrorMsg("Wystąpił błąd podczas inicjalizacji skanera.");
          setIsLiveScanning(false);
        }
      }, 100);

      return () => {
        if (html5QrcodeRef.current) { 
          try { html5QrcodeRef.current.stop().catch(()=>{}); } catch(e) {} 
        }
        const container = document.getElementById('qr-reader');
        if (container) container.innerHTML = '';
      };
    }
  }, [isLiveScanning]);

  const startLiveScanner = () => {
    setIsLiveScanning(true);
    setErrorMsg(null);
  };

  const stopLiveScanner = () => {
    setIsLiveScanning(false);
  };

  const startNfcLive = async () => {
    // Sprawdź czy NFC jest włączone przez użytkownika
    

    // Sprawdź cooldown
    

    if (!('NDEFReader' in window)) {
      alert("Twoje urządzenie/przeglądarka nie obsługuje Web NFC lub NFC jest wyłączone.");
      return;
    }
    try {
      setNfcStatus('active');
      const ndef = new window.NDEFReader();
      const ac = new AbortController();
      nfcAbortControllerRef.current = ac;

      await ndef.scan({ signal: ac.signal });
      ndef.addEventListener("reading", ({ message }) => {
        for (const record of message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            stopNfcLive();
            
            onScanSuccess(text);
            return;
          } else if (record.recordType === "url") {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            stopNfcLive();
            
            onScanSuccess(text);
            return;
          }
        }
      });
    } catch (error) {
      console.error("NFC Scan Error:", error);
      alert("Błąd skanowania NFC: " + error);
      setNfcStatus('unsupported');
    }
  };

  const stopNfcLive = () => {
    if (nfcAbortControllerRef.current) {
      nfcAbortControllerRef.current.abort();
      nfcAbortControllerRef.current = null;
    }
    setNfcStatus('unsupported');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-slate-800">OPCJE ZGŁOSZEŃ</h2>
        
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-bold">
          {errorMsg}
        </div>
      )}

      

      

      {nfcStatus === 'active' ? (
        <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20"></div>
            <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
              <i className="ph ph-waves text-6xl"></i>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-wider text-slate-800">NFC Aktywne</h4>
            <p className="text-slate-500 mt-2 font-medium">Zbliż plecki telefonu do naklejki NFC.</p>
          </div>
          <button 
            onClick={stopNfcLive}
            className="mt-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-2 rounded-xl transition-colors"
          >
            Anuluj
          </button>
        </div>
      ) : isLiveScanning ? (
        <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              Skaner aparatu
            </span>
            <button 
              onClick={stopLiveScanner}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              Zamknij kamerę
            </button>
          </div>
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[250px]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 max-w-md mx-auto w-full">
            <button
              onClick={startLiveScanner}
              className="flex-1 py-6 px-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <i className="ph ph-qr-code text-5xl sm:text-6xl group-hover:scale-110 transition-transform font-light"></i>
              <span className="text-lg sm:text-xl tracking-wide">Skanuj QR</span>
            </button>

            <button
              onClick={startNfcLive}
              className="flex-1 py-6 px-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <i className="ph ph-waves text-5xl sm:text-6xl group-hover:scale-110 transition-transform font-light"></i>
              <span className="text-lg sm:text-xl tracking-wide">
                Odczyt NFC
              </span>
            </button>
          </div>

          
          
          <div className="flex flex-col gap-3 mt-6 text-left">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
              <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                <i className="ph ph-device-mobile-camera text-4xl"></i>
                <i className="ph ph-wrench text-lg absolute -bottom-1 -right-1 text-slate-800 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">Skanuj QR:</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">Zeskanuj kod QR i zgłoś awarię.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
              <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                <i className="ph ph-device-mobile text-4xl"></i>
                <i className="ph ph-wifi-high text-xl absolute top-0 right-0 text-blue-500 animate-pulse"></i>
                <span className="absolute bottom-1 right-1 text-[9px] font-black bg-slate-800 text-white px-1 rounded">NFC</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">Szybki odczyt NFC:</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">Odczytaj przy pomocy NFC i zgłoś awarię.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
              <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                <i className="ph ph-qr-code text-4xl"></i>
                <i className="ph ph-plus-circle text-lg absolute -bottom-1 -right-1 text-slate-800 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"></i>
              </div>
              <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">Zgłoś inną maszynę:</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">Użyj dowolnego QR lub NFC i zgłoś awarie dowolnej maszyny.</p>
              </div>
            </div>


            
            
            
          </div>
        </div>
      )}
    </div>
  );
}
