import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { useToast } from '../../hooks/useToast';
import { useManagerStore } from '../../store/managerStore';
import { fetchAllTenantsStats, subscribeToTenants, subscribeToGlobalSettings, saveGlobalGroqApiKey as saveGlobalKey } from '../../services/admin.service';

import SuperAdminStats from './superadmin/SuperAdminStats';
import SuperAdminGlobalLogo from './superadmin/SuperAdminGlobalLogo';
import SuperAdminGlobalGroqKey from './superadmin/SuperAdminGlobalGroqKey';
import SuperAdminTenantTable from './superadmin/SuperAdminTenantTable';
import SuperAdminTenantModal from './superadmin/SuperAdminTenantModal';

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
  const [globalGroqApiKey, setGlobalGroqApiKey] = useState('');

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
    aiTokensGroq: aiUsageMap[tenantItem.id]?.groqTokens || 0
  }));

  const totalGeminiTokens = tenantsWithTokens.reduce((sum, t) => sum + (t.aiTokensGemini || 0), 0);
  const totalGroqTokens = tenantsWithTokens.reduce((sum, t) => sum + (t.aiTokensGroq || 0), 0);

  useEffect(() => {
    if (user?.role !== 'superadmin') return;

    const unsub = subscribeToTenants((snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("SuperAdmin error:", err);
      showToast("Błąd pobierania rejestru firm: " + err.message, "error");
      setLoading(false);
    });

    const unsubGlobal = subscribeToGlobalSettings((docSnap) => {
      if (docSnap.exists()) {
        setGlobalAppLogoUrl(docSnap.data().appLogoUrl || '');
        setGlobalGroqApiKey(docSnap.data().groqApiKey || '');
      }}, (err) => { console.debug("SA onSnapshot err:", err.code); });

    return () => { unsub(); unsubGlobal(); };
  }, [user]);

  const saveGlobalGroqApiKey = async (e) => {
    if(e) e.preventDefault();
    try {
      await saveGlobalKey(globalGroqApiKey);
      showToast('Globalny klucz AI został zapisany.', 'success');
    } catch (err) {
      showToast('Błąd zapisywania klucza: ' + err.message, 'error');
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
    const storageRef = ref(storage, 'branding/' + formData.id + '_' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => { showToast('Błąd wgrywania: ' + error.message, 'error'); setUploadingLogo(false); }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, companyLogoUrl: downloadURL, companyLogoBase64: base64Data }));
        setUploadingLogo(false);
        setUploadProgress(0);
        showToast('Logo firmy wgrane pomyślnie!', 'success');
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
      (error) => { showToast('Błąd wgrywania: ' + error.message, 'error'); setUploadingLogo(false); }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const { saveGlobalAppLogo } = await import('../../services/admin.service');
        await saveGlobalAppLogo(downloadURL, base64Data, tenants);
        setUploadingLogo(false);
        setUploadProgress(0);
        showToast('Logo aplikacji zmienione dla wszystkich firm!', 'success');
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
    if (!formData.id.trim() || !formData.name.trim()) return showToast('Podaj unikalne ID i pełną nazwę.', 'error');
    if (!isEditing && !/^[a-z0-9]+$/.test(formData.id)) return showToast('ID firmy może zawierać tylko małe litery i cyfry.', 'error');

    try {
      const { saveTenant } = await import('../../services/admin.service');
      await saveTenant(formData, isEditing);
      showToast(isEditing ? 'Dane firmy zostały zaktualizowane.' : 'Firma została pomyślnie dodana!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`UWAGA! Chcesz usunąć firmę ${id} z rejestru? To natychmiast odetnie dostęp jej pracownikom.`)) {
      try {
        const { deleteTenant } = await import('../../services/admin.service');
        await deleteTenant(id);
        showToast('Firma usunięta z rejestru.', 'success');
      } catch (err) {
        showToast('Błąd usuwania: ' + err.message, 'error');
      }
    }
  };

  if (user?.role !== 'superadmin') {
    return <div className="p-8 text-center text-red-500 font-bold">Brak uprawnień. Ten panel jest tylko dla Super Administratora (Właściciela SaaS).</div>;
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
        />

        <SuperAdminStats 
          totalGeminiTokens={totalGeminiTokens} 
          totalGroqTokens={totalGroqTokens} 
        />

        <SuperAdminGlobalGroqKey
          globalGroqApiKey={globalGroqApiKey}
          setGlobalGroqApiKey={setGlobalGroqApiKey}
          saveGlobalGroqApiKey={saveGlobalGroqApiKey}
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
