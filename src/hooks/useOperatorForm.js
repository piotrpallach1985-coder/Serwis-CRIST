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
} from '../utils/fieldServiceHelpers';
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
  
  const { toastConfig, showToast, hideToast } = useToast();
  const timeoutRef = useRef(null);

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

  const effectiveMachineForPin =
    selectedMachine?.id === 'manual' && selectedMachine?.name
      ? findMachineByIdentifierOrPlate(machines || [], selectedMachine.name) || selectedMachine
      : selectedMachine;

  const pinRequirement = !isInternal
    ? resolveAnonymousReportPin(
        effectiveMachineForPin,
        regions || [],
        branding || {},
        mapSettings || {}
      )
    : { required: false, pin: '', source: 'none', sourceLabel: '' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isInternal) {
      if (pinRequirement.required && !verifyAnonymousReportPin(reportPin, pinRequirement.pin)) {
        const msg =
          'Nieprawidłowy kod PIN autoryzacji zgłoszenia! Podaj poprawny kod PIN przypisany do tej lokalizacji lub pojazdu.';
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
    
    if (machineToSubmit.id === 'manual' && machineToSubmit.name) {
      const typedName = machineToSubmit.name.trim().toLowerCase();
      const existingMachine = machines.find(m => m.name.toLowerCase() === typedName);
      if (existingMachine) {
        machineToSubmit = { ...existingMachine };
        setSelectedMachine(machineToSubmit);
      }
    }
    
    const ok = await submitTicket({
      selectedMachine: machineToSubmit,
      topic,
      description,
      reporterName: isInternal ? (user?.name || 'Pracownik (Wewnętrzny)') : 'Szybkie Zgłoszenie',
      reporterPhone: isInternal ? (user?.phone || '') : reporterPhone,
      isCritical,
      pendingPhotos,
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
    handleSubmit, handleFilesSelected
  };
};
