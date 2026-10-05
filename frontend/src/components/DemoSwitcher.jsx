import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Smartphone, UserCheck, ShieldCheck, Compass, X,
  ChevronUp, ChevronDown, Store, Globe, GripVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DemoSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, quickLoginAs, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Position state (GPU-accelerated translate coordinates)
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const hasMovedRef = useRef(false);
  const buttonRef = useRef(null);
  const rafRef = useRef(null);

  // Compute safe initial position once mounted
  useEffect(() => {
    const updateInitialPosition = () => {
      const btnW = 180;
      const btnH = 48;
      const safeX = Math.max(12, window.innerWidth - btnW - 20);
      const safeY = Math.max(12, window.innerHeight - btnH - 24);
      setPos({ x: safeX, y: safeY });
    };

    updateInitialPosition();

    const handleWindowResize = () => {
      setPos((prev) => {
        if (prev.x === -1) return prev;
        const btnW = buttonRef.current?.offsetWidth || 180;
        const btnH = buttonRef.current?.offsetHeight || 48;
        return {
          x: Math.min(Math.max(12, prev.x), window.innerWidth - btnW - 12),
          y: Math.min(Math.max(12, prev.y), window.innerHeight - btnH - 12),
        };
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Smooth pointer drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX, clientY) => {
      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const btnW = buttonRef.current?.offsetWidth || 180;
        const btnH = buttonRef.current?.offsetHeight || 48;
        const maxX = window.innerWidth - btnW - 10;
        const maxY = window.innerHeight - btnH - 10;

        const nextX = Math.min(Math.max(10, dragStartRef.current.startX + deltaX), maxX);
        const nextY = Math.min(Math.max(10, dragStartRef.current.startY + deltaY), maxY);

        setPos({ x: nextX, y: nextY });
      });
    };

    const onMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging]);

  const handlePointerDown = (e) => {
    // Only drag from primary click or single touch
    if (e.button && e.button !== 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: pos.x,
      startY: pos.y,
    };
    setIsDragging(true);
  };

  const handleButtonClick = (e) => {
    // If dragged, do not toggle modal
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleRoleSelect = async (role, path) => {
    setIsOpen(false);
    if (role === 'customer') {
      navigate('/shop/abc-electronics');
      return;
    }
    if (role === 'public') {
      navigate('/');
      return;
    }
    await quickLoginAs(role);
    navigate(path);
  };

  // Do not show floating button on the public marketing landing page
  if (location.pathname === '/') {
    return null;
  }

  // Calculate smart menu placement relative to the stable button position
  const isLowerHalf = typeof window !== 'undefined' ? pos.y > window.innerHeight / 2 : true;
  const isRightHalf = typeof window !== 'undefined' ? pos.x > window.innerWidth / 2 : true;

  return (
    <>
      {/* Semi-transparent backdrop when menu is open for stable dismiss */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Draggable Root Container */}
      <div
        ref={buttonRef}
        style={{
          transform: pos.x >= 0 ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : undefined,
          top: 0,
          left: 0,
          bottom: pos.x < 0 ? '24px' : undefined,
          right: pos.x < 0 ? '24px' : undefined,
          touchAction: 'none',
          willChange: isDragging ? 'transform' : 'auto',
        }}
        className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* The Trigger Button - Always STABLE in its position */}
        <button
          type="button"
          onClick={handleButtonClick}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className={`p-2 sm:px-3.5 sm:py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl transition-colors border select-none ${
            isOpen
              ? 'bg-blue-700 text-white border-blue-400 shadow-blue-600/40 ring-2 ring-blue-400/30'
              : 'bg-blue-600 hover:bg-blue-500 active:scale-98 text-white border-blue-400/40 shadow-blue-500/40'
          }`}
          title="Drag anywhere to reposition • Tap to switch experience"
        >
          <GripVertical className="w-3.5 h-3.5 text-blue-200 opacity-90 cursor-grab shrink-0" />
          <Compass className={`w-4 h-4 shrink-0 ${isOpen ? '' : 'animate-spin-slow'}`} />
          <span className="hidden sm:inline whitespace-nowrap">Switch Experience</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
        </button>

        {/* Stable Interactive Demo Menu anchored neatly to the button */}
        {isOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-[#18181B] border border-slate-200 dark:border-blue-500/40 rounded-3xl p-4 shadow-2xl w-80 max-w-[calc(100vw-24px)] space-y-3 animate-fade-in backdrop-blur-xl absolute z-50 ${
              isLowerHalf ? 'bottom-full mb-3' : 'top-full mt-3'
            } ${isRightHalf ? 'right-0' : 'left-0'}`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>ShopFlow Interactive Demo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Instant 1-click switch between all platform experiences:
            </p>

            <div className="space-y-1.5">
              {/* Customer */}
              <button
                type="button"
                onClick={() => handleRoleSelect('customer', '/shop/abc-electronics')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  location.pathname.startsWith('/shop')
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white">1. Customer Mobile View</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Scan QR & request item</div>
                </div>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleRoleSelect('staff', '/staff')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  location.pathname.startsWith('/staff')
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white">2. Staff Queue (Rahul)</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Micro-location & Mark Found</div>
                </div>
              </button>

              {/* Shop Owner */}
              <button
                type="button"
                onClick={() => handleRoleSelect('owner', '/admin')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white">3. Shop Owner Admin</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Inventory, layouts, analytics</div>
                </div>
              </button>

              {/* Super Admin */}
              <button
                type="button"
                onClick={() => handleRoleSelect('super_admin', '/super-admin')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  location.pathname.startsWith('/super-admin')
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white">4. Super Admin (Multi-tenant)</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Global SaaS management</div>
                </div>
              </button>

              {/* Public Landing */}
              <button
                type="button"
                onClick={() => handleRoleSelect('public', '/')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  location.pathname === '/'
                    ? 'border-blue-500 bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white">Public Marketing Site</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Landing & overview</div>
                </div>
              </button>
            </div>

            {user && (
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                <span className="truncate max-w-[140px]">User: {user.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 font-semibold"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
