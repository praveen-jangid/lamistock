import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  FileSpreadsheet,
  Camera,
  Truck,
  BarChart3,
  Plus,
  Sparkles,
  Package
} from 'lucide-react';

export interface BottomNavProps {
  stockCount: number;
  challansCount: number;
  onOpenRapidMode?: () => void;
  onOpenAddPanel: () => void;
  onOpenMatcher: () => void;
  onOpenBulkMatcher: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  stockCount,
  challansCount,
  onOpenRapidMode,
  onOpenAddPanel,
  onOpenMatcher,
  onOpenBulkMatcher
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Backdrop overlay when action menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating Speed Dial Actions + Main FAB in bottom-right corner above navbar */}
      <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] z-50 md:hidden flex flex-col items-end gap-3.5">
        {/* Floating Speed Dial Items (no white background, labels on left, icons on right) */}
        {isMenuOpen && (
          <div className="flex flex-col items-end gap-3 animate-speed-dial">
            {/* Item 1: Rapid Daily Entry */}
            {onOpenRapidMode && (
              <button
                type="button"
                className="flex items-center justify-end gap-1 cursor-pointer group select-none active:scale-95 transition-transform"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenRapidMode();
                }}
              >
                <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs whitespace-nowrap">
                  Rapid Daily Entry
                </span>
                <div className="w-16 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <Camera size={20} />
                  </div>
                </div>
              </button>
            )}

            {/* Item 2: Add Single Panel */}
            <button
              type="button"
              className="flex items-center justify-end gap-1 cursor-pointer group select-none active:scale-95 transition-transform"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenAddPanel();
              }}
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs whitespace-nowrap">
                Add Single Panel
              </span>
              <div className="w-16 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Plus size={20} />
                </div>
              </div>
            </button>

            {/* Item 3: Single Piece Match */}
            <button
              type="button"
              className="flex items-center justify-end gap-1 cursor-pointer group select-none active:scale-95 transition-transform"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMatcher();
              }}
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs whitespace-nowrap">
                Single Piece Match
              </span>
              <div className="w-16 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center group-hover:bg-amber-400 transition-colors">
                  <Sparkles size={20} />
                </div>
              </div>
            </button>

            {/* Item 4: Bulk Order Matcher */}
            <button
              type="button"
              className="flex items-center justify-end gap-1 cursor-pointer group select-none active:scale-95 transition-transform"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenBulkMatcher();
              }}
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs whitespace-nowrap">
                Bulk Order Matcher
              </span>
              <div className="w-16 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 shadow-lg border border-slate-700/60 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                  <FileSpreadsheet size={20} />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Floating Action Button (FAB) '+' */}
        <button
          type="button"
          className={`w-16 h-16 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 active:scale-90 flex items-center justify-center cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none border-2 border-white/20 ${
            isMenuOpen ? 'rotate-[135deg]' : 'rotate-0'
          }`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title={isMenuOpen ? 'Close Menu' : 'Quick Actions'}
          aria-label={isMenuOpen ? 'Close Quick Actions' : 'Open Quick Actions'}
        >
          <Plus size={32} strokeWidth={2.75} />
        </button>
      </div>

      {/* Native Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-3 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]"
        aria-label="Mobile Navigation Bar"
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Tab 1: Stock Inventory */}
          <NavLink
            to="/stock"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[60px] rounded-xl transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center relative">
                <div className="relative">
                  <Layers size={21} strokeWidth={isActive ? 2.5 : 2} />
                  {stockCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-slate-900 text-white text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight shadow-xs">
                      {stockCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">Stock</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
                )}
              </div>
            )}
          </NavLink>

          {/* Tab 2: All Products */}
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[60px] rounded-xl transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center">
                <Package size={21} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1 tracking-tight">Products</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
                )}
              </div>
            )}
          </NavLink>

          {/* Tab 3: Production Orders */}
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[60px] rounded-xl transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center">
                <FileSpreadsheet size={21} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1 tracking-tight">Orders</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
                )}
              </div>
            )}
          </NavLink>

          {/* Tab 4: Outward Challans */}
          <NavLink
            to="/challans"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[60px] rounded-xl transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center relative">
                <div className="relative">
                  <Truck size={21} strokeWidth={isActive ? 2.5 : 2} />
                  {challansCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-emerald-600 text-white text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight shadow-xs">
                      {challansCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">Challans</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
                )}
              </div>
            )}
          </NavLink>

          {/* Tab 5: Unit 1 Assembly Tracker */}
          <NavLink
            to="/tracker"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[60px] rounded-xl transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center">
                <BarChart3 size={21} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] mt-1 tracking-tight">Tracker</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
                )}
              </div>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
