import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Check, Loader2, RefreshCw, Maximize2, Move, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { removeImageBackground } from '../services/bgRemovalService';

/**
 * Resolves an image URL into a CORS-safe local Blob URL for canvas export.
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Exact crop rectangle on screen (in container pixels): { x, y, width, height }
  const [cropBox, setCropBox] = useState({ x: 30, y: 30, width: 240, height: 240 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageElementRef = useRef(null);
  const dragActionRef = useRef(null);
  const blobUrlToRevokeRef = useRef(null);

  // Container dimensions cache
  const [containerSize, setContainerSize] = useState({ width: 500, height: 350 });

  // Update container size on resize
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Load the image into an HTMLImageElement
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    let isMounted = true;
    setIsLoaded(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAspectRatio(initialAspectRatio);
    setIsProcessing(false);

    const loadImg = async () => {
      let resolvedSrc = imageSrc;
      if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
        const safe = await getCanvasSafeUrl(imageSrc);
        if (safe?.url) {
          resolvedSrc = safe.url;
          if (safe.isCreatedBlob) {
            blobUrlToRevokeRef.current = safe.url;
          }
        }
      }

      const img = new Image();
      if (!resolvedSrc.startsWith('blob:') && !resolvedSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        if (!isMounted) return;
        imageElementRef.current = img;
        setIsLoaded(true);
      };

      img.onerror = () => {
        if (!isMounted) return;
        console.error('Failed to load image for cropping:', resolvedSrc);
        // Fallback without crossOrigin
        const fallback = new Image();
        fallback.onload = () => {
          if (!isMounted) return;
          imageElementRef.current = fallback;
          setIsLoaded(true);
        };
        fallback.src = resolvedSrc;
      };

      img.src = resolvedSrc;
    };

    loadImg();

    return () => {
      isMounted = false;
      if (blobUrlToRevokeRef.current) {
        URL.revokeObjectURL(blobUrlToRevokeRef.current);
        blobUrlToRevokeRef.current = null;
      }
    };
  }, [isOpen, imageSrc, initialAspectRatio]);

  // Helper to compute layout geometry: transformed image size & screen position
  const getLayoutGeometry = useCallback(() => {
    const img = imageElementRef.current;
    if (!img) return null;

    const Wc = containerSize.width || 500;
    const Hc = containerSize.height || 350;

    const is90or270 = rotation === 90 || rotation === 270;
    const Wt = is90or270 ? img.naturalHeight : img.naturalWidth;
    const Ht = is90or270 ? img.naturalWidth : img.naturalHeight;

    // Base fit scale: fits the full rotated image inside the container with 24px padding
    const padding = 24;
    const scaleBase = Math.min((Wc - padding) / Wt, (Hc - padding) / Ht);
    const totalScale = scaleBase * zoom;

    const dispW = Wt * totalScale;
    const dispH = Ht * totalScale;

    // Centered position + user pan
    const imgX = (Wc - dispW) / 2 + pan.x;
    const imgY = (Hc - dispH) / 2 + pan.y;

    return {
      Wc, Hc, Wt, Ht,
      scaleBase, totalScale,
      dispW, dispH,
      imgX, imgY,
      origW: img.naturalWidth,
      origH: img.naturalHeight,
    };
  }, [containerSize, rotation, zoom, pan]);

  // Initialize or re-center cropBox when image loads or aspect ratio changes
  useEffect(() => {
    if (!isLoaded) return;
    const geo = getLayoutGeometry();
    if (!geo) return;

    const { Wc, Hc, dispW, dispH } = geo;

    const targetRatio =
      aspectRatio === '1:1' ? 1 :
      aspectRatio === '4:3' ? 4 / 3 :
      aspectRatio === '16:9' ? 16 / 9 : null;

    if (targetRatio) {
      // Find maximum box size that fits comfortably
      let boxW = Math.min(dispW, Wc - 40);
      let boxH = boxW / targetRatio;

      if (boxH > Math.min(dispH, Hc - 40)) {
        boxH = Math.min(dispH, Hc - 40);
        boxW = boxH * targetRatio;
      }

      // Minimum 80px
      boxW = Math.max(80, Math.round(boxW));
      boxH = Math.max(80, Math.round(boxH));

      const boxX = Math.round((Wc - boxW) / 2);
      const boxY = Math.round((Hc - boxH) / 2);

      setCropBox({ x: boxX, y: boxY, width: boxW, height: boxH });
    } else {
      // Free aspect ratio
      const boxW = Math.round(Math.min(dispW, Wc - 40));
      const boxH = Math.round(Math.min(dispH, Hc - 40));
      const boxX = Math.round((Wc - boxW) / 2);
      const boxY = Math.round((Hc - boxH) / 2);
      setCropBox({ x: boxX, y: boxY, width: boxW, height: boxH });
    }
  }, [isLoaded, aspectRatio, rotation, containerSize.width, containerSize.height]);

  // Render preview canvas whenever state changes
  useEffect(() => {
    if (!isOpen || !isLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const geo = getLayoutGeometry();
    if (!geo) return;

    const { Wc, Hc, totalScale, dispW, dispH, imgX, imgY, origW, origH } = geo;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(Wc * dpr);
    canvas.height = Math.round(Hc * dpr);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 1. Dark container background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, Wc, Hc);

    // 2. Draw Transformed Image
    ctx.save();
    ctx.translate(imgX + dispW / 2, imgY + dispH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const is90or270 = rotation === 90 || rotation === 270;
    const drawW = (is90or270 ? origH : origW) * totalScale;
    const drawH = (is90or270 ? origW : origH) * totalScale;

    // Draw image centered at origin
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      imageElementRef.current,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );
    ctx.restore();

    // 3. Darkened Scrim overlay outside the crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    if (circularCrop) {
      // Circular clip mask
      ctx.beginPath();
      ctx.rect(0, 0, Wc, Hc);
      const centerX = cropBox.x + cropBox.width / 2;
      const centerY = cropBox.y + cropBox.height / 2;
      const radius = Math.min(cropBox.width, cropBox.height) / 2;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.fill();
    } else {
      // Rectangular 4-quadrant mask
      // Top
      ctx.fillRect(0, 0, Wc, Math.max(0, cropBox.y));
      // Bottom
      ctx.fillRect(0, cropBox.y + cropBox.height, Wc, Math.max(0, Hc - (cropBox.y + cropBox.height)));
      // Left
      ctx.fillRect(0, cropBox.y, Math.max(0, cropBox.x), cropBox.height);
      // Right
      ctx.fillRect(
        cropBox.x + cropBox.width,
        cropBox.y,
        Math.max(0, Wc - (cropBox.x + cropBox.width)),
        cropBox.height
      );
    }
  }, [isOpen, isLoaded, rotation, flipH, flipV, zoom, pan, cropBox, circularCrop, containerSize, getLayoutGeometry]);

  // Pointer Down for Move, Corner Resize, or Pan
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
      startCropBox: { ...cropBox },
      startPan: { ...pan },
    };
  };

  // Pointer Move for interactive resizing & dragging
  const handlePointerMove = useCallback((e) => {
    if (!dragActionRef.current || !containerRef.current) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragActionRef.current.startX;
    const deltaY = clientY - dragActionRef.current.startY;

    const { type, startCropBox, startPan } = dragActionRef.current;
    const Wc = containerSize.width || 500;
    const Hc = containerSize.height || 350;

    // Pan image
    if (type === 'pan') {
      setPan({
        x: startPan.x + deltaX,
        y: startPan.y + deltaY,
      });
      return;
    }

    // Move entire crop box
    if (type === 'move') {
      const newX = Math.max(0, Math.min(Wc - startCropBox.width, startCropBox.x + deltaX));
      const newY = Math.max(0, Math.min(Hc - startCropBox.height, startCropBox.y + deltaY));
      setCropBox((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
      return;
    }

    // Corner Resizing
    const targetRatio =
      aspectRatio === '1:1' ? 1 :
      aspectRatio === '4:3' ? 4 / 3 :
      aspectRatio === '16:9' ? 16 / 9 : null;

    setCropBox(() => {
      let x = startCropBox.x;
      let y = startCropBox.y;
      let width = startCropBox.width;
      let height = startCropBox.height;

      if (type === 'se') {
        width = Math.max(60, Math.min(Wc - x, startCropBox.width + deltaX));
        height = targetRatio ? width / targetRatio : Math.max(60, Math.min(Hc - y, startCropBox.height + deltaY));
        if (targetRatio && y + height > Hc) {
          height = Hc - y;
          width = height * targetRatio;
        }
      } else if (type === 'sw') {
        const potentialWidth = Math.max(60, startCropBox.width - deltaX);
        const potentialX = startCropBox.x + (startCropBox.width - potentialWidth);
        if (potentialX >= 0) {
          x = potentialX;
          width = potentialWidth;
          height = targetRatio ? width / targetRatio : Math.max(60, Math.min(Hc - y, startCropBox.height + deltaY));
          if (targetRatio && y + height > Hc) {
            height = Hc - y;
            width = height * targetRatio;
            x = startCropBox.x + (startCropBox.width - width);
          }
        }
      } else if (type === 'ne') {
        width = Math.max(60, Math.min(Wc - x, startCropBox.width + deltaX));
        height = targetRatio ? width / targetRatio : Math.max(60, startCropBox.height - deltaY);
        const potentialY = startCropBox.y + (startCropBox.height - height);
        if (potentialY >= 0) {
          y = potentialY;
        } else if (targetRatio) {
          y = 0;
          height = startCropBox.y + startCropBox.height;
          width = height * targetRatio;
        }
      } else if (type === 'nw') {
        const potentialWidth = Math.max(60, startCropBox.width - deltaX);
        height = targetRatio ? potentialWidth / targetRatio : Math.max(60, startCropBox.height - deltaY);
        const potentialX = startCropBox.x + (startCropBox.width - potentialWidth);
        const potentialY = startCropBox.y + (startCropBox.height - height);
        if (potentialX >= 0 && potentialY >= 0) {
          x = potentialX;
          y = potentialY;
          width = potentialWidth;
        }
      }

      return {
        x: Math.round(Math.max(0, Math.min(Wc - width, x))),
        y: Math.round(Math.max(0, Math.min(Hc - height, y))),
        width: Math.round(Math.max(50, width)),
        height: Math.round(Math.max(50, height)),
      };
    });
  }, [containerSize, aspectRatio]);

  const handlePointerUp = useCallback(() => {
    dragActionRef.current = null;
  }, []);

  // Desktop Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3.0, Math.max(0.7, parseFloat((prev + delta).toFixed(2)))));
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

  // Actions
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAspectRatio(initialAspectRatio);
  };

  // 1-Click AI Background Removal within cropper
  const handleRemoveBg = async () => {
    if (!imageElementRef.current || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      const srcToProcess = imageElementRef.current.src || imageSrc;
      const res = await removeImageBackground(srcToProcess);
      if (res.success && res.url) {
        const newImg = new Image();
        newImg.onload = () => {
          imageElementRef.current = newImg;
          setIsRemovingBg(false);
        };
        newImg.src = res.url;
      } else {
        setIsRemovingBg(false);
      }
    } catch (err) {
      console.error('BG removal failed:', err);
      setIsRemovingBg(false);
    }
  };

  // Center crop and image
  const handleCenter = () => {
    setPan({ x: 0, y: 0 });
    const Wc = containerSize.width || 500;
    const Hc = containerSize.height || 350;
    setCropBox((prev) => ({
      ...prev,
      x: Math.round((Wc - prev.width) / 2),
      y: Math.round((Hc - prev.height) / 2),
    }));
  };

  // Fit image fully inside frame
  const handleFitFull = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const geo = getLayoutGeometry();
    if (!geo) return;
    const { Wc, Hc, dispW, dispH } = geo;
    setCropBox({
      x: Math.round((Wc - dispW) / 2),
      y: Math.round((Hc - dispH) / 2),
      width: Math.round(dispW),
      height: Math.round(dispH),
    });
  };

  // Perform Exact WYSIWYG Crop and Export
  const handleApplyAndSave = async () => {
    const img = imageElementRef.current;
    if (!img) return;

    setIsProcessing(true);

    try {
      const geo = getLayoutGeometry();
      if (!geo) throw new Error('Layout geometry not ready');

      const { Wt, Ht, origW, origH, totalScale, imgX, imgY } = geo;

      // 1. Create full-resolution Transformed Canvas (applies rotation & flip)
      const transformCanvas = document.createElement('canvas');
      transformCanvas.width = Wt;
      transformCanvas.height = Ht;

      const tCtx = transformCanvas.getContext('2d');
      tCtx.imageSmoothingEnabled = true;
      tCtx.imageSmoothingQuality = 'high';
      tCtx.translate(Wt / 2, Ht / 2);
      tCtx.rotate((rotation * Math.PI) / 180);
      tCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      tCtx.drawImage(img, -origW / 2, -origH / 2, origW, origH);

      // 2. Map screen CropBox coordinates into Transformed Canvas pixel coordinates
      const sourceX = (cropBox.x - imgX) / totalScale;
      const sourceY = (cropBox.y - imgY) / totalScale;
      const sourceW = cropBox.width / totalScale;
      const sourceH = cropBox.height / totalScale;

      // 3. Create high-resolution Output Canvas (capped at 1400px for super crisp quality)
      const maxDim = 1400;
      let targetW = Math.round(sourceW);
      let targetH = Math.round(sourceH);

      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((maxDim / targetW) * targetH);
          targetW = maxDim;
        } else {
          targetW = Math.round((maxDim / targetH) * targetW);
          targetH = maxDim;
        }
      }

      // Ensure clean minimum resolution
      targetW = Math.max(300, targetW);
      targetH = Math.max(300, targetH);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = targetW;
      cropCanvas.height = targetH;

      const cCtx = cropCanvas.getContext('2d');
      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = 'high';

      if (circularCrop) {
        // Transparent background for circle avatar
        cCtx.beginPath();
        cCtx.arc(targetW / 2, targetH / 2, Math.min(targetW, targetH) / 2, 0, Math.PI * 2);
        cCtx.clip();
      } else {
        // Clean white background for product cards
        cCtx.fillStyle = '#ffffff';
        cCtx.fillRect(0, 0, targetW, targetH);
      }

      // Draw exactly the cropped region
      cCtx.drawImage(
        transformCanvas,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, targetW, targetH
      );

      // 4. Export as Blob and File
      const exportType = circularCrop ? 'image/png' : 'image/jpeg';
      const exportExt = circularCrop ? 'png' : 'jpg';

      cropCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            console.error('Failed to create blob from crop canvas');
            return;
          }

          const file = new File([blob], `cropped_${Date.now()}.${exportExt}`, {
            type: exportType,
          });
          const previewUrl = URL.createObjectURL(blob);

          setIsProcessing(false);
          onSave({ blob, file, previewUrl });
        },
        exportType,
        0.92
      );
    } catch (err) {
      console.error('Failed to crop and export image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400">
              Adjust crop & rotation — what you frame here is exactly how it shows on product cards
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace: Interactive Preview Canvas & Overlay Frame */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handlePointerDown(e, 'pan')}
            onTouchStart={(e) => handlePointerDown(e, 'pan')}
            className="relative w-full h-64 sm:h-88 bg-[#09090b] rounded-2xl overflow-hidden select-none shadow-inner touch-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            {/* The HTML5 Preview Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-[#09090b]/80">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs font-semibold">Loading photo...</span>
              </div>
            )}

            {/* Interactive Crop Boundary Box Overlay */}
            {isLoaded && (
              <div
                className={`absolute border-2 border-white cursor-move touch-none select-none shadow-lg ${
                  circularCrop ? 'rounded-full' : 'rounded-xs'
                }`}
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
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

                {/* Corner Handles */}
                <div
                  onMouseDown={(e) => handlePointerDown(e, 'nw')}
                  onTouchStart={(e) => handlePointerDown(e, 'nw')}
                  style={{ touchAction: 'none' }}
                  className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none"
                  title="Drag to resize"
                >
                  <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
                </div>

                <div
                  onMouseDown={(e) => handlePointerDown(e, 'ne')}
                  onTouchStart={(e) => handlePointerDown(e, 'ne')}
                  style={{ touchAction: 'none' }}
                  className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none"
                  title="Drag to resize"
                >
                  <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
                </div>

                <div
                  onMouseDown={(e) => handlePointerDown(e, 'sw')}
                  onTouchStart={(e) => handlePointerDown(e, 'sw')}
                  style={{ touchAction: 'none' }}
                  className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none"
                  title="Drag to resize"
                >
                  <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
                </div>

                <div
                  onMouseDown={(e) => handlePointerDown(e, 'se')}
                  onTouchStart={(e) => handlePointerDown(e, 'se')}
                  style={{ touchAction: 'none' }}
                  className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none"
                  title="Drag to resize"
                >
                  <span className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
                </div>

                {/* Center Move Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                  <Move className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
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

              {/* Fit, Center, Remove BG & Reset */}
              <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleRemoveBg}
                  disabled={isRemovingBg || !isLoaded}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Auto remove background using AI"
                >
                  {isRemovingBg ? (
                    <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  )}
                  <span>{isRemovingBg ? 'Cutting out...' : 'Remove BG'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFitFull}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Fit whole image into crop frame"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fit Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCenter}
                  className="px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Center frame and image"
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
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mr-0.5 shrink-0">Frame:</span>
                {[
                  { id: '1:1', label: '1:1 Square (Product Cards)' },
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
                  onClick={() => setZoom((prev) => Math.max(0.7, parseFloat((prev - 0.1).toFixed(1))))}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.7"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 sm:w-28 accent-blue-600 cursor-pointer"
                  title="Zoom image (or scroll mouse wheel)"
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
            Drag frame corners to resize, drag inside frame to move, or drag background to pan photo
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
              disabled={isProcessing || !isLoaded}
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
