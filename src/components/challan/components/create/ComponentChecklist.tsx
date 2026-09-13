import React, { useState } from 'react';
import type { FactoryOrder, ChallanComponentItem, PalletConfig, ComponentCategory } from '../../../../types/challan';
import {
  Layers,
  Truck,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Scissors,
  X
} from 'lucide-react';

export interface ComponentChecklistProps {
  selectedOrders: FactoryOrder[];
  customItems: ChallanComponentItem[];
  selectedItemIds: Set<string>;
  onToggleItem: (id: string) => void;
  dispatchQtyOverrides: Record<string, number>;
  onQtyChange: (id: string, qty: number) => void;
  pallets: PalletConfig[];
  itemPalletMap: Record<string, number>;
  itemSplits: Record<string, { p1: number; p2: number }>;
  onMoveItemToPallet: (id: string, palletId: number) => void;
  onOpenSplitModal: (item: ChallanComponentItem) => void;
  onMergeSplit: (id: string, targetPalletId: number) => void;
  onOpenAddCustomModal: (category: ComponentCategory) => void;
  onDeleteCustomItem: (id: string) => void;
  onSetItemToMarkSent: (item: ChallanComponentItem) => void;
  onBulkMarkSelectedAsSent: () => void;
  onSelectAllLamination: () => void;
  onSelectAllFrames: () => void;
  onDeselectAll: () => void;
  laminationDispatched: ChallanComponentItem[];
  framesDispatched: ChallanComponentItem[];
  visibleLaminationAll: ChallanComponentItem[];
  visibleLaminationPending: ChallanComponentItem[];
  visibleLaminationAlreadySent: ChallanComponentItem[];
  visibleFramesAll: ChallanComponentItem[];
  visibleFramesPending: ChallanComponentItem[];
  visibleFramesAlreadySent: ChallanComponentItem[];
  totalAlreadySentCount: number;
}

export const ComponentChecklist: React.FC<ComponentChecklistProps> = ({
  selectedOrders,
  customItems,
  selectedItemIds,
  onToggleItem,
  dispatchQtyOverrides,
  onQtyChange,
  pallets,
  itemPalletMap,
  itemSplits,
  onMoveItemToPallet,
  onOpenSplitModal,
  onMergeSplit,
  onOpenAddCustomModal,
  onDeleteCustomItem,
  onSetItemToMarkSent,
  onBulkMarkSelectedAsSent,
  onSelectAllLamination,
  onSelectAllFrames,
  onDeselectAll,
  laminationDispatched,
  framesDispatched,
  visibleLaminationAll,
  visibleLaminationPending,
  visibleLaminationAlreadySent,
  visibleFramesAll,
  visibleFramesPending,
  visibleFramesAlreadySent,
  totalAlreadySentCount
}) => {
  // Toggle list state for already-sent components
  const [collapseAlreadySent, setCollapseAlreadySent] = useState<boolean>(true);
  const [showAlreadySentLamination, setShowAlreadySentLamination] = useState<boolean>(false);
  const [showAlreadySentFrames, setShowAlreadySentFrames] = useState<boolean>(false);

  return (
    <>
      {/* Selection Helpers & Direct Mark Sent Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <strong className="text-slate-700">Dispatching:</strong>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
            {laminationDispatched.length} Lamination Sizes (
            {laminationDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} panels)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
            {framesDispatched.length} Frame Components (
            {framesDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} pcs)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold transition cursor-pointer text-slate-700"
            onClick={onSelectAllLamination}
          >
            Select All Lamination
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold transition cursor-pointer text-slate-700"
            onClick={onSelectAllFrames}
          >
            Select All Frames
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg font-semibold transition cursor-pointer"
            onClick={onDeselectAll}
          >
            Deselect All
          </button>

          {/* Already-sent items toggle list mode */}
          {totalAlreadySentCount > 0 && (
            <button
              type="button"
              onClick={() => setCollapseAlreadySent((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs ${
                collapseAlreadySent
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
              title={
                collapseAlreadySent
                  ? 'Already sent components are kept in a collapsible toggle list. Click to show inline.'
                  : 'Click to keep already sent components in a collapsible toggle list.'
              }
            >
              <CheckCircle2 size={13} className={collapseAlreadySent ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Already Sent: {collapseAlreadySent ? 'In Toggle List' : 'Showing Inline'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  collapseAlreadySent ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalAlreadySentCount}
              </span>
            </button>
          )}

          {/* Direct Feature: Mark Selected as Sent without Challan */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition cursor-pointer shadow-2xs"
            onClick={onBulkMarkSelectedAsSent}
            title="Mark checked components as already sent without generating a delivery voucher"
          >
            <CheckCheck size={14} />
            <span>Mark Selected as Sent (No Challan)</span>
          </button>
        </div>
      </div>

      {/* SECTION A: LAMINATION PANELS CHECKLIST */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 flex-wrap">
            <Layers size={16} className="text-emerald-600" />
            <span>Category 1: Lamination Panels</span>
            <span className="text-slate-500 font-bold">
              ({collapseAlreadySent ? visibleLaminationPending.length : visibleLaminationAll.length} sizes to add)
            </span>
            {collapseAlreadySent && visibleLaminationAlreadySent.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAlreadySentLamination((v) => !v)}
                className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Toggle list of already sent lamination panels"
              >
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>{visibleLaminationAlreadySent.length} already sent</span>
                {showAlreadySentLamination ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Unit 2 Pressed • Select pieces loading onto vehicle
            </span>
            <button
              type="button"
              onClick={() => onOpenAddCustomModal('LAMINATION')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Add custom lamination panel not in order"
            >
              <Plus size={12} />
              <span>+ Custom Lamination</span>
            </button>
          </div>
        </div>

        {collapseAlreadySent && visibleLaminationPending.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <CheckCheck size={20} />
            </div>
            <h5 className="font-bold text-slate-800 text-xs m-0">All Lamination Panels are already sent!</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              All {visibleLaminationAlreadySent.length} panel sizes for the selected product(s) have been 100% dispatched to Unit 1.
            </p>
            {!showAlreadySentLamination && (
              <button
                type="button"
                onClick={() => setShowAlreadySentLamination(true)}
                className="mt-2.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
              >
                <span>View {visibleLaminationAlreadySent.length} Already Sent Panels</span>
                <ChevronDown size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">Send</th>
                  {(selectedOrders.length > 1 || customItems.length > 0) && (
                    <th className="p-2.5 w-44">Product / Source</th>
                  )}
                  {pallets.length > 1 && (
                    <th className="p-2.5 w-20 text-center">Pallet</th>
                  )}
                  <th className="p-2.5">Part Name</th>
                  <th className="p-2.5 w-40">Dimensions (L × W × T)</th>
                  <th className="p-2.5 w-24">Order Total</th>
                  <th className="p-2.5 w-36">Already Sent</th>
                  <th className="p-2.5 w-28">Dispatch Now</th>
                  <th className="p-2.5">Remarks / Finish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(collapseAlreadySent ? visibleLaminationPending : visibleLaminationAll).map((it) => {
                  const isChecked = selectedItemIds.has(it.id);
                  const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);
                  const currentDispatchQty = dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty;

                  return (
                    <tr
                      key={it.id}
                      className={`transition cursor-pointer ${
                        isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                      }`}
                      onClick={() => onToggleItem(it.id)}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleItem(it.id)}
                          className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      {(selectedOrders.length > 1 || customItems.length > 0) && (
                        <td className="p-2.5">
                          {it.isCustomItem ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px] inline-flex items-center gap-1 max-w-[220px]">
                              <Sparkles size={11} className="text-purple-600 flex-shrink-0" />
                              <span className="truncate">{it.productCode || 'SAMPLE'} — Custom</span>
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] block truncate max-w-[220px]"
                              title={it.productCode ? `${it.productCode} — ${it.productName || it.orderTitle}` : (it.productName || it.orderTitle)}
                            >
                              {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                            </span>
                          )}
                        </td>
                      )}
                      {pallets.length > 1 && (
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {itemSplits[it.id] ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenSplitModal(it)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs cursor-pointer shadow-2xs"
                                title="Click to edit split quantities"
                              >
                                <Scissors size={11} className="text-amber-700" />
                                <span>P1:{itemSplits[it.id].p1} P2:{itemSplits[it.id].p2}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onMergeSplit(it.id, 1)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded text-[10px] cursor-pointer"
                                title="Clear split and move all to Pallet 1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <select
                                value={itemPalletMap[it.id] || 1}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'split') {
                                    onOpenSplitModal(it);
                                  } else {
                                    onMoveItemToPallet(it.id, parseInt(val, 10));
                                  }
                                }}
                                className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                                disabled={!isChecked}
                              >
                                {pallets.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    P{p.id}
                                  </option>
                                ))}
                                {isChecked && (dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty) >= 2 && (
                                  <option value="split">✂ Split...</option>
                                )}
                              </select>
                              {isChecked && (dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty) >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSplitModal(it)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                                  title="Divide pieces across Pallet 1 and Pallet 2"
                                >
                                  <Scissors size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{it.partName}</span>
                          {it.isCustomItem && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 text-[9.5px] font-extrabold tracking-wide uppercase">
                              Sample / Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">{it.dimensions}</td>
                      <td className="p-2.5 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        {it.isCustomItem ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10.5px] text-slate-400 italic">Custom</span>
                            <button
                              type="button"
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold transition cursor-pointer border border-rose-200 flex items-center gap-0.5 ml-1"
                              onClick={() => onDeleteCustomItem(it.id)}
                              title="Delete custom item"
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-600 text-xs">
                              {it.alreadyDispatchedQty > 0 ? (
                                <span className="font-bold text-amber-700">{it.alreadyDispatchedQty} sent</span>
                              ) : (
                                '0'
                              )}
                            </span>
                            <button
                              type="button"
                              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-bold text-slate-600 transition cursor-pointer border border-slate-200"
                              onClick={() => onSetItemToMarkSent(it)}
                              title="Mark pieces as already sent without challan"
                            >
                              + Mark Sent
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={1}
                          max={remaining || 999}
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none disabled:opacity-40"
                          value={currentDispatchQty}
                          onChange={(e) =>
                            onQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                          }
                          disabled={!isChecked}
                        />
                      </td>
                      <td className="p-2.5 text-slate-500">{it.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TOGGLE LIST: ALREADY SENT LAMINATION PANELS */}
        {collapseAlreadySent && visibleLaminationAlreadySent.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setShowAlreadySentLamination((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center transition-transform">
                  {showAlreadySentLamination ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Already Sent Lamination Panels
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    {visibleLaminationAlreadySent.length} sizes • {visibleLaminationAlreadySent.reduce((s, it) => s + it.alreadyDispatchedQty, 0)} panels dispatched
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                <span>{showAlreadySentLamination ? 'Hide already sent' : 'Show already sent'}</span>
                {showAlreadySentLamination ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            </button>

            {showAlreadySentLamination && (
              <div className="p-3 pt-0 overflow-x-auto animate-in fade-in duration-150">
                <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-12 text-center">Add Extra</th>
                      {(selectedOrders.length > 1 || customItems.length > 0) && (
                        <th className="p-2 w-44">Product / Source</th>
                      )}
                      {pallets.length > 1 && (
                        <th className="p-2 w-20 text-center">Pallet</th>
                      )}
                      <th className="p-2">Part Name</th>
                      <th className="p-2 w-40">Dimensions</th>
                      <th className="p-2 w-24">Order Total</th>
                      <th className="p-2 w-32">Already Sent</th>
                      <th className="p-2 w-28">Dispatch Now</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleLaminationAlreadySent.map((it) => {
                      const isChecked = selectedItemIds.has(it.id);
                      const currentDispatchQty = dispatchQtyOverrides[it.id] ?? (isChecked ? 1 : 0);
                      return (
                        <tr
                          key={it.id}
                          className={`transition cursor-pointer ${
                            isChecked ? 'bg-emerald-50/50' : 'bg-slate-50/30 hover:bg-slate-100/50'
                          }`}
                          onClick={() => onToggleItem(it.id)}
                        >
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleItem(it.id)}
                              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                              title="Check to dispatch extra pieces beyond order total"
                            />
                          </td>
                          {(selectedOrders.length > 1 || customItems.length > 0) && (
                            <td className="p-2">
                              <span
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] block truncate max-w-[220px]"
                                title={it.productCode ? `${it.productCode} — ${it.productName || it.orderTitle}` : (it.productName || it.orderTitle)}
                              >
                                {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                              </span>
                            </td>
                          )}
                          {pallets.length > 1 && (
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={itemPalletMap[it.id] || 1}
                                onChange={(e) => onMoveItemToPallet(it.id, parseInt(e.target.value, 10))}
                                className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                                disabled={!isChecked}
                              >
                                {pallets.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    P{p.id}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="p-2">
                            <span className="font-bold text-slate-700 line-through opacity-80 mr-1.5">{it.partName}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Sent
                            </span>
                          </td>
                          <td className="p-2 font-mono text-slate-600">{it.dimensions}</td>
                          <td className="p-2 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">
                            {it.alreadyDispatchedQty} sent (100%)
                          </td>
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            {isChecked ? (
                              <input
                                type="number"
                                min={1}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none"
                                value={currentDispatchQty || 1}
                                onChange={(e) =>
                                  onQtyChange(it.id, Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                              />
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">0 pcs</span>
                            )}
                          </td>
                          <td className="p-2 text-slate-500">
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCheck size={12} className="text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION B: FRAME COMPONENTS CHECKLIST */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 flex-wrap">
            <Truck size={16} className="text-amber-500" />
            <span>Category 2: Frame & Structural Components</span>
            <span className="text-slate-500 font-bold">
              ({collapseAlreadySent ? visibleFramesPending.length : visibleFramesAll.length} items to add)
            </span>
            {collapseAlreadySent && visibleFramesAlreadySent.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAlreadySentFrames((v) => !v)}
                className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Toggle list of already sent frame components"
              >
                <CheckCircle2 size={11} className="text-amber-600" />
                <span>{visibleFramesAlreadySent.length} already sent</span>
                {showAlreadySentFrames ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Solid wood framing, legs, aprons</span>
            <button
              type="button"
              onClick={() => onOpenAddCustomModal('FRAME')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Add custom frame component not in order"
            >
              <Plus size={12} />
              <span>+ Custom Frame</span>
            </button>
          </div>
        </div>

        {collapseAlreadySent && visibleFramesPending.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
              <CheckCheck size={20} />
            </div>
            <h5 className="font-bold text-slate-800 text-xs m-0">All Frame Components are already sent!</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              All {visibleFramesAlreadySent.length} frame component items for the selected product(s) have been 100% dispatched to Unit 1.
            </p>
            {!showAlreadySentFrames && (
              <button
                type="button"
                onClick={() => setShowAlreadySentFrames(true)}
                className="mt-2.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
              >
                <span>View {visibleFramesAlreadySent.length} Already Sent Frame Items</span>
                <ChevronDown size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">Send</th>
                  {(selectedOrders.length > 1 || customItems.length > 0) && (
                    <th className="p-2.5 w-44">Product / Source</th>
                  )}
                  {pallets.length > 1 && (
                    <th className="p-2.5 w-20 text-center">Pallet</th>
                  )}
                  <th className="p-2.5">Part Name</th>
                  <th className="p-2.5 w-40">Size (Inches)</th>
                  <th className="p-2.5 w-24">Order Total</th>
                  <th className="p-2.5 w-36">Already Sent</th>
                  <th className="p-2.5 w-28">Dispatch Now</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(collapseAlreadySent ? visibleFramesPending : visibleFramesAll).map((it) => {
                  const isChecked = selectedItemIds.has(it.id);
                  const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);
                  const currentDispatchQty = dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty;

                  return (
                    <tr
                      key={it.id}
                      className={`transition cursor-pointer ${
                        isChecked ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'
                      }`}
                      onClick={() => onToggleItem(it.id)}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleItem(it.id)}
                          className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      {(selectedOrders.length > 1 || customItems.length > 0) && (
                        <td className="p-2.5">
                          {it.isCustomItem ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px] inline-flex items-center gap-1 max-w-[220px]">
                              <Sparkles size={11} className="text-purple-600 flex-shrink-0" />
                              <span className="truncate">{it.productCode || 'SAMPLE'} — Custom</span>
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] block truncate max-w-[220px]"
                              title={it.productCode ? `${it.productCode} — ${it.productName || it.orderTitle}` : (it.productName || it.orderTitle)}
                            >
                              {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                            </span>
                          )}
                        </td>
                      )}
                      {pallets.length > 1 && (
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {itemSplits[it.id] ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenSplitModal(it)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs cursor-pointer shadow-2xs"
                                title="Click to edit split quantities"
                              >
                                <Scissors size={11} className="text-amber-700" />
                                <span>P1:{itemSplits[it.id].p1} P2:{itemSplits[it.id].p2}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onMergeSplit(it.id, 1)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded text-[10px] cursor-pointer"
                                title="Clear split and move all to Pallet 1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <select
                                value={itemPalletMap[it.id] || 1}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'split') {
                                    onOpenSplitModal(it);
                                  } else {
                                    onMoveItemToPallet(it.id, parseInt(val, 10));
                                  }
                                }}
                                className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                                disabled={!isChecked}
                              >
                                {pallets.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    P{p.id}
                                  </option>
                                ))}
                                {isChecked && (dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty) >= 2 && (
                                  <option value="split">✂ Split...</option>
                                )}
                              </select>
                              {isChecked && (dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty) >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSplitModal(it)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                                  title="Divide pieces across Pallet 1 and Pallet 2"
                                >
                                  <Scissors size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{it.partName}</span>
                          {it.isCustomItem && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 text-[9.5px] font-extrabold tracking-wide uppercase">
                              Sample / Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">{it.dimensions}</td>
                      <td className="p-2.5 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        {it.isCustomItem ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10.5px] text-slate-400 italic">Custom</span>
                            <button
                              type="button"
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold transition cursor-pointer border border-rose-200 flex items-center gap-0.5 ml-1"
                              onClick={() => onDeleteCustomItem(it.id)}
                              title="Delete custom item"
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-600 text-xs">
                              {it.alreadyDispatchedQty > 0 ? (
                                <span className="font-bold text-amber-700">{it.alreadyDispatchedQty} sent</span>
                              ) : (
                                '0'
                              )}
                            </span>
                            <button
                              type="button"
                              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-bold text-slate-600 transition cursor-pointer border border-slate-200"
                              onClick={() => onSetItemToMarkSent(it)}
                              title="Mark pieces as already sent without challan"
                            >
                              + Mark Sent
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={1}
                          max={remaining || 999}
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none disabled:opacity-40"
                          value={currentDispatchQty}
                          onChange={(e) =>
                            onQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                          }
                          disabled={!isChecked}
                        />
                      </td>
                      <td className="p-2.5 text-slate-500">{it.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TOGGLE LIST: ALREADY SENT FRAME COMPONENTS */}
        {collapseAlreadySent && visibleFramesAlreadySent.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setShowAlreadySentFrames((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center transition-transform">
                  {showAlreadySentFrames ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Already Sent Frame Components
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                    {visibleFramesAlreadySent.length} items • {visibleFramesAlreadySent.reduce((s, it) => s + it.alreadyDispatchedQty, 0)} pieces dispatched
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                <span>{showAlreadySentFrames ? 'Hide already sent' : 'Show already sent'}</span>
                {showAlreadySentFrames ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            </button>

            {showAlreadySentFrames && (
              <div className="p-3 pt-0 overflow-x-auto animate-in fade-in duration-150">
                <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-12 text-center">Add Extra</th>
                      {(selectedOrders.length > 1 || customItems.length > 0) && (
                        <th className="p-2 w-44">Product / Source</th>
                      )}
                      {pallets.length > 1 && (
                        <th className="p-2 w-20 text-center">Pallet</th>
                      )}
                      <th className="p-2">Part Name</th>
                      <th className="p-2 w-40">Size (Inches)</th>
                      <th className="p-2 w-24">Order Total</th>
                      <th className="p-2 w-32">Already Sent</th>
                      <th className="p-2 w-28">Dispatch Now</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleFramesAlreadySent.map((it) => {
                      const isChecked = selectedItemIds.has(it.id);
                      const currentDispatchQty = dispatchQtyOverrides[it.id] ?? (isChecked ? 1 : 0);
                      return (
                        <tr
                          key={it.id}
                          className={`transition cursor-pointer ${
                            isChecked ? 'bg-amber-50/50' : 'bg-slate-50/30 hover:bg-slate-100/50'
                          }`}
                          onClick={() => onToggleItem(it.id)}
                        >
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleItem(it.id)}
                              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                              title="Check to dispatch extra pieces beyond order total"
                            />
                          </td>
                          {(selectedOrders.length > 1 || customItems.length > 0) && (
                            <td className="p-2">
                              <span
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] block truncate max-w-[220px]"
                                title={it.productCode ? `${it.productCode} — ${it.productName || it.orderTitle}` : (it.productName || it.orderTitle)}
                              >
                                {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                              </span>
                            </td>
                          )}
                          {pallets.length > 1 && (
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={itemPalletMap[it.id] || 1}
                                onChange={(e) => onMoveItemToPallet(it.id, parseInt(e.target.value, 10))}
                                className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                                disabled={!isChecked}
                              >
                                {pallets.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    P{p.id}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="p-2">
                            <span className="font-bold text-slate-700 line-through opacity-80 mr-1.5">{it.partName}</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Sent
                            </span>
                          </td>
                          <td className="p-2 font-mono text-slate-600">{it.dimensions}</td>
                          <td className="p-2 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                          <td className="p-2 font-mono font-bold text-amber-700">
                            {it.alreadyDispatchedQty} sent (100%)
                          </td>
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            {isChecked ? (
                              <input
                                type="number"
                                min={1}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none"
                                value={currentDispatchQty || 1}
                                onChange={(e) =>
                                  onQtyChange(it.id, Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                              />
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">0 pcs</span>
                            )}
                          </td>
                          <td className="p-2 text-slate-500">
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <CheckCheck size={12} className="text-amber-600" />
                              <span>Completed</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
