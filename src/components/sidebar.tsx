import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  TreePine,
  Layers,
  FileSpreadsheet,
  Truck,
  BarChart3,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  MapPin,
  ArrowRight
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
  onNavigateMobile
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <aside
      className={`h-screen sticky top-0 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Sidebar Header: Brand & Factory Unit */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <Link
          to="/stock"
          className="flex items-center gap-3 no-underline text-inherit group"
          onClick={onNavigateMobile}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-slate-700 transition shadow-sm flex-shrink-0">
            <TreePine size={22} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                LamiStock
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Factory ERP
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Multi-Unit Location Badge */}
      {!isCollapsed && (
        <div className="mx-4 my-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
            <MapPin size={13} className="text-emerald-400" />
            <span>Factory Dispatch Route:</span>
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <div
              className="flex-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-1.5 text-center"
              title="Your current location"
            >
              <span className="block font-bold text-emerald-300">Unit 2</span>
              <span className="text-[9px] text-emerald-400/80 leading-none">Lamination & Wood</span>
            </div>
            <ArrowRight size={14} className="text-slate-500 flex-shrink-0" />
            <div
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center"
              title="Destination assembly workshop"
            >
              <span className="block font-bold text-slate-300">Unit 1</span>
              <span className="text-[9px] text-slate-400 leading-none">Furniture Assembly</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links with React Router */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            OPERATIONS
          </div>
        )}

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Lamination Panel Inventory (/stock)"
        >
          <div className="flex-shrink-0">
            <Layers size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Lamination Stock</span>
              {stockCount > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900/40 text-emerald-200">
                  {stockCount}
                </span>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Production Orders & Excel BOM (/orders)"
        >
          <div className="flex-shrink-0">
            <FileSpreadsheet size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Production Orders</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Excel
              </span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/challans"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive || window.location.hash.startsWith('#/challans')
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Outward Delivery Challans (/challans)"
        >
          <div className="flex-shrink-0">
            <Truck size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Outward Challans</span>
              {challansCount > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900/40 text-emerald-200">
                  {challansCount}
                </span>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/tracker"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          onClick={onNavigateMobile}
          title="Unit 1 Dispatch Tracking & Pending Items (/tracker)"
        >
          <div className="flex-shrink-0">
            <BarChart3 size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Unit 1 Tracker</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </>
          )}
        </NavLink>

        {!isCollapsed && (
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            SYSTEM
          </div>
        )}

        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
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
                  isCloudConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'
                }`}
              />
            </>
          )}
        </button>
      </nav>

      {/* Sidebar Quick Action Buttons */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            to="/challans/new"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            onClick={onNavigateMobile}
          >
            <Truck size={15} />
            <span>Create Outward Challan</span>
          </Link>

          {onOpenRapidMode && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
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
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          {!isCollapsed && (
            <span>{isCloudConnected ? 'Cloud Sync Active' : 'Offline Mode'}</span>
          )}
        </div>
      </div>
    </aside>
  );
};
