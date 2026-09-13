export interface WoodPlanLaminationItem {
  id: string;
  partName: string;
  qtyPerUnit: number; // e.g. 1
  length: number; // inches decimal, e.g. 27
  width: number; // inches decimal, e.g. 15.75
  thickness: number; // inches decimal, e.g. 0.625 or 0.675 or 1
  rawSize?: string; // e.g. '27" X 15"-6\'\'\' X 1"'
  woodType: string; // e.g. 'Mango Wood'
  remarks?: string; // e.g. 'Fluting finish'
}

export interface WoodPlanFrameItem {
  id: string;
  partName: string;
  qtyPerUnit: number; // e.g. 2
  length: number; // inches decimal
  width: number; // inches decimal
  thickness: number; // inches decimal
  rawSize?: string; // e.g. '28"-4\'\'\' X 3" X 6\'\'\''
  woodType: string; // e.g. 'Solid Mango Wood'
  remarks?: string; // e.g. 'CNC', 'Fluting', 'Plain'
}

export interface WoodPlan {
  id: string;
  productId: string;
  sourceFileName?: string;
  importedAt: string;
  updatedAt: string;
  notes?: string;
  laminationItems: WoodPlanLaminationItem[];
  frameItems: WoodPlanFrameItem[];
}

export interface Product {
  id: string;
  name: string; // e.g. "Bunton Desk"
  code: string; // e.g. "BS-BUN-06"
  customerName: string; // e.g. "APL"
  photoUrl?: string; // Compressed WebP / Base64 / Remote URL
  description?: string;
  createdAt: string;
  updatedAt: string;
  woodPlan?: WoodPlan; // Embedded for instant access & offline availability
}
