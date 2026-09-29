export interface PalletAllocation {
  heightMm: number;
  density: 'normal' | 'compact' | 'ultra-compact';
}

export interface PalletAllocationResult {
  p1: PalletAllocation;
  p2: PalletAllocation;
  hasTwoPallets: boolean;
}

/**
 * Dynamically distributes the fixed A4 print height (~272mm) between Pallet 1 and Pallet 2.
 * When one pallet has fewer items (e.g. 1 item) and the other has many (e.g. 10 items),
 * the smaller pallet's height is reduced and the extra space is allocated to the fuller pallet,
 * preventing any content overflow while keeping both slips on a single printable A4 sheet.
 */
export function calculatePalletSlipAllocations(
  pallet1ItemCount: number,
  pallet2ItemCount: number,
  hasMultiplePallets: boolean
): PalletAllocationResult {
  const TOTAL_A4_PRINT_HEIGHT_MM = 272; // Leaves 6mm for margins and cut guide

  if (!hasMultiplePallets || pallet2ItemCount === 0) {
    const density =
      pallet1ItemCount >= 9
        ? 'ultra-compact'
        : pallet1ItemCount >= 5
        ? 'compact'
        : 'normal';

    return {
      p1: { heightMm: 136, density },
      p2: { heightMm: 136, density: 'normal' },
      hasTwoPallets: false
    };
  }

  // Base overhead required for header, transport/product box, table header, and card padding
  const BASE_OVERHEAD_MM = 40;
  // Proportional weight per item row
  const est1 = BASE_OVERHEAD_MM + Math.max(1, pallet1ItemCount) * 7.5;
  const est2 = BASE_OVERHEAD_MM + Math.max(1, pallet2ItemCount) * 7.5;
  const totalEst = est1 + est2;

  // Minimum comfortable height for a slip with 1 item (header + details + 1 item): 68mm
  const MIN_SLIP_HEIGHT_MM = 68;

  let p1H = Math.round((est1 / totalEst) * TOTAL_A4_PRINT_HEIGHT_MM);
  let p2H = TOTAL_A4_PRINT_HEIGHT_MM - p1H;

  // Clamp within bounds
  if (p1H < MIN_SLIP_HEIGHT_MM) {
    p1H = MIN_SLIP_HEIGHT_MM;
    p2H = TOTAL_A4_PRINT_HEIGHT_MM - p1H;
  } else if (p2H < MIN_SLIP_HEIGHT_MM) {
    p2H = MIN_SLIP_HEIGHT_MM;
    p1H = TOTAL_A4_PRINT_HEIGHT_MM - p2H;
  }

  const resolveDensity = (count: number, heightMm: number): 'normal' | 'compact' | 'ultra-compact' => {
    const tableBodyHeight = heightMm - BASE_OVERHEAD_MM;
    const heightPerRow = tableBodyHeight / Math.max(1, count);
    if (heightPerRow < 7.5 || count >= 9) return 'ultra-compact';
    if (heightPerRow < 10.5 || count >= 5) return 'compact';
    return 'normal';
  };

  return {
    p1: { heightMm: p1H, density: resolveDensity(pallet1ItemCount, p1H) },
    p2: { heightMm: p2H, density: resolveDensity(pallet2ItemCount, p2H) },
    hasTwoPallets: true
  };
}
