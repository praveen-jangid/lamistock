import React, { useState } from 'react';
import type { ChallanComponentItem, PalletConfig, ComponentCategory } from '../../../../types/challan';
import { Sparkles, X, Layers, Truck, Plus } from 'lucide-react';

export interface AddCustomComponentModalProps {
  isOpen: boolean;
  defaultCategory?: ComponentCategory;
  pallets: PalletConfig[];
  onClose: () => void;
  onAdd: (item: ChallanComponentItem) => void;
}

export const AddCustomComponentModal: React.FC<AddCustomComponentModalProps> = ({
  isOpen,
  defaultCategory = 'LAMINATION',
  pallets,
  onClose,
  onAdd
}) => {
  const [category, setCategory] = useState<ComponentCategory>(defaultCategory);
  const [partName, setPartName] = useState<string>('');
  const [dimensionMode, setDimensionMode] = useState<'standard' | 'freeform'>('standard');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [thickness, setThickness] = useState<string>('');
  const [freeformDimensions, setFreeformDimensions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [woodType, setWoodType] = useState<string>('Mango Wood');
  const [reference, setReference] = useState<string>('SAMPLE');
  const [customerName, setCustomerName] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('Sample piece');
  const [palletNumber, setPalletNumber] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const computedDimensions =
    dimensionMode === 'standard'
      ? `${length.trim() || '—'}″ × ${width.trim() || '—'}″ × ${thickness.trim() || '—'}″`
      : freeformDimensions.trim() || '—';

  const handleQuickWood = (wood: string) => {
    setWoodType(wood);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) {
      setErrorMsg('Please enter a component part name (e.g. Sample Top Panel).');
      return;
    }
    if (dimensionMode === 'standard' && (!length.trim() || !width.trim() || !thickness.trim())) {
      setErrorMsg('Please specify Length, Width, and Thickness, or switch to Freeform text.');
      return;
    }
    if (dimensionMode === 'freeform' && !freeformDimensions.trim()) {
      setErrorMsg('Please enter the custom dimensions / size.');
      return;
    }
    if (quantity < 1) {
      setErrorMsg('Quantity must be at least 1 piece.');
      return;
    }

    const finalDimensions =
      dimensionMode === 'standard'
        ? `${length.trim()}″ × ${width.trim()}″ × ${thickness.trim()}″`
        : freeformDimensions.trim();

    const customId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ChallanComponentItem = {
      id: customId,
      orderId: 'custom-sample',
      orderTitle: reference.trim() || 'Custom Sample',
      productCode: reference.trim() || 'SAMPLE',
      productName: partName.trim(),
      salesOrderNo: reference.trim() || 'SAMPLE',
      customerName: customerName.trim() || 'Sample / Client Approval',
      category,
      partName: partName.trim(),
      dimensions: finalDimensions,
      totalOrderQty: quantity,
      alreadyDispatchedQty: 0,
      dispatchingNowQty: quantity,
      woodType: woodType.trim() || 'Standard Wood',
      remarks: remarks.trim(),
      palletNumber: palletNumber || 1,
      isCustomItem: true
    };

    onAdd(newItem);
    // Reset form
    setPartName('');
    setLength('');
    setWidth('');
    setThickness('');
    setFreeformDimensions('');
    setQuantity(1);
    setCustomerName('');
    setRemarks('Sample piece');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white m-0 uppercase">
                Add Custom / Sample Size
              </h3>
              <p className="text-[11px] text-slate-300 m-0">
                Manually enter lamination or frame dimensions for samples & trials
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
              {errorMsg}
            </div>
          )}

          {/* Category Toggle: Lamination vs Frame */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
              Component Category:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('LAMINATION')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-black transition cursor-pointer ${
                  category === 'LAMINATION'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 ring-2 ring-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Layers size={14} className={category === 'LAMINATION' ? 'text-amber-800' : 'text-slate-400'} />
                <span>Lamination Panel</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('FRAME')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-black transition cursor-pointer ${
                  category === 'FRAME'
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-950 ring-2 ring-indigo-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Truck size={14} className={category === 'FRAME' ? 'text-indigo-800' : 'text-slate-400'} />
                <span>Frame Component</span>
              </button>
            </div>
          </div>

          {/* Part Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Part Name & Description <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder={category === 'LAMINATION' ? 'e.g. Sample Top Panel, Back Board Test' : 'e.g. Sample Front Leg, Side Apron'}
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Dimensions */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px]">
                Dimensions / Sizes <span className="text-rose-500">*</span>:
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDimensionMode('standard')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    dimensionMode === 'standard' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  L × W × T
                </button>
                <button
                  type="button"
                  onClick={() => setDimensionMode('freeform')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    dimensionMode === 'freeform' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Freeform Text
                </button>
              </div>
            </div>

            {dimensionMode === 'standard' ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Length (L)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 24"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full pr-6 pl-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="absolute right-2 top-1.5 font-bold text-slate-400">″</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Width (W)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 15.5"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full pr-6 pl-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="absolute right-2 top-1.5 font-bold text-slate-400">″</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Thickness (T)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 0.75"
                      value={thickness}
                      onChange={(e) => setThickness(e.target.value)}
                      className="w-full pr-6 pl-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="absolute right-2 top-1.5 font-bold text-slate-400">″</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="e.g. 28.5″ × 2″ × 0.75″ or Circular 30″ Dia"
                  value={freeformDimensions}
                  onChange={(e) => setFreeformDimensions(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>Formatted Size Preview:</span>
              <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {computedDimensions}
              </span>
            </div>
          </div>

          {/* Quantity & Pallet Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dispatch Quantity (Pcs) <span className="text-rose-500">*</span>:
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pack onto Pallet:
              </label>
              <select
                value={palletNumber}
                onChange={(e) => setPalletNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {pallets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (P{p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Material / Wood Type & Sample Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Material / Wood Type:
              </label>
              <input
                type="text"
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                placeholder="e.g. Mango Wood"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {['Mango Wood', 'Solid Sheesham', 'Teak', 'MDF'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleQuickWood(w)}
                    className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reference / Tag:
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. SAMPLE or TRIAL-01"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Identifies sample on print voucher</span>
            </div>
          </div>

          {/* Customer / Client */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Customer / Client Name (Optional):
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Sample Approval / Client Name"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Remarks / Dispatch Note:
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. For finish approval, not for production order"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Add to Challan Checklist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
