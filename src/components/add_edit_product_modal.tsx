import React, { useState, useRef } from 'react';
import type { Product } from '../types/product';
import { compressImage } from '../services/image_compressor';
import {
  X,
  UploadCloud,
  Trash2,
  Package,
  User,
  Hash,
  Check
} from 'lucide-react';

interface AddEditProductModalProps {
  isOpen: boolean;
  productToEdit: Product | null;
  onClose: () => void;
  onSave: (product: Product, photoBase64?: string) => Promise<void>;
}

const AddEditProductModalContent: React.FC<{
  productToEdit: Product | null;
  onClose: () => void;
  onSave: (product: Product, photoBase64?: string) => Promise<void>;
}> = ({ productToEdit, onClose, onSave }) => {
  const [name, setName] = useState(productToEdit?.name || '');
  const [code, setCode] = useState(productToEdit?.code || '');
  const [customerName, setCustomerName] = useState(productToEdit?.customerName || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [photoPreview, setPhotoPreview] = useState<string>(productToEdit?.photoUrl || '');
  const [newPhotoBase64, setNewPhotoBase64] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1024, 1024, 0.82);
      setPhotoPreview(compressed);
      setNewPhotoBase64(compressed);
    } catch (err) {
      console.error('Error compressing product photo:', err);
      setErrorMessage('Failed to process the uploaded image. Please try another image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a Product Name.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Please provide a Product Code (e.g. BS-BUN-06).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const product: Product = {
        id: productToEdit ? productToEdit.id : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        customerName: customerName.trim() || 'Standard Customer',
        photoUrl: photoPreview || undefined,
        description: description.trim() || undefined,
        createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        woodPlan: productToEdit ? productToEdit.woodPlan : undefined
      };

      await onSave(product, newPhotoBase64);
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMessage(err?.message || 'Could not save product. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {productToEdit ? 'Edit Product' : 'Add New Product to Database'}
              </h3>
              <p className="text-xs text-slate-500">
                {productToEdit ? 'Update product information and image' : 'Register a new furniture item for orders & wood plans'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Photo Uploader / Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Product Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                      onClick={() => {
                        setPhotoPreview('');
                        setNewPhotoBase64('');
                      }}
                      title="Remove Photo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Package size={28} className="mx-auto mb-1 opacity-60" />
                    <span className="text-[10px] block">No Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={16} className="text-slate-900" />
                  <span>{photoPreview ? 'Change Photo' : 'Upload Product Photo'}</span>
                </button>
                <p className="text-[11px] text-slate-500">
                  PNG, JPG, or WebP. Automatically compressed for fast cloud sync.
                </p>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Name *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Package size={16} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bunton Desk, Round Coffee Table"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                required
              />
            </div>
          </div>

          {/* Code & Customer Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Code / SKU *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Hash size={16} />
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. BS-BUN-06"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer / Buyer Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. APL, West Elm"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Solid Mango Wood with fluted drawers, natural matte lacquer..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddEditProductModal: React.FC<AddEditProductModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <AddEditProductModalContent key={props.productToEdit?.id || 'new-product'} {...props} />;
};
