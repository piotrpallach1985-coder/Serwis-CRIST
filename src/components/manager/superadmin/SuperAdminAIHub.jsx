import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SuperAdminAIHub({
  totalGeminiTokens,
  totalWhisperSeconds,
  totalGeminiCost,
  totalGroqCost,
  totalVertexTokens = 0,
  totalVertexCost = 0,
  totalVertexCalls = 0,
  saveGlobalAIConfig,
  globalTranscribeModel,
  setGlobalTranscribeModel,
  globalGeminiPrice,
  setGlobalGeminiPrice,
  globalTranscribePrice,
  setGlobalTranscribePrice,
  globalGeminiModel,
  setGlobalGeminiModel
}) {
  const { t } = useTranslation();
  const [isEditingAIKey, setIsEditingAIKey] = useState(false);
  const showEditButton = !isEditingAIKey;
  const isReadOnly = showEditButton;

  const handleSaveKey = async (e) => {
    e.preventDefault();
    await saveGlobalAIConfig(e);
    setIsEditingAIKey(false);
  };
  
  const totalCost = (totalGeminiCost || 0) + (totalGroqCost || 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
         <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl border border-blue-100 flex items-center justify-center text-2xl shrink-0">
           <i className="ph ph-brain"></i>
         </div>
         <div>
           <h2 className="text-xl font-bold text-slate-800">{t("dashboards.superadmin.ai_hub_title", "Centrum Sztucznej Inteligencji (Google Vertex AI)")}</h2>
           <p className="text-sm text-slate-500">{t("dashboards.superadmin.ai_hub_subtitle", "Statystyki zużycia i globalna konfiguracja modeli")}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Licznik 1A: Klient - Analityka */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-blue-500 mb-2 text-2xl"><i className="ph ph-chat-teardrop-text"></i></div>
          <h3 className="text-sm font-bold text-slate-700">{t("dashboards.superadmin.analytical_usage_title", "Zużycie Analityczne (Klient)")}</h3>
          <p className="text-[11px] text-slate-400 mb-2">{t("dashboards.superadmin.analytical_usage_desc", "Gemini Flash (Czat DTR, wyciąganie JSON)")}</p>
          <div className="text-2xl font-black text-blue-600">
            {totalGeminiTokens.toLocaleString("pl-PL")}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1 mb-2">{t("dashboards.superadmin.tokens_billing", "Tokenów (Biling)")}</p>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
            {t("dashboards.superadmin.cost_label", "Koszt:")} {(totalGeminiCost || 0).toFixed(2)} PLN
          </div>
        </div>

        {/* Licznik 1B: Klient - Audio */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-orange-500 mb-2 text-2xl"><i className="ph ph-microphone-stage"></i></div>
          <h3 className="text-sm font-bold text-slate-700">{t("dashboards.superadmin.audio_usage_title", "Zużycie Audio (Klient)")}</h3>
          <p className="text-[11px] text-slate-400 mb-2">{t("dashboards.superadmin.audio_usage_desc", "Voice-to-Text (Dyktowanie na żywo)")}</p>
          <div className="text-2xl font-black text-orange-600">
            {((totalWhisperSeconds || 0) / 60).toFixed(1)} min
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1 mb-2">{t("dashboards.superadmin.audio_minutes_billing", "Minut Audio (Biling)")}</p>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
            {t("dashboards.superadmin.cost_label", "Koszt:")} {(totalGroqCost || 0).toFixed(2)} PLN
          </div>
        </div>

        {/* Licznik 2: Google Vertex AI (Weryfikacja Serwerowa) */}
        <div className="bg-purple-50/70 p-5 rounded-xl border border-purple-200 flex flex-col items-center justify-center text-center">
          <div className="text-purple-600 mb-2 text-2xl"><i className="ph ph-shield-check"></i></div>
          <h3 className="text-sm font-bold text-purple-900">{t("dashboards.superadmin.vertex_server_title", "Google Vertex AI (Serwer API)")}</h3>
          <p className="text-[11px] text-purple-500 mb-2">{t("dashboards.superadmin.vertex_server_desc", "Bezpośredni licznik odpowiedzi Vertex Cloud")}</p>
          <div className="text-2xl font-black text-purple-700">
            {totalVertexTokens.toLocaleString("pl-PL")}
          </div>
          <p className="text-[10px] text-purple-600 uppercase font-bold tracking-wider mt-1 mb-2">{totalVertexCalls} {t("dashboards.superadmin.api_calls_label", "Wywołań API")}</p>
          <div className="text-xs font-semibold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-200">
            {t("dashboards.superadmin.api_cost_label", "Koszt API:")} {(totalVertexCost || 0).toFixed(2)} PLN
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-2">
         <div className="flex items-center gap-2">
           <i className="ph ph-coins text-blue-700 text-xl"></i>
           <span className="font-bold text-blue-900 text-sm">{t("dashboards.superadmin.estimated_monthly_cost", "Szacunkowy koszt bilingowy w tym miesiącu (SaaS):")}</span>
         </div>
         <div className="flex items-center gap-3">
           <span className="text-xs text-slate-500">Vertex API: <strong className="text-purple-700">{(totalVertexCost || 0).toFixed(2)} PLN</strong></span>
           <span className="font-black text-blue-700 text-xl">{totalCost.toFixed(2)} PLN</span>
         </div>
      </div>

      <div>
        <h3 className="text-md font-bold text-slate-800 mb-4">{t("dashboards.superadmin.models_pricing_config", "Konfiguracja Modeli i Cennika")}</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">{t("dashboards.superadmin.analytical_model_label", "Model Analityczny (np. gemini-2.5-flash)")}</label>
            <input 
              type="text" 
              value={globalGeminiModel || ""} 
              onChange={e => setGlobalGeminiModel(e.target.value)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">{t("dashboards.superadmin.transcription_model_label", "Model Transkrypcji (np. chirp_2)")}</label>
            <input 
              type="text" 
              value={globalTranscribeModel || ""} 
              onChange={e => setGlobalTranscribeModel(e.target.value)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">{t("dashboards.superadmin.price_per_1m_tokens", "Koszt 1M tokenów (PLN)")}</label>
            <input 
              type="number" step="0.01"
              value={globalGeminiPrice} 
              onChange={e => setGlobalGeminiPrice(parseFloat(e.target.value) || 0)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">{t("dashboards.superadmin.price_per_audio_min", "Koszt 1 minuty audio (PLN)")}</label>
            <input 
              type="number" step="0.01"
              value={globalTranscribePrice} 
              onChange={e => setGlobalTranscribePrice(parseFloat(e.target.value) || 0)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          {showEditButton ? (
            <button 
              type="button" 
              onClick={() => setIsEditingAIKey(true)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="ph ph-pencil-simple"></i>
              {t("dashboards.superadmin.unlock_to_edit", "Odblokuj do edycji")}
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSaveKey}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="ph ph-floppy-disk"></i>
              {t("dashboards.superadmin.save_global_changes", "Zapisz Zmiany Globalne")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
