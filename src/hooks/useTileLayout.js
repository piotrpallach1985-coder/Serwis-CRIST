import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_PREFIX = 'vexont_tiles_v2_';

function getDeviceMode() {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 1024 ? 'mobile' : 'desktop';
}

export function getAllowedColStarts(colSpan) {
  switch (colSpan) {
    case 3:
      return [1, 4, 7, 10];
    case 4:
      return [1, 5, 9];
    case 6:
      return [1, 7];
    case 8:
      return [1, 5];
    case 9:
      return [1, 4];
    case 12:
    default:
      return [1];
  }
}

function normalizeColStart(colStart, colSpan) {
  if (colStart === null || colStart === undefined) return null;
  const num = Number(colStart);
  if (!Number.isFinite(num)) return null;
  const maxStart = Math.max(1, 13 - (colSpan || 12));
  return Math.min(maxStart, Math.max(1, Math.round(num)));
}

function loadSavedLayout(layoutId, deviceMode, defaultTiles) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${layoutId}_${deviceMode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const mapById = new Map(parsed.map(item => [item.id, item]));
    const ordered = [];

    for (const savedItem of parsed) {
      const def = defaultTiles.find(d => d.id === savedItem.id);
      if (def) {
        const colSpan = savedItem.colSpan || def.defaultColSpan || 12;
        ordered.push({
          id: def.id,
          colSpan,
          colStart: normalizeColStart(savedItem.colStart, colSpan),
          height:
            typeof savedItem.height === 'number' ? savedItem.height : def.defaultHeight || null,
          collapsed:
            typeof savedItem.collapsed === 'boolean'
              ? savedItem.collapsed
              : Boolean(def.defaultCollapsed),
          hidden: typeof savedItem.hidden === 'boolean' ? savedItem.hidden : false,
          sameRow: Boolean(savedItem.sameRow),
        });
      }
    }

    for (const def of defaultTiles) {
      if (!mapById.has(def.id)) {
        const colSpan = def.defaultColSpan || 12;
        ordered.push({
          id: def.id,
          colSpan,
          colStart: normalizeColStart(def.defaultColStart, colSpan),
          height: def.defaultHeight || null,
          collapsed: Boolean(def.defaultCollapsed),
          hidden: false,
          sameRow: false,
        });
      }
    }

    return ordered;
  } catch (e) {
    console.warn('Nie udało się wczytać układu kafelków:', e);
    return null;
  }
}

function buildDefaultState(defaultTiles) {
  return defaultTiles.map(def => {
    const colSpan = def.defaultColSpan || 12;
    return {
      id: def.id,
      colSpan,
      colStart: normalizeColStart(def.defaultColStart, colSpan),
      height: def.defaultHeight || null,
      collapsed: Boolean(def.defaultCollapsed),
      hidden: false,
      sameRow: false,
    };
  });
}

export function useTileLayout(layoutId, defaultTiles) {
  const [deviceMode, setDeviceMode] = useState(getDeviceMode);
  const [isEditing, setIsEditing] = useState(false);

  const defaultTilesKey = useMemo(
    () => defaultTiles.map(d => `${d.id}:${d.defaultColSpan || 12}`).join('|'),
    [defaultTiles]
  );

  const [layout, setLayout] = useState(() => {
    return (
      loadSavedLayout(layoutId, getDeviceMode(), defaultTiles) || buildDefaultState(defaultTiles)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      const nextMode = getDeviceMode();
      setDeviceMode(prev => (prev !== nextMode ? nextMode : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loaded =
      loadSavedLayout(layoutId, deviceMode, defaultTiles) || buildDefaultState(defaultTiles);
    setLayout(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId, deviceMode, defaultTilesKey]);

  const persistLayout = useCallback(
    updater => {
      setLayout(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${layoutId}_${deviceMode}`, JSON.stringify(next));
        } catch (e) {
          console.warn('Nie udało się zapisać układu kafelków:', e);
        }
        return next;
      });
    },
    [layoutId, deviceMode]
  );

  const moveTile = useCallback(
    (id, direction) => {
      persistLayout(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, { ...moved, colStart: null });
        return copy;
      });
    },
    [persistLayout]
  );

  const moveTileHorizontal = useCallback(
    (id, direction, currentResolvedColStart = 1) => {
      persistLayout(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1) return prev;
        const item = prev[idx];
        const span = item.colSpan || 12;
        if (span >= 12) return prev;

        // Jeśli kafelek sąsiaduje w jednej linii z kolejnym/poprzednim kafelkiem, zamień je miejscami w wierszu
        if (direction === 'right' && idx + 1 < prev.length) {
          const rightNeighbor = prev[idx + 1];
          const rightSpan = rightNeighbor.colSpan || 12;
          if (!rightNeighbor.hidden && span + rightSpan <= 12 && currentResolvedColStart === 1) {
            const copy = [...prev];
            copy[idx] = { ...rightNeighbor, colStart: null };
            copy[idx + 1] = { ...item, colStart: null };
            return copy;
          }
        }
        if (direction === 'left' && idx > 0) {
          const leftNeighbor = prev[idx - 1];
          const leftSpan = leftNeighbor.colSpan || 12;
          if (!leftNeighbor.hidden && span + leftSpan <= 12 && currentResolvedColStart > 1) {
            const copy = [...prev];
            copy[idx - 1] = { ...item, colStart: null };
            copy[idx] = { ...leftNeighbor, colStart: null };
            return copy;
          }
        }

        const slots = getAllowedColStarts(span);
        const currentStart = item.colStart || currentResolvedColStart || 1;
        let nextStart = currentStart;

        if (direction === 'left') {
          const leftCandidates = slots.filter(s => s < currentStart);
          nextStart =
            leftCandidates.length > 0 ? leftCandidates[leftCandidates.length - 1] : slots[0];
        } else {
          const rightCandidates = slots.filter(s => s > currentStart);
          nextStart =
            rightCandidates.length > 0 ? rightCandidates[0] : slots[slots.length - 1];
        }

        return prev.map((it, i) => (i === idx ? { ...it, colStart: nextStart } : it));
      });
    },
    [persistLayout]
  );

  const alignTileInRow = useCallback(
    id => {
      persistLayout(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1 || prev.length < 2) return prev;
        const copy = prev.map(item => ({ ...item }));
        const partnerIdx = idx < copy.length - 1 ? idx + 1 : idx - 1;
        if (partnerIdx < 0 || partnerIdx >= copy.length) return prev;

        const firstIdx = Math.min(idx, partnerIdx);
        const secondIdx = Math.max(idx, partnerIdx);
        const first = copy[firstIdx];
        const second = copy[secondIdx];

        let spanA = first.colSpan || 12;
        let spanB = second.colSpan || 12;
        if (spanA + spanB > 12) {
          if (spanA === 8 && spanB >= 4) {
            spanB = 4;
          } else if (spanB === 8 && spanA >= 4) {
            spanA = 4;
          } else if (spanA === 4 && spanB > 8) {
            spanB = 8;
          } else if (spanB === 4 && spanA > 8) {
            spanA = 8;
          } else {
            spanA = 6;
            spanB = 6;
          }
        }

        copy[firstIdx] = {
          ...first,
          colSpan: spanA,
          colStart: null,
          sameRow: true,
        };
        copy[secondIdx] = {
          ...second,
          colSpan: spanB,
          colStart: null,
          sameRow: true,
        };
        return copy;
      });
    },
    [persistLayout]
  );

  const setTileColStart = useCallback(
    (id, colStart) => {
      persistLayout(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, colStart: normalizeColStart(colStart, item.colSpan) }
            : item
        )
      );
    },
    [persistLayout]
  );

  const reorderTiles = useCallback(
    (sourceId, targetId, targetColStart = undefined) => {
      if (!sourceId) return;
      persistLayout(prev => {
        const srcIdx = prev.findIndex(item => item.id === sourceId);
        if (srcIdx === -1) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(srcIdx, 1);
        const updatedMoved =
          targetColStart !== undefined
            ? { ...moved, colStart: normalizeColStart(targetColStart, moved.colSpan) }
            : { ...moved, colStart: null };

        if (!targetId || sourceId === targetId) {
          copy.splice(srcIdx, 0, updatedMoved);
          return copy;
        }

        const tgtIdx = prev.findIndex(item => item.id === targetId);
        if (tgtIdx === -1) {
          copy.push(updatedMoved);
          return copy;
        }
        // Jeśli upuszczamy kafelek na inny kafelek i ich szerokości mieszczą się w 12 kolumnach,
        // wyczyść sztywne colStart, aby ułożyły się obok siebie w jednej linii
        const targetTile = copy[tgtIdx];
        if (targetTile && (updatedMoved.colSpan || 12) + (targetTile.colSpan || 12) <= 12) {
          updatedMoved.colStart = null;
          copy[tgtIdx] = { ...targetTile, colStart: null };
        }
        copy.splice(tgtIdx, 0, updatedMoved);
        return copy;
      });
    },
    [persistLayout]
  );

  const setTileColSpan = useCallback(
    (id, colSpan) => {
      const allowed = [3, 4, 6, 8, 9, 12];
      const normalized = allowed.includes(colSpan) ? colSpan : 12;
      persistLayout(prev => {
        const idx = prev.findIndex(item => item.id === id);
        if (idx === -1) return prev;
        const copy = prev.map(item =>
          item.id === id
            ? {
                ...item,
                colSpan: normalized,
                // Resetujemy sztywne colStart przy zmianie szerokości, aby sąsiednie kafelki
                // o łącznej szerokości <= 100% automatycznie ustawiały się w jednej linii obok siebie
                colStart: null,
              }
            : { ...item }
        );

        // Gdy sąsiadujący kafelek mieści się w tej samej linii (suma <= 12), wyczyść też jego sztywne colStart
        if (normalized < 12) {
          const prevNeighbor = idx > 0 ? copy[idx - 1] : null;
          const nextNeighbor = idx < copy.length - 1 ? copy[idx + 1] : null;
          if (nextNeighbor && (nextNeighbor.colSpan || 12) + normalized <= 12) {
            nextNeighbor.colStart = null;
          }
          if (prevNeighbor && (prevNeighbor.colSpan || 12) + normalized <= 12) {
            prevNeighbor.colStart = null;
          }
        }

        if (normalized === 4) {
          copy.forEach((item, i) => {
            if (i !== idx && item.colSpan === 9) {
              item.colSpan = 8;
              item.colStart = null;
            }
          });
        } else if (normalized === 9) {
          const prevNeighbor = idx > 0 ? copy[idx - 1] : null;
          const nextNeighbor = idx < copy.length - 1 ? copy[idx + 1] : null;
          if (nextNeighbor && nextNeighbor.colSpan === 4) {
            nextNeighbor.colSpan = 3;
            nextNeighbor.colStart = null;
          } else if (prevNeighbor && prevNeighbor.colSpan === 4) {
            prevNeighbor.colSpan = 3;
            prevNeighbor.colStart = null;
          }
        }

        return copy;
      });
    },
    [persistLayout]
  );

  const setTileHeight = useCallback(
    (id, height) => {
      const normalized =
        height === null || height === undefined
          ? null
          : Math.max(150, Math.min(1400, Math.round(Number(height))));
      persistLayout(prev =>
        prev.map(item => (item.id === id ? { ...item, height: normalized } : item))
      );
    },
    [persistLayout]
  );

  const toggleCollapse = useCallback(
    id => {
      persistLayout(prev =>
        prev.map(item => (item.id === id ? { ...item, collapsed: !item.collapsed } : item))
      );
    },
    [persistLayout]
  );

  const toggleHidden = useCallback(
    id => {
      persistLayout(prev =>
        prev.map(item => (item.id === id ? { ...item, hidden: !item.hidden } : item))
      );
    },
    [persistLayout]
  );

  const resetLayout = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${layoutId}_${deviceMode}`);
    } catch (e) {
      console.warn(e);
    }
    setLayout(buildDefaultState(defaultTiles));
  }, [layoutId, deviceMode, defaultTiles]);

  return {
    layout,
    deviceMode,
    isEditing,
    setIsEditing,
    moveTile,
    moveTileHorizontal,
    alignTileInRow,
    setTileColStart,
    reorderTiles,
    setTileColSpan,
    setTileHeight,
    toggleCollapse,
    toggleHidden,
    resetLayout,
  };
}
