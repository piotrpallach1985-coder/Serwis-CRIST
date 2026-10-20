import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { useToast } from '../../hooks/useToast';
import { useManagerStore } from '../../store/managerStore';
import { fetchAllTenantsStats, subscribeToTenants, subscribeToGlobalSettings, subscribeToGlobalSecrets, saveGlobalAIConfig as saveGlobalKey } from '../../services/admin.service';


import SuperAdminGlobalLogo from './superadmin/SuperAdminGlobalLogo';
import SuperAdminAIHub from './superadmin/SuperAdminAIHub';
import SuperAdminTenantTable from './superadmin/SuperAdminTenantTable';
import SuperAdminTenantModal from './superadmin/SuperAdminTenantModal';

import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SuperAdminPanel({ onNavigate }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();
  const setTenantId = useManagerStore(state => state.setTenantId);
  const fileInputRef = useRef(null);
  const globalAppLogoRef = useRef(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [globalAppLogoUrl, setGlobalAppLogoUrl] = useState('');
    const [globalGeminiModel, setGlobalGeminiModel] = useState('gemini-3.8-flash');
  const [globalTranscribeModel, setGlobalTranscribeModel] = useState('gemini-3.5-transcribe');
  const [globalGeminiPrice, setGlobalGeminiPrice] = useState(0.60);
  const [globalTranscribePrice, setGlobalTranscribePrice] = useState(0.40);

  const initialFormState = {
    id: '',
    name: '',
    contactEmail: '',
    maxUsers: 10,
    maxMachines: 50,
    groqApiKey: '',
    companyLogoUrl: '',
    companyLogoBase64: '',
    modules: { tickets: true, planned_services: true, map: true, kpi: true, inventory: false }
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [aiUsageMap, setAiUsageMap] = useState({});

  useEffect(() => {
    const fetchUsage = async () => {
      const usages = await fetchAllTenantsStats(tenants);
      setAiUsageMap(usages);
    };
    if (tenants.length > 0) fetchUsage();
  }, [tenants]);

  const tenantsWithTokens = tenants.map(tenantItem => ({
    ...tenantItem,
    aiTokensGemini: aiUsageMap[tenantItem.id]?.geminiTokens || 0,
    aiCostGemini: aiUsageMap[tenantItem.id]?.geminiCost,
    aiCostGroq: aiUsageMap[tenantItem.id]?.groqCost,
    aiTokensGroq: aiUsageMap[tenantItem.id]?.groqTokens || 0,
    whisperSeconds: aiUsageMap[tenantItem.id]?.whisperSeconds || 0,
    vertexTokens: aiUsageMap[tenantItem.id]?.vertexTokens || 0,
    vertexCost: aiUsageMap[tenantItem.id]?.vertexCost,
    vertexCalls: aiUsageMap[tenantItem.id]?.vertexCalls || 0
  }));

  const totalGeminiTokens = tenantsWithTokens.reduce((sum, t) => sum + (t.aiTokensGemini || 0), 0);
  const totalGeminiCost = tenantsWithTokens.reduce((sum, t) => sum + (t.aiCostGemini !== undefined ? t.aiCostGemini : ((t.aiTokensGemini || 0) / 1000000) * globalGeminiPrice), 0);
  const totalGroqCost = tenantsWithTokens.reduce((sum, t) => sum + (t.aiCostGroq !== undefined ? t.aiCostGroq : ((t.whisperSeconds || 0) / 60) * globalTranscribePrice), 0);
  const totalGroqTokens = tenantsWithTokens.reduce((sum, t) => sum + (t.aiTokensGroq || 0), 0);
  const totalWhisperSeconds = tenantsWithTokens.reduce((sum, t) => sum + (t.whisperSeconds || 0), 0);
  const totalVertexTokens = tenantsWithTokens.reduce((sum, t) => sum + (t.vertexTokens || 0), 0);
  const totalVertexCost = tenantsWithTokens.reduce((sum, t) => sum + (t.vertexCost !== undefined ? t.vertexCost : ((t.vertexTokens || 0) / 1000000) * globalGeminiPrice), 0);
  const totalVertexCalls = tenantsWithTokens.reduce((sum, t) => sum + (t.vertexCalls || 0), 0);

  useEffect(() => {
    if (user?.role !== 'superadmin') return;

    const unsub = subscribeToTenants((snapshot) => {
      const filteredTenants = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.id !== '_global_settings_' && t.id !== '_global_secrets_');
      setTenants(filteredTenants);
      setLoading(false);
    }, (err) => {
      console.error("SuperAdmin error:", err);
      showToast(t("dashboards.superadmin.fetch_tenants_error", "Błąd pobierania rejestru firm: ") + err.message, "error");
      setLoading(false);
    });

    const unsubGlobal = subscribeToGlobalSettings((docSnap) => {
      if (docSnap.exists()) {
        setGlobalAppLogoUrl(docSnap.data().appLogoUrl || '');
      }
    });

    const unsubSecrets = subscribeToGlobalSecrets((docSnap) => {
      if (docSnap.exists()) {
                setGlobalTranscribeModel(docSnap.data().transcribeModel || 'gemini-3.5-transcribe');
        setGlobalGeminiModel(docSnap.data().geminiModel || 'gemini-3.8-flash');
        if (docSnap.data().geminiPrice !== undefined) setGlobalGeminiPrice(docSnap.data().geminiPrice);
        if (docSnap.data().transcribePrice !== undefined) setGlobalTranscribePrice(docSnap.data().transcribePrice);
      }
    });

    return () => { unsub(); unsubGlobal(); if (unsubSecrets) unsubSecrets(); };
  }, [user]);

  // MIGRATION: Initialize missing costs
  useEffect(() => {
    const runMigration = async () => {
      try {
        for (const t of tenants) {
          if (t.id === '_global_settings_') continue;
          const snap = await getDoc(doc(db, 'tenants', t.id, 'stats', 'ai_usage'));
          if (snap.exists()) {
            const data = snap.data();
            let updates = {};
            if (data.geminiTokens > 0 && data.geminiCost === undefined) {
              updates.geminiCost = (data.geminiTokens / 1000000) * globalGeminiPrice;
            }
            if (data.groqTokens > 0 && data.whisperSeconds === undefined) {
                updates.whisperSeconds = Math.ceil(data.groqTokens * 0.26); // roughly 13500 tokens = 3600s => 1 token = 0.26s
              }
              if (data.groqTokens > 0 && data.groqCost === undefined) {
              updates.groqCost = (data.groqTokens / 1000000) * globalTranscribePrice;
            }
            if (Object.keys(updates).length > 0) {
              await setDoc(doc(db, 'tenants', t.id, 'stats', 'ai_usage'), updates, { merge: true });
              console.log(`Migrated ${t.id}`);
            }
          }
        }
      } catch (err) {
        console.error("Migration err:", err);
      }
    };
    if (tenants.length > 0) {
      runMigration();
    }
  }, [tenants, globalGeminiPrice, globalTranscribePrice]);

  const saveGlobalAIConfig = async (e) => {
    if(e) e.preventDefault();
    try {
      await saveGlobalKey(globalTranscribeModel, globalGeminiPrice, globalTranscribePrice, globalGeminiModel);
      showToast(t('dashboards.superadmin.global_ai_saved', 'Globalny klucz AI został zapisany.'), 'success');
    } catch (err) {
      showToast(t('dashboards.superadmin.global_ai_save_error', 'Błąd zapisywania klucza: ') + err.message, 'error');
    }
  };

  const compressImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
      };
    });
  };

  const processCompanyLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    const base64Data = await compressImageToBase64(file);
    const storageRef = ref(storage, `tenants/${formData.id}/branding/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => { showToast(t('dashboards.superadmin.upload_error', 'Błąd wgrywania: ') + error.message, 'error'); setUploadingLogo(false); }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, companyLogoUrl: downloadURL, companyLogoBase64: base64Data }));
        setUploadingLogo(false);
        setUploadProgress(0);
        showToast(t('dashboards.superadmin.company_logo_uploaded', 'Logo firmy wgrane pomyślnie!'), 'success');
      }
    );
  };

  const processGlobalAppLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    const base64Data = await compressImageToBase64(file);
    const storageRef = ref(storage, 'branding/app_' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => { showToast(t('dashboards.superadmin.upload_error', 'Błąd wgrywania: ') + error.message, 'error'); setUploadingLogo(false); }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const { saveGlobalAppLogo } = await import('../../services/admin.service');
        await saveGlobalAppLogo(downloadURL, base64Data, tenants);
        setUploadingLogo(false);
        setUploadProgress(0);
        showToast(t('dashboards.superadmin.global_logo_changed', 'Logo aplikacji zmienione dla wszystkich firm!'), 'success');
      }
    );
  };

  const openNewModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tenant) => {
    setFormData({
      id: tenant.id,
      name: tenant.name || '',
      contactEmail: tenant.contactEmail || '',
      maxUsers: tenant.limits?.maxUsers || 10,
      maxMachines: tenant.limits?.maxMachines || 50,
      groqApiKey: tenant.groqApiKey || '',
      companyLogoUrl: tenant.companyLogoUrl || '',
      companyLogoBase64: tenant.companyLogoBase64 || '',
      modules: {
        map: tenant.modules?.map ?? true,
        planned_services: tenant.modules?.planned_services ?? true,
        kpi: tenant.modules?.kpi ?? true,
        inventory: tenant.modules?.inventory ?? false,
        tickets: tenant.modules?.tickets ?? true
      }
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) return showToast(t('dashboards.superadmin.provide_id_and_name', 'Podaj unikalne ID i pełną nazwę.'), 'error');
    if (!isEditing && !/^[a-z0-9]+$/.test(formData.id)) return showToast(t('dashboards.superadmin.id_alphanumeric_only', 'ID firmy może zawierać tylko małe litery i cyfry.'), 'error');

    try {
      const { saveTenant } = await import('../../services/admin.service');
      await saveTenant(formData, isEditing);
      showToast(isEditing ? t('dashboards.superadmin.company_updated', 'Dane firmy zostały zaktualizowane.') : t('dashboards.superadmin.company_added', 'Firma została pomyślnie dodana!'), 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('dashboards.superadmin.delete_confirm', { id, defaultValue: `UWAGA! Chcesz usunąć firmę ${id} z rejestru? To natychmiast odetnie dostęp jej pracownikom.` }))) {
      try {
        const { deleteTenant } = await import('../../services/admin.service');
        await deleteTenant(id);
        showToast(t('dashboards.superadmin.company_deleted', 'Firma usunięta z rejestru.'), 'success');
      } catch (err) {
        showToast(t('dashboards.superadmin.delete_error', 'Błąd usuwania: ') + err.message, 'error');
      }
    }
  };

  if (user?.role !== 'superadmin') {
    return <div className="p-8 text-center text-red-500 font-bold">{t('dashboards.superadmin.no_permission', 'Brak uprawnień. Ten panel jest tylko dla Super Administratora (Właściciela SaaS).')}</div>;
  }

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 bg-[#f8f9fa] overflow-y-auto animate-fade-in relative z-10">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        <SuperAdminGlobalLogo 
          globalAppLogoUrl={globalAppLogoUrl}
          globalAppLogoRef={globalAppLogoRef}
          uploadingLogo={uploadingLogo}
          processGlobalAppLogo={processGlobalAppLogo}
        />

        <SuperAdminTenantTable 
          tenantsWithTokens={tenantsWithTokens}
          loading={loading}
          openNewModal={openNewModal}
          openEditModal={openEditModal}
          handleDelete={handleDelete}
          globalGeminiPrice={globalGeminiPrice}
          globalTranscribePrice={globalTranscribePrice}
        />

        

        <SuperAdminAIHub 
          totalGeminiTokens={totalGeminiTokens} 
          totalWhisperSeconds={totalWhisperSeconds}
          totalGeminiCost={totalGeminiCost}
          totalGroqCost={totalGroqCost}
          totalVertexTokens={totalVertexTokens}
          totalVertexCost={totalVertexCost}
          totalVertexCalls={totalVertexCalls}
          saveGlobalAIConfig={saveGlobalAIConfig}
          globalTranscribeModel={globalTranscribeModel}
          setGlobalTranscribeModel={setGlobalTranscribeModel}
          globalGeminiPrice={globalGeminiPrice}
          setGlobalGeminiPrice={setGlobalGeminiPrice}
          globalTranscribePrice={globalTranscribePrice}
          setGlobalTranscribePrice={setGlobalTranscribePrice}
          globalGeminiModel={globalGeminiModel}
          setGlobalGeminiModel={setGlobalGeminiModel}
        />

      </div>

      <SuperAdminTenantModal 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        fileInputRef={fileInputRef}
        processCompanyLogo={processCompanyLogo}
        uploadingLogo={uploadingLogo}
      />
    </div>
  );
}
