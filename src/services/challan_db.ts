import type { DeliveryChallan, FactoryOrder, ChallanComponentItem } from '../types/challan';
import {
  isFirebaseReady,
  syncChallanToFirestore,
  deleteChallanFromFirestore,
  fetchAllChallansFromFirestore,
  subscribeToFirestoreChallans,
  syncOrderToFirestore,
  deleteOrderFromFirestore,
  fetchAllOrdersFromFirestore,
  subscribeToFirestoreOrders,
  syncManualAdjustmentsToFirestore,
  fetchManualAdjustmentsFromFirestore
} from './firebase';

const CHALLANS_STORAGE_KEY = 'lamistock_outward_challans';
const ORDERS_STORAGE_KEY = 'lamistock_factory_orders';

// In-memory listener system to keep active UI views synchronized across components & tabs
type ChallansListener = (challans: DeliveryChallan[]) => void;
type OrdersListener = (orders: FactoryOrder[]) => void;

const challanListeners = new Set<ChallansListener>();
const orderListeners = new Set<OrdersListener>();

function notifyChallanListeners(challans: DeliveryChallan[]) {
  challanListeners.forEach((fn) => {
    try {
      fn(challans);
    } catch (e) {
      console.error('Error in challan listener:', e);
    }
  });
}

function notifyOrderListeners(orders: FactoryOrder[]) {
  orderListeners.forEach((fn) => {
    try {
      fn(orders);
    } catch (e) {
      console.error('Error in order listener:', e);
    }
  });
}

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
    urgency: 'URGENT',
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
    notes: 'Bedside table order for Unit 1 assembly.',
    status: 'IN_PROGRESS',
    urgency: 'NORMAL',
    laminationItems: [
      {
        id: 'bed-lam-1',
        partName: 'Top Panel',
        length: 20,
        width: 16,
        thickness: 0.75,
        quantityNeeded: 50,
        woodType: 'Mango Wood',
        remarks: 'Beveled edge'
      },
      {
        id: 'bed-lam-2',
        partName: 'Drawer Faces',
        length: 18,
        width: 7,
        thickness: 0.675,
        quantityNeeded: 100,
        woodType: 'Mango Wood',
        remarks: 'Fluting pattern'
      },
      {
        id: 'bed-lam-3',
        partName: 'Side Panels',
        length: 22,
        width: 15.5,
        thickness: 0.675,
        quantityNeeded: 100,
        woodType: 'Mango Wood'
      }
    ],
    frameItems: [
      {
        id: 'bed-frm-1',
        partName: 'Leg Posts',
        size: '23″ × 1.75″ × 1.75″',
        quantity: 200,
        woodType: 'Solid Mango Wood'
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

export async function addOrUpdateOrder(order: FactoryOrder): Promise<void> {
  const existing = getSavedOrders();
  const index = existing.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    existing[index] = order;
  } else {
    existing.unshift(order);
  }
  saveOrders(existing);
  notifyOrderListeners(existing);

  if (isFirebaseReady()) {
    try {
      await syncOrderToFirestore(order);
    } catch (e) {
      console.error('Failed syncing order to Firestore:', e);
    }
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const existing = getSavedOrders().filter((o) => o.id !== orderId);
  saveOrders(existing);
  notifyOrderListeners(existing);

  if (isFirebaseReady()) {
    try {
      await deleteOrderFromFirestore(orderId);
    } catch (e) {
      console.error('Failed deleting order from Firestore:', e);
    }
  }
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

/**
 * Initializes challans, orders, and manual adjustments from Firestore and local cache.
 * Auto-migrates local challans up to Firestore if Firestore is currently empty so no data is lost!
 */
export async function initializeChallansDatabase(): Promise<{
  challans: DeliveryChallan[];
  orders: FactoryOrder[];
}> {
  let challans = getAllChallans();
  let orders = getSavedOrders();

  if (isFirebaseReady()) {
    try {
      // 1. Outward Challans
      const remoteChallans = await fetchAllChallansFromFirestore();
      if (remoteChallans.length > 0) {
        // Cloud has records - update local cache
        localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(remoteChallans));
        challans = remoteChallans;
      } else if (challans.length > 0) {
        // Auto-migrate any local challans up to Firestore
        console.log(`Auto-migrating ${challans.length} local challan(s) up to Firestore...`);
        for (const ch of challans) {
          try {
            await syncChallanToFirestore(ch);
          } catch (err) {
            console.warn('Failed auto-syncing challan to Firestore:', err);
          }
        }
      }

      // 2. Factory Orders
      const remoteOrders = await fetchAllOrdersFromFirestore();
      if (remoteOrders.length > 0) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(remoteOrders));
        orders = remoteOrders;
      } else if (orders.length > 0) {
        console.log(`Auto-migrating ${orders.length} local order(s) up to Firestore...`);
        for (const ord of orders) {
          try {
            await syncOrderToFirestore(ord);
          } catch (err) {
            console.warn('Failed auto-syncing order to Firestore:', err);
          }
        }
      }

      // 3. Manual Sent Adjustments
      const remoteAdj = await fetchManualAdjustmentsFromFirestore();
      if (remoteAdj && Object.keys(remoteAdj).length > 0) {
        const localAdj = getManualSentAdjustments();
        const merged = { ...localAdj, ...remoteAdj };
        localStorage.setItem(MANUAL_SENT_STORAGE_KEY, JSON.stringify(merged));
      } else {
        const localAdj = getManualSentAdjustments();
        if (Object.keys(localAdj).length > 0) {
          await syncManualAdjustmentsToFirestore(localAdj);
        }
      }
    } catch (e) {
      console.warn('Could not sync challans with Firestore:', e);
    }
  }

  notifyChallanListeners(challans);
  notifyOrderListeners(orders);

  return { challans, orders };
}

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

export async function deleteChallan(challanId: string): Promise<void> {
  const existing = getAllChallans().filter((c) => c.id !== challanId);
  try {
    localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error deleting challan:', e);
  }

  notifyChallanListeners(existing);

  if (isFirebaseReady()) {
    try {
      await deleteChallanFromFirestore(challanId);
      console.log('Successfully deleted challan from Firestore:', challanId);
    } catch (e) {
      console.error('Failed deleting challan from Firestore:', e);
    }
  }
}

export async function saveChallan(challan: DeliveryChallan): Promise<void> {
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

  notifyChallanListeners(existing);

  if (isFirebaseReady()) {
    try {
      await syncChallanToFirestore(challan);
      console.log('Successfully synced outward challan to Firestore:', challan.id, challan.challanNumber);
    } catch (e) {
      console.error('Failed syncing outward challan to Firestore:', e);
    }
  }
}

export function setupChallansRealtimeSync(onUpdate: (challans: DeliveryChallan[]) => void): () => void {
  challanListeners.add(onUpdate);

  const unsubRemote = subscribeToFirestoreChallans((remoteChallans) => {
    if (remoteChallans && remoteChallans.length > 0) {
      try {
        localStorage.setItem(CHALLANS_STORAGE_KEY, JSON.stringify(remoteChallans));
      } catch (e) {
        console.error('Error caching remote challans:', e);
      }
      notifyChallanListeners(remoteChallans);
    }
  });

  return () => {
    challanListeners.delete(onUpdate);
    unsubRemote();
  };
}

export function setupOrdersRealtimeSync(onUpdate: (orders: FactoryOrder[]) => void): () => void {
  orderListeners.add(onUpdate);

  const unsubRemote = subscribeToFirestoreOrders((remoteOrders) => {
    if (remoteOrders && remoteOrders.length > 0) {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(remoteOrders));
      } catch (e) {
        console.error('Error caching remote orders:', e);
      }
      notifyOrderListeners(remoteOrders);
    }
  });

  return () => {
    orderListeners.delete(onUpdate);
    unsubRemote();
  };
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

  if (isFirebaseReady()) {
    syncManualAdjustmentsToFirestore(current).catch((err) => {
      console.warn('Failed syncing manual sent adjustment to Firestore:', err);
    });
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

  if (isFirebaseReady()) {
    syncManualAdjustmentsToFirestore(current).catch((err) => {
      console.warn('Failed syncing manual sent adjustment to Firestore:', err);
    });
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
    .filter((c) => c.status === 'DISPATCHED' || c.status === 'RECEIVED_AT_UNIT_1')
    .forEach((c) => {
      c.items.forEach((it) => {
        const matchesOrder =
          it.orderId === orderId ||
          (!it.orderId && c.orderId === orderId) ||
          (c.orderIds && c.orderIds.includes(orderId));

        if (matchesOrder) {
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

export interface ComponentDeliveryDetail {
  challanId: string;
  challanNumber: string;
  date: string;
  time?: string;
  quantity: number;
  driverName?: string;
  vehicleNumber?: string;
  palletNumber?: number;
  status: string;
}

export interface DetailedComponentDispatches {
  challans: ComponentDeliveryDetail[];
  challanSentTotal: number;
  manualSentTotal: number;
  totalTransported: number;
}

/**
 * Returns a map of component ID to detailed dispatch breakdown (which challans carried it, manual entries, etc.)
 */
export function getDetailedDispatchesForOrder(orderId: string): Map<string, DetailedComponentDispatches> {
  const challans = getAllChallans();
  const resultMap = new Map<string, DetailedComponentDispatches>();

  const getOrCreate = (key: string): DetailedComponentDispatches => {
    let entry = resultMap.get(key);
    if (!entry) {
      entry = {
        challans: [],
        challanSentTotal: 0,
        manualSentTotal: 0,
        totalTransported: 0
      };
      resultMap.set(key, entry);
    }
    return entry;
  };

  // 1. Group from saved challans
  challans
    .filter((c) => c.status === 'DISPATCHED' || c.status === 'RECEIVED_AT_UNIT_1')
    .forEach((c) => {
      c.items.forEach((it) => {
        const matchesOrder =
          it.orderId === orderId ||
          (!it.orderId && c.orderId === orderId) ||
          (c.orderIds && c.orderIds.includes(orderId));

        if (matchesOrder) {
          const compKey = it.baseItemId || it.id;
          const entry = getOrCreate(compKey);
          const qty = it.dispatchingNowQty || 0;
          if (qty > 0) {
            entry.challans.push({
              challanId: c.id,
              challanNumber: c.challanNumber,
              date: c.date,
              time: c.time,
              quantity: qty,
              driverName: c.driverName,
              vehicleNumber: c.vehicleNumber,
              palletNumber: it.palletNumber,
              status: c.status
            });
            entry.challanSentTotal += qty;
          }
        }
      });
    });

  // 2. Add manual adjustments marked directly without a challan
  const manualSent = getManualSentAdjustments();
  Object.entries(manualSent).forEach(([compId, qty]) => {
    if (qty > 0) {
      const entry = getOrCreate(compId);
      entry.manualSentTotal += qty;
    }
  });

  // Compute grand total for each component
  resultMap.forEach((entry) => {
    entry.totalTransported = entry.challanSentTotal + entry.manualSentTotal;
  });

  return resultMap;
}

export async function toggleOrderUrgency(orderId: string): Promise<'URGENT' | 'NORMAL'> {
  const orders = getSavedOrders();
  const order = orders.find((o) => o.id === orderId);
  let nextUrgency: 'URGENT' | 'NORMAL' = 'URGENT';
  if (order) {
    nextUrgency = order.urgency === 'URGENT' ? 'NORMAL' : 'URGENT';
    order.urgency = nextUrgency;
    saveOrders(orders);
    notifyOrderListeners(orders);
    if (isFirebaseReady()) {
      syncOrderToFirestore(order).catch(console.warn);
    }
  }
  return nextUrgency;
}

export function markAllOrderComponentsCompleted(order: FactoryOrder): void {
  const currentManual = getManualSentAdjustments();
  const dispatchedMap = getDispatchedQuantitiesForOrder(order.id);

  order.laminationItems.forEach((lam) => {
    const already = dispatchedMap.get(lam.id) || 0;
    const diff = Math.max(0, lam.quantityNeeded - already);
    if (diff > 0) {
      currentManual[lam.id] = (currentManual[lam.id] || 0) + diff;
    }
  });

  order.frameItems.forEach((frm) => {
    const already = dispatchedMap.get(frm.id) || 0;
    const diff = Math.max(0, frm.quantity - already);
    if (diff > 0) {
      currentManual[frm.id] = (currentManual[frm.id] || 0) + diff;
    }
  });

  try {
    localStorage.setItem(MANUAL_SENT_STORAGE_KEY, JSON.stringify(currentManual));
  } catch (e) {
    console.error('Error saving manual adjustments:', e);
  }

  if (isFirebaseReady()) {
    syncManualAdjustmentsToFirestore(currentManual).catch(console.warn);
  }

  notifyOrderListeners(getSavedOrders());
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
