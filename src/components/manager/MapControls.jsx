import React from 'react';

export default function MapControls({ zoomScale, setZoomScale, setZoomPan }) {
  return (
    <div className="absolute bottom-[90px] lg:bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl">
      <button 
        onClick={() => setZoomScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 4))} 
        className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-base md:text-xl shadow-sm transition-colors" 
        title="Powiększ (+)"
      >
        +
      </button>
      <button 
        onClick={() => { setZoomScale(1); setZoomPan({ x: 0, y: 0 }); }} 
        className="w-9 h-9 flex items-center justify-center text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-mono font-bold shadow-sm transition-colors" 
        title="Resetuj powiększenie"
      >
        {Math.round(zoomScale * 100)}%
      </button>
      <button 
        onClick={() => setZoomScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 0.5))} 
        className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-base md:text-xl shadow-sm transition-colors" 
        title="Pomniejsz (-)"
      >
        -
      </button>
    </div>
  );
}
