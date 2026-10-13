import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop, ZoomIn, ZoomOut, Check, Loader2, RefreshCw, Maximize2, Move
} from 'lucide-react';
import api from '../services/api';

/**
 * Resolves an image URL into a CORS-safe local Blob URL for canvas export.
 * Uses the app's configured Axios instance to reach /api/media-proxy.
 */
async function getCanvasSafeUrl(rawUrl) {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return { url: rawUrl, isCreatedBlob: false };
  }

  // 1. Fetch via our backend media proxy
  try {
    const res = await api.get('/media-proxy', {
      params: { url: rawUrl },
      responseType: 'blob',
      timeout: 6000,
    });
    if (res.data) {
      return { url: URL.createObjectURL(res.data), isCreatedBlob: true };
    }
  } catch (err) {
    console.warn('Backend proxy fetch failed, trying direct fetch:', err);
  }

  // 2. Direct fetch fallback
  try {
    const res = await fetch(rawUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return { url: URL.createObjectURL(blob), isCreatedBlob: true };
    }
  } catch (err) {
    console.warn('Direct image fetch failed:', err);
  }

  return { url: rawUrl, isCreatedBlob: false };
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onSkip,
  title = 'Crop & Rotate Image',
  initialAspectRatio = '1:1',
  circularCrop = false,
}) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalized crop rectangle: { x: 0..100, y: 0..100, width: 0..100, height: 0..100 }
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragActionRef = useRef(null);

  // Cached safe blob prepared silently in background
  const cachedBlobRef = useRef(null);

  // Reset controls and immediately show image on modal open (0ms wait)
  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setAspectRatio(initialAspectRatio);
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
      setIsProcessing(false);

      // Silently pre-fetch canvas-safe blob in background for fast instant save
      if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
        getCanvasSafeUrl(imageSrc).then((res) => {
          if (res?.isCreatedBlob) {
            if (cachedBlobRef.current) URL.revokeObjectURL(cachedBlobRef.current);
            cachedBlobRef.current = res.url;
          }
        }).catch(() => {});
      }
    }

    return () => {
      if (cachedBlobRef.current) {
        URL.revokeObjectURL(cachedBlobRef.current);
        cachedBlobRef.current = null;
      }
    };
  }, [isOpen, imageSrc, initialAspectRatio]);

  // Adjust crop dimensions when aspect ratio changes
  useEffect(() => {
    if (!containerRef.current || aspectRatio === 'free') return;

    const ratioMap = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
    };
    const targetRatio = ratioMap[aspectRatio] || 1;

    setCrop((prev) => {
      let newW = prev.width;
      let newH = newW / targetRatio;
      if (newH > 90) {
        newH = 80;
        newW = newH * targetRatio;
      }
      if (newW > 90) {
        newW = 80;
        newH = newW / targetRatio;
      }
      const newX = Math.max(0, Math.min(100 - newW, prev.x));
      const newY = Math.max(0, Math.min(100 - newH, prev.y));
      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [aspectRatio]);

  // Quick Action: Fit to full 100% frame
  const handleFitFull = () => {
    setAspectRatio('free');
    setCrop({ x: 2, y: 2, width: 96, height: 96 });
  };

  // Quick Action: Center crop
  const handleCenterCrop = () => {
    setCrop((prev) => {
      const newX = (100 - prev.width) / 2;
      const newY = (100 - prev.height) / 2;
      return { ...prev, x: newX, y: newY };
    });
  };

  // Pointer & Touch handlers for moving/resizing the crop box
  const handlePointerDown = (e, type) => {
    if (e.cancelable && e.type !== 'touchstart') {
      e.preventDefault();
    }
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragActionRef.current = {
      type,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragActionRef.current || !containerRef.current) return;
    if (e.cancelable) {
      e.preventDefault();
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((clientX - dragActionRef.current.startX) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragActionRef.current.startY) / rect.height) * 100;

    const { type, startCrop } = dragActionRef.current;

    setCrop(() => {
      let { x, y, width, height } = startCrop;

      if (type === 'move') {
        x = Math.max(0, Math.min(100 - width, x + deltaXPercent));
        y = Math.max(0, Math.min(100 - height, y + deltaYPercent));
        return { x, y, width, height };
      }

      // Corner & Edge resizing
      if (type.includes('e')) {
        width = Math.max(15, Math.min(100 - x, startCrop.width + deltaXPercent));
      }
      if (type.includes('s')) {
        height = Math.max(15, Math.min(100 - y, startCrop.height + deltaYPercent));
      }
      if (type.includes('w')) {
        const potentialWidth = startCrop.width - deltaXPercent;
        if (potentialWidth >= 15 && startCrop.x + deltaXPercent >= 0) {
          x = startCrop.x + deltaXPercent;
          width = potentialWidth;
        }
      }
      if (type.includes('n')) {
        const potentialHeight = startCrop.height - deltaYPercent;
        if (potentialHeight >= 15 && startCrop.y + deltaYPercent >= 0) {
          y = startCrop.y + deltaYPercent;
          height = potentialHeight;
        }
      }

      // Constrain aspect ratio if active
      if (aspectRatio !== 'free') {
        const targetRatio = aspectRatio === '1:1' ? 1 : aspectRatio === '4:3' ? 4 / 3 : 16 / 9;
        height = width / targetRatio;
        if (y + height > 100) {
          height = 100 - y;
          width = height * targetRatio;
        }
      }

      return {
        x: Math.max(0, Math.min(100 - width, x)),
        y: Math.max(0, Math.min(100 - height, y)),
        width: Math.max(15, Math.min(100, width)),
        height: Math.max(15, Math.min(100, height)),
      };
    });
  }, [aspectRatio]);

  const handlePointerUp = useCallback(() => {
    dragActionRef.current = null;
  }, []);

  // Desktop Mouse Wheel Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3, Math.max(0.6, parseFloat((prev + delta).toFixed(2)))));
  };

  useEffect(() => {
    if (!isOpen) return;
    const moveListener = (e) => handlePointerMove(e);
    const upListener = () => handlePointerUp();

    window.addEventListener('mousemove', moveListener);
    window.addEventListener('mouseup', upListener);
    window.addEventListener('touchmove', moveListener, { passive: false });
    window.addEventListener('touchend', upListener);

    return () => {
      window.removeEventListener('mousemove', moveListener);
      window.removeEventListener('mouseup', upListener);
      window.removeEventListener('touchmove', moveListener);
      window.removeEventListener('touchend', upListener);
    };
  }, [isOpen, handlePointerMove, handlePointerUp]);

  // Orientation handlers
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setAspectRatio(initialAspectRatio);
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
  };

  // Perform canvas crop, rotation, flip, and export
  const handleApplyAndSave = async () => {
    if (!imageRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      // Determine image source for canvas (prioritize cached blob, then fetch safe url)
      let exportSource = cachedBlobRef.current || imageSrc;
      if (!exportSource.startsWith('data:') && !exportSource.startsWith('blob:')) {
        const safeRes = await getCanvasSafeUrl(imageSrc);
        if (safeRes?.url) exportSource = safeRes.url;
      }

      const img = new Image();
      if (!exportSource.startsWith('blob:') && !exportSource.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // If anonymous failed, try direct load
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            img.width = fallbackImg.width;
            img.height = fallbackImg.height;
            resolve();
          };
          fallbackImg.onerror = reject;
          fallbackImg.src = exportSource;
        };
        img.src = exportSource;
      });

      // Canvas 1: Rotate & Flip
      const transformCanvas = document.createElement('canvas');
      const is90or270 = rotation === 90 || rotation === 270;
      transformCanvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
      transformCanvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

      const tCtx = transformCanvas.getContext('2d');
      tCtx.translate(transformCanvas.width / 2, transformCanvas.height / 2);
      tCtx.rotate((rotation * Math.PI) / 180);
      tCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      tCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // Canvas 2: Crop from transformed canvas
      const cropCanvas = document.createElement('canvas');
      const cropX = (crop.x / 100) * transformCanvas.width;
      const cropY = (crop.y / 100) * transformCanvas.height;
      const cropW = (crop.width / 100) * transformCanvas.width;
      const cropH = (crop.height / 100) * transformCanvas.height;

      // Cap at 1600px for optimal speed and high crispness
      const maxDim = 1600;
      let targetW = cropW;
      let targetH = cropH;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = (maxDim / targetW) * targetH;
          targetW = maxDim;
        } else {
          targetW = (maxDim / targetH) * targetW;
          targetH = maxDim;
        }
      }

      cropCanvas.width = Math.round(targetW);
      cropCanvas.height = Math.round(targetH);

      const cCtx = cropCanvas.getContext('2d');
      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = 'high';
      cCtx.drawImage(
        transformCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, cropCanvas.width, cropCanvas.height
      );

      // Export as Blob & File
      cropCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const fileName = `crop-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const previewUrl = cropCanvas.toDataURL('image/jpeg', 0.92);

          if (onSave) {
            onSave({ blob, file, previewUrl });
          }
          setIsProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to crop and rotate image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Pinch, drag, rotate, and zoom for the cleanest frame
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace: Image Preview & Interactive Crop Box */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative w-full h-64 sm:h-88 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center select-none shadow-inner touch-none cursor-crosshair"
            style={{ touchAction: 'none' }}
          >
            {/* Visual background image with current rotation & flip transforms */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
              style={{
                transform: `scale(${zoom})`,
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop Target"
                className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-150"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              />
            </div>

            {/* Dark overlay backdrop around the crop area */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at ${crop.x + crop.width / 2}% ${crop.y + crop.height / 2}%, transparent 0%, rgba(0,0,0,0.68) 100%)`,
              }}
            />

            {/* Interactive Crop Boundary Box */}
            <div
              className={`absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.60)] cursor-move touch-none select-none ${
                circularCrop ? 'rounded-full' : 'rounded-xs'
              }`}
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                touchAction: 'none',
              }}
              onMouseDown={(e) => handlePointerDown(e, 'move')}
              onTouchStart={(e) => handlePointerDown(e, 'move')}
            >
              {/* Circular Avatar Guide Line */}
              {circularCrop ? (
                <div className="absolute inset-0 rounded-full border border-dashed border-blue-400 pointer-events-none" />
              ) : (
                /* Rule-of-Thirds Grid Lines */
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div></div>
                </div>
              )}

              {/* Corner Handles (Large 24px Touch Zones with Blue Core) */}
              <div
                onMouseDown={(e) => handlePointerDown(e, 'nw')}
                onTouchStart={(e) => handlePointerDown(e, 'nw')}
                style={{ touchAction: 'none' }}
                className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize touch-none"
              >
                <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
              </div>

              <div
                onMouseDown={(e) => handlePointerDown(e, 'ne')}
                onTouchStart={(e) => handlePointerDown(e, 'ne')}
                style={{ touchAction: 'none' }}
                className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize touch-none"
              >
                <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
              </div>

              <div
                onMouseDown={(e) => handlePointerDown(e, 'sw')}
                onTouchStart={(e) => handlePointerDown(e, 'sw')}
                style={{ touchAction: 'none' }}
                className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize touch-none"
              >
                <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
              </div>

              <div
                onMouseDown={(e) => handlePointerDown(e, 'se')}
                onTouchStart={(e) => handlePointerDown(e, 'se')}
                style={{ touchAction: 'none' }}
                className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize touch-none"
              >
                <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
              </div>

              {/* Center Grab Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Move className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Controls Toolbar */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-zinc-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            {/* Row 1: Rotation, Flip, Fit & Center buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleRotateCCW}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rotate -90°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">-90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotateCW}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                  }`}
                  title="Flip Horizontally"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Flip H</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    flipV
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                  }`}
                  title="Flip Vertically"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Flip V</span>
                </button>
              </div>

              {/* Fit & Reset */}
              <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={handleFitFull}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Fit whole image"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full</span>
                </button>

                <button
                  type="button"
                  onClick={handleCenterCrop}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Center crop box"
                >
                  <span>Center</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset edits"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Row 2: Aspect Ratios & Zoom Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
              {/* Aspect Ratio Pills */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mr-0.5 shrink-0">Ratio:</span>
                {[
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3' },
                  { id: '16:9', label: '16:9' },
                  { id: 'free', label: 'Free' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAspectRatio(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      aspectRatio === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Zoom Slider + Quick Buttons */}
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.6, parseFloat((prev - 0.1).toFixed(1))))}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.6"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 sm:w-28 accent-blue-600 cursor-pointer"
                  title="Zoom (or use mouse scroll wheel)"
                />
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3.0, parseFloat((prev + 0.1).toFixed(1))))}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 w-9 text-right">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
            Drag frame corners or edges to frame neatly
          </span>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isProcessing}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Use original image without cropping"
              >
                Skip Crop
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyAndSave}
              disabled={isProcessing}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
