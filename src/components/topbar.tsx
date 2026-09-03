import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Sparkles,
  Plus,
  Cloud,
  FileSpreadsheet,
  Camera,
  MapPin,
  ArrowRight,
  TreePine,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { isFirebaseReady } from '../services/firebase';

export interface TopbarProps {
  activeTabTitle: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenMatcher: () => void;
  onOpenBulkMatcher: () => void;
  onOpenAddPanel: () => void;
  onOpenRapidMode?: () => void;
  onOpenFirebaseSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTabTitle,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMatcher,
  onOpenBulkMatcher,
  onOpenAddPanel,
  onOpenRapidMode,
  onOpenFirebaseSettings,
  onToggleMobileSidebar
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur border-b border-slate-200 transition-all">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle, Brand & Current Section Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Trigger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition flex-shrink-0"
            onClick={onToggleMobileSidebar}
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleSidebarCollapse && (
            <button
              type="button"
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex-shrink-0"
              onClick={onToggleSidebarCollapse}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}

          {/* Brand Logo & Name */}
          <Link
            to="/stock"
            className="flex items-center gap-2.5 text-inherit no-underline group flex-shrink-0"
            title="LamiStock Home"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 group-hover:bg-slate-800 transition shadow-xs flex-shrink-0">
              <TreePine size={19} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                LamiStock
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider hidden sm:block leading-none">
                Unit 2 Hub
              </span>
            </div>
          </Link>

          <span className="text-slate-300 hidden sm:inline select-none">/</span>

          {/* Current Section Title */}
          <div className="min-w-0">
            <h1 className="text-slate-800 font-extrabold tracking-tight text-sm sm:text-base m-0 truncate">
              {activeTabTitle}
            </h1>
          </div>

          {/* Factory Route Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200/80 flex-shrink-0"
            title="Active factory dispatch route"
          >
            <MapPin size={12} className="text-emerald-600" />
            <span>Unit 2 (Lamination)</span>
            <ArrowRight size={11} className="text-slate-400" />
            <span>Unit 1 (Assembly)</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Cloud Sync Badge */}
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border flex-shrink-0 ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            onClick={onOpenFirebaseSettings}
            title={
              isCloudConnected
                ? 'Firebase Cloud Connected (Online Real-Time Sync between Android & Mac)'
                : 'Click to connect your free Firebase Cloud project'
            }
          >
            <Cloud size={14} className={isCloudConnected ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="hidden sm:inline">
              {isCloudConnected ? 'Cloud Online' : 'Connect Cloud'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </button>

          {/* Rapid Daily Stock Add (Android Camera) */}
          {onOpenRapidMode && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex-shrink-0"
              onClick={onOpenRapidMode}
              title="Rapid Daily Entry with Android Camera"
            >
              <Camera size={14} />
              <span className="hidden sm:inline">Rapid Entry</span>
            </button>
          )}

          {/* Add Surplus Stock */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-xs flex-shrink-0"
            onClick={onOpenAddPanel}
            title="Add a surplus lamination panel into stock"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Panel</span>
          </button>

          {/* Single Urgent Panel Matcher */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-xs flex-shrink-0"
            onClick={onOpenMatcher}
            title="Match a single urgent panel size"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="hidden md:inline">Single Match</span>
          </button>

          {/* Bulk Order Matcher Trigger */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex-shrink-0"
            onClick={onOpenBulkMatcher}
            title="Upload Excel order or check BOM against stock"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Bulk Order</span>
            <span className="hidden lg:inline"> (Excel)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// Aliases for backwards compatibility
export const Header = Topbar;
export default Topbar;
