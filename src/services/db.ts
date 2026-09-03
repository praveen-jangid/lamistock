import Dexie, { type Table } from 'dexie';
import type { LaminatedPanel } from '../types/panel';
import {
  isFirebaseReady,
  syncPanelToFirestore,
  deletePanelFromFirestore,
  fetchAllPanelsFromFirestore,
  subscribeToFirestorePanels,
  uploadLaminateImage
} from './firebase';

class FactoryLaminationDatabase extends Dexie {
  panels!: Table<LaminatedPanel, string>;

  constructor() {
    super('LaminationPanelsDB');
    this.version(1).stores({
      panels: 'id, length, width, thickness, woodType, quantity, createdAt'
    });
  }
}

export const localDb = new FactoryLaminationDatabase();

// Clean up legacy database and purge mock panels if any exist
async function cleanupLegacyMockData() {
  try {
    // Delete legacy IndexedDB if present
    await Dexie.delete('FactoryMangoWoodDB');
  } catch {
    // Ignore if not present
  }

  try {
    // Remove any legacy mock panels from current DB
    const allPanels = await localDb.panels.toArray();
    const mockIds = allPanels
      .filter((p) => p.id.startsWith('mango-'))
      .map((p) => p.id);

    if (mockIds.length > 0) {
      await localDb.panels.bulkDelete(mockIds);
    }
  } catch (err) {
    console.warn('Error purging legacy mock panels:', err);
  }
}

// Initialize DB without dummy seed data
export async function initializeDatabase(): Promise<LaminatedPanel[]> {
  await cleanupLegacyMockData();

  if (isFirebaseReady()) {
    try {
      const remotePanels = await fetchAllPanelsFromFirestore();
      if (remotePanels.length > 0) {
        await localDb.panels.bulkPut(remotePanels);
        return remotePanels;
      }
    } catch (e) {
      console.warn('Could not fetch panels from Firestore:', e);
    }
  }

  // Return clean list of real stored panels (or empty array if brand new)
  return await localDb.panels.toArray();
}

export async function getAllPanels(): Promise<LaminatedPanel[]> {
  return await localDb.panels.toArray();
}

export async function savePanel(
  panel: LaminatedPanel,
  frontImageBase64?: string,
  backImageBase64?: string
): Promise<LaminatedPanel> {
  const updatedPanel = { ...panel, updatedAt: new Date().toISOString() };

  if (frontImageBase64 && frontImageBase64.startsWith('data:')) {
    const uploadedUrl = await uploadLaminateImage(frontImageBase64, panel.id, 'front');
    updatedPanel.frontImageUrl = uploadedUrl;
  }

  if (backImageBase64 && backImageBase64.startsWith('data:')) {
    const uploadedUrl = await uploadLaminateImage(backImageBase64, panel.id, 'back');
    updatedPanel.backImageUrl = uploadedUrl;
  }

  // 1. Save to local Dexie IndexedDB
  await localDb.panels.put(updatedPanel);

  // 2. Sync to Firebase if connected
  if (isFirebaseReady()) {
    try {
      await syncPanelToFirestore(updatedPanel);
    } catch (e) {
      console.warn('Failed syncing panel to Firestore, saved locally:', e);
    }
  }

  return updatedPanel;
}

export async function deletePanel(panelId: string): Promise<void> {
  await localDb.panels.delete(panelId);
  if (isFirebaseReady()) {
    try {
      await deletePanelFromFirestore(panelId);
    } catch (e) {
      console.warn('Failed deleting panel from Firestore:', e);
    }
  }
}

export async function bulkImportPanels(panels: LaminatedPanel[], replace: boolean = false): Promise<void> {
  if (replace) {
    await localDb.panels.clear();
  }
  await localDb.panels.bulkPut(panels);
  if (isFirebaseReady()) {
    for (const p of panels) {
      await syncPanelToFirestore(p);
    }
  }
}

// Subscribe to real-time changes
export function setupRealtimeSync(onPanelsUpdated: (panels: LaminatedPanel[]) => void): () => void {
  if (isFirebaseReady()) {
    return subscribeToFirestorePanels(async (remotePanels) => {
      // Keep local Dexie cache synchronized with Firestore
      await localDb.panels.clear();
      if (remotePanels.length > 0) {
        await localDb.panels.bulkPut(remotePanels);
      }
      onPanelsUpdated(remotePanels);
    });
  }
  return () => {};
}
