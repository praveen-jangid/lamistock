import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { LaminatedPanel, MatchResult } from './types/panel';
import {
  initializeDatabase,
  savePanel,
  deletePanel,
  setupRealtimeSync
} from './services/db';
import { getAllChallans } from './services/challanDb';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PanelGrid } from './components/inventory/PanelGrid';
import { ChallanView } from './components/challan/ChallanView';
import { OrdersManagerView } from './components/orders/OrdersManagerView';
import { AddEditPanelModal } from './components/inventory/AddEditPanelModal';
import { OrderMatcherModal } from './components/matcher/OrderMatcherModal';
import { BulkOrderMatcherModal } from './components/matcher/BulkOrderMatcherModal';
import { SpecSheetModal } from './components/share/SpecSheetModal';
import { FirebaseSettingsModal } from './components/settings/FirebaseSettingsModal';
import { Plus, Sparkles, TreePine, Cloud, FileSpreadsheet } from 'lucide-react';
import { isFirebaseReady } from './services/firebase';

export const App: React.FC = () => {
  const [panels, setPanels] = useState<LaminatedPanel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Location / Route info
  const location = useLocation();

  // Modal States
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [matcherInitialPanel, setMatcherInitialPanel] = useState<LaminatedPanel | null>(null);
  const [isBulkMatcherOpen, setIsBulkMatcherOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [panelToEdit, setPanelToEdit] = useState<LaminatedPanel | null>(null);
  const [isSpecSheetOpen, setIsSpecSheetOpen] = useState(false);
  const [specPanel, setSpecPanel] = useState<LaminatedPanel | null>(null);
  const [specMatchResult, setSpecMatchResult] = useState<MatchResult | null>(null);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Load Initial Panels
  const loadPanels = async () => {
    setIsLoading(true);
    try {
      const loaded = await initializeDatabase();
      setPanels(loaded);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPanels();

    // Subscribe to Firebase real-time updates if connected
    const unsubscribe = setupRealtimeSync((updatedPanels) => {
      setPanels(updatedPanels);
    });

    return () => unsubscribe();
  }, []);

  // Save Panel handler
  const handleSavePanel = async (
    panel: LaminatedPanel,
    frontImgBase64?: string,
    backImgBase64?: string
  ) => {
    const saved = await savePanel(panel, frontImgBase64, backImgBase64);
    setPanels((prev) => {
      const index = prev.findIndex((p) => p.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Delete Panel handler
  const handleDeletePanel = async (panel: LaminatedPanel) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove this ${panel.length}″ × ${panel.width}″ panel from stock?`
    );
    if (!confirmDelete) return;

    await deletePanel(panel.id);
    setPanels((prev) => prev.filter((p) => p.id !== panel.id));
  };

  // Deduct Stock handler (from Order Matcher)
  const handleDeductStock = async (panelId: string, quantityToDeduct: number) => {
    const targetPanel = panels.find((p) => p.id === panelId);
    if (!targetPanel) return;

    const newQuantity = Math.max(0, targetPanel.quantity - quantityToDeduct);
    const updated = {
      ...targetPanel,
      quantity: newQuantity
    };

    await savePanel(updated);
    setPanels((prev) => prev.map((p) => (p.id === panelId ? updated : p)));
  };

  // Bulk Deduct Stock handler (from Bulk Order Matcher)
  const handleBulkDeductStock = async (
    allocations: { panelId: string; quantityToDeduct: number }[]
  ) => {
    for (const alloc of allocations) {
      const targetPanel = panels.find((p) => p.id === alloc.panelId);
      if (!targetPanel) continue;

      const newQuantity = Math.max(0, targetPanel.quantity - alloc.quantityToDeduct);
      const updated = {
        ...targetPanel,
        quantity: newQuantity
      };

      await savePanel(updated);
      setPanels((prev) => prev.map((p) => (p.id === alloc.panelId ? updated : p)));
    }
  };

  // Modal Openers
  const handleOpenAdd = () => {
    setPanelToEdit(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (panel: LaminatedPanel) => {
    setPanelToEdit(panel);
    setIsAddEditOpen(true);
  };

  const handleOpenMatcher = (panel?: LaminatedPanel) => {
    setMatcherInitialPanel(panel || null);
    setIsMatcherOpen(true);
  };

  const handleOpenShare = (panel: LaminatedPanel, matchResult?: MatchResult) => {
    setSpecPanel(panel);
    setSpecMatchResult(matchResult || null);
    setIsSpecSheetOpen(true);
  };

  const totalSheetsCount = panels.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const challansCount = getAllChallans().length;

  // Derive page title from current route path
  const getTabTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/orders')) return 'Production Orders (Excel BOM)';
    if (path.startsWith('/challans/new')) return 'Create Outward Challan (Unit 2 → Unit 1)';
    if (path.startsWith('/challans')) return 'Outward Delivery Challans';
    if (path.startsWith('/tracker')) return 'Unit 1 Assembly Dispatch Tracker';
    return 'Lamination Stock Inventory';
  };

  return (
    <div className="app-layout-shell">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Persistent Factory Sidebar with React Router NavLinks */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenAddPanel={handleOpenAdd}
          onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
          stockCount={panels.length}
          challansCount={challansCount}
          onNavigateMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Viewport Shell */}
      <div className="main-viewport-shell">
        {/* Header with Route Breadcrumbs */}
        <Header
          activeTabTitle={getTabTitle()}
          onOpenMatcher={() => handleOpenMatcher()}
          onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
          onOpenAddPanel={handleOpenAdd}
          onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="main-content-area">
          {/* Online Cloud Connection Alert Strip if not connected */}
          {!isFirebaseReady() && (
            <div className="cloud-setup-alert-strip">
              <div className="alert-strip-left">
                <Cloud size={18} className="strip-cloud-icon" />
                <div>
                  <strong>Online Cloud Connection:</strong> Connect your free Firebase project to sync panel inventory and outward challans in real time.
                </div>
              </div>
              <button
                type="button"
                className="btn-connect-cloud-strip"
                onClick={() => setIsFirebaseOpen(true)}
              >
                Connect Cloud Now →
              </button>
            </div>
          )}

          {/* Declarative Routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/stock" replace />} />

            {/* Route 1: Stock Inventory */}
            <Route
              path="/stock"
              element={
                <div className="stock-view-wrapper">
                  <div className="stock-section-banner">
                    <div className="banner-left">
                      <div className="banner-icon-box">
                        <TreePine size={24} />
                      </div>
                      <div>
                        <h2 className="banner-title">Lamination Panel Inventory</h2>
                        <p className="banner-subtitle">
                          Surplus laminated panels stored in Unit 2 • Dimensions in Inches (″)
                        </p>
                      </div>
                    </div>

                    <div className="banner-right">
                      <div className="stock-count-indicator">
                        <span className="stock-number">{totalSheetsCount}</span>
                        <span className="stock-label">Total Panels in Stock</span>
                      </div>

                      <button
                        type="button"
                        className="btn-banner-add"
                        onClick={handleOpenAdd}
                      >
                        <Plus size={16} />
                        <span>Add Panel</span>
                      </button>

                      <button
                        type="button"
                        className="btn-banner-match"
                        onClick={() => handleOpenMatcher()}
                        title="Match single urgent panel size"
                      >
                        <Sparkles size={16} />
                        <span>Single Match</span>
                      </button>

                      <button
                        type="button"
                        className="btn-banner-match btn-banner-bulk"
                        onClick={() => setIsBulkMatcherOpen(true)}
                        title="Import Excel or multi-size order BOM"
                      >
                        <FileSpreadsheet size={16} />
                        <span>Bulk Order (Excel)</span>
                      </button>
                    </div>
                  </div>

                  <PanelGrid
                    panels={panels}
                    isLoading={isLoading}
                    onAddNew={handleOpenAdd}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeletePanel}
                    onShare={(p) => handleOpenShare(p)}
                    onMatchThis={(p) => handleOpenMatcher(p)}
                  />
                </div>
              }
            />

            {/* Route 2: Production Orders */}
            <Route
              path="/orders"
              element={
                <OrdersManagerView
                  onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                />
              }
            />

            {/* Route 3: Outward Delivery Challans History */}
            <Route
              path="/challans"
              element={
                <ChallanView
                  defaultSubTab="history"
                  onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                />
              }
            />

            {/* Route 4: Create New Challan Wizard */}
            <Route
              path="/challans/new"
              element={
                <ChallanView
                  defaultSubTab="create"
                  onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                />
              }
            />

            {/* Route 5: Unit 1 Assembly Dispatch Tracker */}
            <Route
              path="/tracker"
              element={
                <ChallanView
                  defaultSubTab="tracker"
                  onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/stock" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      <AddEditPanelModal
        isOpen={isAddEditOpen}
        panelToEdit={panelToEdit}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSavePanel}
      />

      <OrderMatcherModal
        isOpen={isMatcherOpen}
        inventory={panels}
        initialPanel={matcherInitialPanel}
        onClose={() => setIsMatcherOpen(false)}
        onShareResult={(p, match) => handleOpenShare(p, match)}
        onDeductStock={handleDeductStock}
      />

      <BulkOrderMatcherModal
        isOpen={isBulkMatcherOpen}
        inventory={panels}
        onClose={() => setIsBulkMatcherOpen(false)}
        onBulkDeductStock={handleBulkDeductStock}
      />

      <SpecSheetModal
        isOpen={isSpecSheetOpen}
        panel={specPanel}
        matchResult={specMatchResult}
        onClose={() => setIsSpecSheetOpen(false)}
      />

      <FirebaseSettingsModal
        isOpen={isFirebaseOpen}
        onClose={() => setIsFirebaseOpen(false)}
        onConfigChanged={loadPanels}
      />
    </div>
  );
};

export default App;
