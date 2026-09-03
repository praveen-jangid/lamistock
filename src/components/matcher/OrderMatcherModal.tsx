import React, { useState, useMemo } from 'react';
import type { LaminatedPanel, OrderRequirement, MatchResult } from '../../types/panel';
import { formatDimensions, formatInches } from '../../utils/units';
import { matchOrderWithInventory } from '../../services/matcher';
import { VisualCutDiagram } from './VisualCutDiagram';
import { DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../../services/imageCompressor';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Box,
  Check,
  TreePine,
  RotateCw
} from 'lucide-react';

interface OrderMatcherModalProps {
  isOpen: boolean;
  inventory: LaminatedPanel[];
  initialPanel?: LaminatedPanel | null;
  onClose: () => void;
  onShareResult: (panel: LaminatedPanel, matchResult?: MatchResult) => void;
  onDeductStock?: (panelId: string, quantityToDeduct: number) => Promise<void>;
}

export const OrderMatcherModal: React.FC<OrderMatcherModalProps> = ({
  isOpen,
  inventory,
  initialPanel,
  onClose,
  onShareResult,
  onDeductStock
}) => {
  // Order Input State in Inches
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reqLength, setReqLength] = useState<number>(initialPanel ? initialPanel.length : 36);
  const [reqWidth, setReqWidth] = useState<number>(initialPanel ? initialPanel.width : 24);
  const [reqThickness, setReqThickness] = useState<number>(initialPanel ? initialPanel.thickness : 0.75);
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [quantityNeeded, setQuantityNeeded] = useState<number>(2);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [deductedPanels, setDeductedPanels] = useState<Record<string, boolean>>({});
  const [flippedPanels, setFlippedPanels] = useState<Record<string, boolean>>({});

  // Compute Match Results
  const matchResults: MatchResult[] = useMemo(() => {
    const order: OrderRequirement = {
      orderNumber,
      length: Number(reqLength),
      width: Number(reqWidth),
      thickness: Number(reqThickness),
      quantityNeeded: Number(quantityNeeded),
      allowRotation
    };

    return matchOrderWithInventory(order, inventory);
  }, [
    orderNumber,
    reqLength,
    reqWidth,
    reqThickness,
    allowRotation,
    quantityNeeded,
    inventory
  ]);

  const selectedResult = matchResults[activeResultIndex] || matchResults[0];

  const handleDeduct = async (result: MatchResult) => {
    if (!onDeductStock) return;
    const confirmDeduct = window.confirm(
      `Reserve / Deduct ${result.totalPanelsRequired} panel(s) of [${formatDimensions(result.panel.length, result.panel.width, result.panel.thickness)}] from stock for this order?`
    );
    if (!confirmDeduct) return;

    try {
      await onDeductStock(result.panel.id, result.totalPanelsRequired);
      setDeductedPanels((prev) => ({ ...prev, [result.panel.id]: true }));
    } catch (e) {
      console.error('Error deducting stock:', e);
      alert('Could not deduct stock.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} /> Smart Order Matcher & Cut Optimizer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter required panel size in inches to instantly find matching extra stock.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Matcher Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Order Input Form */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
              📋 New Order Dimensions (Inches)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Length (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={reqLength}
                  onChange={(e) => setReqLength(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Width (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={reqWidth}
                  onChange={(e) => setReqWidth(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Thickness (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={reqThickness}
                  onChange={(e) => setReqThickness(Number(e.target.value))}
                  min={0.1}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pieces Needed: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={quantityNeeded}
                  onChange={(e) => setQuantityNeeded(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Order Reference #:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  checked={allowRotation}
                  onChange={(e) => setAllowRotation(e.target.checked)}
                />
                <span className="text-xs font-medium text-slate-700">
                  Allow 90° Cut Rotation (Yield optimization)
                </span>
              </label>
            </div>

            {/* Quick Size Presets */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                ⚡ Common Order Sizes:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'Table Top (72″ × 36″)', l: 72, w: 36, t: 0.75 },
                  { label: 'Desk / Shelf (48″ × 24″)', l: 48, w: 24, t: 0.75 },
                  { label: 'Drawer / Shutter (30″ × 18″)', l: 30, w: 18, t: 0.75 }
                ].map((sz) => (
                  <button
                    key={sz.label}
                    type="button"
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
                    onClick={() => {
                      setReqLength(sz.l);
                      setReqWidth(sz.w);
                      setReqThickness(sz.t);
                    }}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Match Results & Cut Optimization */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 m-0">
                🎯 Found {matchResults.length} Matching Stock Option{matchResults.length === 1 ? '' : 's'}
              </h3>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono text-slate-700">
                Target: {formatInches(reqLength)} × {formatInches(reqWidth)} × {formatInches(reqThickness)} ({quantityNeeded} pcs)
              </span>
            </div>

            {matchResults.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-auto">
                <AlertTriangle size={36} className="text-amber-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 m-0">No Matching Surplus Panels in Stock</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-0">
                  No panel in your stock satisfies {formatInches(reqLength)} × {formatInches(reqWidth)} in {formatInches(reqThickness)} thickness.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal / Scroll list of options */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {matchResults.map((result, idx) => {
                    const isSelected = idx === activeResultIndex;
                    const { panel, matchType, matchScore, yieldPerSheet, wastePercentage } = result;

                    return (
                      <div
                        key={panel.id}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setActiveResultIndex(idx)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {matchType === 'EXACT' && '⭐ Exact Match'}
                            {matchType === 'MULTI_YIELD' && `✨ High Yield (${yieldPerSheet} pcs)`}
                            {matchType === 'OVERSIZED_CUT' && '✂️ Cut-Down Match'}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700">
                            {matchScore}% Fit
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={
                                flippedPanels[panel.id]
                                  ? panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE
                                  : panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE
                              }
                              alt="Wood"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute bottom-0.5 right-0.5 p-1 bg-slate-900/80 text-white rounded text-[9px] flex items-center gap-0.5 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlippedPanels((prev) => ({ ...prev, [panel.id]: !prev[panel.id] }));
                              }}
                            >
                              <RotateCw size={9} />
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <strong className="text-xs font-mono font-bold text-slate-900 truncate">
                                {formatDimensions(panel.length, panel.width, panel.thickness)}
                              </strong>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{panel.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <TreePine size={12} className="text-emerald-600" />
                              <span>{panel.woodType || 'Laminated Wood'}</span>
                              <span>•</span>
                              <strong className="text-slate-800 font-medium">
                                {panel.quantity} panel in stock
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 pt-2 mt-2 border-t border-slate-100">
                          <span>Yield: <strong>{yieldPerSheet}</strong> pc/panel</span>
                          <span className="text-amber-700 font-bold">{wastePercentage}% offcut</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Result Inspection & Cut Diagram */}
                {selectedResult && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold font-mono text-slate-900 m-0">
                            {formatDimensions(selectedResult.panel.length, selectedResult.panel.width, selectedResult.panel.thickness)}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-[10px] font-bold text-slate-700">
                            Board #{selectedResult.panel.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>🪵 {selectedResult.panel.woodType || 'Laminated Wood'}</span>
                          {selectedResult.panel.notes && (
                            <span>• 📝 {selectedResult.panel.notes}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                        onClick={() => onShareResult(selectedResult.panel, selectedResult)}
                        title="Share Spec Sheet"
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Dual Front & Back Photo Preview */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-2.5 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                          FRONT FACE
                        </div>
                        <img
                          src={selectedResult.panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE}
                          alt="Front Face"
                          className="w-full h-24 object-cover"
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-2.5 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                          BACK FACE
                        </div>
                        <img
                          src={selectedResult.panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE}
                          alt="Back Face"
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    </div>

                    {/* Visual Cut Diagram */}
                    <VisualCutDiagram layout={selectedResult.cutLayout} />

                    {/* Match Analysis Reasons */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Match Analysis:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {selectedResult.matchReasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Fulfillment Summary & Deduction */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">
                          Panels Needed to Fulfill:
                        </span>
                        <span className="text-sm font-mono font-bold text-emerald-700">
                          {selectedResult.totalPanelsRequired} of {selectedResult.panel.quantity} Available
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                          deductedPanels[selectedResult.panel.id]
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                        onClick={() => handleDeduct(selectedResult)}
                        disabled={deductedPanels[selectedResult.panel.id]}
                      >
                        {deductedPanels[selectedResult.panel.id] ? (
                          <>
                            <Check size={14} /> Reserved for Order
                          </>
                        ) : (
                          <>
                            <Box size={14} /> Reserve / Deduct {selectedResult.totalPanelsRequired} Panel(s)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
