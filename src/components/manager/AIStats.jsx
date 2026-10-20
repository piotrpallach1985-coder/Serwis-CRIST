import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { fetchTenantUsageStats } from '../../services/admin.service';
import { useManagerStore } from '../../store/managerStore';

export default function AIStats() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'pl-PL';
  const geminiPrice = useManagerStore(state => state.geminiPrice) || 0.60;
  const groqPrice = useManagerStore(state => state.groqPrice) || 0.40;
  const [stats, setStats] = useState({ 
    geminiTokens: 0, 
    groqTokens: 0, 
    whisperSeconds: 0, 
    geminiCost: 0, 
    groqCost: 0,
    vertexTokens: 0,
    vertexCost: 0,
    vertexCalls: 0
  });
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
            geminiCost: usage.geminiCost,
            groqCost: usage.groqCost,
            groqTokens: usage.groqTokens || 0,
            whisperSeconds: usage.whisperSeconds || 0,
            vertexTokens: usage.vertexTokens || 0,
            vertexCost: usage.vertexCost,
            vertexCalls: usage.vertexCalls || 0
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight"> {t("dashboards.ai_stats.title")} </h1>
          <p className="text-sm text-slate-500 font-medium">{t("dashboards.ai_stats.desc")}</p>
        </div>
      </div>

      {/* Główne liczniki rozliczeniowe klienta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-2">
            <i className="ph ph-chat-teardrop-text"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700">{t("dashboards.ai_stats.gemini_title", "Zużycie Modeli Analitycznych")}</h3>
          <p className="text-xs text-slate-400">{t("dashboards.ai_stats.gemini_desc")}</p>
          <div className="text-4xl font-black text-blue-600 mt-2">
            {stats.geminiTokens.toLocaleString(locale)}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("dashboards.ai_stats.tokens_used", "Tokenów Zużyto (Biling)")}</p>
          <div className="mt-3 py-1 px-3 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-inner">
            ~ {(stats.geminiCost !== undefined ? stats.geminiCost : (stats.geminiTokens / 1000000) * geminiPrice).toFixed(4)} PLN
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mb-2">
            <i className="ph ph-microphone-stage"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700">{t("dashboards.ai_stats.groq_title", "Zużycie Modeli Transkrypcyjnych")}</h3>
          <p className="text-xs text-slate-400">{t("dashboards.ai_stats.groq_desc")}</p>
          <div className="text-4xl font-black text-orange-600 mt-2">
            {(stats.whisperSeconds / 60).toFixed(1)} min
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("dashboards.ai_stats.audio_minutes_used", "Minut Audio Zużyto (Biling)")}</p>
          <div className="mt-3 py-1 px-3 bg-orange-100 text-orange-700 rounded-full text-xs font-bold shadow-inner">
            ~ {(stats.groqCost !== undefined ? stats.groqCost : (stats.whisperSeconds / 60) * groqPrice).toFixed(4)} PLN
          </div>
        </div>
      </div>
    </div>
  );
}
