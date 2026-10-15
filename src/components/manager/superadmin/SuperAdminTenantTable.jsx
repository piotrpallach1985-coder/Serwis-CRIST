import React from 'react';
import { Crown, Plus, CheckCircle, Trash } from 'lucide-react';

export default function SuperAdminTenantTable({
  tenantsWithTokens,
  loading,
  openNewModal,
  openEditModal,
  handleDelete,
  globalGeminiPrice = 0.60,
  globalGroqPrice = 0.40
}) {
  return (
    <>
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
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Logo</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">ID (Silos)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-64">Nazwa Klienta</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aktywne Moduły</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">AI (Tokeny)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-48">Zarządzaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {tenantsWithTokens.filter(tenantItem => tenantItem.id !== '_global_settings_').map(tenant => (
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
                    <td className="p-4 w-32">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono font-bold flex items-center gap-1 w-max">
                        <i className="ph ph-database"></i> {tenant.id}
                      </span>
                    </td>
                    <td className="p-4 w-64">
                      <div className="font-bold text-slate-800">{tenant.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                         {tenant.modules && (Array.isArray(tenant.modules) ? tenant.modules : Object.entries(tenant.modules).filter(([_, v]) => v).map(([m]) => m)).map(m => (
                           <span key={m} className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-medium flex items-center gap-1">
                             <CheckCircle size={10} /> {m.charAt(0).toUpperCase() + m.slice(1)}
                           </span>
                         ))}
                      </div>
                    </td>
                    <td className="p-4 w-48">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Biling Klienta (Śr. stawki)</div>
                          <div className="flex items-center justify-between text-slate-700 font-mono text-[11px]">
                            <span>Gemini: {tenant.aiTokensGemini?.toLocaleString('pl-PL') || 0}</span>
                            <span>Audio: {tenant.whisperSeconds ? (tenant.whisperSeconds / 60).toFixed(1) + 'm' : '0m'}</span>
                          </div>
                          <div className="text-[10px] text-blue-700 font-bold mt-0.5">
                            ~ {((tenant.aiCostGroq !== undefined ? tenant.aiCostGroq : ((tenant.whisperSeconds || 0) / 60) * globalGroqPrice) + (tenant.aiCostGemini !== undefined ? tenant.aiCostGemini : ((tenant.aiTokensGemini || 0) / 1000000) * globalGeminiPrice)).toFixed(2)} PLN
                          </div>
                        </div>

                        <div className="bg-purple-50/70 p-1.5 rounded border border-purple-200">
                          <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center justify-between">
                            <span>Google Vertex AI (API)</span>
                            <span className="font-mono">{tenant.vertexCalls || 0} wyw.</span>
                          </div>
                          <div className="text-slate-700 font-mono text-[11px] mt-0.5">
                            {tenant.vertexTokens?.toLocaleString('pl-PL') || 0} tok
                          </div>
                          <div className="text-[10px] text-purple-700 font-bold mt-0.5">
                            ~ {(tenant.vertexCost !== undefined ? tenant.vertexCost : ((tenant.vertexTokens || 0) / 1000000) * globalGeminiPrice).toFixed(2)} PLN
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(tenant)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                        title="Edytuj dane i licencje"
                      >
                        <span className="font-bold text-xs uppercase px-2">EDYTUJ</span>
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
    </>
  );
}
