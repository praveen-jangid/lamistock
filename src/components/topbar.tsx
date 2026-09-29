import React from 'react';
import { Link } from 'react-router-dom';
import {
  TreePine,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

export interface TopbarProps {
  activeTabTitle?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  onOpenFirebaseSettings?: () => void;
  onToggleMobileSidebar?: () => void;
  hasUpdate?: boolean;
  onOpenUpdateModal?: () => void;
  appVersion?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  isRightSidebarOpen,
  onToggleRightSidebar,
  hasUpdate,
  onOpenUpdateModal,
  appVersion
}) => {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur border-b border-slate-200 transition-all">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Brand & Current Section Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">

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
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                LamiStock
              </span>
              {appVersion && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-semibold text-slate-500 border border-slate-200">
                  v{appVersion}
                </span>
              )}
            </div>
          </Link>

        </div>

        {/* Right: Cloud Sync, Update Notification & Quick Actions Toggle */}
        <div className="flex items-center gap-2.5 flex-shrink-0">

          {/* Update Available Banner Button */}
          {hasUpdate && onOpenUpdateModal && (
            <button
              type="button"
              onClick={onOpenUpdateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-xs transition animate-pulse"
              title="New update available! Click to update now."
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Update Ready</span>
            </button>
          )}

          {/* Quick Actions Sidebar Toggle */}
          {onToggleRightSidebar && (
            <button
              type="button"
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs border ${
                isRightSidebarOpen
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              onClick={onToggleRightSidebar}
              title="Toggle Quick Actions Sidebar"
            >
              <Zap
                size={14}
                className={isRightSidebarOpen ? 'fill-amber-400 text-amber-400' : 'text-amber-500'}
              />
              <span className="hidden sm:inline">Actions</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Aliases for backwards compatibility
export const Header = Topbar;
export default Topbar;
