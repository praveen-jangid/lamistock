import React from 'react';
import type { LaminatedPanel } from '../types/panel';
import { PanelCard } from './panel_card';
import { TreePine, Plus, Camera, Loader2 } from 'lucide-react';

interface PanelGridProps {
  panels: LaminatedPanel[];
  isLoading: boolean;
  onAddNew: () => void;
  onOpenRapidMode?: () => void;
  onEdit: (panel: LaminatedPanel) => void;
  onDelete: (panel: LaminatedPanel) => void;
  onShare: (panel: LaminatedPanel) => void;
  onMatchThis: (panel: LaminatedPanel) => void;
}

export const PanelGrid: React.FC<PanelGridProps> = ({
  panels,
  isLoading,
  onAddNew,
  onOpenRapidMode,
  onEdit,
  onDelete,
  onShare,
  onMatchThis
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium">Loading lamination panel stock...</p>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-xs max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <TreePine size={36} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 m-0">
          No Lamination Panels In Stock
        </h3>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
          Add surplus laminated panels to manage stock and match with incoming furniture orders.
        </p>
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
            onClick={onAddNew}
          >
            <Plus size={16} />
            <span>Add Single Panel</span>
          </button>
          {onOpenRapidMode && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              onClick={onOpenRapidMode}
            >
              <Camera size={16} />
              <span>Daily Rapid Entry (Camera)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
          onMatchThis={onMatchThis}
        />
      ))}
    </div>
  );
};
