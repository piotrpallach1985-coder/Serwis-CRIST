import React from 'react';
import { Crown, Plus, CheckCircle, Trash } from 'lucide-react';

export default function SuperAdminTenantTable({
  tenantsWithTokens,
  loading,
  openNewModal,
  openEditModal,
  handleDelete,
  globalGeminiPrice = 0.60,
  globalTranscribePrice = 0.40,
  globalGroqPrice = 0.40
}) {
  const audioPrice = globalTranscribePrice ?? globalGroqPrice;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-gray-900 to-blue-900 text-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-lg gap-3 w-full">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 truncate">
            <Crown className="text-yellow-400" size={22} /> Super Panel SaaS
          </h1>
          <p className="text-gray-300 mt-0.5 text-xs sm:text-sm">Zarządzanie klientami (Multi-Tenancy) i ich licencjami</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Nowy Klient (Firma)
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 font-medium text-sm">Ładowanie rejestru firm...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/90 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-12">Logo</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-28">ID (Silos)</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-48">Nazwa Klienta</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktywne Moduły</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-64">AI (Tokeny i Koszty)</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-36">Zarządzaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenantsWithTokens.filter(tenantItem => tenantItem.id !== '_global_settings_').map(tenant => {
                  const hasPlannedDtr = tenant.modules?.planned_services !== false;
                  const hasInventory = tenant.modules?.inventory !== false;
                  const activeModules = [
                    ...(hasPlannedDtr ? ['Panel Serwisu (DTR)'] : []),
                    ...(hasInventory ? ['Magazyn części zamiennych'] : [])
                  ];

                  const clientAiCost = (
                    (tenant.aiCostGroq !== undefined ? tenant.aiCostGroq : ((tenant.whisperSeconds || 0) / 60) * audioPrice) +
                    (tenant.aiCostGemini !== undefined ? tenant.aiCostGemini : ((tenant.aiTokensGemini || 0) / 1000000) * globalGeminiPrice)
                  ).toFixed(2);

                  const vertexAiCost = (
                    tenant.vertexCost !== undefined
                      ? tenant.vertexCost
                      : ((tenant.vertexTokens || 0) / 1000000) * globalGeminiPrice
                  ).toFixed(2);

                  return (
                    <tr key={tenant.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 w-12">
                        <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden border border-slate-200">
                          {tenant.companyLogoUrl ? (
                            <img src={tenant.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <span className="text-slate-400 font-bold text-[10px]">{tenant.id.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 w-28">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-mono font-bold inline-flex items-center gap-1">
                          <i className="ph ph-database"></i> {tenant.id}
                        </span>
                      </td>
                      <td className="py-2 px-3 w-48">
                        <div className="font-bold text-slate-800 text-sm leading-tight truncate">{tenant.name}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {activeModules.length > 0 ? (
                            activeModules.map(label => (
                              <span key={label} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold inline-flex items-center gap-1">
                                <CheckCircle size={11} /> {label}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[11px] font-medium">
                              Pakiet Podstawowy (Awarie)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 w-64">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-600 font-mono truncate">
                              Gem: {tenant.aiTokensGemini?.toLocaleString('pl-PL') || 0} | Aud: {tenant.whisperSeconds ? (tenant.whisperSeconds / 60).toFixed(1) + 'm' : '0m'}
                            </span>
                            <span className="text-blue-700 font-bold whitespace-nowrap">~{clientAiCost} PLN</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-purple-50/70 px-2 py-1 rounded border border-purple-200">
                            <span className="text-purple-800 font-mono truncate">
                              Vertex: {tenant.vertexTokens?.toLocaleString('pl-PL') || 0} ({tenant.vertexCalls || 0} wyw.)
                            </span>
                            <span className="text-purple-700 font-bold whitespace-nowrap">~{vertexAiCost} PLN</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => openEditModal(tenant)}
                            className="text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 font-bold text-[11px] uppercase"
                            title="Edytuj dane i licencje"
                          >
                            Edytuj
                          </button>
                          <button 
                            onClick={() => handleDelete(tenant.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                            title="Usuń z rejestru (zablokuj)"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
