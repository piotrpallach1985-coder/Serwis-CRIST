import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentTenant } from '../../../utils/tenantHelper';
import { useManagerStore } from '../../../store/managerStore';
import {
  getOrCreateQrKey,
  buildMachineQrValue,
  resolveTenantDisplayName,
  resolveMachineQrLocation,
  formatQrDate,
} from '../../../services/qrAccess.service';
import { isMachineIncompleteForQr } from '../../../utils/bulkImportHelper';
import { resolveAnonymousReportPin } from '../../../utils/fieldServiceHelpers';

export default function MachineQRCard({ machine }) {
  const { t } = useTranslation();
  const tenantId = getCurrentTenant();
  const branding = useManagerStore(state => state.branding);
  const mapSettings = useManagerStore(state => state.mapSettings);
  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  const [qrKey, setQrKey] = useState(null);
  const [showPinOnQr, setShowPinOnQr] = useState(false);

  useEffect(() => {
    let active = true;
    getOrCreateQrKey(tenantId)
      .then(k => {
        if (active) setQrKey(k);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tenantId]);

  const isUnverified = isMachineIncompleteForQr(machine);
  const tenantName = resolveTenantDisplayName(tenantId, branding);
  const locationStr = resolveMachineQrLocation(machine, regions, '-');
  const internalIdStr = machine.internalId || machine.licensePlate || '-';
  const qrDateStr = formatQrDate(machine, machines, t('machines.print.noData', '-'));
  const pinReq = resolveAnonymousReportPin(machine, regions, branding, mapSettings);
  const qrValue = buildMachineQrValue(machine, tenantId, qrKey, {
    branding,
    tenantName,
    allMachines: machines,
    date: qrDateStr,
  });

  if (isUnverified) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center h-full">
        <i className="ph ph-warning-circle text-4xl text-yellow-500 mb-3"></i>
        <h3 className="text-base font-bold text-yellow-800 mb-2">
          {t('machines.details.needsVerification')}
        </h3>
        <p className="text-xs text-yellow-700 leading-relaxed">
          {t('machines.details.verificationHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center text-center h-full">
      <div className="w-full max-w-[280px] bg-white border-2 border-slate-900 rounded-2xl p-5 flex flex-col items-center text-center shadow-xs">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 21H21V10L16 13V10L11 13V6H3V21Z"
              fill="#cbd5e1"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M6 3V6M9 3V6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
            {tenantName}
          </span>
        </div>

        <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider leading-snug mb-3.5">
          VexoNT - SKANUJ ABY ZGŁOSIĆ AWARIĘ
        </div>

        <div className="my-1 flex items-center justify-center">
          <QRCodeSVG
            id={`qr-svg-${machine.id}`}
            value={qrValue}
            size={148}
            level="M"
            includeMargin={false}
          />
        </div>

        <h3 className="text-base font-extrabold text-slate-900 mt-3.5 mb-3 leading-snug break-words w-full">
          {machine.name}
        </h3>

        <div className="w-full border-t-2 border-dashed border-slate-300 mb-3"></div>

        <div className="w-full text-left space-y-2">
          <div>
            <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              LOKALIZACJA
            </div>
            <div className="text-xs font-extrabold text-slate-900 leading-snug break-words">
              {locationStr}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              NUMER WEWNĘTRZNY UR
            </div>
            <div className="text-xs font-bold font-mono text-slate-900 leading-snug break-words">
              {internalIdStr}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              DATA KODU (OST. EDYCJA)
            </div>
            <div className="text-xs font-bold font-mono text-slate-900 leading-snug">
              {qrDateStr}
            </div>
          </div>
          {showPinOnQr && pinReq.required && pinReq.pin && (
            <div
              data-testid="single-qr-pin-value"
              className="pt-1.5 mt-1 border-t border-dashed border-slate-300"
            >
              <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                KOD PIN ZGŁOSZEŃ
              </div>
              <div className="text-xs font-extrabold font-mono text-slate-900 tracking-widest leading-snug">
                {pinReq.pin}
              </div>
            </div>
          )}
        </div>
      </div>

      {pinReq.required && pinReq.pin && (
        <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-950 cursor-pointer transition-colors">
          <input
            type="checkbox"
            id={`qr-show-pin-${machine.id}`}
            data-testid="single-qr-show-pin-checkbox"
            checked={showPinOnQr}
            onChange={e => setShowPinOnQr(e.target.checked)}
            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <i className="ph ph-key text-amber-600"></i>
          <span>Drukuj PIN na etykiecie ({pinReq.pin})</span>
        </label>
      )}
    </div>
  );
}

MachineQRCard.propTypes = {
  machine: PropTypes.object.isRequired,
};
