import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode } from 'html5-qrcode';
import { useManagerStore } from '../../store/managerStore';
import {
  findMachineByIdentifierOrPlate,
  normalizeLicensePlate,
  recognizeLicensePlateFromVideoFrame,
} from '../../utils/fieldServiceHelpers';

export default function OperatorScanner({
  onScanSuccess,
  machines: propMachines,
  isInternal = false,
}) {
  const { t } = useTranslation();
  const storeMachines = useManagerStore(state => state.machines || []);
  const activeMachines = useMemo(() => {
    const list = Array.isArray(propMachines) && propMachines.length > 0 ? propMachines : storeMachines;
    return (list || []).filter(m => !m.isDeleted);
  }, [propMachines, storeMachines]);

  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('unsupported');
  const [errorMsg, setErrorMsg] = useState(null);
  const [plateQuery, setPlateQuery] = useState('');
  const [isRecognizingPlate, setIsRecognizingPlate] = useState(false);
  const [ocrNotice, setOcrNotice] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const autoAnprBusyRef = useRef(false);

  const fleetSuggestions = useMemo(() => {
    const vehicles = activeMachines.filter(
      m =>
        m.assetCategory === 'vehicle' ||
        (m.licensePlate && String(m.licensePlate).trim().length > 0)
    );
    const norm = normalizeLicensePlate(plateQuery);
    if (!norm) return vehicles.slice(0, 6);
    return vehicles
      .filter(v => {
        const vPlate = normalizeLicensePlate(v.licensePlate || '');
        const vVin = normalizeLicensePlate(v.vinNumber || '');
        const vName = String(v.name || '').toUpperCase();
        return (
          vPlate.includes(norm) ||
          vVin.includes(norm) ||
          vName.includes(plateQuery.trim().toUpperCase())
        );
      })
      .slice(0, 6);
  }, [activeMachines, plateQuery]);

  const handlePlateSubmit = e => {
    if (e) e.preventDefault();
    const raw = plateQuery.trim();
    if (!raw) return;
    setErrorMsg(null);
    setOcrNotice(null);
    const matched = findMachineByIdentifierOrPlate(activeMachines, raw, raw);
    if (matched) {
      stopLiveScanner();
      onScanSuccess(matched.id, matched.licensePlate || raw);
    } else {
      stopLiveScanner();
      onScanSuccess(raw, raw);
    }
  };

  const handleCapturePlateFromCamera = async () => {
    setErrorMsg(null);
    setOcrNotice(null);
    const container = document.getElementById('qr-reader');
    const videoEl = container?.querySelector('video');
    if (!videoEl) {
      setOcrNotice(
        'Najpierw uruchom kamerę lub wpisz numer rejestracyjny w polu poniżej (np. GD 12345).'
      );
      return;
    }

    setIsRecognizingPlate(true);
    try {
      const result = await recognizeLicensePlateFromVideoFrame(videoEl, activeMachines);
      if (result.matchedMachine) {
        stopLiveScanner();
        onScanSuccess(
          result.matchedMachine.id,
          result.matchedMachine.licensePlate || result.plate
        );
        return;
      }
      if (result.plate) {
        setPlateQuery(result.plate);
        const fallbackMatch = findMachineByIdentifierOrPlate(
          activeMachines,
          result.plate,
          result.plate
        );
        if (fallbackMatch) {
          stopLiveScanner();
          onScanSuccess(fallbackMatch.id, result.plate);
          return;
        }
        setOcrNotice(
          `Rozpoznano tablicę "${result.plate}", ale nie znaleziono takiego pojazdu w bazie. Sprawdź lub zatwierdź ręcznie poniżej.`
        );
      } else if (result.error === 'UNSUPPORTED_BROWSER_OCR') {
        setOcrNotice(
          'Twoja przeglądarka nie wspiera bezpośredniego OCR wideo. Wpisz lub wybierz numer rejestracyjny pojazdu poniżej.'
        );
      } else {
        setOcrNotice(
          'Nie wykryto wyraźnej tablicy rejestracyjnej w kadrze. Zbliż kamerę do tablicy lub wpisz numer ręcznie.'
        );
      }
    } finally {
      setIsRecognizingPlate(false);
    }
  };

  const nfcAbortControllerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (nfcAbortControllerRef.current) {
        nfcAbortControllerRef.current.abort();
      }
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (isLiveScanning) {
      setTimeout(() => {
        try {
          html5QrcodeRef.current = new Html5Qrcode('qr-reader');
          html5QrcodeRef.current
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              decodedText => {
                stopLiveScanner();
                onScanSuccess(decodedText);
              },
              () => {}
            )
            .catch(err => {
              console.error('Camera start error:', err);
              setErrorMsg('Błąd uruchamiania kamery: ' + err);
              setIsLiveScanning(false);
            });
        } catch {
          setErrorMsg('Wystąpił błąd podczas inicjalizacji skanera.');
          setIsLiveScanning(false);
        }
      }, 100);

      return () => {
        if (html5QrcodeRef.current) {
          try {
            html5QrcodeRef.current.stop().catch(() => {});
          } catch {}
        }
        const container = document.getElementById('qr-reader');
        if (container) container.innerHTML = '';
      };
    }
  }, [isLiveScanning]);

  // Automatyczne rozpoznawanie tablic rejestracyjnych (ANPR) w tle podczas działania kamery (wyłącznie po zalogowaniu, gdy znany jest tenant)
  useEffect(() => {
    if (!isLiveScanning || !isInternal) return undefined;
    let active = true;
    const intervalId = setInterval(async () => {
      if (!active || autoAnprBusyRef.current) return;
      const container = document.getElementById('qr-reader');
      const videoEl = container ? container.querySelector('video') : null;
      if (!videoEl || (videoEl.readyState !== undefined && videoEl.readyState < 2)) return;

      autoAnprBusyRef.current = true;
      try {
        const result = await recognizeLicensePlateFromVideoFrame(videoEl, activeMachines);
        if (!active) return;
        if (result.matchedMachine) {
          stopLiveScanner();
          onScanSuccess(
            result.matchedMachine.id,
            result.matchedMachine.licensePlate || result.plate
          );
        } else if (result.plate) {
          setPlateQuery(result.plate);
          stopLiveScanner();
          onScanSuccess(result.plate, result.plate);
        }
      } catch {
        // ignore background frame OCR errors
      } finally {
        autoAnprBusyRef.current = false;
      }
    }, 900);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isLiveScanning, activeMachines, onScanSuccess]);

  const startLiveScanner = () => {
    setIsLiveScanning(true);
    setErrorMsg(null);
  };

  const stopLiveScanner = () => {
    setIsLiveScanning(false);
  };

  const startNfcLive = async () => {
    if (!('NDEFReader' in window)) {
      alert('Twoje urządzenie/przeglądarka nie obsługuje Web NFC lub NFC jest wyłączone.');
      return;
    }
    try {
      setNfcStatus('active');
      const ndef = new window.NDEFReader();
      const ac = new AbortController();
      nfcAbortControllerRef.current = ac;

      await ndef.scan({ signal: ac.signal });
      ndef.addEventListener('reading', ({ message }) => {
        for (const record of message.records) {
          if (record.recordType === 'text' || record.recordType === 'url') {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            stopNfcLive();
            onScanSuccess(text);
            return;
          }
        }
      });
    } catch (error) {
      console.error('NFC Scan Error:', error);
      alert('Błąd skanowania NFC: ' + error);
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
    <div className="w-full flex-1 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-slate-800">
          {t('operator.optionsTitle', 'OPCJE ZGŁOSZEŃ')}
        </h2>

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
              <h4 className="text-xl font-black uppercase tracking-wider text-slate-800">
                {t('operator.nfcActive', 'NFC Aktywne')}
              </h4>
              <p className="text-slate-500 mt-2 font-medium">
                {t('operator.nfcHint', 'Zbliż plecki telefonu do naklejki NFC.')}
              </p>
            </div>
            <button
              onClick={stopNfcLive}
              className="mt-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Anuluj')}
            </button>
          </div>
        ) : isLiveScanning ? (
          <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                {t('operator.cameraScanner', 'Skaner aparatu (QR + Tablica Rejestracyjna)')}
              </span>
              <button
                onClick={stopLiveScanner}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                {t('operator.closeCamera', 'Zamknij kamerę')}
              </button>
            </div>
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[280px]"></div>
            {isInternal && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div
                  data-testid="operator-auto-anpr-badge"
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/90 text-emerald-200 border border-emerald-700 text-[11px] font-bold flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Auto-skanowanie: Kod QR + Tablica rejestracyjna (ANPR)</span>
                </div>
                <button
                  type="button"
                  data-testid="operator-capture-plate-btn"
                  onClick={handleCapturePlateFromCamera}
                  disabled={isRecognizingPlate}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i
                    className={`ph ${
                      isRecognizingPlate ? 'ph-spinner animate-spin' : 'ph-car-profile'
                    } text-lg`}
                  ></i>
                  {isRecognizingPlate
                    ? 'Odczytywanie tablicy rejestracyjnej...'
                    : '📷 Wymuś odczyt tablicy rejestracyjnej z kadru (ANPR)'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 w-full">
            <div
              className={`grid ${
                isInternal ? 'grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5' : 'grid-cols-2 gap-4 sm:gap-6'
              } w-full`}
            >
              <button
                onClick={startLiveScanner}
                className="py-7 sm:py-9 px-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
              >
                <i className="ph ph-qr-code text-5xl sm:text-6xl group-hover:scale-110 transition-transform font-light"></i>
                <span className="text-base sm:text-lg tracking-wide">
                  {isInternal
                    ? t('operator.scanQrOrPlateBtn', 'Skanuj QR / Tablicę')
                    : t('operator.scanQrBtn', 'Skanuj QR')}
                </span>
              </button>

              <button
                onClick={startNfcLive}
                className="py-7 sm:py-9 px-4 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
              >
                <i className="ph ph-waves text-5xl sm:text-6xl group-hover:scale-110 transition-transform font-light"></i>
                <span className="text-base sm:text-lg tracking-wide">
                  {t('operator.scanNfcBtn', 'Odczyt NFC')}
                </span>
              </button>

              {isInternal && (
                <button
                  type="button"
                  data-testid="operator-report-without-qr-btn"
                  onClick={() => {
                    stopLiveScanner();
                    onScanSuccess('manual', 'manual');
                  }}
                  className="py-7 sm:py-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
                >
                  <i className="ph ph-note-pencil text-5xl sm:text-6xl group-hover:scale-110 transition-transform font-light"></i>
                  <span className="text-base sm:text-lg tracking-wide">
                    {t('operator.reportWithoutQrBtn', 'Zgłoś bez QR / NFC')}
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
                <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                  <i className="ph ph-device-mobile-camera text-4xl"></i>
                  <i className="ph ph-wrench text-lg absolute -bottom-1 -right-1 text-slate-800 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">
                    {t('operator.scanQrCardTitle', 'Skanuj QR:')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
                    {t('operator.scanQrCardDesc', 'Zeskanuj kod QR i zgłoś awarię.')}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
                <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                  <i className="ph ph-device-mobile text-4xl"></i>
                  <i className="ph ph-wifi-high text-xl absolute top-0 right-0 text-blue-500 animate-pulse"></i>
                  <span className="absolute bottom-1 right-1 text-[9px] font-black bg-slate-800 text-white px-1 rounded">
                    NFC
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">
                    {t('operator.scanNfcCardTitle', 'Szybki odczyt NFC:')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
                    {t('operator.scanNfcCardDesc', 'Odczytaj przy pomocy NFC i zgłoś awarię.')}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transition-all hover:shadow-md">
                <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 relative border border-slate-100">
                  <i className="ph ph-qr-code text-4xl"></i>
                  <i className="ph ph-plus-circle text-lg absolute -bottom-1 -right-1 text-slate-800 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-tight">
                    {t('operator.otherMachineCardTitle', 'Zgłoś inne urządzenie:')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
                    {t(
                      'operator.otherMachineCardDesc',
                      'Zeskanuj dowolny kod QR lub NFC w swoim rejonie, a awaria zostanie zgłoszona do odpowiedniego działu lub serwisu.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {ocrNotice && (
          <div
            data-testid="operator-ocr-notice"
            className="mt-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-start gap-2 text-left"
          >
            <i className="ph ph-info text-base text-amber-600 shrink-0 mt-0.5"></i>
            <span>{ocrNotice}</span>
          </div>
        )}

        {/* ROZWIJANE WYSZUKIWANIE RĘCZNE PO TABLICY REJESTRACYJNEJ / VIN / NAZWIE — WYŁĄCZNIE PO ZALOGOWANIU (gdy znany jest tenant) */}
        {isInternal && (
          <div
            data-testid="operator-license-plate-section"
            className="mt-6 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-left"
          >
            <button
              type="button"
              data-testid="operator-manual-toggle-btn"
              onClick={() => setShowManualInput(prev => !prev)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <i className="ph ph-keyboard text-blue-600 text-base"></i>
                {t(
                  'scanner.licensePlateLookupLabel',
                  'Wpisz ręcznie (Tablica rejestracyjna / VIN / Kod urządzenia)'
                )}
              </span>
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                {showManualInput ? 'Zwiń' : 'Rozwiń'}
                <i className={`ph ${showManualInput ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
              </span>
            </button>

            {showManualInput && (
              <div className="p-4 pt-3 border-t border-slate-200/80">
                <form onSubmit={handlePlateSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex items-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-2 bg-blue-700 text-white text-[10px] font-black rounded-l-lg border border-blue-700 select-none">
                      PL
                    </span>
                    <input
                      type="text"
                      data-testid="operator-plate-input"
                      value={plateQuery}
                      onChange={e => setPlateQuery(e.target.value.toUpperCase())}
                      placeholder={t(
                        'scanner.licensePlatePlaceholder',
                        'np. GD 12345, WE 9876A, VIN lub nazwa urządzenia...'
                      )}
                      className="w-full px-3 py-2 bg-white border border-l-0 border-slate-300 rounded-r-lg text-sm font-mono font-black uppercase tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="operator-plate-submit-btn"
                    disabled={!plateQuery.trim()}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="ph ph-magnifying-glass-bold"></i>
                    {t('scanner.openByPlateBtn', 'Wybierz')}
                  </button>
                </form>

                {fleetSuggestions.length > 0 && (
                  <div className="mt-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {plateQuery.trim()
                        ? 'Pasujące pojazdy w bazie:'
                        : 'Szybki wybór pojazdu z floty:'}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {fleetSuggestions.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          data-testid={`operator-plate-suggestion-${v.id}`}
                          onClick={() => {
                            stopLiveScanner();
                            onScanSuccess(v.id, v.licensePlate || v.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded-lg text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
                        >
                          <span className="px-1.5 py-0.5 bg-blue-700 text-white font-mono font-black text-[10px] rounded tracking-wider">
                            {v.licensePlate || 'FLOTA'}
                          </span>
                          <span className="truncate max-w-[160px] text-slate-700 font-semibold">
                            {v.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
