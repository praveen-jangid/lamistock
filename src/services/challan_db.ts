import type { DeliveryChallan, FactoryOrder, ChallanComponentItem } from '../types/challan';

const CHALLANS_STORAGE_KEY = 'lamistock_outward_challans';
const ORDERS_STORAGE_KEY = 'lamistock_factory_orders';

// Initial pre-loaded orders based on user factory sales orders
export const INITIAL_ORDERS: FactoryOrder[] = [
  {
    id: 'order-po06863',
    orderNumber: 'PO06863',
    salesOrderNo: 'PO06863',
    productId: 'prod-bunton-desk',
    productName: 'Bunton Desk',
    productCode: 'BS-BUN-06',
    customerName: 'Ambiance Home Furnishing Pvt.Ltd.',
    productImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
    quantity: 26,
    title: 'BS-BUN-06 Bunton Desk',
    date: '18-Aug-2026',
    notes: 'Order for Unit 1 assembly. Laminated panels processed in Unit 2.',
    status: 'PENDING',
    laminationItems: [
      {
        id: 'bun-lam-1',
        partName: 'Dra. Face',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Fluting finish'
      },
      {
        id: 'bun-lam-2',
        partName: 'Back Panel',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Fluting (5 soot)'
      },
      {
        id: 'bun-lam-3',
        partName: 'Side Panel A',
        length: 28.625,
        width: 23.25,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Plain edge'
      },
      {
        id: 'bun-lam-4',
        partName: 'Side Panel B',
        length: 28.625,
        width: 23.25,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Plain edge'
      },
      {
        id: 'bun-lam-5',
        partName: 'Inner Partition',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Drawer divide'
      },
      {
        id: 'bun-lam-6',
        partName: 'Bottom Panel',
        length: 46.5,
        width: 22,
        thickness: 0.675,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Base shelf'
      },
      {
        id: 'bun-lam-7',
        partName: 'Top Panel',
        length: 48,
        width: 24,
        thickness: 0.75,
        quantityNeeded: 26,
        woodType: 'Mango Wood',
        remarks: 'Table top grade'
      }
    ],
    frameItems: [
      {
        id: 'bun-frm-1',
        partName: 'Leg Frame Posts',
        size: '29″ × 2″ × 2″',
        quantity: 104,
        woodType: 'Solid Mango Wood',
        remarks: '4 legs per desk'
      },
      {
        id: 'bun-frm-2',
        partName: 'Top Apron Rails',
        size: '46″ × 3″ × 1″',
        quantity: 52,
        woodType: 'Solid Mango Wood',
        remarks: 'Front & back rails'
      },
      {
        id: 'bun-frm-3',
        partName: 'Side Stretchers',
        size: '22″ × 2.5″ × 1″',
        quantity: 52,
        woodType: 'Solid Mango Wood',
        remarks: 'Bottom cross-stretchers'
      }
    ]
  },
  {
    id: 'order-po06777',
    orderNumber: 'PO06777',
    salesOrderNo: 'PO06777',
    productId: 'prod-bunton-desk',
    productName: 'Bunton Desk',
    productCode: 'BS-BUN-06',
    customerName: 'Ambiance Home Furnishing Pvt.Ltd.',
    productImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
    quantity: 21,
    title: 'BS-BUN-06 Bunton Desk',
    date: '06-Aug-2026',
    notes: 'Repeat order for Bunton Desk.',
    status: 'PENDING',
    laminationItems: [
      {
        id: 'bun-lam-1b',
        partName: 'Dra. Face',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 21,
        woodType: 'Mango Wood'
      }
    ],
    frameItems: [
      {
        id: 'bun-frm-1b',
        partName: 'Leg Frame Posts',
        size: '29″ × 2″ × 2″',
        quantity: 84,
        woodType: 'Solid Mango Wood'
      }
    ]
  },
  {
    id: 'order-po06313',
    orderNumber: 'PO06313',
    salesOrderNo: 'PO06313',
    productName: 'Bunton 2 Drawer Bedside Table',
    productCode: 'BS-BUN-03',
    customerName: 'Ambiance Home Furnishing Pvt.Ltd.',
    productImage: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&auto=format&fit=crop&q=80',
    quantity: 50,
    title: 'BS-BUN-03 Bunton 2 Drawer Bedside Table',
    date: '07-Jun-2026',
    notes: 'Dispatched to Unit 1.',
    status: 'CLOSED',
    laminationItems: [],
    frameItems: []
  }
];

export function getSavedOrders(): FactoryOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved orders:', e);
  }
  // Initialize with sample orders if empty
  saveOrders(INITIAL_ORDERS);
  return INITIAL_ORDERS;
}

export function saveOrders(orders: FactoryOrder[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

export function addOrUpdateOrder(order: FactoryOrder): void {
  const existing = getSavedOrders();
  const index = existing.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    existing[index] = order;
  } else {
    existing.unshift(order);
  }
  saveOrders(existing);
}

export function deleteOrder(orderId: string): void {
  const existing = getSavedOrders().filter((o) => o.id !== orderId);
  saveOrders(existing);
}

export const INITIAL_CHALLANS: DeliveryChallan[] = [
  {
    id: 'challan-po06863-001',
    challanNumber: 'CH-2026-001',
    date: '2026-09-06',
    time: '11:30 AM',
    sourceUnit: 'Unit 2 (Lamination & Wood Processing)',
    destinationUnit: 'Unit 1 (Assembly & Finishing Workshop)',
    orderId: 'order-po06863',
    orderTitle: 'BS-BUN-06 Bunton Desk',
    items: [
      {
        id: 'bun-lam-1',
        orderId: 'order-po06863',
        orderTitle: 'BS-BUN-06 Bunton Desk',
        productCode: 'BS-BUN-06',
        productName: 'Bunton Desk',
        salesOrderNo: 'PO06863',
        category: 'LAMINATION',
        partName: 'Dra. Face',
        dimensions: '27″ × 15.75″ × 0.675″',
        totalOrderQty: 26,
        alreadyDispatchedQty: 0,
        dispatchingNowQty: 26,
        woodType: 'Mango Wood',
        remarks: 'Fluting finish',
        palletNumber: 1
      },
      {
        id: 'bun-lam-2',
        orderId: 'order-po06863',
        orderTitle: 'BS-BUN-06 Bunton Desk',
        productCode: 'BS-BUN-06',
        productName: 'Bunton Desk',
        salesOrderNo: 'PO06863',
        category: 'LAMINATION',
        partName: 'Back Panel',
        dimensions: '27″ × 15.75″ × 0.675″',
        totalOrderQty: 26,
        alreadyDispatchedQty: 0,
        dispatchingNowQty: 26,
        woodType: 'Mango Wood',
        remarks: 'Fluting (5 soot)',
        palletNumber: 1
      },
      {
        id: 'bun-frm-1',
        orderId: 'order-po06863',
        orderTitle: 'BS-BUN-06 Bunton Desk',
        productCode: 'BS-BUN-06',
        productName: 'Bunton Desk',
        salesOrderNo: 'PO06863',
        category: 'FRAME',
        partName: 'Side Fram',
        dimensions: '28.5″ × 2″ × 0.75″',
        totalOrderQty: 52,
        alreadyDispatchedQty: 0,
        dispatchingNowQty: 52,
        woodType: 'Solid Mango Wood',
        remarks: 'Fluting',
        palletNumber: 1
      }
    ],
    pallets: [{ id: 1, name: 'Pallet 1' }],
    palletCount: 1,
    palletPhotos: [],
    driverName: 'Ram Jangid',
    vehicleNumber: 'RJ19GK7638',
    notes: 'Urgent delivery for Unit 1 desk assembly.',
    status: 'DISPATCHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getAllChallans(): DeliveryChallan[] {
  try {
    const raw = localStorage.getItem(CHALLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading delivery challans:', e);
  }
  // Initialize with initial challan if empty
  try {
    localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(INITIAL_CHALLANS));
  } catch {
    // Ignore error
  }
  return INITIAL_CHALLANS;
}

export function deleteChallan(challanId: string): void {
  const existing = getAllChallans().filter((c) => c.id !== challanId);
  try {
    localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error deleting challan:', e);
  }
}

export function saveChallan(challan: DeliveryChallan): void {
  const existing = getAllChallans();
  const index = existing.findIndex((c) => c.id === challan.id);
  if (index >= 0) {
    existing[index] = challan;
  } else {
    existing.unshift(challan);
  }
  try {
    localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving challan:', e);
  }
}

const MANUAL_SENT_STORAGE_KEY = 'lamistock_manual_sent_adjustments';

export function getManualSentAdjustments(): Record<string, number> {
  try {
    const raw = localStorage.getItem(MANUAL_SENT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading manual sent adjustments:', e);
  }
  return {};
}

export function setManualSentQuantity(componentId: string, totalSent: number): void {
  const current = getManualSentAdjustments();
  current[componentId] = Math.max(0, totalSent);
  try {
    localStorage.setItem(MANUAL_SENT_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving manual sent adjustment:', e);
  }
}

export function markComponentAsSent(componentId: string, additionalQuantity: number): void {
  const current = getManualSentAdjustments();
  const existing = current[componentId] || 0;
  current[componentId] = existing + additionalQuantity;
  try {
    localStorage.setItem(MANUAL_SENT_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving manual sent adjustment:', e);
  }
}

export function getNextChallanNumber(): string {
  const existing = getAllChallans();
  const year = new Date().getFullYear();
  const count = existing.length + 1;
  const padded = String(count).padStart(3, '0');
  return `CH-${year}-${padded}`;
}

/**
 * Calculates already dispatched quantities for each component in an order,
 * summing both saved delivery challans and direct manual marks.
 */
export function getDispatchedQuantitiesForOrder(orderId: string): Map<string, number> {
  const challans = getAllChallans();
  const dispatchedMap = new Map<string, number>();

  // 1. Quantities from saved challans
  challans
    .filter((c) => c.status === 'DISPATCHED')
    .forEach((c) => {
      c.items.forEach((it) => {
        if (it.orderId === orderId || (!it.orderId && c.orderId === orderId)) {
          const compKey = it.baseItemId || it.id;
          const curr = dispatchedMap.get(compKey) || 0;
          dispatchedMap.set(compKey, curr + (it.dispatchingNowQty || 0));
        }
      });
    });

  // 2. Add manual adjustments marked directly without a challan
  const manualSent = getManualSentAdjustments();
  Object.entries(manualSent).forEach(([compId, qty]) => {
    const curr = dispatchedMap.get(compId) || 0;
    dispatchedMap.set(compId, curr + qty);
  });

  return dispatchedMap;
}

/**
 * Builds the full component checklist for an order with already sent and remaining counts
 */
export function buildOrderChallanItems(order: FactoryOrder): ChallanComponentItem[] {
  const dispatchedMap = getDispatchedQuantitiesForOrder(order.id);
  const items: ChallanComponentItem[] = [];

  // Lamination Panels
  order.laminationItems.forEach((lam) => {
    const alreadySent = dispatchedMap.get(lam.id) || 0;
    const remaining = Math.max(0, lam.quantityNeeded - alreadySent);

    items.push({
      id: lam.id,
      orderId: order.id,
      orderTitle: order.title,
      productCode: order.productCode,
      productName: order.productName || order.title,
      salesOrderNo: order.salesOrderNo || order.orderNumber,
      category: 'LAMINATION',
      partName: lam.partName,
      dimensions: `${lam.length}″ × ${lam.width}″ × ${lam.thickness}″`,
      totalOrderQty: lam.quantityNeeded,
      alreadyDispatchedQty: alreadySent,
      dispatchingNowQty: remaining > 0 ? remaining : 0,
      woodType: lam.woodType,
      remarks: lam.remarks,
      palletNumber: 1
    });
  });

  // Frame Components
  order.frameItems.forEach((frm) => {
    const alreadySent = dispatchedMap.get(frm.id) || 0;
    const remaining = Math.max(0, frm.quantity - alreadySent);

    items.push({
      id: frm.id,
      orderId: order.id,
      orderTitle: order.title,
      productCode: order.productCode,
      productName: order.productName || order.title,
      salesOrderNo: order.salesOrderNo || order.orderNumber,
      category: 'FRAME',
      partName: frm.partName,
      dimensions: frm.size,
      totalOrderQty: frm.quantity,
      alreadyDispatchedQty: alreadySent,
      dispatchingNowQty: remaining > 0 ? remaining : 0,
      woodType: frm.woodType,
      remarks: frm.remarks,
      palletNumber: 1
    });
  });

  return items;
}

/**
 * Builds combined checklist across multiple orders for multi-product dispatches
 */
export function buildMultiOrderChallanItems(orders: FactoryOrder[]): ChallanComponentItem[] {
  const combined: ChallanComponentItem[] = [];
  orders.forEach((ord) => {
    const items = buildOrderChallanItems(ord);
    combined.push(...items);
  });
  return combined;
}
