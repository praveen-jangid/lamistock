import React, { useState } from 'react';
import type { LaminatedPanel } from '../../types/panel';
import { formatDimensions } from '../../utils/units';
import { DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../../services/imageCompressor';
import {
  RotateCw,
  Sparkles,
  Share2,
  Edit,
  Trash2,
  TreePine
} from 'lucide-react';

interface PanelCardProps {
  panel: LaminatedPanel;
  onEdit: (panel: LaminatedPanel) => void;
  onDelete: (panel: LaminatedPanel) => void;
  onShare: (panel: LaminatedPanel) => void;
  onMatchThis: (panel: LaminatedPanel) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  onEdit,
  onDelete,
  onShare,
  onMatchThis
}) => {
  const [showBack, setShowBack] = useState(false);

  const frontImg = panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE;
  const backImg = panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE;
  const activeImg = showBack ? backImg : frontImg;

  return (
    <div className="mango-panel-card">
      {/* Media Box with Photo & Flip */}
      <div className="card-media-box">
        <img
          src={activeImg}
          alt={showBack ? 'Back Face' : 'Front Face'}
          className="card-media-img"
        />

        {/* Face Indicator Badge */}
        <div className="face-indicator-pill">
          {showBack ? 'Back Face' : 'Front Face'}
        </div>

        {/* Flip Button */}
        <button
          type="button"
          className="btn-flip-face"
          onClick={() => setShowBack(!showBack)}
          title="Toggle Front / Back face view"
        >
          <RotateCw size={13} />
          <span>{showBack ? 'View Front' : 'View Back'}</span>
        </button>

        {/* Stock Quantity Pill */}
        <div className="card-stock-pill">
          <span className="stock-qty-number">{panel.quantity}</span>
          <span className="stock-qty-text">{panel.quantity === 1 ? 'Panel' : 'Panels'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-content-body">
        <div className="card-main-header">
          <div className="wood-type-tag">
            <TreePine size={14} />
            <span>{panel.woodType || 'Laminated Wood'}</span>
          </div>
        </div>

        {/* Large Dimensions Callout */}
        <div className="dimensions-callout">
          <span className="dim-label">Dimensions (L × W × T):</span>
          <h3 className="dim-value">
            {formatDimensions(panel.length, panel.width, panel.thickness)}
          </h3>
        </div>

        {panel.notes && (
          <p className="card-notes" title={panel.notes}>
            📝 {panel.notes}
          </p>
        )}
      </div>

      {/* Actions Footer */}
      <div className="card-footer-actions">
        <button
          type="button"
          className="btn-match-order"
          onClick={() => onMatchThis(panel)}
        >
          <Sparkles size={15} />
          <span>Match Order</span>
        </button>

        <button
          type="button"
          className="btn-card-icon"
          onClick={() => onShare(panel)}
          title="Share with Production Manager"
        >
          <Share2 size={16} />
        </button>

        <button
          type="button"
          className="btn-card-icon"
          onClick={() => onEdit(panel)}
          title="Edit dimensions or stock"
        >
          <Edit size={16} />
        </button>

        <button
          type="button"
          className="btn-card-icon btn-delete"
          onClick={() => onDelete(panel)}
          title="Delete panel"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
