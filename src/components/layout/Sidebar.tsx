import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  TreePine,
  Layers,
  FileSpreadsheet,
  Truck,
  BarChart3,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { isFirebaseReady } from '../../services/firebase';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddPanel: () => void;
  onOpenFirebaseSettings: () => void;
  stockCount: number;
  challansCount: number;
  onNavigateMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenAddPanel,
  onOpenFirebaseSettings,
  stockCount,
  challansCount,
  onNavigateMobile
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <aside className={`factory-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header: Brand & Factory Unit */}
      <div className="sidebar-header">
        <Link to="/stock" className="sidebar-brand-link" onClick={onNavigateMobile}>
          <div className="sidebar-brand">
            <div className="brand-icon-square">
              <TreePine size={22} className="text-emerald" />
            </div>
            {!isCollapsed && (
              <div className="brand-info">
                <span className="brand-title">LamiStock</span>
                <span className="brand-tag">Factory ERP</span>
              </div>
            )}
          </div>
        </Link>

        <button
          type="button"
          className="btn-sidebar-collapse"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Multi-Unit Location Badge */}
      {!isCollapsed && (
        <div className="sidebar-factory-unit-card">
          <div className="unit-card-title">
            <MapPin size={13} className="text-emerald" />
            <span>Factory Dispatch Route:</span>
          </div>
          <div className="unit-route-row">
            <div className="unit-node active-node" title="Your current location">
              <span className="unit-code">Unit 2</span>
              <span className="unit-desc">Lamination & Wood</span>
            </div>
            <ArrowRight size={14} className="unit-arrow" />
            <div className="unit-node dest-node" title="Destination assembly workshop">
              <span className="unit-code">Unit 1</span>
              <span className="unit-desc">Furniture Assembly</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links with React Router */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">{!isCollapsed && 'OPERATIONS'}</div>

        <NavLink
          to="/stock"
          className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
          onClick={onNavigateMobile}
          title="Lamination Panel Inventory (/stock)"
        >
          <div className="nav-icon">
            <Layers size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="nav-label">Lamination Stock</span>
              {stockCount > 0 && <span className="nav-badge font-mono">{stockCount}</span>}
            </>
          )}
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
          onClick={onNavigateMobile}
          title="Production Orders & Excel BOM (/orders)"
        >
          <div className="nav-icon">
            <FileSpreadsheet size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="nav-label">Production Orders</span>
              <span className="nav-badge-pill">Excel</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/challans"
          className={({ isActive }) =>
            `nav-item-btn ${isActive || window.location.hash.startsWith('#/challans') ? 'active' : ''}`
          }
          onClick={onNavigateMobile}
          title="Outward Delivery Challans (/challans)"
        >
          <div className="nav-icon">
            <Truck size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="nav-label">Outward Challans</span>
              {challansCount > 0 && (
                <span className="nav-badge-emerald font-mono">{challansCount}</span>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/tracker"
          className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
          onClick={onNavigateMobile}
          title="Unit 1 Dispatch Tracking & Pending Items (/tracker)"
        >
          <div className="nav-icon">
            <BarChart3 size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="nav-label">Unit 1 Tracker</span>
              <span className="nav-sub-dot" />
            </>
          )}
        </NavLink>

        <div className="nav-group-label mt-3">{!isCollapsed && 'SYSTEM'}</div>

        <button
          type="button"
          className="nav-item-btn"
          onClick={() => {
            onOpenFirebaseSettings();
            if (onNavigateMobile) onNavigateMobile();
          }}
          title="Cloud Connection & Factory Settings"
        >
          <div className="nav-icon">
            <Cloud size={19} />
          </div>
          {!isCollapsed && (
            <>
              <span className="nav-label">Cloud Settings</span>
              <span className={`status-indicator-dot ${isCloudConnected ? 'online' : 'offline'}`} />
            </>
          )}
        </button>
      </nav>

      {/* Sidebar Quick Action Buttons */}
      {!isCollapsed && (
        <div className="sidebar-quick-actions">
          <Link
            to="/challans/new"
            className="btn-sidebar-action btn-sidebar-primary"
            onClick={onNavigateMobile}
            style={{ textDecoration: 'none' }}
          >
            <Truck size={15} />
            <span>Create Outward Challan</span>
          </Link>

          <button
            type="button"
            className="btn-sidebar-action btn-sidebar-secondary"
            onClick={() => {
              onOpenAddPanel();
              if (onNavigateMobile) onNavigateMobile();
            }}
          >
            <Plus size={15} />
            <span>Add Stock Panel</span>
          </button>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="footer-status-pill">
          <span className={`pulse-dot ${isCloudConnected ? 'green' : 'amber'}`} />
          {!isCollapsed && (
            <span className="footer-status-text">
              {isCloudConnected ? 'Cloud Sync Active' : 'Offline Mode'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
