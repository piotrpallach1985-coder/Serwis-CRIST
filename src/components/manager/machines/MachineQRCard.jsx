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
  formatQrDate,
} from '../../../services/qrAccess.service';

export default function MachineQRCard({ machine }) {
  const { t } = useTranslation();
  const tenantId = getCurrentTenant();
  const branding = useManagerStore(state => state.branding);
  const machines = useManagerStore(state => state.machines || []);
  const [qrKey, setQrKey] = useState(null);

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

  const isUnverified = machine.name && machine.name.includes('(DO WERYFIKACJI)');
  const tenantName = resolveTenantDisplayName(tenantId, branding);
  const qrDateStr = formatQrDate(machine, machines, t('machines.print.noData', 'Brak danych'));
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
      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
        {tenantName}
      </div>
      <h3 className="text-xs font-extrabold text-gray-800 mb-2 line-clamp-1 px-2">
        {machine.name}
      </h3>
      <div className="p-2.5 bg-white border-2 border-dashed border-gray-300 rounded-xl mb-2.5 flex items-center justify-center gap-1.5">
        <span
          className="text-[8px] font-semibold text-slate-400 tracking-widest select-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          system VexoNT
        </span>
        <QRCodeSVG
          id={`qr-svg-${machine.id}`}
          value={qrValue}
          size={130}
          level="M"
          includeMargin={false}
        />
        <span
          className="text-[8px] font-semibold text-slate-400 tracking-widest select-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          system VexoNT
        </span>
      </div>
      <div className="text-[11px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full mb-1.5">
        {t('machines.details.qrDate')} {qrDateStr}
      </div>
      <p className="text-[11px] text-gray-500 max-w-[220px] leading-snug">
        {t('machines.details.qrHint')}
      </p>
    </div>
  );
}

MachineQRCard.propTypes = {
  machine: PropTypes.object.isRequired,
};
