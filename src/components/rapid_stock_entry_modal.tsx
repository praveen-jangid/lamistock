import React, { useState, useRef, useEffect } from 'react';
import type { LaminatedPanel } from '../types/panel';
import { compressImage, DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../services/image_compressor';
import { formatDimensions } from '../utils/units';
import {
  X,
  Camera,
  Check,
  RotateCw,
  Trash2,
  Settings,
  ArrowRight,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface RapidStockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePanel: (panel: LaminatedPanel, frontImgBase64?: string, backImgBase64?: string) => Promise<void>;
  onDeletePanel?: (panel: LaminatedPanel) => Promise<void>;
}

export const RapidStockEntryModal: React.FC<RapidStockEntryModalProps> = ({
  isOpen,
  onClose,
  onSavePanel,
  onDeletePanel
}) => {
  // Modal Step: 'defaults' (Step 1) or 'capture' (Step 2)
  const [step, setStep] = useState<'defaults' | 'capture'>('defaults');

  // Session Defaults (configured in Step 1)
  const [defaultThickness, setDefaultThickness] = useState<number>(0.675);
  const [defaultWoodType, setDefaultWoodType] = useState<string>('Mango Wood');
  const [defaultLocation, setDefaultLocation] = useState<string>('');

  // Active Board Inputs (Step 2)
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [currentThickness, setCurrentThickness] = useState<number>(0.675);
  const [currentWoodType, setCurrentWoodType] = useState<string>('Mango Wood');
  const [notes, setNotes] = useState<string>('');

  // Photos for Active Board
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [sessionPanels, setSessionPanels] = useState<LaminatedPanel[]>([]);
  const [isSessionListOpen, setIsSessionListOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // DOM Refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const frontGalleryInputRef = useRef<HTMLInputElement>(null);
  const backGalleryInputRef = useRef<HTMLInputElement>(null);
  const lengthInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus Length input when capture screen opens
  useEffect(() => {
    if (isOpen && step === 'capture') {
      setTimeout(() => {
        lengthInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, step]);

  // Sync active board thickness/wood whenever defaults change
  const handleStartSession = () => {
    if (defaultThickness <= 0) {
      alert('Please enter a valid positive thickness in inches.');
      return;
    }
    setCurrentThickness(defaultThickness);
    setCurrentWoodType(defaultWoodType);
    setStep('capture');
  };

  // Image capture handler via Android native camera
  const handlePhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
    face: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress immediately for smooth performance on Android
      const compressedDataUrl = await compressImage(file, 1000, 1000, 0.82);
      if (face === 'front') {
        setFrontImagePreview(compressedDataUrl);
      } else {
        setBackImagePreview(compressedDataUrl);
      }
    } catch (err) {
      console.error('Failed to compress photo:', err);
      alert('Could not process photo. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  // Save current board and stage next one
  const handleSaveAndAddNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const numL = parseFloat(length);
    const numW = parseFloat(width);

    if (isNaN(numL) || numL <= 0 || isNaN(numW) || numW <= 0) {
      alert('Please enter a valid decimal Length and Width in inches.');
      lengthInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const uniqueId = `panel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const combinedNotes = [
        defaultLocation ? `Rack: ${defaultLocation}` : '',
        notes ? notes.trim() : ''
      ]
        .filter(Boolean)
        .join(' • ');

      const newPanel: LaminatedPanel = {
        id: uniqueId,
        length: Number(Math.max(numL, numW).toFixed(3)),
        width: Number(Math.min(numL, numW).toFixed(3)),
        thickness: Number(currentThickness.toFixed(3)),
        woodType: currentWoodType.trim() || 'Mango Wood',
        quantity: 1,
        frontImageUrl: frontImagePreview || '',
        backImageUrl: backImagePreview || '',
        notes: combinedNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSavePanel(
        newPanel,
        frontImagePreview || undefined,
        backImagePreview || undefined
      );

      setSessionPanels((prev) => [newPanel, ...prev]);

      setFeedbackMessage(
        `✓ Board #${sessionPanels.length + 1} (${newPanel.length}″ × ${newPanel.width}″) saved!`
      );
      setTimeout(() => setFeedbackMessage(null), 2500);

      setLength('');
      setWidth('');
      setNotes('');
      setFrontImagePreview(null);
      setBackImagePreview(null);

      setTimeout(() => {
        lengthInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      console.error('Error saving board:', err);
      alert(`Could not save panel: ${err?.message || 'Check network / storage'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSessionBoard = async (panel: LaminatedPanel) => {
    if (!onDeletePanel) return;
    const confirmDel = window.confirm(`Remove board ${panel.length}″ × ${panel.width}″ from stock?`);
    if (!confirmDel) return;

    await onDeletePanel(panel);
    setSessionPanels((prev) => prev.filter((p) => p.id !== panel.id));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Camera Inputs (Forces system camera intent directly) */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={frontInputRef}
          className="hidden"
          onChange={(e) => handlePhotoCapture(e, 'front')}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={backInputRef}
          className="hidden"
          onChange={(e) => handlePhotoCapture(e, 'back')}
        />
        {/* Hidden Gallery Pickers (Without capture attribute) */}
        <input
          type="file"
          accept="image/*"
          ref={frontGalleryInputRef}
          className="hidden"
          onChange={(e) => handlePhotoCapture(e, 'front')}
        />
        <input
          type="file"
          accept="image/*"
          ref={backGalleryInputRef}
          className="hidden"
          onChange={(e) => handlePhotoCapture(e, 'back')}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                ⚡ Android Rapid Capture
              </span>
              {step === 'capture' && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-mono font-semibold">
                  {sessionPanels.length} Board{sessionPanels.length === 1 ? '' : 's'} Added
                </span>
              )}
            </div>
            <h2 className="text-base font-extrabold text-slate-900 m-0">
              {step === 'defaults'
                ? "🪵 Setup Today's Stock Session"
                : `📷 Adding Board #${sessionPanels.length + 1}`}
            </h2>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: SESSION DEFAULTS */}
        {step === 'defaults' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
              Adding multiple excess panels today? Pre-set default thickness and wood species once so you only need to type <strong>Length, Width</strong> and tap <strong>Front & Back Camera</strong> for each board.
            </div>

            <div className="space-y-4">
              {/* Thickness */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Default Thickness (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={defaultThickness}
                  onChange={(e) => setDefaultThickness(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 0.675"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
                  {[
                    { label: '0.675″ (5 Soot+)', val: 0.675 },
                    { label: '0.625″ (5 Soot)', val: 0.625 },
                    { label: '0.75″ (6 Soot)', val: 0.75 },
                    { label: '1.0″ (8 Soot)', val: 1.0 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                        defaultThickness === preset.val
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      onClick={() => setDefaultThickness(preset.val)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wood Species */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Default Wood Species: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={defaultWoodType}
                  onChange={(e) => setDefaultWoodType(e.target.value)}
                  placeholder="e.g. Mango Wood"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Species:</span>
                  {['Mango Wood', 'Sheesham', 'Acacia', 'Teak', 'Pine'].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        defaultWoodType.toLowerCase() === sp.toLowerCase()
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      onClick={() => setDefaultWoodType(sp)}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Session Rack / Bay Location (Optional):
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  placeholder="e.g. Unit 2 Rack 3, Bay A"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800">
                <AlertCircle size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Unique Board Tracking:</strong> Each board is saved with its own unique Firestore ID and individual photos. Identical dimensions remain distinct boards.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                onClick={handleStartSession}
              >
                <span>Start Adding Panels →</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RAPID ONE-BY-ONE CAPTURE */}
        {step === 'capture' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Session Defaults Pill Bar */}
            <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono font-semibold text-slate-800">
                  📏 <strong>{currentThickness}″</strong> Thk
                </span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-800">
                  🪵 <strong>{currentWoodType}</strong>
                </span>
                {defaultLocation && (
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-800">
                    📍 <strong>{defaultLocation}</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                onClick={() => setStep('defaults')}
                title="Change Session Defaults"
              >
                <Settings size={13} />
                <span>Edit Defaults</span>
              </button>
            </div>

            {/* Micro Feedback Toast */}
            {feedbackMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Active Board Form */}
            <form onSubmit={handleSaveAndAddNext} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    Length (Inches): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={lengthInputRef}
                    type="number"
                    step="any"
                    className="w-full px-3 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xl font-mono font-black text-slate-900 focus:outline-none shadow-xs"
                    placeholder="0.00"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    required
                  />
                </div>

                <div className="text-slate-400 font-bold text-lg pt-5">×</div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    Width (Inches): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-3 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xl font-mono font-black text-slate-900 focus:outline-none shadow-xs"
                    placeholder="0.00"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Instant Camera Touch Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Board Photos (Instant Camera Capture):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Front Photo */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      FRONT FACE
                    </span>
                    {frontImagePreview ? (
                      <div className="relative h-28 rounded-xl overflow-hidden border-2 border-emerald-500 bg-black group">
                        <img
                          src={frontImagePreview}
                          alt="Front"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Check size={11} />
                          <span>Front ✓</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-slate-900/80 backdrop-blur-xs flex items-center justify-between gap-1">
                          <button
                            type="button"
                            className="flex-1 py-1 px-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition"
                            onClick={() => frontInputRef.current?.click()}
                          >
                            <RotateCw size={11} />
                            <span>Retake</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded transition"
                            onClick={() => setFrontImagePreview(null)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          className="h-24 rounded-xl border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/60 flex flex-col items-center justify-center gap-1 transition cursor-pointer p-2 text-center shadow-xs group"
                          onClick={() => frontInputRef.current?.click()}
                          title="Open Camera to capture front face"
                        >
                          <Camera size={24} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900">Snap Front (Camera)</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">Tap to launch camera</span>
                        </button>
                        <button
                          type="button"
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 text-center py-0.5 underline cursor-pointer"
                          onClick={() => frontGalleryInputRef.current?.click()}
                        >
                          or pick from gallery
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Back Photo */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      BACK FACE
                    </span>
                    {backImagePreview ? (
                      <div className="relative h-28 rounded-xl overflow-hidden border-2 border-emerald-500 bg-black group">
                        <img
                          src={backImagePreview}
                          alt="Back"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Check size={11} />
                          <span>Back ✓</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-slate-900/80 backdrop-blur-xs flex items-center justify-between gap-1">
                          <button
                            type="button"
                            className="flex-1 py-1 px-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition"
                            onClick={() => backInputRef.current?.click()}
                          >
                            <RotateCw size={11} />
                            <span>Retake</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded transition"
                            onClick={() => setBackImagePreview(null)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          className="h-24 rounded-xl border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/60 flex flex-col items-center justify-center gap-1 transition cursor-pointer p-2 text-center shadow-xs group"
                          onClick={() => backInputRef.current?.click()}
                          title="Open Camera to capture back face"
                        >
                          <Camera size={24} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900">Snap Back (Camera)</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">Tap to launch camera</span>
                        </button>
                        <button
                          type="button"
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 text-center py-0.5 underline cursor-pointer"
                          onClick={() => backGalleryInputRef.current?.click()}
                        >
                          or pick from gallery
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  placeholder="Optional note for this board (e.g. Knot on left, clear face)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Big Touch Action: Save & Add Next */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
                disabled={isSaving}
              >
                <Check size={18} />
                <span>
                  {isSaving ? 'Saving Board...' : 'Save & Add Next Board (Enter ↵)'}
                </span>
              </button>
            </form>

            {/* Collapsible Staged Boards Drawer */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div
                className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                onClick={() => setIsSessionListOpen(!isSessionListOpen)}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Layers size={15} className="text-emerald-600" />
                  <span>Boards Added in This Session ({sessionPanels.length})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{sessionPanels.length === 0 ? 'None yet' : 'Tap to inspect'}</span>
                  {isSessionListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isSessionListOpen && (
                <div className="p-3 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {sessionPanels.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No boards added yet. Enter length, width, snap photos, and tap Save!
                    </div>
                  ) : (
                    sessionPanels.map((p, idx) => (
                      <div key={p.id} className="py-2 flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400 w-6">
                          #{sessionPanels.length - idx}
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src={p.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE}
                            alt="Front"
                            className="w-8 h-8 rounded object-cover border border-slate-200"
                            title="Front Face"
                          />
                          <img
                            src={p.backImageUrl || DEFAULT_MANGO_BACK_IMAGE}
                            alt="Back"
                            className="w-8 h-8 rounded object-cover border border-slate-200"
                            title="Back Face"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-xs font-mono text-slate-900 truncate">
                            {formatDimensions(p.length, p.width, p.thickness)}
                          </strong>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {p.woodType} • ID #{p.id.slice(-6).toUpperCase()}
                            {p.notes ? ` • ${p.notes}` : ''}
                          </span>
                        </div>
                        {onDeletePanel && (
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            onClick={() => handleDeleteSessionBoard(p)}
                            title="Delete this board"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Session Finish Footer */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                onClick={onClose}
              >
                Done / Finish Session ({sessionPanels.length} Boards Added)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RapidStockEntryModal;
