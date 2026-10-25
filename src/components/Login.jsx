import PropTypes from 'prop-types';
import QRScannerModal from './shared/QRScannerModal';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loginWithEmail,
  loginAnon,
  subscribeToGeneralSettings,
  subscribeToBranding,
} from '../services/auth.service';
import {
  parseQrPayload,
  PART_QR_IN_MACHINE_SCANNER_MSG,
} from '../services/qrAccess.service';

import { USER_ROLES } from '../utils/constants';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';

export default function Login({ onLogin, currentUser }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [partScanAlert, setPartScanAlert] = useState(null);

  const currentLang = (i18n.language || 'pl').startsWith('pl') ? 'pl' : 'en';
  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'pl' ? 'en' : 'pl');
  };

  // Automatyczne przekierowanie gdy wejście z linku QR (bez logowania)
  useEffect(() => {
    const realParams = new URLSearchParams(window.location.search);
    const pId = realParams.get('part');
    const mId = realParams.get('machine');
    const tId = realParams.get('tenant');
    const qrKey = realParams.get('k');
    if (pId && !mId) {
      if (tId) {
        useManagerStore.getState().setTenantId(tId);
      }
      setPartScanAlert(
        t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
      );
      if (!currentUser) {
        setLoginModalTarget('login_only');
      }
      return;
    }
    if (mId && !currentUser) {
      if (tId) {
        useManagerStore.getState().setTenantId(tId);
      }
      const finalTenant = tId || getCurrentTenant();
      const autoBypass = async () => {
        try {
          await loginAnon(finalTenant, qrKey);
        } catch (e) {
          console.warn('Anonymous sign-in failed', e);
        }
        onLogin({
          name: 'Nieznany Zgłaszający',
          role: USER_ROLES.OPERATOR,
          uid: 'anon',
          tenantId: finalTenant,
        });
        navigate('/operator?machine=' + mId);
      };
      autoBypass();
    }
  }, []);

  const handleScanSuccess = async (decodedText, rawQr) => {
    setIsScanning(false);
    const parsed = parseQrPayload(rawQr || decodedText);
    const storeParts = useManagerStore.getState().parts || [];
    const candidateId = parsed.partId || parsed.machineId || String(decodedText || '').trim();
    const matchedPart = storeParts.find(
      p => p.id === candidateId || (p.code && p.code === candidateId)
    );
    if (parsed.isPartQr || matchedPart) {
      setPartScanAlert(
        t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG)
      );
      if (!currentUser) {
        setLoginModalTarget('login_only');
      }
      return;
    }

    const mId = parsed.machineId || decodedText;
    const tenantFromQr = parsed.tenantId;
    if (tenantFromQr) {
      useManagerStore.getState().setTenantId(tenantFromQr);
    }
    const finalTenant = tenantFromQr || getCurrentTenant();
    try {
      await loginAnon(finalTenant, parsed.key);
    } catch (e) {
      console.warn('Anonymous sign-in failed', e);
    }

    onLogin({
      name: 'Nieznany Zgłaszający',
      role: USER_ROLES.OPERATOR,
      uid: 'anon',
      tenantId: finalTenant,
    });
    navigate('/operator?machine=' + encodeURIComponent(mId));
  };

  const [, setModSettings] = useState({ enableTickets: true, enablePlanned: true });
  const [errorMsg, setErrorMsg] = useState('');

  const [loginModalTarget, setLoginModalTarget] = useState(null);

  const tenantId = useManagerStore(state => state.tenantId);
  const [branding, setBranding] = useState({
    companyName: 'VexoNT',
    systemSubtitle: 'MAINT SYSTEM PORTAL',
    companyLogoUrl: '',
    appLogoUrl: '',
  });

  useEffect(() => {
    const currentTenantId = getCurrentTenant();
    const unsub = subscribeToGeneralSettings(currentTenantId, d => {
      setModSettings({
        enableTickets: d.enableTickets !== false,
        enablePlanned: d.enablePlanned !== false,
      });
    });
    return () => unsub();
  }, [tenantId]);

  useEffect(() => {
    const currentTenantId = getCurrentTenant();

    // Subskrypcja GLOBALNYCH ustawień (Logo Aplikacji - VexoNT)
    const unsub = subscribeToBranding(currentTenantId, payload => {
      if (payload.type === 'global') {
        setBranding(prev => ({ ...prev, appLogoUrl: payload.globalAppLogo }));
      } else {
        const data = payload.data;
        if (data) {
          setBranding(prev => ({
            companyName: data.companyName || currentTenantId.toUpperCase(),
            systemSubtitle: data.systemSubtitle || 'MAINT SYSTEM PORTAL',
            companyLogoUrl: data.companyLogoUrl || '',
            appLogoUrl: data.appLogoUrl || prev.appLogoUrl,
          }));
        } else {
          setBranding(prev => ({
            companyName: currentTenantId.toUpperCase(),
            systemSubtitle: 'MAINT SYSTEM PORTAL',
            companyLogoUrl: '',
            appLogoUrl: prev.appLogoUrl,
          }));
        }
      }
    });
    return () => unsub();
  }, [tenantId]);

  const handleEmailSubmit = async e => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const userData = await loginWithEmail(email.trim(), password);
      let targetModule =
        loginModalTarget && loginModalTarget !== 'login_only' ? loginModalTarget : 'home';
      let targetTab = targetModule === 'home' ? 'home' : undefined;

      if (userData.role === 'superadmin') {
        targetModule = 'system_admin';
        targetTab = 'superadmin';
      }

      window.history.replaceState(
        { module: targetModule, tab: targetTab },
        '',
        `?module=${targetModule}${targetTab ? '&tab=' + targetTab : ''}`
      );
      onLogin({
        uid: userData.uid,
        name: userData.name || email,
        role: userData.role || 'brak',
        permissions: userData.permissions || [],
        phone: userData.phone || '',
        tenantId: getCurrentTenant(),
      });
      setLoginModalTarget(null);
      setPartScanAlert(null);
    } catch (err) {
      console.error(err);
      if (err.message === 'USER_NO_ROLE') {
        setErrorMsg('Zalogowano, ale brak przypisanej roli.');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMsg('Nieprawidłowy e-mail lub hasło.');
      } else {
        setErrorMsg('Błąd: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorBypass = async () => {
    try {
      await loginAnon();
    } catch (e) {
      console.warn('Anonymous sign-in failed', e);
    }
    navigate('/operator');
    onLogin({ name: 'Nieznany Zgłaszający', role: USER_ROLES.OPERATOR, uid: 'anon' });
  };

  const handleTileClick = target => {
    if (currentUser) {
      navigate(target === 'operator' ? '/operator' : `/manager/${target}/home`);
      onLogin(currentUser);
    } else {
      setLoginModalTarget(target);
    }
  };

  return (
    <div className="min-h-[100svh] bg-[#f8f9fa] flex flex-col items-center justify-start p-2 sm:p-4 text-[#111827] relative">
      {/* Top Bar / Language Switcher on Start Screen */}
      {!currentUser && (
        <div className="w-full max-w-4xl flex items-center justify-end px-2 pt-2 sm:pt-3 z-40">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all text-xs sm:text-sm font-bold cursor-pointer"
            title={t('sidebar.language', 'Język / Language')}
          >
            <i className="ph ph-globe text-base sm:text-lg text-blue-600"></i>
            <span
              className={
                currentLang === 'pl'
                  ? 'text-blue-600 font-black'
                  : 'text-slate-400 font-semibold'
              }
            >
              PL
            </span>
            <span className="text-slate-300">/</span>
            <span
              className={
                currentLang === 'en'
                  ? 'text-blue-600 font-black'
                  : 'text-slate-400 font-semibold'
              }
            >
              EN
            </span>
          </button>
        </div>
      )}

      {partScanAlert && (
        <div className="w-full max-w-2xl mt-3 bg-amber-50 border-2 border-amber-400 text-amber-950 px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2.5 text-sm font-bold">
            <i className="ph ph-warning-circle text-2xl text-amber-600 shrink-0"></i>
            <span>{partScanAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setPartScanAlert(null)}
            className="text-amber-700 hover:text-amber-950 font-bold p-1 cursor-pointer"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>
      )}

      {/* Top Bar for Logged in Users */}
      {currentUser && currentUser.role !== 'operator' && (
        <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 z-50">
          <div className="flex items-center bg-white rounded-xl shadow-sm px-4 py-2">
            <img
              src={branding?.appLogoUrl || './pwa-192x192.jpg'}
              alt="VexoNT"
              className="h-6 sm:h-8 object-contain"
            />
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all text-xs sm:text-sm font-bold cursor-pointer"
              title={t('sidebar.language', 'Język / Language')}
            >
              <i className="ph ph-globe text-base text-blue-600"></i>
              <span
                className={
                  currentLang === 'pl'
                    ? 'text-blue-600 font-black'
                    : 'text-slate-400 font-semibold'
                }
              >
                PL
              </span>
              <span className="text-slate-300">/</span>
              <span
                className={
                  currentLang === 'en'
                    ? 'text-blue-600 font-black'
                    : 'text-slate-400 font-semibold'
                }
              >
                EN
              </span>
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => onLogin(null)}
              className="flex items-center gap-1.5 bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 px-3 py-2 rounded-xl transition-colors font-bold text-sm shadow-sm cursor-pointer"
            >
              <i className="ph ph-sign-out text-lg"></i>
              <span className="hidden sm:inline">{t('login.logout', 'Wyloguj')}</span>
            </button>
          </div>
        </div>
      )}

      {!currentUser ? (
        <>
          <div className="pt-4 sm:pt-12 md:pt-16 mb-5 md:mb-10 text-center animate-fade-in-up">
            <div className="flex justify-center mb-3 sm:mb-5">
              <div className="shrink-0 rounded-3xl overflow-hidden">
                <img
                  src={branding?.appLogoUrl || './pwa-192x192.jpg'}
                  alt="App Logo"
                  className="h-16 sm:h-24 object-contain rounded-3xl"
                />
              </div>
            </div>
            <h1 className="font-black text-xl sm:text-2xl leading-tight tracking-wide text-blue-900 mb-2 sm:mb-4">
              {t('login.system_title', 'MAINTENANCE SYSTEM')}
            </h1>
          </div>

          <div className="w-full max-w-4xl animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
            <div
              onClick={handleOperatorBypass}
              className="cursor-pointer bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-yellow-50 text-yellow-500 animate-pulse">
                <i className="ph-fill ph-warning text-2xl md:text-3xl"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-3 text-gray-800">
                {t('login.report_fault_title', 'Zgłoszenie Awarii')}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">
                {t(
                  'login.report_fault_desc',
                  'Dla pracowników. Zgłoszenia bezpośrednio ze stanowiska, bez logowania.'
                )}
              </p>
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 md:py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                {t('login.report_fault_btn', 'Zgłoś awarię')}{' '}
                <i className="ph ph-arrow-right font-bold"></i>
              </button>
            </div>

            <div
              onClick={() => setLoginModalTarget('login_only')}
              className="cursor-pointer bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-blue-50 text-blue-600">
                <i className="ph-fill ph-gear text-2xl md:text-3xl animate-[spin_4s_linear_infinite]"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-3 text-gray-800">
                {t('login.maintenance_title', 'Utrzymanie Ruchu')}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">
                {t(
                  'login.maintenance_desc',
                  'Dostęp dla autoryzowanych pracowników działu Utrzymania Ruchu.'
                )}
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                {t('login.login_btn', 'Zaloguj się')}{' '}
                <i className="ph ph-lock-key font-bold"></i>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col items-center pt-20 md:pt-28 max-w-4xl animate-fade-in">
          {/* Header LOGO & Text */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-3xl shadow-sm flex items-center justify-center p-3 mb-4">
              {branding?.companyLogoUrl ? (
                <img
                  src={branding.companyLogoUrl}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-[#1f3f88] flex flex-col items-center">
                  <i className="ph-fill ph-hexagon text-4xl"></i>
                  <span className="font-black text-sm mt-1 tracking-widest">VexoNT</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
              {branding?.companyName || 'VexoNT'}
            </h1>
            <h2 className="text-xs md:text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">
              {branding?.systemSubtitle || 'DYSPOZYTORNIA UR'}
            </h2>

            <h3 className="text-lg md:text-xl font-bold text-slate-800">
              {t('login.choose_module', 'Wybierz moduł do pracy')}
            </h3>
          </div>

          {/* Tiles Grid */}
          <div className="w-full max-w-md md:max-w-xl mx-auto px-2">
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4 md:gap-6">
              {/* Skaner QR/NFC */}
              <div
                onClick={() => setIsScanning(true)}
                className="cursor-pointer bg-white aspect-square md:aspect-auto md:h-48 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] bg-gradient-to-br from-[#1b5fcc] to-[#8644e5] flex items-center justify-center text-white mb-3 md:mb-5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <i className="ph ph-qr-code text-2xl md:text-3xl"></i>
                    <i className="ph ph-waves text-xl md:text-2xl"></i>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-lg">
                  {t('login.qr_nfc_scanner', 'Skaner QR/NFC')}
                </h3>
              </div>

              {/* Panel UR */}
              <div
                onClick={() => handleTileClick('tickets')}
                className="cursor-pointer bg-white aspect-square md:aspect-auto md:h-48 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] md:border-[4px] border-[#ed6d24] text-[#ed6d24] flex items-center justify-center mb-3 md:mb-5">
                  <i className="ph ph-wrench text-3xl md:text-4xl"></i>
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-lg">
                  {t('login.ur_panel', 'Panel UR')}
                </h3>
              </div>
            </div>

            <div className="flex justify-center">
              {/* Administrator */}
              <div
                onClick={() => handleTileClick('master_data')}
                className="w-1/2 min-w-[150px] cursor-pointer bg-white aspect-square md:aspect-auto md:h-48 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] bg-[#eef2f6] text-[#0948b3] flex items-center justify-center mb-3 md:mb-5">
                  <div className="relative flex items-center justify-center">
                    <i className="ph ph-desktop text-3xl md:text-4xl"></i>
                    <i className="ph-fill ph-gear absolute -bottom-1 -right-1 text-base md:text-xl text-gray-800"></i>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-lg">
                  {t('login.admin_panel', 'Administrator')}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title={t('login.scan_qr_title', 'Skanuj kod QR maszyny')}
        subtitle={t(
          'login.scan_qr_subtitle',
          'Skieruj aparat na kod QR, aby odczytać dokumenty DTR.'
        )}
      />

      {loginModalTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setLoginModalTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <i className="ph ph-x text-2xl"></i>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ph ph-lock-key text-3xl text-gray-700"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t('login.modal_title', 'Logowanie')}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {t('login.modal_desc', 'Dostęp wymaga autoryzacji do wybranego modułu.')}
              </p>
            </div>

            {partScanAlert && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <i className="ph ph-warning-circle text-lg text-amber-600 shrink-0"></i>
                <span>{partScanAlert}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {t('login.email_label', 'Adres e-mail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3.5 sm:p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-medium bg-gray-50"
                  placeholder={t('login.email_placeholder', 'twój.email@VexoNT.pl')}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {t('login.password_label', 'Hasło')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3.5 sm:p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111827] outline-none font-medium bg-gray-50"
                  placeholder="••••••••"
                  required
                />
              </div>
              {errorMsg && (
                <div className="text-red-500 text-sm font-bold text-center mt-2 bg-red-50 py-2 rounded-lg">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-2.5 md:py-3 rounded-xl transition-colors mt-4 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading
                  ? t('login.logging_in', 'Logowanie...')
                  : t('login.login_submit', 'Zaloguj się i przejdź')}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="mt-8 pb-4 text-center text-[11px] font-medium text-slate-400">
        {t(
          'login.footer_subtitle',
          '© 2026 VexoNT. Wszelkie prawa zastrzeżone. • System Obsługi Awarii & Serwisu'
        )}
      </div>
    </div>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
};
