import React, { useState, useRef, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { safeParseDate } from '../../utils/dateHelpers';

// Globalny cache dla obrazów mapy (działa do wylogowania/odświeżenia)
const mapImageCache = {};

export default function ShipyardMap({ tickets = [], plannedServices = [], modeType = 'tickets', machines = [], regions = [], user, plannedWarningDays = 30, onNavigateToTickets }) {
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [hoveredPin, setHoveredPin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapConfig, setMapConfig] = useState({
    url: '',
    defaultZoom: 1,
    defaultPan: { x: 0, y: 0 }
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [cachedMainMap, setCachedMainMap] = useState('');
  const [cachedSubmaps, setCachedSubmaps] = useState({});
  const [currentSubmapId, setCurrentSubmapId] = useState(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load map config from firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'map'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapConfig({
          url: data.mapUrl || '',
          defaultZoom: data.defaultZoom || 1,
          defaultPan: { x: data.defaultPanX || 0, y: data.defaultPanY || 0 }
        });
        if (!mapLoaded) {
          setZoomScale(data.defaultZoom || 1);
          setZoomPan({ x: data.defaultPanX || 0, y: data.defaultPanY || 0 });
          setMapLoaded(true);
        }
      } else {
        setMapLoaded(true);
      }
    });
    return () => unsub();
  }, [mapLoaded]);


  const [mapDragActive, setMapDragActive] = useState(false);
  const handleMapDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(true); };
  const handleMapDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setMapDragActive(false); };
  const handleMapDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleMapDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMapDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processMapFile(e.dataTransfer.files[0]);
    }
  };
  const handleMapFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processMapFile(e.target.files[0]);
    }
  };
  const processMapFile = (file) => {

    if (!file) return;
    setUploadingMap(true);
    
    const storageRef = ref(storage, 'map_backgrounds/' + Date.now() + '_' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error", error);
        alert("Błąd wgrywania: " + error.message);
        setUploadingMap(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await setDoc(doc(db, 'settings', 'map'), { mapUrl: downloadURL }, { merge: true });
        setUploadingMap(false);
        setUploadProgress(0);
      }
    );
  };

  const saveDefaultView = async () => {
    try {
      await setDoc(doc(db, 'settings', 'map'), {
        defaultZoom: zoomScale,
        defaultPanX: zoomPan.x,
        defaultPanY: zoomPan.y
      }, { merge: true });
      alert("Widok został zapisany jako domyślny dla wszystkich!");
    } catch(err) {
      alert("Błąd zapisu widoku.");
    }
  };

  
  // States for Edit Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageProgress, setImageProgress] = useState(0);
  const imgRef = useRef(null);

  const currentMapUrl = currentSubmapId ? (regions.find(r => r.id === currentSubmapId)?.mapImageUrl || mapConfig.url) : mapConfig.url;

  useEffect(() => {
    if (!currentMapUrl) return;
    
    if (mapImageCache[currentMapUrl]) {
      setIsImageLoading(false);
      setImageProgress(100);
      return;
    }

    setIsImageLoading(true);
    setImageProgress(0);

    const safetyTimeout = setTimeout(() => {
      setIsImageLoading(false);
      setImageProgress(100);
      mapImageCache[currentMapUrl] = true;
    }, 4000); // 4 seconds max loading screen

    // If image is already loaded from cache before effect runs
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      clearTimeout(safetyTimeout);
      setIsImageLoading(false);
      setImageProgress(100);
      mapImageCache[currentMapUrl] = true;
      return;
    }

    const interval = setInterval(() => {
      setImageProgress(p => {
        if (p >= 90) return 90;
          const next = p + Math.floor(Math.random() * 15) + 5;
          return next > 90 ? 90 : next;
      });
    }, 200);
    return () => { clearInterval(interval); clearTimeout(safetyTimeout); };
  }, [currentMapUrl]);
  const [tempPos, setTempPos] = useState(null);
  const [editingType, setEditingType] = useState('region'); // 'region' or 'machine'
  const [editingId, setEditingId] = useState('');
  
  // Drag & Drop
  const [draggingPin, setDraggingPin] = useState(null);
const [isSettingsMinimized, setIsSettingsMinimized] = useState(true); // { id, type, xPercent, yPercent }
  
  // Zoom & Pan
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const initialScaleRef = useRef(1);
  const pointerDownPosRef = useRef(null);
  
  const mapContainerRef = useRef(null);
  const mapContentRef = useRef(null);

  useEffect(() => {
    const el = mapContentRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault(); // Teraz to zadziała poprawnie i zablokuje przewijanie strony
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomScale(s => Math.min(Math.max(1, parseFloat((s + delta).toFixed(2))), 5));
    };

    // Rejestrujemy zdarzenie z wymuszeniem 'passive: false'
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);


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

    if (currentSubmapId === null) {
      // MAIN MAP
      // Process Regions
      regions.forEach(region => {
        if (region.xPercent == null || region.yPercent == null) return;
        
        let status = 'ok';
        let count = 0;
        let machineCount = 0;

        const regionMachineIds = machines.filter(m => m.regionId === region.id).map(m => m.id);
          const submapMachineIds = machines.filter(m => {
            if (m.regionId !== region.id) return false;
            const isPinnedOnMain = m.pinnedOnMap === 'main' || (!m.pinnedOnMap && (!region || !region.mapImageUrl));
            return !isPinnedOnMain; 
          }).map(m => m.id);
          machineCount = regionMachineIds.length;

          if (modeType === 'tickets') {
            const activeTickets = tickets.filter(t => submapMachineIds.includes(t.machineId) && t.status !== 5 && t.status !== '5');
          if (activeTickets.length > 0) {
            status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
          }
          count = activeTickets.length;
        } else if (modeType === 'planned_maintenance') {
          const activePlans = plannedServices.filter(p => submapMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
          
          activePlans.forEach(p => {
            let isOverdue = false;
            let isWarning = false;
            if (p.nextDate) {
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              const m = machines.find(mac => mac.id === p.machineId);
              if (m) {
                if (m.currentWorkHours >= p.targetWorkHours) isOverdue = true;
                else if (p.hoursInterval && (p.targetWorkHours - m.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
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
          machineCount,
          hasSubmap: !!region.mapImageUrl
        });
      });

      // Process Machines
      machines.forEach(machine => {
        if (machine.xPercent == null || machine.yPercent == null) return;
        const region = regions.find(r => r.id === machine.regionId);
        
        const isPinnedOnMain = machine.pinnedOnMap === 'main' || (!machine.pinnedOnMap && (!region || !region.mapImageUrl));
        if (!isPinnedOnMain) return;
        
        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
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
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              if (machine.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval && (p.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
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
          itemCount: count
        });
      });
    } else {
      // SUBMAP (Show only machines belonging to currentSubmapId)
      machines.forEach(machine => {
        if (machine.regionId !== currentSubmapId || machine.xPercent == null || machine.yPercent == null) return;
        
        let status = 'ok';
        let count = 0;

        if (modeType === 'tickets') {
          const activeTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 5 && t.status !== '5');
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
              const nextDate = safeParseDate(p.nextDate);
              if (nextDate < now) isOverdue = true;
              else {
                const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
                if (diffDays <= plannedWarningDays) isWarning = true;
              }
            }
            if (p.targetWorkHours) {
              if (machine.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval && (p.targetWorkHours - machine.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
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
          itemCount: count
        });
      });
    }

    
return pins;

  }, [tickets, plannedServices, modeType, machines, regions, plannedWarningDays, currentSubmapId]);

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
        const updateData = { xPercent, yPercent };
        if (type === 'machine') {
           updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
        }
        await updateDoc(doc(db, collectionName, id), updateData);
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
      if (currentSubmapId !== null) setEditingType('machine');
      setIsModalOpen(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!tempPos || !editingId) return;

    try {
      const collectionName = editingType === 'region' ? 'regions' : 'machines';
      const updateData = { xPercent: tempPos.xPercent, yPercent: tempPos.yPercent };
      if (editingType === 'machine') {
         updateData.pinnedOnMap = currentSubmapId === null ? 'main' : 'submap';
      }
      await updateDoc(doc(db, collectionName, editingId), updateData);
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
      if (currentSubmapId !== null) {
        return machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null));
      }
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

  
  const unpinnedData = useMemo(() => {
    let status = 'ok';
    let unpinnedCount = 0;
    let unpinnedMachineCount = 0;
    let unpinnedMachineIds = [];
    const now = new Date();

    if (currentSubmapId === null) {
      unpinnedMachineIds = machines.filter(m => m.xPercent == null || m.yPercent == null).map(m => m.id);
    } else {
      unpinnedMachineIds = machines.filter(m => m.regionId === currentSubmapId && (m.xPercent == null || m.yPercent == null)).map(m => m.id);
    }
    unpinnedMachineCount = unpinnedMachineIds.length;

    if (unpinnedMachineIds.length > 0) {
      if (modeType === 'tickets') {
        const activeTickets = tickets.filter(t => unpinnedMachineIds.includes(t.machineId) && t.status !== 5 && t.status !== '5');
        if (activeTickets.length > 0) {
          status = activeTickets.some(t => t.isCritical) ? 'critical' : 'warning';
        }
        unpinnedCount = activeTickets.length;
      } else if (modeType === 'planned_maintenance') {
        const activePlans = plannedServices.filter(p => unpinnedMachineIds.includes(p.machineId) && (p.status === 'pending' || p.status === 'in_progress'));
        activePlans.forEach(p => {
          let isOverdue = false;
          let isWarning = false;
          if (p.nextDate) {
            const nextDate = safeParseDate(p.nextDate);
            if (nextDate < now) isOverdue = true;
            else {
              const diffDays = Math.ceil(Math.abs(nextDate - now) / (1000 * 60 * 60 * 24)); 
              if (diffDays <= plannedWarningDays) isWarning = true;
            }
          }
          if (p.targetWorkHours) {
            const m = machines.find(mac => mac.id === p.machineId);
            if (m) {
              if (m.currentWorkHours >= p.targetWorkHours) isOverdue = true;
              else if (p.hoursInterval && (p.targetWorkHours - m.currentWorkHours) <= plannedWarningDays * 8) isWarning = true;
            }
          }
          if (p.status === 'in_progress') status = 'in_progress';
          else if (isOverdue && status !== 'in_progress') status = 'critical';
          else if (status !== 'critical' && status !== 'in_progress' && isWarning) status = 'warning';
        });
        unpinnedCount = activePlans.length;
      }
    }
    return { status, unpinnedCount, unpinnedMachineCount };
  }, [tickets, plannedServices, modeType, machines, currentSubmapId, plannedWarningDays]);

  const getUnpinnedColor = () => {
    if (unpinnedData.status === 'critical') return 'text-red-500';
    if (unpinnedData.status === 'in_progress') return 'text-blue-500';
    if (unpinnedData.status === 'warning') return 'text-amber-500';
    return 'text-emerald-500';
  };
  
  const getUnpinnedBgColor = () => {
    if (unpinnedData.status === 'critical') return 'text-red-500/80';
    if (unpinnedData.status === 'in_progress') return 'text-blue-500/80';
    if (unpinnedData.status === 'warning') return 'text-amber-500/80';
    return 'text-emerald-500/80';
  };

  const getUnpinnedPulse = () => {
    return unpinnedData.status === 'critical' || unpinnedData.status === 'in_progress' ? 'animate-pulse' : '';
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredPin(null);
    }, 300); // 300ms delay to allow moving to tooltip
  };

  
  const renderUnpinnedTooltip = () => {
    if (hoveredPin !== 'unpinned_items') return null;

    return (
      <div 
        className="absolute right-[110%] top-0 w-44 md:w-56 bg-slate-900/95 backdrop-blur-md text-white p-2 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-[60] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-black text-[10px] md:text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
          <i className="ph ph-push-pin text-slate-400"></i>
          Nieprzypięte
        </div>
        
        <div className="mt-1 md:mt-3 space-y-1 md:space-y-2 mb-2 md:mb-4">
          <div className="flex justify-between items-center text-[9px] md:text-xs">
            <span className="text-slate-400">Stan:</span>
            {unpinnedData.status === 'critical' ? (
              <span className="font-bold text-red-400 flex items-center gap-1"><i className="ph ph-siren animate-pulse"></i> {modeType === 'planned_maintenance' ? 'ZALEGŁOŚCI' : 'AWARIA KRYTYCZNA'}</span>
            ) : unpinnedData.status === 'in_progress' ? (
                <span className="font-bold text-blue-400 flex items-center gap-1"><i className="ph ph-wrench animate-pulse"></i> Serwis w trakcie</span>
              ) : unpinnedData.status === 'warning' ? (
              <span className="font-bold text-amber-400">{modeType === 'planned_maintenance' ? 'Zbliża się serwis' : 'Usterka'}</span>
            ) : (
              <span className="font-bold text-emerald-400">{modeType === 'planned_maintenance' ? 'Brak pilnych' : 'Gotowe'}</span>
            )}
          </div>
          <div className="flex justify-between items-center text-[9px] md:text-xs">
            <span className="text-slate-400">Maszyny w rejonie:</span>
            <span className="font-bold">{unpinnedData.unpinnedMachineCount}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] md:text-xs">
            <span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : 'Aktywne zgłoszenia:'}</span>
            <span className="font-bold">{unpinnedData.unpinnedCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if(isFullscreen) document.exitFullscreen?.();
              setHoveredPin(null);
              // "Bez lokalizacji" nie zadziała w globalnej szukarce jeśli go szukamy po stringu 'Nieprzypięte'. 
              // Ponieważ na razie mapowanie nie wspiera szukania unpinned_items, kliknięcie po prostu zamyka tooltip (lub można przeładować na inną logikę). 
              // User poprosił tylko o "chmurkę". Dodamy jednak nawigację po nazwie rejonu "-" lub czymkolwiek, co wyczyści filtr by móc je znaleźć, 
              // albo po prostu wołamy to samo co dla zwykłej pineski.
              onNavigateToTickets && onNavigateToTickets('Nieprzypięte');
            }}
            className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-[9px] md:text-xs transition-colors flex items-center justify-center gap-2`}
          >
            {modeType === 'planned_maintenance' ? 'Przejdź do serwisów' : 'Przejdź do awarii'} <i className="ph ph-arrow-right"></i>
          </button>
        </div>
        {/* Trójkącik tooltipa w prawo */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-3 border-[6px] border-transparent border-l-slate-900/95 pointer-events-none"></div>
      </div>
    );
  };

  return (
      <div className={`flex flex-col animate-fade-in relative ${isFullscreen ? 'h-screen w-screen bg-slate-900 p-2 sm:p-4' : 'h-full space-y-2'}`} ref={isFullscreen ? null : mapContainerRef}>
      

      {/* Kontener Mapy */}
      <div 
        ref={isFullscreen ? mapContainerRef : null}
        className={`flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-700 relative group flex items-center justify-center select-none touch-none ${isFullscreen ? 'w-full h-full' : ''}`}
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
            ref={mapContentRef}
            className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden touch-none"
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
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center"
            style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 0 }}
          >
            {/* Obraz tła dopasowany do okna (contain) */}
            <img 
                ref={imgRef}
                src={currentMapUrl || 'https://placehold.co/1600x900/1e293b/94a3b8?text=BRAK+MAPY.%5CnWgraj+nowa+mape+w+trybie+Edycji.'} 
                alt="Mapa Stoczni" 
                className={`w-full h-full object-contain transition-opacity duration-300 ${mode === 'edit' ? 'opacity-80' : 'opacity-100'} cursor-${mode === 'edit' ? (draggingPin ? 'grabbing' : 'crosshair') : (isPanningMap ? 'grabbing' : 'grab')}`}
                onClick={handleMapClick}
                draggable="false"
                onLoad={(e) => {
                  if (currentMapUrl) mapImageCache[currentMapUrl] = true;
                  setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                  setImageProgress(100);
                  setTimeout(() => setIsImageLoading(false), 200);
                }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://placehold.co/1600x900/1e293b/94a3b8?text=BRAK+MAPY.%5CnWgraj+nowa+mape+w+trybie+Edycji.';
                  setImageProgress(100);
                  setIsImageLoading(false);
                }}
              />
          </div>

          {(isImageLoading && !mapImageCache[currentMapUrl]) && (
              <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
                <i className="ph ph-spinner-gap animate-spin text-5xl mb-4 text-blue-500"></i>
                <h3 className="text-base md:text-xl font-bold mb-2">Ładowanie mapy...</h3>
                <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${imageProgress}%` }}></div>
                </div>
                <p className="mt-2 text-[10px] md:text-sm text-slate-400 font-mono">{imageProgress}%</p>
</div>
)}

            
            {/* Z-INDEX LAYER FOR PINS - Rendered above tools */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out origin-center pointer-events-none"
            style={{ transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, zIndex: 100 }}
          >

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
                    <div className="bg-amber-500/90 backdrop-blur text-white px-6 py-2 rounded-full font-bold shadow-xl animate-pulse text-[10px] md:text-sm whitespace-nowrap">
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
                      
                      
                        {/* Zwykła kropka lub kwadrat dla rejonu z podmapą */}
                        <div className={`
                          relative ${pin.type === 'region' && pin.hasSubmap ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-md' : 'w-3 h-3 sm:w-4 sm:h-4 rounded-full'} flex items-center justify-center
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
                            <i className="ph ph-x text-[9px] md:text-xs font-bold"></i>
                          </button>
                        )}
  
                        {/* Tooltip w trybie View */}
                        {isHovered && mode === 'view' && (
                          <div 
                            className={`absolute ${tooltipPosClass} w-44 md:w-56 bg-slate-900/95 backdrop-blur-md text-white p-2 md:p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto z-50 animate-fade-in`}
                            onMouseEnter={() => handleMouseEnter(pin.id)} // Podtrzymanie
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="font-black text-[10px] md:text-sm mb-1 pb-2 border-b border-slate-700 flex items-center gap-2">
                              <i className={`ph ${pin.type === 'machine' ? 'ph-engine' : 'ph-map-pin'} text-slate-400`}></i>
                              {pin.name}
                            </div>
                            
                            <div className="mt-1 md:mt-3 space-y-1 md:space-y-2 mb-2 md:mb-4">
                              <div className="flex justify-between items-center text-[9px] md:text-xs">
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
                                <div className="flex justify-between items-center text-[9px] md:text-xs">
                                  <span className="text-slate-400">Maszyny w rejonie:</span>
                                  <span className="font-bold">{pin.machineCount}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-[9px] md:text-xs">
                                <span className="text-slate-400">{modeType === 'planned_maintenance' ? 'Zaległe/Oczekujące serwisy:' : 'Aktywne zgłoszenia:'}</span>
                                <span className="font-bold">{pin.itemCount}</span>
                              </div>
                            </div>

                                                        <div className="flex flex-col gap-2 w-full">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(isFullscreen) document.exitFullscreen?.();
                                  onNavigateToTickets(pin.name);
                                }}
                                className={`w-full ${modeType === 'planned_maintenance' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-lg text-[9px] md:text-xs transition-colors flex items-center justify-center gap-2`}
                              >
                                {modeType === 'planned_maintenance' ? 'Przejdź do serwisów' : 'Przejdź do awarii'} <i className="ph ph-arrow-right"></i>
                              </button>

                              {pin.type === 'region' && pin.hasSubmap && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSubmapId(pin.id);
                                    setHoveredPin(null);
                                  }}
                                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-[9px] md:text-xs transition-colors flex items-center justify-center gap-2"
                                >
                                  Wejdź do podmapy <i className="ph ph-arrow-right"></i>
                                </button>
                              )}
                            </div>

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

          
          {/* Ustawienia Mapy (Wgrywanie t'a i widok domyslny) */}
  {mode === 'edit' && currentSubmapId === null && (
    <div className="absolute top-14 sm:top-16 left-4 z-30 bg-white p-3 md:p-4 rounded-xl shadow-xl w-48 sm:w-72 border border-amber-200 animate-fade-in transition-all">
      {isSettingsMinimized ? (
        <button onClick={(e) => { e.stopPropagation(); setIsSettingsMinimized(false); }} className="font-bold text-slate-800 text-[10px] md:text-sm flex items-center gap-2">
          <i className="ph ph-image text-amber-500"></i> Opcje Mapy
        </button>
      ) : (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIsSettingsMinimized(true); }} className="absolute top-2 right-2 text-slate-400 p-1"><i className="ph ph-minus"></i></button>
          <h3 className="font-bold text-slate-800 text-[10px] md:text-sm mb-3 border-b pb-2 flex items-center gap-2">
            <i className="ph ph-image text-amber-500"></i> Ustawienia
          </h3>
          <div className="mb-4">
            <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">1. Wgraj nowa mape</label>
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleMapFileChange} disabled={uploadingMap} className="absolute inset-0 w-full h-full z-50 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              <div className={"w-full border-2 border-dashed rounded-lg p-3 text-center transition-colors " + (mapDragActive ? 'border-amber-500 bg-amber-50' : (uploadingMap ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-blue-300 hover:bg-blue-50'))} onDragEnter={handleMapDragEnter} onDragLeave={handleMapDragLeave} onDragOver={handleMapDragOver} onDrop={handleMapDrop}>
                {uploadingMap ? (
                  <>
                    <i className="ph ph-spinner-gap animate-spin text-2xl text-blue-500 mb-2"></i>
                    <p className="text-[10px] md:text-xs font-bold text-slate-600">Przetwarzanie...</p>
                  </>
                ) : (
                  <>
                    <i className="ph ph-upload-simple text-2xl text-blue-400 mb-2"></i>
                    <p className="text-[10px] md:text-xs font-bold text-slate-600">Kliknij lub upusc plik</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-[9px] md:text-xs font-bold text-slate-500 mb-1">3. Ustaw domyslny widok</label>
            <button onClick={saveDefaultView} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[9px] md:text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <i className="ph ph-floppy-disk"></i> Ustaw jako domyslny kadr
            </button>
          </div>
        </>
      )}
    </div>
  )}

          {/* Przyciski Narzędzi i Widoku (umieszczone na mapie, napis usunięty) */}
          <div className="absolute top-4 left-4 z-[60] flex flex-wrap gap-2 pointer-events-auto">
              {currentSubmapId && (
                <button 
                  onClick={() => setCurrentSubmapId(null)}
                  className="px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md border border-indigo-500 flex items-center gap-2 transition-transform hover:scale-105 pointer-events-auto"
                >
                  <i className="ph ph-arrow-left text-base sm:text-lg"></i>
                  <span className="hidden sm:inline">Powrót do Mapy Głównej</span>
                </button>
              )}
            { (user?.role === 'admin' || user?.permissions?.includes('edit_map')) && (
              <>
                <button 
                  onClick={() => setMode('view')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs sm:text-[10px] md:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'view' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-eye text-base sm:text-lg"></i> <span className="hidden sm:inline">Podgląd</span>
                </button>
                <button 
                  onClick={() => setMode('edit')} 
                  className={`px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs sm:text-[10px] md:text-sm flex items-center gap-2 transition-all shadow-md ${mode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white'}`}
                >
                  <i className="ph ph-pencil-simple text-base sm:text-lg"></i> <span className="hidden sm:inline">Edycja</span>
                </button>
              </>
            )}
            <button 
              onClick={toggleFullscreen} 
              className="px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[9px] md:text-xs sm:text-[10px] md:text-sm bg-white/90 backdrop-blur text-slate-700 border border-slate-300 hover:bg-white flex items-center gap-2 shadow-md"
            >
              <i className={`ph ${isFullscreen ? 'ph-corners-in' : 'ph-corners-out'} text-base sm:text-lg`}></i> 
              <span className="hidden sm:inline">{isFullscreen ? 'Zamknij' : 'Pełny ekran'}</span>
            </button>
          </div>

          
          {/* Statystyki na mapie */}
          {/* Statystyki na mapie */}
            {mode === 'view' && modeType === 'tickets' && (
                <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[220px] scale-[0.65] lg:scale-100 origin-top-right">
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">
                    {currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Awarii'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Wszystkie maszyny</span>
                    <span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span>
                  </div>
                  <div 
                      className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors"
                      onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}
                    >
                      <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> Nieprzypięte</span>
                      <span className={`font-bold text-lg ${getUnpinnedBgColor()}`}>
                        {currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId && m.xPercent == null).length : machines.filter(m => m.xPercent == null).length}
                      </span>
                      {renderUnpinnedTooltip()}
                    </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Zgłoszone awarie</span>
                    <span className="font-bold text-lg text-amber-400">{
                      currentSubmapId 
                      ? tickets.filter(t => t.regionId === currentSubmapId && t.status !== 5 && t.status !== '5').length 
                      : tickets.filter(t => t.status !== 5 && t.status !== '5').length
                    }</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Krytyczne</span>
                    <span className="font-bold text-lg text-rose-500">{
                      currentSubmapId
                      ? tickets.filter(t => t.regionId === currentSubmapId && t.isCritical && t.status !== 5 && t.status !== '5').length
                      : tickets.filter(t => t.isCritical && t.status !== 5 && t.status !== '5').length
                    }</span>
                  </div>
                </div>
              )}

            {mode === 'view' && modeType === 'planned_maintenance' && (
                <div className="absolute top-4 right-2 lg:top-4 lg:right-4 z-[110] bg-slate-900/90 backdrop-blur-md p-2 lg:px-5 lg:py-4 rounded-lg lg:rounded-xl border border-slate-700 shadow-xl text-white pointer-events-none flex flex-col gap-1 lg:gap-3 min-w-[140px] lg:min-w-[240px] scale-[0.65] lg:scale-100 origin-top-right">
                  <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-2">
                    {currentSubmapId ? 'Statystyki Rejonu' : 'Statystyki Serwisów'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Wszystkie maszyny</span>
                    <span className="font-bold text-lg">{currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId).length : machines.length}</span>
                  </div>
                  <div 
                      className="flex items-center justify-between gap-4 relative pointer-events-auto cursor-pointer group rounded p-1 -mx-1 hover:bg-slate-800/50 transition-colors"
                      onMouseEnter={(e) => handleMouseEnter('unpinned_items', e)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => setHoveredPin(hoveredPin === 'unpinned_items' ? null : 'unpinned_items')}
                    >
                      <span className={`text-[10px] md:text-sm font-medium flex items-center gap-1.5 ${getUnpinnedBgColor()}`}><i className={`ph ph-push-pin text-base ${getUnpinnedColor()} ${getUnpinnedPulse()}`}></i> Nieprzypięte</span>
                      <span className={`font-bold text-lg ${getUnpinnedBgColor()}`}>
                        {currentSubmapId ? machines.filter(m => m.regionId === currentSubmapId && m.xPercent == null).length : machines.filter(m => m.xPercent == null).length}
                      </span>
                      {renderUnpinnedTooltip()}
                    </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Planowane (30 dni)</span>
                    <span className="font-bold text-lg text-amber-400">{
                      (() => {
                        const now = new Date();
                        return plannedServices.filter(srv => {
                          if (srv.status === 'completed' || srv.status === 'in_progress') return false;
                          const machine = machines.find(m => m.id === srv.machineId);
                          if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false;
                          let isOverdue = false;
                          let isWarning = false;
                          if (srv.nextDate) {
                            const nDate = safeParseDate(srv.nextDate);
                            if (nDate < now) isOverdue = true;
                            else {
                              const diffDays = Math.ceil(Math.abs(nDate - now) / (1000 * 60 * 60 * 24));
                              if (diffDays <= 30) isWarning = true;
                            }
                          }
                          if (srv.targetWorkHours && machine) {
                            if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
                            else if (srv.hoursInterval && (srv.targetWorkHours - machine.currentWorkHours) <= 30 * 8) isWarning = true;
                          }
                          return !isOverdue && isWarning;
                        }).length;
                      })()
                    }</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] md:text-sm font-medium text-slate-300">Przekroczone / Pilne</span>
                    <span className="font-bold text-lg text-rose-500">{
                      (() => {
                        const now = new Date();
                        return plannedServices.filter(srv => {
                          if (srv.status === 'completed' || srv.status === 'in_progress') return false;
                          const machine = machines.find(m => m.id === srv.machineId);
                          if (currentSubmapId && (!machine || machine.regionId !== currentSubmapId)) return false;
                          if (srv.nextDate && safeParseDate(srv.nextDate) < now) return true;
                          if (srv.targetWorkHours && machine && machine.currentWorkHours >= srv.targetWorkHours) return true;
                          return false;
                        }).length;
                      })()
                    }</span>
                  </div>
                </div>
              )}

          {/* Przyciski Sterowania Zoomem */}
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
              title="Resetuj powiększenie (100%) i pozycję"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button 
              onClick={() => setZoomScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 1))} 
              className="w-9 h-9 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-extrabold text-base md:text-xl shadow-sm transition-colors"
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
                <i className="ph ph-push-pin text-blue-600 text-base md:text-xl"></i> 
                Przypnij Obiekt
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <i className="ph ph-x text-base md:text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSavePin} className="p-6 space-y-5">
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    type="button"
                    disabled={currentSubmapId !== null}
                    onClick={() => { setEditingType('region'); setEditingId(''); }}
                    style={{ opacity: currentSubmapId !== null ? 0.3 : 1 }}
                  className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'region' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Rejon / Hala
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingType('machine'); setEditingId(''); }}
                  className={`flex-1 py-2 text-[10px] md:text-sm font-bold rounded-md transition-all ${editingType === 'machine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Konkretna Maszyna
                </button>
              </div>

              <div>
                <label className="block text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Wybierz element z bazy</label>
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
                    <p className="text-[11px] text-amber-600 mt-2 font-semibold">
                      <i className="ph ph-check-circle mr-1"></i> 
                      {currentSubmapId !== null 
                        ? "Wszystkie przypisane maszyny są już na mapie! Możesz je złapać i swobodnie przesuwać." 
                        : "Brak obiektów do przypięcia. Wszystkie znajdują się już na mapie (możesz je przesuwać)."}
                    </p>
                  )}
              </div>

              <div className="pt-2">
                <button type="submit" disabled={!editingId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-[10px] md:text-sm">
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
