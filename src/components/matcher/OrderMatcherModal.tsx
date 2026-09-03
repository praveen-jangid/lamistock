import React, { useState, useMemo } from 'react';
import type { LaminatedPanel, OrderRequirement, MatchResult } from '../../types/panel';
import { formatDimensions, formatInches } from '../../utils/units';
import { matchOrderWithInventory } from '../../services/matcher';
import { VisualCutDiagram } from './VisualCutDiagram';
import { DEFAULT_MANGO_FRONT_IMAGE } from '../../services/imageCompressor';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Box,
  Check,
  TreePine
} from 'lucide-react';

interface OrderMatcherModalProps {
  isOpen: boolean;
  inventory: LaminatedPanel[];
  initialPanel?: LaminatedPanel | null;
  onClose: () => void;
  onShareResult: (panel: LaminatedPanel, matchResult?: MatchResult) => void;
  onDeductStock?: (panelId: string, quantityToDeduct: number) => Promise<void>;
}

export const OrderMatcherModal: React.FC<OrderMatcherModalProps> = ({
  isOpen,
  inventory,
  initialPanel,
  onClose,
  onShareResult,
  onDeductStock
}) => {
  if (!isOpen) return null;

  // Order Input State in Inches
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reqLength, setReqLength] = useState<number>(initialPanel ? initialPanel.length : 36);
  const [reqWidth, setReqWidth] = useState<number>(initialPanel ? initialPanel.width : 24);
  const [reqThickness, setReqThickness] = useState<number>(initialPanel ? initialPanel.thickness : 0.75);
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [quantityNeeded, setQuantityNeeded] = useState<number>(2);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [deductedPanels, setDeductedPanels] = useState<Record<string, boolean>>({});

  // Compute Match Results
  const matchResults: MatchResult[] = useMemo(() => {
    const order: OrderRequirement = {
      orderNumber,
      length: Number(reqLength),
      width: Number(reqWidth),
      thickness: Number(reqThickness),
      quantityNeeded: Number(quantityNeeded),
      allowRotation
    };

    return matchOrderWithInventory(order, inventory);
  }, [
    orderNumber,
    reqLength,
    reqWidth,
    reqThickness,
    allowRotation,
    quantityNeeded,
    inventory
  ]);

  const selectedResult = matchResults[activeResultIndex] || matchResults[0];

  const handleDeduct = async (result: MatchResult) => {
    if (!onDeductStock) return;
    const confirmDeduct = window.confirm(
      `Reserve / Deduct ${result.totalPanelsRequired} panel(s) of [${formatDimensions(result.panel.length, result.panel.width, result.panel.thickness)}] from stock for this order?`
    );
    if (!confirmDeduct) return;

    try {
      await onDeductStock(result.panel.id, result.totalPanelsRequired);
      setDeductedPanels((prev) => ({ ...prev, [result.panel.id]: true }));
    } catch (e) {
      console.error('Error deducting stock:', e);
      alert('Could not deduct stock.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              <Sparkles className="sparkle-icon" /> Smart Order Matcher & Cut Optimizer
            </h2>
            <p className="modal-subtitle">
              Enter required panel size in inches to instantly find matching extra stock.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="matcher-layout-grid">
          {/* Left Column: Order Input Form */}
          <div className="matcher-form-panel">
            <h3 className="panel-subheading">📋 New Order Dimensions (Inches)</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Length (Inches): <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={reqLength}
                  onChange={(e) => setReqLength(Number(e.target.value))}
                  min={1}
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
                  value={reqWidth}
                  onChange={(e) => setReqWidth(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2 mt-2">
              <div className="form-group">
                <label className="form-label">
                  Thickness (Inches): <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={reqThickness}
                  onChange={(e) => setReqThickness(Number(e.target.value))}
                  min={0.1}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pieces Needed: <span className="req">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={quantityNeeded}
                  onChange={(e) => setQuantityNeeded(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </div>
            </div>

            <div className="form-group mt-2">
              <label className="form-label">Order Reference #:</label>
              <input
                type="text"
                className="form-input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <div className="checkboxes-stack mt-3">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={allowRotation}
                  onChange={(e) => setAllowRotation(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-text">
                  Allow 90° Cut Rotation (Yield optimization)
                </span>
              </label>
            </div>

            {/* Quick Size Presets in Inches */}
            <div className="quick-shutter-sizes mt-3">
              <span className="helper-label">⚡ Common Order Sizes:</span>
              <div className="quick-tags-list">
                <button
                  type="button"
                  className="size-tag-btn"
                  onClick={() => {
                    setReqLength(72);
                    setReqWidth(36);
                    setReqThickness(0.75);
                  }}
                >
                  Table Top (72″ × 36″)
                </button>
                <button
                  type="button"
                  className="size-tag-btn"
                  onClick={() => {
                    setReqLength(48);
                    setReqWidth(24);
                    setReqThickness(0.75);
                  }}
                >
                  Desk / Shelf (48″ × 24″)
                </button>
                <button
                  type="button"
                  className="size-tag-btn"
                  onClick={() => {
                    setReqLength(30);
                    setReqWidth(18);
                    setReqThickness(0.75);
                  }}
                >
                  Drawer / Shutter (30″ × 18″)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Match Results & Cut Optimization */}
          <div className="matcher-results-panel">
            <div className="results-header-row">
              <div className="results-title-group">
                <h3 className="panel-subheading">
                  🎯 Found {matchResults.length} Matching Stock Option{matchResults.length === 1 ? '' : 's'}
                </h3>
                <span className="results-badge">
                  Target: {formatInches(reqLength)} × {formatInches(reqWidth)} × {formatInches(reqThickness)} ({quantityNeeded} pcs)
                </span>
              </div>
            </div>

            {matchResults.length === 0 ? (
              <div className="no-matches-state">
                <AlertTriangle size={40} className="empty-warn-icon" />
                <h4>No Matching Surplus Panels in Stock</h4>
                <p>
                  No panel in your stock satisfies {formatInches(reqLength)} × {formatInches(reqWidth)} in {formatInches(reqThickness)} thickness.
                </p>
              </div>
            ) : (
              <div className="results-content-split">
                {/* Results List */}
                <div className="results-scroll-list">
                  {matchResults.map((result, idx) => {
                    const isSelected = idx === activeResultIndex;
                    const { panel, matchType, matchScore, yieldPerSheet, wastePercentage } = result;

                    return (
                      <div
                        key={panel.id}
                        className={`result-item-card ${isSelected ? 'active-result' : ''}`}
                        onClick={() => setActiveResultIndex(idx)}
                      >
                        <div className="result-card-top">
                          <span className={`match-type-pill match-${matchType.toLowerCase()}`}>
                            {matchType === 'EXACT' && '⭐ Exact Match'}
                            {matchType === 'MULTI_YIELD' && `✨ High Yield (${yieldPerSheet} pcs/panel)`}
                            {matchType === 'OVERSIZED_CUT' && '✂️ Cut-Down Match'}
                          </span>
                          <span className="match-score-badge">{matchScore}% Fit</span>
                        </div>

                        <div className="result-card-main">
                          <div className="result-thumb-box">
                            <img
                              src={panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE}
                              alt="Laminated Wood"
                              className="result-thumb"
                            />
                          </div>

                          <div className="result-details">
                            <div className="result-name-row">
                              <strong className="result-laminate-name">
                                {formatDimensions(panel.length, panel.width, panel.thickness)}
                              </strong>
                            </div>
                            <div className="result-meta-line">
                              <TreePine size={12} style={{ display: 'inline', marginRight: 4 }} />
                              <span>{panel.woodType || 'Laminated Wood'}</span>
                            </div>
                            <div className="result-stock-line">
                              <strong className="text-highlight">{panel.quantity} panel(s) in stock</strong>
                            </div>
                          </div>
                        </div>

                        <div className="result-card-bottom">
                          <span className="yield-calc-tag">
                            Yield: <strong>{yieldPerSheet}</strong> piece{yieldPerSheet === 1 ? '' : 's'}/panel
                          </span>
                          <span className="waste-calc-tag">
                            {wastePercentage}% offcut
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Result Inspection & Cut Diagram */}
                {selectedResult && (
                  <div className="result-inspection-box">
                    <div className="inspection-header">
                      <div className="inspection-title-block">
                        <h4>{formatDimensions(selectedResult.panel.length, selectedResult.panel.width, selectedResult.panel.thickness)}</h4>
                        <span className="inspection-rack-tag">🪵 {selectedResult.panel.woodType || 'Laminated Wood'}</span>
                      </div>

                      <div className="inspection-actions">
                        <button
                          type="button"
                          className="btn-action-share"
                          onClick={() => onShareResult(selectedResult.panel, selectedResult)}
                          title="Share Spec Sheet with Production Manager"
                        >
                          <Share2 size={16} />
                          <span>Share with Manager</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Cut Diagram */}
                    <VisualCutDiagram
                      layout={selectedResult.cutLayout}
                    />

                    {/* Match Breakdown & Reasons */}
                    <div className="match-reasons-card">
                      <h5>Match Analysis:</h5>
                      <ul className="reasons-list">
                        {selectedResult.matchReasons.map((r, i) => (
                          <li key={i} className="reason-positive">
                            <CheckCircle2 size={14} /> <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Fulfillment Summary */}
                    <div className="fulfillment-summary-card">
                      <div className="fulfill-stat">
                        <span className="fulfill-label">Panels Needed to Fulfill:</span>
                        <span className="fulfill-value highlight-fulfill">
                          {selectedResult.totalPanelsRequired} of {selectedResult.panel.quantity} Available
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`btn-reserve-stock ${deductedPanels[selectedResult.panel.id] ? 'btn-reserved' : ''}`}
                        onClick={() => handleDeduct(selectedResult)}
                        disabled={deductedPanels[selectedResult.panel.id]}
                      >
                        {deductedPanels[selectedResult.panel.id] ? (
                          <>
                            <Check size={16} /> Reserved for Order
                          </>
                        ) : (
                          <>
                            <Box size={16} /> Reserve / Deduct {selectedResult.totalPanelsRequired} Panel(s)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
