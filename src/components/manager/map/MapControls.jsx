import React from 'react';
import { USER_ROLES } from '../../../utils/constants';

export default function MapControls({
  mode,
  setMode,
  currentSubmapId,
  setCurrentSubmapId,
  user,
  isFullscreen,
  toggleFullscreen,
  zoomScale,
  setZoomScale,
  setZoomPan,
  saveDefaultView,
  uploadingMap,
  handleMapFileChange,
  mapDragActive,
  handleMapDragEnter,
  handleMapDragLeave,
  handleMapDragOver,
  handleMapDrop,
  isSettingsMinimized,
  setIsSettingsMinimized
}) {
  return (
    <>
      {/* Ustawienia mapy (upload i widok domyślny) */}
      {mode === 'edit' && currentSubmapId === null && (
        <div className="absolute top-14 sm:top-16 left-4 z-30 bg-white p-3 md:p-4 rounded-xl shadow-xl w-48 sm:w-72 border border-amber-200 animate-fade-in transition-all">
          {isSettingsMinimized ? (
            <button onClick={(e) => { e.stopPropagation(); setIsSettingsMinimized(false); }} className="font-bold text-slate-800 text-[10px] md:text-sm flex items-center gap-2">
              <i className="ph ph-image text-amber-500"></i> Opcje Mapy
            </button>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIsSettingsMinimized(true); }} className="absolute top-2 right-2 text-slate-400 p-1"><i className="ph ph-minus"></i></button>
              <h3 className="font-bold text-slate-800 text-[10px] md:text-sm mb-3 border-b pb-2 flex items-center gap-2"><i className="ph ph-image text-amber-500"></i> Ustawienia</h3>
              <div className="mb-4">
                <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">1. Wgraj nową mapę</label>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleMapFileChange} disabled={uploadingMap} className="absolute inset-0 w-full h-full z-50 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  <div className={'w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors ' + (mapDragActive ? 'border-amber-500 bg-amber-50' : (uploadingMap ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-blue-300 hover:bg-blue-50'))} onDragEnter={handleMapDragEnter} onDragLeave={handleMapDragLeave} onDragOver={handleMapDragOver} onDrop={handleMapDrop}>
                    {uploadingMap ? (<><i className="ph ph-spinner-gap animate-spin text-2xl text-blue-500 mb-2"></i><p className="text-[10px] md:text-xs font-bold text-slate-600">Przetwarzanie...</p></>) : (<><i className="ph ph-upload-simple text-2xl text-blue-400 mb-2"></i><p className="text-[10px] md:text-xs font-bold text-slate-600">Kliknij lub upuść plik</p></>)}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">3. Ustaw domyślny widok</label>
                <button onClick={saveDefaultView} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[9px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><i className="ph ph-floppy-disk"></i> Ustaw jako domyślny kadr</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Przyciski narzędzi (górny lewy róg) */}
      <div className="absolute top-4 left-4 z-[60] flex flex-wrap gap-2 pointer-events-auto">
        {currentSubmapId && (
          <button onClick={() => setCurrentSubmapId(null)} className="px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md border border-indigo-500 flex items-center gap-2 transition-transform hover:scale-105">
            <i className="ph ph-arrow-left text-base sm:text-lg"></i><span className="hidden sm:inline">Powrót do Mapy Głównej</span>
          </button>
        )}
        {((user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPERADMIN) || user?.permissions?.includes('edit_map')) && (
          <>
            <button onClick={() => setMode('view')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-2 transition-all shadow-md ${mode === 'view' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}><i className="ph ph-eye text-base sm:text-lg"></i><span className="hidden sm:inline">Podgląd</span></button>
            <button onClick={() => setMode('edit')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-2 transition-all shadow-md ${mode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}><i className="ph ph-pencil-simple text-base sm:text-lg"></i><span className="hidden sm:inline">Edycja</span></button>
          </>
        )}
        <button onClick={toggleFullscreen} className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white flex items-center gap-2 shadow-md">
          <i className={`ph ${isFullscreen ? 'ph-corners-in' : 'ph-corners-out'} text-base sm:text-lg`}></i><span className="hidden sm:inline">{isFullscreen ? 'Zamknij' : 'Pełny ekran'}</span>
        </button>
      </div>

      {/* Kontrolki powiększenia (prawy dolny róg) */}
      <div className="absolute bottom-[90px] lg:bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl pointer-events-auto">
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
    </>
  );
}
