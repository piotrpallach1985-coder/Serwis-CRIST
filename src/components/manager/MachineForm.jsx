import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useManagerStore } from '../../store/managerStore';
import { addMachine, updateMachine } from '../../services/machines.service';
import {
  REFRIGERANT_TYPES,
  CKOB_CATEGORIES,
  FUEL_TYPES,
  TIRE_SEASON_OPTIONS,
  TOWBAR_DMC_OPTIONS,
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

  // Pola Floty Samochodowej i Sprzętu Mobilnego (VexoNT Fleet & Hybrydowy Typ Zasobu)
  const [assetCategory, setAssetCategory] = useState('device'); // 'device' | 'vehicle'
  const [licensePlate, setLicensePlate] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [firstRegistrationDate, setFirstRegistrationDate] = useState('');
  const [initialCounterValue, setInitialCounterValue] = useState('');
  const [counterUnit, setCounterUnit] = useState('RBG'); // 'km' | 'RBG'
  const [fuelType, setFuelType] = useState('');
  const [techInspectionDate, setTechInspectionDate] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [productionYear, setProductionYear] = useState('');
  const [engineSpec, setEngineSpec] = useState('');
  const [tireSeason, setTireSeason] = useState('');
  const [tireSize, setTireSize] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [assistancePhone, setAssistancePhone] = useState('');
  const [hasTowbar, setHasTowbar] = useState('');
  const [ownershipType, setOwnershipType] = useState('');
  const [udtOrExtinguisherDate, setUdtOrExtinguisherDate] = useState('');

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

      const isExistingVehicle =
        editingMachine.assetCategory === 'vehicle' ||
        Boolean(
          editingMachine.licensePlate ||
            editingMachine.vinNumber ||
            editingMachine.techInspectionDate ||
            editingMachine.insuranceExpiryDate
        ) ||
        (industryProfile === 'fleet' && editingMachine.assetCategory !== 'device');

      setAssetCategory(isExistingVehicle ? 'vehicle' : 'device');
      setLicensePlate(editingMachine.licensePlate || '');
      setVinNumber(editingMachine.vinNumber || '');
      setFirstRegistrationDate(editingMachine.firstRegistrationDate || '');
      setInitialCounterValue(
        editingMachine.currentWorkHours !== undefined && editingMachine.currentWorkHours !== null
          ? String(editingMachine.currentWorkHours)
          : '0'
      );
      setCounterUnit(editingMachine.counterUnit || (isExistingVehicle ? 'km' : 'RBG'));
      setFuelType(editingMachine.fuelType || '');
      setTechInspectionDate(editingMachine.techInspectionDate || '');
      setInsuranceExpiryDate(editingMachine.insuranceExpiryDate || '');
      setAssignedDriver(editingMachine.assignedDriver || '');
      setProductionYear(
        editingMachine.productionYear !== undefined && editingMachine.productionYear !== null
          ? String(editingMachine.productionYear)
          : ''
      );
      setEngineSpec(editingMachine.engineSpec || '');
      setTireSeason(editingMachine.tireSeason || '');
      setTireSize(editingMachine.tireSize || '');
      setPolicyNumber(editingMachine.policyNumber || '');
      setAssistancePhone(editingMachine.assistancePhone || '');
      setHasTowbar(editingMachine.hasTowbar || '');
      setOwnershipType(editingMachine.ownershipType || '');
      setUdtOrExtinguisherDate(editingMachine.udtOrExtinguisherDate || '');

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
      const defaultIsVehicle = industryProfile === 'fleet';
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

      setAssetCategory(defaultIsVehicle ? 'vehicle' : 'device');
      setLicensePlate('');
      setVinNumber('');
      setFirstRegistrationDate('');
      setInitialCounterValue('');
      setCounterUnit(defaultIsVehicle ? 'km' : 'RBG');
      setFuelType('');
      setTechInspectionDate('');
      setInsuranceExpiryDate('');
      setAssignedDriver('');
      setProductionYear('');
      setEngineSpec('');
      setTireSeason('');
      setTireSize('');
      setPolicyNumber('');
      setAssistancePhone('');
      setHasTowbar('');
      setOwnershipType('');
      setUdtOrExtinguisherDate('');

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
    const allowContact =
      industryProfile === 'facility' ||
      industryProfile === 'hvac' ||
      industryProfile === 'fleet';
    const isVehicleSelected = assetCategory === 'vehicle';
    const parsedCounter =
      initialCounterValue !== '' &&
      !isNaN(Number(initialCounterValue)) &&
      Number(initialCounterValue) >= 0
        ? Number(initialCounterValue)
        : 0;

    const effectiveRefType = allowFGas ? refrigerantType || '' : '';
    const extraPayload = {
      assetCategory: isVehicleSelected ? 'vehicle' : 'device',
      counterUnit: isVehicleSelected ? counterUnit || 'km' : 'RBG',
      ...(isVehicleSelected
        ? {
            licensePlate: licensePlate.trim().toUpperCase(),
            vinNumber: vinNumber.trim().toUpperCase(),
            firstRegistrationDate: firstRegistrationDate || '',
            fuelType: fuelType || '',
            techInspectionDate: techInspectionDate || '',
            insuranceExpiryDate: insuranceExpiryDate || '',
            assignedDriver: assignedDriver.trim(),
            productionYear: productionYear.trim(),
            engineSpec: engineSpec.trim(),
            tireSeason: tireSeason || '',
            tireSize: tireSize.trim(),
            policyNumber: policyNumber.trim(),
            assistancePhone: assistancePhone.trim(),
            hasTowbar: hasTowbar || '',
            ownershipType: ownershipType.trim(),
            udtOrExtinguisherDate: udtOrExtinguisherDate || '',
            ...(initialCounterValue !== ''
              ? {
                  currentWorkHours: parsedCounter,
                  ...(parsedCounter !== Number(editingMachine?.currentWorkHours || 0)
                    ? { lastHoursUpdate: new Date().toISOString() }
                    : {}),
                }
              : {}),
          }
        : !editingMachine
        ? {
            licensePlate: '',
            vinNumber: '',
            firstRegistrationDate: '',
            fuelType: '',
            techInspectionDate: '',
            insuranceExpiryDate: '',
            assignedDriver: '',
            productionYear: '',
            engineSpec: '',
            tireSeason: '',
            tireSize: '',
            policyNumber: '',
            assistancePhone: '',
            hasTowbar: '',
            ownershipType: '',
            udtOrExtinguisherDate: '',
          }
        : {}),
      ...(allowContact
        ? {
            contactPerson: contactPerson.trim(),
            contactPhone: formatPhoneXxx(contactPhone),
            accessNotes: accessNotes.trim(),
          }
        : !editingMachine
        ? { contactPerson: '', contactPhone: '', accessNotes: '' }
        : {}),
      ...(allowCkob
        ? {
            inspectionCategory: inspectionCategory || '',
            buildingType: buildingType.trim(),
            constructionYear: constructionYear.trim(),
            usableAreaM2:
              usableAreaM2 !== '' && !isNaN(Number(usableAreaM2)) ? Number(usableAreaM2) : '',
            cubatureM3:
              cubatureM3 !== '' && !isNaN(Number(cubatureM3)) ? Number(cubatureM3) : '',
            floorsCount:
              floorsCount !== '' && !isNaN(Number(floorsCount)) ? Number(floorsCount) : '',
            hasAsbestos: hasAsbestos || 'Brak',
            pinbAuthority: pinbAuthority.trim(),
            legalTitleDoc: legalTitleDoc.trim(),
          }
        : {}),
      ...(allowFGas
        ? {
            refrigerantType: effectiveRefType,
            refrigerantChargeKg:
              effectiveRefType && refrigerantChargeKg !== '' && Number(refrigerantChargeKg) > 0
                ? Number(refrigerantChargeKg)
                : null,
            co2EquivalentTons:
              effectiveRefType && fGasCalc.co2EquivalentTons > 0
                ? fGasCalc.co2EquivalentTons
                : null,
            requiresCroCard: effectiveRefType ? fGasCalc.requiresCroCard : false,
          }
        : {}),
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
          parentId: isVehicleSelected ? null : parentId || null,
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
          parentId: isVehicleSelected ? null : parentId || null,
          additionalDescription: additionalDescription.trim(),
          isDeleted: false,
          currentWorkHours: isVehicleSelected ? parsedCounter : 0,
          ...extraPayload,
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
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden animate-fade-in flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white shrink-0 z-20">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
            {editingMachine
              ? t('machines.form.editMachine', 'Edytuj dane urządzenia')
              : t('machines.form.addMachine', 'Dodaj nowe urządzenie i wygeneruj kod QR')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Przełącznik Typu Zasobu (Urządzenie / Instalacja vs Pojazd / Flota) */}
            <div
              data-testid="machine-asset-category-switcher"
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col sm:flex-row gap-2"
            >
              <button
                type="button"
                data-testid="asset-category-device-btn"
                onClick={() => {
                  setAssetCategory('device');
                  setCounterUnit('RBG');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  assetCategory === 'device'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="ph ph-gear-six text-base"></i>
                Urządzenie / Instalacja / Sprzęt (RBG)
              </button>
              <button
                type="button"
                data-testid="asset-category-vehicle-btn"
                onClick={() => {
                  setAssetCategory('vehicle');
                  if (!counterUnit || counterUnit === 'RBG') setCounterUnit('km');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  assetCategory === 'vehicle'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="ph ph-truck text-base"></i>
                Pojazd / Środek transportu — Flota (km / RBG)
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {assetCategory === 'vehicle'
                  ? 'Nazwa / Marka i model pojazdu *'
                  : t('machines.form.machineName', 'Nazwa urządzenia *')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none font-medium focus:ring-2 focus:ring-blue-500"
                placeholder={
                  assetCategory === 'vehicle'
                    ? 'np. Renault Master Bus Serwisowy / Toyota Proace / Wózek widłowy Linde'
                    : t(
                        'machines.form.machineNamePlaceholder',
                        'np. Klimatyzator Split / Pompa ciepła / Centrala K-01'
                      )
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {assetCategory === 'vehicle'
                    ? 'Baza / Oddział macierzysty *'
                    : t('machines.form.region', 'Miejsce montażu *')}
                </label>
                <select
                  data-testid="machine-form-region-select"
                  value={regionId}
                  onChange={e => setRegionId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {assetCategory === 'vehicle'
                      ? '-- Wybierz bazę / oddział --'
                      : t('machines.form.selectRegion', '-- Wybierz miejsce montażu --')}
                  </option>
                  <option value="main_map">
                    {assetCategory === 'vehicle' || industryProfile === 'fleet'
                      ? t('machines.form.wholeCompanyRegion', 'Cała Firma')
                      : t('machines.form.mainMapRegion', 'Mapa Główna')}
                  </option>
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
            {assetCategory !== 'vehicle' && (
              <div data-testid="machine-form-parent-field">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('machines.form.parentMachine', 'Urządzenie nadrzędne (Opcjonalnie)')}
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
                        {m.name} {m.licensePlate ? `[${m.licensePlate}]` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}
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

            {/* Sekcja Floty Samochodowej i Sprzętu Mobilnego (VexoNT Fleet / Pojazd) */}
            {assetCategory === 'vehicle' && (
              <div
                data-testid="machine-form-fleet-section"
                className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="ph ph-truck text-lg text-emerald-700"></i>
                    <span className="text-sm font-extrabold text-emerald-950">
                      Parametry Pojazdu / Floty Samochodowej (Przebieg, SKP, Polisa OC/AC, Kierowca)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    VexoNT Fleet
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numer rejestracyjny
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-license-plate-input"
                      value={licensePlate}
                      onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                      placeholder="np. GD 12345"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numer nadwozia (VIN)
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-vin-input"
                      value={vinNumber}
                      onChange={e => setVinNumber(e.target.value.toUpperCase())}
                      placeholder="np. VF1MA000012345678"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data pierwszej rejestracji
                    </label>
                    <input
                      type="date"
                      data-testid="fleet-first-registration-input"
                      value={firstRegistrationDate}
                      onChange={e => setFirstRegistrationDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aktualny stan licznika (startowy)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        data-testid="fleet-initial-counter-input"
                        value={initialCounterValue}
                        onChange={e => setInitialCounterValue(e.target.value)}
                        placeholder={`np. 125000`}
                        className="w-full p-2 pr-12 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-2.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded pointer-events-none">
                        {counterUnit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jednostka licznika
                    </label>
                    <select
                      data-testid="fleet-counter-unit-select"
                      value={counterUnit}
                      onChange={e => setCounterUnit(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="km">Kilometry (km) — Samochody / Busy</option>
                      <option value="RBG">Roboczogodziny (RBG) — Wózki / Sprzęt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rodzaj paliwa / napędu
                    </label>
                    <select
                      data-testid="fleet-fuel-type-select"
                      value={fuelType}
                      onChange={e => setFuelType(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {FUEL_TYPES.map(ft => (
                        <option key={ft.id} value={ft.id}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ważność badania tech. (SKP / UDT)
                    </label>
                    <input
                      type="date"
                      data-testid="fleet-tech-inspection-input"
                      value={techInspectionDate}
                      onChange={e => setTechInspectionDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ważność polisy (OC / AC)
                    </label>
                    <input
                      type="date"
                      data-testid="fleet-insurance-expiry-input"
                      value={insuranceExpiryDate}
                      onChange={e => setInsuranceExpiryDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Przypisany kierowca / Opiekun pojazdu
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-assigned-driver-input"
                      value={assignedDriver}
                      onChange={e => setAssignedDriver(e.target.value)}
                      placeholder="np. Jan Nowak (serwisant mobilny / kierowca)"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rok produkcji
                    </label>
                    <input
                      type="number"
                      min="1980"
                      max="2100"
                      data-testid="fleet-production-year-input"
                      value={productionYear}
                      onChange={e => setProductionYear(e.target.value)}
                      placeholder="np. 2022"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Silnik (pojemność / moc KM / Euro)
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-engine-spec-input"
                      value={engineSpec}
                      onChange={e => setEngineSpec(e.target.value)}
                      placeholder="np. 2.3 dCi 150 KM (110 kW, Euro 6)"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Wiersz 3: Opony, Polisa + Assistance, DMC/Hak, Leasing/Karta paliwowa, UDT/Gaśnica */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aktualnie założone opony
                    </label>
                    <select
                      data-testid="fleet-tire-season-select"
                      value={tireSeason}
                      onChange={e => setTireSeason(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {TIRE_SEASON_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rozmiar opon / przechowywanie
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-tire-size-input"
                      value={tireSize}
                      onChange={e => setTireSize(e.target.value)}
                      placeholder="np. 225/65 R16C (2. kpl w magazynie)"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ubezpieczyciel i nr polisy OC/AC
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-policy-number-input"
                      value={policyNumber}
                      onChange={e => setPolicyNumber(e.target.value)}
                      placeholder="np. PZU / 1029384756"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefon Assistance 24h (w trasie)
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-assistance-phone-input"
                      value={assistancePhone}
                      onChange={e => setAssistancePhone(e.target.value)}
                      placeholder="np. +48 22 566 55 44"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hak holowniczy i DMC (Kategoria)
                    </label>
                    <select
                      data-testid="fleet-towbar-dmc-select"
                      value={hasTowbar}
                      onChange={e => setHasTowbar(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {TOWBAR_DMC_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dozór UDT (winda/HDS) / Tachograf / Gaśnica
                    </label>
                    <input
                      type="date"
                      data-testid="fleet-udt-extinguisher-date-input"
                      value={udtOrExtinguisherDate}
                      onChange={e => setUdtOrExtinguisherDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Własność / Leasing (limit km) / Nr karty paliwowej
                    </label>
                    <input
                      type="text"
                      data-testid="fleet-ownership-fuelcard-input"
                      value={ownershipType}
                      onChange={e => setOwnershipType(e.target.value)}
                      placeholder="np. Leasing PKO (limit 30 tys. km/rok) • Karta Orlen #4412"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sekcja branżowa (wyłącznie dla profili Facility / c-KOB oraz HVAC / F-Gazy — zablokowana dla Przemysłu / Produkcji) */}
            {(industryProfile === 'facility' || industryProfile === 'hvac') && (
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
