import React, { useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import {
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import {
  downloadAndApplyUpdate,
  restartApp,
  type UpdateProgress
} from '../services/updater';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  update: Update | null;
  currentVersion: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  update,
  currentVersion
}) => {
  const [progress, setProgress] = useState<UpdateProgress>({
    totalBytes: 0,
    downloadedBytes: 0,
    percent: 0,
    status: 'idle'
  });

  if (!isOpen || !update) return null;

  const targetVersion = update.version;
  const releaseNotes = update.body || 'Performance improvements and bug fixes.';
  const releaseDate = update.date
    ? new Date(update.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleStartUpdate = async () => {
    try {
      await downloadAndApplyUpdate(update, (p) => {
        setProgress(p);
      });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleRestart = async () => {
    await restartApp();
  };

  const isWorking = progress.status === 'downloading' || progress.status === 'installing';
  const isReady = progress.status === 'ready';
  const isError = progress.status === 'error';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 p-6 text-white relative">
          {!isWorking && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-emerald-300 shadow-inner flex-shrink-0">
              <Sparkles size={26} className="animate-pulse" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 mb-1">
                New Version Available
              </span>
              <h2 id="update-modal-title" className="text-xl font-bold tracking-tight text-white">
                Update LamiStock
              </h2>
            </div>
          </div>

          {/* Version Pill Transition */}
          <div className="mt-4 flex items-center gap-2.5 bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
            <span className="text-xs font-medium text-indigo-100">Current:</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-mono font-bold text-white">
              v{currentVersion}
            </span>
            <ArrowRight size={14} className="text-emerald-300" />
            <span className="text-xs font-medium text-emerald-100">Latest:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-slate-900 text-xs font-mono font-bold shadow-xs">
              v{targetVersion}
            </span>
            {releaseDate && (
              <span className="text-[11px] text-white/60 ml-auto hidden sm:inline">
                {releaseDate}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Release Notes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              What's New in v{targetVersion}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-sm text-slate-700 font-normal leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {releaseNotes}
            </div>
          </div>

          {/* Progress / Status Display */}
          {isWorking && (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  {progress.status === 'downloading'
                    ? 'Downloading update package...'
                    : 'Extracting and installing update...'}
                </span>
                <span>{progress.percent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-indigo-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {progress.totalBytes > 0 && (
                <div className="text-[11px] text-indigo-600 font-mono text-right">
                  {formatBytes(progress.downloadedBytes)} / {formatBytes(progress.totalBytes)}
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {isReady && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-bold text-emerald-950">Update Installed Successfully!</h4>
                <p className="text-emerald-800 text-xs mt-0.5">
                  Restart LamiStock now to start using version {targetVersion}.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-bold text-rose-950">Update Failed</h4>
                <p className="text-rose-800 text-xs mt-0.5">
                  {progress.error || 'An error occurred while installing the update.'}
                </p>
                <a
                  href="https://github.com/praveen-jangid/lamistock/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 underline font-semibold mt-2"
                >
                  Download installer manually from GitHub
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          {!isWorking && !isReady && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
            >
              Remind Me Later
            </button>
          )}

          {progress.status === 'idle' && (
            <button
              type="button"
              onClick={handleStartUpdate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
            >
              <Download size={15} />
              Update Now
            </button>
          )}

          {isWorking && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-300 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed"
            >
              <Loader2 size={15} className="animate-spin" />
              {progress.status === 'downloading' ? 'Downloading...' : 'Installing...'}
            </button>
          )}

          {isReady && (
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
            >
              <RotateCcw size={15} />
              Restart Now
            </button>
          )}

          {isError && (
            <button
              type="button"
              onClick={handleStartUpdate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
            >
              <RotateCcw size={15} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
