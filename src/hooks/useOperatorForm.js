import { useState, useRef, useEffect } from 'react';
import { useToast } from './useToast';
import { useTicketSubmit } from './useTicketSubmit';
import { compressImage } from '../utils/imageCompressor';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const useOperatorForm = ({ machines, selectedMachine, setSelectedMachine, regions, handleStepChange, isOnline }) => {
  const [topicMode, setTopicMode] = useState('select'); // 'select' lub 'manual'
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let machineToSubmit = { ...selectedMachine };
    
    if (machineToSubmit.id === 'manual' && machineToSubmit.name) {
      const typedName = machineToSubmit.name.trim().toLowerCase();
      const existingMachine = machines.find(m => m.name.toLowerCase() === typedName);
      if (existingMachine) {
        machineToSubmit = { ...existingMachine };
        setSelectedMachine(machineToSubmit);
      }
    }
    
    await submitTicket({
      selectedMachine: machineToSubmit,
      topic,
      description,
      reporterName,
      reporterPhone,
      isCritical,
      pendingPhotos,
      acceptedRodo,
      reporterDeviceId,
      isOnline,
      timeoutRef,
      setTopicMode
    });
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
      setPendingPhotos(prev => [...prev, ...newPhotos]);
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
