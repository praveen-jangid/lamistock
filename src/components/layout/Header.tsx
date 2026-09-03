import React from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  Cloud,
  FileSpreadsheet,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { isFirebaseReady } from '../../services/firebase';

interface HeaderProps {
  activeTabTitle: string;
  onOpenMatcher: () => void;
  onOpenBulkMatcher: () => void;
  onOpenAddPanel: () => void;
  onOpenFirebaseSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  onOpenMatcher,
  onOpenBulkMatcher,
  onOpenAddPanel,
  onOpenFirebaseSettings,
  onToggleMobileSidebar
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left: Mobile Menu & Current Section Breadcrumb */}
        <div className="header-left-cluster">
          <button
            type="button"
            className="btn-mobile-menu"
            onClick={onToggleMobileSidebar}
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          <div className="header-breadcrumbs">
            <span className="crumb-root">LamiStock</span>
            <span className="crumb-sep">/</span>
            <h1 className="crumb-current">{activeTabTitle}</h1>
          </div>

          <div className="header-route-badge" title="Active factory route">
            <MapPin size={12} className="text-emerald" />
            <span>Unit 2 (Lamination)</span>
            <ArrowRight size={11} />
            <span>Unit 1 (Assembly)</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="header-actions">
          {/* Cloud Sync Badge */}
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
            title="Add a surplus lamination panel into stock"
          >
            <Plus size={15} />
            <span>Add Panel</span>
          </button>

          {/* Single Urgent Panel Matcher */}
          <button
            type="button"
            className="btn-header-secondary"
            onClick={onOpenMatcher}
            title="Match a single urgent panel size"
          >
            <Sparkles size={15} />
            <span>Single Match</span>
          </button>

          {/* Bulk Order Matcher Trigger */}
          <button
            type="button"
            className="btn-header-primary"
            onClick={onOpenBulkMatcher}
            title="Upload Excel order or check BOM against stock"
          >
            <FileSpreadsheet size={15} />
            <span>Bulk Order (Excel)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
