import React, { useState, useRef } from 'react';
import type { LaminatedPanel } from '../../types/panel';
import { compressImage, DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../../services/imageCompressor';
import {
  X,
  Camera,
  Save,
  Trash2,
  TreePine,
  Plus,
  Minus
} from 'lucide-react';

interface AddEditPanelModalProps {
  isOpen: boolean;
  panelToEdit?: LaminatedPanel | null;
  onClose: () => void;
  onSave: (panel: LaminatedPanel, frontImgBase64?: string, backImgBase64?: string) => Promise<void>;
}

export const AddEditPanelModal: React.FC<AddEditPanelModalProps> = ({
  isOpen,
  panelToEdit,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {isEditing ? '✏️ Edit Lamination Panel' : '🪵 Add Surplus Lamination Panel'}
            </h2>
            <p className="modal-subtitle">
              Record extra panels by size in inches and optional front/back photos.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form-scrollable">
          {/* Section 1: Dimensions & Quantity at the top */}
          <div className="form-section">
            <div className="section-header">
              <TreePine size={18} />
              <h3>Panel Dimensions & Stock Quantity</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Length (Inches): <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  min={1}
                  placeholder="e.g. 72"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Width (Inches): <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={1}
                  placeholder="e.g. 36"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2 mt-3">
              <div className="form-group">
                <label className="form-label">
                  Thickness (Inches): <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                  min={0.1}
                  placeholder="e.g. 0.75 or 1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Available: <span className="req">*</span></label>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    className="stepper-input"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    min={1}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Wood Material:</label>
              <input
                type="text"
                className="form-input"
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                placeholder="e.g. Teak, Oak, Mango, Pine"
              />
            </div>
          </div>

          {/* Section 2: Photos (Optional) */}
          <div className="form-section">
            <div className="section-header">
              <Camera size={18} />
              <h3>Photos (Optional - Default Wood Texture Used If Empty)</h3>
            </div>

            <div className="dual-photo-grid">
              {/* Front Photo Upload */}
              <div className="photo-box">
                <span className="photo-box-title">Front Face Photo</span>
                <div className="photo-preview-box">
                  <img
                    src={frontImagePreview || DEFAULT_MANGO_FRONT_IMAGE}
                    alt="Front preview"
                    className="photo-preview-image"
                  />
                  {frontImagePreview && (
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => {
                        setFrontImagePreview(undefined);
                        setFrontImageChanged(true);
                      }}
                      title="Remove uploaded photo"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden-file-input"
                  onChange={(e) => handleImageCapture(e, 'front')}
                />

                <button
                  type="button"
                  className="btn-upload-trigger"
                  onClick={() => frontInputRef.current?.click()}
                >
                  <Camera size={14} />
                  <span>{frontImagePreview ? 'Change Front Photo' : 'Upload Front Photo'}</span>
                </button>
              </div>

              {/* Back Photo Upload */}
              <div className="photo-box">
                <span className="photo-box-title">Back Face Photo</span>
                <div className="photo-preview-box">
                  <img
                    src={backImagePreview || DEFAULT_MANGO_BACK_IMAGE}
                    alt="Back preview"
                    className="photo-preview-image"
                  />
                  {backImagePreview && (
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => {
                        setBackImagePreview(undefined);
                        setBackImageChanged(true);
                      }}
                      title="Remove uploaded photo"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden-file-input"
                  onChange={(e) => handleImageCapture(e, 'back')}
                />

                <button
                  type="button"
                  className="btn-upload-trigger"
                  onClick={() => backInputRef.current?.click()}
                >
                  <Camera size={14} />
                  <span>{backImagePreview ? 'Change Back Photo' : 'Upload Back Photo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="form-group">
            <label className="form-label">Notes (Optional):</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra table top cutoffs, kiln dried"
            />
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add to Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
