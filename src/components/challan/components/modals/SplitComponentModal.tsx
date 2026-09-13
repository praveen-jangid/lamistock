import React, { useState } from 'react';
import type { ChallanComponentItem } from '../../../../types/challan';
import { Scissors, X, Minus, Plus, CheckCircle2 } from 'lucide-react';

export interface SplitComponentModalProps {
  isOpen: boolean;
  item: ChallanComponentItem | null;
  currentSplit?: { p1: number; p2: number };
  totalQty: number;
  onClose: () => void;
  onApply: (itemId: string, p1: number, p2: number) => void;
  onMerge: (itemId: string, targetPalletId: number) => void;
}

export const SplitComponentModal: React.FC<SplitComponentModalProps> = ({
  isOpen,
  item,
  currentSplit,
  totalQty,
  onClose,
  onApply,
  onMerge
}) => {
  const defaultP1 = currentSplit
    ? Math.max(1, Math.min(totalQty - 1, currentSplit.p1))
    : Math.max(1, Math.floor(totalQty / 2));

  const [p1Qty, setP1Qty] = useState<number>(defaultP1);

  if (!isOpen || !item) return null;

  const p2Qty = totalQty - p1Qty;
  const p1Pct = Math.round((p1Qty / totalQty) * 100);
  const p2Pct = 100 - p1Pct;

  const handleP1Change = (val: number) => {
    const clamped = Math.max(1, Math.min(totalQty - 1, val));
    setP1Qty(clamped);
  };

  const handleP2Change = (val: number) => {
    const clampedP2 = Math.max(1, Math.min(totalQty - 1, val));
    setP1Qty(totalQty - clampedP2);
  };

  const handlePresetHalf = () => {
    setP1Qty(Math.ceil(totalQty / 2));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <Scissors size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white m-0 uppercase">
                Divide Across Pallets
              </h3>
              <p className="text-[11px] text-slate-300 m-0">
                Allocate component pieces between Pallet 1 & Pallet 2
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Component Info Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    item.category === 'LAMINATION'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-indigo-100 text-indigo-900'
                  }`}
                >
                  {item.category}
                </span>
                <span className="font-mono text-[11px] text-slate-500 font-bold">
                  {item.productCode || item.orderTitle}
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                {item.partName}
              </h4>
              <div className="font-mono text-slate-600 text-xs mt-0.5">
                {item.dimensions}
              </div>
            </div>

            <div className="text-right flex-shrink-0 bg-white px-3 py-2 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total Dispatching</div>
              <div className="font-mono font-black text-base text-slate-900">
                {totalQty} <span className="text-xs font-semibold text-slate-500">pcs</span>
              </div>
            </div>
          </div>

          {/* Allocation Boxes: Pallet 1 vs Pallet 2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pallet 1 Box */}
            <div className="p-3.5 rounded-xl border-2 border-slate-900 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono font-black text-[10px] flex items-center justify-center">
                    P1
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs uppercase">Pallet 1</span>
                </div>
                <span className="font-mono font-bold text-[11px] text-slate-600">
                  {p1Pct}%
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={p1Qty <= 1}
                  onClick={() => handleP1Change(p1Qty - 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={totalQty - 1}
                  value={p1Qty}
                  onChange={(e) => handleP1Change(parseInt(e.target.value, 10) || 1)}
                  className="w-16 h-8 text-center bg-white border border-slate-300 rounded-lg font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  disabled={p1Qty >= totalQty - 1}
                  onClick={() => handleP1Change(p1Qty + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="text-center font-mono font-black text-xs text-slate-800">
                {p1Qty} pieces on Pallet 1
              </div>
            </div>

            {/* Pallet 2 Box */}
            <div className="p-3.5 rounded-xl border-2 border-amber-500 bg-amber-50/40 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-amber-500 text-white font-mono font-black text-[10px] flex items-center justify-center">
                    P2
                  </span>
                  <span className="font-extrabold text-amber-950 text-xs uppercase">Pallet 2</span>
                </div>
                <span className="font-mono font-bold text-[11px] text-amber-800">
                  {p2Pct}%
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={p2Qty <= 1}
                  onClick={() => handleP2Change(p2Qty - 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-black text-sm flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={totalQty - 1}
                  value={p2Qty}
                  onChange={(e) => handleP2Change(parseInt(e.target.value, 10) || 1)}
                  className="w-16 h-8 text-center bg-white border border-amber-300 rounded-lg font-mono font-black text-base text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={p2Qty >= totalQty - 1}
                  onClick={() => handleP2Change(p2Qty + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-black text-sm flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="text-center font-mono font-black text-xs text-amber-900">
                {p2Qty} pieces on Pallet 2
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Pallet 1 ({p1Qty} pcs)</span>
              <span className="text-slate-400">Drag slider to adjust ratio</span>
              <span>Pallet 2 ({p2Qty} pcs)</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalQty - 1}
              value={p1Qty}
              onChange={(e) => handleP1Change(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            {/* Visual ratio bar */}
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200 border border-slate-300">
              <div
                style={{ width: `${p1Pct}%` }}
                className="bg-slate-900 transition-all duration-150"
                title={`Pallet 1: ${p1Qty} pcs (${p1Pct}%)`}
              />
              <div
                style={{ width: `${p2Pct}%` }}
                className="bg-amber-500 transition-all duration-150"
                title={`Pallet 2: ${p2Qty} pcs (${p2Pct}%)`}
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-500">Presets:</div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePresetHalf}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                50 / 50 Half
              </button>
              <button
                type="button"
                onClick={() => onMerge(item.id, 1)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                All in Pallet 1
              </button>
              <button
                type="button"
                onClick={() => onMerge(item.id, 2)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer"
              >
                All in Pallet 2
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          {currentSplit ? (
            <button
              type="button"
              className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
              onClick={() => onMerge(item.id, 1)}
            >
              Reset / Don't Split
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              onClick={() => onApply(item.id, p1Qty, p2Qty)}
            >
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Apply Split ({p1Qty} in P1, {p2Qty} in P2)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
