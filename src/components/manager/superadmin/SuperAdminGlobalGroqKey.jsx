import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SuperAdminGlobalGroqKey({ 
  globalGroqApiKey, 
  setGlobalGroqApiKey, 
  saveGlobalGroqApiKey,
  globalGroqModel,
  setGlobalGroqModel,
  globalGeminiPrice,
  setGlobalGeminiPrice,
  globalGroqPrice,
  setGlobalGroqPrice,
  globalGeminiModel,
  setGlobalGeminiModel
}) {
  const { t } = useTranslation();
  
  const [isEditingGroqKey, setIsEditingGroqKey] = useState(false);
  
  const isKeySaved = Boolean(globalGroqApiKey && globalGroqApiKey.length > 0);
  const showEditButton = isKeySaved && !isEditingGroqKey;
  const isReadOnly = showEditButton;

  const handleSaveKey = async (e) => {
    e.preventDefault();
    await saveGlobalGroqApiKey(e);
    setIsEditingGroqKey(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
          <i className="ph ph-brain text-3xl text-blue-500"></i>
        </div>
        <div className="flex-1 w-full max-w-lg">
          <h2 className="text-lg font-bold text-slate-800">Globalne Ustawienia Sztucznej Inteligencji</h2>
          <p className="text-sm text-slate-500 mb-3">Skonfiguruj klucz dla API mowy (Whisper) oraz domyślne ceny za 1 milion tokenów do statystyk. będzie używany domyślnie przez wszystkie firmy (tenants) do obsługi Voice-to-Text oraz tłumaczeń.</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
              type="password" 
              value={globalGroqApiKey || ''} 
              onChange={e => {
                if (!isEditingGroqKey) setIsEditingGroqKey(true);
                setGlobalGroqApiKey(e.target.value);
              }} 
              disabled={isReadOnly}
              className={`flex-1 p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
              placeholder="gsk_... (Klucz API)"
            />
            <input 
              type="text" 
              value={globalGroqModel || ''} 
              onChange={e => {
                if (!isEditingGroqKey) setIsEditingGroqKey(true);
                setGlobalGroqModel(e.target.value);
              }} 
              disabled={isReadOnly}
              className={`w-full sm:w-64 p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
              placeholder="Model Whisper (domyślnie whisper-large-v3)"
            />
            <input 
              type="text" 
              value={globalGeminiModel || ''} 
              onChange={e => {
                if (!isEditingGroqKey) setIsEditingGroqKey(true);
                setGlobalGeminiModel(e.target.value);
              }} 
              disabled={isReadOnly}
              className={`w-full sm:w-64 p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
              placeholder="Model Gemini (domyślnie gemini-2.5-flash)"
            />
            {showEditButton ? (
              <button 
                type="button" 
                onClick={() => setIsEditingGroqKey(true)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Edytuj
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSaveKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Zapisz Globalnie
              </button>
            )}
          </div>
        
          <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 mb-1 block">Cena Gemini za 1M tokenów (PLN)</label>
              <input 
                type="number" step="0.01"
                value={globalGeminiPrice} 
                onChange={e => {
                  if (!isEditingGroqKey) setIsEditingGroqKey(true);
                  setGlobalGeminiPrice(parseFloat(e.target.value) || 0);
                }} 
                disabled={isReadOnly}
                className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 mb-1 block">Cena Whisper za 1 minutę audio (PLN)</label>
              <input 
                type="number" step="0.01"
                value={globalGroqPrice} 
                onChange={e => {
                  if (!isEditingGroqKey) setIsEditingGroqKey(true);
                  setGlobalGroqPrice(parseFloat(e.target.value) || 0);
                }} 
                disabled={isReadOnly}
                className={`w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}