import type { LaminatedPanel, OrderRequirement, MatchResult, CutLayout, MatchType } from '../types/panel';

export function calculateCutYield(
  stockL: number,
  stockW: number,
  reqL: number,
  reqW: number,
  kerf: number = 0.125, // 1/8 inch saw blade kerf
  allowRotation: boolean = true
): CutLayout {
  // Woodworking nominal tolerance (0.25" allowance for nominal factory panel cuts)
  const tol = 0.25;

  // 1. Standard Orientation (length to length, width to width)
  const cutsX_std = Math.max(0, Math.floor((stockL + kerf + tol) / (reqL + kerf)));
  const cutsY_std = Math.max(0, Math.floor((stockW + kerf + tol) / (reqW + kerf)));
  const yield_std = cutsX_std * cutsY_std;

  // 2. Rotated 90 Orientation (length to width, width to length)
  let cutsX_rot = 0;
  let cutsY_rot = 0;
  let yield_rot = 0;

  if (allowRotation) {
    cutsX_rot = Math.max(0, Math.floor((stockL + kerf + tol) / (reqW + kerf)));
    cutsY_rot = Math.max(0, Math.floor((stockW + kerf + tol) / (reqL + kerf)));
    yield_rot = cutsX_rot * cutsY_rot;
  }

  // Choose the best orientation
  const useRotated = yield_rot > yield_std && yield_rot > 0;
  const bestYield = useRotated ? yield_rot : yield_std;
  const cutsX = useRotated ? cutsX_rot : cutsX_std;
  const cutsY = useRotated ? cutsY_rot : cutsY_std;
  const cutPieceL = useRotated ? reqW : reqL;
  const cutPieceW = useRotated ? reqL : reqW;

  const totalStockArea = stockL * stockW;
  const usedPieceArea = reqL * reqW * bestYield;
  const wastePercentage = totalStockArea > 0
    ? Math.max(0, Math.min(100, Math.round(((totalStockArea - usedPieceArea) / totalStockArea) * 100)))
    : 100;

  // Remnant calculation if 1 or more pieces cut
  let remnantLength: number | undefined;
  let remnantWidth: number | undefined;

  if (bestYield > 0) {
    const usedLength = Math.min(stockL, cutsX * cutPieceL + Math.max(0, cutsX - 1) * kerf);
    const usedWidth = Math.min(stockW, cutsY * cutPieceW + Math.max(0, cutsY - 1) * kerf);
    remnantLength = Math.max(0, Number((stockL - usedLength).toFixed(2)));
    remnantWidth = Math.max(0, Number((stockW - usedWidth).toFixed(2)));
  }

  return {
    fits: bestYield > 0,
    rotated: useRotated,
    piecesPerSheet: bestYield,
    cutsAlongLength: cutsX,
    cutsAlongWidth: cutsY,
    cutPieceLength: reqL,
    cutPieceWidth: reqW,
    stockLength: stockL,
    stockWidth: stockW,
    usedAreaSqInches: usedPieceArea,
    totalStockAreaSqInches: totalStockArea,
    wastePercentage,
    remnantLength,
    remnantWidth
  };
}

export function matchOrderWithInventory(
  order: OrderRequirement,
  inventory: LaminatedPanel[]
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const panel of inventory) {
    if (panel.quantity <= 0) {
      continue;
    }

    // 1. Thickness Check in inches (e.g. 0.75" vs 0.75" or within 0.05" tolerance)
    const thicknessMatch = Math.abs(panel.thickness - order.thickness) <= 0.05;
    if (!thicknessMatch) {
      continue;
    }

    // 2. Cut Yield & Dimensions in Inches
    const cutLayout = calculateCutYield(
      panel.length,
      panel.width,
      order.length,
      order.width,
      order.kerfAllowance ?? 0.125,
      order.allowRotation
    );

    if (!cutLayout.fits || cutLayout.piecesPerSheet <= 0) {
      continue;
    }

    const matchReasons: string[] = [];
    let score = 70;

    // Exact dimension check in inches
    const isExactDimensions =
      (Math.abs(panel.length - order.length) <= 0.5 && Math.abs(panel.width - order.width) <= 0.5) ||
      (order.allowRotation && Math.abs(panel.length - order.width) <= 0.5 && Math.abs(panel.width - order.length) <= 0.5);

    let matchType: MatchType = 'OVERSIZED_CUT';
    if (isExactDimensions) {
      matchType = 'EXACT';
      score = 100;
      matchReasons.push('Exact size match (zero waste cutting)');
    } else if (cutLayout.piecesPerSheet >= 2) {
      matchType = 'MULTI_YIELD';
      score = 90;
      matchReasons.push(`High yield: ${cutLayout.piecesPerSheet} pieces per panel`);
    } else {
      matchReasons.push(`Usable cut-down panel with ${cutLayout.wastePercentage}% offcut`);
    }

    if (cutLayout.rotated) {
      matchReasons.push('Cut rotated 90° for best fit');
    }

    const totalPanelsRequired = Math.ceil(order.quantityNeeded / cutLayout.piecesPerSheet);

    results.push({
      panel,
      matchType,
      matchScore: score,
      yieldPerSheet: cutLayout.piecesPerSheet,
      totalPanelsRequired,
      wastePercentage: cutLayout.wastePercentage,
      rotationUsed: cutLayout.rotated,
      cutLayout,
      matchReasons
    });
  }

  // Sort by match score descending, then by minimal waste
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.wastePercentage - b.wastePercentage;
  });

  return results;
}
