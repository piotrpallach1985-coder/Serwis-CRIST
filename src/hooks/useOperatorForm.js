import { useState, useRef, useEffect } from 'react';
import { useToast } from './useToast';
import { useTicketSubmit } from './useTicketSubmit';
import { compressImage } from '../utils/imageCompressor';
import {
  checkQrSubmissionCooldown,
  recordQrSubmissionTimestamp,
  resolveAnonymousReportPin,
  verifyAnonymousReportPin,
  findMachineByIdentifierOrPlate,
  getMachineCounterUnit,
} from '../utils/fieldServiceHelpers';
import { updateMachineWorkHours } from '../services/machines.service';
import { useManagerStore } from '../store/managerStore';

// Spójne z limitem w firestore.rules (anonimowe zgłoszenia)
export const MAX_TICKET_PHOTOS = 10;

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

import { useAuth } from './useAuth';

export const useOperatorForm = ({ machines, selectedMachine, setSelectedMachine, regions, handleStepChange, isOnline , isInternal}) => {
  const { user } = useAuth();
  const branding = useManagerStore(state => state.branding);
  const mapSettings = useManagerStore(state => state.mapSettings);
  const [topicMode, setTopicMode] = useState('select'); // 'select' lub 'manual'
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reportPin, setReportPin] = useState('');
  const [reporterDeviceId] = useState(() => {
    let id = localStorage.getItem('device_id_token');
    if (!id) {
      id = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('device_id_token', id);
    }
    return id;
  });
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [acceptedRodo, setAcceptedRodo] = useState(false);

  // Szybkie raportowanie licznika (przebieg km / motogodziny RBG)
  const [reportedWorkHours, setReportedWorkHours] = useState('');
  const [isSavingMeter, setIsSavingMeter] = useState(false);
  const [meterSavedSuccess, setMeterSavedSuccess] = useState(false);

  // Opcjonalna pozycja GPS dla zgłoszenia awarii pojazdu
  const [vehicleGps, setVehicleGps] = useState(null);
  const [isCapturingVehicleGps, setIsCapturingVehicleGps] = useState(false);
  const [vehicleGpsError, setVehicleGpsError] = useState(null);
  
  const { toastConfig, showToast, hideToast } = useToast();
  const timeoutRef = useRef(null);

  useEffect(() => {
    setMeterSavedSuccess(false);
    const currentVal =
      selectedMachine?.currentWorkHours ?? selectedMachine?.workHours ?? '';
    setReportedWorkHours(
      currentVal !== '' && currentVal !== null && currentVal !== undefined
        ? String(currentVal)
        : ''
    );
  }, [selectedMachine?.id, selectedMachine?.matchedMachineId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const { submitTicket, loading: submitLoading, uploadProgress: submitProgress } = useTicketSubmit({
    regions,
    onStepChange: handleStepChange,
    showToast
  });

  const initialMachineRef = useRef(selectedMachine);
  useEffect(() => {
    if (!initialMachineRef.current && selectedMachine) {
      initialMachineRef.current = selectedMachine;
    }
  }, [selectedMachine]);

  const effectiveMachineForPin =
    selectedMachine?.id === 'manual' && selectedMachine?.name
      ? findMachineByIdentifierOrPlate(machines || [], selectedMachine.name) || selectedMachine
      : selectedMachine;

  const pinRequirement = !isInternal
    ? (() => {
        const currentReq = resolveAnonymousReportPin(
          effectiveMachineForPin,
          regions || [],
          branding || {},
          mapSettings || {}
        );
        if (currentReq.required) return currentReq;
        if (initialMachineRef.current) {
          const initialReq = resolveAnonymousReportPin(
            initialMachineRef.current,
            regions || [],
            branding || {},
            mapSettings || {}
          );
          if (initialReq.required) return initialReq;
        }
        return currentReq;
      })()
    : { required: false, pin: '', source: 'none', sourceLabel: '' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isInternal) {
      if (pinRequirement.required && !verifyAnonymousReportPin(reportPin, pinRequirement.pin)) {
        const msg =
          'Nieprawidłowy kod PIN autoryzacji zgłoszenia! Podaj poprawny kod PIN przypisany do tego urządzenia lub rejonu.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }

      const cooldown = checkQrSubmissionCooldown();
      if (!cooldown.allowed) {
        const msg = `Ochrona antyspamowa: odczekaj ${cooldown.remainingSeconds} s przed wysłaniem kolejnego zgłoszenia.`;
        setErrorMsg(msg);
        showToast(msg, 'warning');
        return;
      }
    }
    
    let machineToSubmit = { ...selectedMachine };
    
    if (
      isInternal &&
      machineToSubmit.id === 'manual' &&
      machineToSubmit.matchedMachineId
    ) {
      const existingMachine = machines.find(m => m.id === machineToSubmit.matchedMachineId);
      if (existingMachine) {
        machineToSubmit = {
          ...existingMachine,
          regionId: machineToSubmit.regionId || existingMachine.regionId || '',
        };
        setSelectedMachine(machineToSubmit);
      }
    }
    
    const currentMeterVal = Number(
      machineToSubmit.currentWorkHours ?? machineToSubmit.workHours ?? 0
    );
    const trimmedMeter = String(reportedWorkHours ?? '').trim();
    const hasCustomMeter =
      trimmedMeter !== '' &&
      !Number.isNaN(Number(trimmedMeter)) &&
      Number(trimmedMeter) !== currentMeterVal;

    if (hasCustomMeter && Number(trimmedMeter) < currentMeterVal) {
      const unit = getMachineCounterUnit(machineToSubmit, branding?.industryProfile);
      const msg = `Podany stan licznika (${trimmedMeter} ${unit}) nie może być mniejszy niż aktualny stan w bazie (${currentMeterVal} ${unit})!`;
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    const ok = await submitTicket({
      selectedMachine: machineToSubmit,
      topic,
      description,
      reporterName: isInternal ? (user?.name || 'Pracownik (Wewnętrzny)') : 'Szybkie Zgłoszenie',
      reporterPhone: isInternal ? (user?.phone || '') : reporterPhone,
      reportPin: !isInternal && reportPin ? String(reportPin).trim() : '',
      isCritical,
      pendingPhotos,
      vehicleGps,
      reportedWorkHours: hasCustomMeter ? Number(trimmedMeter) : undefined,
      acceptedRodo,
      reporterDeviceId,
      isOnline,
      timeoutRef,
      setTopicMode
    });

    if (ok && !isInternal) {
      recordQrSubmissionTimestamp();
    }
  };

  const handleSaveMeterOnly = async () => {
    if (!isInternal && pinRequirement?.required && !verifyAnonymousReportPin(reportPin, pinRequirement.pin)) {
      const msg =
        'Nieprawidłowy kod PIN autoryzacji! Podaj poprawny kod PIN przypisany do tego urządzenia lub rejonu, aby zapisać stan licznika.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return false;
    }

    const targetMachine =
      selectedMachine?.id && selectedMachine.id !== 'manual'
        ? selectedMachine
        : selectedMachine?.matchedMachineId
          ? (machines || []).find(m => m.id === selectedMachine.matchedMachineId)
          : null;

    if (!targetMachine || !targetMachine.id || targetMachine.id === 'manual') {
      showToast('Wybierz konkretne urządzenie lub pojazd, aby zapisać stan licznika.', 'error');
      return false;
    }

    const parsedVal = Number(reportedWorkHours);
    if (String(reportedWorkHours).trim() === '' || Number.isNaN(parsedVal) || parsedVal < 0) {
      showToast('Podaj prawidłową wartość licznika (większą lub równą 0).', 'error');
      return false;
    }

    const currentVal = Number(
      targetMachine.currentWorkHours ?? targetMachine.workHours ?? 0
    );
    const unit = getMachineCounterUnit(targetMachine, branding?.industryProfile);
    if (parsedVal < currentVal) {
      const msg = `Nowy stan licznika (${parsedVal} ${unit}) nie może być mniejszy niż aktualny odczyt (${currentVal} ${unit})!`;
      setErrorMsg(msg);
      showToast(msg, 'error');
      return false;
    }

    setIsSavingMeter(true);
    try {
      await updateMachineWorkHours(targetMachine.id, parsedVal, false);
      if (setSelectedMachine) {
        setSelectedMachine(prev =>
          prev ? { ...prev, currentWorkHours: parsedVal } : prev
        );
      }
      const storeState = useManagerStore.getState?.();
      if (storeState?.setMachines && Array.isArray(storeState.machines)) {
        storeState.setMachines(
          storeState.machines.map(m =>
            m.id === targetMachine.id ? { ...m, currentWorkHours: parsedVal } : m
          )
        );
      }
      setMeterSavedSuccess(true);
      showToast(
        `Zapisano stan licznika: ${parsedVal} ${unit} (${targetMachine.name}).`,
        'success'
      );
      return true;
    } catch (err) {
      console.error('Błąd zapisu licznika:', err);
      showToast('Nie udało się zapisać stanu licznika: ' + (err.message || err), 'error');
      return false;
    } finally {
      setIsSavingMeter(false);
    }
  };

  const handleCaptureVehicleGps = () => {
    setVehicleGpsError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const msg = 'Twoja przeglądarka lub urządzenie nie obsługuje lokalizacji GPS.';
      setVehicleGpsError(msg);
      showToast(msg, 'error');
      return;
    }
    setIsCapturingVehicleGps(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0),
          timestamp: new Date().toISOString(),
        };
        setVehicleGps(coords);
        setIsCapturingVehicleGps(false);
        showToast('Pobrano współrzędne GPS pojazdu.', 'success');
      },
      err => {
        setIsCapturingVehicleGps(false);
        const msg =
          err?.code === 1
            ? 'Odmówiono dostępu do lokalizacji GPS. Zezwól na dostęp w przeglądarce lub kontynuuj bez GPS.'
            : 'Nie udało się pobrać pozycji GPS pojazdu.';
        setVehicleGpsError(msg);
        showToast(msg, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClearVehicleGps = () => {
    setVehicleGps(null);
    setVehicleGpsError(null);
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadProgress('Przetwarzanie zdjęć...');
    setLoading(true);
    try {
      let newPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file, 2);
        const base64 = await fileToBase64(compressedFile);
        const preview = URL.createObjectURL(compressedFile);
        newPhotos.push({ file: compressedFile, base64, preview, name: compressedFile.name });
      }
      if (pendingPhotos.length + newPhotos.length > MAX_TICKET_PHOTOS) {
        showToast(`Maksymalnie ${MAX_TICKET_PHOTOS} zdjęć na zgłoszenie.`, 'warning');
      }
      setPendingPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_TICKET_PHOTOS));
    } catch (err) {
      console.error(err);
      showToast('Błąd przetwarzania: ' + err.message, 'error');
    }
    setUploadProgress('');
    setLoading(false);
  };

  return {
    topicMode, setTopicMode,
    topic, setTopic,
    description, setDescription,
    reporterName, setReporterName,
    reporterPhone, setReporterPhone,
    reportPin, setReportPin,
    pinRequirement,
    isCritical, setIsCritical,
    loading, setLoading,
    errorMsg, setErrorMsg,
    pendingPhotos, setPendingPhotos,
    uploadProgress, setUploadProgress,
    acceptedRodo, setAcceptedRodo,
    toastConfig, hideToast,
    submitLoading, submitProgress,
    reportedWorkHours, setReportedWorkHours,
    isSavingMeter, meterSavedSuccess, handleSaveMeterOnly,
    vehicleGps, setVehicleGps,
    isCapturingVehicleGps, vehicleGpsError,
    handleCaptureVehicleGps, handleClearVehicleGps,
    handleSubmit, handleFilesSelected
  };
};
