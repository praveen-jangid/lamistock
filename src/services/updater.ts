import { isTauri } from '@tauri-apps/api/core';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

export interface UpdateProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
  status: 'idle' | 'downloading' | 'installing' | 'ready' | 'error';
  error?: string;
}

export interface CheckUpdateResult {
  isTauriApp: boolean;
  hasUpdate: boolean;
  update: Update | null;
  currentVersion: string;
  error?: string;
}

/**
 * Returns current application version safely in both Tauri and browser environments.
 */
export async function getCurrentAppVersion(): Promise<string> {
  if (isTauri()) {
    try {
      return await getVersion();
    } catch (e) {
      console.warn('[Updater] Failed to get native app version, falling back to 0.0.1:', e);
      return '0.0.1';
    }
  }
  return '0.0.1';
}

/**
 * Checks for updates from the configured GitHub release endpoint.
 * Returns null update if not running in Tauri or if already up-to-date.
 */
export async function checkForAppUpdates(): Promise<CheckUpdateResult> {
  if (!isTauri()) {
    return {
      isTauriApp: false,
      hasUpdate: false,
      update: null,
      currentVersion: '0.0.1',
    };
  }

  try {
    const currentVersion = await getCurrentAppVersion();
    const update = await check();

    if (update) {
      return {
        isTauriApp: true,
        hasUpdate: true,
        update,
        currentVersion: update.currentVersion || currentVersion,
      };
    }

    return {
      isTauriApp: true,
      hasUpdate: false,
      update: null,
      currentVersion,
    };
  } catch (err: any) {
    console.warn('[Updater] Check failed:', err);
    return {
      isTauriApp: true,
      hasUpdate: false,
      update: null,
      currentVersion: await getCurrentAppVersion(),
      error: err?.message || String(err),
    };
  }
}

/**
 * Downloads and applies the specified update with live progress tracking.
 */
export async function downloadAndApplyUpdate(
  update: Update,
  onProgress: (progress: UpdateProgress) => void
): Promise<void> {
  let downloadedBytes = 0;
  let totalBytes = 0;

  try {
    onProgress({
      totalBytes: 0,
      downloadedBytes: 0,
      percent: 0,
      status: 'downloading',
    });

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          totalBytes = event.data.contentLength ?? 0;
          onProgress({
            totalBytes,
            downloadedBytes: 0,
            percent: 0,
            status: 'downloading',
          });
          break;
        case 'Progress':
          downloadedBytes += event.data.chunkLength;
          const percent = totalBytes > 0
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : 0;
          onProgress({
            totalBytes,
            downloadedBytes,
            percent,
            status: 'downloading',
          });
          break;
        case 'Finished':
          onProgress({
            totalBytes,
            downloadedBytes: totalBytes || downloadedBytes,
            percent: 100,
            status: 'installing',
          });
          break;
      }
    });

    onProgress({
      totalBytes,
      downloadedBytes: totalBytes || downloadedBytes,
      percent: 100,
      status: 'ready',
    });
  } catch (err: any) {
    console.error('[Updater] Download & install failed:', err);
    onProgress({
      totalBytes,
      downloadedBytes,
      percent: 0,
      status: 'error',
      error: err?.message || 'Failed to download and install the update.',
    });
    throw err;
  }
}

/**
 * Relaunches the app to finalize update installation.
 */
export async function restartApp(): Promise<void> {
  if (isTauri()) {
    try {
      await relaunch();
    } catch (e) {
      console.error('[Updater] Failed to restart app:', e);
    }
  }
}
