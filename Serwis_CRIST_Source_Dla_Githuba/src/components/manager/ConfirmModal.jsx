import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Tak, usuń", cancelText = "Anuluj" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <i className="ph ph-warning text-red-600 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title || 'Czy na pewno?'}</h3>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors flex items-center gap-2"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
