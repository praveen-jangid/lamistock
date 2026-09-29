import React from 'react';
import type { PalletConfig, ChallanComponentItem } from '../../../../types/challan';
import { Boxes, Plus, Trash2, GripVertical, Scissors } from 'lucide-react';

export interface PalletManagerProps {
  pallets: PalletConfig[];
  dispatchedItems: ChallanComponentItem[];
  checklistItems: ChallanComponentItem[];
  selectedForPalletMove: Set<string>;
  isDraggingOverPallet: number | null;
  onAddPallet: () => void;
  onRemovePallet: (palletId: number) => void;
  onMoveItemToPallet: (itemId: string, targetPalletId: number) => void;
  onMoveSelectedToPallet: (targetPalletId: number) => void;
  onToggleSelectForPalletMove: (itemId: string) => void;
  onClearSelectedForPalletMove: () => void;
  onOpenSplitModal: (item: ChallanComponentItem) => void;
  onOpenSplitModalForBase: (baseItemId?: string) => void;
  onMergeSplit: (itemId: string, targetPalletId: number) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent, palletId: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetPalletId: number) => void;
}

export const PalletManager: React.FC<PalletManagerProps> = ({
  pallets,
  dispatchedItems,
  checklistItems,
  selectedForPalletMove,
  isDraggingOverPallet,
  onAddPallet,
  onRemovePallet,
  onMoveItemToPallet,
  onMoveSelectedToPallet,
  onToggleSelectForPalletMove,
  onClearSelectedForPalletMove,
  onOpenSplitModal,
  onOpenSplitModalForBase,
  onMergeSplit,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  if (dispatchedItems.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Boxes size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 m-0 uppercase tracking-tight">
                3. Pallet Packing Management
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {pallets.length} Pallet{pallets.length > 1 ? 's' : ''} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 m-0 mt-0.5">
              Organize components into Pallet 1 and Pallet 2. Drag & drop or use checkboxes to transfer items. Both pallets print on a single split A4 page!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pallets.length === 1 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              onClick={onAddPallet}
            >
              <Plus size={14} />
              <span>+ Add Pallet 2</span>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              onClick={() => onRemovePallet(2)}
            >
              <Trash2 size={13} />
              <span>Remove Pallet 2</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-select bulk transfer bar */}
      {selectedForPalletMove.size > 0 && pallets.length > 1 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900">
              {selectedForPalletMove.size} component{selectedForPalletMove.size > 1 ? 's' : ''} selected
            </span>
            <span className="text-amber-700 text-[11px]">(Bulk move to another pallet)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs"
              onClick={() => onMoveSelectedToPallet(1)}
            >
              Move to Pallet 1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs"
              onClick={() => onMoveSelectedToPallet(2)}
            >
              Move to Pallet 2
            </button>
            <button
              type="button"
              className="px-2 py-1 text-slate-500 hover:text-slate-800 rounded-lg font-medium text-xs transition cursor-pointer"
              onClick={onClearSelectedForPalletMove}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pallet Boards Grid */}
      <div className={`grid grid-cols-1 ${pallets.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
        {pallets.map((p) => {
          const pItems = dispatchedItems.filter((it) => (it.palletNumber || 1) === p.id);
          const pPieces = pItems.reduce((s, it) => s + it.dispatchingNowQty, 0);
          const isHovered = isDraggingOverPallet === p.id;
          const otherPalletId = p.id === 1 ? 2 : 1;

          return (
            <div
              key={p.id}
              onDragOver={(e) => onDragOver(e, p.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, p.id)}
              className={`bg-white border-2 rounded-2xl p-4 transition shadow-xs flex flex-col justify-between ${
                isHovered
                  ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Pallet Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center">
                      P{p.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 m-0 uppercase">
                        {p.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-extrabold text-xs">
                      {pPieces} pcs
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      {pItems.length} items
                    </div>
                  </div>
                </div>

                {/* Items in this pallet */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {pItems.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      <Boxes size={20} className="mx-auto mb-1 text-slate-300" />
                      <span>No components in Pallet {p.id}.</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Drag components here or switch their pallet dropdown.
                      </p>
                    </div>
                  ) : (
                    pItems.map((it) => {
                      const isCheckedForMove = selectedForPalletMove.has(it.id);
                      const isSplit = !!it.splitDetails;
                      const baseId = it.baseItemId || it.id;
                      return (
                        <div
                          key={it.id}
                          draggable={!isSplit}
                          onDragStart={(e) => !isSplit && onDragStart(e, it.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                            isCheckedForMove
                              ? 'bg-amber-50 border-amber-300'
                              : isSplit
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 cursor-grab active:cursor-grabbing'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {!isSplit ? (
                              <GripVertical size={14} className="text-slate-400 flex-shrink-0" />
                            ) : (
                              <Scissors size={14} className="text-amber-600 flex-shrink-0" />
                            )}
                            {pallets.length > 1 && !isSplit && (
                              <input
                                type="checkbox"
                                checked={isCheckedForMove}
                                onChange={() => onToggleSelectForPalletMove(it.id)}
                                className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                                title="Select for bulk pallet move"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">
                                  {it.partName}
                                </span>
                                {it.isCustomItem && (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                                    Sample
                                  </span>
                                )}
                                {isSplit && it.splitDetails && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                    ✂ Split: {it.dispatchingNowQty} of {it.splitDetails.originalTotalQty} in P{p.id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {it.dimensions}
                                {it.productCode && ` • ${it.productCode}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-black text-slate-900 text-xs">
                              {it.dispatchingNowQty} pcs
                            </span>
                            {!isSplit && it.totalOrderQty > 0 && it.dispatchingNowQty > it.totalOrderQty && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                +{it.dispatchingNowQty - it.totalOrderQty} extra
                              </span>
                            )}

                            {isSplit ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition cursor-pointer border border-amber-300"
                                  onClick={() => onOpenSplitModalForBase(baseId)}
                                  title="Edit split quantities"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                                  onClick={() => onMergeSplit(baseId, p.id === 1 ? 1 : 2)}
                                  title={`Merge all to Pallet ${p.id}`}
                                >
                                  All to P{p.id}
                                </button>
                              </div>
                            ) : (
                              pallets.length > 1 && (
                                <div className="flex items-center gap-1">
                                  {it.dispatchingNowQty >= 2 && (
                                    <button
                                      type="button"
                                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                                      onClick={() => {
                                        const originalItem = checklistItems.find((c) => c.id === it.id) || it;
                                        onOpenSplitModal(originalItem);
                                      }}
                                      title="Divide this component across Pallet 1 and Pallet 2"
                                    >
                                      <Scissors size={10} />
                                      <span>Split</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold transition cursor-pointer"
                                    onClick={() => onMoveItemToPallet(it.id, otherPalletId)}
                                    title={`Move to Pallet ${otherPalletId}`}
                                  >
                                    {p.id === 1 ? '→ P2' : '← P1'}
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pallet summary footer */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Pallet {p.id} Subtotal:</span>
                <strong className="text-slate-800 font-mono">
                  {pItems.filter((it) => it.category === 'LAMINATION').reduce((s, it) => s + it.dispatchingNowQty, 0)} Panels •{' '}
                  {pItems.filter((it) => it.category === 'FRAME').reduce((s, it) => s + it.dispatchingNowQty, 0)} Frames
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
