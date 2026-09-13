import Dexie, { type Table } from 'dexie';
import type { Product, WoodPlan } from '../types/product';
import {
  isFirebaseReady,
  syncProductToFirestore,
  deleteProductFromFirestore,
  fetchAllProductsFromFirestore,
  subscribeToFirestoreProducts,
  uploadProductImage
} from './firebase';

const PRODUCTS_LOCALSTORAGE_KEY = 'lamistock_products_master';

class ProductsDatabase extends Dexie {
  products!: Table<Product, string>;

  constructor() {
    super('LamiStockProductsDB');
    this.version(1).stores({
      products: 'id, name, code, customerName, createdAt, updatedAt'
    });
  }
}

export const localProductDb = new ProductsDatabase();

// Default initial product seed so the factory has an immediate working example
export const INITIAL_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-bunton-desk',
    name: 'Bunton Desk',
    code: 'BS-BUN-06',
    customerName: 'APL',
    description: 'Executive wooden desk with fluting finish and slide-out drawers.',
    photoUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    woodPlan: {
      id: 'plan-bs-bun-06',
      productId: 'prod-bunton-desk',
      sourceFileName: 'BS-BUN-06 DESK.xlsx',
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Standard cutting specs extracted from official factory Excel BOM.',
      laminationItems: [
        {
          id: 'lam-1',
          partName: 'Dra. Face',
          qtyPerUnit: 1,
          length: 27,
          width: 15.75,
          thickness: 1.0,
          rawSize: '27″ × 15″-6′′′ × 1″',
          woodType: 'Mango Wood',
          remarks: 'Fluting finish'
        },
        {
          id: 'lam-2',
          partName: 'Back',
          qtyPerUnit: 1,
          length: 27,
          width: 15.75,
          thickness: 0.625,
          rawSize: '27″ × 15″-6′′′ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Fluting (5 soot)'
        },
        {
          id: 'lam-3',
          partName: 'Side Panel A',
          qtyPerUnit: 1,
          length: 28.625,
          width: 23.25,
          thickness: 0.625,
          rawSize: '28″-5′′′ × 23″-2′′′ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Plain edge'
        },
        {
          id: 'lam-4',
          partName: 'Side Panel B',
          qtyPerUnit: 1,
          length: 27,
          width: 21.625,
          thickness: 0.625,
          rawSize: '27″ × 21″-5′′′ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Plain edge'
        },
        {
          id: 'lam-5',
          partName: 'Dra. Side',
          qtyPerUnit: 6,
          length: 15.75,
          width: 7,
          thickness: 0.625,
          rawSize: '15″-6′′′ × 7″ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'lam-6',
          partName: 'Dra. Face',
          qtyPerUnit: 3,
          length: 14.375,
          width: 7,
          thickness: 0.625,
          rawSize: '14″-3′′′ × 7″ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'lam-7',
          partName: 'Dra. Back',
          qtyPerUnit: 3,
          length: 14.375,
          width: 6.25,
          thickness: 0.625,
          rawSize: '14″-3′′′ × 6″-2′′′ × 5′′′',
          woodType: 'Mango Wood',
          remarks: 'Plain'
        }
      ],
      frameItems: [
        {
          id: 'frm-1',
          partName: 'Side Fram',
          qtyPerUnit: 18,
          length: 28.5,
          width: 3.0,
          thickness: 0.75,
          rawSize: '28″-4′′′ × 3″ × 6′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Fluting'
        },
        {
          id: 'frm-2',
          partName: 'Side Fram',
          qtyPerUnit: 2,
          length: 28.5,
          width: 0.625,
          thickness: 0.75,
          rawSize: '28″-4′′′ × 5′′′ × 6′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Fluting'
        },
        {
          id: 'frm-3',
          partName: 'Side Fram (CNC)',
          qtyPerUnit: 6,
          length: 22.0,
          width: 3.5,
          thickness: 0.75,
          rawSize: '22″ × 3″-4′′′ × 6′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'CNC'
        },
        {
          id: 'frm-4',
          partName: 'F. Frame',
          qtyPerUnit: 2,
          length: 27.25,
          width: 3.625,
          thickness: 1.0,
          rawSize: '27″-2′′′ × 3″-5′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Fluting'
        },
        {
          id: 'frm-5',
          partName: 'Dra. Side',
          qtyPerUnit: 2,
          length: 16.5,
          width: 2.5,
          thickness: 0.625,
          rawSize: '16″-4′′′ × 2″-4′′′ × 5′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-6',
          partName: 'Dra Face',
          qtyPerUnit: 1,
          length: 24.0,
          width: 2.5,
          thickness: 0.625,
          rawSize: '24″ × 2″-4′′′ × 5′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-7',
          partName: 'Dra Back',
          qtyPerUnit: 1,
          length: 23.25,
          width: 1.875,
          thickness: 0.625,
          rawSize: '23″-2′′′ × 1″-7′′′ × 5′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-8',
          partName: 'Channel',
          qtyPerUnit: 2,
          length: 16.0,
          width: 1.25,
          thickness: 0.75,
          rawSize: '16″ × 1″-2′′′ × 6′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-9',
          partName: 'Frame',
          qtyPerUnit: 2,
          length: 22.5,
          width: 3.625,
          thickness: 1.0,
          rawSize: '22″-4′′′ × 3″-5′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-10',
          partName: 'Channel',
          qtyPerUnit: 6,
          length: 16.5,
          width: 1.25,
          thickness: 0.75,
          rawSize: '16″-4′′′ × 1″-2′′′ × 6′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-11',
          partName: 'Sketing',
          qtyPerUnit: 2,
          length: 18.0,
          width: 2.625,
          thickness: 1.0,
          rawSize: '18″ × 2″-5′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-12',
          partName: 'Sketing',
          qtyPerUnit: 1,
          length: 19.5,
          width: 1.625,
          thickness: 1.0,
          rawSize: '19″-4′′′ × 1″-5′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-13',
          partName: 'Sketing (CNC)',
          qtyPerUnit: 1,
          length: 20.625,
          width: 3.5,
          thickness: 1.625,
          rawSize: '20″-5′′′ × 3″-4′′′ × 1″-5′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'CNC'
        },
        {
          id: 'frm-14',
          partName: 'Patti',
          qtyPerUnit: 1,
          length: 24.0,
          width: 2.5,
          thickness: 0.625,
          rawSize: '24″ × 2″-4′′′ × 5′′′',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-15',
          partName: 'Top Frame',
          qtyPerUnit: 2,
          length: 15.125,
          width: 1.5,
          thickness: 1.0,
          rawSize: '15″-1′′′ × 1″-4′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        },
        {
          id: 'frm-16',
          partName: 'Top Frame',
          qtyPerUnit: 2,
          length: 20.625,
          width: 1.5,
          thickness: 1.0,
          rawSize: '20″-5′′′ × 1″-4′′′ × 1″',
          woodType: 'Solid Mango Wood',
          remarks: 'Plain'
        }
      ]
    }
  }
];

function saveToLocalStorageBackup(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_LOCALSTORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Could not cache products to localStorage:', e);
  }
}

function getFromLocalStorageBackup(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_LOCALSTORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return [];
}

/**
 * Initializes products database from IndexedDB, Firestore, or seed data.
 */
export async function initializeProductsDatabase(): Promise<Product[]> {
  try {
    let local = await localProductDb.products.toArray();

    // If IndexedDB is empty, check localStorage cache
    if (local.length === 0) {
      const backup = getFromLocalStorageBackup();
      if (backup.length > 0) {
        await localProductDb.products.bulkPut(backup);
        local = backup;
      }
    }

    // Cloud synchronization if Firebase is available
    if (isFirebaseReady()) {
      try {
        const remote = await fetchAllProductsFromFirestore();
        if (remote.length > 0) {
          await localProductDb.products.bulkPut(remote);
          saveToLocalStorageBackup(remote);
          return remote;
        } else if (local.length > 0) {
          // Upload local products up to cloud
          for (const p of local) {
            await syncProductToFirestore(p);
          }
          return local;
        }
      } catch (err) {
        console.warn('Could not sync products with Firestore:', err);
      }
    }

    // If completely empty, seed with initial product
    if (local.length === 0) {
      await localProductDb.products.bulkPut(INITIAL_SEED_PRODUCTS);
      saveToLocalStorageBackup(INITIAL_SEED_PRODUCTS);
      if (isFirebaseReady()) {
        for (const p of INITIAL_SEED_PRODUCTS) {
          try {
            await syncProductToFirestore(p);
          } catch {
            // Ignore error
          }
        }
      }
      return INITIAL_SEED_PRODUCTS;
    }

    return local;
  } catch (err) {
    console.error('Error initializing products database:', err);
    return INITIAL_SEED_PRODUCTS;
  }
}

export function getStoredProductsSync(): Product[] {
  const fromStorage = getFromLocalStorageBackup();
  if (fromStorage.length > 0) return fromStorage;
  return INITIAL_SEED_PRODUCTS;
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const prods = await localProductDb.products.toArray();
    if (prods.length > 0) return prods;
  } catch (e) {
    console.warn('Error reading from local products DB:', e);
  }
  return getFromLocalStorageBackup();
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const prod = await localProductDb.products.get(productId);
    if (prod) return prod;
  } catch {
    // fallback
  }
  const all = getFromLocalStorageBackup();
  return all.find((p) => p.id === productId) || null;
}

export async function saveProduct(
  product: Product,
  photoBase64?: string
): Promise<Product> {
  const updatedProduct: Product = {
    ...product,
    updatedAt: new Date().toISOString()
  };

  // If new photo provided, upload or retain base64
  if (photoBase64 && photoBase64.startsWith('data:')) {
    try {
      const uploadedUrl = await uploadProductImage(photoBase64, updatedProduct.id);
      updatedProduct.photoUrl = uploadedUrl;
    } catch (err) {
      console.warn('Failed uploading product image to cloud:', err);
      updatedProduct.photoUrl = photoBase64;
    }
  }

  // 1. Save to local IndexedDB
  await localProductDb.products.put(updatedProduct);

  // 2. Update localStorage backup
  const current = await localProductDb.products.toArray();
  saveToLocalStorageBackup(current);

  // 3. Sync to Firebase Firestore
  if (isFirebaseReady()) {
    try {
      await syncProductToFirestore(updatedProduct);
    } catch (err) {
      console.warn('Failed syncing product to Firestore:', err);
    }
  }

  return updatedProduct;
}

export async function deleteProduct(productId: string): Promise<void> {
  await localProductDb.products.delete(productId);

  const current = await localProductDb.products.toArray();
  saveToLocalStorageBackup(current);

  if (isFirebaseReady()) {
    try {
      await deleteProductFromFirestore(productId);
    } catch (err) {
      console.warn('Failed deleting product from Firestore:', err);
    }
  }
}

/**
 * Saves or updates a Wood Plan directly for a given product.
 * Once saved, the product permanently retains the lamination and frame sizes.
 */
export async function saveWoodPlanForProduct(
  productId: string,
  woodPlan: WoodPlan
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found.`);
  }

  const updatedProduct: Product = {
    ...product,
    woodPlan: {
      ...woodPlan,
      productId,
      updatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  return await saveProduct(updatedProduct);
}

/**
 * Sets up real-time sync with Firestore for products
 */
export function setupProductsRealtimeSync(
  onProductsUpdated: (products: Product[]) => void
): () => void {
  if (isFirebaseReady()) {
    return subscribeToFirestoreProducts(async (remoteProducts) => {
      const local = await localProductDb.products.toArray();

      if (remoteProducts.length === 0 && local.length > 0) {
        for (const p of local) {
          try {
            await syncProductToFirestore(p);
          } catch {
            // Ignore error
          }
        }
        onProductsUpdated(local);
        return;
      }

      await localProductDb.products.clear();
      if (remoteProducts.length > 0) {
        await localProductDb.products.bulkPut(remoteProducts);
        saveToLocalStorageBackup(remoteProducts);
      }
      onProductsUpdated(remoteProducts);
    });
  }
  return () => {};
}
