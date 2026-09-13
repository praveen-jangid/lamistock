import React, { useState } from 'react';
import type {
  Product,
  WoodPlan,
  WoodPlanLaminationItem,
  WoodPlanFrameItem
} from '../types/product';
import type { ExtractedWoodPlanResult } from '../utils/wood_plan_parser';
import {
  X,
  Layers,
  CheckCircle2,
  Trash2,
  Plus,
  Package,
  FileSpreadsheet,
  AlertCircle,
  Save,
  Sparkles,
  Info
} from 'lucide-react';

interface WoodPlanPreviewModalProps {
  isOpen: boolean;
  extractedData: ExtractedWoodPlanResult | null;
  products: Product[];
  preselectedProductId?: string | null;
  onClose: () => void;
  onSaveWoodPlan: (
    productId: string,
    woodPlan: WoodPlan,
    newProductData?: { name: string; code: string; customerName: string }
  ) => Promise<void>;
}

const WoodPlanPreviewModalContent: React.FC<{
  extractedData: ExtractedWoodPlanResult;
  products: Product[];
  preselectedProductId?: string | null;
  onClose: () => void;
  onSaveWoodPlan: (
    productId: string,
    woodPlan: WoodPlan,
    newProductData?: { name: string; code: string; customerName: string }
  ) => Promise<void>;
}> = ({
  extractedData,
  products,
  preselectedProductId,
  onClose,
  onSaveWoodPlan
}) => {
  const [activeTab, setActiveTab] = useState<'LAMINATION' | 'FRAME'>('LAMINATION');

  // Initial target product calculation
  const initialTargetProductId = (() => {
    if (preselectedProductId) return preselectedProductId;
    const matchingProd = products.find(
      (p) =>
        (extractedData.productCode && p.code.toLowerCase() === extractedData.productCode.toLowerCase()) ||
        (extractedData.productName && p.name.toLowerCase() === extractedData.productName.toLowerCase())
    );
    return matchingProd ? matchingProd.id : 'new';
  })();

  const [selectedProductId, setSelectedProductId] = useState<string>(initialTargetProductId);

  // New product fields if creating product from Excel
  const [newProdName, setNewProdName] = useState(extractedData.productName || '');
  const [newProdCode, setNewProdCode] = useState(extractedData.productCode || '');
  const [newProdCustomer, setNewProdCustomer] = useState(extractedData.customerName || '');

  // Editable lists of fetched items initialized directly from extractedData
  const [laminationItems, setLaminationItems] = useState<WoodPlanLaminationItem[]>([
    ...extractedData.laminationItems
  ]);
  const [frameItems, setFrameItems] = useState<WoodPlanFrameItem[]>([
    ...extractedData.frameItems
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Edit Lamination item handlers
  const handleUpdateLaminationItem = (
    index: number,
    field: keyof WoodPlanLaminationItem,
    value: any
  ) => {
    setLaminationItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteLaminationItem = (index: number) => {
    setLaminationItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLaminationItem = () => {
    const newItem: WoodPlanLaminationItem = {
      id: `lam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partName: 'New Laminated Panel',
      qtyPerUnit: 1,
      length: 24,
      width: 18,
      thickness: 0.75,
      woodType: 'Mango Wood',
      remarks: 'Plain'
    };
    setLaminationItems((prev) => [...prev, newItem]);
  };

  // Edit Frame item handlers
  const handleUpdateFrameItem = (
    index: number,
    field: keyof WoodPlanFrameItem,
    value: any
  ) => {
    setFrameItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteFrameItem = (index: number) => {
    setFrameItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFrameItem = () => {
    const newItem: WoodPlanFrameItem = {
      id: `frm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partName: 'New Frame Component',
      qtyPerUnit: 1,
      length: 24,
      width: 2.5,
      thickness: 1.0,
      woodType: 'Solid Mango Wood',
      remarks: 'Plain'
    };
    setFrameItems((prev) => [...prev, newItem]);
  };

  // Save Wood Plan handler
  const handleCommitSave = async () => {
    if (laminationItems.length === 0 && frameItems.length === 0) {
      setErrorMessage('Please add at least one lamination or frame item to save the wood plan.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const woodPlan: WoodPlan = {
        id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: selectedProductId,
        sourceFileName: extractedData.sourceFileName,
        importedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: `Extracted from ${extractedData.sourceFileName}`,
        laminationItems: laminationItems.map((it) => ({
          ...it,
          length: Number(it.length) || 0,
          width: Number(it.width) || 0,
          thickness: Number(it.thickness) || 0,
          qtyPerUnit: Math.max(1, Number(it.qtyPerUnit) || 1)
        })),
        frameItems: frameItems.map((it) => ({
          ...it,
          length: Number(it.length) || 0,
          width: Number(it.width) || 0,
          thickness: Number(it.thickness) || 0,
          qtyPerUnit: Math.max(1, Number(it.qtyPerUnit) || 1)
        }))
      };

      if (selectedProductId === 'new') {
        if (!newProdName.trim() || !newProdCode.trim()) {
          setErrorMessage('Please provide a Product Name and Code for the new product.');
          setIsSaving(false);
          return;
        }

        const newProductData = {
          name: newProdName.trim(),
          code: newProdCode.trim().toUpperCase(),
          customerName: newProdCustomer.trim() || 'Standard Customer'
        };

        await onSaveWoodPlan('new', woodPlan, newProductData);
      } else {
        await onSaveWoodPlan(selectedProductId, woodPlan);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving wood plan:', err);
      setErrorMessage(err?.message || 'Failed to save wood plan. Please check your data.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalLamPcs = laminationItems.reduce((sum, it) => sum + (Number(it.qtyPerUnit) || 0), 0);
  const totalFrmPcs = frameItems.reduce((sum, it) => sum + (Number(it.qtyPerUnit) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg m-0">
                  Review & Edit Extracted Wood Plan
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                  {extractedData.sourceFileName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify and edit the fetched lamination and frame sizes before saving to the product database.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Guidance & Error Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {extractedData.warnings && extractedData.warnings.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
            <Info size={16} className="flex-shrink-0 text-amber-600" />
            <span>{extractedData.warnings.join(' ')}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Product Selection / Linkage */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-slate-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Target Product in Database
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Attach to:</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition shadow-2xs cursor-pointer"
                >
                  <option value="new">+ Create as New Product in Database</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {p.customerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If saving as a new product, display editable metadata */}
            {selectedProductId === 'new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Bunton Desk"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                    placeholder="e.g. BS-BUN-06"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Customer / Buyer Name
                  </label>
                  <input
                    type="text"
                    value={newProdCustomer}
                    onChange={(e) => setNewProdCustomer(e.target.value)}
                    placeholder="e.g. APL"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-200/60">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span>
                  This wood plan will permanently attach to{' '}
                  <strong className="text-slate-900 font-bold">
                    {products.find((p) => p.id === selectedProductId)?.name}
                  </strong>
                  . It will not be needed to fetch or re-upload again!
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Tabbed Tables for Lamination and Frame Items */}
          <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === 'LAMINATION'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  onClick={() => setActiveTab('LAMINATION')}
                >
                  <Layers size={15} />
                  <span>1. Lamination Sizes</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'LAMINATION' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {laminationItems.length} sizes ({totalLamPcs} pcs)
                  </span>
                </button>

                <button
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === 'FRAME'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  onClick={() => setActiveTab('FRAME')}
                >
                  <Package size={15} />
                  <span>2. Frame Sizes</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'FRAME' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {frameItems.length} sizes ({totalFrmPcs} pcs)
                  </span>
                </button>
              </div>

              <div>
                {activeTab === 'LAMINATION' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    onClick={handleAddLaminationItem}
                  >
                    <Plus size={14} />
                    <span>Add Lamination Size</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    onClick={handleAddFrameItem}
                  >
                    <Plus size={14} />
                    <span>Add Frame Size</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab 1: Lamination Sizes Table */}
            {activeTab === 'LAMINATION' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-100/90 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 min-w-[160px]">Part Name / Particular</th>
                        <th className="py-3 px-2 w-20 text-center">Qty / Unit</th>
                        <th className="py-3 px-2 w-24">Length (″)</th>
                        <th className="py-3 px-2 w-24">Width (″)</th>
                        <th className="py-3 px-2 w-24">Thick (″)</th>
                        <th className="py-3 px-3 min-w-[130px]">Wood Type</th>
                        <th className="py-3 px-3 min-w-[140px]">Remarks / Finish</th>
                        <th className="py-3 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {laminationItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            No lamination sizes in this plan. Click "Add Lamination Size" above to add one.
                          </td>
                        </tr>
                      ) : (
                        laminationItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Part Name */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.partName}
                                onChange={(e) => handleUpdateLaminationItem(idx, 'partName', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Qty Per Unit */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                min={1}
                                value={item.qtyPerUnit}
                                onChange={(e) =>
                                  handleUpdateLaminationItem(idx, 'qtyPerUnit', parseInt(e.target.value, 10) || 1)
                                }
                                className="w-full text-center px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Length */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.length}
                                onChange={(e) =>
                                  handleUpdateLaminationItem(idx, 'length', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Width */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.width}
                                onChange={(e) =>
                                  handleUpdateLaminationItem(idx, 'width', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Thickness */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.thickness}
                                onChange={(e) =>
                                  handleUpdateLaminationItem(idx, 'thickness', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Wood Type */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.woodType}
                                onChange={(e) => handleUpdateLaminationItem(idx, 'woodType', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none transition"
                              />
                            </td>

                            {/* Remarks */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.remarks || ''}
                                placeholder="None"
                                onChange={(e) => handleUpdateLaminationItem(idx, 'remarks', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-700 placeholder-slate-300 focus:outline-none transition"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                onClick={() => handleDeleteLaminationItem(idx)}
                                title="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Frame Sizes Table */}
            {activeTab === 'FRAME' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-100/90 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 min-w-[160px]">Frame Component</th>
                        <th className="py-3 px-2 w-20 text-center">Qty / Unit</th>
                        <th className="py-3 px-2 w-24">Length (″)</th>
                        <th className="py-3 px-2 w-24">Width (″)</th>
                        <th className="py-3 px-2 w-24">Thick (″)</th>
                        <th className="py-3 px-3 min-w-[130px]">Wood Type</th>
                        <th className="py-3 px-3 min-w-[140px]">Remarks / Work</th>
                        <th className="py-3 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {frameItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            No frame sizes in this plan. Click "Add Frame Size" above to add one.
                          </td>
                        </tr>
                      ) : (
                        frameItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Part Name */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.partName}
                                onChange={(e) => handleUpdateFrameItem(idx, 'partName', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Qty Per Unit */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                min={1}
                                value={item.qtyPerUnit}
                                onChange={(e) =>
                                  handleUpdateFrameItem(idx, 'qtyPerUnit', parseInt(e.target.value, 10) || 1)
                                }
                                className="w-full text-center px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Length */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.length}
                                onChange={(e) =>
                                  handleUpdateFrameItem(idx, 'length', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Width */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.width}
                                onChange={(e) =>
                                  handleUpdateFrameItem(idx, 'width', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Thickness */}
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                step="any"
                                value={item.thickness}
                                onChange={(e) =>
                                  handleUpdateFrameItem(idx, 'thickness', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition"
                              />
                            </td>

                            {/* Wood Type */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.woodType}
                                onChange={(e) => handleUpdateFrameItem(idx, 'woodType', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none transition"
                              />
                            </td>

                            {/* Remarks */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.remarks || ''}
                                placeholder="None"
                                onChange={(e) => handleUpdateFrameItem(idx, 'remarks', e.target.value)}
                                className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-xs text-slate-700 placeholder-slate-300 focus:outline-none transition"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                onClick={() => handleDeleteFrameItem(idx)}
                                title="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles size={15} className="text-emerald-600" />
            <span>
              Total extracted:{' '}
              <strong className="text-slate-800">
                {laminationItems.length} lamination sizes ({totalLamPcs} pcs)
              </strong>{' '}
              and{' '}
              <strong className="text-slate-800">
                {frameItems.length} frame parts ({totalFrmPcs} pcs)
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer"
              onClick={onClose}
              disabled={isSaving}
            >
              Discard
            </button>

            <button
              type="button"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              onClick={handleCommitSave}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving Wood Plan...' : 'Save Wood Plan to Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WoodPlanPreviewModal: React.FC<WoodPlanPreviewModalProps> = ({
  isOpen,
  extractedData,
  products,
  preselectedProductId,
  onClose,
  onSaveWoodPlan
}) => {
  if (!isOpen || !extractedData) return null;
  const key = `${extractedData.sourceFileName}_${preselectedProductId || 'auto'}`;
  return (
    <WoodPlanPreviewModalContent
      key={key}
      extractedData={extractedData}
      products={products}
      preselectedProductId={preselectedProductId}
      onClose={onClose}
      onSaveWoodPlan={onSaveWoodPlan}
    />
  );
};
