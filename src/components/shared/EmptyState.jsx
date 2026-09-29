import React from 'react';

export default function EmptyState({ 
  icon = "ph-folder-open", 
  title = "Brak danych", 
  message = "Nie znaleziono żadnych elementów do wyświetlenia.", 
  actionButton 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full">
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
        <i className={`ph ${icon} text-3xl`}></i>
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {actionButton}
    </div>
  );
}
