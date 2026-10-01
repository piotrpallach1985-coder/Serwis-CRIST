import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SuperAdminGlobalGroqKey({ 
  globalGroqApiKey, 
  setGlobalGroqApiKey, 
  saveGlobalGroqApiKey
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
          <h2 className="text-lg font-bold text-slate-800">Globalny Klucz API Groq (Sztuczna Inteligencja)</h2>
          <p className="text-sm text-slate-500 mb-3">Klucz z tego pola będzie używany domyślnie przez wszystkie firmy (tenants) do obsługi Voice-to-Text oraz tłumaczeń.</p>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={globalGroqApiKey || ''} 
              onChange={e => {
                if (!isEditingGroqKey) setIsEditingGroqKey(true);
                setGlobalGroqApiKey(e.target.value);
              }} 
              disabled={isReadOnly}
              className={\w-full p-2 border border-slate-300 rounded-lg shadow-sm font-mono text-sm \\}
              placeholder="gsk_..."
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
        </div>
      </div>
    </div>
  );
}
