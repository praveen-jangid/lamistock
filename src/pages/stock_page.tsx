import React from 'react';
import type { LaminatedPanel, MatchResult } from '../types/panel';
import { PanelGrid } from '../components/panel_grid';
import { TreePine } from 'lucide-react';

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
            <p className="text-xs text-slate-500 mt-0.5">
              {totalSheetsCount} total sheets across {panels.length} panel dimensions
            </p>
          </div>
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
