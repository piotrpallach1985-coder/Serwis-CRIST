import React from 'react';
import { safe } from '../../../utils/safeRender';
import { useTranslation } from 'react-i18next';

export default function TicketMainColumnContent({
  currentTicket,
  actualPartsUsed,
  parts,
  setLightboxImg
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
      <div className="p-8">
        {actualPartsUsed && actualPartsUsed.length > 0 && (
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="ph ph-nut text-lg"></i> {t('tickets.details.parts_used')}
            </h4>
            <ul className="space-y-2">
              {actualPartsUsed.map((tx, idx) => {
                const pName = parts.find(p => p.id === tx.partId)?.name || t('tickets.details.unknown_part');
                return (
                  <li key={idx} className="flex justify-between items-center text-sm bg-blue-50/50 p-3 border border-blue-100 rounded-lg">
                    <span className="font-bold text-slate-800">{pName}</span>
                    <div className="flex gap-4 text-xs text-slate-600 font-medium">
                      <span>{t('tickets.details.taken')}{Math.abs(tx.quantity)} ({tx.user || 'System'})</span>
                      <span>{t('tickets.details.cost')}{tx.totalCost ? tx.totalCost.toFixed(2) + ' PLN' : (Math.abs(tx.quantity) * tx.price).toFixed(2) + ' PLN'}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('tickets.details.description')}</h3>
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 text-[#4b5563] text-sm leading-relaxed whitespace-pre-wrap">
          {safe(currentTicket.description)}
        </div>
        
        {currentTicket.photos && currentTicket.photos.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{t('tickets.details.photos')}</h4>
            <div className="flex flex-wrap gap-2">
              {currentTicket.photos.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="zalacznik" 
                  className="w-24 h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                  onClick={() => setLightboxImg(url)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
