import type {
  LaminatedPanel,
  BulkOrderItem,
  BulkMatchItemResult,
  BulkOrderMatchSummary,
  BulkCandidateCut
} from '../types/panel';
import { calculateCutYield } from './matcher';
import * as XLSX from 'xlsx';
import { saveBlobAs } from '../utils/excelParser';

export interface BulkMatchOptions {
  allowRotation?: boolean;
  kerfAllowance?: number;
  matchWoodType?: boolean;
  maxOffcutLimit?: number; // e.g. 50 (limits crazy high offcuts like 80%)
  thicknessTolerance?: number; // default 0.065" (matches 0.625" and 0.675")
}

/**
 * Finds all potential matching stock panels in Firestore for each order item,
 * and arranges them in ascending order of offcut percentage (lowest waste first).
 */
export function matchBulkOrderWithInventory(
  orderTitle: string,
  items: BulkOrderItem[],
  inventory: LaminatedPanel[],
  options: BulkMatchOptions = {}
): BulkOrderMatchSummary {
  const {
    allowRotation = true,
    kerfAllowance = 0.125,
    matchWoodType = false,
    maxOffcutLimit = 50,
    thicknessTolerance = 0.065
  } = options;

  const results: BulkMatchItemResult[] = [];
  let totalPiecesNeeded = 0;
  let itemsWithStockCount = 0;
  let itemsWithoutStockCount = 0;

  for (const item of items) {
    totalPiecesNeeded += item.quantityNeeded;

    const candidates: BulkCandidateCut[] = [];

    for (const panel of inventory) {
      if (panel.quantity <= 0) continue;

      // Thickness check (supports nominal 5 soot / 0.625" vs 0.675")
      const thkMatch = Math.abs(panel.thickness - item.thickness) <= thicknessTolerance;
      if (!thkMatch) continue;

      // Wood type check if enforced
      if (matchWoodType && item.woodType && panel.woodType) {
        if (item.woodType.toLowerCase() !== panel.woodType.toLowerCase()) continue;
      }

      const cutLayout = calculateCutYield(
        panel.length,
        panel.width,
        item.length,
        item.width,
        kerfAllowance,
        allowRotation
      );

      if (!cutLayout.fits || cutLayout.piecesPerSheet <= 0) continue;

      // Check if exact size (0% offcut)
      const isExactStandard =
        Math.abs(panel.length - item.length) <= 0.5 && Math.abs(panel.width - item.width) <= 0.5;
      const isExactRotated =
        allowRotation &&
        Math.abs(panel.length - item.width) <= 0.5 && Math.abs(panel.width - item.length) <= 0.5;
      const isExact = isExactStandard || isExactRotated;

      const wastePct = isExact ? 0 : cutLayout.wastePercentage;

      // Only include candidates within reasonable offcut limit
      if (wastePct <= maxOffcutLimit) {
        const yieldPerPanel = cutLayout.piecesPerSheet;
        const panelsNeeded = Math.ceil(item.quantityNeeded / yieldPerPanel);
        const remainingStock = Math.max(0, panel.quantity - panelsNeeded);

        candidates.push({
          panel,
          yieldPerPanel,
          wastePercentage: wastePct,
          cutLayout,
          isExactMatch: isExact,
          panelsNeededForOrder: panelsNeeded,
          availableInStock: panel.quantity,
          remainingStockAfter: remainingStock
        });
      }
    }

    // Sort candidates in ascending order of offcut % (0%, 2%, 5%, 15%, etc.)
    candidates.sort((a, b) => {
      if (a.wastePercentage !== b.wastePercentage) {
        return a.wastePercentage - b.wastePercentage;
      }
      return b.yieldPerPanel - a.yieldPerPanel;
    });

    const hasMatches = candidates.length > 0;
    if (hasMatches) {
      itemsWithStockCount++;
    } else {
      itemsWithoutStockCount++;
    }

    results.push({
      orderItem: item,
      candidates,
      hasMatches
    });
  }

  return {
    orderTitle: orderTitle || 'Bulk Panel Order',
    totalOrderItemsCount: items.length,
    itemsWithStockCount,
    itemsWithoutStockCount,
    totalPiecesNeeded,
    results
  };
}

/**
 * Exports the user's selected cut optimization plan to Excel
 */
export function exportProductionPlanToExcel(
  summary: BulkOrderMatchSummary,
  selectedCandidateMap: Record<string, number>
): void {
  const headers = [
    'Order Item / Part Name',
    'Required Size (L × W × T)',
    'Order Qty',
    'Selected Wood Panel',
    'Wood Species',
    'Offcut (Waste) %',
    'Yield / Panel',
    'Panels Needed from Stock',
    'Panels Available in Stock',
    'Surplus Panels Left',
    'Remnant Size',
    'Panel Notes / Texture'
  ];

  const rows = summary.results
    .filter((r) => r.hasMatches)
    .map((r) => {
      const sizeStr = `${r.orderItem.length}″ × ${r.orderItem.width}″ × ${r.orderItem.thickness}″`;
      const selectedIndex = selectedCandidateMap[r.orderItem.id] ?? 0;
      const candidate = r.candidates[selectedIndex] || r.candidates[0];

      if (!candidate) return [];

      const stockSizeStr = `${candidate.panel.length}″ × ${candidate.panel.width}″ × ${candidate.panel.thickness}″`;
      const remnantStr =
        candidate.cutLayout.remnantLength && candidate.cutLayout.remnantLength > 2
          ? `~${candidate.cutLayout.remnantLength}″ × ${candidate.cutLayout.remnantWidth || candidate.panel.width}″`
          : 'Minimal';

      return [
        r.orderItem.partName,
        sizeStr,
        r.orderItem.quantityNeeded,
        stockSizeStr,
        candidate.panel.woodType || 'Mango Wood',
        `${candidate.wastePercentage}%`,
        candidate.yieldPerPanel,
        candidate.panelsNeededForOrder,
        candidate.availableInStock,
        candidate.remainingStockAfter,
        remnantStr,
        candidate.panel.notes || 'Natural grain'
      ];
    })
    .filter((r) => r.length > 0);

  const summaryBlock = [
    ['LamiStock - Selected Wood Panel & Cut Optimization Plan'],
    [`Order Title: ${summary.orderTitle}`],
    [`Generated Date: ${new Date().toLocaleString()}`],
    [],
    ['Production Summary:'],
    [`Total Order Sizes: ${summary.totalOrderItemsCount}`],
    [`Matched Wood Sizes in Stock: ${summary.itemsWithStockCount}`],
    [`Unmatched Sizes (No Stock in Cloud): ${summary.itemsWithoutStockCount}`],
    []
  ];

  const allRows = [...summaryBlock, headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cut_Optimization_Plan');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveBlobAs(blob, `${summary.orderTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Cut_Plan.xlsx`);
}
