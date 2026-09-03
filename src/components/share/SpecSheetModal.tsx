import React, { useState } from 'react';
import type { LaminatedPanel, MatchResult } from '../../types/panel';
import { formatDimensions } from '../../utils/units';
import { DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../../services/imageCompressor';
import {
  X,
  Printer,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  TreePine
} from 'lucide-react';

interface SpecSheetModalProps {
  isOpen: boolean;
  panel: LaminatedPanel | null;
  matchResult?: MatchResult | null;
  onClose: () => void;
}

export const SpecSheetModal: React.FC<SpecSheetModalProps> = ({
  isOpen,
  panel,
  matchResult,
  onClose
}) => {
  if (!isOpen || !panel) return null;

  const [copied, setCopied] = useState(false);
  const [managerPhone, setManagerPhone] = useState('');

  const frontImg = panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE;
  const backImg = panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE;

  // Format WhatsApp message text
  const generateWhatsAppMessage = (): string => {
    let msg = `🏭 *LAMINATED PANEL SPEC SHEET*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🪵 *Material:* ${panel.woodType || 'Laminated Wood'}\n`;
    msg += `📐 *Dimensions:* ${formatDimensions(panel.length, panel.width, panel.thickness)}\n`;
    msg += `📊 *Stock Available:* ${panel.quantity} Panel(s)\n`;

    if (matchResult) {
      msg += `\n🎯 *ORDER MATCH PROPOSAL:*\n`;
      msg += `• Cut Yield: ${matchResult.yieldPerSheet} pcs / panel\n`;
      msg += `• Cut Waste: ${matchResult.wastePercentage}%\n`;
      msg += `• Panels Needed: ${matchResult.totalPanelsRequired}\n`;
    }

    if (panel.notes) {
      msg += `\n📝 *Notes:* ${panel.notes}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Please check front and back face photos & confirm if this stock works for production._`;

    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const phoneClean = managerPhone.replace(/[^0-9]/g, '');
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyClipboard = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-lg spec-sheet-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header no-print">
          <div className="modal-title-group">
            <h2 className="modal-title">
              📋 Production Spec Sheet
            </h2>
            <p className="modal-subtitle">
              Verify Front & Back photos and dimensions in inches with your Production Manager.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Spec Card Area */}
        <div className="spec-card-printable" id="printable-spec-sheet">
          {/* Header Banner */}
          <div className="spec-print-header">
            <div className="spec-brand-block">
              <span className="spec-company-label">FURNITURE MANUFACTURING • STOCK SPECIFICATION</span>
              <h1 className="spec-panel-code">{formatDimensions(panel.length, panel.width, panel.thickness)}</h1>
            </div>
            <div className="spec-location-block">
              <div className="wood-type-tag">
                <TreePine size={16} />
                <span>{panel.woodType || 'Laminated Wood'}</span>
              </div>
              <span className="spec-qty-pill">{panel.quantity} Panel(s) Available</span>
            </div>
          </div>

          {/* Dual Photos: Front & Back side by side */}
          <div className="spec-photos-comparison">
            {/* Front Photo */}
            <div className="spec-photo-card">
              <div className="spec-photo-label-bar">
                <span className="face-tag front-tag">FRONT FACE (A-SIDE)</span>
              </div>
              <div className="spec-image-frame">
                <img src={frontImg} alt="Front Face" className="spec-full-img" />
              </div>
            </div>

            {/* Back Photo */}
            <div className="spec-photo-card">
              <div className="spec-photo-label-bar">
                <span className="face-tag back-tag">BACK FACE (B-SIDE)</span>
              </div>
              <div className="spec-image-frame">
                <img src={backImg} alt="Back Face" className="spec-full-img" />
              </div>
            </div>
          </div>

          {/* Detailed Technical Table */}
          <div className="spec-technical-grid">
            <div className="tech-item">
              <span className="tech-label">Dimensions (L × W × T):</span>
              <strong className="tech-val highlight-lg">
                {formatDimensions(panel.length, panel.width, panel.thickness)}
              </strong>
            </div>

            <div className="tech-item">
              <span className="tech-label">Wood Material:</span>
              <strong className="tech-val">{panel.woodType || 'Laminated Wood'}</strong>
            </div>

            <div className="tech-item">
              <span className="tech-label">Stock Quantity:</span>
              <strong className="tech-val">{panel.quantity} Panel(s)</strong>
            </div>
          </div>

          {/* If opened as part of a match result */}
          {matchResult && (
            <div className="spec-match-summary-banner">
              <div className="match-banner-header">
                <Sparkles size={16} />
                <strong>Order Match Proposed:</strong>
              </div>
              <div className="match-banner-grid">
                <div>Yield: <strong>{matchResult.yieldPerSheet} pcs / panel</strong></div>
                <div>Offcut Waste: <strong>{matchResult.wastePercentage}%</strong></div>
                <div>Panels Required: <strong>{matchResult.totalPanelsRequired}</strong></div>
              </div>
            </div>
          )}

          {panel.notes && (
            <div className="spec-notes-box">
              <strong>Factory Remarks:</strong> {panel.notes}
            </div>
          )}
        </div>

        {/* Modal Action Bar (WhatsApp, Print, Copy) */}
        <div className="spec-actions-toolbar no-print">
          <div className="whatsapp-input-group">
            <span className="wa-label">Manager WhatsApp #:</span>
            <input
              type="tel"
              className="form-input wa-phone-input"
              placeholder="e.g. +91 9876543210 (Optional)"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
            />
          </div>

          <div className="action-buttons-cluster">
            <button
              type="button"
              className="btn-share-whatsapp"
              onClick={handleShareWhatsApp}
              title="Open WhatsApp with pre-filled panel specifications"
            >
              <MessageCircle size={18} />
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              className="btn-action-outline"
              onClick={handleCopyClipboard}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied Specs!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              className="btn-action-outline"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Print Spec Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
