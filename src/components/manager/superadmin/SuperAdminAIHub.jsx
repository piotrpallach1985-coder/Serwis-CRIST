import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SuperAdminAIHub({
  totalGeminiTokens,
  totalWhisperSeconds,
  totalGeminiCost,
  totalGroqCost,
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
           <h2 className="text-xl font-bold text-slate-800">Centrum Sztucznej Inteligencji (Google Vertex AI)</h2>
           <p className="text-sm text-slate-500">Statystyki zużycia i globalna konfiguracja modeli</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-blue-500 mb-2 text-2xl"><i className="ph ph-chat-teardrop-text"></i></div>
          <h3 className="text-md font-bold text-slate-700">Zużycie Modeli Analitycznych</h3>
          <p className="text-xs text-slate-400 mb-2">Gemini Flash (Czat DTR, wyciąganie JSON)</p>
          <div className="text-3xl font-black text-blue-600">
            {totalGeminiTokens.toLocaleString("pl-PL")}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1 mb-2">Tokenów Łącznie (SaaS)</p>
          <div className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
            Koszt: {(totalGeminiCost || 0).toFixed(2)} PLN
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-orange-500 mb-2 text-2xl"><i className="ph ph-microphone-stage"></i></div>
          <h3 className="text-md font-bold text-slate-700">Zużycie Modeli Transkrypcyjnych</h3>
          <p className="text-xs text-slate-400 mb-2">Voice-to-Text (Dyktowanie na żywo)</p>
          <div className="text-3xl font-black text-orange-600">
            {((totalWhisperSeconds || 0) / 60).toFixed(1)} min
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1 mb-2">Minut Audio Łącznie (SaaS)</p>
          <div className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
            Koszt: {(totalGroqCost || 0).toFixed(2)} PLN
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex justify-between items-center">
         <span className="font-bold text-blue-800 text-sm">Szacunkowy koszt AI w tym miesiącu (SaaS):</span>
         <span className="font-black text-blue-700 text-xl">{totalCost.toFixed(2)} PLN</span>
      </div>

      <div>
        <h3 className="text-md font-bold text-slate-800 mb-4">Konfiguracja Modeli i Cennika</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Model Analityczny (np. gemini-3.8-flash)</label>
            <input 
              type="text" 
              value={globalGeminiModel || ""} 
              onChange={e => setGlobalGeminiModel(e.target.value)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Model Transkrypcji (np. gemini-3.5-transcribe)</label>
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
            <label className="text-xs font-bold text-slate-500 mb-1 block">Koszt 1M tokenów (PLN)</label>
            <input 
              type="number" step="0.01"
              value={globalGeminiPrice} 
              onChange={e => setGlobalGeminiPrice(parseFloat(e.target.value) || 0)} 
              disabled={isReadOnly}
              className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Koszt 1 minuty audio (PLN)</label>
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
              Odblokuj do edycji
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSaveKey}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="ph ph-floppy-disk"></i>
              Zapisz Zmiany Globalne
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
