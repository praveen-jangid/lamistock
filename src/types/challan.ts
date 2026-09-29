import type { BulkOrderItem } from './panel';

export type ComponentCategory = 'LAMINATION' | 'FRAME';

export interface ChallanComponentItem {
  id: string;
  orderId: string;
  orderTitle: string;
  productCode?: string;
  productName?: string;
  salesOrderNo?: string;
  category: ComponentCategory;
  partName: string;
  dimensions: string; // e.g. "27″ × 15.75″ × 0.675″"
  totalOrderQty: number;
  alreadyDispatchedQty: number;
  dispatchingNowQty: number;
  woodType?: string;
  remarks?: string;
  palletNumber?: number; // 1, 2, ...
  isSplitPart?: boolean;
  baseItemId?: string; // Original item ID if split across pallets
  splitDetails?: { p1: number; p2: number; total: number; originalTotalQty?: number };
  isCustomItem?: boolean; // True if manually added sample or custom size
  customerName?: string;
}

export interface PalletConfig {
  id: number;
  name: string;
  label?: string;
  notes?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string; // e.g. "CH-2026-001"
  date: string;
  time: string;
  sourceUnit: string; // "Unit 2 (Lamination & Wood Processing)"
  destinationUnit: string; // "Unit 1 (Assembly & Finishing)"
  orderId: string;
  orderTitle: string;
  orderIds?: string[];
  orderTitles?: string[];
  items: ChallanComponentItem[];
  pallets?: PalletConfig[];
  palletCount?: number;
  palletPhotos: string[]; // Base64 or Cloud URLs of the packed pallet
  driverName?: string;
  vehicleNumber?: string;
  notes?: string;
  status: 'DRAFT' | 'DISPATCHED' | 'RECEIVED_AT_UNIT_1';
  createdAt: string;
  updatedAt: string;
}

export interface FactoryOrder {
  id: string;
  orderNumber: string; // e.g. "PO06863"
  salesOrderNo?: string; // e.g. "PO06863"
  productId?: string;
  productName?: string;
  productCode?: string;
  customerName?: string;
  productImage?: string;
  quantity?: number;
  title: string;
  date: string;
  laminationItems: BulkOrderItem[];
  frameItems: {
    id: string;
    partName: string;
    size: string;
    quantity: number;
    woodType?: string;
    remarks?: string;
  }[];
  notes?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PARTIALLY_DISPATCHED' | 'COMPLETED' | 'CLOSED';
  urgency?: 'URGENT' | 'NORMAL' | 'LOW';
}
