import React from 'react';
import { useTranslation } from 'react-i18next';
import { TileLayoutButton } from '../../shared/CustomizableTileGrid';

export default function MachineHeader({
  machine,
  onBack,
  onScanNext,
  onNfcNext,
  onEdit,
  onDelete,
  onPrint,
  onGeneratePDF,
  tileLayout,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3">
      {/* Górna linia na mobile: Powrót + Tytuł */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
        <button
          onClick={onBack}
          className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
          title="Powrót"
        >
          <i className="ph ph-arrow-left text-lg"></i>{' '}
          <span className="hidden sm:inline">{t('machines.buttons.back')}</span>
        </button>
        <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0">
          {t('machines.details.title')}
        </h2>
      </div>

      {/* Dolna linia na mobile / Prawa strona na desktopie: Przyciski akcji */}
      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
        {tileLayout && (
          <TileLayoutButton
            isEditing={tileLayout.isEditing}
            setIsEditing={tileLayout.setIsEditing}
            resetLayout={tileLayout.resetLayout}
            compact
          />
        )}
        {onScanNext && (
          <button
            onClick={onScanNext}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
            title={t('machines.buttons.scanQrTitle')}
          >
            <i className="ph ph-qr-code text-xl md:text-lg"></i>
            <span className="hidden md:inline">{t('machines.buttons.scanQr')}</span>
          </button>
        )}
        {onNfcNext && (
          <button
            onClick={onNfcNext}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
            title={t('machines.buttons.nfcTitle')}
          >
            <i className="ph ph-waves text-xl md:text-lg"></i>
            <span className="hidden md:inline">{t('machines.buttons.nfc')}</span>
          </button>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-blue-200 transition-colors shrink-0"
          title={t('machines.buttons.edit')}
        >
          <i className="ph ph-pencil-simple text-xl md:text-base"></i>
          <span className="hidden md:inline">{t('machines.buttons.edit')}</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-red-200 transition-colors shrink-0"
          title={t('machines.buttons.delete')}
        >
          <i className="ph ph-trash text-xl md:text-base"></i>
          <span className="hidden md:inline">{t('machines.buttons.delete')}</span>
        </button>
        {!machine.name.includes('(DO WERYFIKACJI)') && (
          <button
            onClick={() => onPrint(machine)}
            className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm border border-slate-300 transition-colors shrink-0"
            title={t('machines.buttons.printQr')}
          >
            <i className="ph ph-printer text-xl md:text-base"></i>
            <span className="hidden md:inline">{t('machines.buttons.printQr')}</span>
          </button>
        )}
        <button
          onClick={onGeneratePDF}
          className="flex items-center justify-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-lg font-bold text-sm shadow-md transition-colors shrink-0"
          title={t('machines.buttons.pdfReport')}
        >
          <i className="ph ph-file-pdf text-xl md:text-base"></i>
          <span className="hidden md:inline">{t('machines.buttons.pdfReport')}</span>
        </button>
      </div>
    </div>
  );
}
