import React, { useState, useEffect } from 'react';
import type { LaminatedPanel } from '../types/panel';
import { formatDimensions } from '../utils/units';
import { DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../services/image_compressor';
import { preloadImage } from '../services/image_cache';
import {
  RotateCw,
  Edit,
  Trash2,
  TreePine
} from 'lucide-react';

interface PanelCardProps {
  panel: LaminatedPanel;
  isAboveFold?: boolean;
  onEdit: (panel: LaminatedPanel) => void;
  onDelete: (panel: LaminatedPanel) => void;
  onShare?: (panel: LaminatedPanel) => void;
  onMatchThis?: (panel: LaminatedPanel) => void;
}

export const PanelCard: React.FC<PanelCardProps> = React.memo(({
  panel,
  isAboveFold = false,
  onEdit,
  onDelete
}) => {
  const [showBack, setShowBack] = useState(false);

  const frontImg = panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE;
  const backImg = panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE;

  // Track if images have finished decoding/loading for smooth skeleton fade-in
  const isFrontSvg = frontImg.startsWith('data:image/svg+xml');
  const isBackSvg = backImg.startsWith('data:image/svg+xml');
  const [frontLoaded, setFrontLoaded] = useState(isFrontSvg);
  const [backLoaded, setBackLoaded] = useState(isBackSvg);

  // Pre-warm memory cache with back image immediately upon card appearance
  useEffect(() => {
    if (panel.backImageUrl) {
      preloadImage(panel.backImageUrl);
    }
  }, [panel.backImageUrl]);

  const isCurrentFaceLoaded = showBack ? backLoaded : frontLoaded;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition duration-200 hover:-translate-y-0.5 ${
        !isAboveFold ? 'panel-deferred-render' : ''
      }`}
    >
      {/* Media Box with Dual-Layer Instant Flip */}
      <div className="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-200 group">
        {/* Shimmer Skeleton Placeholder while current face is loading */}
        {!isCurrentFaceLoaded && (
          <div className="absolute inset-0 skeleton-shimmer z-0 pointer-events-none" />
        )}

        {/* Front Face Layer */}
        <img
          src={frontImg}
          alt="Front Face"
          loading={isAboveFold ? 'eager' : 'lazy'}
          fetchPriority={isAboveFold ? 'high' : 'low'}
          decoding="async"
          onLoad={() => setFrontLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            showBack ? 'opacity-0 pointer-events-none' : 'opacity-100'
          } ${frontLoaded ? '' : 'opacity-0'}`}
        />

        {/* Back Face Layer (Pre-rendered & pre-decoded for 0ms instant flip) */}
        <img
          src={backImg}
          alt="Back Face"
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          onLoad={() => setBackLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
            showBack ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${backLoaded ? '' : 'opacity-0'}`}
        />

        {/* Face Indicator Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs z-10 select-none">
          {showBack ? 'Back Face' : 'Front Face'}
        </div>

        {/* Flip Button */}
        <button
          type="button"
          className="absolute top-3 right-3 bg-white/95 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs border border-slate-200/80 flex items-center gap-1.5 transition cursor-pointer z-10 active:scale-95"
          onClick={() => setShowBack(!showBack)}
          title="Toggle Front / Back face view"
        >
          <RotateCw size={12} className={showBack ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
          <span>{showBack ? 'View Front' : 'View Back'}</span>
        </button>

        {/* Stock Quantity Pill */}
        <div className="absolute bottom-3 right-3 bg-slate-900 text-white font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-md z-10">
          <span className="font-mono text-sm">{panel.quantity}</span>
          <span className="text-[11px] font-medium opacity-90">
            {panel.quantity === 1 ? 'Panel' : 'Panels'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            <TreePine size={13} className="text-emerald-600" />
            <span>{panel.woodType || 'Laminated Wood'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            #{panel.id.slice(-6).toUpperCase()}
          </span>
          <button
          type="button"
          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition shadow-2xs cursor-pointer"
          onClick={() => onEdit(panel)}
          title="Edit dimensions or stock"
        >
          <Edit size={15} />
        </button>
        <button
          type="button"
          className="p-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition shadow-2xs cursor-pointer"
          onClick={() => onDelete(panel)}
          title="Delete panel"
        >
          <Trash2 size={15} />
        </button>
        </div>

        {/* Large Dimensions Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Dimensions (L × W × T):
          </span>
          <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5 tracking-tight">
            {formatDimensions(panel.length, panel.width, panel.thickness)}
          </h3>
        </div>

        {panel.notes && (
          <p className="text-xs text-slate-500 line-clamp-2" title={panel.notes}>
            📝 {panel.notes}
          </p>
        )}
      </div>
    </div>
  );
});

