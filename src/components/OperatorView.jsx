import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OperatorScanner from './operator/OperatorScanner';
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ensureAnonSessionForTenant } from '../services/auth.service';
import {
  parseQrPayload,
  isExplicitMachineQr,
  saveOperatorQrKey,
  getOperatorQrKey,
  getLastAnonTenant,
  PART_QR_IN_MACHINE_SCANNER_MSG,
} from '../services/qrAccess.service';
import { findMachineByIdentifierOrPlate } from '../utils/fieldServiceHelpers';
import OperatorForm from './OperatorForm';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { useAuth } from '../hooks/useAuth';

export default function OperatorView({ initialMachineId, onSwitchView }) {
  const { t, i18n } = useTranslation();
  const { logout: onLogout } = useAuth();
  const [partQrNotice, setPartQrNotice] = useState(null);
  const storeTenantId = useManagerStore(state => state.tenantId);

  useEffect(() => {
    const realParams = new URLSearchParams(window.location.search);
    const tParam = realParams.get('tenant') || getLastAnonTenant();
    if (tParam) {
      useManagerStore.getState().setTenantId(tParam);
    }
    if (realParams.get('part') && !realParams.get('machine')) {
      setPartQrNotice(
        t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
      );
      setStep('scan');
    }
  }, []);

  const urlTenantParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tenant')
      : null;
  const tenantId =
    storeTenantId || urlTenantParam || getLastAnonTenant() || getCurrentTenant();
  const [machines, setMachines] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const reportersList = [];
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMachineId = searchParams.get('machine') || initialMachineId;
  const urlMachineResolvedRef = useRef(false);
  const lastResolvedMachineIdRef = useRef(null);
  const scanInFlightRef = useRef(false);

  useEffect(() => {
    if (!urlMachineId) {
      urlMachineResolvedRef.current = false;
      lastResolvedMachineIdRef.current = null;
      return;
    }
    if (lastResolvedMachineIdRef.current === urlMachineId) {
      urlMachineResolvedRef.current = true;
      return;
    }
    urlMachineResolvedRef.current = false;
  }, [urlMachineId]);

  const [step, setStep] = useState(searchParams.get('step') || 'scan');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [bindNonce, setBindNonce] = useState(0);
  const [needsQr, setNeedsQr] = useState(false);
  const [isTenantSuspended, setIsTenantSuspended] = useState(false);

  const suspendedMessage = t(
    'login.account_suspended_msg',
    'Konto zawieszone - skontaktuj się z administratorem systemu VexoNT.'
  );

  const handleScanSuccess = async (decodedText, rawQr) => {
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;
    try {
      setPartQrNotice(null);
      setErrorMsg(null);
      const rawStr = rawQr || decodedText || '';
      const parsed = parseQrPayload(rawStr);
      const explicitMachineQr = isExplicitMachineQr(rawStr);

      // 1. Sprawdź czy kod QR zawiera jawny parametr części (part=...)
      if (
        parsed.isPart ||
        parsed.isPartQr ||
        /[?&#\s|^]part=([^&#\s]+)/i.test(rawStr)
      ) {
        setPartQrNotice(
          t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
        );
        setSelectedMachine(null);
        setStep('scan');
        return;
      }

      const mId = parsed.machineId || String(decodedText || '').trim();
      const tenantFromQr = parsed.tenantId;
      const effectiveTenantId = tenantFromQr || tenantId;

      if (parsed.key && effectiveTenantId) {
        saveOperatorQrKey(effectiveTenantId, parsed.key);
      }

      if (tenantFromQr && tenantFromQr !== tenantId) {
        useManagerStore.getState().setTenantId(tenantFromQr);
        try {
          const base = window.location.pathname;
          window.history.replaceState(
            null,
            '',
            `${base}?tenant=${encodeURIComponent(tenantFromQr)}${window.location.hash || '#/operator'}`
          );
        } catch {
          // ignore history error
        }
      }

      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('Anonymous login error during scan:', e);
        }
      }

      const effectiveKey = parsed.key || getOperatorQrKey(effectiveTenantId);
      // Kod QR z kluczem firmy (lub zapisanym kluczem) -> powiązanie sesji operatora z firmą
      if (effectiveKey && effectiveTenantId && (!auth.currentUser || auth.currentUser.isAnonymous)) {
        try {
          await ensureAnonSessionForTenant(effectiveTenantId, effectiveKey);
          setNeedsQr(false);
        } catch (err) {
          if (err && err.message === 'TENANT_SUSPENDED') {
            setIsTenantSuspended(true);
            return;
          }
        }
      }

      const storeMachines = useManagerStore.getState().machines || [];
      const candidatePool =
        !tenantFromQr || tenantFromQr === tenantId
          ? [...machines, ...storeMachines]
          : machines;
      let targetMachine = findMachineByIdentifierOrPlate(candidatePool, mId, rawStr);

      if (!targetMachine && mId && effectiveTenantId) {
        // Sprawdź w bazie czy zeskanowany identyfikator nie jest częścią zamienną
        // WYŁĄCZNIE wtedy, gdy kod QR nie ma jawnego parametru machine=...
        if (!explicitMachineQr) {
          const storeParts = useManagerStore.getState().parts || [];
          const matchedStorePart = storeParts.find(
            p => p.id === mId || (p.code && p.code === mId)
          );
          if (matchedStorePart) {
            setPartQrNotice(
              t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
            );
            setSelectedMachine(null);
            setStep('scan');
            return;
          }

          try {
            const partDoc = await getDoc(doc(db, 'tenants', effectiveTenantId, 'parts', mId));
            if (partDoc.exists() && !partDoc.data()?.isDeleted) {
              setPartQrNotice(
                t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
              );
              setSelectedMachine(null);
              setStep('scan');
              return;
            }
          } catch {
            // ignore permission error if not bound yet
          }
        }

        try {
          const d = await getDoc(doc(db, 'tenants', effectiveTenantId, 'machines', mId));
          if (d.exists() && !d.data().isDeleted) {
            targetMachine = { id: d.id, ...d.data() };
          } else {
            const qrCandidates = Array.from(
              new Set([decodedText, rawStr, mId].map(v => String(v || '').trim()).filter(Boolean))
            );
            for (const qrCand of qrCandidates) {
              const q = query(
                collection(db, 'tenants', effectiveTenantId, 'machines'),
                where('qrCode', '==', qrCand),
                limit(1)
              );
              const snap = await getDocs(q);
              if (!snap.empty && !snap.docs[0].data().isDeleted) {
                targetMachine = { id: snap.docs[0].id, ...snap.docs[0].data() };
                break;
              }
            }
            if (!targetMachine) {
              const qInternal = query(
                collection(db, 'tenants', effectiveTenantId, 'machines'),
                where('internalId', '==', mId),
                limit(1)
              );
              const snapInternal = await getDocs(qInternal);
              if (!snapInternal.empty && !snapInternal.docs[0].data().isDeleted) {
                targetMachine = { id: snapInternal.docs[0].id, ...snapInternal.docs[0].data() };
              }
            }
          }
        } catch (err) {
          console.warn('[OperatorView: wyszukanie maszyny po kodzie]', err);
        }
      }

      const isInternalUser = Boolean(auth.currentUser && !auth.currentUser.isAnonymous);

      if (targetMachine) {
        lastResolvedMachineIdRef.current = targetMachine.id;
        urlMachineResolvedRef.current = true;
        setPartQrNotice(null);
        setErrorMsg(null);
        if (!isInternalUser) {
          setMachines(prev => {
            const others = (prev || []).filter(m => m && m.id !== targetMachine.id);
            return [targetMachine, ...others];
          });
        }
        setSelectedMachine(targetMachine);
        setStep('form');
        setSearchParams({ step: 'form', machine: targetMachine.id }, { replace: true });
        setBindNonce(n => n + 1);
      } else if (decodedText === 'manual' && isInternalUser) {
        lastResolvedMachineIdRef.current = 'manual';
        urlMachineResolvedRef.current = true;
        setSelectedMachine({ id: 'manual', name: '', regionId: '' });
        setStep('form');
        setSearchParams({ step: 'form', machine: 'manual' }, { replace: true });
      } else {
        setSelectedMachine(null);
        setSearchParams({ step: 'scan' }, { replace: true });
        setStep('scan');
        if (!isInternalUser && !effectiveKey) {
          setNeedsQr(true);
        } else {
          setErrorMsg(
            t(
              'machines.toasts.machineNotFoundOrInactive',
              `Nie znaleziono urządzenia (${mId}) w bazie wybranej firmy lub kod QR jest nieaktualny.`
            )
          );
        }
      }
    } finally {
      scanInFlightRef.current = false;
    }
  };

  const handleStepChange = newStep => {
    setStep(newStep);
    if (newStep === 'scan') {
      lastResolvedMachineIdRef.current = null;
      urlMachineResolvedRef.current = false;
      setSearchParams({ step: 'scan' }, { replace: true });
    } else {
      setSearchParams({ step: newStep, machine: urlMachineId || '' }, { replace: true });
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let unsubscribeMachines = () => {};
    let unsubscribeTopics = () => {};
    let unsubscribeRegions = () => {};
    let unsubscribeBranding = () => {};
    let unsubscribeMapSettings = () => {};
    let authUnsub = () => {};
    let cancelled = false;

    try {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(error => console.error('Anonymous login error:', error));
      }

      authUnsub = onAuthStateChanged(auth, async authUser => {
        if (authUser) {
          if (authUser.isAnonymous && tenantId) {
            try {
              const boundUser = await ensureAnonSessionForTenant(tenantId);
              if (boundUser && boundUser.uid !== authUser.uid) return;
            } catch (err) {
              if (err && err.message === 'TENANT_SUSPENDED') {
                setIsTenantSuspended(true);
                return;
              }
            }
          }
          if (cancelled) return;
          unsubscribeMachines();
          unsubscribeTopics();
          unsubscribeRegions();
          unsubscribeBranding();
          unsubscribeMapSettings();

          unsubscribeBranding = onSnapshot(
            doc(db, 'tenants', tenantId, 'settings', 'branding'),
            snap => {
              if (snap.exists()) {
                const current = useManagerStore.getState().branding || {};
                useManagerStore.getState().setBranding({ ...current, ...snap.data() });
              }
            },
            () => {}
          );

          unsubscribeMapSettings = onSnapshot(
            doc(db, 'tenants', tenantId, 'settings', 'map'),
            snap => {
              if (snap.exists()) {
                useManagerStore.getState().setMapSettings(snap.data());
              }
            },
            () => {}
          );

          if (authUser.isAnonymous) {
            if (urlMachineId && urlMachineId !== 'manual') {
              unsubscribeMachines = onSnapshot(
                doc(db, 'tenants', tenantId, 'machines', urlMachineId),
                docSnap => {
                  setNeedsQr(false);
                  if (docSnap.exists() && !docSnap.data().isDeleted) {
                    const target = { id: docSnap.id, ...docSnap.data() };
                    lastResolvedMachineIdRef.current = target.id;
                    urlMachineResolvedRef.current = true;
                    setPartQrNotice(null);
                    setErrorMsg(null);
                    setMachines(prev => {
                      const others = (prev || []).filter(m => m && m.id !== target.id);
                      return [target, ...others];
                    });
                    setSelectedMachine(target);
                    setStep('form');
                  } else if (!urlMachineResolvedRef.current) {
                    if (docSnap.metadata?.fromCache) {
                      return;
                    }
                    (async () => {
                      try {
                        const q = query(
                          collection(db, 'tenants', tenantId, 'machines'),
                          where('qrCode', '==', urlMachineId),
                          limit(1)
                        );
                        const snap = await getDocs(q);
                        if (!snap.empty && !snap.docs[0].data().isDeleted) {
                          const target = { id: snap.docs[0].id, ...snap.docs[0].data() };
                          lastResolvedMachineIdRef.current = target.id;
                          urlMachineResolvedRef.current = true;
                          setPartQrNotice(null);
                          setErrorMsg(null);
                          setMachines(prev => {
                            const others = (prev || []).filter(m => m && m.id !== target.id);
                            return [target, ...others];
                          });
                          setSelectedMachine(target);
                          setStep('form');
                          return;
                        }
                      } catch {
                        // ignore
                      }
                      if (urlMachineResolvedRef.current) return;
                      let isActuallyPart = false;
                      try {
                        const partSnap = await getDoc(
                          doc(db, 'tenants', tenantId, 'parts', urlMachineId)
                        );
                        if (partSnap.exists() && !partSnap.data()?.isDeleted) {
                          isActuallyPart = true;
                        }
                      } catch {
                        // ignore
                      }
                      urlMachineResolvedRef.current = true;
                      if (isActuallyPart) {
                        setPartQrNotice(
                          t(
                            'machines.toasts.scannedPartInsteadOfMachine',
                            PART_QR_IN_MACHINE_SCANNER_MSG
                          )
                        );
                      } else {
                        setErrorMsg(
                          t(
                            'machines.toasts.machineNotFoundOrInactive',
                            `Nie znaleziono urządzenia (${urlMachineId}) w bazie wybranej firmy lub kod QR jest nieaktualny.`
                          )
                        );
                      }
                      setSelectedMachine(null);
                      setStep('scan');
                    })();
                  }
                },
                error => {
                  console.error('SNAPSHOT ERROR FOR machine doc:', error);
                  if (error?.code === 'permission-denied') setNeedsQr(true);
                }
              );
            }
          } else {
            unsubscribeMachines = onSnapshot(
              query(
                collection(db, 'tenants', tenantId, 'machines'),
                where('isDeleted', '==', false)
              ),
              snapshot => {
                setNeedsQr(false);
                setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));

                if (urlMachineId && !urlMachineResolvedRef.current) {
                  const loadedList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                  const target = findMachineByIdentifierOrPlate(
                    loadedList,
                    urlMachineId,
                    urlMachineId
                  );
                  if (target) {
                    lastResolvedMachineIdRef.current = target.id;
                    urlMachineResolvedRef.current = true;
                    setPartQrNotice(null);
                    setErrorMsg(null);
                    setSelectedMachine(target);
                    setStep('form');
                  } else if (loadedList.length > 0 && !snapshot.metadata?.fromCache) {
                    urlMachineResolvedRef.current = true;
                    const storeParts = useManagerStore.getState().parts || [];
                    const matchedPart = storeParts.find(
                      p => p.id === urlMachineId || (p.code && p.code === urlMachineId)
                    );
                    if (matchedPart) {
                      setPartQrNotice(
                        t(
                          'machines.toasts.scannedPartInsteadOfMachine',
                          PART_QR_IN_MACHINE_SCANNER_MSG
                        )
                      );
                    } else {
                      setErrorMsg(
                        t(
                          'machines.toasts.machineNotFoundOrInactive',
                          `Nie znaleziono urządzenia (${urlMachineId}) w bazie wybranej firmy.`
                        )
                      );
                    }
                    setSelectedMachine(null);
                    setStep('scan');
                  }
                }
              },
              error => {
                console.error('SNAPSHOT ERROR FOR machines:', error);
                if (error?.code === 'permission-denied' && auth.currentUser?.isAnonymous)
                  setNeedsQr(true);
              }
            );
          }

          unsubscribeTopics = onSnapshot(
            collection(db, 'tenants', tenantId, 'topics'),
            querySnapshot => {
              setTopicsList(
                querySnapshot.docs
                  .map(d => d.data())
                  .filter(d => !d.isDeleted)
                  .map(d => d.text)
              );
            },
            error => console.error('SNAPSHOT ERROR FOR topics:', error)
          );

          unsubscribeRegions = onSnapshot(
            collection(db, 'tenants', tenantId, 'regions'),
            querySnapshot => {
              setRegions(
                querySnapshot.docs
                  .map(d => ({ id: d.id, ...d.data() }))
                  .filter(r => !r.isDeleted)
              );
            },
            error => console.error('SNAPSHOT ERROR FOR regions:', error)
          );
        }
      });
    } catch (error) {
      console.error('Błąd inicjalizacji:', error);
      setErrorMsg('Krytyczny błąd: ' + error.message);
    }
    return () => {
      cancelled = true;
      unsubscribeMachines();
      unsubscribeTopics();
      unsubscribeRegions();
      unsubscribeBranding();
      unsubscribeMapSettings();
      if (authUnsub) authUnsub();
    };
  }, [tenantId, urlMachineId, bindNonce]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <header className="bg-blue-900 text-white p-3.5 sm:p-4 flex justify-between items-center shadow-md gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
            <span>{t('login.report_fault_btn', 'Zgłoś Awarię')}</span>
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isOnline ? 'bg-green-400' : 'bg-orange-400'
              } animate-pulse`}
            ></span>
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              i18n.changeLanguage((i18n.language || 'pl').startsWith('pl') ? 'en' : 'pl')
            }
            className="flex items-center gap-1 bg-blue-800 hover:bg-blue-700 px-2.5 py-2 rounded transition-colors text-xs sm:text-sm font-bold cursor-pointer"
            title={t('sidebar.language', 'Język / Language')}
          >
            <i className="ph ph-globe text-base"></i>
            <span>{(i18n.language || 'pl').startsWith('pl') ? 'PL' : 'EN'}</span>
          </button>
          {onSwitchView && (
            <button
              onClick={onSwitchView}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-3 py-2 rounded transition-colors shadow-sm cursor-pointer"
              title="Wróć do Dyspozytorni"
            >
              <i className="ph ph-desktop text-xl"></i>
              <span className="hidden sm:inline">{t('login.control_room', 'Dyspozytornia')}</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded transition-colors text-xs sm:text-base cursor-pointer"
          >
            <i className="ph ph-sign-out text-lg sm:text-xl"></i>
            <span>{t('login.exit', 'Wyjdź')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-1.5 sm:p-6 w-full max-w-5xl mx-auto mt-1 flex flex-col">
        {isTenantSuspended ? (
          <div
            data-testid="operator-account-suspended-card"
            className="bg-red-50 border-2 border-red-400 text-red-900 p-6 sm:p-10 rounded-3xl shadow-md flex flex-col items-center justify-center text-center my-6"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <i className="ph-fill ph-prohibit text-4xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-red-900 mb-2">
              {suspendedMessage}
            </h2>
          </div>
        ) : (
          <>
        {partQrNotice && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-400 text-amber-950 p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <i className="ph ph-package text-2xl"></i>
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                  {partQrNotice}
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {t(
                    'machines.toasts.scannedPartSubtext',
                    'Zeskanowany kod QR należy do części magazynowej, a nie do urządzenia.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t('login.login_btn', 'Zaloguj się do UR')}
              </button>
              <button
                type="button"
                onClick={() => setPartQrNotice(null)}
                className="px-2.5 py-2 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded shadow-sm">
            <h3 className="font-bold text-sm">Log błędu systemu:</h3>
            <p className="text-xs font-mono break-words mt-1">{errorMsg}</p>
          </div>
        )}

        {step === 'scan' && needsQr && (
          <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded shadow-sm">
            <p className="font-bold text-sm">
              {t(
                'operator.scanAnyQrTitle',
                'Zeskanuj dowolny kod QR lub NFC w swoim rejonie, i zgłoś awarię dowolnego urządzenia z firmy.'
              )}
            </p>
            <p className="text-xs mt-1">
              {t(
                'operator.scanAnyQrDesc',
                'Awaria zostanie zgłoszona bezpośrednio do odpowiedniego działu lub serwisu. Jednorazowe zeskanowanie połączy telefon z systemem obsługującym zgłoszenia.'
              )}
            </p>
          </div>
        )}

        {step === 'scan' && (
          <OperatorScanner
            onScanSuccess={handleScanSuccess}
            machines={machines}
            isInternal={Boolean(auth.currentUser && !auth.currentUser.isAnonymous)}
          />
        )}

        {step === 'form' && !selectedMachine && needsQr && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-amber-200 text-center flex flex-col items-center justify-center">
            <i className="ph ph-qr-code text-5xl text-amber-500 mb-4"></i>
            <h2 className="text-lg font-semibold text-gray-800">
              {t('operator.scanDeviceQrHeading', 'Zeskanuj kod QR urządzenia')}
            </h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              {t(
                'operator.deviceNotConnectedDesc',
                'Zeskanuj dowolny kod QR lub NFC w swoim rejonie, i zgłoś awarię dowolnego urządzenia z firmy.'
              )}
            </p>
            <button
              onClick={() => handleStepChange('scan')}
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl cursor-pointer"
            >
              Otwórz skaner
            </button>
          </div>
        )}

        {step === 'form' && !selectedMachine && !needsQr && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center">
            <i className="ph ph-spinner-gap animate-spin text-4xl text-blue-600 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800">Wczytywanie urządzenia...</h2>
            <p className="text-gray-500 text-sm mt-2">
              Pobieranie danych z bazy urządzeń.
            </p>
          </div>
        )}

        {step === 'form' && selectedMachine && (
          <OperatorForm
            machines={machines}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            regions={regions}
            initialMachineId={initialMachineId}
            handleStepChange={handleStepChange}
            isOnline={isOnline}
            topicsList={topicsList}
            reportersList={reportersList}
            stopLiveScanner={() => {}}
            isInternal={Boolean(auth.currentUser && !auth.currentUser.isAnonymous)}
          />
        )}
        {step === 'success' && (
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center animate-fade-in border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <i className="ph ph-check-circle text-6xl"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Gotowe!
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm text-lg leading-relaxed">
              Zgłoszenie awarii urządzenia{' '}
              <span className="font-bold text-gray-800">{selectedMachine?.name}</span> zostało
              pomyślnie przekazane do odpowiedniego działu / serwisu.
            </p>

            <button
              onClick={() => {
                setSelectedMachine(null);
                handleStepChange('scan');
              }}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-10 rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-gray-900/20 active:scale-95 cursor-pointer"
            >
              Zgłoś kolejną awarię
            </button>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

OperatorView.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func,
  initialMachineId: PropTypes.string,
  onSwitchView: PropTypes.func,
};
