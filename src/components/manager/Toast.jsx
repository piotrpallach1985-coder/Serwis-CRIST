import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${isError ? 'bg-red-600' : 'bg-slate-900'}`}>
        <i className={`ph ${isError ? 'ph-warning-circle text-red-200' : 'ph-check-circle text-emerald-400'} text-2xl`}></i>
        {message}
        <button onClick={onClose} className="ml-4 text-white/50 hover:text-white transition-colors">
          <i className="ph ph-x"></i>
        </button>
      </div>
    </div>
  );
}
