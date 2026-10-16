import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';

export default function ImageLightboxModal({
  images = [],
  initialIndex = 0,
  onClose,
  title = '',
  subtitle = '',
  fallbackLogo = null
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageError, setImageError] = useState({});

  // Touch and mouse swipe tracking
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);

  const total = images.length;
  const currentImg = images[currentIndex];
  const hasMultiple = total > 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while lightbox is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [currentIndex, total]);

  // Reset zoom on slide change
  useEffect(() => {
    setIsZoomed(false);
    setZoomLevel(1);
  }, [currentIndex]);

  const goToPrev = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const goToNext = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    if (isZoomed) return; // Don't swipe if user is zoomed in
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || isZoomed) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Only track if horizontal swipe dominates
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaX.current = deltaX;
      // Prevent screen scroll during horizontal swipe
      if (e.cancelable && Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || isZoomed) return;
    const swipeThreshold = 40; // minimum pixels for a swipe
    if (touchDeltaX.current > swipeThreshold) {
      goToPrev();
    } else if (touchDeltaX.current < -swipeThreshold) {
      goToNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
  };

  // Mouse drag handlers (for desktop testing / trackpad swipe)
  const handleMouseDown = (e) => {
    if (isZoomed || e.button !== 0) return;
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    touchDeltaX.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || touchStartX.current === null || isZoomed) return;
    const deltaX = e.clientX - touchStartX.current;
    touchDeltaX.current = deltaX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const swipeThreshold = 50;
    if (touchDeltaX.current > swipeThreshold) {
      goToPrev();
    } else if (touchDeltaX.current < -swipeThreshold) {
      goToNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
  };

  const toggleZoom = (e) => {
    e?.stopPropagation();
    if (isZoomed) {
      setIsZoomed(false);
      setZoomLevel(1);
    } else {
      setIsZoomed(true);
      setZoomLevel(2);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-2xl text-white select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          {title && (
            <h3 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-md">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Photo Counter */}
          {hasMultiple && (
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-md">
              {currentIndex + 1} / {total}
            </div>
          )}

          {/* Zoom Toggle */}
          <button
            onClick={toggleZoom}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 transition-all text-white"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" /> : <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Close Lightbox */}
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 transition-all text-white"
            title="Close Fullscreen (Esc)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Full-Size Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Previous Button (Left Arrow) */}
        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/50 hover:bg-white/20 active:scale-95 text-white border border-white/15 backdrop-blur-md transition-all shadow-xl"
            title="Previous Image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* The Full Image */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ease-out ${
            isZoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'
          }`}
          onClick={toggleZoom}
        >
          {currentImg && !imageError[currentIndex] ? (
            <img
              src={currentImg}
              alt={title || 'Product Full Image'}
              className={`max-w-[94vw] max-h-[78vh] sm:max-h-[82vh] object-contain rounded-xl sm:rounded-2xl transition-transform duration-300 drop-shadow-2xl pointer-events-auto ${
                isZoomed ? 'scale-150 sm:scale-175' : 'scale-100'
              }`}
              draggable={false}
              onError={() => setImageError((prev) => ({ ...prev, [currentIndex]: true }))}
            />
          ) : fallbackLogo ? (
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center max-w-sm">
              <img
                src={fallbackLogo}
                alt="Store Logo"
                className="max-h-40 max-w-full object-contain"
              />
              <span className="text-xs text-zinc-400 mt-4 font-semibold uppercase tracking-wider">
                Store Image
              </span>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center">
              <ImageIcon className="w-16 h-16 text-zinc-600 mb-3" />
              <span className="text-xs text-zinc-400 font-semibold">Image unavailable</span>
            </div>
          )}
        </div>

        {/* Next Button (Right Arrow) */}
        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/50 hover:bg-white/20 active:scale-95 text-white border border-white/15 backdrop-blur-md transition-all shadow-xl"
            title="Next Image"
          >
            <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails & Swipe Hint */}
      <div
        className="w-full pb-4 pt-2 px-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe by finger guidance for mobile users */}
        {hasMultiple && (
          <p className="text-[11px] text-zinc-400 font-medium sm:hidden flex items-center gap-1.5">
            <span>👈 Swipe with finger to browse photos 👉</span>
          </p>
        )}

        {/* Thumbnail Strip */}
        {hasMultiple && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/40 ring-2 ring-blue-500/50'
                    : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
