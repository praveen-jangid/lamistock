import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { LaminatedPanel } from '../types/panel';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const FIREBASE_CONFIG_STORAGE_KEY = 'lamination_firebase_config';
const LEGACY_STORAGE_KEY = 'factory_mango_wood_firebase_config';

export const FIRESTORE_PANELS_COLLECTION = 'lamination_panels';
export const FIREBASE_STORAGE_PANELS_PATH = 'lamination_panels';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    let raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (!raw) {
      // Check legacy key if available and migrate seamlessly
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, raw);
      }
    }
    if (raw) return JSON.parse(raw);

    // Also support environment variables (e.g. in .env file)
    const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
    if (envApiKey && envProjectId) {
      return {
        apiKey: envApiKey,
        authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        projectId: envProjectId,
        storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
        messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ''
      };
    }

    return null;
  } catch (e) {
    console.error('Error reading Firebase config from storage', e);
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig | null): void {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    appInstance = null;
    dbInstance = null;
    storageInstance = null;
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
    const testDocRef = doc(dbInstance, FIRESTORE_PANELS_COLLECTION, '__connection_test__');
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
    if (docSnap.id !== '__connection_test__') {
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
        if (docSnap.id !== '__connection_test__') {
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
