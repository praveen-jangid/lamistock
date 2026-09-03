import React from 'react';
import type { LaminatedPanel, MatchResult } from '../types/panel';
import { PanelGrid } from '../components/panel_grid';
import { TreePine, Camera, Plus, Sparkles, FileSpreadsheet } from 'lucide-react';

interface StockPageProps {
  panels: LaminatedPanel[];
  isLoading: boolean;
  totalSheetsCount: number;
  onOpenAdd: () => void;
  onOpenRapidMode: () => void;
  onOpenMatcher: (panel?: LaminatedPanel) => void;
  onOpenBulkMatcher: () => void;
  onEditPanel: (panel: LaminatedPanel) => void;
  onDeletePanel: (panel: LaminatedPanel) => void;
  onSharePanel: (panel: LaminatedPanel, matchResult?: MatchResult) => void;
}

export const StockPage: React.FC<StockPageProps> = ({
  panels,
  isLoading,
  totalSheetsCount,
  onOpenAdd,
  onOpenRapidMode,
  onOpenMatcher,
  onOpenBulkMatcher,
  onEditPanel,
  onDeletePanel,
  onSharePanel,
}) => {
  return (
    <div className="space-y-6">
      {/* Minimalist Stock Section Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 flex-shrink-0">
            <TreePine size={26} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 m-0">
              Lamination Panel Inventory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Surplus laminated panels stored in Unit 2 • Dimensions in Inches (″)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
            <span className="text-lg font-black font-mono text-slate-900 leading-none">
              {totalSheetsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Panels in Stock</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            onClick={onOpenRapidMode}
            title="Daily rapid entry with Android native camera"
          >
            <Camera size={15} />
            <span>Rapid Daily Entry</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
            onClick={onOpenAdd}
          >
            <Plus size={15} />
            <span>Add Single Panel</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
            onClick={() => onOpenMatcher()}
            title="Match single urgent panel size"
          >
            <Sparkles size={15} className="text-amber-500" />
            <span>Single Match</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            onClick={onOpenBulkMatcher}
            title="Import Excel or multi-size order BOM"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Bulk Order (Excel)</span>
          </button>
        </div>
      </div>

      <PanelGrid
        panels={panels}
        isLoading={isLoading}
        onAddNew={onOpenAdd}
        onOpenRapidMode={onOpenRapidMode}
        onEdit={onEditPanel}
        onDelete={onDeletePanel}
        onShare={onSharePanel}
        onMatchThis={(p) => onOpenMatcher(p)}
      />
    </div>
  );
};
