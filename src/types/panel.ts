export interface LaminatedPanel {
  id: string;
  length: number; // in inches
  width: number; // in inches
  thickness: number; // in inches
  woodType: string; // Default: 'Mango Wood'
  quantity: number;
  frontImageUrl?: string; // Optional (default Mango Wood texture used if not uploaded)
  backImageUrl?: string; // Optional (default Mango Wood texture used if not uploaded)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRequirement {
  id?: string;
  orderNumber: string;
  length: number; // in inches
  width: number; // in inches
  thickness: number; // in inches
  quantityNeeded: number;
  allowRotation: boolean;
  kerfAllowance?: number; // saw blade kerf in inches (default 0.125" / 1/8")
}

export interface CutLayout {
  fits: boolean;
  rotated: boolean;
  piecesPerSheet: number;
  cutsAlongLength: number;
  cutsAlongWidth: number;
  cutPieceLength: number;
  cutPieceWidth: number;
  stockLength: number;
  stockWidth: number;
  usedAreaSqInches: number;
  totalStockAreaSqInches: number;
  wastePercentage: number;
  remnantLength?: number;
  remnantWidth?: number;
}

export type MatchType = 'EXACT' | 'OVERSIZED_CUT' | 'MULTI_YIELD';

export interface MatchResult {
  panel: LaminatedPanel;
  matchType: MatchType;
  matchScore: number;
  yieldPerSheet: number;
  totalPanelsRequired: number;
  wastePercentage: number;
  rotationUsed: boolean;
  cutLayout: CutLayout;
  matchReasons: string[];
}
