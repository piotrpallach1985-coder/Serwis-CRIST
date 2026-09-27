import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../hooks/useToast';

export default function NFCScannerModal({ isOpen, onClose, onScanSuccess, title = "Odczyt NFC", subtitle = "Przybliż telefon do znacznika NFC, aby odczytać dane." }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState("init");
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopNfc();
      return;
    }

    startNfc();

    return () => {
      stopNfc();
    };
  }, [isOpen]);

  const stopNfc = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const startNfc = async () => {
    if (!('NDEFReader' in window)) {
      setStatus("unsupported");
      return;
    }

    stopNfc();
    abortControllerRef.current = new AbortController();
    setStatus("scanning");

    try {
      const ndef = new window.NDEFReader();
      await ndef.scan({ signal: abortControllerRef.current.signal });

      ndef.addEventListener("reading", event => {
        try {
          const decoder = new TextDecoder();
          let scannedText = "";
          for (const record of event.message.records) {
            scannedText += decoder.decode(record.data);
          }
          if (scannedText) {
            stopNfc();
            onScanSuccess(scannedText, scannedText);
          } else {
            showToast('Nieprawidłowy odczyt NFC (brak tekstu)', 'error');
          }
        } catch (e) {
          console.error("Błąd dekodowania NFC:", e);
          showToast("Błąd dekodowania NFC: " + e.message, 'error');
        }
      });

      ndef.addEventListener("readingerror", () => {
        showToast("NFC nie mogło odczytać tagu. Spróbuj ponownie.", 'error');
      });

    } catch (error) {
      console.error("NFC start error:", error);
      setStatus("error");
      showToast("NFC Error: " + error.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-300 mb-12 max-w-sm">{subtitle}</p>

        {status === 'unsupported' ? (
          <div className="bg-red-500/10 text-red-200 p-6 rounded-2xl max-w-sm border border-red-500/30">
            <i className="ph ph-warning-circle text-4xl mb-4 text-red-400"></i>
            <p>Twoja przeglądarka nie wspiera Web NFC. Użyj urządzenia z Androidem i przeglądarki Chrome.</p>
          </div>
        ) : status === 'error' ? (
          <div className="bg-orange-500/10 text-orange-200 p-6 rounded-2xl max-w-sm border border-orange-500/30">
            <i className="ph ph-warning text-4xl mb-4 text-orange-400"></i>
            <p className="mb-4">Wystąpił błąd podczas uruchamiania NFC. Sprawdź, czy masz włączone NFC i kliknij przycisk poniżej.</p>
            <button onClick={startNfc} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">Rozpocznij skanowanie</button>
          </div>
        ) : status === 'init' ? (
          <button onClick={startNfc} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-3">
            <i className="ph ph-play text-2xl"></i> Rozpocznij odczyt NFC
          </button>
        ) : (
          <div className="relative w-48 h-48 flex items-center justify-center bg-slate-800 rounded-full border-4 border-indigo-500/30 animate-pulse">
            <i className="ph ph-waves text-[80px] text-indigo-400"></i>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping opacity-20"></div>
          </div>
        )}
        
        <p className="mt-8 text-indigo-200 font-medium animate-pulse">
          {status === 'scanning' ? 'Oczekiwanie na tag NFC...' : ''}
        </p>
      </div>

      <div className="p-6 pb-10 bg-slate-900 border-t border-white/10">
        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <i className="ph ph-x text-xl"></i> Anuluj
        </button>
      </div>
    </div>
  );
}