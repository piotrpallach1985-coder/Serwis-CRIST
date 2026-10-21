import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { safeParseDate } from '../../utils/dateHelpers';
import { useManagerStore } from '../../store/managerStore';
import {
  resolveMachineGeoLocation,
  buildGoogleMapsNavigationUrl,
  formatGpsCheckIn,
  formatFGasSummary,
  getCkobCategoryLabel,
  getIndustryProfileConfig,
  calculateCo2Equivalent,
} from '../../utils/fieldServiceHelpers';

export default function PlannedMaintenanceInfo({
  srv,
  machine,
  parts,
  actualPartsUsed,
  getMachineRegionName,
  regions,
  section = 'all',
}) {
  const { t } = useTranslation();
  const branding = useManagerStore(state => state.branding || {});
  const mapSettings = useManagerStore(state => state.mapSettings);
  const industryProfile = branding?.industryProfile || 'industrial';
  const profileConfig = getIndustryProfileConfig(industryProfile);

  const showParams = section === 'all' || section === 'params';
  const showResources = section === 'all' || section === 'resources';
  const showChecklist = section === 'all' || section === 'checklist';

  const geo = resolveMachineGeoLocation(machine, regions, mapSettings);
  const navUrl = buildGoogleMapsNavigationUrl(geo);
  const ckobLabel = getCkobCategoryLabel(machine?.inspectionCategory);
  const completedGpsStr = formatGpsCheckIn(
    srv.completedGps || srv.completionDetails?.completedGps
  );
  const rawFGas =
    srv.fGasProtocol ||
    srv.completionDetails?.fGasProtocol ||
    (machine?.refrigerantType
      ? {
          refrigerantType: machine.refrigerantType,
          refrigerantChargeKg: machine.refrigerantChargeKg,
        }
      : null);
  const fGasSummaryStr = formatFGasSummary(rawFGas);
  const co2Info = calculateCo2Equivalent(
    rawFGas?.refrigerantType || machine?.refrigerantType,
    rawFGas?.refrigerantChargeKg || machine?.refrigerantChargeKg
  );
  const clientSignature =
    srv.clientSignature || srv.completionDetails?.clientSignature || null;
  const clientSignerName =
    srv.clientSignerName || srv.completionDetails?.clientSignerName || '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {showParams && (
        <div
          data-testid="service-profile-banner"
          className={`px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${profileConfig.bannerClass}`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wide">
            <i className={`ph ${profileConfig.icon} text-base sm:text-lg`}></i>
            <span>{profileConfig.serviceCardTitle}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-white/15 text-white border border-white/20">
            {profileConfig.shortName}
          </span>
        </div>
      )}
      <div className="p-4 sm:p-5 space-y-5">
        {showParams && (
          <div>
            {/* Nagłówek serwisu */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 sm:mb-5">
              <div>
                <h2 className="text-base sm:text-2xl font-black text-slate-800">{srv.name}</h2>
                <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <i className="ph ph-engine text-lg text-slate-400"></i>
                  <span className="text-xs font-semibold text-slate-400 normal-case">
                    {profileConfig.machineLabel}:
                  </span>
                  {machine?.name || (
                    <>
                      {srv.machineName || t('machines.unknownMachine', 'Nieznana maszyna')}{' '}
                      <span className="text-red-500 font-bold ml-1">
                        ({t('machines.deletedMachine', 'maszyna usunięta')})
                      </span>
                    </>
                  )}{' '}
                  ({profileConfig.regionLabel}: {getMachineRegionName(machine?.regionId)})
                  {(regions || []).find(r => r.id === machine?.regionId)?.mapImageUrl && (
                    <a
                      href={(regions || []).find(r => r.id === machine?.regionId).mapImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline ml-2 inline-flex items-center gap-1"
                    >
                      <i className="ph ph-map-trifold"></i> {t('map.submapLabel', 'Podmapa')}
                    </a>
                  )}
                </div>
                {geo.hasAddress && (
                  <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                    <i className="ph ph-map-pin"></i> {geo.address}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {navUrl && (
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="service-navigate-gps-btn"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    title="Otwórz nawigację Google Maps do lokalizacji serwisu"
                  >
                    <i className="ph ph-navigation-arrow"></i>{' '}
                    {t('machines.details.navigateGps', 'Nawiguj GPS')}
                  </a>
                )}
                {srv.priority === 'Krytyczny' ? (
                  <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-red-100 flex items-center gap-1 shadow-sm">
                    <i className="ph ph-warning"></i> {t('planned.priority.critical', 'KRYTYCZNY')}
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm">
                    {t('planned.priority.standard', 'Standard')}
                  </span>
                )}
              </div>
            </div>

            {/* Dane klienta / c-KOB / F-Gazy / Potwierdzenie GPS */}
            {(machine?.contactPerson ||
              machine?.contactPhone ||
              machine?.accessNotes ||
              ckobLabel ||
              fGasSummaryStr ||
              completedGpsStr) && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(machine?.contactPerson || machine?.contactPhone || machine?.accessNotes) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Klient / Dostęp do obiektu
                    </span>
                    <div className="font-bold text-slate-800">
                      {machine.contactPerson || '-'}{' '}
                      {machine.contactPhone && (
                        <a
                          href={`tel:${machine.contactPhone.replace(/\s+/g, '')}`}
                          className="text-blue-600 hover:underline ml-1"
                        >
                          ({machine.contactPhone})
                        </a>
                      )}
                    </div>
                    {machine.accessNotes && (
                      <div className="text-slate-600 mt-0.5">{machine.accessNotes}</div>
                    )}
                  </div>
                )}

                {(ckobLabel || fGasSummaryStr || completedGpsStr) && (
                  <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-2.5 space-y-1">
                    {ckobLabel && (
                      <div className="text-indigo-900 font-semibold">
                        <i className="ph ph-buildings mr-1"></i>
                        <strong>c-KOB:</strong> {ckobLabel}
                      </div>
                    )}
                    {fGasSummaryStr && (
                      <div className="text-cyan-900 font-semibold">
                        <i className="ph ph-snowflake mr-1"></i>
                        {fGasSummaryStr}
                      </div>
                    )}
                    {completedGpsStr && (
                      <div className="text-emerald-800 font-semibold">
                        <i className="ph ph-map-pin-line mr-1"></i>
                        <strong>Check-in GPS:</strong> {completedGpsStr}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Parametry */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <i className="ph ph-clock text-base"></i> {t('planned.info.trigger', 'Wyzwalacz')}
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {srv.triggerType === 'calendar'
                    ? t('planned.info.calendar', 'Kalendarz')
                    : srv.triggerType === 'hours'
                    ? 'RBG'
                    : t('planned.info.mixed', 'Mieszany')}
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <i className="ph ph-calendar-blank text-base"></i>{' '}
                  {t('planned.info.dueOrHours', 'Termin / RBG')}
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {srv.triggerType === 'calendar'
                    ? srv.nextDate
                      ? safeParseDate(srv.nextDate)?.toLocaleDateString() || '-'
                      : '-'
                    : srv.triggerType === 'hours'
                    ? srv.targetWorkHours
                      ? `${srv.targetWorkHours} rbg`
                      : '-'
                    : `${
                        srv.nextDate ? safeParseDate(srv.nextDate)?.toLocaleDateString() || '-' : '-'
                      } / ${srv.targetWorkHours ? srv.targetWorkHours + ' rbg' : '-'}`}
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <i className="ph ph-users text-base"></i> {t('planned.info.personnel', 'Personel')}
                </div>
                <div className="font-bold text-slate-800 text-sm">{srv.requiredPersonnel || '-'}</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <i className="ph ph-hourglass text-base"></i>{' '}
                  {t('planned.info.downtime', 'Przestój (h)')}
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {srv.estimatedDowntimeHours || 0} h
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <i className="ph ph-wrench text-base"></i>{' '}
                  {t('planned.info.machineStatus', 'Status maszyny')}
                </div>
                <div className="font-bold text-slate-800 text-sm">{srv.machineStatus || '-'}</div>
              </div>
            </div>

            {/* DEDYKOWANA SEKCJA BRANŻOWA NA KARCIE SERWISU (INDUSTRIAL / FACILITY / HVAC) */}
            {industryProfile === 'industrial' && (
              <div
                data-testid="service-domain-industrial"
                className="mt-4 bg-slate-50/90 border border-slate-200 rounded-xl p-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                  <i className="ph ph-factory text-slate-700 text-base"></i>
                  <span>Karta Techniczna Prewencji UR (Przemysł / Stocznia)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">
                      Licznik Maszyny (RBG)
                    </span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {machine?.operatingHours ?? 0} RBG
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">
                      Cykl odnawiania prewencji
                    </span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {srv.intervalDays ? `Co ${srv.intervalDays} dni` : ''}
                      {srv.intervalDays && srv.intervalHours ? ' / ' : ''}
                      {srv.intervalHours ? `Co ${srv.intervalHours} RBG` : ''}
                      {!srv.intervalDays && !srv.intervalHours ? 'Wg harmonogramu DTR' : ''}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">
                      Roboczogodziny UR (Wykonanie)
                    </span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {srv.manHours ?? srv.completionDetails?.manHours
                        ? `${srv.manHours ?? srv.completionDetails?.manHours} RBG`
                        : 'W trakcie rozliczania'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {industryProfile === 'facility' && (
              <div
                data-testid="service-domain-facility"
                className="mt-4 bg-amber-50/50 border border-amber-200 rounded-xl p-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider mb-2.5">
                  <i className="ph ph-buildings text-amber-700 text-base"></i>
                  <span>Protokół Przeglądu Okresowego Obiektu Budowlanego (c-KOB art. 62)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                    <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                      Kategoria Przeglądu c-KOB
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {ckobLabel || 'Przegląd okresowy instalacji budynku (art. 62 PB)'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                    <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                      Zarządca / Kontakt / Domofon
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {machine?.contactPerson || 'Administracja osiedla'}
                      {machine?.accessNotes ? ` · ${machine.accessNotes}` : ''}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200/80">
                    <span className="text-amber-700/70 font-bold uppercase block text-[10px]">
                      Orzeczenie techniczne c-KOB
                    </span>
                    <span className="font-extrabold text-emerald-700 mt-0.5 block">
                      {srv.status === 'completed'
                        ? 'DOPUSZCZONO DO EKSPLOATACJI'
                        : 'OCZEKUJE NA ODBIÓR INSPEKTORA'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {industryProfile === 'hvac' && (
              <div
                data-testid="service-domain-hvac"
                className="mt-4 bg-cyan-50/50 border border-cyan-200 rounded-xl p-3.5"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-900 uppercase tracking-wider mb-2.5">
                  <i className="ph ph-snowflake text-cyan-700 text-base"></i>
                  <span>Protokół Szczelności i Przeglądu HVAC / F-Gaz (Rozp. UE 2024/573 & CRO)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                    <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                      Czynnik chłodniczy i GWP
                    </span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      {co2Info.refrigerantType
                        ? `${co2Info.refrigerantType} (${co2Info.chargeKg} kg · GWP ${co2Info.gwp})`
                        : 'Uzupełnij w Kroku 4 (Podsumowanie)'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                    <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                      Ekwiwalent CO2e / Rejestr CRO
                    </span>
                    <span
                      className={`font-extrabold mt-0.5 block ${
                        co2Info.requiresCroCard ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {co2Info.co2EquivalentTons > 0
                        ? `${co2Info.co2EquivalentTons} t CO2e (${
                            co2Info.requiresCroCard ? 'Wymagana Karta CRO' : 'Poniżej 5 t CO2e'
                          })`
                        : '0.000 t CO2e'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80">
                    <span className="text-cyan-700/80 font-bold uppercase block text-[10px]">
                      Próba szczelności i bilans czynnika
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {fGasSummaryStr || 'Wykonać próbę szczelności przy zamknięciu serwisu'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {clientSignature && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <i className="ph ph-signature text-blue-600 text-base"></i>
                    {profileConfig.clientSignatureLabel}
                  </div>
                  {clientSignerName && (
                    <div className="text-slate-600 mt-0.5">
                      Podpisał(a): <strong>{clientSignerName}</strong>
                    </div>
                  )}
                </div>
                <img
                  src={clientSignature}
                  alt="Podpis odbierającego"
                  className="h-14 bg-white border border-slate-200 rounded px-2 py-1 object-contain"
                />
              </div>
            )}
          </div>
        )}

        {showResources && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <i className="ph ph-wrench text-xl text-slate-500"></i>{' '}
                {t('planned.info.requiredTools', 'Wymagane narzędzia')}
              </h3>
              <div className="text-sm text-slate-800">
                {srv.toolsType === 'Specjalne' ? (
                  <p>
                    <span className="font-bold">{t('planned.info.specialTools', 'Specjalne')}:</span>{' '}
                    {srv.specialTools || '-'}
                  </p>
                ) : srv.toolsType === 'Inne' ? (
                  <p>
                    <span className="font-bold">{t('planned.info.otherTools', 'Inne')}:</span>{' '}
                    {srv.otherTools || '-'}
                  </p>
                ) : (
                  <p className="font-bold">
                    {t('planned.info.basicTools', 'Podstawowe (skrzynka narzędziowa)')}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="ph ph-nut text-xl text-slate-500"></i>{' '}
                {t('planned.info.requiredParts', 'Wymagane części')}
              </h3>
              {srv.requiredParts && srv.requiredParts.length > 0 ? (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">
                    {t('planned.info.plannedUsage', 'PLANOWANE ZUŻYCIE')}
                  </h4>
                  <ul className="space-y-1.5">
                    {srv.requiredParts.map((part, idx) => {
                      const partUnit =
                        parts.find(p => p.id === part.partId)?.unit || part.unit || 'szt.';
                      return (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm bg-white p-2 border border-slate-100 rounded"
                        >
                          <span className="font-bold text-slate-800">{part.name || '-'}</span>
                          <div className="flex gap-4 text-xs text-slate-500 font-medium">
                            <span>
                              {t('planned.info.qty', 'Ilość')}: {part.quantity || 1} {partUnit}
                            </span>
                            <span>
                              {t('planned.info.plannedCost', 'Koszt plan.')}:{' '}
                              {part.unitCost ? (part.quantity * part.unitCost).toFixed(2) + ' PLN' : '-'}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic mb-2">
                  {t('planned.info.noPlannedParts', 'Brak zdefiniowanych części planowanych.')}
                </p>
              )}

              {actualPartsUsed && actualPartsUsed.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-blue-600 mb-2 mt-3 pt-3 border-t border-slate-200">
                    {t('planned.info.actuallyTaken', 'FAKTYCZNIE POBRANE')}
                  </h4>
                  <ul className="space-y-1.5">
                    {actualPartsUsed.map((tx, idx) => {
                      const foundPart = parts.find(p => p.id === tx.partId);
                      const pName = foundPart?.name || 'Nieznana część';
                      const pUnit = foundPart?.unit || tx.unit || 'szt.';
                      return (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-sm bg-blue-50/50 p-2 border border-blue-100 rounded"
                        >
                          <span className="font-bold text-slate-800">{pName}</span>
                          <div className="flex gap-4 text-xs text-slate-600 font-medium">
                            <span>
                              {t('planned.info.taken', 'Pobrano')}: {Math.abs(tx.quantity)} {pUnit} (
                              {tx.user || t('planned.system')})
                            </span>
                            <span>
                              {t('planned.info.cost', 'Koszt')}:{' '}
                              {tx.totalCost
                                ? tx.totalCost.toFixed(2) + ' PLN'
                                : (Math.abs(tx.quantity) * tx.price).toFixed(2) + ' PLN'}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {showChecklist && (
          <div className="bg-blue-50/40 p-2.5 sm:p-3 rounded-lg border border-blue-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="ph ph-list-checks text-lg text-blue-600"></i>{' '}
              {t('planned.info.workScope', 'Zakres prac do wykonania')}
            </h3>
            {srv.checklist && srv.checklist.length > 0 ? (
              <ul className="space-y-1">
                {srv.checklist.map((step, idx) => (
                  <li
                    key={step.id || idx}
                    className="flex items-center justify-between gap-2 text-xs text-slate-700 bg-white py-1.5 px-2.5 rounded-md border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800 break-words leading-snug">
                        {step.taskName || step.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                      <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {step.type === 'CHECKBOX'
                          ? t('planned.info.typeCheckbox', 'Checkbox')
                          : step.type === 'PHOTO'
                          ? t('planned.info.typePhoto', 'Zdjęcie')
                          : t('planned.info.typeValue', 'Pomiar')}
                      </span>
                      {step.isRequired && (
                        <span className="text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                          {t('planned.info.requiredBadge', 'Wymagane')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs sm:text-sm font-medium text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200 shadow-2xs text-center">
                {t('planned.info.dtrStandard', 'Przegląd według obowiązującego standardu DTR maszyny.')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

PlannedMaintenanceInfo.propTypes = {
  srv: PropTypes.object.isRequired,
  machine: PropTypes.object,
  parts: PropTypes.array,
  actualPartsUsed: PropTypes.array,
  getMachineRegionName: PropTypes.func,
  regions: PropTypes.array,
  section: PropTypes.oneOf(['all', 'params', 'resources', 'checklist']),
};
