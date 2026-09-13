import { useState } from 'react';
import type { PalletConfig, ChallanComponentItem } from '../../../types/challan';

export function usePalletManagement(checklistItems: ChallanComponentItem[] = []) {
  // Pallets configuration (Pallet 1 by default)
  const [pallets, setPallets] = useState<PalletConfig[]>([{ id: 1, name: 'Pallet 1' }]);
  // Mapping of component itemId -> palletId
  const [itemPalletMap, setItemPalletMap] = useState<Record<string, number>>({});
  // Mapping of component itemId -> split quantities in Pallet 1 and Pallet 2
  const [itemSplits, setItemSplits] = useState<Record<string, { p1: number; p2: number }>>({});
  // Item currently open in the Split Modal
  const [itemToSplit, setItemToSplit] = useState<ChallanComponentItem | null>(null);
  // Selected components for bulk moving between pallets
  const [selectedForPalletMove, setSelectedForPalletMove] = useState<Set<string>>(new Set());
  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isDraggingOverPallet, setIsDraggingOverPallet] = useState<number | null>(null);
  // Review Print layout mode: 'split-pallets' (default if pallets >= 2) or 'full-master'
  const [printLayoutMode, setPrintLayoutMode] = useState<'split-pallets' | 'full-master'>('split-pallets');

  const handleAddPallet = () => {
    const nextId = pallets.length + 1;
    setPallets((prev) => [...prev, { id: nextId, name: `Pallet ${nextId}` }]);
  };

  const handleRemovePallet = (palletId: number) => {
    if (pallets.length <= 1) return;
    // Any items in this pallet move back to Pallet 1
    setItemPalletMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (updated[key] === palletId) {
          updated[key] = 1;
        }
      });
      return updated;
    });
    // Remove all splits so items collapse back cleanly
    setItemSplits({});
    setPallets((prev) => prev.filter((p) => p.id !== palletId));
  };

  // Open split modal for a component
  const handleOpenSplitModal = (item: ChallanComponentItem) => {
    setItemToSplit(item);
  };

  // Open split modal for a base item from a split board card
  const handleOpenSplitModalForBase = (baseItemId?: string) => {
    if (!baseItemId) return;
    const item = checklistItems.find((it) => it.id === baseItemId);
    if (item) {
      setItemToSplit(item);
    }
  };

  const handleCloseSplitModal = () => {
    setItemToSplit(null);
  };

  // Save split allocation
  const handleApplySplit = (itemId: string, p1: number, p2: number) => {
    if (p1 <= 0 && p2 > 0) {
      handleMergeSplit(itemId, 2);
    } else if (p2 <= 0 && p1 > 0) {
      handleMergeSplit(itemId, 1);
    } else {
      setItemSplits((prev) => ({
        ...prev,
        [itemId]: { p1, p2 }
      }));
    }
    setItemToSplit(null);
  };

  // Merge split back into a single pallet
  const handleMergeSplit = (itemId: string, targetPalletId: number) => {
    setItemSplits((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setItemPalletMap((prev) => ({
      ...prev,
      [itemId]: targetPalletId
    }));
    setItemToSplit(null);
  };

  // Move single item to target pallet
  const handleMoveItemToPallet = (itemId: string, targetPalletId: number) => {
    setItemPalletMap((prev) => ({
      ...prev,
      [itemId]: targetPalletId
    }));
  };

  // Move multiple selected items to target pallet
  const handleMoveSelectedToPallet = (targetPalletId: number) => {
    if (selectedForPalletMove.size === 0) return;
    setItemPalletMap((prev) => {
      const next = { ...prev };
      selectedForPalletMove.forEach((id) => {
        next[id] = targetPalletId;
      });
      return next;
    });
    setSelectedForPalletMove(new Set());
  };

  // Toggle selection for pallet move
  const handleToggleSelectForPalletMove = (itemId: string) => {
    setSelectedForPalletMove((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleClearSelectedForPalletMove = () => {
    setSelectedForPalletMove(new Set());
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, palletId: number) => {
    e.preventDefault();
    setIsDraggingOverPallet(palletId);
  };

  const handleDragLeave = () => {
    setIsDraggingOverPallet(null);
  };

  const handleDrop = (e: React.DragEvent, targetPalletId: number) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (itemId) {
      handleMoveItemToPallet(itemId, targetPalletId);
    }
    setDraggedItemId(null);
    setIsDraggingOverPallet(null);
  };

  return {
    pallets,
    setPallets,
    itemPalletMap,
    setItemPalletMap,
    itemSplits,
    setItemSplits,
    itemToSplit,
    setItemToSplit,
    selectedForPalletMove,
    setSelectedForPalletMove,
    draggedItemId,
    isDraggingOverPallet,
    printLayoutMode,
    setPrintLayoutMode,
    handleAddPallet,
    handleRemovePallet,
    handleOpenSplitModal,
    handleOpenSplitModalForBase,
    handleCloseSplitModal,
    handleApplySplit,
    handleMergeSplit,
    handleMoveItemToPallet,
    handleMoveSelectedToPallet,
    handleToggleSelectForPalletMove,
    handleClearSelectedForPalletMove,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
