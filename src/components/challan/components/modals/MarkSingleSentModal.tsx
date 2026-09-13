import React, { useState } from 'react';
import type { ChallanComponentItem } from '../../../../types/challan';
import { CheckCheck, X } from 'lucide-react';

export interface MarkSingleSentModalProps {
  item: ChallanComponentItem | null;
  onClose: () => void;
  onSave: (itemId: string, qtyToAdd: number) => void;
}

interface MarkSingleSentModalContentProps {
  item: ChallanComponentItem;
  onClose: () => void;
  onSave: (itemId: string, qtyToAdd: number) => void;
}

const MarkSingleSentModalContent: React.FC<MarkSingleSentModalContentProps> = ({
  item,
  onClose,
  onSave
}) => {
  const remaining = Math.max(0, item.totalOrderQty - item.alreadyDispatchedQty);
  const [qtyInput, setQtyInput] = useState<number>(remaining > 0 ? remaining : 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Mark Pieces as Already Sent</h3>
              <p className="text-[11px] text-slate-500 m-0">Record dispatched pieces without generating a challan voucher</p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Component:</span>
              <strong className="text-slate-900 font-bold">{item.partName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Order / Product:</span>
              <span className="text-slate-800 font-medium">{item.orderTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Size:</span>
              <span className="font-mono text-slate-800">{item.dimensions}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-semibold">Order Total:</span>
              <span className="font-mono font-bold text-slate-900">{item.totalOrderQty} pcs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Already Recorded Sent:</span>
              <span className="font-mono text-amber-700 font-bold">{item.alreadyDispatchedQty} pcs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Remaining Needed:</span>
              <span className="font-mono text-emerald-700 font-bold">{remaining} pcs</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Pieces to mark as sent now:</label>
              {remaining > 0 && (
                <button
                  type="button"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  onClick={() => setQtyInput(remaining)}
                >
                  Mark All Remaining ({remaining} pcs)
                </button>
              )}
            </div>
            <input
              type="number"
              min={1}
              max={remaining || 999}
              value={qtyInput}
              onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            onClick={() => onSave(item.id, qtyInput)}
          >
            Save & Update Sent Pieces
          </button>
        </div>
      </div>
    </div>
  );
};

export const MarkSingleSentModal: React.FC<MarkSingleSentModalProps> = ({
  item,
  onClose,
  onSave
}) => {
  if (!item) return null;
  return <MarkSingleSentModalContent item={item} onClose={onClose} onSave={onSave} />;
};
