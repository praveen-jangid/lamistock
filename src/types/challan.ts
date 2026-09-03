import type { BulkOrderItem } from './panel';

export type ComponentCategory = 'LAMINATION' | 'FRAME';

export interface ChallanComponentItem {
  id: string;
  orderId: string;
  orderTitle: string;
  category: ComponentCategory;
  partName: string;
  dimensions: string; // e.g. "27″ × 15.75″ × 0.675″"
  totalOrderQty: number;
  alreadyDispatchedQty: number;
  dispatchingNowQty: number;
  woodType?: string;
  remarks?: string;
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
  items: ChallanComponentItem[];
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
  orderNumber: string;
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
  status: 'IN_PROGRESS' | 'PARTIALLY_DISPATCHED' | 'COMPLETED';
}
