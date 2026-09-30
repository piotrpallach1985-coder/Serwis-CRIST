import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { safeParseDate } from '../../../utils/dateHelpers';

export default function MachineQRCard({ machine, qrValue }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
      {machine.name.includes('(DO WERYFIKACJI)') ? (
        <>
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-2">
            <i className="ph ph-warning"></i>
          </div>
          <div className="font-bold text-orange-600 text-center text-sm">{t('machines.details.needsVerification')}</div>
          <div className="text-xs text-gray-500 text-center">
            {t('machines.details.verificationHint')}
          </div>
        </>
      ) : (
        <>
          <div className="font-bold text-gray-700">{t('machines.details.qrCodeTitle')}</div>
          <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
            <div id={"qr-svg-" + machine.id}><QRCodeSVG value={qrValue} size={150} /></div>
          </div>
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="text-[10px] text-gray-400 font-medium">{t('machines.details.qrDate')}{(safeParseDate(machine.updatedAt || machine.qrCreatedAt || machine.createdAt) || new Date()).toLocaleDateString('pl-PL')}</div>
          </div>
          <div className="text-xs text-gray-400 text-center px-4 mt-1">
            {t('machines.details.qrHint')}
          </div>
        </>
      )}
    </div>
  );
}
