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
  captureCurrentGpsPosition,
} from '../../utils/fieldServiceHelpers';

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
  const [showExtendedFields, setShowExtendedFields] = useState(false);

  const [loading, setLoading] = useState(false);
  const limits = useManagerStore(state => state.limits);
  const machines = useManagerStore(state => state.machines);

  useEffect(() => {
    if (editingMachine) {
      setName(editingMachine.name || '');
      setBay(editingMachine.bay || '');
      setRegionId(editingMachine.regionId || '');
      setInternalId(editingMachine.internalId || '');
      setParentId(editingMachine.parentId || '');
      setAdditionalDescription(editingMachine.additionalDescription || '');
      setAddress(editingMachine.address || editingMachine.mapAddress || '');
      setGpsLat(
        editingMachine.gpsLat !== undefined && editingMachine.gpsLat !== null
          ? String(editingMachine.gpsLat)
          : ''
      );
      setGpsLng(
        editingMachine.gpsLng !== undefined && editingMachine.gpsLng !== null
          ? String(editingMachine.gpsLng)
          : ''
      );
      setContactPerson(editingMachine.contactPerson || '');
      setContactPhone(editingMachine.contactPhone || '');
      setAccessNotes(editingMachine.accessNotes || '');
      setInspectionCategory(editingMachine.inspectionCategory || '');
      setRefrigerantType(editingMachine.refrigerantType || '');
      setRefrigerantChargeKg(
        editingMachine.refrigerantChargeKg !== undefined &&
          editingMachine.refrigerantChargeKg !== null
          ? String(editingMachine.refrigerantChargeKg)
          : ''
      );
      setShowExtendedFields(
        Boolean(
          editingMachine.address ||
            editingMachine.mapAddress ||
            editingMachine.gpsLat ||
            editingMachine.gpsLng ||
            editingMachine.contactPerson ||
            editingMachine.contactPhone ||
            editingMachine.accessNotes ||
            editingMachine.inspectionCategory ||
            editingMachine.refrigerantType
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

      if (initialParentId) {
        setParentId(initialParentId);
        const pm = machines.find(m => m.id === initialParentId);
        if (pm) {
          setRegionId(pm.regionId || '');
          setBay(pm.bay || '');
          setAddress(pm.address || pm.mapAddress || '');
          setGpsLat(pm.gpsLat !== undefined && pm.gpsLat !== null ? String(pm.gpsLat) : '');
          setGpsLng(pm.gpsLng !== undefined && pm.gpsLng !== null ? String(pm.gpsLng) : '');
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
      setShowExtendedFields(false);
    }
  }, [editingMachine, isOpen, initialParentId, machines]);

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
        if (pm.address || pm.mapAddress) setAddress(pm.address || pm.mapAddress);
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const machines = useManagerStore.getState().machines || [];
    if (!editingMachine && limits && machines.length >= (limits.maxMachines || 50)) {
      alert(t('machines.form.limitReached') + (limits.maxMachines || 50) + ').');
      return;
    }
    if (!name.trim() || !regionId) return;
    setLoading(true);

    const extraPayload = {
      address: address.trim(),
      gpsLat: gpsLat !== '' && !isNaN(Number(gpsLat)) ? Number(gpsLat) : null,
      gpsLng: gpsLng !== '' && !isNaN(Number(gpsLng)) ? Number(gpsLng) : null,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
            {editingMachine ? t('machines.form.editMachine') : t('machines.form.addMachine')}
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
                {t('machines.form.machineName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none font-medium focus:ring-2 focus:ring-blue-500"
                placeholder={t('machines.form.machineNamePlaceholder')}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('machines.form.region')}
                </label>
                <select
                  value={regionId}
                  onChange={e => setRegionId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('machines.form.selectRegion')}</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('machines.form.bay')}
                </label>
                <input
                  type="text"
                  value={bay}
                  onChange={e => setBay(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('machines.form.bayPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('machines.form.internalIdLabel')}
                </label>
                <input
                  type="text"
                  value={internalId}
                  onChange={e => setInternalId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('machines.form.internalIdPlaceholder')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('machines.form.parentMachine')}
              </label>
              <select
                value={parentId}
                onChange={handleParentChange}
                className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
              >
                <option value="">{t('machines.form.noParent')}</option>
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
                {t('machines.form.additionalDescription')}
              </label>
              <textarea
                value={additionalDescription}
                onChange={e => setAdditionalDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded outline-none resize-y min-h-[80px]"
                placeholder={t('machines.form.additionalDescriptionPlaceholder')}
              ></textarea>
              <p className="text-xs text-gray-400 mt-1">
                {t('machines.form.additionalDescriptionHint')}
              </p>
            </div>

            {/* Sekcja: Lokalizacja GPS, Klient, c-KOB oraz HVAC / F-Gazy */}
            <div className="border border-blue-200 rounded-xl bg-blue-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExtendedFields(prev => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="ph ph-buildings text-lg text-blue-600"></i>
                  <span className="text-sm font-bold text-slate-800">
                    {t(
                      'machines.form.extendedSectionTitle',
                      'Adres GPS, Dane Klienta / Lokalu, Przeglądy c-KOB oraz F-Gazy (HVAC)'
                    )}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  {showExtendedFields ? 'Zwiń' : 'Rozwiń opcje'}
                  <i className={`ph ${showExtendedFields ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
                </span>
              </button>

              {showExtendedFields && (
                <div className="p-4 pt-2 border-t border-blue-100 space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adres lokalizacji GPS (do nawigacji Google Maps)
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="np. Gdynia, ul. Kwiatowa 12/4"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Szerokość GPS (Latitude, opcjonalnie)
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
                        Długość GPS (Longitude, opcjonalnie)
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
                        Pobierz bieżące GPS
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
                        Telefon kontaktowy klienta
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="np. 500 600 700"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
