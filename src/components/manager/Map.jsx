import React, { useState, useRef, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ShipyardMap({ tickets = [], plannedServices = [], modeType = 'tickets', machines = [], regions = [], user, plannedWarningDays = 30, onNavigateToTickets }) {
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [hoveredPin, setHoveredPin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // States for Edit Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempPos, setTempPos] = useState(null);
  const [editingType, setEditingType] = useState('region'); // 'region' or 'machine'
  const [editingId, setEditingId] = useState('');
  
  // Drag & Drop
  const [draggingPin, setDraggingPin] = useState(null); // { id, type, xPercent, yPercent }
  
  // Zoom & Pan
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const initialScaleRef = useRef(1);
  const pointerDownPosRef = useRef(null);
  
  const mapContainerRef = useRef(null);
  const imgRef = useRef(null);

  // Exact bounds of the visual image inside object-fit: contain
  const [imgBounds, setImgBounds] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imgRef.current || !naturalSize.width) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const containerHeight = entry.contentRect.height;
      const imgRatio = naturalSize.width / naturalSize.height;
      const containerRatio = containerWidth / containerHeight;

      let renderWidth, renderHeight;
      if (containerRatio > imgRatio) {
        renderHeight = containerHeight;
        renderWidth = containerHeight * imgRatio;
      } else {
        renderWidth = containerWidth;
        renderHeight = containerWidth / imgRatio;
      }

      setImgBounds({ width: renderWidth, height: renderHeight });
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [naturalSize]);

  // Tooltip hover timeout
  const hideTimeoutRef = useRef(null);

  // Zoptymalizowane obliczanie statusu pinezek
  const pinData = useMemo(() => {
    const pins = [];
    const now = new Date();
    
    // First, find all machines that have pins
    const pinnedMachineIds = new Set(
      machines.filter(m => m.xPercent != null && m.yPercent != null).map(m => m.id)
    );
    
    // Process Regions
    regions.forEach(region => {
      if (region.xPercent == null || region.yPercent == null) return;
      
      let status = 'ok';
      let count = 0;

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => 
          t.regionId === region.id && 
          t.status !== 5 && 
          !pinnedMachineIds.has(t.machineId)
        );
        if (activeTickets.length > 0) {
          status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        }
        count = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        // Find machines in this region that are NOT pinned individually
        const regionMachineIds = machines.filter(m => m.regionId === region.id && !pinnedMachineIds.has(m.id)).map(m => m.id);
        const activePlans = plannedServices.filter(p => regionMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
        
        activePlans.forEach(p => {
          let isOverdue = false;
          let isWarning = false;
          if (p.nextDate) {
            const nextDate = p.nextDate.toDate ? p.nextDate.toDate() : new Date(p.nextDate);
            if (nextDate < now) {
              isOverdue = true;
            } else {
              const diffTime = Math.abs(nextDate - now);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays <= plannedWarningDays) isWarning = true;
            }
          }
          if (p.targetWorkHours) {
            const m = machines.find(mac => mac.id === p.machineId);
            if (m) {
              if (m.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval) {
                // Warning if we are within roughly the equivalent of warning days in hours (naive approach: 24h a day)
                // Let's assume standard use, maybe 10 rbg per day. So 30 days is 300 rbg. 
                // Or simpler: if (target - current) < (hoursInterval * (plannedWarningDays/365)) - not very reliable.
                // Let's just say warning if < 10% of interval left or < 100 rbg? 
                // Actually, the user's request: "zielony - brak planowanych serwisów w najbliższych 30 dniach, zółty - serwis planowany w najbliższych 30 dniach" 
                // Mostly calendar logic. For RBG, let's say 24rbg/day * plannedWarningDays as a rough threshold.
                const rbgThreshold = plannedWarningDays * 8; // Assuming 8h shift/day
                if ((p.targetWorkHours - m.currentWorkHours) <= rbgThreshold) isWarning = true;
              }
            }
          }
          if (p.status === 'in_progress') status = 'in_progress';
            else if (isOverdue && status !== 'in_progress') status = 'critical';
            else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
        });
        count = activePlans.length;
      }
      
      pins.push({
        id: region.id,
        type: 'region',
        name: region.name,
        xPercent: region.xPercent,
        yPercent: region.yPercent,
        status,
        itemCount: count,
        machineCount: machines.filter(m => m.regionId === region.id).length
      });
    });

    // Process Machines
    machines.forEach(machine => {
      if (machine.xPercent == null || machine.yPercent == null) return;
      
      let status = 'ok';
      let count = 0;

      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5);
        if (activeTickets.length > 0) {
          status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        }
        count = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => p.machineId === machine.id && (p.status === 'pending' || p.status === 'in_progress'));
        activePlans.forEach(p => {
          let isOverdue = false;
          let isWarning = false;
          if (p.nextDate) {
            const nextDate = p.nextDate.toDate ? p.nextDate.toDate() : new Date(p.nextDate);
            if (nextDate < now) {
              isOverdue = true;
            } else {
              const diffTime = Math.abs(nextDate - now);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays <= plannedWarningDays) isWarning = true;
            }
          }
          if (p.targetWorkHours) {
            if (machine.currentWorkHours >= p.targetWorkHours) {
              isOverdue = true;
            } else if (p.hoursInterval) {
              const rbgThreshold = plannedWarningDays * 8;
              if ((p.targetWorkHours - machine.currentWorkHours) <= rbgThreshold) isWarning = true;
            }
          }
          if (p.status === 'in_progress') status = 'in_progress';
            else if (isOverdue && status !== 'in_progress') status = 'critical';
            else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
        });
        count = activePlans.length;
      }
      
      pins.push({
        id: machine.id,
        type: 'machine',
        name: machine.name,
        xPercent: machine.xPercent,
        yPercent: machine.yPercent,
        status,
        itemCount: count,
        machineCount: 1
      });
    });

    return pins;
  }, [tickets, plannedServices, modeType, machines, regions, plannedWarningDays]);

  // Apply drag preview
  const displayPins = useMemo(() => {
    if (!draggingPin) return pinData;
    return pinData.map(p => 
      (p.id === draggingPin.id && p.type === draggingPin.type)
        ? { ...p, xPercent: draggingPin.xPercent, yPercent: draggingPin.yPercent }
        : p
    );
  }, [pinData, draggingPin]);

  // Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handlePointerDown = (e, pin) => {
    if (mode !== 'edit') return;
    if (e.target.closest('button')) return; // Nie zaczynaj przeciągania jeśli kliknięto przycisk usunięcia
    e.stopPropagation();
    e.preventDefault();
    setDraggingPin({ id: pin.id, type: pin.type, xPercent: pin.xPercent, yPercent: pin.yPercent });
  };

  const handlePointerMove = (e) => {
    if (isPanningMap) {
      setZoomPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (mode !== 'edit' || !draggingPin) return;
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    setDraggingPin(prev => ({ ...prev, xPercent, yPercent }));
  };

  const handlePointerUp = async (e) => {
    // Ręczne wykrywanie "kliknięcia" (tap) dla urządzeń mobilnych
    let isTap = false;
    if (pointerDownPosRef.current && e) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      const dt = Date.now() - pointerDownPosRef.current.time;
      if (Math.hypot(dx, dy) < 15 && dt < 500) {
        isTap = true;
      }
      pointerDownPosRef.current = null;
    }

    if (isPanningMap) {
      setIsPanningMap(false);
    }

    if (isTap && e.target.tagName.toLowerCase() === 'img') {
      handleMapClick(e);
    }

    if (mode !== 'edit' || !draggingPin) return;
    
    const { id, type, xPercent, yPercent } = draggingPin;
    setDraggingPin(null);
    
    try {
      const collectionName = type === 'region' ? 'regions' : 'machines';
      await updateDoc(doc(db, collectionName, id), { xPercent, yPercent });
    } catch (error) {
      console.error("Błąd zapisywania przemieszczonej pinezki:", error);
    }
  };

  const handleMapClick = (e) => {
    if (mode === 'view') {
      setHoveredPin(null);
      return;
    }
    
    if (mode !== 'edit' || draggingPin) return;
    
    const boundsContainer = document.getElementById('map-bounds-container');
    if (!boundsContainer) return;
    const rect = boundsContainer.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Odrzucenie kliknięć poza widocznym obrazem
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return; 
    }

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setTempPos({ xPercent, yPercent });
    setEditingId('');
    setIsModalOpen(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!tempPos || !editingId) return;

    try {
      const collectionName = editingType === 'region' ? 'regions' : 'machines';
      await updateDoc(doc(db, collectionName, editingId), {
        xPercent: tempPos.xPercent,
        yPercent: tempPos.yPercent
      });
      setIsModalOpen(false);
      setTempPos(null);
    } catch (error) {
      console.error("Błąd podczas zapisywania pinezki: ", error);
      alert("Wystąpił błąd zapisu.");
    }
  };

  const handleDeletePin = async (id, type) => {
    if (confirm("Czy na pewno chcesz usunąć tę pinezkę z mapy?")) {
      try {
        const collectionName = type === 'region' ? 'regions' : 'machines';
        await updateDoc(doc(db, collectionName, id), {
          xPercent: null,
          yPercent: null
        });
      } catch (error) {
        console.error("Błąd usuwania pinezki: ", error);
      }
    }
  };

  const getUnpinnedItems = () => {
    if (editingType === 'region') {
      return regions.filter(r => r.xPercent == null || r.yPercent == null);
    } else {
      return machines.filter(m => m.xPercent == null || m.yPercent == null);
    }
  };

  const [tooltipPos, setTooltipPos] = useState({ isNearTop: false, isNearLeft: false, isNearRight: false });

  const handleMouseEnter = (pinId, e) => {
    if (mode === 'view') {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      
      // Obliczamy pozycję tylko gdy faktycznie wjeżdżamy na pinezkę, a nie podtrzymujemy tooltip
      if (hoveredPin !== pinId && e && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
          isNearTop: rect.top < 200,
          isNearLeft: rect.left < 250,
          isNearRight: window.innerWidth - rect.right < 250
        });
      }
      setHoveredPin(pinId);
    }
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredPin(null);
    }, 300); // 300ms delay to allow moving to tooltip
  };

  return (
    <div className={`flex flex-col animate-fade-in relative ${isFullscreen ? 'h-screen w-screen bg-slate-900 p-2 sm:p-4' : 'h-full space-y-2'}`} ref={isFullscreen ? null : mapContainerRef}>
      

      {/* Kontener Mapy */}
      <div 
        ref={isFullscreen ? mapContainerRef : null}
        className={`flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 relative group flex items-center justify-center select-none touch-none ${isFullscreen ? 'w-full h-full pt-20 sm:pt-24' : ''}`}
        style={{ minHeight: '600px' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerDown={(e) => {
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          if (!e.target.closest('.group\\/pin') && !e.target.closest('button')) {
            setIsPanningMap(true);
            setPanStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
          }
        }}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden touch-none"
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            setZoomScale(s => Math.min(Math.max(1, parseFloat((s + delta).toFixed(2))), 5));
          }}
          onTouchStart={(e) => {
            if (e.touches.length >= 2) {
              setIsPanningMap(false); // Blokujemy panoramowanie gdy uzytkownik zaczyna robic pinch to zoom
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              touchDistRef.current = dist;
              initialScaleRef.current = zoomScale;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && touchDistRef.current) {
              const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
              );
              const factor = dist / touchDistRef.current;
              setZoomScale(s => Math.min(Math.max(1, s * factor), 5));
              touchDistRef.current = dist;
            }
          }}
          onTouchEnd={() => { touchDistRef.current = null; }}
        >
          {/* Transform Wrapper dla Zoom i Pan */}
          <div 
            className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out origin-center"
            style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})` }}
          >
            {/* Obraz tła dopasowany do okna (contain) */}
            <img 
              ref={imgRef}
              src="./Crist_SA_map.jpg" 
              alt="Mapa Stoczni" 
              className={`w-full h-full object-contain transition-opacity duration-300 ${mode === 'edit' ? 'opacity-80' : 'opacity-100'} cursor-${mode === 'edit' ? (draggingPin ? 'grabbing' : 'crosshair') : (isPanningMap ? 'grabbing' : 'grab')}`}
              onClick={handleMapClick} // Zostawiamy jako fallback dla desktopu
              draggable="false"
              onLoad={(e) => setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://placehold.co/1600x900/1e293b/94a3b8?text=BRAK+MAPY.%5CnWgraj+plik+Crist_SA_map.jpg+do+folderu+publicznego.';
              }}
            />

            {/* Wrapper na pinezki - ma dokładny rozmiar widzialnego obrazka! */}
            {imgBounds.width > 0 && (
              <div 
                id="map-bounds-container"
                className="absolute pointer-events-none"
                style={{ width: `${imgBounds.width}px`, height: `${imgBounds.height}px` }}
              >
                {/* Nakładka instruktażowa w trybie edycji */}
                {mode === 'edit' && !draggingPin && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none flex items-center justify-center z-10">
                    <div className="bg-amber-500/90 backdrop-blur text-white px-6 py-2 rounded-full font-bold shadow-xl animate-pulse text-sm whitespace-nowrap">
                      Kliknij aby przypiąć, lub chwyć pinezkę aby przesunąć
                    </div>
                  </div>
                )}

                {/* Rysowanie Pinezek */}
                {displayPins.map(pin => {
                  const isHovered = hoveredPin === pin.id;
                  const isDraggingThis = draggingPin?.id === pin.id;
                  
                  let bgColor = 'bg-emerald-500';
                  let ringColor = 'ring-emerald-500/40';
                  let isCritical = false;
                    let isInProgress = false;

                  if (pin.status === 'critical') {
                    bgColor = 'bg-red-500';
                    ringColor = 'ring-red-500/50';
                    isCritical = true;
                  } else if (pin.status === 'in_progress') {
                      bgColor = 'bg-blue-500';
                      ringColor = 'ring-blue-500/50';
                      isInProgress = true;
                    } else if (pin.status === 'warning') {
                    bgColor = 'bg-amber-500';
                    ringColor = 'ring-amber-500/40';
                  }

                  // Inteligentne pozycjonowanie chmurki bazujące na rzeczywistej pozycji ekranowej
                  const { isNearTop, isNearLeft, isNearRight } = tooltipPos;

                  let tooltipPosClass = "bottom-full left-1/2 -translate-x-1/2 mb-4";
                  let arrowClass = "top-full left-1/2 -translate-x-1/2 border-t-slate-900/95";

                  if (isNearTop) {
                    tooltipPosClass = "top-full left-1/2 -translate-x-1/2 mt-4";
                    arrowClass = "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95";
                  }
                  if (isNearLeft) {
                    tooltipPosClass = isNearTop ? "top-full left-0 mt-4" : "bottom-full left-0 mb-4";
                    arrowClass = isNearTop ? "bottom-full left-4 border-b-slate-900/95" : "top-full left-4 border-t-slate-900/95";
                  } else if (isNearRight) {
                    tooltipPosClass = isNearTop ? "top-full right-0 mt-4" : "bottom-full right-0 mb-4";
                    arrowClass = isNearTop ? "bottom-full right-4 border-b-slate-900/95" : "top-full right-4 border-t-slate-900/95";
                  }

                  return (
                    <div 
                      key={`${pin.type}-${pin.id}`}
                      className={`absolute group/pin ${isDraggingThis ? 'z-[60]' : (isHovered ? 'z-[50]' : 'z-20')} pointer-events-auto ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                      style={{ 
                        left: `${pin.xPercent}%`, 
                        top: `${pin.yPercent}%`,
                        transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
                        transformOrigin: 'center center'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === 'view') {
                          // Jeśli klikamy w telefonie, pokazujemy tooltip
                          if (hoveredPin !== pin.id) {
                            handleMouseEnter(pin.id, e);
                          } else {
                            setHoveredPin(null);
                          }
                        }
                      }}
                      onMouseEnter={(e) => handleMouseEnter(pin.id, e)}
                      onMouseLeave={handleMouseLeave}
                      onPointerDown={(e) => handlePointerDown(e, pin)}
                    >
                      {/* Obszar najechania (delikatny margines błędu) */}
                      <div className="absolute -inset-2 bg-transparent"></div>

                      {/* Pulsacja */}
                      {isCritical && !isDraggingThis && (
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>
                      )}
                      {isInProgress && !isDraggingThis && (
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75 pointer-events-none scale-[2.5]"></div>
                      )}
                      
                      {/* Zwykła, mała kropka */}
                      <div className={`
                        relative w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center
                        border-2 border-white shadow-lg transition-all duration-300
                        ${bgColor} ring-4 ${ringColor}
                        ${isHovered || isDraggingThis ? 'scale-150' : 'scale-100'}
                      `}></div>
                      
                      {/* Usuwanie w trybie edycji */}
                      {mode === 'edit' && !isDraggingThis && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id, pin.type); }}
                          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:bg-red-700 hover:scale-110 z-30 pointer-events-auto"
                          title="Usuń z mapy"
                        >
                          <i className="ph ph-x text-xs font-bold"></i>
                        </button>
                      )}

                      {/* Tooltip w trybie View */}
                      {isHovered && mode === 'view' && (
                        <div 
                          className={`absolute ${tooltipPosClass} w-56 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-50 animate-fade-in`}
                          onMouseEnter={() => handleMouseEnter(pin.id)} // Podtrzymanie
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="font-black text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
                            <i className={`ph ${pin.type === 'machine' ? 'ph-engine' : 'ph-map-pin'} text-slate-400`}></i>
                            {pin.name}
                          </div>
                          
                          <div className="mt-3 space-y-2 mb-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Stan:</span>
                              {pin.status === 'critical' ? (
                                <span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? 'ZALEGŁOŚCI' : 'AWARIA KRYTYCZNA'}</span>
                              ) : pin.status === 'in_progress' ? (
                                  <span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> Serwis w trakcie</span>
                                ) : pin.status === 'warning' ? (
                                <span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? 'Zbliża się serwis' : 'Usterka'}</span>
                              ) : (
                                <span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? 'Brak pilnych' : 'Gotowe'}</span>
                              )}
                            </div>
                            {pin.type === 'region' && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Maszyny w rejonie:</span>
                                <span className="font-bold">{pin.machineCount}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : 'Aktywne zgłoszenia:'}</span>
                              <span className="font-bold">{pin.itemCount}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if(isFullscreen) document.exitFullscreen?.();
                              onNavigateToTickets(pin.name);
                            }}
                            className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2`}
                          >
                            {modeType === 'planned_maintenance' ? 'Przejdź do serwisów' : 'Przejdź do awarii'} <i className="ph ph-arrow-right"></i>
                          </button>

                          {/* Trójkącik tooltipa */}
                          <div className={`absolute ${arrowClass} border-[6px] border-transparent pointer-events-none`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Przyciski Narzędzi i Widoku (umieszczone na mapie, napis usunięty) */}
          <div className="absolute top-4 left-4 z-30 flex flex-wrap gap-2">
            { (user?.role === 'admin' || user?.permissions?.includes('edit_map')) && (
              <>
                <button 
                  onClick={() => setMode('view')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'view' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-eye text-base sm:text-lg"></i> <span className="hidden sm:inline">Podgląd</span>
                </button>
                <button 
                  onClick={() => setMode('edit')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-pencil-simple text-base sm:text-lg"></i> <span className="hidden sm:inline">Edycja</span>
                </button>
              </>
            )}
            <button 
              onClick={toggleFullscreen} 
              className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white flex items-center gap-2 shadow-md"
            >
              <i className={`ph ${isFullscreen ? 'ph-corners-in' : 'ph-corners-out'} text-base sm:text-lg`}></i> 
              <span className="hidden sm:inline">{isFullscreen ? 'Zamknij' : 'Pełny ekran'}</span>
            </button>
          </div>

          {/* Przyciski Sterowania Zoomem */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl">
            <button 
              onClick={() => setZoomScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 4))} 
              className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-xl shadow-sm transition-colors"
              title="Powiększ (+)"
            >
              +
            </button>
            <button 
              onClick={() => { setZoomScale(1); setZoomPan({ x: 0, y: 0 }); }} 
              className="w-9 h-9 flex items-center justify-center text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-mono font-bold shadow-sm transition-colors"
              title="Resetuj powiększenie (100%) i pozycję"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button 
              onClick={() => setZoomScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 1))} 
              className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-xl shadow-sm transition-colors"
              title="Pomniejsz (-)"
            >
              -
            </button>
          </div>
        </div>
      </div>



      {/* Modal - Dodawanie / Edycja Pinezki */}
      {isModalOpen && mode === 'edit' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="ph ph-push-pin text-blue-600 text-xl"></i> 
                Przypnij Obiekt
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSavePin} className="p-6 space-y-5">
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setEditingType('region'); setEditingId(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Rejon / Hala
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingType('machine'); setEditingId(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Konkretna Maszyna
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Wybierz element z bazy</label>
                <select 
                  value={editingId} 
                  onChange={e => setEditingId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 font-medium"
                  required
                >
                  <option value="">-- Wybierz z listy --</option>
                  {getUnpinnedItems().map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                {getUnpinnedItems().length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-2"><i className="ph ph-warning-circle"></i> Brak obiektów bez przypiętej lokalizacji. Usuń najpierw jakąś pinezkę z mapy.</p>
                )}
              </div>

              <div className="pt-2">
                <button type="submit" disabled={!editingId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-sm">
                  Zapisz pinezkę na mapie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
