import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { LaminatedPanel, MatchResult } from './types/panel';
import {
  initializeDatabase,
  savePanel,
  deletePanel,
  setupRealtimeSync
} from './services/db';
import { getAllChallans } from './services/challan_db';
import { Topbar } from './components/topbar';
import { Sidebar } from './components/sidebar';
import { StockPage } from './pages/stock_page';
import { OrdersPage } from './pages/orders_page';
import { ChallansPage } from './pages/challans_page';
import { CreateChallanPage } from './pages/create_challan_page';
import { TrackerPage } from './pages/tracker_page';
import { AddEditPanelModal } from './components/add_edit_panel_modal';
import { RapidStockEntryModal } from './components/rapid_stock_entry_modal';
import { OrderMatcherModal } from './components/order_matcher_modal';
import { BulkOrderMatcherModal } from './components/bulk_order_matcher_modal';
import { SpecSheetModal } from './components/spec_sheet_modal';
import { FirebaseSettingsModal } from './components/firebase_settings_modal';
import { Cloud } from 'lucide-react';
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
  const [isRapidStockOpen, setIsRapidStockOpen] = useState(false);
  const [isSpecSheetOpen, setIsSpecSheetOpen] = useState(false);
  const [specPanel, setSpecPanel] = useState<LaminatedPanel | null>(null);
  const [specMatchResult, setSpecMatchResult] = useState<MatchResult | null>(null);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Reload panels when database/firebase settings change
  const handleConfigChanged = async () => {
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
    let isMounted = true;
    initializeDatabase()
      .then((loaded) => {
        if (isMounted) {
          setPanels(loaded);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading inventory:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // Subscribe to Firebase real-time updates if connected
    const unsubscribe = setupRealtimeSync((updatedPanels) => {
      setPanels(updatedPanels);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Full Topbar at the very top (100% full width, edge-to-edge, never blocked by sidebar) */}
      <Topbar
        activeTabTitle={getTabTitle()}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenMatcher={() => handleOpenMatcher()}
        onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
        onOpenAddPanel={handleOpenAdd}
        onOpenRapidMode={() => setIsRapidStockOpen(true)}
        onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Layout Area Below Topbar */}
      <div className="flex-1 flex relative min-h-0">
        {/* Mobile Sidebar Overlay (underneath topbar) */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Persistent Factory Sidebar */}
        <div
          className={`fixed top-16 bottom-0 left-0 z-30 md:static md:block transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenAddPanel={handleOpenAdd}
            onOpenRapidMode={() => setIsRapidStockOpen(true)}
            onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
            stockCount={panels.length}
            challansCount={challansCount}
            onNavigateMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Main Viewport Shell */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {/* Online Cloud Connection Alert Strip if not connected */}
            {!isFirebaseReady() && (
              <div className="bg-white border-l-4 border-l-slate-900 border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Cloud size={18} className="text-slate-900 flex-shrink-0" />
                  <div>
                    <strong>Online Cloud Connection:</strong> Connect your free Firebase project to sync panel inventory and outward challans in real time.
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition whitespace-nowrap shadow-sm"
                  onClick={() => setIsFirebaseOpen(true)}
                >
                  Connect Cloud Now →
                </button>
              </div>
            )}

            {/* Declarative Routes to Dedicated Pages */}
            <Routes>
              <Route path="/" element={<Navigate to="/stock" replace />} />

              {/* Route 1: Stock Inventory */}
              <Route
                path="/stock"
                element={
                  <StockPage
                    panels={panels}
                    isLoading={isLoading}
                    totalSheetsCount={totalSheetsCount}
                    onOpenAdd={handleOpenAdd}
                    onOpenRapidMode={() => setIsRapidStockOpen(true)}
                    onOpenMatcher={handleOpenMatcher}
                    onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                    onEditPanel={handleOpenEdit}
                    onDeletePanel={handleDeletePanel}
                    onSharePanel={handleOpenShare}
                  />
                }
              />

              {/* Route 2: Production Orders */}
              <Route
                path="/orders"
                element={<OrdersPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Route 3: Outward Delivery Challans History */}
              <Route
                path="/challans"
                element={<ChallansPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Route 4: Create New Challan Wizard */}
              <Route
                path="/challans/new"
                element={<CreateChallanPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Route 5: Unit 1 Assembly Dispatch Tracker */}
              <Route
                path="/tracker"
                element={<TrackerPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/stock" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Modals */}
      <AddEditPanelModal
        isOpen={isAddEditOpen}
        panelToEdit={panelToEdit}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSavePanel}
        onOpenRapidMode={() => setIsRapidStockOpen(true)}
      />

      <RapidStockEntryModal
        isOpen={isRapidStockOpen}
        onClose={() => setIsRapidStockOpen(false)}
        onSavePanel={handleSavePanel}
        onDeletePanel={handleDeletePanel}
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
        onConfigChanged={handleConfigChanged}
      />
    </div>
  );
};

export default App;
