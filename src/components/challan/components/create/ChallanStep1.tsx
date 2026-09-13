import React from 'react';
import type { FactoryOrder, ChallanComponentItem, PalletConfig, ComponentCategory } from '../../../../types/challan';
import { OrderSelector } from './OrderSelector';
import { ComponentChecklist } from './ComponentChecklist';
import { PalletManager } from './PalletManager';
import { Truck, Package, ArrowRight, Sparkles } from 'lucide-react';

export interface ChallanStep1Props {
  dispatchDate: string;
  onDispatchDateChange: (val: string) => void;
  vehicleNumber: string;
  onVehicleNumberChange: (val: string) => void;
  driverName: string;
  onDriverNameChange: (val: string) => void;
  remarks: string;
  onRemarksChange: (val: string) => void;
  orders: FactoryOrder[];
  selectedOrderIds: string[];
  selectedOrders: FactoryOrder[];
  customItems: ChallanComponentItem[];
  checklistItems: ChallanComponentItem[];
  activeOrderFilter: string;
  onSelectOrderFilter: (filter: string) => void;
  onAddOrder: (orderId: string) => void;
  onRemoveOrder: (orderId: string) => void;
  onOpenAddCustomModal: (category?: ComponentCategory) => void;
  getOrderDisplayName: (order: FactoryOrder) => string;
  selectedItemIds: Set<string>;
  onToggleItem: (id: string) => void;
  dispatchQtyOverrides: Record<string, number>;
  onQtyChange: (id: string, qty: number) => void;
  pallets: PalletConfig[];
  itemPalletMap: Record<string, number>;
  itemSplits: Record<string, { p1: number; p2: number }>;
  onMoveItemToPallet: (id: string, palletId: number) => void;
  onOpenSplitModal: (item: ChallanComponentItem) => void;
  onOpenSplitModalForBase: (baseItemId?: string) => void;
  onMergeSplit: (id: string, targetPalletId: number) => void;
  onDeleteCustomItem: (id: string) => void;
  onSetItemToMarkSent: (item: ChallanComponentItem) => void;
  onBulkMarkSelectedAsSent: () => void;
  onSelectAllLamination: () => void;
  onSelectAllFrames: () => void;
  onDeselectAll: () => void;
  dispatchedItems: ChallanComponentItem[];
  laminationDispatched: ChallanComponentItem[];
  framesDispatched: ChallanComponentItem[];
  visibleLaminationAll: ChallanComponentItem[];
  visibleLaminationPending: ChallanComponentItem[];
  visibleLaminationAlreadySent: ChallanComponentItem[];
  visibleFramesAll: ChallanComponentItem[];
  visibleFramesPending: ChallanComponentItem[];
  visibleFramesAlreadySent: ChallanComponentItem[];
  totalAlreadySentCount: number;
  selectedForPalletMove: Set<string>;
  isDraggingOverPallet: number | null;
  onAddPallet: () => void;
  onRemovePallet: (palletId: number) => void;
  onMoveSelectedToPallet: (targetPalletId: number) => void;
  onToggleSelectForPalletMove: (itemId: string) => void;
  onClearSelectedForPalletMove: () => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent, palletId: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetPalletId: number) => void;
  onProceedToStep2: () => void;
}

export const ChallanStep1: React.FC<ChallanStep1Props> = ({
  dispatchDate,
  onDispatchDateChange,
  vehicleNumber,
  onVehicleNumberChange,
  driverName,
  onDriverNameChange,
  remarks,
  onRemarksChange,
  orders,
  selectedOrderIds,
  selectedOrders,
  customItems,
  checklistItems,
  activeOrderFilter,
  onSelectOrderFilter,
  onAddOrder,
  onRemoveOrder,
  onOpenAddCustomModal,
  getOrderDisplayName,
  selectedItemIds,
  onToggleItem,
  dispatchQtyOverrides,
  onQtyChange,
  pallets,
  itemPalletMap,
  itemSplits,
  onMoveItemToPallet,
  onOpenSplitModal,
  onOpenSplitModalForBase,
  onMergeSplit,
  onDeleteCustomItem,
  onSetItemToMarkSent,
  onBulkMarkSelectedAsSent,
  onSelectAllLamination,
  onSelectAllFrames,
  onDeselectAll,
  dispatchedItems,
  laminationDispatched,
  framesDispatched,
  visibleLaminationAll,
  visibleLaminationPending,
  visibleLaminationAlreadySent,
  visibleFramesAll,
  visibleFramesPending,
  visibleFramesAlreadySent,
  totalAlreadySentCount,
  selectedForPalletMove,
  isDraggingOverPallet,
  onAddPallet,
  onRemovePallet,
  onMoveSelectedToPallet,
  onToggleSelectForPalletMove,
  onClearSelectedForPalletMove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onProceedToStep2
}) => {
  return (
    <div className="space-y-6">
      {/* 1. LOGISTICS & TRANSPORT DETAILS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Truck size={16} className="text-slate-800" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 m-0">
            1. Transport & Vehicle Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Date:</label>
            <input
              type="date"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={dispatchDate}
              onChange={(e) => onDispatchDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle / Tempo #:</label>
            <input
              type="text"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={vehicleNumber}
              onChange={(e) => onVehicleNumberChange(e.target.value)}
              placeholder="e.g. RJ19GK7638"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name:</label>
            <input
              type="text"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={driverName}
              onChange={(e) => onDriverNameChange(e.target.value)}
              placeholder="e.g. Ram Jangid"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Remark (Optional):</label>
          <input
            type="text"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="e.g. Urgent delivery for Unit 1 desk assembly..."
          />
        </div>
      </div>

      {/* 2. PRODUCT SELECTION & BADGES */}
      <OrderSelector
        orders={orders}
        selectedOrderIds={selectedOrderIds}
        selectedOrders={selectedOrders}
        customItems={customItems}
        checklistItemsCount={checklistItems.length}
        activeOrderFilter={activeOrderFilter}
        onSelectOrderFilter={onSelectOrderFilter}
        onAddOrder={onAddOrder}
        onRemoveOrder={onRemoveOrder}
        onOpenAddCustomModal={() => onOpenAddCustomModal('LAMINATION')}
        getOrderDisplayName={getOrderDisplayName}
      />

      {/* EMPTY STATE IF NO PRODUCT IS SELECTED YET */}
      {selectedOrders.length === 0 && customItems.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 m-0">No Product or Custom Sample Selected Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Confirm your transport & vehicle details above, then select a product from the dropdown or add custom sample sizes.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAddCustomModal('LAMINATION')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles size={14} />
              <span>+ Add Custom / Sample Size</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CHECKLISTS (Category 1 & Category 2) */}
          <ComponentChecklist
            selectedOrders={selectedOrders}
            customItems={customItems}
            selectedItemIds={selectedItemIds}
            onToggleItem={onToggleItem}
            dispatchQtyOverrides={dispatchQtyOverrides}
            onQtyChange={onQtyChange}
            pallets={pallets}
            itemPalletMap={itemPalletMap}
            itemSplits={itemSplits}
            onMoveItemToPallet={onMoveItemToPallet}
            onOpenSplitModal={onOpenSplitModal}
            onMergeSplit={onMergeSplit}
            onOpenAddCustomModal={onOpenAddCustomModal}
            onDeleteCustomItem={onDeleteCustomItem}
            onSetItemToMarkSent={onSetItemToMarkSent}
            onBulkMarkSelectedAsSent={onBulkMarkSelectedAsSent}
            onSelectAllLamination={onSelectAllLamination}
            onSelectAllFrames={onSelectAllFrames}
            onDeselectAll={onDeselectAll}
            laminationDispatched={laminationDispatched}
            framesDispatched={framesDispatched}
            visibleLaminationAll={visibleLaminationAll}
            visibleLaminationPending={visibleLaminationPending}
            visibleLaminationAlreadySent={visibleLaminationAlreadySent}
            visibleFramesAll={visibleFramesAll}
            visibleFramesPending={visibleFramesPending}
            visibleFramesAlreadySent={visibleFramesAlreadySent}
            totalAlreadySentCount={totalAlreadySentCount}
          />

          {/* SECTION 3: PALLET PACKING MANAGEMENT & DISTRIBUTION */}
          <PalletManager
            pallets={pallets}
            dispatchedItems={dispatchedItems}
            checklistItems={checklistItems}
            selectedForPalletMove={selectedForPalletMove}
            isDraggingOverPallet={isDraggingOverPallet}
            onAddPallet={onAddPallet}
            onRemovePallet={onRemovePallet}
            onMoveItemToPallet={onMoveItemToPallet}
            onMoveSelectedToPallet={onMoveSelectedToPallet}
            onToggleSelectForPalletMove={onToggleSelectForPalletMove}
            onClearSelectedForPalletMove={onClearSelectedForPalletMove}
            onOpenSplitModal={onOpenSplitModal}
            onOpenSplitModalForBase={onOpenSplitModalForBase}
            onMergeSplit={onMergeSplit}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        </>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-wrap">
        <div className="text-xs text-slate-600">
          {selectedOrders.length > 0 ? (
            <>
              Total Items to Dispatch:{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {dispatchedItems.reduce((s, it) => s + it.dispatchingNowQty, 0)} pieces
              </strong>{' '}
              across {dispatchedItems.length} sizes from {selectedOrders.length} product(s)
            </>
          ) : (
            <span>Please select a product above to view components.</span>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          disabled={dispatchedItems.length === 0}
          onClick={onProceedToStep2}
        >
          <span>Proceed to Review & Print Format</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
