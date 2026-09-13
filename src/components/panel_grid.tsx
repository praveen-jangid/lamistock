import React, { useState, useEffect, useMemo } from 'react';
import type { LaminatedPanel } from '../types/panel';
import { PanelCard } from './panel_card';
import { scheduleIdlePreload } from '../services/image_cache';
import { TreePine, Plus, Camera, Loader2, Search, ArrowUpDown } from 'lucide-react';

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

const INITIAL_BATCH_SIZE = 24;
const BATCH_INCREMENT = 24;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'largest' | 'quantity'>('newest');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_BATCH_SIZE);

  // Pre-warm back images for first 16 panels in background idle time
  useEffect(() => {
    const urlsToWarm = panels
      .slice(0, 16)
      .map((p) => p.backImageUrl)
      .filter((url): url is string => Boolean(url && !url.startsWith('data:')));
    scheduleIdlePreload(urlsToWarm);
  }, [panels]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleLimit(INITIAL_BATCH_SIZE);
  };

  const handleSortChange = (val: 'newest' | 'largest' | 'quantity') => {
    setSortBy(val);
    setVisibleLimit(INITIAL_BATCH_SIZE);
  };

  // Filter and sort panels with memoization for instant responsiveness
  const filteredPanels = useMemo(() => {
    let result = [...panels];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const idMatch = p.id.toLowerCase().includes(q);
        const woodMatch = (p.woodType || '').toLowerCase().includes(q);
        const notesMatch = (p.notes || '').toLowerCase().includes(q);
        const dimMatch = `${p.length}x${p.width}`.includes(q) || `${p.length}*${p.width}`.includes(q);
        return idMatch || woodMatch || notesMatch || dimMatch;
      });
    }

    if (sortBy === 'largest') {
      result.sort((a, b) => b.length * b.width - a.length * a.width);
    } else if (sortBy === 'quantity') {
      result.sort((a, b) => b.quantity - a.quantity);
    }
    // 'newest' keeps default database order

    return result;
  }, [panels, searchQuery, sortBy]);

  const displayedPanels = useMemo(() => {
    return filteredPanels.slice(0, visibleLimit);
  }, [filteredPanels, visibleLimit]);

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
    <div className="space-y-5">
      {/* Search & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search panels by wood type, dimensions (e.g. 48x24), notes..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium whitespace-nowrap">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="newest">Recent First</option>
              <option value="largest">Largest Area First</option>
              <option value="quantity">Highest Stock First</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg whitespace-nowrap">
            {filteredPanels.length} {filteredPanels.length === 1 ? 'panel' : 'panels'}
          </span>
        </div>
      </div>

      {filteredPanels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          <p className="text-sm font-semibold text-slate-700">No panels match "{searchQuery}"</p>
          <button
            type="button"
            className="mt-2 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {/* Panel Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedPanels.map((panel, index) => (
              <PanelCard
                key={panel.id}
                panel={panel}
                isAboveFold={index < 8}
                onEdit={onEdit}
                onDelete={onDelete}
                onShare={onShare}
                onMatchThis={onMatchThis}
              />
            ))}
          </div>

          {/* Progressive Load More Button for large inventories */}
          {filteredPanels.length > visibleLimit && (
            <div className="flex flex-col items-center justify-center pt-4 pb-2 gap-2">
              <button
                type="button"
                className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition cursor-pointer active:scale-95"
                onClick={() => setVisibleLimit((prev) => prev + BATCH_INCREMENT)}
              >
                Load More Panels ({filteredPanels.length - visibleLimit} remaining)
              </button>
              <span className="text-[11px] text-slate-400">
                Showing {visibleLimit} of {filteredPanels.length} total panels
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

