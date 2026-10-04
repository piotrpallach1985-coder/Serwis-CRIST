import React from 'react';

export default function SuperAdminStats({ totalGeminiTokens, totalGroqTokens, totalWhisperSeconds = 0, totalGeminiCost, totalGroqCost, globalGeminiPrice = 0.60, globalGroqPrice = 0.40 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-2">
          <i className="ph ph-google-logo"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-700">Zużycie Google Gemini</h3>
        <p className="text-xs text-slate-400">Sumaryczne zużycie wszystkich firm (SaaS)</p>
        <div className="text-4xl font-black text-blue-600 mt-2">
          {totalGeminiTokens.toLocaleString('pl-PL')}
        </div>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tokenów łącznie</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mb-2">
          <i className="ph ph-microphone-stage"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-700">Zużycie Groq (Whisper)</h3>
        <p className="text-xs text-slate-400">Sumaryczne zużycie wszystkich firm (SaaS)</p>
        <div className="text-4xl font-black text-orange-600 mt-2">
          {((totalWhisperSeconds || 0) / 60).toFixed(1)} min
        </div>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tokenów łącznie</p>
      </div>
    </div>
  );
}
