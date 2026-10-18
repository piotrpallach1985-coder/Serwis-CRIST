import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_PREFIX = 'vexont_tiles_v1_';

function getDeviceMode() {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 1024 ? 'mobile' : 'desktop';
}

function loadSavedLayout(layoutId, deviceMode, defaultTiles) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${layoutId}_${deviceMode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const mapById = new Map(parsed.map(item => [item.id, item]));
    const ordered = [];

    // Keep saved order for existing tiles
    for (const savedItem of parsed) {
      const def = defaultTiles.find(d => d.id === savedItem.id);
      if (def) {
        ordered.push({
          id: def.id,
          colSpan: savedItem.colSpan || def.defaultColSpan || 12,
          height: typeof savedItem.height === 'number' ? savedItem.height : (def.defaultHeight || null),
          collapsed: typeof savedItem.collapsed === 'boolean' ? savedItem.collapsed : Boolean(def.defaultCollapsed),
          hidden: typeof savedItem.hidden === 'boolean' ? savedItem.hidden : false,
        });
      }
    }

    // Append any newly added default tiles not yet in saved layout
    for (const def of defaultTiles) {
      if (!mapById.has(def.id)) {
        ordered.push({
          id: def.id,
          colSpan: def.defaultColSpan || 12,
          height: def.defaultHeight || null,
          collapsed: Boolean(def.defaultCollapsed),
          hidden: false,
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
  return defaultTiles.map(def => ({
    id: def.id,
    colSpan: def.defaultColSpan || 12,
    height: def.defaultHeight || null,
    collapsed: Boolean(def.defaultCollapsed),
    hidden: false,
  }));
}

export function useTileLayout(layoutId, defaultTiles) {
  const [deviceMode, setDeviceMode] = useState(getDeviceMode);
  const [isEditing, setIsEditing] = useState(false);

  const defaultTilesKey = useMemo(
    () => defaultTiles.map(d => `${d.id}:${d.defaultColSpan || 12}`).join('|'),
    [defaultTiles]
  );

  const [layout, setLayout] = useState(() => {
    return loadSavedLayout(layoutId, getDeviceMode(), defaultTiles) || buildDefaultState(defaultTiles);
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
    const loaded = loadSavedLayout(layoutId, deviceMode, defaultTiles) || buildDefaultState(defaultTiles);
    setLayout(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId, deviceMode, defaultTilesKey]);

  const persistLayout = useCallback(
    (updater) => {
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
        copy.splice(targetIdx, 0, moved);
        return copy;
      });
    },
    [persistLayout]
  );

  const reorderTiles = useCallback(
    (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return;
      persistLayout(prev => {
        const srcIdx = prev.findIndex(item => item.id === sourceId);
        const tgtIdx = prev.findIndex(item => item.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(srcIdx, 1);
        copy.splice(tgtIdx, 0, moved);
        return copy;
      });
    },
    [persistLayout]
  );

  const setTileColSpan = useCallback(
    (id, colSpan) => {
      const allowed = [3, 4, 6, 8, 9, 12];
      const normalized = allowed.includes(colSpan) ? colSpan : 12;
      persistLayout(prev =>
        prev.map(item => (item.id === id ? { ...item, colSpan: normalized } : item))
      );
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
    (id) => {
      persistLayout(prev =>
        prev.map(item => (item.id === id ? { ...item, collapsed: !item.collapsed } : item))
      );
    },
    [persistLayout]
  );

  const toggleHidden = useCallback(
    (id) => {
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
    reorderTiles,
    setTileColSpan,
    setTileHeight,
    toggleCollapse,
    toggleHidden,
    resetLayout,
  };
}
