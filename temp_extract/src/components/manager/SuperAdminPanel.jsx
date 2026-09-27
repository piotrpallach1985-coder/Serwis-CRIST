import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useToast } from '../../hooks/useToast';
import { useManagerStore } from '../../store/managerStore';
import { Plus, Trash, Crown, Sliders, CheckCircle, Pencil, Upload } from 'lucide-react';

export default function SuperAdminPanel({ user, onNavigate }) {
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

  // Global App Logo State
  const [globalAppLogoUrl, setGlobalAppLogoUrl] = useState('');

  const initialFormState = {
    id: '',
    name: '',
    contactEmail: '',
    maxUsers: 10,
    maxMachines: 50,
    companyLogoUrl: '',
    companyLogoBase64: '',
    modules: { tickets: true, planned_services: true, map: true, kpi: true, inventory: false }
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (user?.role !== 'superadmin') return;

    const unsub = onSnapshot(collection(db, 'tenant_registry'), (snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("SuperAdmin error:", err);
      showToast("Błąd pobierania rejestru firm: " + err.message, "error");
      setLoading(false);
    });

    // Fetch Global App Logo from a global config document
    const unsubGlobal = onSnapshot(doc(db, 'tenant_registry', '_global_settings_'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalAppLogoUrl(docSnap.data().appLogoUrl || '');
      }
    });

    return () => { unsub(); unsubGlobal(); };
  }, [user]);

  const compressImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processCompanyLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    const base64Data = await compressImageToBase64(file);
    const storageRef = ref(storage, 'branding/company_' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      }, 
      (error) => {
        console.error(error);
        showToast('Błąd wgrywania logo: ' + error.message, 'error');
        setUploadingLogo(false);
      }, 
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
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      }, 
      (error) => {
        console.error(error);
        showToast('Błąd wgrywania globalnego logo: ' + error.message, 'error');
        setUploadingLogo(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Save to global settings
        await setDoc(doc(db, 'tenant_registry', '_global_settings_'), {
          appLogoUrl: downloadURL,
          appLogoBase64: base64Data
        }, { merge: true });

        // Broadcast to ALL existing tenants
        const promises = tenants.map(t => 
          setDoc(doc(db, 'tenants', t.id, 'settings', 'branding'), {
            appLogoUrl: downloadURL,
            appLogoBase64: base64Data
          }, { merge: true })
        );
        await Promise.all(promises);

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
    if (!formData.id.trim() || !formData.name.trim()) {
      return showToast('Podaj unikalne ID i pełną nazwę.', 'error');
    }
    
    if (!isEditing && !/^[a-z0-9]+$/.test(formData.id)) {
      return showToast('ID firmy może zawierać tylko małe litery i cyfry, bez spacji.', 'error');
    }

    try {
      const tenantRef = doc(db, 'tenant_registry', formData.id);

      if (isEditing) {
        await updateDoc(tenantRef, {
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim(),
          limits: {
            maxUsers: parseInt(formData.maxUsers) || 10,
            maxMachines: parseInt(formData.maxMachines) || 50
          },
          companyLogoUrl: formData.companyLogoUrl,
          companyLogoBase64: formData.companyLogoBase64,
          modules: { ...formData.modules, tickets: true, map: true, kpi: true }
        });
        showToast('Dane firmy zostały zaktualizowane.', 'success');
      } else {
        await setDoc(tenantRef, {
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim(),
          limits: {
            maxUsers: parseInt(formData.maxUsers) || 10,
            maxMachines: parseInt(formData.maxMachines) || 50
          },
          companyLogoUrl: formData.companyLogoUrl,
          companyLogoBase64: formData.companyLogoBase64,
          modules: { ...formData.modules, tickets: true, map: true, kpi: true },
          createdAt: serverTimestamp(),
          status: 'active'
        });
        showToast('Firma została pomyślnie dodana!', 'success');
      }

      // Sync settings to the tenant's own database subcollection
      await setDoc(doc(db, 'tenants', formData.id, 'settings', 'branding'), {
        companyName: formData.name.trim(),
        systemSubtitle: 'DYSPOZYTORNIA UR',
        companyLogoUrl: formData.companyLogoUrl,
        companyLogoBase64: formData.companyLogoBase64,
        modules: { ...formData.modules, tickets: true, map: true, kpi: true }
      }, { merge: true });
      
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`UWAGA! Chcesz usunąć firmę ${id} z rejestru? To nie usunie jej fizycznych danych, ale natychmiast odetnie dostęp jej pracownikom.`)) {
      try {
        await deleteDoc(doc(db, 'tenant_registry', id));
        showToast('Firma usunięta z rejestru.', 'success');
      } catch (err) {
        showToast('Błąd usuwania: ' + err.message, 'error');
      }
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="p-6 text-center text-red-500">
        <Crown className="mx-auto text-6xl mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Brak uprawnień</h2>
        <p>Ten panel jest dostępny wyłącznie dla SuperAdministratora (SaaS).</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 h-full overflow-y-auto overflow-x-hidden">
      
      {/* Global Branding Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden shrink-0">
            {globalAppLogoUrl ? (
              <img src={globalAppLogoUrl} alt="App Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <i className="ph ph-image text-3xl text-slate-400"></i>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Globalne Logo Aplikacji</h2>
            <p className="text-sm text-slate-500 max-w-md">To logo będzie wyświetlane w lewym górnym rogu u wszystkich klientów (tenantów) niezależnie od ich własnego brandingu.</p>
          </div>
        </div>
        
        <div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={globalAppLogoRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processGlobalAppLogo(e.target.files[0]);
              }
            }} 
          />
          <button 
            onClick={() => globalAppLogoRef.current.click()}
            disabled={uploadingLogo}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md whitespace-nowrap disabled:opacity-50"
          >
            <Upload size={18} /> {uploadingLogo ? 'Wgrywanie...' : 'Zmień Logo Główne'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-gray-900 to-blue-900 text-white p-4 sm:p-6 rounded-2xl shadow-lg gap-4 w-full">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 truncate">
            <Crown className="text-yellow-400" /> Super Panel SaaS
          </h1>
          <p className="text-gray-300 mt-2 text-sm sm:text-base">Zarządzanie klientami (Multi-Tenancy) i ich licencjami</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> Nowy Klient (Firma)
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Ładowanie rejestru firm...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID (Silos)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Klienta</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aktywne Moduły</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Zarządzaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.filter(t => t.id !== '_global_settings_').map(tenant => (
                  <tr key={tenant.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 w-16">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                         {tenant.companyLogoUrl ? (
                           <img src={tenant.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                         ) : (
                           <span className="text-slate-400 font-bold text-xs">{tenant.id.substring(0, 2).toUpperCase()}</span>
                         )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100/50 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200/50 flex items-center w-max gap-1.5">
                        <i className="ph ph-database"></i> {tenant.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{tenant.name}</div>
                      {tenant.contactEmail && <div className="text-xs text-gray-500 mt-0.5">{tenant.contactEmail}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {tenant.modules?.map && <span className="text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200/60 font-semibold"><CheckCircle size={12}/> Mapa</span>}
                        {tenant.modules?.planned_services && <span className="text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200/60 font-semibold"><CheckCircle size={12}/> Serwisy</span>}
                        {tenant.modules?.kpi && <span className="text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200/60 font-semibold"><CheckCircle size={12}/> KPI</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        
                        <button 
                          onClick={() => {
                            setTenantId(tenant.id);
                            showToast('Zalogowano jako zarządca firmy: ' + tenant.name, 'success');
                            if (onNavigate) onNavigate('home', 'home');
                          }}
                          className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 flex items-center gap-1 font-bold text-xs uppercase"
                          title="Wejdź do panelu tej firmy"
                        >
                          <i className="ph ph-sign-in text-xl"></i> Wejdź
                        </button>
                        <button 
                          onClick={() => openEditModal(tenant)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                          title="Edytuj dane i licencje"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tenant.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                          title="Usuń z rejestru (zablokuj)"
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Formularza */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Sliders className="text-blue-600" />
                {isEditing ? 'Edycja Klienta' : 'Nowy Klient'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
              
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-slate-300 overflow-hidden shrink-0">
                  {formData.companyLogoUrl ? (
                    <img src={formData.companyLogoUrl} alt="Logo firmy" className="w-full h-full object-contain p-1" />
                  ) : (
                    <i className="ph ph-buildings text-2xl text-slate-400"></i>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Logo Klienta</h4>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processCompanyLogo(e.target.files[0]);
                      }
                    }} 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingLogo}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {uploadingLogo ? 'Wgrywanie...' : 'Wgraj Logo'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">ID Firmy (Silos) *</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    onChange={e => setFormData({...formData, id: e.target.value.toLowerCase()})} 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                    placeholder="np. crist, gdynia"
                    required 
                    disabled={isEditing}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Pełna Nazwa *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="np. CRIST S.A."
                    required 
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 text-sm">Limity Abonamentowe</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-semibold">Max Użytkowników</label>
                    <input 
                      type="number" 
                      value={formData.maxUsers} 
                      onChange={e => setFormData({...formData, maxUsers: e.target.value})} 
                      className="w-full border-gray-300 rounded-lg shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-semibold">Max Maszyn</label>
                    <input 
                      type="number" 
                      value={formData.maxMachines} 
                      onChange={e => setFormData({...formData, maxMachines: e.target.value})} 
                      className="w-full border-gray-300 rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3 border-b border-blue-200/50 pb-2 text-sm">Zakupione Moduły</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <input 
                          type="checkbox" 
                          checked={formData.modules.planned_services !== false}
                          onChange={e => setFormData({...formData, modules: {...formData.modules, planned_services: e.target.checked}})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">Opcja: Panel Serwisu (DTR)</span>
                      </label>
                      
                    </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  {isEditing ? 'Zapisz Zmiany' : 'Utwórz Firmę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
