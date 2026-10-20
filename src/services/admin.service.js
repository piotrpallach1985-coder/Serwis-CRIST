import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export const subscribeToTenants = (callback, onError) => {
  return onSnapshot(collection(db, 'tenant_registry'), callback, onError);
};

export const subscribeToGlobalSettings = (callback, onError) => {
  return onSnapshot(doc(db, 'tenant_registry', '_global_settings_'), callback, onError);
};

export const subscribeToGlobalSecrets = (callback, onError) => {
  return onSnapshot(doc(db, 'tenant_registry', '_global_secrets_'), callback, onError);
};

export const fetchTenantUsageStats = async (tenantId) => {
  if (tenantId === '_global_settings_') return null;
  try {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'stats', 'ai_usage'));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error(`Error fetching stats for ${tenantId}:`, err);
  }
  return null;
};

export const fetchAllTenantsStats = async (tenants) => {
  const usages = {};
  for (const t of tenants) {
    if (t.id === '_global_settings_') continue;
    const stats = await fetchTenantUsageStats(t.id);
    if (stats) {
      usages[t.id] = stats;
    }
  }
  return usages;
};

export const saveGlobalAIConfig = async (transcribeModel, geminiPrice = 0.60, transcribePrice = 0.40, geminiModel = 'gemini-3.8-flash') => {
  return setDoc(doc(db, 'tenant_registry', '_global_secrets_'), { transcribeModel: (transcribeModel || '').trim(), geminiPrice, transcribePrice, geminiModel: (geminiModel || '').trim() }, { merge: true });
};

export const saveGlobalAppLogo = async (downloadURL, base64Data, tenants) => {
  await setDoc(doc(db, 'tenant_registry', '_global_settings_'), {
    appLogoUrl: downloadURL,
    appLogoBase64: base64Data
  }, { merge: true });

  const promises = tenants.map(t => 
    setDoc(doc(db, 'tenants', t.id, 'settings', 'branding'), {
      appLogoUrl: downloadURL,
      appLogoBase64: base64Data
    }, { merge: true })
  );
  return Promise.all(promises);
};

export const saveTenant = async (formData, isEditing) => {
  const tenantRef = doc(db, 'tenant_registry', formData.id);
  const industryProfile = formData.industryProfile || 'industrial';
  const defaultSubtitles = {
    industrial: 'DYSPOZYTORNIA UR',
    facility: 'ZARZĄDZANIE NIERUCHOMOŚCIAMI (c-KOB)',
    hvac: 'SERWIS MOBILNY HVAC / F-GAZ',
  };
  const systemSubtitle = defaultSubtitles[industryProfile] || 'DYSPOZYTORNIA UR';

  const data = {
    name: formData.name.trim(),
    contactEmail: (formData.contactEmail || '').trim(),
    industryProfile,
    limits: {
      maxUsers: parseInt(formData.maxUsers) || 10,
      maxMachines: parseInt(formData.maxMachines) || 50
    },
    companyLogoUrl: formData.companyLogoUrl,
    companyLogoBase64: formData.companyLogoBase64,
    modules: formData.modules
  };

  if (isEditing) {
    await updateDoc(tenantRef, data);
  } else {
    data.createdAt = serverTimestamp();
    data.status = 'active';
    await setDoc(tenantRef, data);
  }

  await setDoc(doc(db, 'tenants', formData.id, 'settings', 'general'), {
    limits: data.limits,
    industryProfile
  }, { merge: true });

  await setDoc(doc(db, 'tenants', formData.id, 'settings', 'branding'), {
    companyName: data.name,
    systemSubtitle,
    industryProfile,
    companyLogoUrl: data.companyLogoUrl,
    companyLogoBase64: data.companyLogoBase64,
    modules: data.modules
  }, { merge: true });
};

export const deleteTenant = async (id) => {
  return deleteDoc(doc(db, 'tenant_registry', id));
};
