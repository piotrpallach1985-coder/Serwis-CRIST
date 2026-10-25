import Toast from './Toast';
import { useToast } from '../../hooks/useToast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OperatorScanner from '../operator/OperatorScanner';
import OperatorForm from '../OperatorForm';
import { useManagerStore } from '../../store/managerStore';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';
import {
  parseQrPayload,
  PART_QR_IN_MACHINE_SCANNER_MSG,
} from '../../services/qrAccess.service';
import { findMachineByIdentifierOrPlate } from '../../utils/fieldServiceHelpers';

export default function InAppTicketScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = getCurrentTenant();
  const { showToast, toastConfig, hideToast } = useToast();

  const machines = useManagerStore(state => state.machines || []);
  const regions = useManagerStore(state => state.regions || []);
  const parts = useManagerStore(state => state.parts || []);

  const [topicsList, setTopicsList] = useState([]);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = onSnapshot(collection(db, 'tenants', tenantId, 'topics'), snap => {
      setTopicsList(
        snap.docs
          .map(d => d.data())
          .filter(d => !d.isDeleted)
          .map(d => d.text)
      );
    });
    return () => unsub();
  }, [tenantId]);

  const [step, setStep] = useState('scan');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const handleScanSuccess = async (decodedText, rawQr) => {
    const rawStr = rawQr || decodedText || '';
    const parsed = parseQrPayload(rawStr);
    const candidateId = parsed.partId || parsed.machineId || String(decodedText || '').trim();
    const matchedPart = parts.find(
      p => p.id === candidateId || (p.code && p.code === candidateId)
    );
    if (parsed.isPartQr || matchedPart) {
      showToast(
        t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG),
        'error'
      );
      return;
    }

    let machineId = parsed.machineId || decodedText;
    let tenantFromQr = parsed.tenantId;

    const match = String(decodedText).match(/machine=([^&]+)/);
    if (match) machineId = match[1];

    const tMatch = String(decodedText).match(/tenant=([^&#]+)/);
    if (tMatch && !tenantFromQr) tenantFromQr = tMatch[1];

    if (tenantFromQr && tenantFromQr !== tenantId && user?.role !== 'superadmin') {
      showToast(t('machines.toasts.wrongTenant', 'Ta maszyna należy do innej firmy!'), 'error');
      return;
    }

    let targetMachine = findMachineByIdentifierOrPlate(
      machines,
      machineId,
      rawQr || decodedText
    );

    if (!targetMachine && machineId) {
      // Sprawdź czy w Firestore nie jest to część zamienna
      try {
        const partSnap = await getDoc(doc(db, 'tenants', tenantId, 'parts', machineId));
        if (partSnap.exists()) {
          showToast(
            t('machines.toasts.scannedPartInsteadOfMachine', PART_QR_IN_MACHINE_SCANNER_MSG),
            'error'
          );
          return;
        }
      } catch {}

      try {
        const d = await getDoc(doc(db, 'tenants', tenantId, 'machines', machineId));
        if (d.exists()) {
          targetMachine = { id: d.id, ...d.data() };
        }
      } catch {}
    }

    if (targetMachine) {
      setSelectedMachine(targetMachine);
      setStep('form');
    } else {
      setSelectedMachine({ id: 'manual', name: 'Nieznana Maszyna', manualInput: machineId });
      setStep('form');
    }
  };

  const handleStepChange = newStep => {
    setStep(newStep);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-3 sm:p-6 animate-fade-in">
      <div className="mb-4 sm:mb-6 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <i className="ph ph-warning-circle text-purple-600 text-3xl"></i>
          {t('scanner.internalTitle', 'Zgłoszenie awarii (Wewnętrzne)')}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <i className="ph ph-arrow-left"></i> {t('common.back', 'Wróć')}
        </button>
        {(toastConfig.show || toastConfig.visible) && (
          <Toast {...toastConfig} onClose={hideToast} />
        )}
      </div>
      {step === 'scan' && (
        <div className="w-full flex-1 flex flex-col">
          <OperatorScanner onScanSuccess={handleScanSuccess} machines={machines} />
        </div>
      )}

      {step === 'form' && (
        <div className="w-full flex-1 bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <i className="ph ph-file-text text-blue-600 text-xl"></i>{' '}
            {t('scanner.formTitle', 'Formularz zgłoszenia')}
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
        <div className="w-full flex-1 bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center animate-scale-in">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <i className="ph ph-check-circle text-6xl"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
            {t('scanner.sentTitle', 'Zgłoszenie wysłane')}
          </h2>
          <p className="text-slate-500 mb-8 max-w-md">
            Zgłoszenie awarii maszyny{' '}
            <span className="font-bold text-gray-800">{selectedMachine?.name}</span> zostało
            pomyślnie dodane do bazy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setSelectedMachine(null);
                setStep('scan');
              }}
              className="px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {t('scanner.reportAnother', 'Zgłoś kolejną awarię')}
            </button>
            <button
              onClick={() => navigate('/manager/ur/tickets')}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 cursor-pointer"
            >
              {t('scanner.goToTickets', 'Przejdź do zgłoszeń')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
