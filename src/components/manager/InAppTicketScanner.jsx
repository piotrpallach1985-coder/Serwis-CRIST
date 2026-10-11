import Toast from './Toast';
import { useToast } from '../../hooks/useToast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OperatorScanner from '../operator/OperatorScanner';
import OperatorForm from '../OperatorForm';
import { useManagerStore } from '../../store/managerStore';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';

export default function InAppTicketScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = getCurrentTenant();
  const { showToast, toastConfig, hideToast } = useToast();
  
  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  
  const [topicsList, setTopicsList] = useState([]);
  
  useEffect(() => {
    if (!tenantId) return;
    const unsub = onSnapshot(collection(db, 'tenants', tenantId, 'topics'), (snap) => {
      setTopicsList(snap.docs.map(d => d.data()).filter(d => !d.isDeleted).map(d => d.text));
    });
    return () => unsub();
  }, [tenantId]);

  const [step, setStep] = useState('scan');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const handleScanSuccess = async (decodedText, rawQr) => {
    let machineId = decodedText;
    let tenantFromQr = null;
    
    const match = decodedText.match(/machine=([^&]+)/);
    if (match) machineId = match[1];
    
    const tMatch = decodedText.match(/tenant=([^&#]+)/);
    if (tMatch) tenantFromQr = tMatch[1];

    if (tenantFromQr && tenantFromQr !== tenantId && user?.role !== "superadmin") {
      showToast("Ta maszyna należy do innej firmy!", "error");
      return;
    }
    
    let targetMachine = machines.find(m => 
      m.id === machineId || 
      (m.qrCode && (m.qrCode === machineId || m.qrCode === decodedText || m.qrCode === rawQr)) || 
      (m.internalId && m.internalId.toLowerCase() === machineId.toLowerCase())
    );

    if (!targetMachine && machineId) {
      // Fallback: try fetching by ID just in case
      try {
        const d = await getDoc(doc(db, 'tenants', tenantId, 'machines', machineId));
        if (d.exists()) {
          targetMachine = { id: d.id, ...d.data() };
        }
      } catch (e) {}
    }

    if (targetMachine) {
      setSelectedMachine(targetMachine);
      setStep('form');
    } else {
      setSelectedMachine({ id: 'manual', name: 'Nieznana Maszyna', manualInput: machineId });
      setStep('form');
    }
  };

  const handleStepChange = (newStep) => {
    setStep(newStep);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-fade-in">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <i className="ph ph-warning-circle text-purple-600 text-3xl"></i>
          Zgłoszenie awarii (Wewnętrzne)
        </h1>
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm">
          <i className="ph ph-arrow-left"></i> Wróć
        </button>
        {toastConfig.visible && <Toast {...toastConfig} onClose={hideToast} />}
      </div>
      {step === 'scan' && (
        <OperatorScanner onScanSuccess={handleScanSuccess} />
      )}

      {step === 'form' && (
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <i className="ph ph-file-text text-blue-600 text-xl"></i> Formularz zgłoszenia
          </h2>
          <OperatorForm 
            machines={machines}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            regions={regions}
            handleStepChange={handleStepChange}
            isOnline={true}
            isInternal={true}
            topicsList={topicsList}
          />
        </div>
      )}
    
      {step === 'success' && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center animate-scale-in">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <i className="ph ph-check-circle text-6xl"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
            Zgłoszenie wysłane
          </h2>
          <p className="text-slate-500 mb-8 max-w-md">
            Zgłoszenie awarii maszyny <span className="font-bold text-gray-800">{selectedMachine?.name}</span> zostało pomyślnie dodane do bazy.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setSelectedMachine(null);
                setStep('scan');
              }}
              className="px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors"
            >
              Zgłoś kolejną awarię
            </button>
            <button
              onClick={() => navigate('/manager/ur/tickets')}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              Przejdź do zgłoszeń
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
