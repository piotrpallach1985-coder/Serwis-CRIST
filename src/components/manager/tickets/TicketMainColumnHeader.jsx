import React from 'react';
import { safe } from '../../../utils/safeRender';
import { safeParseDate } from '../../../utils/dateHelpers';
import { useTranslation } from 'react-i18next';
import {
  resolveMachineGeoLocation,
  buildGoogleMapsNavigationUrl,
  formatGpsCheckIn,
  formatFGasSummary,
} from '../../../utils/fieldServiceHelpers';

export default function TicketMainColumnHeader({
  currentTicket,
  STATUSES,
  machines,
  regions,
}) {
  const { t } = useTranslation();

  const machineObj = (machines || []).find(m => m.id === currentTicket.machineId) || null;
  const geo = resolveMachineGeoLocation(
    machineObj || {
      regionId: currentTicket.regionId,
      regionName: currentTicket.regionName,
      address: currentTicket.address,
    },
    regions
  );
  const navUrl = buildGoogleMapsNavigationUrl(geo);
  const gpsCheckInStr = formatGpsCheckIn(currentTicket.completedGps);
  const fGasSummaryStr = formatFGasSummary(currentTicket.fGasProtocol);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-8">
        {/* Statusy i Tagi */}
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-bold text-gray-400 mr-1 text-sm md:text-lg">
              T{currentTicket.id?.slice(0, 4).toUpperCase() || '1'}
            </span>
            <span
              className={`px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold border uppercase tracking-wider ${
                STATUSES[currentTicket.status || 1]?.color || 'bg-gray-100 text-gray-800'
              }`}
            >
              {STATUSES[currentTicket.status || 1]?.label || t('tickets.statuses.unknown')}
            </span>
            {currentTicket.isCritical && (
              <span className="bg-red-600 animate-pulse text-white px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                {t('tickets.details.machine_down')}
              </span>
            )}
          </div>

          {navUrl && (
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ticket-navigate-gps-btn"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              title="Otwórz nawigację Google Maps do lokalizacji zgłoszenia"
            >
              <i className="ph ph-navigation-arrow text-sm"></i>
              <span>{t('machines.details.navigateGps', 'Nawiguj GPS')}</span>
            </a>
          )}
        </div>

        {/* Tytuł */}
        <h2 className="text-lg md:text-2xl font-extrabold text-[#111827] mb-2 md:mb-6">
          {safe(currentTicket.topic)}
        </h2>

        {/* Podział na dane obiektu i info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 border-t border-gray-100 pt-8">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              {t('tickets.details.object_data')}
            </h3>
            <div className="font-bold text-[#111827] text-lg mb-1 flex items-center gap-2">
              {safe(currentTicket.machineName)}
              {!machines?.some(m => m.id === currentTicket.machineId) && (
                <span className="text-red-500 font-bold ml-1">
                  {t('tickets.details.deleted_machine_inline')}
                </span>
              )}
            </div>
            <div className="text-gray-500 text-sm flex items-center gap-1 mb-1 flex-wrap">
              <i className="ph ph-map-pin"></i>{' '}
              {safe(currentTicket.regionName, t('tickets.details.no_region'))}{' '}
              {currentTicket.bay ? ` / ${safe(currentTicket.bay)}` : ''}
              {(regions || []).find(
                r => r.name === currentTicket.regionName || r.id === currentTicket.regionId
              )?.mapImageUrl && (
                <a
                  href={
                    (regions || []).find(
                      r => r.name === currentTicket.regionName || r.id === currentTicket.regionId
                    ).mapImageUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-2 inline-flex items-center gap-1"
                >
                  <i className="ph ph-map-trifold"></i> Podmapa
                </a>
              )}
            </div>
            {geo.hasAddress && (
              <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                <i className="ph ph-navigation-arrow"></i> {geo.address}
              </div>
            )}
            {(machineObj?.contactPerson || machineObj?.contactPhone || machineObj?.accessNotes) && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1.5 space-y-0.5">
                {(machineObj.contactPerson || machineObj.contactPhone) && (
                  <div className="font-bold text-slate-800">
                    Klient: {machineObj.contactPerson || '-'}{' '}
                    {machineObj.contactPhone && (
                      <a
                        href={`tel:${machineObj.contactPhone.replace(/\s+/g, '')}`}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        ({machineObj.contactPhone})
                      </a>
                    )}
                  </div>
                )}
                {machineObj.accessNotes && (
                  <div className="text-slate-600">Dostęp: {machineObj.accessNotes}</div>
                )}
              </div>
            )}
            <div className="text-gray-400 text-xs font-mono mt-1">
              ID: {safe(currentTicket.machineId)}
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              {t('tickets.details.ticket_info')}
            </h3>
            <div className="font-bold text-[#111827] flex items-center gap-2 mb-1">
              <i className="ph ph-user text-gray-400"></i> {safe(currentTicket.reportedBy)}
            </div>
            {currentTicket.reporterDeviceId && (
              <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-xs bg-gray-100 p-2 rounded w-fit">
                <i className="ph ph-device-mobile text-gray-500"></i>{' '}
                {t('tickets.details.device_id')}
                {safe(currentTicket.reporterDeviceId)}
              </div>
            )}
            {currentTicket.reporterPhone && (
              <div className="font-bold text-gray-600 flex items-center gap-2 mb-2 text-sm">
                <i className="ph ph-phone text-gray-400"></i> {safe(currentTicket.reporterPhone)}
              </div>
            )}
            <div className="text-gray-500 text-sm mb-1">
              Priorytet:{' '}
              <span className={currentTicket.isCritical ? 'text-red-600 font-bold' : ''}>
                {currentTicket.isCritical
                  ? t('tickets.details.priority_high')
                  : t('tickets.details.priority_standard')}
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              {t('tickets.details.reported_at')}{' '}
              {safeParseDate(currentTicket.createdAt)?.toLocaleString('pl-PL') ||
                t('tickets.history.no_date')}
            </div>
            {gpsCheckInStr && (
              <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                <i className="ph ph-map-pin-line"></i> Potwierdzenie GPS: {gpsCheckInStr}
              </div>
            )}
            {fGasSummaryStr && (
              <div className="mt-2 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg">
                <i className="ph ph-snowflake mr-1"></i> {fGasSummaryStr}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
