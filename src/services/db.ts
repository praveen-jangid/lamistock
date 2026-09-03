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
      const localPanels = await localDb.panels.toArray();

      if (remotePanels.length > 0) {
        await localDb.panels.bulkPut(remotePanels);
        return remotePanels;
      } else if (localPanels.length > 0) {
        // Auto-migrate any local panels to Firestore if Firestore is currently empty
        console.log(`Auto-migrating ${localPanels.length} local panel(s) up to Firestore...`);
        for (const p of localPanels) {
          try {
            await syncPanelToFirestore(p);
          } catch (err) {
            console.warn('Failed auto-syncing local panel to Firestore:', err);
          }
        }
        return localPanels;
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
  const updatedPanel: LaminatedPanel = {
    ...panel,
    frontImageUrl: panel.frontImageUrl || '',
    backImageUrl: panel.backImageUrl || '',
    notes: panel.notes || '',
    updatedAt: new Date().toISOString()
  };

  if (frontImageBase64 && frontImageBase64.startsWith('data:')) {
    try {
      const uploadedUrl = await uploadLaminateImage(frontImageBase64, panel.id, 'front');
      updatedPanel.frontImageUrl = uploadedUrl;
    } catch (err) {
      console.warn('Firebase front image upload failed:', err);
    }
  }

  if (backImageBase64 && backImageBase64.startsWith('data:')) {
    try {
      const uploadedUrl = await uploadLaminateImage(backImageBase64, panel.id, 'back');
      updatedPanel.backImageUrl = uploadedUrl;
    } catch (err) {
      console.warn('Firebase back image upload failed:', err);
    }
  }

  // 1. Save to local Dexie IndexedDB first
  await localDb.panels.put(updatedPanel);

  // 2. Sync to Firebase Firestore if connected
  if (isFirebaseReady()) {
    try {
      await syncPanelToFirestore(updatedPanel);
      console.log('Successfully saved and synced panel to Firestore:', updatedPanel.id);
    } catch (e: any) {
      console.error('Failed syncing panel to Firestore:', e);
      throw new Error(`Firestore Sync Error: ${e?.message || 'Could not save to Firestore'}`);
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
  const cleanPanels = panels.map((p) => ({
    ...p,
    frontImageUrl: p.frontImageUrl || '',
    backImageUrl: p.backImageUrl || '',
    notes: p.notes || ''
  }));
  await localDb.panels.bulkPut(cleanPanels);
  if (isFirebaseReady()) {
    for (const p of cleanPanels) {
      try {
        await syncPanelToFirestore(p);
      } catch (err) {
        console.warn('Bulk sync to Firestore item failed:', err);
      }
    }
  }
}

// Subscribe to real-time changes
export function setupRealtimeSync(onPanelsUpdated: (panels: LaminatedPanel[]) => void): () => void {
  if (isFirebaseReady()) {
    return subscribeToFirestorePanels(async (remotePanels) => {
      const localPanels = await localDb.panels.toArray();

      // If remote is empty, but local has panels, don't wipe them! Push them up to Firestore.
      if (remotePanels.length === 0 && localPanels.length > 0) {
        console.log(`Preserving and uploading ${localPanels.length} local panels to empty Firestore...`);
        for (const p of localPanels) {
          try {
            await syncPanelToFirestore(p);
          } catch (err) {
            console.warn('Sync to Firestore failed:', err);
          }
        }
        onPanelsUpdated(localPanels);
        return;
      }

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
