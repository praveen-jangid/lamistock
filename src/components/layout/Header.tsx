import React from 'react';
import {
  Sparkles,
  Plus,
  Cloud,
  TreePine
} from 'lucide-react';
import { isFirebaseReady } from '../../services/firebase';

interface HeaderProps {
  onOpenMatcher: () => void;
  onOpenAddPanel: () => void;
  onOpenFirebaseSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMatcher,
  onOpenAddPanel,
  onOpenFirebaseSettings
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo & Factory Badge */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <TreePine className="logo-svg" />
          </div>
          <div className="brand-text-block">
            <div className="brand-title-row">
              <h1 className="brand-name">LamiStock</h1>
              <span className="brand-pill">Lamination Panels</span>
            </div>
            <p className="brand-subtitle">
              Extra Laminated Panels & Smart Cut-Order Matcher (Inches)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Real-time Cloud Sync Badge */}
          <button
            type="button"
            className={`sync-badge-btn ${isCloudConnected ? 'cloud-active' : 'cloud-pending'}`}
            onClick={onOpenFirebaseSettings}
            title={
              isCloudConnected
                ? 'Firebase Cloud Connected (Online Real-Time Sync between Android & Mac)'
                : 'Click to connect your free Firebase Cloud project'
            }
          >
            <Cloud size={15} />
            <span className="sync-text">
              {isCloudConnected ? 'Cloud Online' : 'Connect Cloud'}
            </span>
            <span className="status-dot" />
          </button>

          {/* Add Surplus Stock */}
          <button
            type="button"
            className="btn-header-secondary"
            onClick={onOpenAddPanel}
          >
            <Plus size={16} />
            <span>Add Panel</span>
          </button>

          {/* Smart Order Matcher Trigger */}
          <button
            type="button"
            className="btn-header-primary"
            onClick={onOpenMatcher}
          >
            <Sparkles size={16} />
            <span>Smart Matcher</span>
          </button>
        </div>
      </div>
    </header>
  );
};
