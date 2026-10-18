import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function PlannedMaintenanceHistory({ srv, setLightboxImg }) {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
          <i className="ph ph-clock-counter-clockwise text-lg"></i> {t('planned.history_title')}
        </h4>
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
          {srv.history && [...srv.history].reverse().map((entry, index) => (
            <div key={index} className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-slate-800"></div>
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-slate-800 text-sm">{entry.user || t('planned.system')}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(entry.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-sm text-slate-600 font-medium">{entry.action}</div>
              {entry.note && (
                <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                  &quot;{entry.note}&quot;
                </div>
              )}
              {entry.photos && entry.photos.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {entry.photos.map((url, idx) => (
                    <img 
                      key={idx} 
                      src={url} 
                      alt="załącznik" 
                      className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                      onClick={() => setLightboxImg(url)}
                    />
                  ))}
                </div>
              )}
              {entry.checklistSummary && entry.checklistSummary.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('planned.checklist_title')}</div>
                  {entry.checklistSummary.map((item, i) => (
                    <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="font-semibold mb-1">{item.taskName || item.step}:</div>
                      <div className="mb-1">
                      {item.type === 'CHECKBOX' ? (
                        item.answer ? `✅ ${t('planned.done')}` : `❌ ${t('planned.skipped')}`
                      ) : item.type === 'PHOTO' ? (
                        item.answer && item.answer.length > 0 ? (
                          <img src={item.answer} alt="załącznik" className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm inline-block" onClick={() => setLightboxImg(item.answer)} />
                        ) : t('planned.no_main_photo')
                      ) : (
                        <span className="font-mono text-blue-600">{item.answer || t('planned.no_data_short')}</span>
                      )}
                      </div>
                      {item.note && (
                        <div className="mt-1 text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200">
                          Notatka: {item.note}
                        </div>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {item.photos.map((p, idx) => (
                            <img key={idx} src={p} alt="załącznik" className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm" onClick={() => setLightboxImg(p)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!srv.history || srv.history.length === 0) && (
            <div className="text-sm text-slate-400 italic pl-6">{t('planned.no_history')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

PlannedMaintenanceHistory.propTypes = {
  srv: PropTypes.object.isRequired,
  setLightboxImg: PropTypes.func.isRequired
};
