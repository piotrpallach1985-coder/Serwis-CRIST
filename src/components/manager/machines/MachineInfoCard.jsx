import React from 'react';
import { useTranslation } from 'react-i18next';
import { safeParseDate } from '../../../utils/dateHelpers';
import { useManagerStore } from '../../../store/managerStore';
import {
  resolveMachineGeoLocation,
  buildGoogleMapsNavigationUrl,
  calculateCo2Equivalent,
  getCkobCategoryLabel,
  getIndustryProfileConfig,
} from '../../../utils/fieldServiceHelpers';

export default function MachineInfoCard({
  machine,
  parentMachine,
  childMachines,
  regions,
  regionName,
  totalPartsCost,
  setIsWorkHoursModalOpen,
  onViewRelatedMachine,
  onAddChildMachine,
  parts,
}) {
  const { t } = useTranslation();
  const mapSettings = useManagerStore(state => state.mapSettings);
  const branding = useManagerStore(state => state.branding || {});
  const industryProfile = branding?.industryProfile || 'industrial';
  const profileConfig = getIndustryProfileConfig(industryProfile);

  const geo = resolveMachineGeoLocation(machine, regions, mapSettings);
  const navUrl = buildGoogleMapsNavigationUrl(geo);

  const showCkob = industryProfile === 'facility';
  const showFGas =
    industryProfile === 'hvac' ||
    (industryProfile === 'facility' && machine?.inspectionCategory === 'hvac_kotlownia');
  const showContact = industryProfile === 'facility' || industryProfile === 'hvac';

  const fGasCalc =
    showFGas && machine?.refrigerantType
      ? calculateCo2Equivalent(machine.refrigerantType, machine.refrigerantChargeKg)
      : null;
  const ckobLabel = showCkob ? getCkobCategoryLabel(machine?.inspectionCategory) : '';
  const hasCkobMetricData = Boolean(
    machine?.buildingType ||
      machine?.constructionYear ||
      machine?.usableAreaM2 ||
      machine?.cubatureM3 ||
      machine?.floorsCount ||
      (machine?.hasAsbestos && machine?.hasAsbestos !== 'Brak') ||
      machine?.pinbAuthority ||
      machine?.legalTitleDoc
  );
  const showCkobMetricFrame =
    industryProfile !== 'industrial' && (industryProfile === 'facility' || hasCkobMetricData);

  const hasExtendedInfo = Boolean(
    geo.hasAddress ||
      (showContact &&
        (machine?.contactPerson || machine?.contactPhone || machine?.accessNotes)) ||
      ckobLabel ||
      showCkobMetricFrame ||
      (fGasCalc && fGasCalc.refrigerantType)
  );

  return (
    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div
        data-testid="machine-profile-banner"
        className={`px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${profileConfig.bannerClass}`}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wide">
          <i className={`ph ${profileConfig.icon} text-base sm:text-lg`}></i>
          <span>{profileConfig.machineCardTitle}</span>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-white/15 text-white border border-white/20">
          {profileConfig.shortName}
        </span>
      </div>
      <div className="p-4 md:p-6 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shrink-0">
            <i className="ph ph-engine"></i>
          </div>
          <div className="min-w-0">
            {parentMachine && (
              <div
                onClick={() => onViewRelatedMachine && onViewRelatedMachine(parentMachine)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-0.5 cursor-pointer hover:text-blue-800 hover:underline w-fit"
              >
                <i className="ph ph-arrow-u-up-left"></i> {t('machines.details.parentMachine')}
                {parentMachine.name}
              </div>
            )}
            <h1 className="text-2xl font-black text-gray-900 break-words">{machine.name}</h1>
            <div className="text-gray-400 font-mono text-sm">
              {t('machines.details.id')}
              {machine.id}
            </div>
          </div>
        </div>

        {navUrl && (
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="machine-navigate-gps-btn"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm transition-colors shrink-0"
            title="Otwórz nawigację Google Maps do lokalizacji urządzenia"
          >
            <i className="ph ph-navigation-arrow text-base"></i>
            <span>{t('machines.details.navigateGps', 'Nawiguj GPS')}</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">
            {t('machines.details.regionLabel')}
          </div>
          <div className="font-semibold text-gray-800 text-base">{regionName}</div>
          {regions.find(r => r.id === machine.regionId)?.mapImageUrl && (
            <a
              href={regions.find(r => r.id === machine.regionId).mapImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs flex items-center gap-1 hover:underline mt-0.5"
            >
              <i className="ph ph-map-trifold"></i> {t('machines.details.submap')}
            </a>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">
            {t('machines.details.internalIdLabel')}
          </div>
          <div className="font-semibold text-gray-800 text-base">{machine.internalId || '-'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">
            {t('machines.details.workHoursLabel')}
          </div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-800 text-base">
              {machine.currentWorkHours ?? machine.operatingHours ?? 0} {t('machines.details.rbg')}
            </div>
            <button
              onClick={() => setIsWorkHoursModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors"
              title={`Aktualizuj ${t('machines.details.rbg')}`}
            >
              <i className="ph ph-pencil-simple"></i>
            </button>
          </div>
          {machine.workHoursHistory && machine.workHoursHistory.length > 0 && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              {t('machines.details.lastUpdate')}
              {safeParseDate(
                [...machine.workHoursHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                  .date
              )?.toLocaleDateString('pl-PL')}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">
            {t('machines.details.additionalDescriptionLabel')}
          </div>
          <div className="font-semibold text-gray-800 text-sm max-w-full break-words">
            {machine.additionalDescription || '-'}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0">
            {t('machines.details.partsCostLabel')}
          </div>
          <div className="font-semibold text-red-600 text-base">
            {totalPartsCost.toFixed(2)} {t('machines.details.pln')}
          </div>
        </div>
      </div>

      {/* DANE BRANŻOWE: ADRES GPS, KLIENT, c-KOB, F-GAZY (HVAC) — w Przemysł/Stocznia (industrial) c-KOB i F-Gazy są zablokowane */}
      {hasExtendedInfo && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
          {(geo.hasAddress ||
            (showContact &&
              (machine.contactPerson || machine.contactPhone || machine.accessNotes))) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {geo.hasAddress && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Adres obiektu / lokalizacji
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <i className="ph ph-map-pin text-emerald-600"></i> {geo.address}
                  </span>
                </div>
              )}
              {showContact && (machine.contactPerson || machine.contactPhone) && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    {industryProfile === 'facility'
                      ? 'Lokator / Zarządca'
                      : 'Klient / Osoba kontaktowa'}
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    {machine.contactPerson && <span>{machine.contactPerson}</span>}
                    {machine.contactPhone && (
                      <a
                        href={`tel:${machine.contactPhone.replace(/\s+/g, '')}`}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <i className="ph ph-phone"></i> {machine.contactPhone}
                      </a>
                    )}
                  </span>
                </div>
              )}
              {showContact && machine.accessNotes && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    {industryProfile === 'facility'
                      ? 'Dostęp / Domofon / Klucze'
                      : 'Dostęp / Wskazówki'}
                  </span>
                  <span className="font-semibold text-slate-700">{machine.accessNotes}</span>
                </div>
              )}
            </div>
          )}

          {ckobLabel && (
            <div
              data-testid="machine-ckob-badge"
              className="bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-amber-900"
            >
              <i className="ph ph-buildings text-base text-amber-700 shrink-0"></i>
              <div>
                <span className="font-bold">Kategoria c-KOB / Przeglądu: </span>
                <span>{ckobLabel}</span>
              </div>
            </div>
          )}

          {showCkobMetricFrame && (
            <div
              data-testid="machine-ckob-metric-card"
              className="bg-amber-50/40 border border-amber-200 rounded-xl p-3 text-xs space-y-2"
            >
              <div className="font-extrabold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-amber-200/70 pb-1.5">
                <i className="ph ph-identification-card text-amber-700 text-base"></i>
                Metryczka obiektu budowlanego (c-KOB art. 60j ust. 3 PB)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Rodzaj i funkcja obiektu
                  </span>
                  <span className="font-bold">{machine?.buildingType || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Rok oddania
                  </span>
                  <span className="font-bold">{machine?.constructionYear || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Kondygnacje
                  </span>
                  <span className="font-bold">{machine?.floorsCount || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Pow. użytkowa
                  </span>
                  <span className="font-bold">
                    {machine?.usableAreaM2 ? `${machine.usableAreaM2} m²` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Kubatura
                  </span>
                  <span className="font-bold">
                    {machine?.cubatureM3 ? `${machine.cubatureM3} m³` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Wyroby z azbestem
                  </span>
                  <span
                    className={`font-bold ${
                      machine?.hasAsbestos === 'Występuje' || machine?.hasAsbestos === true
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {machine?.hasAsbestos === true
                      ? 'Występuje'
                      : machine?.hasAsbestos || 'Brak'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Organ nadzoru (PINB)
                  </span>
                  <span className="font-bold">{machine?.pinbAuthority || '-'}</span>
                </div>
                {machine?.legalTitleDoc && (
                  <div className="col-span-2 sm:col-span-4 pt-1 border-t border-amber-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Dokument tytułu prawnego / Księga Wieczysta
                    </span>
                    <span className="font-semibold text-slate-700">{machine.legalTitleDoc}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {fGasCalc && fGasCalc.refrigerantType && (
            <div
              data-testid="machine-fgas-badge"
              className={`border rounded-xl px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 ${
                fGasCalc.requiresCroCard
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-cyan-50/70 border-cyan-200 text-cyan-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <i className="ph ph-snowflake text-base text-cyan-600 shrink-0"></i>
                <div>
                  <span className="font-bold">Czynnik F-Gaz: {fGasCalc.refrigerantType}</span>
                  {fGasCalc.chargeKg > 0 && (
                    <span>
                      {' '}
                      • {fGasCalc.chargeKg} kg •{' '}
                      <strong>{fGasCalc.co2EquivalentTons} t CO2e</strong>
                    </span>
                  )}
                </div>
              </div>
              {fGasCalc.requiresCroCard && (
                <span className="bg-amber-200/80 text-amber-950 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                  Wymagana Karta CRO (Próby co {fGasCalc.recommendedLeakCheckMonths} mies.)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {t('machines.details.childMachinesTitle')}
          </div>
          <button
            onClick={() => onAddChildMachine && onAddChildMachine(machine.id)}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <i className="ph ph-plus-circle"></i> {t('machines.buttons.add')}
          </button>
        </div>
        {childMachines.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {childMachines.map(child => (
              <li
                key={child.id}
                onClick={() => onViewRelatedMachine && onViewRelatedMachine(child)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 p-2 rounded border border-gray-100 cursor-pointer transition-colors"
              >
                <i className="ph ph-gear text-blue-500 text-lg"></i>
                {child.name}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-400 italic">
            {t('machines.details.noChildMachines')}
          </div>
        )}
      </div>

      {/* KOMPATYBILNE CZĘŚCI (BOM) */}
      {(() => {
        const compatibleParts = parts.filter(
          p => p.compatibleMachines && p.compatibleMachines.includes(machine.id)
        );
        if (compatibleParts.length === 0) return null;
        return (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {t('machines.details.bomTitle')}
            </div>
            <ul className="flex flex-col gap-2">
              {compatibleParts.map(part => (
                <li
                  key={part.id}
                  className="flex items-center justify-between text-sm font-semibold text-gray-700 bg-emerald-50/50 p-2 rounded border border-emerald-100"
                >
                  <div className="flex items-center gap-2">
                    <i className="ph ph-nut text-emerald-600 text-lg"></i>
                    <div>
                      <div className="text-gray-800">{part.name}</div>
                      {part.code && <div className="text-xs text-gray-500 font-mono">{part.code}</div>}
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200 text-gray-600">
                    {t('machines.details.stock')}
                    <span
                      className={
                        part.stock > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'
                      }
                    >
                      {part.stock} {part.unit || 'pcs.'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
      </div>
    </div>
  );
}
