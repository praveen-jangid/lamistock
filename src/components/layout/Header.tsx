import React from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  Cloud,
  FileSpreadsheet,
  Camera,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { isFirebaseReady } from '../../services/firebase';

interface HeaderProps {
  activeTabTitle: string;
  onOpenMatcher: () => void;
  onOpenBulkMatcher: () => void;
  onOpenAddPanel: () => void;
  onOpenRapidMode?: () => void;
  onOpenFirebaseSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  onOpenMatcher,
  onOpenBulkMatcher,
  onOpenAddPanel,
  onOpenRapidMode,
  onOpenFirebaseSettings,
  onToggleMobileSidebar
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Mobile Menu & Current Section Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            onClick={onToggleMobileSidebar}
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">LamiStock</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-slate-900 font-extrabold tracking-tight text-base sm:text-lg m-0">
              {activeTabTitle}
            </h1>
          </div>

          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200/80"
            title="Active factory route"
          >
            <MapPin size={12} className="text-emerald-600" />
            <span>Unit 2 (Lamination)</span>
            <ArrowRight size={11} className="text-slate-400" />
            <span>Unit 1 (Assembly)</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cloud Sync Badge */}
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
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
            <span>{isCloudConnected ? 'Cloud Online' : 'Connect Cloud'}</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              onClick={onOpenRapidMode}
              title="Rapid Daily Entry with Android Camera"
            >
              <Camera size={14} />
              <span>Rapid Entry</span>
            </button>
          )}

          {/* Add Surplus Stock */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-xs"
            onClick={onOpenAddPanel}
            title="Add a surplus lamination panel into stock"
          >
            <Plus size={14} />
            <span>Add Panel</span>
          </button>

          {/* Single Urgent Panel Matcher */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-xs"
            onClick={onOpenMatcher}
            title="Match a single urgent panel size"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Single Match</span>
          </button>

          {/* Bulk Order Matcher Trigger */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
            onClick={onOpenBulkMatcher}
            title="Upload Excel order or check BOM against stock"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Bulk Order (Excel)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
