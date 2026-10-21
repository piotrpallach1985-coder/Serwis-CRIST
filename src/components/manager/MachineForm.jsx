import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useManagerStore } from '../../store/managerStore';
import { addMachine, updateMachine } from '../../services/machines.service';
import {
  REFRIGERANT_TYPES,
  CKOB_CATEGORIES,
  calculateCo2Equivalent,
  captureCurrentGpsPosition,
} from '../../utils/fieldServiceHelpers';
import InteractiveGoogleMap, {
  geocodeAddressQuery,
  searchAddressSuggestions,
  reverseGeocodeLatLng,
} from './map/InteractiveGoogleMap';

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

  // Pola pod Field Service (HVAC / F-Gazy) oraz Facility Management (Osiedla / c-KOB / Klient)
  const [address, setAddress] = useState('');
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [inspectionCategory, setInspectionCategory] = useState('');
  const [refrigerantType, setRefrigerantType] = useState('');
  const [refrigerantChargeKg, setRefrigerantChargeKg] = useState('');
  const [showExtendedFields, setShowExtendedFields] = useState(true);

  // Podpowiedzi adresu na żywo w formularzu oraz osobne okienko mapy z pineską
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const skipAddressSuggestRef = useRef(false);

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerSuggestions, setPickerSuggestions] = useState([]);
  const [pickerSearching, setPickerSearching] = useState(false);
  const skipPickerSuggestRef = useRef(false);
  const [pickerLat, setPickerLat] = useState(54.5364);
  const [pickerLng, setPickerLng] = useState(18.5469);
  const [pickerZoom, setPickerZoom] = useState(17);
  const [pickerStyle, setPickerStyle] = useState('k');

  const [loading, setLoading] = useState(false);
  const limits = useManagerStore(state => state.limits);
  const machines = useManagerStore(state => state.machines);

  useEffect(() => {
    if (editingMachine) {
      skipAddressSuggestRef.current = true;
      setName(editingMachine.name || '');
      setBay(editingMachine.bay || '');
      setRegionId(editingMachine.regionId || '');
      setInternalId(editingMachine.internalId || '');
      setParentId(editingMachine.parentId || '');
      setAdditionalDescription(editingMachine.additionalDescription || '');
      setAddress(editingMachine.address || editingMachine.mapAddress || '');
      const existingLat = editingMachine.gpsLat ?? editingMachine.lat;
      const existingLng = editingMachine.gpsLng ?? editingMachine.lng;
      setGpsLat(existingLat !== undefined && existingLat !== null ? String(existingLat) : '');
      setGpsLng(existingLng !== undefined && existingLng !== null ? String(existingLng) : '');
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
      setShowExtendedFields(true);
    } else {
      skipAddressSuggestRef.current = true;
      setName('');
      setInternalId('');
      setAdditionalDescription('');
      setContactPerson('');
      setContactPhone('');
      setAccessNotes('');
      setInspectionCategory('');
      setRefrigerantType('');
      setRefrigerantChargeKg('');

      if (initialParentId) {
        setParentId(initialParentId);
        const pm = machines.find(m => m.id === initialParentId);
        if (pm) {
          setRegionId(pm.regionId || '');
          setBay(pm.bay || '');
          setAddress(pm.address || pm.mapAddress || '');
          const pLat = pm.gpsLat ?? pm.lat;
          const pLng = pm.gpsLng ?? pm.lng;
          setGpsLat(pLat !== undefined && pLat !== null ? String(pLat) : '');
          setGpsLng(pLng !== undefined && pLng !== null ? String(pLng) : '');
        } else {
          setRegionId('');
          setBay('');
          setAddress('');
          setGpsLat('');
          setGpsLng('');
        }
      } else {
        setParentId('');
        setRegionId('');
        setBay('');
        setAddress('');
        setGpsLat('');
        setGpsLng('');
      }
      setShowExtendedFields(true);
    }
    setAddressSuggestions([]);
    setIsMapPickerOpen(false);
  }, [editingMachine, isOpen, initialParentId, machines]);

  // Podpowiedzi przy wpisywaniu miejscowości i ulicy w polu adresu
  useEffect(() => {
    if (!isOpen) return;
    if (skipAddressSuggestRef.current) {
      skipAddressSuggestRef.current = false;
      return;
    }
    const q = address.trim();
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      const results = await searchAddressSuggestions(q);
      if (!cancelled) {
        setSearchingAddress(false);
        setAddressSuggestions(results);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, isOpen]);

  // Podpowiedzi w osobnym okienku mapy z pineską
  useEffect(() => {
    if (!isMapPickerOpen) return;
    if (skipPickerSuggestRef.current) {
      skipPickerSuggestRef.current = false;
      return;
    }
    const q = pickerQuery.trim();
    if (q.length < 3) {
      setPickerSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPickerSearching(true);
      const results = await searchAddressSuggestions(q);
      if (!cancelled) {
        setPickerSearching(false);
        setPickerSuggestions(results);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickerQuery, isMapPickerOpen]);

  const fGasCalc = useMemo(
    () => calculateCo2Equivalent(refrigerantType, refrigerantChargeKg),
    [refrigerantType, refrigerantChargeKg]
  );

  if (!isOpen) return null;

  const openMapPinModal = () => {
    skipPickerSuggestRef.current = true;
    setPickerQuery(address || '');
    setPickerSuggestions([]);
    const parsedLat = gpsLat !== '' && !isNaN(Number(gpsLat)) ? Number(gpsLat) : null;
    const parsedLng = gpsLng !== '' && !isNaN(Number(gpsLng)) ? Number(gpsLng) : null;
    if (parsedLat !== null && parsedLng !== null && (parsedLat !== 0 || parsedLng !== 0)) {
      setPickerLat(parsedLat);
      setPickerLng(parsedLng);
    } else {
      const selectedReg = regions.find(r => r.id === regionId);
      const regLat = Number(selectedReg?.lat ?? selectedReg?.googleLat);
      const regLng = Number(selectedReg?.lng ?? selectedReg?.googleLng);
      if (Number.isFinite(regLat) && Number.isFinite(regLng) && (regLat !== 0 || regLng !== 0)) {
        setPickerLat(regLat);
        setPickerLng(regLng);
      } else {
        setPickerLat(54.5364);
        setPickerLng(18.5469);
      }
    }
    setPickerZoom(17);
    setIsMapPickerOpen(true);
  };

  const handlePickerSearch = async () => {
    const q = pickerQuery.trim();
    if (!q) return;
    setPickerSearching(true);
    const results = await searchAddressSuggestions(q);
    setPickerSearching(false);
    if (results.length > 0) {
      setPickerSuggestions(results);
      setPickerLat(results[0].lat);
      setPickerLng(results[0].lng);
    } else {
      const geo = await geocodeAddressQuery(q);
      if (geo) {
        setPickerLat(geo.lat);
        setPickerLng(geo.lng);
      }
    }
  };

  const handlePickerMapClick = async (picked) => {
    if (!picked || !Number.isFinite(picked.lat) || !Number.isFinite(picked.lng)) return;
    setPickerLat(picked.lat);
    setPickerLng(picked.lng);
    const rev = await reverseGeocodeLatLng(picked.lat, picked.lng);
    if (rev?.displayName) {
      skipPickerSuggestRef.current = true;
      setPickerQuery(rev.displayName);
      setPickerSuggestions([]);
    }
  };

  const handleConfirmMapPin = () => {
    setGpsLat(String(Number(pickerLat.toFixed(6))));
    setGpsLng(String(Number(pickerLng.toFixed(6))));
    if (pickerQuery.trim()) {
      skipAddressSuggestRef.current = true;
      setAddress(pickerQuery.trim());
    }
    setAddressSuggestions([]);
    setIsMapPickerOpen(false);
  };

  const handleParentChange = e => {
    const val = e.target.value;
    setParentId(val);
    if (val && !editingMachine) {
      const pm = machines.find(m => m.id === val);
      if (pm) {
        if (pm.regionId) setRegionId(pm.regionId);
        if (pm.bay) setBay(pm.bay);
        if (pm.address || pm.mapAddress) {
          skipAddressSuggestRef.current = true;
          setAddress(pm.address || pm.mapAddress);
        }
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

    const resolvedLat = gpsLat !== '' && !isNaN(Number(gpsLat)) ? Number(gpsLat) : null;
    const resolvedLng = gpsLng !== '' && !isNaN(Number(gpsLng)) ? Number(gpsLng) : null;

    const extraPayload = {
      address: address.trim(),
      gpsLat: resolvedLat,
      gpsLng: resolvedLng,
      ...(resolvedLat !== null && resolvedLng !== null ? { lat: resolvedLat, lng: resolvedLng } : {}),
      contactPerson: contactPerson.trim(),
      contactPhone: formatPhoneXxx(contactPhone),
      accessNotes: accessNotes.trim(),
      inspectionCategory: inspectionCategory || '',
      refrigerantType: refrigerantType || '',
      refrigerantChargeKg:
        refrigerantType && refrigerantChargeKg !== '' && Number(refrigerantChargeKg) > 0
          ? Number(refrigerantChargeKg)
          : null,
      co2EquivalentTons:
        refrigerantType && fGasCalc.co2EquivalentTons > 0 ? fGasCalc.co2EquivalentTons : null,
      requiresCroCard: refrigerantType ? fGasCalc.requiresCroCard : false,
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

            {/* Sekcja: Lokalizacja GPS z pineską na mapie, Klient, c-KOB oraz HVAC / F-Gazy */}
            <div className="border border-blue-200 rounded-xl bg-blue-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExtendedFields(prev => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="ph ph-map-pin-line text-lg text-blue-600"></i>
                  <span className="text-sm font-bold text-slate-800">
                    {t(
                      'machines.form.extendedSectionTitle',
                      'Adres GPS (Pineska na mapie), Dane Klienta / Lokalu, Przeglądy c-KOB oraz F-Gazy (HVAC)'
                    )}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  {showExtendedFields ? 'Zwiń' : 'Rozwiń opcje'}
                  <i className={`ph ${showExtendedFields ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
                </span>
              </button>

              {showExtendedFields && (
                <div className="p-4 pt-3 border-t border-blue-100 space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adres lokalizacji (Miejscowość, ulica i nr)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="np. Gdynia, ul. Kwiatowa 12/4"
                          className="w-full p-2 pr-8 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchingAddress && (
                          <i className="ph ph-spinner-gap animate-spin text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2"></i>
                        )}
                      </div>
                      {addressSuggestions.length > 0 && (
                        <div className="mt-1 max-h-36 overflow-y-auto bg-white border border-blue-200 rounded-lg divide-y divide-slate-100 text-xs shadow-lg z-30">
                          {addressSuggestions.map((sug, idx) => (
                            <button
                              key={`${sug.lat}-${sug.lng}-${idx}`}
                              type="button"
                              onClick={() => {
                                skipAddressSuggestRef.current = true;
                                setAddress(sug.displayName);
                                setGpsLat(String(Number(sug.lat.toFixed(6))));
                                setGpsLng(String(Number(sug.lng.toFixed(6))));
                                setAddressSuggestions([]);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 transition-colors flex items-start gap-1.5 text-slate-700"
                            >
                              <i className="ph-fill ph-map-pin text-red-600 shrink-0 mt-0.5"></i>
                              <span className="line-clamp-2">{sug.displayName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kategoria obiektu / przeglądu (c-KOB / Prawo budowlane)
                      </label>
                      <select
                        value={inspectionCategory}
                        onChange={e => setInspectionCategory(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CKOB_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Szerokość GPS (Latitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={gpsLat}
                        onChange={e => setGpsLat(e.target.value)}
                        placeholder="np. 54.51889"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Długość GPS (Longitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={gpsLng}
                        onChange={e => setGpsLng(e.target.value)}
                        placeholder="np. 18.53054"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={openMapPinModal}
                        className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <i className="ph-fill ph-map-pin text-sm"></i>
                        Wskaż adres pineską na mapie
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        disabled={gpsLoading}
                        onClick={async () => {
                          setGpsLoading(true);
                          try {
                            const coords = await captureCurrentGpsPosition();
                            setGpsLat(String(coords.lat));
                            setGpsLng(String(coords.lng));
                          } catch (err) {
                            onError(err.message || 'Błąd pobierania lokalizacji GPS.');
                          } finally {
                            setGpsLoading(false);
                          }
                        }}
                        className="w-full p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <i
                          className={`ph ${
                            gpsLoading ? 'ph-spinner animate-spin' : 'ph-crosshair'
                          } text-sm`}
                        ></i>
                        Bieżące GPS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Klient / Właściciel / Osoba kontaktowa
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={e => setContactPerson(e.target.value)}
                        placeholder="np. Jan Kowalski / Wspólnota Mieszkaniowa"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Telefon kontaktowy klienta (xxx xxx xxx)
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
                        Dostęp / Kod domofonu / Klatka
                      </label>
                      <input
                        type="text"
                        value={accessNotes}
                        onChange={e => setAccessNotes(e.target.value)}
                        placeholder="np. Kod: 12#3456, klucz w administracji"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* HVAC / F-Gazy (Rozporządzenie UE 2024/573 & CRO) */}
                  <div className="pt-2 border-t border-slate-100">
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
                </div>
              )}
            </div>

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

      {/* Osobne okienko mapy do wskazania adresu urządzenia pineską i sczytania długości oraz szerokości GPS */}
      {isMapPickerOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-6"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ph-fill ph-map-pin text-red-600 text-xl"></i>
                <h3 className="font-extrabold text-slate-800 text-base md:text-lg">
                  Wskaż adres urządzenia pineską na mapie
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wyszukaj miejscowość, ulicę i numer (lub kliknij bezpośrednio na mapie)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={pickerQuery}
                      onChange={e => setPickerQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePickerSearch();
                        }
                      }}
                      placeholder="np. Gdańsk, ul. Długa 10 / Gdynia, Cechowa 5"
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handlePickerSearch}
                      disabled={pickerSearching || !pickerQuery.trim()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <i className={`ph ${pickerSearching ? 'ph-spinner-gap animate-spin' : 'ph-magnifying-glass'}`}></i>
                      <span>Szukaj</span>
                    </button>
                  </div>

                  {pickerSuggestions.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto bg-white border border-emerald-300 rounded-lg divide-y divide-slate-100 text-xs shadow-lg z-30">
                      {pickerSuggestions.map((sug, idx) => (
                        <button
                          key={`${sug.lat}-${sug.lng}-${idx}`}
                          type="button"
                          onClick={() => {
                            skipPickerSuggestRef.current = true;
                            setPickerQuery(sug.displayName);
                            setPickerLat(sug.lat);
                            setPickerLng(sug.lng);
                            setPickerSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex items-start gap-2 text-slate-700"
                        >
                          <i className="ph-fill ph-map-pin text-red-600 shrink-0 mt-0.5"></i>
                          <span className="line-clamp-2">{sug.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Widok mapy</label>
                  <select
                    value={pickerStyle}
                    onChange={e => setPickerStyle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="k">Satelita + Ulice</option>
                    <option value="s">Satelita (czysty)</option>
                    <option value="m">Mapa drogowa</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs">
                <div className="flex flex-wrap items-center gap-4 font-mono text-emerald-900">
                  <span>
                    <strong>Szerokość (Lat):</strong> {Number(pickerLat).toFixed(6)}
                  </span>
                  <span>
                    <strong>Długość (Lng):</strong> {Number(pickerLng).toFixed(6)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Kliknij na mapie, aby postawić pineskę i sczytać współrzędne
                </span>
              </div>

              <div className="w-full h-80 md:h-[420px] rounded-xl overflow-hidden border-2 border-emerald-500 shadow-inner bg-slate-900">
                <InteractiveGoogleMap
                  lat={pickerLat}
                  lng={pickerLng}
                  zoom={pickerZoom}
                  mapStyle={pickerStyle}
                  interactive={true}
                  markerPosition={{ lat: pickerLat, lng: pickerLng }}
                  onPickLocation={handlePickerMapClick}
                  onViewChange={next => {
                    setPickerZoom(next.zoom);
                  }}
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs md:text-sm transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleConfirmMapPin}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <i className="ph ph-check-bold"></i>
                <span>Zatwierdź wskazaną lokalizację ({Number(pickerLat).toFixed(4)}, {Number(pickerLng).toFixed(4)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
