import type { DeliveryChallan, FactoryOrder, ChallanComponentItem } from '../types/challan';

const CHALLANS_STORAGE_KEY = 'lamistock_outward_challans';
const ORDERS_STORAGE_KEY = 'lamistock_factory_orders';

// Initial pre-loaded orders based on the user's real "BS-BUN-06 DESK" Excel file
export const INITIAL_ORDERS: FactoryOrder[] = [
  {
    id: 'order-bs-bun-06',
    orderNumber: 'BS-BUN-06',
    title: 'Bunton Desk (10 Units)',
    date: new Date().toISOString().split('T')[0],
    notes: 'Order for Unit 1 assembly. Laminated panels processed in Unit 2.',
    status: 'IN_PROGRESS',
    laminationItems: [
      {
        id: 'bun-lam-1',
        partName: 'Dra. Face',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Fluting finish'
      },
      {
        id: 'bun-lam-2',
        partName: 'Back Panel',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Fluting (5 soot)'
      },
      {
        id: 'bun-lam-3',
        partName: 'Side Panel A',
        length: 28.625,
        width: 23.25,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Plain edge'
      },
      {
        id: 'bun-lam-4',
        partName: 'Side Panel B',
        length: 28.625,
        width: 23.25,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Plain edge'
      },
      {
        id: 'bun-lam-5',
        partName: 'Inner Partition',
        length: 27,
        width: 15.75,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Drawer divide'
      },
      {
        id: 'bun-lam-6',
        partName: 'Bottom Panel',
        length: 46.5,
        width: 22,
        thickness: 0.675,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Base shelf'
      },
      {
        id: 'bun-lam-7',
        partName: 'Top Panel',
        length: 48,
        width: 24,
        thickness: 0.75,
        quantityNeeded: 10,
        woodType: 'Mango Wood',
        remarks: 'Table top grade'
      }
    ],
    frameItems: [
      {
        id: 'bun-frm-1',
        partName: 'Leg Frame Posts',
        size: '29″ × 2″ × 2″',
        quantity: 40,
        woodType: 'Solid Mango Wood',
        remarks: '4 legs per desk'
      },
      {
        id: 'bun-frm-2',
        partName: 'Top Apron Rails',
        size: '46″ × 3″ × 1″',
        quantity: 20,
        woodType: 'Solid Mango Wood',
        remarks: 'Front & back rails'
      },
      {
        id: 'bun-frm-3',
        partName: 'Side Stretchers',
        size: '22″ × 2.5″ × 1″',
        quantity: 20,
        woodType: 'Solid Mango Wood',
        remarks: 'Bottom cross-stretchers'
      }
    ]
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

export function getAllChallans(): DeliveryChallan[] {
  try {
    const raw = localStorage.getItem(CHALLANS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading delivery challans:', e);
  }
  return [];
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

export function getNextChallanNumber(): string {
  const existing = getAllChallans();
  const year = new Date().getFullYear();
  const count = existing.length + 1;
  const padded = String(count).padStart(3, '0');
  return `CH-${year}-${padded}`;
}

/**
 * Calculates already dispatched quantities for each component in an order
 */
export function getDispatchedQuantitiesForOrder(orderId: string): Map<string, number> {
  const challans = getAllChallans();
  const dispatchedMap = new Map<string, number>();

  challans
    .filter((c) => c.orderId === orderId && c.status === 'DISPATCHED')
    .forEach((c) => {
      c.items.forEach((it) => {
        const curr = dispatchedMap.get(it.id) || 0;
        dispatchedMap.set(it.id, curr + (it.dispatchingNowQty || 0));
      });
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
      category: 'LAMINATION',
      partName: lam.partName,
      dimensions: `${lam.length}″ × ${lam.width}″ × ${lam.thickness}″`,
      totalOrderQty: lam.quantityNeeded,
      alreadyDispatchedQty: alreadySent,
      dispatchingNowQty: remaining > 0 ? remaining : 0,
      woodType: lam.woodType,
      remarks: lam.remarks
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
      category: 'FRAME',
      partName: frm.partName,
      dimensions: frm.size,
      totalOrderQty: frm.quantity,
      alreadyDispatchedQty: alreadySent,
      dispatchingNowQty: remaining > 0 ? remaining : 0,
      woodType: frm.woodType,
      remarks: frm.remarks
    });
  });

  return items;
}
