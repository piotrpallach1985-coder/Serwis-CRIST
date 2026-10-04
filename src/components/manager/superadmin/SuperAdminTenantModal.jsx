import React from 'react';
import { Sliders } from 'lucide-react';

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
  if (!isModalOpen) return null;

  return (
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
                onChange={e => setFormData({...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                placeholder="np. gdynia, stocznia"
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
                placeholder="np. VexoNT"
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

              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100">
                <input 
                  type="checkbox" 
                  checked={formData.modules.inventory !== false}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, inventory: e.target.checked}})}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Opcja: Magazyn części zamiennych</span>
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
  );
}
