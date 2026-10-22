import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useManagerStore } from '../../store/managerStore';
import { addMachine, updateMachine } from '../../services/machines.service';
import {
  REFRIGERANT_TYPES,
  CKOB_CATEGORIES,
  calculateCo2Equivalent,
} from '../../utils/fieldServiceHelpers';

export function formatPhoneXxx(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

export default function MachineForm({
  isOpen,
  onClose,
  editingMachine,
  initialParentId,
  regions,
  onSaved,
  onError,
}) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [bay, setBay] = useState('');
  const [regionId, setRegionId] = useState('');
  const [internalId, setInternalId] = useState('');
  const [parentId, setParentId] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');

  // Pola opcjonalne pod Field Service (HVAC / F-Gazy) oraz Facility Management (c-KOB / Klient) — lokalizacja ustawiana jest podczas edycji mapy
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [inspectionCategory, setInspectionCategory] = useState('');
  const [refrigerantType, setRefrigerantType] = useState('');
  const [refrigerantChargeKg, setRefrigerantChargeKg] = useState('');
  // Metryczka obiektu budowlanego wg art. 60j ust. 3 Prawa budowlanego (c-KOB)
  const [buildingType, setBuildingType] = useState('');
  const [constructionYear, setConstructionYear] = useState('');
  const [usableAreaM2, setUsableAreaM2] = useState('');
  const [cubatureM3, setCubatureM3] = useState('');
  const [floorsCount, setFloorsCount] = useState('');
  const [hasAsbestos, setHasAsbestos] = useState('Brak');
  const [pinbAuthority, setPinbAuthority] = useState('');
  const [legalTitleDoc, setLegalTitleDoc] = useState('');
  const [showExtendedFields, setShowExtendedFields] = useState(false);

  const [loading, setLoading] = useState(false);
  const limits = useManagerStore(state => state.limits);
  const machines = useManagerStore(state => state.machines);
  const branding = useManagerStore(state => state.branding);
  const industryProfile = branding?.industryProfile || 'industrial';

  useEffect(() => {
    if (editingMachine) {
      setName(editingMachine.name || '');
      setBay(editingMachine.bay || '');
      setRegionId(editingMachine.regionId || '');
      setInternalId(editingMachine.internalId || '');
      setParentId(editingMachine.parentId || '');
      setAdditionalDescription(editingMachine.additionalDescription || '');
      setContactPerson(editingMachine.contactPerson || '');
      setContactPhone(formatPhoneXxx(editingMachine.contactPhone || ''));
      setAccessNotes(editingMachine.accessNotes || '');
      setInspectionCategory(editingMachine.inspectionCategory || '');
      setRefrigerantType(editingMachine.refrigerantType || '');
      setRefrigerantChargeKg(
        editingMachine.refrigerantChargeKg !== undefined &&
          editingMachine.refrigerantChargeKg !== null
          ? String(editingMachine.refrigerantChargeKg)
          : ''
      );
      setBuildingType(editingMachine.buildingType || '');
      setConstructionYear(
        editingMachine.constructionYear !== undefined && editingMachine.constructionYear !== null
          ? String(editingMachine.constructionYear)
          : ''
      );
      setUsableAreaM2(
        editingMachine.usableAreaM2 !== undefined && editingMachine.usableAreaM2 !== null
          ? String(editingMachine.usableAreaM2)
          : ''
      );
      setCubatureM3(
        editingMachine.cubatureM3 !== undefined && editingMachine.cubatureM3 !== null
          ? String(editingMachine.cubatureM3)
          : ''
      );
      setFloorsCount(
        editingMachine.floorsCount !== undefined && editingMachine.floorsCount !== null
          ? String(editingMachine.floorsCount)
          : ''
      );
      setHasAsbestos(
        editingMachine.hasAsbestos === true || editingMachine.hasAsbestos === 'Występuje'
          ? 'Występuje'
          : 'Brak'
      );
      setPinbAuthority(editingMachine.pinbAuthority || '');
      setLegalTitleDoc(editingMachine.legalTitleDoc || '');
      setShowExtendedFields(
        industryProfile === 'hvac' ||
          industryProfile === 'facility' ||
          Boolean(
            editingMachine.contactPerson ||
              editingMachine.contactPhone ||
              editingMachine.accessNotes ||
              editingMachine.inspectionCategory ||
              editingMachine.refrigerantType ||
              editingMachine.buildingType ||
              editingMachine.pinbAuthority
          )
      );
    } else {
      setName('');
      setInternalId('');
      setAdditionalDescription('');
      setContactPerson('');
      setContactPhone('');
      setAccessNotes('');
      setInspectionCategory('');
      setRefrigerantType('');
      setRefrigerantChargeKg('');
      setBuildingType('');
      setConstructionYear('');
      setUsableAreaM2('');
      setCubatureM3('');
      setFloorsCount('');
      setHasAsbestos('Brak');
      setPinbAuthority('');
      setLegalTitleDoc('');

      if (initialParentId) {
        setParentId(initialParentId);
        const pm = machines.find(m => m.id === initialParentId);
        if (pm) {
          setRegionId(pm.regionId || '');
          setBay(pm.bay || '');
        } else {
          setRegionId('');
          setBay('');
        }
      } else {
        setParentId('');
        setRegionId('');
        setBay('');
      }
      setShowExtendedFields(industryProfile === 'hvac' || industryProfile === 'facility');
    }
  }, [editingMachine, isOpen, initialParentId, machines, industryProfile]);

  const fGasCalc = useMemo(
    () => calculateCo2Equivalent(refrigerantType, refrigerantChargeKg),
    [refrigerantType, refrigerantChargeKg]
  );

  if (!isOpen) return null;

  const handleParentChange = e => {
    const val = e.target.value;
    setParentId(val);
    if (val && !editingMachine) {
      const pm = machines.find(m => m.id === val);
      if (pm) {
        if (pm.regionId) setRegionId(pm.regionId);
        if (pm.bay) setBay(pm.bay);
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const machinesList = useManagerStore.getState().machines || [];
    if (!editingMachine && limits && machinesList.length >= (limits.maxMachines || 50)) {
      alert(t('machines.form.limitReached') + (limits.maxMachines || 50) + ').');
      return;
    }
    if (!name.trim() || !regionId) return;
    setLoading(true);

    const allowCkob = industryProfile === 'facility';
    const allowFGas =
      industryProfile === 'hvac' ||
      (industryProfile === 'facility' && inspectionCategory === 'hvac_kotlownia');
    const allowContact = industryProfile === 'facility' || industryProfile === 'hvac';

    const effectiveRefType = allowFGas ? refrigerantType || '' : '';
    const extraPayload = {
      contactPerson: allowContact ? contactPerson.trim() : '',
      contactPhone: allowContact ? formatPhoneXxx(contactPhone) : '',
      accessNotes: allowContact ? accessNotes.trim() : '',
      inspectionCategory: allowCkob ? inspectionCategory || '' : '',
      buildingType: allowCkob ? buildingType.trim() : '',
      constructionYear: allowCkob ? constructionYear.trim() : '',
      usableAreaM2:
        allowCkob && usableAreaM2 !== '' && !isNaN(Number(usableAreaM2))
          ? Number(usableAreaM2)
          : '',
      cubatureM3:
        allowCkob && cubatureM3 !== '' && !isNaN(Number(cubatureM3))
          ? Number(cubatureM3)
          : '',
      floorsCount:
        allowCkob && floorsCount !== '' && !isNaN(Number(floorsCount))
          ? Number(floorsCount)
          : '',
      hasAsbestos: allowCkob ? hasAsbestos || 'Brak' : 'Brak',
      pinbAuthority: allowCkob ? pinbAuthority.trim() : '',
      legalTitleDoc: allowCkob ? legalTitleDoc.trim() : '',
      refrigerantType: effectiveRefType,
      refrigerantChargeKg:
        effectiveRefType && refrigerantChargeKg !== '' && Number(refrigerantChargeKg) > 0
          ? Number(refrigerantChargeKg)
          : null,
      co2EquivalentTons:
        effectiveRefType && fGasCalc.co2EquivalentTons > 0 ? fGasCalc.co2EquivalentTons : null,
      requiresCroCard: effectiveRefType ? fGasCalc.requiresCroCard : false,
    };

    try {
      if (editingMachine) {
        let n = name.trim();
        if (n.includes('(DO WERYFIKACJI)')) {
          n = n.replace('(DO WERYFIKACJI)', '').trim();
        }
        await updateMachine(editingMachine.id, {
          name: n,
          bay: bay.trim(),
          regionId,
          internalId: internalId.trim(),
          parentId: parentId || null,
          additionalDescription: additionalDescription.trim(),
          ...extraPayload,
          qrCreatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onSaved(t('machines.toasts.machineUpdated'));
      } else {
        const res = await addMachine({
          name: name.trim(),
          bay: bay.trim(),
          regionId,
          internalId: internalId.trim(),
          parentId: parentId || null,
          additionalDescription: additionalDescription.trim(),
          ...extraPayload,
          isDeleted: false,
          currentWorkHours: 0,
        });
        onSaved(t('machines.toasts.machineAdded'), res.id);
      }
      onClose();
    } catch (err) {
      onError(t('machines.toasts.error') + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
            {editingMachine
              ? t('machines.form.editMachine', 'Edytuj dane urządzenia')
              : t('machines.form.addMachine', 'Dodaj nowe urządzenie i wygeneruj kod QR')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200"
          >
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('machines.form.machineName', 'Nazwa urządzenia *')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none font-medium focus:ring-2 focus:ring-blue-500"
                placeholder={t('machines.form.machineNamePlaceholder', 'np. Klimatyzator Split / Pompa / Suwnica')}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('machines.form.region', 'Miejsce montażu *')}
                </label>
                <select
                  value={regionId}
                  onChange={e => setRegionId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('machines.form.selectRegion', '-- Wybierz miejsce montażu --')}</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('machines.form.bay', 'Informacja dodatkowa')}
                </label>
                <input
                  type="text"
                  value={bay}
                  onChange={e => setBay(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('machines.form.bayPlaceholder', 'np. Piętro 2, Pokój 204 / Przelot B')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('machines.form.internalIdLabel', 'Numer wew.')}
                </label>
                <input
                  type="text"
                  value={internalId}
                  onChange={e => setInternalId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('machines.form.internalIdPlaceholder', 'np. UR-2024-001')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('machines.form.parentMachine', 'Urządzenia nadrzędna (Opcjonalnie)')}
              </label>
              <select
                value={parentId}
                onChange={handleParentChange}
                className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
              >
                <option value="">{t('machines.form.noParent', '-- Brak (Urządzenie główne) --')}</option>
                {machines
                  .filter(m => m.id !== (editingMachine ? editingMachine.id : null))
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('machines.form.additionalDescription', 'Dodatkowy opis (Opcjonalnie)')}
              </label>
              <textarea
                value={additionalDescription}
                onChange={e => setAdditionalDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded outline-none resize-y min-h-[80px]"
                placeholder={t('machines.form.additionalDescriptionPlaceholder', 'Dodatkowy opis urządzenia, wskazówki serwisowe...')}
              ></textarea>
              <p className="text-xs text-gray-400 mt-1">
                {t('machines.form.additionalDescriptionHint')}
              </p>
            </div>

            {/* Sekcja branżowa (wyłącznie dla profili Facility / c-KOB oraz HVAC / F-Gazy — zablokowana dla Przemysłu / Stoczni) */}
            {industryProfile !== 'industrial' && (
              <div
                data-testid="machine-form-domain-section"
                className={`border rounded-xl overflow-hidden ${
                  industryProfile === 'hvac'
                    ? 'border-cyan-200 bg-cyan-50/40'
                    : 'border-amber-200 bg-amber-50/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowExtendedFields(prev => !prev)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <i
                      className={`ph ${
                        industryProfile === 'hvac'
                          ? 'ph-snowflake text-cyan-600'
                          : 'ph-buildings text-amber-700'
                      } text-lg`}
                    ></i>
                    <span className="text-sm font-bold text-slate-800">
                      {industryProfile === 'hvac'
                        ? t(
                            'machines.form.hvacSectionTitle',
                            'Parametry Chłodnicze HVAC / Pompy Ciepła (F-Gazy UE 2024/573 & CRO) oraz Dane Klienta'
                          )
                        : t(
                            'machines.form.facilitySectionTitle',
                            'Dane Obiektu / Lokalu oraz Kategoria Przeglądu c-KOB (art. 62 Prawa budowlanego)'
                          )}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    {showExtendedFields ? 'Zwiń' : 'Rozwiń opcje'}
                    <i className={`ph ${showExtendedFields ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
                  </span>
                </button>

                {showExtendedFields && (
                  <div className="p-4 pt-3 border-t border-slate-200/70 space-y-4 bg-white">
                    {industryProfile === 'facility' && (
                      <div data-testid="machine-form-ckob-section" className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Kategoria obiektu / przeglądu (c-KOB / Prawo budowlane)
                          </label>
                          <select
                            value={inspectionCategory}
                            onChange={e => setInspectionCategory(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {CKOB_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Metryczka obiektu budowlanego (c-KOB art. 60j ust. 3 PB) */}
                        <div
                          data-testid="machine-form-ckob-metric-section"
                          className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-3"
                        >
                          <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <i className="ph ph-identification-card text-base text-amber-700"></i>
                            Metryczka obiektu budowlanego (c-KOB art. 60j)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Rodzaj i funkcja obiektu
                              </label>
                              <input
                                type="text"
                                data-testid="ckob-building-type-input"
                                value={buildingType}
                                onChange={e => setBuildingType(e.target.value)}
                                placeholder="np. Budynek mieszkalny wielorodzinny / Hala / Biurowiec"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Rok oddania do użytkowania
                              </label>
                              <input
                                type="text"
                                data-testid="ckob-construction-year-input"
                                value={constructionYear}
                                onChange={e => setConstructionYear(e.target.value)}
                                placeholder="np. 2012"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Liczba kondygnacji
                              </label>
                              <input
                                type="number"
                                min="0"
                                data-testid="ckob-floors-count-input"
                                value={floorsCount}
                                onChange={e => setFloorsCount(e.target.value)}
                                placeholder="np. 5"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Powierzchnia użytkowa (m²)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                data-testid="ckob-usable-area-input"
                                value={usableAreaM2}
                                onChange={e => setUsableAreaM2(e.target.value)}
                                placeholder="np. 2450"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Kubatura (m³)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                data-testid="ckob-cubature-input"
                                value={cubatureM3}
                                onChange={e => setCubatureM3(e.target.value)}
                                placeholder="np. 8200"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Wyroby zawierające azbest
                              </label>
                              <select
                                data-testid="ckob-asbestos-select"
                                value={hasAsbestos}
                                onChange={e => setHasAsbestos(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="Brak">Brak</option>
                                <option value="Występuje">Występuje</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Właściwy organ nadzoru (PINB)
                              </label>
                              <input
                                type="text"
                                data-testid="ckob-pinb-input"
                                value={pinbAuthority}
                                onChange={e => setPinbAuthority(e.target.value)}
                                placeholder="np. PINB w Gdyni"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Dokument tytułu prawnego / Księga Wieczysta
                              </label>
                              <input
                                type="text"
                                data-testid="ckob-legal-title-input"
                                value={legalTitleDoc}
                                onChange={e => setLegalTitleDoc(e.target.value)}
                                placeholder="np. KW GD1Y/00012345/6 - własność / zarząd powierzony art. 18 UWL"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {industryProfile === 'facility'
                            ? 'Lokator / Zarządca / Osoba kontaktowa'
                            : 'Klient / Właściciel / Osoba kontaktowa'}
                        </label>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={e => setContactPerson(e.target.value)}
                          placeholder={
                            industryProfile === 'facility'
                              ? 'np. Wspólnota Mieszkaniowa / Administracja'
                              : 'np. Jan Kowalski'
                          }
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Telefon kontaktowy (xxx xxx xxx)
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          maxLength={11}
                          onChange={e => setContactPhone(formatPhoneXxx(e.target.value))}
                          placeholder="xxx xxx xxx (np. 500 600 700)"
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {industryProfile === 'facility'
                            ? 'Dostęp / Kod domofonu / Klatka'
                            : 'Dostęp / Wskazówki dla serwisanta'}
                        </label>
                        <input
                          type="text"
                          value={accessNotes}
                          onChange={e => setAccessNotes(e.target.value)}
                          placeholder={
                            industryProfile === 'facility'
                              ? 'np. Kod: 12#3456, klucz w administracji'
                              : 'np. Brama wjazdowa od ul. Leśnej'
                          }
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* HVAC / F-Gazy (Rozporządzenie UE 2024/573 & CRO) — widoczne dla HVAC lub węzłów cieplnych w Facility */}
                    {(industryProfile === 'hvac' ||
                      (industryProfile === 'facility' &&
                        inspectionCategory === 'hvac_kotlownia')) && (
                      <div
                        data-testid="machine-form-fgas-section"
                        className="pt-2 border-t border-slate-100"
                      >
                        <div className="text-xs font-extrabold text-cyan-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i className="ph ph-snowflake text-base text-cyan-600"></i>
                          Parametry chłodnicze HVAC / Pompy Ciepła (F-Gazy UE 2024/573 & CRO)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Rodzaj czynnika chłodniczego
                            </label>
                            <select
                              value={refrigerantType}
                              onChange={e => setRefrigerantType(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="">-- Brak (Nie dotyczy) --</option>
                              {Object.values(REFRIGERANT_TYPES).map(rt => (
                                <option key={rt.code} value={rt.code}>
                                  {rt.name} (GWP: {rt.gwp})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Masa fabryczna czynnika (kg)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={!refrigerantType}
                              value={refrigerantChargeKg}
                              onChange={e => setRefrigerantChargeKg(e.target.value)}
                              placeholder="np. 2.5"
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100"
                            />
                          </div>
                          <div>
                            {refrigerantType && fGasCalc.chargeKg > 0 ? (
                              <div
                                className={`p-2 rounded-lg border text-xs font-bold ${
                                  fGasCalc.requiresCroCard
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                }`}
                              >
                                <div>Ekwiwalent: {fGasCalc.co2EquivalentTons} t CO2e</div>
                                <div className="text-[11px] font-medium">
                                  {fGasCalc.requiresCroCard
                                    ? `Wymagana karta CRO! (Próby co ${fGasCalc.recommendedLeakCheckMonths} mies.)`
                                    : 'Poniżej progu 5 t CO2e (brak wymogu CRO)'}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
                                Wybierz czynnik i wagę, aby obliczyć ekwiwalent CO2e.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {editingMachine && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-yellow-800 text-sm">
                <p className="font-bold">
                  <i className="ph ph-warning-circle mr-1"></i> {t('machines.form.qrWarningTitle')}
                </p>
                <p>
                  {t('machines.form.qrWarningText')}
                  <strong>{t('machines.form.newQr')}</strong>!
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-100 text-gray-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('machines.buttons.cancel')}
              </button>
              <button
                disabled={loading}
                type="submit"
                className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 min-w-[150px] shadow-sm"
              >
                {loading ? (
                  <i className="ph ph-spinner animate-spin"></i>
                ) : (
                  <i className="ph ph-check font-bold"></i>
                )}
                {editingMachine
                  ? t('machines.buttons.saveChanges')
                  : t('machines.buttons.addMachineBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

MachineForm.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  editingMachine: PropTypes.object,
  initialParentId: PropTypes.string,
  regions: PropTypes.array.isRequired,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
};
