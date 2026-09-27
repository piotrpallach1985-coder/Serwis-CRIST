import React from 'react';
import { safe } from '../../../utils/safeRender';
import { safeParseDate } from '../../../utils/dateHelpers';

export default function TicketHistory({ history, setLightboxImg }) {
  if (!history || !Array.isArray(history)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h4 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
        <i className="ph ph-clock-counter-clockwise text-lg"></i> HISTORIA ZDARZEŃ
      </h4>
      
      <div className="relative border-l-2 border-gray-100 ml-3 space-y-5 pb-4">
        {[...history].reverse().map((entry, index) => (
          <div key={index} className="relative pl-8">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#111827]"></div>
            
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-[#111827] text-sm">{safe(entry.user, "System")}</div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                {safeParseDate(entry.date)?.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Brak daty'}
              </div>
            </div>
            <div className="text-sm text-gray-600">{safe(entry.action)}</div>
            {entry.note && (
              <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 italic">
                &quot;{safe(entry.note)}&quot;
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
          </div>
        ))}
      </div>
    </div>
  );
}
