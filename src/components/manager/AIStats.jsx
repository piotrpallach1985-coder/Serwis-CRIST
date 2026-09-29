import React, { useState, useEffect } from 'react';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { fetchTenantUsageStats } from '../../services/admin.service';

export default function AIStats() {
  const [stats, setStats] = useState({ geminiTokens: 0, groqTokens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const tenantId = getCurrentTenant();
      if (!tenantId) return;
      try {
        const usage = await fetchTenantUsageStats(tenantId);
        if (usage) {
          setStats({
            geminiTokens: usage.geminiTokens || 0,
            groqTokens: usage.groqTokens || 0
          });
        }
      } catch (err) {
        console.error('Błąd pobierania statystyk AI:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><i className="ph ph-spinner animate-spin text-4xl text-blue-500"></i></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
          <i className="ph ph-brain"></i>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Zużycie AI (Tokeny)</h1>
          <p className="text-sm text-slate-500 font-medium">Monitoruj wykorzystanie sztucznej inteligencji w Twojej firmie.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-2">
            <i className="ph ph-google-logo"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700">Google Gemini</h3>
          <p className="text-xs text-slate-400">Wyszukiwanie w dokumentacjach DTR</p>
          <div className="text-4xl font-black text-blue-600 mt-2">
            {stats.geminiTokens.toLocaleString('pl-PL')}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tokenów zużyto</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mb-2">
            <i className="ph ph-microphone-stage"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700">Groq (Llama 3)</h3>
          <p className="text-xs text-slate-400">Dyktowanie i korekta zgłoszeń</p>
          <div className="text-4xl font-black text-orange-600 mt-2">
            {stats.groqTokens.toLocaleString('pl-PL')}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tokenów zużyto</p>
        </div>
      </div>
    </div>
  );
}
