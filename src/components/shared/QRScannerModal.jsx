import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useManagerStore } from '../../store/managerStore';
import {
  normalizeLicensePlate,
  findMachineByIdentifierOrPlate,
  recognizeLicensePlateFromVideoFrame,
} from '../../utils/fieldServiceHelpers';

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title,
  subtitle,
  mode = 'qr',
  enableLicensePlateScan = true,
}) {
  const [initError, setInitError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState('unsupported');
  const [plateQuery, setPlateQuery] = useState('');
  const [ocrStatusMsg, setOcrStatusMsg] = useState('');
  const [isCapturingPlate, setIsCapturingPlate] = useState(false);
  const html5QrcodeRef = useRef(null);

  const machines = useManagerStore(state => state.machines || []);

  const vehicleSuggestions = useMemo(() => {
    const activeVehicles = machines.filter(
      m => !m.isDeleted && (m.licensePlate || m.assetCategory === 'vehicle')
    );
    const norm = normalizeLicensePlate(plateQuery);
    if (!norm) return activeVehicles.slice(0, 6);
    return activeVehicles
      .filter(
        m =>
          normalizeLicensePlate(m.licensePlate).includes(norm) ||
          normalizeLicensePlate(m.vinNumber).includes(norm) ||
          (m.name && m.name.toLowerCase().includes(plateQuery.toLowerCase().trim()))
      )
      .slice(0, 6);
  }, [machines, plateQuery]);

  const displayTitle =
    title || (mode === 'nfc' ? 'Odczyt NFC' : 'Skanuj kod QR lub tablicę rejestracyjną');
  const displaySubtitle =
    subtitle ||
    (mode === 'nfc'
      ? 'Zbliż telefon do znacznika NFC, aby automatycznie odczytać urządzenie lub pojazd.'
      : 'Skieruj aparat na kod QR lub tablicę rejestracyjną pojazdu (albo wpisz nr rej. poniżej).');

  useEffect(() => {
    if (!isOpen) {
      setPlateQuery('');
      setOcrStatusMsg('');
      setIsCapturingPlate(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    let scanner = null;
    const abortController = new AbortController();

    if (isOpen && mode === 'qr') {
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
          scanner = new Html5Qrcode('unified-qr-reader');
          html5QrcodeRef.current = scanner;

          scanner
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              decodedText => {
                let machineId = decodedText;
                let tenantFromQr = null;

                if (
                  decodedText.includes('tenant=') &&
                  (decodedText.includes('machine=') || decodedText.includes('part='))
                ) {
                  try {
                    const qs = decodedText.includes('?')
                      ? decodedText.split('?')[1]
                      : decodedText;
                    const urlParams = new URLSearchParams(qs);
                    machineId = urlParams.get('machine') || urlParams.get('part') || machineId;
                    tenantFromQr = urlParams.get('tenant');
                  } catch {}
                }

                const currentTenantId = useManagerStore.getState().tenantId;
                if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
                  alert('Błąd: Skanowane urządzenie należy do innej firmy!');
                  return;
                }

                machineId = typeof machineId === 'string' ? machineId.trim() : machineId;
                if (isMounted) onScanSuccess(machineId, decodedText);
              },
              () => {}
            )
            .catch(err => {
              console.warn('Kamera niedostępna (urządzenie blokuje lub brak kamery):', err.message);
              if (isMounted) setInitError(err.message);
            });
        } catch (err) {
          console.error('Scanner init error:', err);
          if (isMounted) setInitError(err.message);
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scanner) {
          try {
            const p = scanner.stop();
            if (p && p.catch) p.catch(() => {});
          } catch {}
          try {
            scanner.clear();
          } catch {}
        }
      };
    }

    const startAutoNfc = async () => {
      if (!isOpen || mode !== 'nfc') return;

      if (!('NDEFReader' in window)) {
        if (isMounted) setNfcStatus('unsupported');
        return;
      }

      try {
        const ndef = new window.NDEFReader();
        await ndef.scan({ signal: abortController.signal });
        if (isMounted) setNfcStatus('active');

        ndef.addEventListener('reading', event => {
          try {
            const decoder = new TextDecoder();
            for (const record of event.message.records) {
              const decodedText = decoder.decode(record.data);

              let machineId = decodedText;
              let tenantFromQr = null;
              if (
                decodedText.includes('tenant=') &&
                (decodedText.includes('machine=') || decodedText.includes('part='))
              ) {
                try {
                  const qs = decodedText.includes('?') ? decodedText.split('?')[1] : decodedText;
                  const urlParams = new URLSearchParams(qs);
                  machineId = urlParams.get('machine') || urlParams.get('part') || machineId;
                  tenantFromQr = urlParams.get('tenant');
                } catch {}
              }

              const currentTenantId = useManagerStore.getState().tenantId;
              if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
                alert('Błąd: Skanowane urządzenie należy do innej firmy!');
                return;
              }

              machineId = typeof machineId === 'string' ? machineId.trim() : machineId;

              if (isMounted) onScanSuccess(machineId, decodedText);
            }
          } catch (e) {
            console.error('Błąd dekodowania NFC:', e);
            alert('Błąd dekodowania NFC: ' + e.message);
          }
        });

        ndef.addEventListener('readingerror', () => {
          if (isMounted)
            alert('NFC nie mogło odczytać tagu. Może tag jest pusty lub niekompatybilny?');
        });
      } catch (error) {
        console.error('NFC start error:', error);
        if (isMounted) setNfcStatus('error');
      }
    };

    startAutoNfc();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isOpen, onScanSuccess, mode]);

  const startManualNfc = async () => {
    if (!('NDEFReader' in window)) {
      alert('Twoja przeglądarka nie wspiera Web NFC.');
      return;
    }

    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setNfcStatus('active');

      ndef.addEventListener('reading', event => {
        try {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const decodedText = decoder.decode(record.data);

            let machineId = decodedText;
            let tenantFromQr = null;
            if (decodedText.includes('tenant=') && decodedText.includes('machine=')) {
              try {
                const qs = decodedText.includes('?') ? decodedText.split('?')[1] : decodedText;
                const urlParams = new URLSearchParams(qs);
                machineId = urlParams.get('machine') || machineId;
                tenantFromQr = urlParams.get('tenant');
              } catch {}
            }

            const currentTenantId = useManagerStore.getState().tenantId;
            if (tenantFromQr && currentTenantId && tenantFromQr !== currentTenantId) {
              alert('Błąd: Skanowane urządzenie należy do innej firmy!');
              return;
            }

            machineId = typeof machineId === 'string' ? machineId.trim() : machineId;

            onScanSuccess(machineId, decodedText);
          }
        } catch (e) {
          console.error('Błąd dekodowania NFC:', e);
          alert('Błąd dekodowania NFC: ' + e.message);
        }
      });

      ndef.addEventListener('readingerror', () => {
        alert('NFC nie mogło odczytać tagu. Może tag jest pusty lub niekompatybilny?');
      });
    } catch (error) {
      console.error('NFC start error:', error);
      alert('NFC Error: ' + error.message);
      setNfcStatus('error');
    }
  };

  const handleCapturePlateFromCamera = async () => {
    setIsCapturingPlate(true);
    setOcrStatusMsg('');
    try {
      const container = document.getElementById('unified-qr-reader');
      const videoEl = container ? container.querySelector('video') : null;
      const res = await recognizeLicensePlateFromVideoFrame(videoEl, machines);

      if (res.matchedMachine) {
        onScanSuccess(res.matchedMachine.id, res.matchedMachine.licensePlate || res.matchedMachine.id);
        return;
      }
      if (res.plate) {
        setPlateQuery(res.plate);
        onScanSuccess(res.plate, res.plate);
        return;
      }
      setOcrStatusMsg(
        res.error ||
          'Nie wykryto tablicy w kadrze — przybliż aparat do tablicy rejestracyjnej lub wpisz numer poniżej.'
      );
    } finally {
      setIsCapturingPlate(false);
    }
  };

  const handlePlateSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = plateQuery.trim();
    if (!trimmed) return;
    const matched = findMachineByIdentifierOrPlate(machines, trimmed);
    if (matched) {
      onScanSuccess(matched.id, matched.licensePlate || trimmed);
    } else {
      onScanSuccess(trimmed.toUpperCase(), trimmed.toUpperCase());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 animate-fade-in backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative flex flex-col gap-4 my-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg sm:text-xl text-slate-800">{displayTitle}</h3>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-md cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i> Zamknij
          </button>
        </div>

        {mode === 'qr' && (
          <>
            {initError ? (
              <div className="text-red-600 text-center p-4 bg-red-50 rounded-xl border border-red-200 text-xs sm:text-sm">
                Błąd dostępu do kamery: {initError}
              </div>
            ) : (
              <div className="relative">
                <div
                  id="unified-qr-reader"
                  className="w-full rounded-2xl overflow-hidden bg-black min-h-[260px] shadow-inner"
                ></div>
                {enableLicensePlateScan && (
                  <div className="mt-2.5 flex justify-center">
                    <button
                      type="button"
                      data-testid="scanner-capture-plate-btn"
                      disabled={isCapturingPlate}
                      onClick={handleCapturePlateFromCamera}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <i className="ph ph-camera text-lg"></i>
                      <span>
                        {isCapturingPlate
                          ? 'Odczytywanie tablicy...'
                          : 'Skieruj na tablicę rejestracyjną i odczytaj pojazd (ANPR)'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {enableLicensePlateScan && (
              <div
                data-testid="scanner-license-plate-section"
                className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="ph ph-truck text-emerald-700 text-base"></i>
                    Wyszukaj po tablicy rejestracyjnej / VIN
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white border border-blue-500">
                    PL / EU
                  </span>
                </div>

                {ocrStatusMsg && (
                  <div
                    data-testid="scanner-ocr-status-msg"
                    className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
                  >
                    {ocrStatusMsg}
                  </div>
                )}

                <form onSubmit={handlePlateSubmit} className="flex gap-2">
                  <input
                    type="text"
                    data-testid="scanner-plate-input"
                    value={plateQuery}
                    onChange={e => setPlateQuery(e.target.value.toUpperCase())}
                    placeholder="np. GD 12345 lub nr wew."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    data-testid="scanner-plate-submit-btn"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Otwórz
                  </button>
                </form>

                {vehicleSuggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Pojazdy w bazie (kliknij tablicę, aby otworzyć):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vehicleSuggestions.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          data-testid={`scanner-plate-suggestion-${v.id}`}
                          onClick={() => onScanSuccess(v.id, v.licensePlate || v.id)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-emerald-100 border border-emerald-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="font-mono font-extrabold bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                            {v.licensePlate || 'POJAZD'}
                          </span>
                          <span className="truncate max-w-[140px]">{v.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  <h4 className="text-lg font-black uppercase tracking-wider text-slate-800">
                    Odczyt Aktywny
                  </h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Zbliż telefon do naklejki NFC (zazwyczaj na pleckach telefonu)
                  </p>
                </div>
              </>
            ) : nfcStatus === 'unsupported' ? (
              <>
                <div className="w-20 h-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-inner">
                  <i className="ph ph-waves text-5xl opacity-50"></i>
                </div>
                <div className="text-center px-4">
                  <h4 className="text-lg font-bold text-slate-700">NFC niedostępne</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Twoje urządzenie lub przeglądarka nie wspiera aktywnego czytnika Web NFC.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                  <i className="ph ph-warning text-5xl"></i>
                </div>
                <div className="text-center px-4">
                  <h4 className="text-lg font-bold text-red-600">Brak uprawnień</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Odrzucono zgodę na NFC lub wystąpił błąd sprzętowy.
                  </p>
                  <button
                    onClick={startManualNfc}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md"
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-center text-slate-400 font-medium">{displaySubtitle}</p>
      </div>
    </div>
  );
}
