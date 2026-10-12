import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop, ZoomIn, ZoomOut, Check, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';

/**
 * Resolves an image URL into a CORS-safe local Blob URL.
 * Bypasses cross-origin canvas tainting by loading through Laravel /api/media-proxy.
 */
async function resolveCorsSafeImage(rawUrl) {
  if (!rawUrl) return null;

  // Fresh uploads / existing blobs / data URIs are already CORS-safe
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return { url: rawUrl, isBlob: false };
  }

  let targetUrl = rawUrl;

  // If localhost/127.0.0.1 is in the URL but the frontend is being viewed on a LAN IP, normalize hostname
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const curHost = window.location.hostname;
    if (curHost !== 'localhost' && curHost !== '127.0.0.1') {
      targetUrl = targetUrl
        .replace(/http:\/\/localhost:8000/g, `http://${curHost}:8000`)
        .replace(/http:\/\/127\.0\.0\.1:8000/g, `http://${curHost}:8000`);
    }
  }

  // Method 1: Fetch via Laravel /api/media-proxy with full CORS headers
  try {
    const apiHost = (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : 'http://localhost:8000';

    const proxyUrl = `${apiHost}/api/media-proxy?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      return { url: URL.createObjectURL(blob), isBlob: true };
    }
  } catch (err) {
    console.warn('Proxy media fetch failed, attempting direct fetch:', err);
  }

  // Method 2: Direct fetch fallback (for same-origin or CORS permissive URLs)
  try {
    const response = await fetch(targetUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      return { url: URL.createObjectURL(blob), isBlob: true };
    }
  } catch (err) {
    console.warn('Direct image fetch failed:', err);
  }

  // Fallback: return normalized URL directly
  return { url: targetUrl, isBlob: false };
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onSkip,
  title = 'Crop & Rotate Product Image'
}) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1', '4:3', '16:9', 'free'
  const [isProcessing, setIsProcessing] = useState(false);

  // Safe Image Source state (Blob URL converted to prevent CORS Canvas errors)
  const [activeImageSrc, setActiveImageSrc] = useState('');
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const activeBlobUrlRef = useRef(null);

  // Normalized crop rectangle: { x: 0..100, y: 0..100, width: 0..100, height: 0..100 }
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragActionRef = useRef(null); // { type: 'move'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w', startX, startY, startCrop }

  // Load safe CORS blob URL whenever modal opens or imageSrc changes
  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || !imageSrc) {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      setActiveImageSrc('');
      setIsLoadingSource(false);
      setLoadError(null);
      return;
    }

    // Reset controls
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setAspectRatio('1:1');
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
    setIsProcessing(false);
    setLoadError(null);

    // Fast path: Data URL or existing Blob URL
    if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
      setActiveImageSrc(imageSrc);
      setIsLoadingSource(false);
      return;
    }

    setIsLoadingSource(true);

    resolveCorsSafeImage(imageSrc)
      .then((res) => {
        if (isCancelled) return;
        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current);
          activeBlobUrlRef.current = null;
        }

        if (res?.isBlob) {
          activeBlobUrlRef.current = res.url;
          setActiveImageSrc(res.url);
        } else if (res?.url) {
          setActiveImageSrc(res.url);
        } else {
          setActiveImageSrc(imageSrc);
        }
        setIsLoadingSource(false);
      })
      .catch((err) => {
        console.error('Failed to resolve CORS safe image:', err);
        if (isCancelled) return;
        setActiveImageSrc(imageSrc);
        setLoadError('Image could not be optimized for canvas. Attempting direct load.');
        setIsLoadingSource(false);
      });

    return () => {
      isCancelled = true;
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, [isOpen, imageSrc]);

  // Adjust crop dimensions when aspect ratio preset changes
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

  // Pointer & Touch handlers for moving/resizing the crop box
  const handlePointerDown = (e, type) => {
    // Avoid calling preventDefault on touchstart to prevent passive event listener warning
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

      // Resizing logic
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

      // Enforce aspect ratio constraint if fixed
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

  // Rotate handlers
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setAspectRatio('1:1');
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
  };

  // Perform canvas crop, rotation, flip, and export
  const handleApplyAndSave = async () => {
    if (!imageRef.current || !containerRef.current || !activeImageSrc) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      // Only set crossOrigin if not a local blob/data URL
      if (!activeImageSrc.startsWith('blob:') && !activeImageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          // If anonymous failed on direct URL, try without crossOrigin as last resort
          if (img.crossOrigin) {
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              img.width = fallbackImg.width;
              img.height = fallbackImg.height;
              resolve();
            };
            fallbackImg.onerror = reject;
            fallbackImg.src = activeImageSrc;
          } else {
            reject(e);
          }
        };
        img.src = activeImageSrc;
      });

      // Canvas 1: Rotate & Flip transformed full image
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

      // Desired export dimensions (max 1600px for high clarity and fast load)
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

      // Export as Blob & Data URL
      cropCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const fileName = `product-crop-${Date.now()}.jpg`;
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-[#151518] border border-slate-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Rotate, flip, zoom, and crop to showroom standard
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

        {/* Workspace: Image Preview & Crop Canvas */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
          <div
            ref={containerRef}
            className="relative w-full h-64 sm:h-84 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center select-none shadow-inner touch-none"
            style={{ touchAction: 'none' }}
          >
            {/* Loading state indicator */}
            {isLoadingSource && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-xs font-semibold text-slate-200">Preparing image for edit...</span>
              </div>
            )}

            {/* Error indicator banner if any */}
            {loadError && !isLoadingSource && (
              <div className="absolute top-2 left-2 right-2 z-20 px-3 py-1.5 rounded-xl bg-amber-500/90 text-white text-[11px] flex items-center gap-1.5 shadow-md">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{loadError}</span>
              </div>
            )}

            {/* Visual background image with current rotation & flip transforms */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
              }}
            >
              {activeImageSrc && (
                <img
                  ref={imageRef}
                  src={activeImageSrc}
                  alt="Product Crop Target"
                  className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                />
              )}
            </div>

            {/* Dark overlay backdrop around the crop area */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at ${crop.x + crop.width / 2}% ${crop.y + crop.height / 2}%, transparent 0%, rgba(0,0,0,0.65) 100%)`,
              }}
            />

            {/* Interactive Crop Boundary Box */}
            <div
              className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move touch-none select-none"
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
              {/* Rule-of-Thirds Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-white/60"></div>
                <div className="border-r border-white/60"></div>
                <div></div>
              </div>

              {/* Corner Handles for Resizing (with touchAction: none and mobile touch size) */}
              <div
                onMouseDown={(e) => handlePointerDown(e, 'nw')}
                onTouchStart={(e) => handlePointerDown(e, 'nw')}
                style={{ touchAction: 'none' }}
                className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md touch-none"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'ne')}
                onTouchStart={(e) => handlePointerDown(e, 'ne')}
                style={{ touchAction: 'none' }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md touch-none"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'sw')}
                onTouchStart={(e) => handlePointerDown(e, 'sw')}
                style={{ touchAction: 'none' }}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md touch-none"
              />
              <div
                onMouseDown={(e) => handlePointerDown(e, 'se')}
                onTouchStart={(e) => handlePointerDown(e, 'se')}
                style={{ touchAction: 'none' }}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md touch-none"
              />
            </div>
          </div>

          {/* Controls: Rotate, Flip, Aspect Ratio, Zoom */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            {/* Row 1: Rotation & Flip buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRotateCCW}
                  className="p-2 rounded-xl text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rotate -90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateCW}
                  className="p-2 rounded-xl text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rotate +90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                  }`}
                  title="Flip Horizontally"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    flipV
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                  }`}
                  title="Flip Vertically"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip V</span>
                </button>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all crop and orientation edits"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Row 2: Aspect Ratios & Zoom Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
              {/* Aspect Ratio Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mr-0.5">Ratio:</span>
                {[
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3 Standard' },
                  { id: '16:9', label: '16:9 Wide' },
                  { id: 'free', label: 'Free' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAspectRatio(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aspectRatio === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 sm:w-28 accent-blue-600 cursor-pointer"
                  title="Zoom Image"
                />
                <ZoomIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-500 w-8">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
            Drag frame corners to frame your product cleanly
          </span>
          <div className="flex items-center gap-2 ml-auto">
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
                title="Upload original image without cropping"
              >
                Skip Crop
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyAndSave}
              disabled={isProcessing || isLoadingSource}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isLoadingSource ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading...</span>
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
