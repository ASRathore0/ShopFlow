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

  // Position state (coordinates relative to top-left)
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);
  const containerRef = useRef(null);

  // Initialize position on client-side once mounted
  useEffect(() => {
    const initX = Math.max(16, window.innerWidth - 180);
    const initY = Math.max(16, window.innerHeight - 70);
    setPosition({ x: initX, y: initY });

    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(12, prev.x), window.innerWidth - 160),
        y: Math.min(Math.max(12, prev.y), window.innerHeight - 60),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global mouse & touch listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX, clientY) => {
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      const btnWidth = containerRef.current?.offsetWidth || 160;
      const btnHeight = containerRef.current?.offsetHeight || 50;

      const newX = Math.min(Math.max(8, dragStartRef.current.posX + deltaX), window.innerWidth - btnWidth - 8);
      const newY = Math.min(Math.max(8, dragStartRef.current.posY + deltaY), window.innerHeight - btnHeight - 8);

      setPosition({ x: newX, y: newY });
    };

    const onMouseMove = (e) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
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
    };
  }, [isDragging]);

  const handlePointerDown = (e) => {
    // If clicking close button or inner interactive element, don't start drag
    if (e.target.closest('button.close-btn') || e.target.closest('.dropdown-content')) {
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleButtonClick = (e) => {
    // If the user was dragging, don't toggle open/closed
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(!isOpen);
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

  // Determine smart popup placement based on viewport quadrant
  const isLowerHalf = typeof window !== 'undefined' ? position.y > window.innerHeight / 2 : true;
  const isRightHalf = typeof window !== 'undefined' ? position.x > window.innerWidth / 2 : true;

  return (
    <div
      ref={containerRef}
      style={{
        left: position.x >= 0 ? `${position.x}px` : undefined,
        top: position.y >= 0 ? `${position.y}px` : undefined,
        bottom: position.x < 0 ? '24px' : undefined,
        right: position.x < 0 ? '24px' : undefined,
      }}
      className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'}`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {isOpen ? (
        <div
          className={`dropdown-content bg-white/95 dark:bg-[#18181B]/95 border border-slate-200 dark:border-blue-500/40 rounded-2xl p-4 shadow-2xl w-72 max-w-[calc(100vw-2rem)] space-y-3 animate-fade-in backdrop-blur-xl absolute ${
            isLowerHalf ? 'bottom-0' : 'top-0'
          } ${isRightHalf ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ShopFlow Interactive Demo</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="close-btn p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
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
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/shop')
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-white font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium truncate">1. Customer Mobile View</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Scan QR & request item</div>
              </div>
            </button>

            {/* Staff */}
            <button
              type="button"
              onClick={() => handleRoleSelect('staff', '/staff')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/staff')
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-white font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium truncate">2. Staff Queue (Rahul)</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Micro-location & Mark Found</div>
              </div>
            </button>

            {/* Shop Owner */}
            <button
              type="button"
              onClick={() => handleRoleSelect('owner', '/admin')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/admin')
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-900 dark:text-white font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium truncate">3. Shop Owner Admin</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Inventory, layouts, analytics</div>
              </div>
            </button>

            {/* Super Admin */}
            <button
              type="button"
              onClick={() => handleRoleSelect('super_admin', '/super-admin')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/super-admin')
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-white font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium truncate">4. Super Admin (Multi-tenant)</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Global SaaS management</div>
              </div>
            </button>

            {/* Public Landing */}
            <button
              type="button"
              onClick={() => handleRoleSelect('public', '/')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname === '/'
                  ? 'border-blue-500 bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-white font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium truncate">Public Marketing Site</div>
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
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          className="p-2 sm:px-3 sm:py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full text-xs font-bold shadow-2xl shadow-blue-500/40 flex items-center gap-1.5 border border-blue-400/40 transition-transform touch-none"
          title="Drag to reposition • Click to switch role"
        >
          <GripVertical className="w-3.5 h-3.5 text-blue-200 opacity-80 cursor-grab shrink-0" />
          <Compass className="w-4 h-4 animate-spin-slow shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Switch Experience</span>
          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
        </button>
      )}
    </div>
  );
}
