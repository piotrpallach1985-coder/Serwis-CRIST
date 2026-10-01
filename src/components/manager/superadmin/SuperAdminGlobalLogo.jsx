import React from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SuperAdminGlobalLogo({ 
  globalAppLogoUrl,
  globalAppLogoRef,
  uploadingLogo,
  processGlobalAppLogo
}) {
  const { t } = useTranslation();

  return (
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
          <h2 className="text-lg font-bold text-slate-800">{t("dashboards.superadmin.logo_title")}</h2>
          <p className="text-sm text-slate-500 max-w-md">To logo bêdzie wyœwietlane w lewym górnym rogu u wszystkich klientów (tenantów) niezale¿nie od ich w³asnego brandingu.</p>
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
          <Upload size={18} /> {uploadingLogo ? 'Wgrywanie...' : 'Zmieñ Logo G³ówne'}
        </button>
      </div>
    </div>
  );
}
