import React, { useState, useMemo, useRef } from 'react';
import type {
  LaminatedPanel,
  BulkOrderItem,
  BulkOrderMatchSummary,
  BulkCandidateCut
} from '../types/panel';
import {
  parseOrderSpreadsheet,
  downloadOrderTemplateExcel,
  parseDimensionToInches
} from '../utils/excel_parser';
import {
  matchBulkOrderWithInventory,
  exportProductionPlanToExcel
} from '../services/bulk_matcher';
import { formatDimensions, formatInches } from '../utils/units';
import { VisualCutDiagram } from '../Feature/visual_cut_diagram';
import {
  DEFAULT_MANGO_FRONT_IMAGE,
  DEFAULT_MANGO_BACK_IMAGE
} from '../services/image_compressor';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Scissors,
  PackageCheck,
  Layers,
  FileText,
  Check,
  RotateCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BulkOrderMatcherModalProps {
  isOpen: boolean;
  inventory: LaminatedPanel[];
  onClose: () => void;
  onBulkDeductStock?: (allocations: { panelId: string; quantityToDeduct: number }[]) => Promise<void>;
}

/**
 * Individual Candidate Stock Panel Card with Front/Back Image Preview and Flip
 */
const CandidateStockCard: React.FC<{
  candidate: BulkCandidateCut;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ candidate, isSelected, onSelect }) => {
  const [showBack, setShowBack] = useState(false);
  const { panel, wastePercentage, yieldPerPanel, panelsNeededForOrder, isExactMatch } = candidate;

  const frontImg = panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE;
  const backImg = panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE;
  const activeImg = showBack ? backImg : frontImg;

  return (
    <div
      className={`min-w-[260px] max-w-[280px] flex-shrink-0 bg-white border-2 rounded-2xl p-3 flex flex-col gap-2.5 transition cursor-pointer select-none ${
        isSelected
          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title="Click to select this stock panel for cutting"
    >
      {/* Header with Selection Radio & Offcut Badge */}
      <div className="flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
              isSelected
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 bg-white'
            }`}
          >
            {isSelected && <Check size={11} />}
          </span>
          <span className="font-bold text-slate-800 text-[11px]">
            {isSelected ? 'Selected' : 'Use This'}
          </span>
        </div>

        <div>
          {isExactMatch ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ⭐ 0% Offcut
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                wastePercentage <= 15
                  ? 'bg-emerald-100 text-emerald-800'
                  : wastePercentage <= 30
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              ✂️ {wastePercentage}% Offcut
            </span>
          )}
        </div>
      </div>

      {/* Wood Photo Thumbnail with Flip Button */}
      <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 group">
        <img
          src={activeImg}
          alt={showBack ? 'Back Face' : 'Front Face'}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {showBack ? 'Back Face' : 'Front Face'}
        </div>

        <button
          type="button"
          className="absolute top-2 right-2 bg-white/95 hover:bg-slate-900 hover:text-white text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 shadow-xs transition cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowBack(!showBack);
          }}
          title="Toggle Front / Back Face View"
        >
          <RotateCw size={10} />
          <span>{showBack ? 'Front' : 'Back'}</span>
        </button>

        <div className="absolute bottom-2 right-2 bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full shadow-sm">
          {panel.quantity} in stock
        </div>
      </div>

      {/* Panel Info & Dimensions */}
      <div className="space-y-1.5 text-xs">
        <div className="font-mono font-extrabold text-sm text-slate-900 tracking-tight">
          {formatDimensions(panel.length, panel.width, panel.thickness)}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
          <span>🪵 {panel.woodType || 'Mango Wood'}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
            #{panel.id.slice(-6).toUpperCase()}
          </span>
          {panel.notes && (
            <span className="truncate max-w-[120px]" title={panel.notes}>
              • 📝 {panel.notes}
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg text-[11px] border border-slate-200/60">
          <div>
            <span className="text-slate-400 block text-[10px]">Yield / Panel:</span>
            <span className="font-bold text-slate-800">
              {yieldPerPanel} {yieldPerPanel === 1 ? 'pc' : 'pcs'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Needed:</span>
            <span className="font-bold text-emerald-700">
              {panelsNeededForOrder} of {panel.quantity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BulkOrderMatcherModal: React.FC<BulkOrderMatcherModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onBulkDeductStock
}) => {
  // View Step: 'order_input' | 'results'
  const [currentStep, setCurrentStep] = useState<'order_input' | 'results'>('order_input');

  // Order Details State
  const [orderTitle, setOrderTitle] = useState<string>('Factory Production Order');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [items, setItems] = useState<BulkOrderItem[]>([
    {
      id: 'initial-1',
      partName: 'Desk Face',
      length: 27,
      width: 15.75,
      thickness: 0.675,
      quantityNeeded: 10,
      woodType: 'Mango Wood',
      remarks: 'Fluting finish'
    },
    {
      id: 'initial-2',
      partName: 'Back Panel',
      length: 27,
      width: 15.75,
      thickness: 0.675,
      quantityNeeded: 10,
      woodType: 'Mango Wood',
      remarks: 'Fluting (5 soot)'
    },
    {
      id: 'initial-3',
      partName: 'Side Panel A',
      length: 28.625,
      width: 23.25,
      thickness: 0.675,
      quantityNeeded: 10,
      woodType: 'Mango Wood',
      remarks: 'Plain'
    }
  ]);

  // Options State
  const [allowRotation, setAllowRotation] = useState<boolean>(true);

  // Selected candidate map: orderItemId -> index of chosen candidate
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, number>>({});

  // Show hidden items with zero stock
  const [showUnmatchedItems, setShowUnmatchedItems] = useState<boolean>(false);

  // Stock deduction tracking
  const [isDeducting, setIsDeducting] = useState<boolean>(false);
  const [isDeducted, setIsDeducted] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Bulk Matching Summary
  const matchSummary: BulkOrderMatchSummary = useMemo(() => {
    return matchBulkOrderWithInventory(orderTitle, items, inventory, {
      allowRotation,
      maxOffcutLimit: 50,
      thicknessTolerance: 0.065
    });
  }, [orderTitle, items, inventory, allowRotation]);

  // Items with available stock in Firestore
  const matchedResults = useMemo(() => {
    return matchSummary.results.filter((r) => r.hasMatches);
  }, [matchSummary.results]);

  // Items without available stock
  const unmatchedResults = useMemo(() => {
    return matchSummary.results.filter((r) => !r.hasMatches);
  }, [matchSummary.results]);

  if (!isOpen) return null;

  // Select a candidate for an item
  const handleSelectCandidate = (orderItemId: string, candidateIndex: number) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [orderItemId]: candidateIndex
    }));
    setIsDeducted(false);
  };

  // Handle File Upload & Parsing
  const handleFileUpload = async (file: File) => {
    setParseError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseOrderSpreadsheet(buffer, file.name);

      if (parsed.items.length === 0) {
        setParseError(
          parsed.warnings[0] ||
            'Could not extract panel items. Please check that column headers include Part Name, Length, Width, Thickness, and Qty.'
        );
        return;
      }

      setOrderTitle(parsed.orderTitle);
      setUploadedFileName(file.name);
      setItems(parsed.items);
      setSelectedCandidates({});
      setIsDeducted(false);
      setCurrentStep('results');
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseError(err.message || 'Failed to read Excel file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Add a blank row
  const handleAddRow = () => {
    const newItem: BulkOrderItem = {
      id: `manual-${Date.now().toString(36)}`,
      partName: `Panel ${items.length + 1}`,
      length: 24,
      width: 18,
      thickness: 0.675,
      quantityNeeded: 1,
      woodType: 'Mango Wood',
      remarks: ''
    };
    setItems((prev) => [...prev, newItem]);
    setIsDeducted(false);
  };

  // Update item field
  const handleUpdateItem = (id: string, field: keyof BulkOrderItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: val };
      })
    );
    setIsDeducted(false);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setIsDeducted(false);
  };

  // Handle Bulk Stock Deduction using selected candidates
  const handleDeductAll = async () => {
    if (!onBulkDeductStock) return;

    const deductionMap = new Map<string, number>();
    matchedResults.forEach((res) => {
      const selectedIndex = selectedCandidates[res.orderItem.id] ?? 0;
      const candidate = res.candidates[selectedIndex] || res.candidates[0];
      if (candidate) {
        const curr = deductionMap.get(candidate.panel.id) || 0;
        deductionMap.set(candidate.panel.id, curr + candidate.panelsNeededForOrder);
      }
    });

    if (deductionMap.size === 0) {
      alert('No extra stock panels selected.');
      return;
    }

    const totalPanels = Array.from(deductionMap.values()).reduce((sum, q) => sum + q, 0);
    const confirmMsg = `Deduct total of ${totalPanels} selected stock panel(s) across ${deductionMap.size} size(s) from Firestore inventory?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeducting(true);
    try {
      const payload = Array.from(deductionMap.entries()).map(([panelId, quantityToDeduct]) => ({
        panelId,
        quantityToDeduct
      }));
      await onBulkDeductStock(payload);
      setIsDeducted(true);
    } catch (e) {
      console.error('Failed deducting bulk stock:', e);
      alert('Could not update Firestore inventory.');
    } finally {
      setIsDeducting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-6xl my-6 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={20} /> Wood Panel Matcher & Cut Selector
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {inventory.length} Stock Sizes in Cloud
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect actual wood pieces from Firestore, view front/back grain photos, and select the best cut option for each order size.
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

        {/* Step Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-4 sm:px-6">
          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              currentStep === 'order_input'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setCurrentStep('order_input')}
          >
            <Layers size={15} />
            <span>1. Order Panels & Excel Upload</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {items.length} sizes
            </span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              currentStep === 'results'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setCurrentStep('results')}
          >
            <Sparkles size={15} />
            <span>2. Matched Wood Panels in Stock</span>
            {matchedResults.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                {matchedResults.length} with stock
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* ================= STEP 1: ORDER INPUT / EXCEL UPLOAD ================= */}
          {currentStep === 'order_input' && (
            <div className="space-y-5">
              {/* Top Upload Area & Template */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 flex items-center justify-center gap-4 transition cursor-pointer text-center ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">
                      {uploadedFileName ? (
                        <span className="text-emerald-700 font-mono">📄 {uploadedFileName}</span>
                      ) : (
                        <span>Click or Drag & Drop Excel / CSV order here</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Supports .xlsx, .xls, .csv (handles inches, decimals like 0.675, & soot notation like 5soot)
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <FileText size={15} className="text-emerald-600" />
                      <span>Clean Excel Format</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Use our simple template (Part Name, Length, Width, Thickness, Qty) to eliminate confusing rough cut formulas.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                    onClick={downloadOrderTemplateExcel}
                  >
                    <Download size={14} />
                    <span>Download Template (.xlsx)</span>
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Order Meta Header */}
              <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Order / Desk Title:
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                    placeholder="e.g. Bunton Desk (BS-BUN-06)"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                      checked={allowRotation}
                      onChange={(e) => setAllowRotation(e.target.checked)}
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Allow 90° Cut Rotation
                    </span>
                  </label>
                </div>
              </div>

              {/* Editable BOM Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs">
                    <strong className="text-slate-800">Order Panel Sizes</strong>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[11px]">
                      {items.length} Sizes
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                      {items.reduce((sum, it) => sum + (it.quantityNeeded || 0), 0)} Pcs
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                      onClick={handleAddRow}
                    >
                      <Plus size={13} />
                      <span>Add Panel Size</span>
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                        onClick={() => {
                          if (window.confirm('Clear all order lines?')) setItems([]);
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No panel sizes added yet. Upload an Excel file or click "Add Panel Size".
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-8">#</th>
                          <th className="p-2.5">Part Name</th>
                          <th className="p-2.5 w-24">Length (in)</th>
                          <th className="p-2.5 w-24">Width (in)</th>
                          <th className="p-2.5 w-28">Thickness (in)</th>
                          <th className="p-2.5 w-20">Qty</th>
                          <th className="p-2.5 w-28">Wood</th>
                          <th className="p-2.5">Remarks</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => (
                          <tr key={it.id} className="hover:bg-slate-50/60">
                            <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded font-medium focus:bg-white focus:outline-none"
                                value={it.partName}
                                onChange={(e) => handleUpdateItem(it.id, 'partName', e.target.value)}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded font-mono font-bold focus:bg-white focus:outline-none"
                                value={it.length}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'length',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded font-mono font-bold focus:bg-white focus:outline-none"
                                value={it.width}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'width',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded font-mono font-bold text-emerald-800 focus:bg-white focus:outline-none"
                                value={it.thickness}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'thickness',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={1}
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded font-mono font-bold focus:bg-white focus:outline-none"
                                value={it.quantityNeeded}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'quantityNeeded',
                                    Math.max(1, parseInt(e.target.value, 10) || 1)
                                  )
                                }
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded focus:bg-white focus:outline-none"
                                value={it.woodType || 'Mango Wood'}
                                onChange={(e) => handleUpdateItem(it.id, 'woodType', e.target.value)}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 rounded text-slate-500 focus:bg-white focus:outline-none"
                                value={it.remarks || ''}
                                onChange={(e) => handleUpdateItem(it.id, 'remarks', e.target.value)}
                                placeholder="Optional"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                onClick={() => handleRemoveRow(it.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
                  disabled={items.length === 0}
                  onClick={() => setCurrentStep('results')}
                >
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Inspect Wood Panels in Stock ({items.length} Panel Sizes)</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: WOOD PANEL MATCH & SELECTION ================= */}
          {currentStep === 'results' && (
            <div className="space-y-5">
              {/* Top Banner Stats */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="text-2xl font-black font-mono text-emerald-700 leading-tight">
                      {matchedResults.length}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      Sizes in Stock
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 m-0">
                      🪵 Select Preferred Wood Panels:
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      Panels arranged in <strong>ascending order of offcut % (lowest waste first)</strong>. Inspect front & back grain photos to pick the best piece for each item!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    onClick={() => exportProductionPlanToExcel(matchSummary, selectedCandidates)}
                  >
                    <Download size={14} />
                    <span>Export (.xlsx)</span>
                  </button>

                  {onBulkDeductStock && matchedResults.length > 0 && !isDeducted && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                      onClick={handleDeductAll}
                      disabled={isDeducting}
                    >
                      <PackageCheck size={15} />
                      <span>{isDeducting ? 'Deducting...' : 'Allocate Selected Panels'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isDeducted && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
                  <PackageCheck size={20} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Selected Wood Panels Allocated in Firestore!</strong>
                    <span>Your chosen stock panels have been reserved and synchronized across factory devices.</span>
                  </div>
                </div>
              )}

              {/* Matched Items List */}
              {matchedResults.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                  <AlertCircle size={36} className="text-slate-400 mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 m-0">No Matching Stock Available in Cloud</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-0">
                    None of the {items.length} order sizes have candidate panels with matching thickness in Firestore.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {matchedResults.map((result, rIdx) => {
                    const { orderItem, candidates } = result;
                    const selectedIdx = selectedCandidates[orderItem.id] ?? 0;
                    const activeCandidate = candidates[selectedIdx] || candidates[0];

                    return (
                      <div key={orderItem.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        {/* Order Item Target Bar */}
                        <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-[10px]">
                              #{rIdx + 1}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">{orderItem.partName}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold text-xs">
                              Required: {formatDimensions(orderItem.length, orderItem.width, orderItem.thickness)}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-xs">
                              Qty: {orderItem.quantityNeeded} pcs
                            </span>
                            {orderItem.remarks && (
                              <span className="text-slate-400 text-xs italic">({orderItem.remarks})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                            <CheckCircle2 size={14} />
                            <span>{candidates.length} Available Option{candidates.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Candidates Horizontal Scroll */}
                        <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                          {candidates.map((cand, cIdx) => (
                            <CandidateStockCard
                              key={`${cand.panel.id}-${cIdx}`}
                              candidate={cand}
                              isSelected={cIdx === selectedIdx}
                              onSelect={() => handleSelectCandidate(orderItem.id, cIdx)}
                            />
                          ))}
                        </div>

                        {/* Active Selection Cut Layout & Details */}
                        {activeCandidate && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Scissors size={14} className="text-emerald-600" />
                                <span>
                                  Cut Layout for Selected Panel:{' '}
                                  <strong className="font-mono">
                                    {formatDimensions(
                                      activeCandidate.panel.length,
                                      activeCandidate.panel.width,
                                      activeCandidate.panel.thickness
                                    )}
                                  </strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                                <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                                  Offcut: <strong className="text-emerald-700">{activeCandidate.wastePercentage}%</strong>
                                </span>
                                <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                                  Yield: <strong>{activeCandidate.yieldPerPanel} pc/panel</strong>
                                </span>
                                <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-emerald-800 font-bold">
                                  Using: {activeCandidate.panelsNeededForOrder} of {activeCandidate.availableInStock} in stock
                                </span>
                                {activeCandidate.cutLayout.remnantLength &&
                                  activeCandidate.cutLayout.remnantLength > 2 && (
                                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">
                                      Leftover: ~{formatInches(activeCandidate.cutLayout.remnantLength)} ×{' '}
                                      {formatInches(
                                        activeCandidate.cutLayout.remnantWidth ||
                                          activeCandidate.panel.width
                                      )}
                                    </span>
                                  )}
                              </div>
                            </div>

                            <div className="w-full md:w-64 flex-shrink-0">
                              <VisualCutDiagram layout={activeCandidate.cutLayout} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Collapsible for Unmatched Items */}
              {unmatchedResults.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    onClick={() => setShowUnmatchedItems(!showUnmatchedItems)}
                  >
                    <span>
                      ℹ️ {unmatchedResults.length} Order Sizes Have No Matching Stock in Firestore (0 Stock)
                    </span>
                    {showUnmatchedItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showUnmatchedItems && (
                    <div className="p-3 border-t border-slate-200 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-bold text-slate-400">
                          <tr>
                            <th className="p-2">Part Name</th>
                            <th className="p-2">Required Size (L × W × T)</th>
                            <th className="p-2">Order Qty</th>
                            <th className="p-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unmatchedResults.map((un, uIdx) => (
                            <tr key={uIdx}>
                              <td className="p-2 font-medium">{un.orderItem.partName}</td>
                              <td className="p-2 font-mono">
                                {formatDimensions(
                                  un.orderItem.length,
                                  un.orderItem.width,
                                  un.orderItem.thickness
                                )}
                              </td>
                              <td className="p-2 font-mono">{un.orderItem.quantityNeeded} pcs</td>
                              <td className="p-2 text-slate-400">No stock panel in Firestore fits these dimensions</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  onClick={() => setCurrentStep('order_input')}
                >
                  ← Back to Order Items
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    onClick={() => exportProductionPlanToExcel(matchSummary, selectedCandidates)}
                  >
                    <Download size={14} />
                    <span>Export Plan (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
