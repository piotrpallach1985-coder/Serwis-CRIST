import React from 'react';
import { Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { INDUSTRY_PROFILES } from '../../../utils/fieldServiceHelpers';

export default function SuperAdminTenantModal({
  isModalOpen,
  setIsModalOpen,
  isEditing,
  formData,
  setFormData,
  handleSave,
  fileInputRef,
  processCompanyLogo,
  uploadingLogo
}) {
  const { t } = useTranslation();
  if (!isModalOpen) return null;

  const selectedProfile = formData.industryProfile || 'industrial';
  const profileOptions = [
    {
      id: 'industrial',
      icon: 'ph-factory',
      title: t('dashboards.superadmin.profile_industrial_title', INDUSTRY_PROFILES.industrial.name),
      desc: t('dashboards.superadmin.profile_industrial_desc', INDUSTRY_PROFILES.industrial.description),
      activeColor: 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20',
      iconColor: 'text-slate-700 bg-slate-200/70'
    },
    {
      id: 'facility',
      icon: 'ph-buildings',
      title: t('dashboards.superadmin.profile_facility_title', INDUSTRY_PROFILES.facility.name),
      desc: t('dashboards.superadmin.profile_facility_desc', INDUSTRY_PROFILES.facility.description),
      activeColor: 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20',
      iconColor: 'text-amber-700 bg-amber-100'
    },
    {
      id: 'hvac',
      icon: 'ph-snowflake',
      title: t('dashboards.superadmin.profile_hvac_title', INDUSTRY_PROFILES.hvac.name),
      desc: t('dashboards.superadmin.profile_hvac_desc', INDUSTRY_PROFILES.hvac.description),
      activeColor: 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20',
      iconColor: 'text-cyan-700 bg-cyan-100'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Sliders className="text-blue-600" />
            {isEditing ? t("dashboards.superadmin.edit_client_title", "Edycja Klienta") : t("dashboards.superadmin.new_client_title", "Nowy Klient")}
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
              <h4 className="text-sm font-bold text-slate-700 mb-1">{t("dashboards.superadmin.client_logo", "Logo Klienta")}</h4>
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
                {uploadingLogo ? t("dashboards.superadmin.uploading", "Wgrywanie...") : t("dashboards.superadmin.upload_client_logo", "Wgraj Logo")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{t("dashboards.superadmin.company_id_label", "ID Firmy (Silos) *")}</label>
              <input 
                type="text" 
                value={formData.id} 
                onChange={e => setFormData({...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                placeholder={t("dashboards.superadmin.company_id_placeholder", "np. gdynia, stocznia")}
                required 
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{t("dashboards.superadmin.full_name_label", "Pełna Nazwa *")}</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("dashboards.superadmin.full_name_placeholder", "np. VexoNT")}
                required 
              />
            </div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 text-sm flex items-center gap-2">
              <i className="ph ph-briefcase text-blue-600 text-base"></i>
              {t("dashboards.superadmin.industry_profile_label", "Rodzaj Firmy / Profil Branżowy *")}
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              {t("dashboards.superadmin.industry_profile_hint", "Wybór profilu dostosowuje nazewnictwo obiektów oraz wygląd Kart Serwisu, Kart Awarii i protokołów PDF (UR / c-KOB / F-Gazy CRO).")}
            </p>
            <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label={t("dashboards.superadmin.industry_profile_label", "Rodzaj Firmy / Profil Branżowy")}>
              {profileOptions.map(opt => {
                const isSelected = selectedProfile === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`industry-profile-option-${opt.id}`}
                    onClick={() => setFormData({ ...formData, industryProfile: opt.id })}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? opt.activeColor
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${opt.iconColor}`}>
                      <i className={`ph ${opt.icon} text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{opt.title}</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <i className="ph ph-check text-[10px] font-bold"></i>}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 text-sm">{t("dashboards.superadmin.subscription_limits", "Limity Abonamentowe")}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">{t("dashboards.superadmin.max_users", "Max Użytkowników")}</label>
                <input 
                  type="number" 
                  value={formData.maxUsers} 
                  onChange={e => setFormData({...formData, maxUsers: e.target.value})} 
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">{t("dashboards.superadmin.max_machines", "Max Maszyn")}</label>
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
            <h4 className="font-bold text-blue-900 mb-3 border-b border-blue-200/50 pb-2 text-sm">{t("dashboards.superadmin.purchased_modules", "Zakupione Moduły")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100">
                <input 
                  type="checkbox" 
                  checked={formData.modules.planned_services !== false}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, planned_services: e.target.checked}})}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">{t("dashboards.superadmin.opt_planned_dtr", "Opcja: Panel Serwisu (DTR)")}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100">
                <input 
                  type="checkbox" 
                  checked={formData.modules.inventory !== false}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, inventory: e.target.checked}})}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">{t("dashboards.superadmin.opt_inventory", "Opcja: Magazyn części zamiennych")}</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              {t("dashboards.superadmin.cancel", "Anuluj")}
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              {isEditing ? t("dashboards.superadmin.save_changes", "Zapisz Zmiany") : t("dashboards.superadmin.create_company", "Utwórz Firmę")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
