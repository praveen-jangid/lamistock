import React, { useState, useRef, useEffect } from 'react';
import type { LaminatedPanel } from '../../types/panel';
import { compressImage, DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../../services/imageCompressor';
import {
  X,
  Camera,
  Save,
  Trash2,
  TreePine,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

interface AddEditPanelModalProps {
  isOpen: boolean;
  panelToEdit?: LaminatedPanel | null;
  onClose: () => void;
  onSave: (panel: LaminatedPanel, frontImgBase64?: string, backImgBase64?: string) => Promise<void>;
  onOpenRapidMode?: () => void;
}

export const AddEditPanelModal: React.FC<AddEditPanelModalProps> = ({
  isOpen,
  panelToEdit,
  onClose,
  onSave,
  onOpenRapidMode
}) => {
  const isEditing = !!panelToEdit;

  // Form State in pure Inches
  const [length, setLength] = useState<number>(panelToEdit?.length || 72);
  const [width, setWidth] = useState<number>(panelToEdit?.width || 36);
  const [thickness, setThickness] = useState<number>(panelToEdit?.thickness || 0.75);
  const [quantity, setQuantity] = useState<number>(panelToEdit?.quantity || 1);
  const [woodType, setWoodType] = useState<string>(panelToEdit?.woodType || 'Laminated Wood');
  const [notes, setNotes] = useState<string>(panelToEdit?.notes || '');

  // Front & Back Image State
  const [frontImagePreview, setFrontImagePreview] = useState<string | undefined>(panelToEdit?.frontImageUrl);
  const [frontImageChanged, setFrontImageChanged] = useState<boolean>(false);

  const [backImagePreview, setBackImagePreview] = useState<string | undefined>(panelToEdit?.backImageUrl);
  const [backImageChanged, setBackImageChanged] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);

  // File Inputs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Reset or sync state when modal opens or panelToEdit changes
  useEffect(() => {
    if (isOpen) {
      setLength(panelToEdit?.length || 72);
      setWidth(panelToEdit?.width || 36);
      setThickness(panelToEdit?.thickness || 0.75);
      setQuantity(panelToEdit?.quantity || 1);
      setWoodType(panelToEdit?.woodType || 'Laminated Wood');
      setNotes(panelToEdit?.notes || '');
      setFrontImagePreview(panelToEdit?.frontImageUrl);
      setFrontImageChanged(false);
      setBackImagePreview(panelToEdit?.backImageUrl);
      setBackImageChanged(false);
    }
  }, [isOpen, panelToEdit]);

  const handleImageCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file, 1200, 1200, 0.82);
      if (target === 'front') {
        setFrontImagePreview(compressedDataUrl);
        setFrontImageChanged(true);
      } else {
        setBackImagePreview(compressedDataUrl);
        setBackImageChanged(true);
      }
    } catch (err) {
      console.error('Error compressing photo:', err);
      alert('Failed to process photo. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (length <= 0 || width <= 0 || thickness <= 0) {
      alert('Please enter valid positive dimensions in inches.');
      return;
    }

    setIsSaving(true);
    try {
      const panelData: LaminatedPanel = {
        id: panelToEdit?.id || `panel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        length: Number(length),
        width: Number(width),
        thickness: Number(thickness),
        woodType: woodType.trim() || 'Mango Wood',
        quantity: Math.max(1, Number(quantity)),
        frontImageUrl: frontImagePreview || '',
        backImageUrl: backImagePreview || '',
        notes: notes ? notes.trim() : '',
        createdAt: panelToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(
        panelData,
        frontImageChanged ? frontImagePreview : undefined,
        backImageChanged ? backImagePreview : undefined
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving panel:', err);
      alert(`Could not save panel: ${err?.message || 'Please check your connection and fields.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
              {isEditing ? '✏️ Edit Lamination Panel' : '🪵 Add Surplus Lamination Panel'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record extra panels by size in inches and optional front/back photos.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {!isEditing && onOpenRapidMode && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <Sparkles size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Adding 30–50 panels today? Use Rapid Camera Mode</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRapidMode();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-xs"
              >
                Launch Rapid ⚡
              </button>
            </div>
          )}

          {/* Section 1: Dimensions & Quantity */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <TreePine size={16} className="text-emerald-600" />
              <span>Panel Dimensions & Stock Quantity</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Length (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  min={1}
                  placeholder="e.g. 72"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Width (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={1}
                  placeholder="e.g. 36"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Thickness (Inches): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                  min={0.1}
                  placeholder="e.g. 0.75"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Quantity Available: <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    className="px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="w-full py-2 text-center text-sm font-mono font-bold text-slate-900 focus:outline-none"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    min={1}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Wood Material:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                placeholder="e.g. Teak, Oak, Mango, Pine"
              />
            </div>
          </div>

          {/* Section 2: Photos (Optional) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Camera size={16} className="text-emerald-600" />
              <span>Photos (Optional - Default Wood Texture Used If Empty)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front Photo */}
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-600">Front Face Photo</span>
                <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative border border-dashed border-slate-300 flex items-center justify-center">
                  <img
                    src={frontImagePreview || DEFAULT_MANGO_FRONT_IMAGE}
                    alt="Front preview"
                    className="w-full h-full object-cover"
                  />
                  {frontImagePreview && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer transition"
                      onClick={() => {
                        setFrontImagePreview(undefined);
                        setFrontImageChanged(true);
                      }}
                      title="Remove uploaded photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, 'front')}
                />

                <button
                  type="button"
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  onClick={() => frontInputRef.current?.click()}
                >
                  <Camera size={13} />
                  <span>{frontImagePreview ? 'Change Front' : 'Upload Front'}</span>
                </button>
              </div>

              {/* Back Photo */}
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-600">Back Face Photo</span>
                <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative border border-dashed border-slate-300 flex items-center justify-center">
                  <img
                    src={backImagePreview || DEFAULT_MANGO_BACK_IMAGE}
                    alt="Back preview"
                    className="w-full h-full object-cover"
                  />
                  {backImagePreview && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer transition"
                      onClick={() => {
                        setBackImagePreview(undefined);
                        setBackImageChanged(true);
                      }}
                      title="Remove uploaded photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e, 'back')}
                />

                <button
                  type="button"
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  onClick={() => backInputRef.current?.click()}
                >
                  <Camera size={13} />
                  <span>{backImagePreview ? 'Change Back' : 'Upload Back'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes (Optional):
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra table top cutoffs, kiln dried"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              disabled={isSaving}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add to Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
