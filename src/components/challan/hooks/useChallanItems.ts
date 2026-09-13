import { useMemo } from 'react';
import type { FactoryOrder, ChallanComponentItem } from '../../../types/challan';
import { buildMultiOrderChallanItems } from '../../../services/challan_db';

export interface UseChallanItemsParams {
  selectedOrders: FactoryOrder[];
  customItems: ChallanComponentItem[];
  selectedItemIds: Set<string>;
  dispatchQtyOverrides: Record<string, number>;
  itemPalletMap: Record<string, number>;
  itemSplits: Record<string, { p1: number; p2: number }>;
  palletsCount: number;
  activeOrderFilter: string;
  refreshVersion?: number;
}

export function useChallanItems({
  selectedOrders,
  customItems,
  selectedItemIds,
  dispatchQtyOverrides,
  itemPalletMap,
  itemSplits,
  palletsCount,
  activeOrderFilter,
  refreshVersion = 0
}: UseChallanItemsParams) {
  // Items state across all selected orders
  const orderChecklistItems = useMemo(() => {
    if (refreshVersion < 0) return [];
    if (selectedOrders.length === 0) return [];
    return buildMultiOrderChallanItems(selectedOrders);
  }, [selectedOrders, refreshVersion]);

  // Combined checklist: order components + manually added custom / sample items
  const checklistItems = useMemo(() => {
    return [...orderChecklistItems, ...customItems];
  }, [orderChecklistItems, customItems]);

  // Final Dispatched Items List
  // Includes items assigned to pallets, taking into account split items (which duplicate as P1 and P2 items)
  const dispatchedItems = useMemo(() => {
    const list: ChallanComponentItem[] = [];

    checklistItems
      .filter((it) => selectedItemIds.has(it.id))
      .forEach((it) => {
        const customQty = dispatchQtyOverrides[it.id];
        const dispatchQty = customQty !== undefined ? customQty : it.dispatchingNowQty;
        if (dispatchQty <= 0) return;

        // Check if item is split across Pallet 1 and Pallet 2
        const split = itemSplits[it.id];
        if (split && palletsCount > 1 && split.p1 > 0 && split.p2 > 0) {
          let p1 = split.p1;
          let p2 = split.p2;
          if (p1 + p2 !== dispatchQty) {
            p1 = Math.max(1, Math.min(dispatchQty - 1, p1));
            p2 = dispatchQty - p1;
          }

          // Pallet 1 portion
          list.push({
            ...it,
            id: `${it.id}-p1`,
            baseItemId: it.id,
            isSplitPart: true,
            palletNumber: 1,
            dispatchingNowQty: p1,
            splitDetails: {
              p1,
              p2,
              total: dispatchQty,
              originalTotalQty: dispatchQty
            }
          });
          // Pallet 2 portion
          list.push({
            ...it,
            id: `${it.id}-p2`,
            baseItemId: it.id,
            isSplitPart: true,
            palletNumber: 2,
            dispatchingNowQty: p2,
            splitDetails: {
              p1,
              p2,
              total: dispatchQty,
              originalTotalQty: dispatchQty
            }
          });
        } else {
          // Standard un-split item (assigned to pallet 1 by default, or mapped pallet)
          const targetPallet = itemPalletMap[it.id] || it.palletNumber || 1;
          list.push({
            ...it,
            baseItemId: it.id,
            palletNumber: targetPallet,
            dispatchingNowQty: dispatchQty
          });
        }
      });

    return list;
  }, [checklistItems, selectedItemIds, dispatchQtyOverrides, itemPalletMap, itemSplits, palletsCount]);

  const laminationDispatched = useMemo(
    () => dispatchedItems.filter((it) => it.category === 'LAMINATION'),
    [dispatchedItems]
  );
  const framesDispatched = useMemo(
    () => dispatchedItems.filter((it) => it.category === 'FRAME'),
    [dispatchedItems]
  );

  // Filtered items shown in checklist based on activeOrderFilter tab
  const visibleChecklistItems = useMemo(() => {
    if (activeOrderFilter === 'ALL') return checklistItems;
    if (activeOrderFilter === 'CUSTOM') return checklistItems.filter((it) => it.isCustomItem);
    return checklistItems.filter((it) => it.orderId === activeOrderFilter);
  }, [checklistItems, activeOrderFilter]);

  // Segregate visible items into Pending (to add) and Already Sent (completed)
  const visibleLaminationAll = visibleChecklistItems.filter((it) => it.category === 'LAMINATION');
  const visibleLaminationPending = visibleLaminationAll.filter(
    (it) => it.isCustomItem || it.totalOrderQty - it.alreadyDispatchedQty > 0
  );
  const visibleLaminationAlreadySent = visibleLaminationAll.filter(
    (it) => !it.isCustomItem && it.alreadyDispatchedQty >= it.totalOrderQty
  );

  const visibleFramesAll = visibleChecklistItems.filter((it) => it.category === 'FRAME');
  const visibleFramesPending = visibleFramesAll.filter(
    (it) => it.isCustomItem || it.totalOrderQty - it.alreadyDispatchedQty > 0
  );
  const visibleFramesAlreadySent = visibleFramesAll.filter(
    (it) => !it.isCustomItem && it.alreadyDispatchedQty >= it.totalOrderQty
  );

  const totalAlreadySentCount = visibleLaminationAlreadySent.length + visibleFramesAlreadySent.length;

  return {
    orderChecklistItems,
    checklistItems,
    dispatchedItems,
    laminationDispatched,
    framesDispatched,
    visibleChecklistItems,
    visibleLaminationAll,
    visibleLaminationPending,
    visibleLaminationAlreadySent,
    visibleFramesAll,
    visibleFramesPending,
    visibleFramesAlreadySent,
    totalAlreadySentCount
  };
}
