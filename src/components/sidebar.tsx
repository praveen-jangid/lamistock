import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Layers,
  FileSpreadsheet,
  Truck,
  BarChart3,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  Package
} from 'lucide-react';
import { isFirebaseReady } from '../services/firebase';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddPanel: () => void;
  onOpenRapidMode?: () => void;
  onOpenFirebaseSettings: () => void;
  stockCount: number;
  challansCount: number;
  productsCount?: number;
  onNavigateMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenAddPanel,
  onOpenRapidMode,
  onOpenFirebaseSettings,
  stockCount,
  challansCount,
  productsCount = 0,
  onNavigateMobile
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <aside
      className={`h-[calc(100vh-4rem)] sticky top-16 bg-black text-white flex flex-col border-r border-neutral-800 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Sidebar Header & Collapse Toggle */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } px-4 py-3 border-b border-neutral-800`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Factory Operations
            </span>
          </div>
        )}
        <button
          type="button"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links with React Router */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
            OPERATIONS
          </div>
        )}

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Lamination Panel Inventory (/stock)"
        >
          {({ isActive }) => (
            <>
              <div className="flex-shrink-0">
                <Layers size={19} />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Lamination Stock</span>
                  {stockCount > 0 && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/15 text-black font-bold'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      {stockCount}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="All Products Master Catalog (/products)"
        >
          {({ isActive }) => (
            <>
              <div className="flex-shrink-0">
                <Package size={19} />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">All Products</span>
                  {productsCount > 0 && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/15 text-black font-bold'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      {productsCount}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/wood-plans"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Wood Plans & Cutting Blueprints (/wood-plans)"
        >
          {() => (
            <>
              <div className="flex-shrink-0">
                <FileSpreadsheet size={19} className="text-emerald-400" />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Wood Plans</span>
                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded uppercase">
                    BOM
                  </span>
                </>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Production Orders & Excel BOM (/orders)"
        >
          {({ isActive }) => (
            <>
              <div className="flex-shrink-0">
                <FileSpreadsheet size={19} />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Production Orders</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-black/15 text-black font-bold'
                        : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    Orders
                  </span>
                </>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/challans"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Outward Delivery Challans (/challans)"
        >
          {({ isActive }) => (
            <>
              <div className="flex-shrink-0">
                <Truck size={19} />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Outward Challans</span>
                  {challansCount > 0 && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/15 text-black font-bold'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      {challansCount}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/tracker"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Unit 1 Dispatch Tracking & Pending Items (/tracker)"
        >
          {({ isActive }) => (
            <>
              <div className="flex-shrink-0">
                <BarChart3 size={19} />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Unit 1 Tracker</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-black' : 'bg-white animate-pulse'
                    }`}
                  />
                </>
              )}
            </>
          )}
        </NavLink>

        {!isCollapsed && (
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
            SYSTEM
          </div>
        )}

        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          onClick={() => {
            onOpenFirebaseSettings();
            if (onNavigateMobile) onNavigateMobile();
          }}
          title="Cloud Connection & Factory Settings"
        >
          <div className="flex-shrink-0">
            <Cloud size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Cloud Settings</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCloudConnected
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'border border-neutral-500 bg-transparent'
                }`}
              />
            </>
          )}
        </button>
      </nav>

      {/* Sidebar Quick Action Buttons */}
      {!isCollapsed && (
        <div className="p-3 border-t border-neutral-800 space-y-2">
          <Link
            to="/challans/new"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-bold transition shadow-sm"
            onClick={onNavigateMobile}
          >
            <Truck size={15} />
            <span>Create Outward Challan</span>
          </Link>

          {onOpenRapidMode && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs font-bold transition"
              onClick={() => {
                onOpenRapidMode();
                if (onNavigateMobile) onNavigateMobile();
              }}
            >
              <Camera size={15} />
              <span>Rapid Daily Entry (Camera)</span>
            </button>
          )}

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl text-xs font-semibold transition"
            onClick={() => {
              onOpenAddPanel();
              if (onNavigateMobile) onNavigateMobile();
            }}
          >
            <Plus size={15} />
            <span>Add Single Panel</span>
          </button>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudConnected ? 'bg-white' : 'bg-neutral-600'
            }`}
          />
          {!isCollapsed && (
            <span>{isCloudConnected ? 'Cloud Sync Active' : 'Connecting to Cloud...'}</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
