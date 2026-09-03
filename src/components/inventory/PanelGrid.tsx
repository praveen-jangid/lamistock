import React from 'react';
import type { LaminatedPanel } from '../../types/panel';
import { PanelCard } from './PanelCard';
import { TreePine, Plus } from 'lucide-react';

interface PanelGridProps {
  panels: LaminatedPanel[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (panel: LaminatedPanel) => void;
  onDelete: (panel: LaminatedPanel) => void;
  onShare: (panel: LaminatedPanel) => void;
  onMatchThis: (panel: LaminatedPanel) => void;
}

export const PanelGrid: React.FC<PanelGridProps> = ({
  panels,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onShare,
  onMatchThis
}) => {
  if (isLoading) {
    return (
      <div className="panels-loading-state">
        <div className="spinner-wooden" />
        <p>Loading lamination panel stock...</p>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="panels-empty-state">
        <div className="empty-icon-circle">
          <TreePine size={40} />
        </div>
        <h3>No Lamination Panels In Stock</h3>
        <p>
          Add surplus laminated panels to manage stock and match with incoming furniture orders.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={onAddNew}>
          <Plus size={16} />
          <span>Add First Panel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="panel-grid-container">
      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
          onMatchThis={onMatchThis}
        />
      ))}
    </div>
  );
};
