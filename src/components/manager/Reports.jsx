import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerStore } from '../../store/managerStore';
import { generateAuditorReport } from '../../utils/reports/auditorExport';
import KPIReportPanel from './reports/KPIReportPanel';
import ApiSettingsPanel from './reports/ApiSettingsPanel';
import TechnicianPerformancePanel from './reports/TechnicianPerformancePanel';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

export default function Reports() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const machines = useManagerStore(state => state.machines);
  const roles = useManagerStore(state => state.roles || []);
  const { isAdmin, onlyAssignedTasks } = usePermissions(user, roles);

  const [loading, setLoading] = useState(false);
  const [plannedWarningDays, setPlannedWarningDaysState] = useState(30);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tenants', getCurrentTenant(), 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.plannedWarningDays !== undefined) {
          setPlannedWarningDaysState(data.plannedWarningDays);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleGenerateAuditorReport = async () => {
    setLoading(true);
    try {
      await generateAuditorReport(getCurrentTenant(), user, onlyAssignedTasks);
    } catch (err) {
      alert('Błąd podczas generowania raportu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveWarningDays = async (val) => {
    try {
      await setDoc(doc(db, 'tenants', getCurrentTenant(), 'settings', 'general'), {
        plannedWarningDays: parseInt(val, 10)
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-2 sm:p-6 animate-fade-in w-full max-w-5xl min-w-0 mx-auto">
      <div className="flex justify-between items-center mb-5 sm:mb-8">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-3xl font-black text-gray-800 tracking-tight break-words">{t("dashboards.reports_title")}</h2>
          <p className="text-xs sm:text-base text-gray-500 mt-1 sm:mt-2 break-words">{t("dashboards.reports_desc")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 min-w-0">
        {/* Panel PDF */}
        <KPIReportPanel
          machines={machines}
          user={user}
          onlyAssignedTasks={onlyAssignedTasks}
        />
        {!onlyAssignedTasks && <TechnicianPerformancePanel />}
        {isAdmin && <ApiSettingsPanel />}

        {/* Raport Audytorski */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 break-words">
              <i className="ph ph-file-xls text-blue-600 text-2xl shrink-0"></i>
              <span>{t("dashboards.audit_report")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mt-1 break-words leading-relaxed">
              {t("dashboards.audit_desc")}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleGenerateAuditorReport}
              disabled={loading}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-lg"></i> {t("dashboards.generate")}
                </>
              ) : (
                <>
                  <i className="ph ph-download-simple text-lg"></i> {t("dashboards.download_xlsx")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ostrzeżenia Serwisu Planowanego (przeniesione z Ustawień) */}
        <div className="bg-amber-50 p-4 sm:p-6 rounded-xl border border-amber-100 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-amber-900 flex items-center gap-2 break-words">
              <i className="ph ph-warning-circle text-amber-600 text-2xl shrink-0"></i>
              <span>{t("dashboards.planned_warnings")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-800 max-w-2xl mt-1 break-words leading-relaxed">
              {t("dashboards.planned_desc", "Pinezki na mapie będą podświetlone na żółto, gdy zbliża się termin przeglądu. Ustaw z jakim wyprzedzeniem system ma zacząć ostrzegać.")}
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-xs w-full sm:w-auto">
            <input
              type="number"
              value={plannedWarningDays}
              onChange={(e) => {
                setPlannedWarningDaysState(e.target.value);
                saveWarningDays(e.target.value);
              }}
              min="1"
              max="365"
              className="w-20 font-bold text-amber-900 border-b-2 border-amber-300 focus:outline-none focus:border-amber-600 bg-transparent text-center"
            />
            <span className="text-amber-700 font-bold text-sm">{t("dashboards.days_before")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
