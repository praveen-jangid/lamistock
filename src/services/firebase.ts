import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { LaminatedPanel } from '../types/panel';
import type { Product } from '../types/product';
import type { DeliveryChallan, FactoryOrder } from '../types/challan';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const FIREBASE_CONFIG_STORAGE_KEY = 'lamination_firebase_config';
const LEGACY_STORAGE_KEY = 'factory_mango_wood_firebase_config';

export const FIRESTORE_PANELS_COLLECTION = 'lamination_panels';
export const FIREBASE_STORAGE_PANELS_PATH = 'lamination_panels';
export const FIRESTORE_PRODUCTS_COLLECTION = 'products';
export const FIREBASE_STORAGE_PRODUCTS_PATH = 'products';
export const FIRESTORE_CHALLANS_COLLECTION = 'outward_challans';
export const FIREBASE_STORAGE_CHALLANS_PATH = 'outward_challans';
export const FIRESTORE_ORDERS_COLLECTION = 'factory_orders';
export const FIRESTORE_CHALLANS_SETTINGS_COLLECTION = 'challan_settings';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Default factory Firebase configuration - Zero-config online sync by default
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCanvE1HAr2hN2ng4XkkciXdxrGNZhzLHs",
  authDomain: "lamistock-76afd.firebaseapp.com",
  projectId: "lamistock-76afd",
  storageBucket: "lamistock-76afd.firebasestorage.app",
  messagingSenderId: "1039234743708",
  appId: "1:1039234743708:web:d89a79f1227cd6ee451c59",
  measurementId: "G-P5SQ7QL3V0"
};

export function getSavedFirebaseConfig(): FirebaseConfig {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_FIREBASE_CONFIG;
    let raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (!raw) {
      // Check legacy key if available and migrate seamlessly
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, raw);
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId && parsed.projectId.includes('lamistock')) {
        return parsed;
      }
    }

    // Also support environment variables (e.g. in .env file)
    const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
    if (envApiKey && envProjectId) {
      return {
        apiKey: envApiKey,
        authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        projectId: envProjectId,
        storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
        messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
        measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || ''
      };
    }
  } catch (e) {
    console.error('Error reading Firebase config from storage', e);
  }

  // Default to factory Firebase project credentials
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfig | null): void {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    initializeFirebase(DEFAULT_FIREBASE_CONFIG);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    initializeFirebase(config);
  }
}

export function initializeFirebase(customConfig?: FirebaseConfig): boolean {
  try {
    const config = customConfig || getSavedFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }

    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    return true;
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return false;
  }
}

// Auto-initialize Firebase immediately on load so the app is always connected
initializeFirebase();

export function isFirebaseReady(): boolean {
  if (!appInstance) {
    return initializeFirebase();
  }
  return !!dbInstance;
}

// Diagnostic test for Firestore connection
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseReady() || !dbInstance) {
    return {
      success: false,
      message: 'Firebase is not initialized. Please enter valid configuration credentials.'
    };
  }

  try {
    const testDocRef = doc(dbInstance, FIRESTORE_PANELS_COLLECTION, 'connection_test_ping');
    await setDoc(testDocRef, {
      test: true,
      timestamp: new Date().toISOString()
    });
    // Immediately clean up test ping doc
    await deleteDoc(testDocRef);

    return {
      success: true,
      message: `Successfully connected to Firestore! Collection '${FIRESTORE_PANELS_COLLECTION}' is active and readable/writable.`
    };
  } catch (err: any) {
    console.error('Firestore connection test error:', err);
    const code = err?.code || '';
    if (code === 'permission-denied') {
      return {
        success: false,
        message: `Permission denied. Please verify your Firestore Security Rules allow read/write to the '${FIRESTORE_PANELS_COLLECTION}' collection.`
      };
    }
    return {
      success: false,
      message: `Connection failed: ${err.message || String(err)}`
    };
  }
}

// Upload base64 image to Firebase Storage (or returns base64 directly if Firebase not configured)
export async function uploadLaminateImage(
  base64DataUrl: string,
  panelId: string,
  type: 'front' | 'back'
): Promise<string> {
  if (!isFirebaseReady() || !storageInstance) {
    return base64DataUrl;
  }

  try {
    const filename = `${FIREBASE_STORAGE_PANELS_PATH}/${panelId}_${type}_${Date.now()}.jpg`;
    const storageRef = ref(storageInstance, filename);
    await uploadString(storageRef, base64DataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase storage upload failed, using local base64:', err);
    return base64DataUrl;
  }
}

// Firestore operations

/**
 * Sanitizes panel data before sending to Firestore, ensuring NO undefined values exist.
 * Firestore will reject any document with undefined properties.
 */
export function sanitizePanelForFirestore(panel: LaminatedPanel): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(panel.id),
    length: Number(panel.length) || 0,
    width: Number(panel.width) || 0,
    thickness: Number(panel.thickness) || 0,
    woodType: panel.woodType ? String(panel.woodType) : 'Mango Wood',
    quantity: Number(panel.quantity) || 1,
    frontImageUrl: panel.frontImageUrl || '',
    backImageUrl: panel.backImageUrl || '',
    notes: panel.notes ? String(panel.notes) : '',
    createdAt: panel.createdAt || new Date().toISOString(),
    updatedAt: panel.updatedAt || new Date().toISOString()
  };

  // Strip any remaining undefined keys just in case
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) {
      delete clean[k];
    }
  });

  return clean;
}

export async function syncPanelToFirestore(panel: LaminatedPanel): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const cleanPanel = sanitizePanelForFirestore(panel);
  const panelRef = doc(dbInstance, FIRESTORE_PANELS_COLLECTION, cleanPanel.id);
  await setDoc(panelRef, cleanPanel, { merge: true });
}

/**
 * Synchronizes an array of panels to Firestore using chunked writeBatch (up to 450 items per batch).
 * Guarantees every panel is written as a distinct document.
 */
export async function batchSyncPanelsToFirestore(
  panels: LaminatedPanel[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (!isFirebaseReady() || !dbInstance || panels.length === 0) return;

  const CHUNK_SIZE = 450; // Firestore maximum limit is 500
  let completed = 0;

  for (let i = 0; i < panels.length; i += CHUNK_SIZE) {
    const chunk = panels.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);

    for (const panel of chunk) {
      const cleanPanel = sanitizePanelForFirestore(panel);
      const panelRef = doc(dbInstance, FIRESTORE_PANELS_COLLECTION, cleanPanel.id);
      batch.set(panelRef, cleanPanel, { merge: true });
    }

    await batch.commit();
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, panels.length);
    }
  }
}

export async function deletePanelFromFirestore(panelId: string): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const panelRef = doc(dbInstance, FIRESTORE_PANELS_COLLECTION, panelId);
  await deleteDoc(panelRef);
}

export async function fetchAllPanelsFromFirestore(): Promise<LaminatedPanel[]> {
  if (!isFirebaseReady() || !dbInstance) return [];
  const querySnapshot = await getDocs(collection(dbInstance, FIRESTORE_PANELS_COLLECTION));
  const panels: LaminatedPanel[] = [];
  querySnapshot.forEach((docSnap) => {
    // Exclude any internal test documents
    if (docSnap.id !== 'connection_test_ping') {
      const data = docSnap.data();
      panels.push({
        id: docSnap.id,
        length: Number(data.length) || 0,
        width: Number(data.width) || 0,
        thickness: Number(data.thickness) || 0,
        woodType: data.woodType || 'Mango Wood',
        quantity: Number(data.quantity) || 1,
        frontImageUrl: data.frontImageUrl || '',
        backImageUrl: data.backImageUrl || '',
        notes: data.notes || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    }
  });
  return panels;
}

export function subscribeToFirestorePanels(onUpdate: (panels: LaminatedPanel[]) => void): () => void {
  if (!isFirebaseReady() || !dbInstance) {
    return () => {};
  }
  const unsubscribe = onSnapshot(
    collection(dbInstance, FIRESTORE_PANELS_COLLECTION),
    (snapshot) => {
      const panels: LaminatedPanel[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== 'connection_test_ping') {
          const data = docSnap.data();
          panels.push({
            id: docSnap.id,
            length: Number(data.length) || 0,
            width: Number(data.width) || 0,
            thickness: Number(data.thickness) || 0,
            woodType: data.woodType || 'Mango Wood',
            quantity: Number(data.quantity) || 1,
            frontImageUrl: data.frontImageUrl || '',
            backImageUrl: data.backImageUrl || '',
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        }
      });
      onUpdate(panels);
    },
    (error) => {
      console.error('Firestore onSnapshot subscription error:', error);
    }
  );
  return unsubscribe;
}

// -------------------------------------------------------------
// Product Database Cloud Operations
// -------------------------------------------------------------

export async function uploadProductImage(
  base64DataUrl: string,
  productId: string
): Promise<string> {
  if (!isFirebaseReady() || !storageInstance) {
    return base64DataUrl;
  }

  try {
    const filename = `${FIREBASE_STORAGE_PRODUCTS_PATH}/${productId}_${Date.now()}.jpg`;
    const storageRef = ref(storageInstance, filename);
    await uploadString(storageRef, base64DataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase storage product upload failed, using local base64:', err);
    return base64DataUrl;
  }
}

export function sanitizeProductForFirestore(product: Product): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(product.id),
    name: String(product.name || ''),
    code: String(product.code || ''),
    customerName: String(product.customerName || ''),
    photoUrl: product.photoUrl || '',
    description: product.description || '',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  };

  if (product.woodPlan) {
    clean.woodPlan = {
      id: String(product.woodPlan.id || ''),
      productId: String(product.id),
      sourceFileName: product.woodPlan.sourceFileName || '',
      importedAt: product.woodPlan.importedAt || new Date().toISOString(),
      updatedAt: product.woodPlan.updatedAt || new Date().toISOString(),
      notes: product.woodPlan.notes || '',
      laminationItems: (product.woodPlan.laminationItems || []).map((it) => ({
        id: String(it.id),
        partName: String(it.partName || ''),
        qtyPerUnit: Number(it.qtyPerUnit) || 1,
        length: Number(it.length) || 0,
        width: Number(it.width) || 0,
        thickness: Number(it.thickness) || 0,
        rawSize: it.rawSize || '',
        woodType: it.woodType || 'Mango Wood',
        remarks: it.remarks || ''
      })),
      frameItems: (product.woodPlan.frameItems || []).map((it) => ({
        id: String(it.id),
        partName: String(it.partName || ''),
        qtyPerUnit: Number(it.qtyPerUnit) || 1,
        length: Number(it.length) || 0,
        width: Number(it.width) || 0,
        thickness: Number(it.thickness) || 0,
        rawSize: it.rawSize || '',
        woodType: it.woodType || 'Solid Mango Wood',
        remarks: it.remarks || ''
      }))
    };
  }

  // Remove any remaining undefined keys
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) {
      delete clean[k];
    }
  });

  return clean;
}

export async function syncProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const cleanProduct = sanitizeProductForFirestore(product);
  const prodRef = doc(dbInstance, FIRESTORE_PRODUCTS_COLLECTION, cleanProduct.id);
  await setDoc(prodRef, cleanProduct, { merge: true });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const prodRef = doc(dbInstance, FIRESTORE_PRODUCTS_COLLECTION, productId);
  await deleteDoc(prodRef);
}

export async function fetchAllProductsFromFirestore(): Promise<Product[]> {
  if (!isFirebaseReady() || !dbInstance) return [];
  const querySnapshot = await getDocs(collection(dbInstance, FIRESTORE_PRODUCTS_COLLECTION));
  const products: Product[] = [];
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== 'connection_test_ping') {
      const data = docSnap.data() as any;
      products.push({
        id: docSnap.id,
        name: data.name || '',
        code: data.code || '',
        customerName: data.customerName || '',
        photoUrl: data.photoUrl || '',
        description: data.description || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        woodPlan: data.woodPlan || undefined
      });
    }
  });
  return products;
}

export function subscribeToFirestoreProducts(onUpdate: (products: Product[]) => void): () => void {
  if (!isFirebaseReady() || !dbInstance) {
    return () => {};
  }
  const unsubscribe = onSnapshot(
    collection(dbInstance, FIRESTORE_PRODUCTS_COLLECTION),
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== 'connection_test_ping') {
          const data = docSnap.data() as any;
          products.push({
            id: docSnap.id,
            name: data.name || '',
            code: data.code || '',
            customerName: data.customerName || '',
            photoUrl: data.photoUrl || '',
            description: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            woodPlan: data.woodPlan || undefined
          });
        }
      });
      onUpdate(products);
    },
    (error) => {
      console.error('Firestore products subscription error:', error);
    }
  );
  return unsubscribe;
}

// -------------------------------------------------------------
// Outward Delivery Challans Cloud Operations
// -------------------------------------------------------------

/**
 * Sanitizes delivery challan data before sending to Firestore, ensuring NO undefined values exist.
 * Firestore will reject any document containing undefined properties.
 */
export function sanitizeChallanForFirestore(challan: DeliveryChallan): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(challan.id),
    challanNumber: String(challan.challanNumber || ''),
    date: String(challan.date || ''),
    time: String(challan.time || ''),
    sourceUnit: String(challan.sourceUnit || ''),
    destinationUnit: String(challan.destinationUnit || ''),
    orderId: String(challan.orderId || ''),
    orderTitle: String(challan.orderTitle || ''),
    orderIds: Array.isArray(challan.orderIds)
      ? challan.orderIds.map(String)
      : [String(challan.orderId || '')],
    orderTitles: Array.isArray(challan.orderTitles)
      ? challan.orderTitles.map(String)
      : [String(challan.orderTitle || '')],
    items: (challan.items || []).map((item) => {
      const it: Record<string, any> = {
        id: String(item.id),
        orderId: String(item.orderId || ''),
        orderTitle: String(item.orderTitle || ''),
        productCode: String(item.productCode || ''),
        productName: String(item.productName || ''),
        salesOrderNo: String(item.salesOrderNo || ''),
        category: String(item.category || 'LAMINATION'),
        partName: String(item.partName || ''),
        dimensions: String(item.dimensions || ''),
        totalOrderQty: Number(item.totalOrderQty) || 0,
        alreadyDispatchedQty: Number(item.alreadyDispatchedQty) || 0,
        dispatchingNowQty: Number(item.dispatchingNowQty) || 0,
        woodType: String(item.woodType || ''),
        remarks: String(item.remarks || ''),
        palletNumber: Number(item.palletNumber) || 1,
        isSplitPart: Boolean(item.isSplitPart),
        isCustomItem: Boolean(item.isCustomItem)
      };
      if (item.baseItemId) it.baseItemId = String(item.baseItemId);
      if (item.customerName) it.customerName = String(item.customerName);
      if (item.splitDetails) {
        it.splitDetails = {
          p1: Number(item.splitDetails.p1) || 0,
          p2: Number(item.splitDetails.p2) || 0,
          total: Number(item.splitDetails.total) || 0,
          ...(item.splitDetails.originalTotalQty !== undefined
            ? { originalTotalQty: Number(item.splitDetails.originalTotalQty) }
            : {})
        };
      }
      return it;
    }),
    pallets: (challan.pallets || []).map((p) => ({
      id: Number(p.id) || 1,
      name: String(p.name || ''),
      label: String(p.label || ''),
      notes: String(p.notes || '')
    })),
    palletCount: Number(challan.palletCount) || (challan.pallets ? challan.pallets.length : 1),
    palletPhotos: Array.isArray(challan.palletPhotos) ? challan.palletPhotos : [],
    driverName: String(challan.driverName || ''),
    vehicleNumber: String(challan.vehicleNumber || ''),
    notes: String(challan.notes || ''),
    status: String(challan.status || 'DISPATCHED'),
    createdAt: challan.createdAt || new Date().toISOString(),
    updatedAt: challan.updatedAt || new Date().toISOString()
  };

  // Strip any remaining undefined keys
  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) {
      delete clean[k];
    }
  });

  return clean;
}

export async function syncChallanToFirestore(challan: DeliveryChallan): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const cleanChallan = sanitizeChallanForFirestore(challan);
  const challanRef = doc(dbInstance, FIRESTORE_CHALLANS_COLLECTION, cleanChallan.id);
  await setDoc(challanRef, cleanChallan, { merge: true });
}

export async function batchSyncChallansToFirestore(challans: DeliveryChallan[]): Promise<void> {
  if (!isFirebaseReady() || !dbInstance || challans.length === 0) return;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < challans.length; i += CHUNK_SIZE) {
    const chunk = challans.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);
    for (const ch of chunk) {
      const clean = sanitizeChallanForFirestore(ch);
      const ref = doc(dbInstance, FIRESTORE_CHALLANS_COLLECTION, clean.id);
      batch.set(ref, clean, { merge: true });
    }
    await batch.commit();
  }
}

export async function deleteChallanFromFirestore(challanId: string): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const challanRef = doc(dbInstance, FIRESTORE_CHALLANS_COLLECTION, challanId);
  await deleteDoc(challanRef);
}

export async function fetchAllChallansFromFirestore(): Promise<DeliveryChallan[]> {
  if (!isFirebaseReady() || !dbInstance) return [];
  const querySnapshot = await getDocs(collection(dbInstance, FIRESTORE_CHALLANS_COLLECTION));
  const challans: DeliveryChallan[] = [];
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== 'connection_test_ping') {
      const data = docSnap.data() as any;
      challans.push({
        id: docSnap.id,
        challanNumber: data.challanNumber || '',
        date: data.date || '',
        time: data.time || '',
        sourceUnit: data.sourceUnit || '',
        destinationUnit: data.destinationUnit || '',
        orderId: data.orderId || '',
        orderTitle: data.orderTitle || '',
        orderIds: Array.isArray(data.orderIds) ? data.orderIds : [data.orderId || ''],
        orderTitles: Array.isArray(data.orderTitles) ? data.orderTitles : [data.orderTitle || ''],
        items: Array.isArray(data.items) ? data.items : [],
        pallets: Array.isArray(data.pallets) ? data.pallets : [],
        palletCount: Number(data.palletCount) || 1,
        palletPhotos: Array.isArray(data.palletPhotos) ? data.palletPhotos : [],
        driverName: data.driverName || '',
        vehicleNumber: data.vehicleNumber || '',
        notes: data.notes || '',
        status: data.status || 'DISPATCHED',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    }
  });
  // Sort descending by date/createdAt
  challans.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  return challans;
}

export function subscribeToFirestoreChallans(onUpdate: (challans: DeliveryChallan[]) => void): () => void {
  if (!isFirebaseReady() || !dbInstance) {
    return () => {};
  }
  const unsubscribe = onSnapshot(
    collection(dbInstance, FIRESTORE_CHALLANS_COLLECTION),
    (snapshot) => {
      const challans: DeliveryChallan[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== 'connection_test_ping') {
          const data = docSnap.data() as any;
          challans.push({
            id: docSnap.id,
            challanNumber: data.challanNumber || '',
            date: data.date || '',
            time: data.time || '',
            sourceUnit: data.sourceUnit || '',
            destinationUnit: data.destinationUnit || '',
            orderId: data.orderId || '',
            orderTitle: data.orderTitle || '',
            orderIds: Array.isArray(data.orderIds) ? data.orderIds : [data.orderId || ''],
            orderTitles: Array.isArray(data.orderTitles) ? data.orderTitles : [data.orderTitle || ''],
            items: Array.isArray(data.items) ? data.items : [],
            pallets: Array.isArray(data.pallets) ? data.pallets : [],
            palletCount: Number(data.palletCount) || 1,
            palletPhotos: Array.isArray(data.palletPhotos) ? data.palletPhotos : [],
            driverName: data.driverName || '',
            vehicleNumber: data.vehicleNumber || '',
            notes: data.notes || '',
            status: data.status || 'DISPATCHED',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        }
      });
      challans.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      onUpdate(challans);
    },
    (error) => {
      console.error('Firestore challans subscription error:', error);
    }
  );
  return unsubscribe;
}

// -------------------------------------------------------------
// Factory Orders Cloud Operations
// -------------------------------------------------------------

export function sanitizeOrderForFirestore(order: FactoryOrder): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(order.id),
    orderNumber: String(order.orderNumber || ''),
    salesOrderNo: String(order.salesOrderNo || order.orderNumber || ''),
    productId: String(order.productId || ''),
    productName: String(order.productName || ''),
    productCode: String(order.productCode || ''),
    customerName: String(order.customerName || ''),
    productImage: String(order.productImage || ''),
    quantity: Number(order.quantity) || 0,
    title: String(order.title || ''),
    date: String(order.date || ''),
    notes: String(order.notes || ''),
    status: String(order.status || 'PENDING'),
    laminationItems: (order.laminationItems || []).map((lam) => ({
      id: String(lam.id),
      partName: String(lam.partName || ''),
      length: Number(lam.length) || 0,
      width: Number(lam.width) || 0,
      thickness: Number(lam.thickness) || 0,
      quantityNeeded: Number(lam.quantityNeeded) || 0,
      woodType: String(lam.woodType || ''),
      remarks: String(lam.remarks || '')
    })),
    frameItems: (order.frameItems || []).map((frm) => ({
      id: String(frm.id),
      partName: String(frm.partName || ''),
      size: String(frm.size || ''),
      quantity: Number(frm.quantity) || 0,
      woodType: String(frm.woodType || ''),
      remarks: String(frm.remarks || '')
    }))
  };

  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) {
      delete clean[k];
    }
  });

  return clean;
}

export async function syncOrderToFirestore(order: FactoryOrder): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const cleanOrder = sanitizeOrderForFirestore(order);
  const orderRef = doc(dbInstance, FIRESTORE_ORDERS_COLLECTION, cleanOrder.id);
  await setDoc(orderRef, cleanOrder, { merge: true });
}

export async function batchSyncOrdersToFirestore(orders: FactoryOrder[]): Promise<void> {
  if (!isFirebaseReady() || !dbInstance || orders.length === 0) return;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
    const chunk = orders.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);
    for (const ord of chunk) {
      const clean = sanitizeOrderForFirestore(ord);
      const ref = doc(dbInstance, FIRESTORE_ORDERS_COLLECTION, clean.id);
      batch.set(ref, clean, { merge: true });
    }
    await batch.commit();
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const orderRef = doc(dbInstance, FIRESTORE_ORDERS_COLLECTION, orderId);
  await deleteDoc(orderRef);
}

export async function fetchAllOrdersFromFirestore(): Promise<FactoryOrder[]> {
  if (!isFirebaseReady() || !dbInstance) return [];
  const querySnapshot = await getDocs(collection(dbInstance, FIRESTORE_ORDERS_COLLECTION));
  const orders: FactoryOrder[] = [];
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== 'connection_test_ping') {
      const data = docSnap.data() as any;
      orders.push({
        id: docSnap.id,
        orderNumber: data.orderNumber || '',
        salesOrderNo: data.salesOrderNo || '',
        productId: data.productId || '',
        productName: data.productName || '',
        productCode: data.productCode || '',
        customerName: data.customerName || '',
        productImage: data.productImage || '',
        quantity: Number(data.quantity) || 0,
        title: data.title || '',
        date: data.date || '',
        notes: data.notes || '',
        status: data.status || 'PENDING',
        laminationItems: Array.isArray(data.laminationItems) ? data.laminationItems : [],
        frameItems: Array.isArray(data.frameItems) ? data.frameItems : []
      });
    }
  });
  return orders;
}

export function subscribeToFirestoreOrders(onUpdate: (orders: FactoryOrder[]) => void): () => void {
  if (!isFirebaseReady() || !dbInstance) {
    return () => {};
  }
  const unsubscribe = onSnapshot(
    collection(dbInstance, FIRESTORE_ORDERS_COLLECTION),
    (snapshot) => {
      const orders: FactoryOrder[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== 'connection_test_ping') {
          const data = docSnap.data() as any;
          orders.push({
            id: docSnap.id,
            orderNumber: data.orderNumber || '',
            salesOrderNo: data.salesOrderNo || '',
            productId: data.productId || '',
            productName: data.productName || '',
            productCode: data.productCode || '',
            customerName: data.customerName || '',
            productImage: data.productImage || '',
            quantity: Number(data.quantity) || 0,
            title: data.title || '',
            date: data.date || '',
            notes: data.notes || '',
            status: data.status || 'PENDING',
            laminationItems: Array.isArray(data.laminationItems) ? data.laminationItems : [],
            frameItems: Array.isArray(data.frameItems) ? data.frameItems : []
          });
        }
      });
      onUpdate(orders);
    },
    (error) => {
      console.error('Firestore orders subscription error:', error);
    }
  );
  return unsubscribe;
}

// -------------------------------------------------------------
// Manual Sent Adjustments Cloud Operations
// -------------------------------------------------------------

export async function syncManualAdjustmentsToFirestore(adjustments: Record<string, number>): Promise<void> {
  if (!isFirebaseReady() || !dbInstance) return;
  const docRef = doc(dbInstance, FIRESTORE_CHALLANS_SETTINGS_COLLECTION, 'manual_sent_adjustments');
  await setDoc(docRef, { adjustments: adjustments || {}, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function fetchManualAdjustmentsFromFirestore(): Promise<Record<string, number> | null> {
  if (!isFirebaseReady() || !dbInstance) return null;
  const querySnapshot = await getDocs(collection(dbInstance, FIRESTORE_CHALLANS_SETTINGS_COLLECTION));
  let result: Record<string, number> | null = null;
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id === 'manual_sent_adjustments') {
      result = docSnap.data().adjustments || {};
    }
  });
  return result;
}

export function subscribeToFirestoreManualAdjustments(
  onUpdate: (adjustments: Record<string, number>) => void
): () => void {
  if (!isFirebaseReady() || !dbInstance) {
    return () => {};
  }
  const unsubscribe = onSnapshot(
    collection(dbInstance, FIRESTORE_CHALLANS_SETTINGS_COLLECTION),
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        if (docSnap.id === 'manual_sent_adjustments') {
          const data = docSnap.data();
          if (data && data.adjustments) {
            onUpdate(data.adjustments);
          }
        }
      });
    },
    (error) => {
      console.error('Firestore manual adjustments subscription error:', error);
    }
  );
  return unsubscribe;
}


