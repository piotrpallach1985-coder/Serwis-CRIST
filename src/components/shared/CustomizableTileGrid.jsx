import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const COL_SPAN_CLASSES = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  12: 'lg:col-span-12',
};

const WIDTH_OPTIONS = [
  { span: 3, label: '25%' },
  { span: 4, label: '33%' },
  { span: 6, label: '50%' },
  { span: 8, label: '66%' },
  { span: 9, label: '75%' },
  { span: 12, label: '100%' },
];

const HEIGHT_PRESETS = [
  { height: null, label: 'Auto' },
  { height: 280, label: 'S' },
  { height: 420, label: 'M' },
  { height: 600, label: 'L' },
];

const ROW_UNIT_PX = 8;

function snapRatioToColSpan(ratio) {
  const cols = ratio * 12;
  const allowed = [3, 4, 6, 8, 9, 12];
  let best = 12;
  let bestDiff = Infinity;
  for (const c of allowed) {
    const diff = Math.abs(cols - c);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best;
}

export function TileLayoutButton({ isEditing, setIsEditing, resetLayout, compact = false }) {
  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => setIsEditing(prev => !prev)}
        className={`flex items-center justify-center gap-1.5 font-bold text-sm rounded-lg transition-all shrink-0 shadow-sm border ${
          compact ? 'w-10 h-10 md:w-auto md:h-auto md:px-3.5 md:py-1.5 px-2.5 py-1.5' : 'px-3 py-1.5'
        } ${
          isEditing
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 ring-2 ring-blue-300'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
        }`}
        title={isEditing ? 'Zakończ dostosowywanie kafelków' : 'Dostosuj układ i rozmiar okienek'}
      >
        <i className={`ph ${isEditing ? 'ph-check-circle' : 'ph-squares-four'} text-lg md:text-base`}></i>
        <span className={compact ? 'hidden md:inline' : 'inline'}>
          {isEditing ? 'Gotowe' : 'Układ okienek'}
        </span>
      </button>
      {isEditing && resetLayout && (
        <button
          type="button"
          onClick={resetLayout}
          className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          title="Przywróć domyślny układ okienek"
        >
          <i className="ph ph-arrow-counter-clockwise text-sm"></i>
          <span className="hidden sm:inline">Resetuj</span>
        </button>
      )}
    </div>
  );
}

TileLayoutButton.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  setIsEditing: PropTypes.func.isRequired,
  resetLayout: PropTypes.func,
  compact: PropTypes.bool,
};

function MasonryGridItem({
  tileItem,
  isDesktop,
  colSpanClass,
  isBeingDragged,
  isDragTarget,
  isEditing,
  resizingState,
  onRegisterRef,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  children,
}) {
  const innerRef = useRef(null);
  const [rowSpan, setRowSpan] = useState(null);

  useEffect(() => {
    if (!isDesktop) {
      setRowSpan(null);
      return;
    }
    const el = innerRef.current;
    if (!el) return;

    const updateSpan = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        const nextSpan = Math.max(1, Math.ceil(h / ROW_UNIT_PX));
        setRowSpan(prev => (prev !== nextSpan ? nextSpan : prev));
      }
    };

    updateSpan();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSpan);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [isDesktop, tileItem.collapsed, tileItem.height, tileItem.colSpan, isEditing]);

  return (
    <div
      ref={el => {
        onRegisterRef(tileItem.id, el);
      }}
      style={
        isDesktop && rowSpan
          ? { gridRowEnd: `span ${rowSpan}` }
          : undefined
      }
      draggable={isEditing && !resizingState}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`col-span-1 ${colSpanClass} min-w-0 relative ${
        tileItem.hidden ? 'opacity-50' : ''
      } ${isBeingDragged ? 'opacity-40 scale-[0.99]' : ''}`}
    >
      <div ref={innerRef} className="pb-4 sm:pb-5">
        <div
          className={`relative transition-all duration-150 ${
            isDragTarget ? 'ring-4 ring-blue-500 rounded-xl' : ''
          } ${
            isEditing
              ? 'ring-2 ring-blue-400/80 rounded-xl bg-white/60 shadow-md'
              : ''
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function CustomizableTileGrid({
  tiles,
  layoutState,
  className = '',
}) {
  const {
    layout,
    deviceMode,
    isEditing,
    setIsEditing,
    moveTile,
    reorderTiles,
    setTileColSpan,
    setTileHeight,
    toggleCollapse,
    toggleHidden,
    resetLayout,
  } = layoutState;

  const isDesktop = deviceMode === 'desktop';
  const gridRef = useRef(null);
  const tileRefs = useRef({});
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [resizingState, setResizingState] = useState(null);

  const tilesMap = new Map(tiles.map(t => [t.id, t]));

  const visibleLayout = layout.filter(item => {
    const def = tilesMap.get(item.id);
    if (!def) return false;
    if (isEditing) return true;
    return !item.hidden;
  });

  const hiddenTiles = layout
    .filter(item => item.hidden && tilesMap.has(item.id))
    .map(item => tilesMap.get(item.id));

  const startResize = (e, tileItem, mode) => {
    e.preventDefault();
    e.stopPropagation();

    const tileEl = tileRefs.current[tileItem.id];
    const gridEl = gridRef.current;
    if (!tileEl || !gridEl) return;

    const startClientX = e.touches ? e.touches[0].clientX : e.clientX;
    const startClientY = e.touches ? e.touches[0].clientY : e.clientY;
    const tileRect = tileEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const startWidth = tileRect.width;
    const startHeight = tileItem.height || Math.max(180, tileRect.height - 56);

    setResizingState({
      id: tileItem.id,
      mode,
      liveColSpan: tileItem.colSpan,
      liveHeight: tileItem.height,
    });

    const onMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      let nextColSpan = tileItem.colSpan;
      let nextHeight = tileItem.height;

      if ((mode === 'width' || mode === 'both') && gridRect.width > 0) {
        const deltaX = clientX - startClientX;
        const newWidthPx = Math.max(180, Math.min(gridRect.width, startWidth + deltaX));
        const ratio = newWidthPx / gridRect.width;
        nextColSpan = snapRatioToColSpan(ratio);
      }

      if (mode === 'height' || mode === 'both') {
        const deltaY = clientY - startClientY;
        nextHeight = Math.max(160, Math.min(1200, Math.round(startHeight + deltaY)));
      }

      setResizingState({
        id: tileItem.id,
        mode,
        liveColSpan: nextColSpan,
        liveHeight: nextHeight,
      });

      if (mode === 'width' || mode === 'both') {
        setTileColSpan(tileItem.id, nextColSpan);
      }
      if (mode === 'height' || mode === 'both') {
        setTileHeight(tileItem.id, nextHeight);
      }
    };

    const onUp = () => {
      setResizingState(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* BANER TRYBU EDYCJI UKŁADU (WARIANT 2+) */}
      {isEditing && (
        <div className="mb-4 bg-blue-50/95 border-2 border-blue-300 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col gap-2.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <i className="ph ph-squares-four text-lg"></i>
              </div>
              <div>
                <div className="font-bold text-blue-950 text-xs sm:text-sm">
                  Tryb dostosowywania okienek (Układ + Rozmiar)
                </div>
                <div className="text-[11px] sm:text-xs text-blue-800">
                  Przeciągaj okienka za pasek lub użyj strzałek <span className="font-bold">↑ ↓</span>. Na PC zmieniaj szerokość przyciskami (<span className="font-bold">25%–100%</span>) lub rozciągaj za <span className="font-bold">prawy dolny róg / krawędzie</span>. Okienka automatycznie dosuwają się w pionie i poziomie bez pustych luk.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={resetLayout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center gap-1 transition-colors"
              >
                <i className="ph ph-arrow-counter-clockwise"></i> Domyślny układ
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1 transition-colors"
              >
                <i className="ph ph-check-circle text-sm"></i> Zakończ
              </button>
            </div>
          </div>

          {hiddenTiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-blue-200/80 text-xs">
              <span className="font-bold text-blue-900 mr-1">Ukryte okienka:</span>
              {hiddenTiles.map(ht => (
                <button
                  key={ht.id}
                  type="button"
                  onClick={() => toggleHidden(ht.id)}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <i className="ph ph-eye"></i> Pokaż: {ht.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SIATKA 12-KOLUMNOWA Z KOMPAKTOWYM PAKOWANIEM WIERSZY (MASONRY DENSE) */}
      <div
        ref={gridRef}
        style={
          isDesktop
            ? { gridAutoRows: `${ROW_UNIT_PX}px`, gridAutoFlow: 'row dense' }
            : undefined
        }
        className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 sm:gap-x-5 items-start"
      >
        {visibleLayout.map((tileItem, idx) => {
          const def = tilesMap.get(tileItem.id);
          if (!def) return null;

          const colSpanClass = COL_SPAN_CLASSES[tileItem.colSpan] || 'lg:col-span-12';
          const isBeingDragged = draggedId === tileItem.id;
          const isDragTarget = dragOverId === tileItem.id && draggedId !== tileItem.id;
          const isResizingThis = resizingState?.id === tileItem.id;
          const pctLabel = WIDTH_OPTIONS.find(w => w.span === tileItem.colSpan)?.label || '100%';

          return (
            <MasonryGridItem
              key={tileItem.id}
              tileItem={tileItem}
              isDesktop={isDesktop}
              colSpanClass={colSpanClass}
              isBeingDragged={isBeingDragged}
              isDragTarget={isDragTarget}
              isEditing={isEditing}
              resizingState={resizingState}
              onRegisterRef={(id, el) => {
                tileRefs.current[id] = el;
              }}
              onDragStart={e => {
                if (!isEditing) return;
                setDraggedId(tileItem.id);
                e.dataTransfer.effectAllowed = 'move';
                try {
                  e.dataTransfer.setData('text/plain', tileItem.id);
                } catch (_) {}
              }}
              onDragOver={e => {
                if (!isEditing || !draggedId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverId !== tileItem.id) setDragOverId(tileItem.id);
              }}
              onDragLeave={() => {
                if (dragOverId === tileItem.id) setDragOverId(null);
              }}
              onDrop={e => {
                if (!isEditing) return;
                e.preventDefault();
                const src = draggedId || e.dataTransfer.getData('text/plain');
                reorderTiles(src, tileItem.id);
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
            >
              {/* PASEK NAGŁÓWKOWY KAFELKA (Zwijanie + Narzędzia w trybie edycji) */}
              <div
                className={`flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 text-xs select-none transition-colors ${
                  isEditing
                    ? 'bg-blue-600 text-white rounded-t-xl cursor-grab active:cursor-grabbing'
                    : tileItem.collapsed
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm cursor-pointer'
                    : 'bg-slate-100/90 hover:bg-slate-200/70 text-slate-600 border border-b-0 border-slate-200/90 rounded-t-xl'
                }`}
                onClick={() => {
                  if (!isEditing && tileItem.collapsed) {
                    toggleCollapse(tileItem.id);
                  }
                }}
              >
                {/* Lewa strona paska: uchwyt + ikona + tytuł */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {isEditing && (
                    <i className="ph ph-dots-six-vertical text-base opacity-90 shrink-0" title="Przeciągnij kafelek"></i>
                  )}
                  {def.icon && (
                    <i className={`ph ${def.icon} text-sm shrink-0 ${isEditing ? 'text-blue-100' : 'text-slate-500'}`}></i>
                  )}
                  <span className="font-bold truncate text-[11px] sm:text-xs uppercase tracking-wider">
                    {def.title}
                  </span>
                  {tileItem.hidden && isEditing && (
                    <span className="bg-amber-300 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                      Ukryty
                    </span>
                  )}
                  {isResizingThis && (
                    <span className="bg-white text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                      {pctLabel} {tileItem.height ? `× ${tileItem.height}px` : '× Auto'}
                    </span>
                  )}
                </div>

                {/* Prawa strona paska: kontrolki (z flex-wrap dla wąskich kafelków 25%/33%) */}
                <div className="flex flex-wrap items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      {/* Strzałki Góra / Dół */}
                      <button
                        type="button"
                        onClick={() => moveTile(tileItem.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-blue-700/80 hover:bg-blue-800 disabled:opacity-30 text-white transition-colors"
                        title="Przesuń wyżej"
                      >
                        <i className="ph ph-arrow-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTile(tileItem.id, 'down')}
                        disabled={idx === visibleLayout.length - 1}
                        className="p-1 rounded bg-blue-700/80 hover:bg-blue-800 disabled:opacity-30 text-white transition-colors"
                        title="Przesuń niżej"
                      >
                        <i className="ph ph-arrow-down text-xs"></i>
                      </button>

                      {/* Przyciski szerokości (Desktop) */}
                      <div className="hidden lg:flex items-center bg-blue-800/70 rounded p-0.5 gap-0.5">
                        {WIDTH_OPTIONS.map(opt => (
                          <button
                            key={opt.span}
                            type="button"
                            onClick={() => setTileColSpan(tileItem.id, opt.span)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              tileItem.colSpan === opt.span
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-blue-100 hover:bg-blue-700'
                            }`}
                            title={`Szerokość kafelka: ${opt.label}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Przyciski wysokości */}
                      <div className="flex items-center bg-blue-800/70 rounded p-0.5 gap-0.5">
                        {HEIGHT_PRESETS.map(hp => {
                          const isSelected =
                            hp.height === null
                              ? !tileItem.height
                              : tileItem.height === hp.height;
                          return (
                            <button
                              key={hp.label}
                              type="button"
                              onClick={() => setTileHeight(tileItem.id, hp.height)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-white text-blue-700 shadow-sm'
                                  : 'text-blue-100 hover:bg-blue-700'
                              }`}
                              title={hp.height ? `Wysokość: ${hp.height}px` : 'Automatyczna wysokość (bez ucinania)'}
                            >
                              {hp.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Ukryj / Pokaż */}
                      <button
                        type="button"
                        onClick={() => toggleHidden(tileItem.id)}
                        className="p-1 rounded bg-blue-700/80 hover:bg-blue-800 text-white transition-colors"
                        title={tileItem.hidden ? 'Pokaż kafelek' : 'Ukryj kafelek'}
                      >
                        <i className={`ph ${tileItem.hidden ? 'ph-eye' : 'ph-eye-slash'} text-xs`}></i>
                      </button>
                    </>
                  ) : (
                    tileItem.height && !tileItem.collapsed && (
                      <button
                        type="button"
                        onClick={() => setTileHeight(tileItem.id, null)}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                        title="Przywróć automatyczną wysokość kafelka"
                      >
                        ↕ Auto
                      </button>
                    )
                  )}

                  {/* Zwiń / Rozwiń (dostępne zawsze) */}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(tileItem.id)}
                    className={`p-1 rounded transition-colors flex items-center gap-0.5 ${
                      isEditing
                        ? 'bg-blue-700/80 hover:bg-blue-800 text-white'
                        : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                    title={tileItem.collapsed ? 'Rozwiń okienko' : 'Zwiń okienko'}
                  >
                    <i className={`ph ${tileItem.collapsed ? 'ph-caret-down' : 'ph-caret-up'} text-xs font-bold`}></i>
                  </button>
                </div>
              </div>

              {/* ZAWARTOŚĆ KAFELKA */}
              {!tileItem.collapsed && (
                <div
                  style={
                    tileItem.height
                      ? { height: `${tileItem.height}px`, overflowY: 'auto' }
                      : undefined
                  }
                  className="w-full relative rounded-b-xl [&>*:first-child]:!mt-0 [&>*:first-child]:!rounded-t-none"
                >
                  {def.render()}
                </div>
              )}

              {/* UCHWYTY ROZCIĄGANIA (RESIZE HANDLES) W TRYBIE EDYCJI */}
              {isEditing && !tileItem.collapsed && (
                <>
                  {/* Prawa krawędź — rozciąganie szerokości na PC */}
                  <div
                    onMouseDown={e => startResize(e, tileItem, 'width')}
                    className="hidden lg:flex absolute top-8 right-0 bottom-4 w-2.5 cursor-ew-resize items-center justify-center group z-30 hover:bg-blue-500/20 rounded-r"
                    title="Przeciągnij w poziomie, aby zmienić szerokość okienka"
                  >
                    <div className="w-1 h-8 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors"></div>
                  </div>

                  {/* Dolna krawędź — rozciąganie wysokości */}
                  <div
                    onMouseDown={e => startResize(e, tileItem, 'height')}
                    onTouchStart={e => startResize(e, tileItem, 'height')}
                    onDoubleClick={() => setTileHeight(tileItem.id, null)}
                    className="absolute left-0 right-6 bottom-0 h-2.5 cursor-ns-resize flex items-center justify-center group z-30 hover:bg-blue-500/20 rounded-b"
                    title="Przeciągnij w pionie, aby ustawić wysokość (dwuklik = Auto)"
                  >
                    <div className="w-10 h-1 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors"></div>
                  </div>

                  {/* Prawy dolny narożnik — swobodne rozciąganie 2D (Szerokość + Wysokość) */}
                  <div
                    onMouseDown={e => startResize(e, tileItem, 'both')}
                    onTouchStart={e => startResize(e, tileItem, 'height')}
                    onDoubleClick={() => setTileHeight(tileItem.id, null)}
                    className="absolute right-0 bottom-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-tl-lg rounded-br-xl cursor-nwse-resize flex items-center justify-center shadow-md z-40"
                    title="Przeciągnij narożnik, aby zmienić szerokość i wysokość okienka (dwuklik = Auto wysokość)"
                  >
                    <i className="ph ph-arrows-out-simple text-xs rotate-90"></i>
                  </div>
                </>
              )}
            </MasonryGridItem>
          );
        })}
      </div>
    </div>
  );
}

CustomizableTileGrid.propTypes = {
  tiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      defaultColSpan: PropTypes.number,
      defaultHeight: PropTypes.number,
      defaultCollapsed: PropTypes.bool,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  layoutState: PropTypes.object.isRequired,
  className: PropTypes.string,
};
