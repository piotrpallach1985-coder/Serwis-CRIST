import React from 'react';
import { safe } from '../../../utils/safeRender';
import { safeParseDate } from '../../../utils/dateHelpers';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../../store/managerStore';
import {
  resolveMachineGeoLocation,
  buildGoogleMapsNavigationUrl,
  formatGpsCheckIn,
  formatFGasSummary,
  getIndustryProfileConfig,
  getCkobCategoryLabel,
  calculateCo2Equivalent,
} from '../../../utils/fieldServiceHelpers';

export default function TicketMainColumnHeader({
  currentTicket,
  STATUSES,
  machines,
  regions,
}) {
  const { t } = useTranslation();
  const branding = useManagerStore(state => state.branding || {});
  const mapSettings = useManagerStore(state => state.mapSettings);
  const industryProfile = branding?.industryProfile || 'industrial';
  const profileConfig = getIndustryProfileConfig(industryProfile);

  const machineObj = (machines || []).find(m => m.id === currentTicket.machineId) || null;
  const geo = resolveMachineGeoLocation(
    machineObj || {
      regionId: currentTicket.regionId,
      regionName: currentTicket.regionName,
      address: currentTicket.address,
    },
    regions,
    mapSettings
  );
  const navUrl = buildGoogleMapsNavigationUrl(geo);
  const gpsCheckInStr = formatGpsCheckIn(currentTicket.completedGps);
  const fGasSummaryStr = formatFGasSummary(currentTicket.fGasProtocol);
  const co2Info = calculateCo2Equivalent(
    currentTicket.fGasProtocol?.refrigerantType || machineObj?.refrigerantType,
    currentTicket.fGasProtocol?.refrigerantChargeKg || machineObj?.refrigerantChargeKg
  );
  const ckobLabel = getCkobCategoryLabel(machineObj?.inspectionCategory);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Pasek profilu branżowego Karty Awarii */}
      <div
        data-testid="ticket-profile-banner"
        className={`px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${profileConfig.bannerClass}`}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wide">
          <i className={`ph ${profileConfig.icon} text-base sm:text-lg`}></i>
          <span>{profileConfig.ticketCardTitle}</span>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-white/15 text-white border border-white/20">
          {profileConfig.shortName}
        </span>
      </div>

      <div className="p-6 sm:p-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 border-t border-gray-100 pt-6">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {profileConfig.machineLabel}
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
              <span className="text-xs font-semibold text-gray-400 mr-0.5">
                {profileConfig.regionLabel}:
              </span>
              {safe(currentTicket.regionName, t('tickets.details.no_region'))}{' '}
              {currentTicket.bay ? ` / ${profileConfig.bayLabel}: ${safe(currentTicket.bay)}` : ''}
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
                    {industryProfile === 'facility' ? 'Lokator / Zarządca' : 'Klient'}:{' '}
                    {machineObj.contactPerson || '-'}{' '}
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
                  <div className="text-slate-600">
                    {industryProfile === 'facility' ? 'Kod domofonu / Dostęp' : 'Dostęp'}:{' '}
                    {machineObj.accessNotes}
                  </div>
                )}
              </div>
            )}
            <div className="text-gray-400 text-xs font-mono mt-1">
              ID: {safe(currentTicket.machineId)}
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
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

        {/* DEDYKOWANA SEKCJA BRANŻOWA NA KARCIE AWARII (INDUSTRIAL / FACILITY / HVAC) */}
        {industryProfile === 'industrial' && (
          <div
            data-testid="ticket-domain-industrial"
            className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 rounded-xl p-4 border"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              <i className="ph ph-factory text-slate-700 text-base"></i>
              <span>Parametry Utrzymania Ruchu i Produkcji (UR)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">
                  Status ruchu maszyny
                </span>
                <span
                  className={`font-extrabold mt-0.5 block ${
                    currentTicket.isCritical ? 'text-red-600' : 'text-amber-700'
                  }`}
                >
                  {currentTicket.isCritical
                    ? 'POSTÓJ AWARYJNY (STOP)'
                    : 'PRACA Z OGRANICZENIEM'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">
                  Licznik motogodzin (RBG)
                </span>
                <span className="font-extrabold text-slate-800 mt-0.5 block">
                  {machineObj?.operatingHours ?? 0} RBG
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">
                  Zespół / Dział UR
                </span>
                <span className="font-extrabold text-slate-800 mt-0.5 block">
                  {currentTicket.assignedTo || machineObj?.category || 'Dyspozytornia UR'}
                </span>
              </div>
            </div>
          </div>
        )}

        {industryProfile === 'facility' && (
          <div
            data-testid="ticket-domain-facility"
            className="mt-4 pt-4 border-t border-amber-200 bg-amber-50/50 rounded-xl p-4 border"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider mb-3">
              <i className="ph ph-buildings text-amber-700 text-base"></i>
              <span>Karta Nieruchomości / Osiedla (Facility Management & c-KOB)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                  Kategoria c-KOB (art. 62 PB)
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {ckobLabel || 'Instalacja / Część wspólna budynku'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                  Lokator / Administrator
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {machineObj?.contactPerson || currentTicket.reportedBy || '-'}
                  {(machineObj?.contactPhone || currentTicket.reporterPhone) &&
                    ` · tel. ${machineObj?.contactPhone || currentTicket.reporterPhone}`}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                  Kod domofonu / Dostęp do lokalu
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {machineObj?.accessNotes || 'Dostęp wg książki administracyjnej obiektu'}
                </span>
              </div>
            </div>
          </div>
        )}

        {industryProfile === 'hvac' && (
          <div
            data-testid="ticket-domain-hvac"
            className="mt-4 pt-4 border-t border-cyan-200 bg-cyan-50/50 rounded-xl p-4 border"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-900 uppercase tracking-wider mb-3">
              <i className="ph ph-snowflake text-cyan-700 text-base"></i>
              <span>Karta Układu Chłodniczego / HVAC (Rozp. F-Gaz UE 2024/573 & CRO)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                  Czynnik chłodniczy i napełnienie
                </span>
                <span className="font-extrabold text-slate-800 mt-0.5 block">
                  {co2Info.refrigerantType
                    ? `${co2Info.refrigerantType} (${co2Info.chargeKg} kg · GWP ${co2Info.gwp})`
                    : 'Brak danych w karcie (uzupełnij w Kroku 4)'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                  Ekwiwalent CO2e / Obowiązek CRO
                </span>
                <span
                  className={`font-extrabold mt-0.5 block ${
                    co2Info.requiresCroCard ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {co2Info.co2EquivalentTons > 0
                    ? `${co2Info.co2EquivalentTons} t CO2e — ${
                        co2Info.requiresCroCard
                          ? 'WYMAGANA KARTA CRO (≥ 5 t CO2e)'
                          : 'Poniżej progu CRO'
                      }`
                    : '0.000 t CO2e'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                  Klient / Adres instalacji
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {machineObj?.contactPerson || currentTicket.reportedBy || '-'}
                  {geo.address ? ` · ${geo.address}` : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
