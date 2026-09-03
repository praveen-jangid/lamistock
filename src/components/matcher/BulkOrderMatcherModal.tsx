import React, { useState, useMemo, useRef } from 'react';
import type {
  LaminatedPanel,
  BulkOrderItem,
  BulkOrderMatchSummary,
  BulkCandidateCut
} from '../../types/panel';
import {
  parseOrderSpreadsheet,
  downloadOrderTemplateExcel,
  parseDimensionToInches
} from '../../utils/excelParser';
import {
  matchBulkOrderWithInventory,
  exportProductionPlanToExcel
} from '../../services/bulkMatcher';
import { formatDimensions, formatInches } from '../../utils/units';
import { VisualCutDiagram } from './VisualCutDiagram';
import {
  DEFAULT_MANGO_FRONT_IMAGE,
  DEFAULT_MANGO_BACK_IMAGE
} from '../../services/imageCompressor';
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
      className={`candidate-wood-card ${isSelected ? 'candidate-card-selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title="Click to select this stock panel for cutting"
    >
      {/* Header with Selection Radio & Offcut Badge */}
      <div className="candidate-card-top-bar">
        <div className="candidate-select-indicator">
          <span className={`candidate-radio-circle ${isSelected ? 'active' : ''}`}>
            {isSelected && <Check size={11} />}
          </span>
          <span className="candidate-select-text font-bold">
            {isSelected ? 'Selected Wood' : 'Use This Wood'}
          </span>
        </div>

        <div className="candidate-badge-wrap">
          {isExactMatch ? (
            <span className="pill-badge-exact">⭐ Exact Size (0% Offcut)</span>
          ) : (
            <span
              className={`pill-badge-offcut ${
                wastePercentage <= 15
                  ? 'offcut-low'
                  : wastePercentage <= 30
                  ? 'offcut-med'
                  : 'offcut-high'
              }`}
            >
              ✂️ {wastePercentage}% Offcut
            </span>
          )}
        </div>
      </div>

      {/* Wood Photo Thumbnail with Flip Button */}
      <div className="candidate-photo-box">
        <img
          src={activeImg}
          alt={showBack ? 'Back Face' : 'Front Face'}
          className="candidate-wood-image"
        />

        <div className="candidate-face-indicator">
          {showBack ? 'Back Face' : 'Front Face'}
        </div>

        <button
          type="button"
          className="btn-candidate-flip"
          onClick={(e) => {
            e.stopPropagation();
            setShowBack(!showBack);
          }}
          title="Toggle Front / Back Face View"
        >
          <RotateCw size={11} />
          <span>{showBack ? 'Front' : 'Back'}</span>
        </button>

        <div className="candidate-stock-pill">
          <span className="stock-qty-number">{panel.quantity}</span>
          <span className="stock-qty-text">{panel.quantity === 1 ? 'in stock' : 'in stock'}</span>
        </div>
      </div>

      {/* Panel Info & Dimensions */}
      <div className="candidate-info-block">
        <div className="candidate-size-row font-mono">
          {formatDimensions(panel.length, panel.width, panel.thickness)}
        </div>

        <div className="candidate-wood-meta">
          <span>🪵 {panel.woodType || 'Mango Wood'}</span>
          {panel.notes && (
            <span className="candidate-notes-tag" title={panel.notes}>
              • 📝 {panel.notes}
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="candidate-stats-grid">
          <div className="cand-stat">
            <span className="cand-label">Yield / Panel:</span>
            <span className="cand-val font-bold">
              {yieldPerPanel} {yieldPerPanel === 1 ? 'pc' : 'pcs'}
            </span>
          </div>
          <div className="cand-stat">
            <span className="cand-label">Panels Needed:</span>
            <span className="cand-val font-bold text-emerald">
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
  if (!isOpen) return null;

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
      maxOffcutLimit: 50, // Allows potential matches up to 50% offcut as requested
      thicknessTolerance: 0.065 // Accurately matches 0.675" with 0.625" (5 soot)
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container modal-xxl bulk-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="bulk-title-row">
              <h2 className="modal-title">
                <FileSpreadsheet className="sparkle-icon" /> Wood Panel Matcher & Cut Selector
              </h2>
              <span className="badge-inventory-count">
                {inventory.length} Stock Sizes Available in Cloud
              </span>
            </div>
            <p className="modal-subtitle">
              Inspect actual wood pieces from Firestore, view front/back grain photos, and select the best cut option for each order size.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="bulk-step-bar">
          <button
            type="button"
            className={`step-tab-btn ${currentStep === 'order_input' ? 'active' : ''}`}
            onClick={() => setCurrentStep('order_input')}
          >
            <Layers size={16} />
            <span>1. Order Panels & Excel Upload</span>
            <span className="step-count-bubble">{items.length} sizes</span>
          </button>

          <button
            type="button"
            className={`step-tab-btn ${currentStep === 'results' ? 'active' : ''}`}
            onClick={() => setCurrentStep('results')}
          >
            <Sparkles size={16} />
            <span>2. Matched Wood Panels in Stock</span>
            {matchedResults.length > 0 && (
              <span className="step-saved-bubble">
                {matchedResults.length} with stock in cloud
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="bulk-modal-body">
          {/* ================= STEP 1: ORDER INPUT / EXCEL UPLOAD ================= */}
          {currentStep === 'order_input' && (
            <div className="step-content-box">
              {/* Top Upload Area & Template */}
              <div className="upload-ribbon-grid">
                <div
                  className={`file-dropzone ${isDragging ? 'drag-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="dropzone-icon-box">
                    <UploadCloud size={28} />
                  </div>
                  <div className="dropzone-text-block">
                    <div className="dropzone-headline">
                      {uploadedFileName ? (
                        <span className="uploaded-filename">📄 {uploadedFileName}</span>
                      ) : (
                        <span>Click or Drag & Drop Excel / CSV order here</span>
                      )}
                    </div>
                    <p className="dropzone-hint">
                      Supports .xlsx, .xls, .csv (handles inches, decimals like 0.675, & soot notation like 5soot)
                    </p>
                  </div>
                </div>

                <div className="template-download-card">
                  <div className="template-card-header">
                    <FileText size={18} className="text-emerald" />
                    <strong>Clean Excel Format</strong>
                  </div>
                  <p className="template-card-text">
                    Use our simple format (Part Name, Length, Width, Thickness, Qty) to eliminate confusing rough cut formulas.
                  </p>
                  <button
                    type="button"
                    className="btn-download-template"
                    onClick={downloadOrderTemplateExcel}
                  >
                    <Download size={15} />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="banner-error">
                  <AlertCircle size={18} />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Order Meta Header */}
              <div className="order-meta-row">
                <div className="order-name-input-group">
                  <label className="form-label">Order / Desk Title:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                    placeholder="e.g. Bunton Desk (BS-BUN-06)"
                  />
                </div>

                <div className="matching-options-row">
                  <label className="checkbox-label" title="Allows 90 degree cut rotation if dimensions fit">
                    <input
                      type="checkbox"
                      checked={allowRotation}
                      onChange={(e) => setAllowRotation(e.target.checked)}
                    />
                    <span>Allow 90° Cut Rotation</span>
                  </label>
                </div>
              </div>

              {/* Editable BOM Table */}
              <div className="bulk-table-container">
                <div className="table-actions-header">
                  <div className="table-stats-left">
                    <strong>Order Panel Sizes</strong>
                    <span className="pill-count">{items.length} Sizes</span>
                    <span className="pill-count">
                      {items.reduce((sum, it) => sum + (it.quantityNeeded || 0), 0)} Total Pieces
                    </span>
                  </div>

                  <div className="table-actions-right">
                    <button type="button" className="btn-table-action" onClick={handleAddRow}>
                      <Plus size={14} />
                      <span>Add Panel Size</span>
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        className="btn-table-action text-danger"
                        onClick={() => {
                          if (window.confirm('Clear all order lines?')) setItems([]);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="empty-order-state">
                    <p>No panel sizes added yet. Upload an Excel file or click "Add Panel Size".</p>
                  </div>
                ) : (
                  <div className="table-scroll-wrap">
                    <table className="bulk-order-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Part Name</th>
                          <th style={{ width: '110px' }}>Length (in)</th>
                          <th style={{ width: '110px' }}>Width (in)</th>
                          <th style={{ width: '130px' }}>Thickness (in)</th>
                          <th style={{ width: '90px' }}>Qty</th>
                          <th style={{ width: '140px' }}>Wood</th>
                          <th>Remarks</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={it.id}>
                            <td className="row-index">{idx + 1}</td>
                            <td>
                              <input
                                type="text"
                                className="table-cell-input"
                                value={it.partName}
                                onChange={(e) => handleUpdateItem(it.id, 'partName', e.target.value)}
                                placeholder="Part Name"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-cell-input font-mono"
                                value={it.length}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'length',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                                placeholder="e.g. 27"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-cell-input font-mono"
                                value={it.width}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'width',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                                placeholder="e.g. 15.75"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-cell-input font-mono font-bold"
                                value={it.thickness}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'thickness',
                                    parseDimensionToInches(e.target.value)
                                  )
                                }
                                placeholder="e.g. 0.675 or 5soot"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="table-cell-input font-mono"
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
                            <td>
                              <input
                                type="text"
                                className="table-cell-input"
                                value={it.woodType || 'Mango Wood'}
                                onChange={(e) => handleUpdateItem(it.id, 'woodType', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="table-cell-input"
                                value={it.remarks || ''}
                                onChange={(e) => handleUpdateItem(it.id, 'remarks', e.target.value)}
                                placeholder="Optional notes"
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn-icon-danger"
                                onClick={() => handleRemoveRow(it.id)}
                                title="Remove size"
                              >
                                <Trash2 size={15} />
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
              <div className="bulk-footer-actions">
                <button
                  type="button"
                  className="btn-primary-large"
                  disabled={items.length === 0}
                  onClick={() => setCurrentStep('results')}
                >
                  <Sparkles size={18} />
                  <span>Inspect Wood Panels in Stock ({items.length} Panel Sizes)</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: WOOD PANEL MATCH & SELECTION ================= */}
          {currentStep === 'results' && (
            <div className="step-content-box">
              {/* Top Banner Stats */}
              <div className="stock-selection-hero">
                <div className="hero-stat-box">
                  <div className="hero-stat-num">{matchedResults.length}</div>
                  <div className="hero-stat-label">Order Sizes With Stock in Cloud</div>
                </div>

                <div className="hero-text-box">
                  <h4>🪵 Select Your Preferred Wood Panels:</h4>
                  <p>
                    Below are the exact laminated wood panels from Firestore that can cut each order size, arranged in <strong>ascending order of offcut % (lowest waste first)</strong>. Inspect the front & back grain photos to choose the best piece for each item!
                  </p>
                </div>

                <div className="hero-actions-box">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => exportProductionPlanToExcel(matchSummary, selectedCandidates)}
                    title="Export cut optimization sheet to Excel"
                  >
                    <Download size={15} />
                    <span>Export Plan (.xlsx)</span>
                  </button>

                  {onBulkDeductStock && matchedResults.length > 0 && !isDeducted && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleDeductAll}
                      disabled={isDeducting}
                    >
                      <PackageCheck size={16} />
                      <span>{isDeducting ? 'Deducting...' : 'Allocate Selected Panels'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isDeducted && (
                <div className="banner-success">
                  <PackageCheck size={20} />
                  <div>
                    <strong>Selected Wood Panels Allocated in Firestore!</strong>
                    <p>
                      Your chosen stock panels have been reserved and synchronized across your factory devices.
                    </p>
                  </div>
                </div>
              )}

              {/* Matched Items List (Only items with available stock!) */}
              {matchedResults.length === 0 ? (
                <div className="empty-order-state">
                  <AlertCircle size={36} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
                  <h4>No Matching Stock Available in Cloud</h4>
                  <p>
                    None of the {items.length} order sizes have candidate panels with matching thickness in Firestore.
                  </p>
                </div>
              ) : (
                <div className="matched-order-items-stack">
                  {matchedResults.map((result, rIdx) => {
                    const { orderItem, candidates } = result;
                    const selectedIdx = selectedCandidates[orderItem.id] ?? 0;
                    const activeCandidate = candidates[selectedIdx] || candidates[0];

                    return (
                      <div key={orderItem.id} className="order-item-match-section">
                        {/* Order Item Target Bar */}
                        <div className="order-item-target-header">
                          <div className="target-title-cluster">
                            <span className="target-num-badge">#{rIdx + 1}</span>
                            <div className="target-name font-bold">{orderItem.partName}</div>
                            <div className="target-size-tag font-mono">
                              Required: {formatDimensions(orderItem.length, orderItem.width, orderItem.thickness)}
                            </div>
                            <span className="pill-target-qty font-mono">
                              Order Qty: {orderItem.quantityNeeded} pcs
                            </span>
                            {orderItem.remarks && (
                              <span className="target-remarks-pill">{orderItem.remarks}</span>
                            )}
                          </div>

                          <div className="candidates-counter-tag">
                            <CheckCircle2 size={15} className="text-emerald" />
                            <span>
                              {candidates.length} Available Stock Option{candidates.length > 1 ? 's' : ''} (Sorted by Offcut %)
                            </span>
                          </div>
                        </div>

                        {/* Candidates Horizontal Scroll / Grid (Ascending order of offcut %) */}
                        <div className="candidates-scroll-container">
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
                          <div className="active-cut-details-bar">
                            <div className="active-cut-summary">
                              <div className="active-cut-title">
                                <Scissors size={15} />
                                <span>
                                  Cut Layout for Selected Panel:{' '}
                                  <strong>
                                    {formatDimensions(
                                      activeCandidate.panel.length,
                                      activeCandidate.panel.width,
                                      activeCandidate.panel.thickness
                                    )}
                                  </strong>
                                </span>
                              </div>

                              <div className="active-cut-stats-row">
                                <span className="cut-stat-chip">
                                  Offcut:{' '}
                                  <strong className={activeCandidate.wastePercentage <= 15 ? 'text-emerald' : 'text-muted'}>
                                    {activeCandidate.wastePercentage}%
                                  </strong>
                                </span>
                                <span className="cut-stat-chip">
                                  Yield:{' '}
                                  <strong>
                                    {activeCandidate.yieldPerPanel} pc{activeCandidate.yieldPerPanel > 1 ? 's' : ''} / panel
                                  </strong>
                                </span>
                                <span className="cut-stat-chip">
                                  Using:{' '}
                                  <strong className="text-emerald">
                                    {activeCandidate.panelsNeededForOrder} of {activeCandidate.availableInStock} in stock
                                  </strong>{' '}
                                  ({activeCandidate.remainingStockAfter} surplus left)
                                </span>
                                {activeCandidate.cutLayout.remnantLength &&
                                  activeCandidate.cutLayout.remnantLength > 2 && (
                                    <span className="cut-stat-chip">
                                      Leftover remnant:{' '}
                                      <strong>
                                        ~{formatInches(activeCandidate.cutLayout.remnantLength)} ×{' '}
                                        {formatInches(
                                          activeCandidate.cutLayout.remnantWidth ||
                                            activeCandidate.panel.width
                                        )}
                                      </strong>
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Proportional Cut Diagram */}
                            <div className="active-cut-diagram-holder">
                              <VisualCutDiagram layout={activeCandidate.cutLayout} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional Collapsible for Unmatched Items (No Stock Available) */}
              {unmatchedResults.length > 0 && (
                <div className="unmatched-items-section">
                  <button
                    type="button"
                    className="btn-toggle-unmatched"
                    onClick={() => setShowUnmatchedItems(!showUnmatchedItems)}
                  >
                    <span>
                      ℹ️ {unmatchedResults.length} Order Sizes Have No Matching Stock in Firestore (0 Stock)
                    </span>
                    {showUnmatchedItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showUnmatchedItems && (
                    <div className="unmatched-table-wrap">
                      <table className="bulk-order-table">
                        <thead>
                          <tr>
                            <th>Part Name</th>
                            <th>Required Size (L × W × T)</th>
                            <th>Order Qty</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unmatchedResults.map((un, uIdx) => (
                            <tr key={uIdx}>
                              <td>{un.orderItem.partName}</td>
                              <td className="font-mono">
                                {formatDimensions(
                                  un.orderItem.length,
                                  un.orderItem.width,
                                  un.orderItem.thickness
                                )}
                              </td>
                              <td className="font-mono">{un.orderItem.quantityNeeded} pcs</td>
                              <td className="text-muted">No stock panel in Firestore fits these dimensions</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav */}
              <div className="bulk-footer-actions space-between">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStep('order_input')}
                >
                  <span>← Back to Order Items</span>
                </button>

                <div className="footer-right-cluster">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => exportProductionPlanToExcel(matchSummary, selectedCandidates)}
                  >
                    <Download size={15} />
                    <span>Export Plan (.xlsx)</span>
                  </button>

                  <button type="button" className="btn-primary" onClick={onClose}>
                    <span>Done</span>
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
