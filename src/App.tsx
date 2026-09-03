import React, { useState, useEffect } from 'react';
import type { LaminatedPanel, MatchResult } from './types/panel';
import {
  initializeDatabase,
  savePanel,
  deletePanel,
  setupRealtimeSync
} from './services/db';
import { Header } from './components/layout/Header';
import { PanelGrid } from './components/inventory/PanelGrid';
import { AddEditPanelModal } from './components/inventory/AddEditPanelModal';
import { OrderMatcherModal } from './components/matcher/OrderMatcherModal';
import { SpecSheetModal } from './components/share/SpecSheetModal';
import { FirebaseSettingsModal } from './components/settings/FirebaseSettingsModal';
import { Plus, Sparkles, TreePine, Cloud } from 'lucide-react';
import { isFirebaseReady } from './services/firebase';

export const App: React.FC = () => {
  const [panels, setPanels] = useState<LaminatedPanel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal States
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [matcherInitialPanel, setMatcherInitialPanel] = useState<LaminatedPanel | null>(null);

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

  // Open modals handlers
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

  return (
    <div className="app-root">
      {/* Header */}
      <Header
        onOpenMatcher={() => handleOpenMatcher()}
        onOpenAddPanel={handleOpenAdd}
        onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
      />

      {/* Main App Content */}
      <main className="main-content-container">
        {/* Online Setup Banner if Firebase is pending */}
        {!isFirebaseReady() && (
          <div className="cloud-setup-alert-strip">
            <div className="alert-strip-left">
              <Cloud size={18} className="strip-cloud-icon" />
              <div>
                <strong>Online Cloud Connection:</strong> Connect your free Firebase project to sync panel inventory and photos in real time with your Android phone.
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

        {/* Clean Homepage Banner / Top Bar */}
        <div className="stock-section-banner">
          <div className="banner-left">
            <div className="banner-icon-box">
              <TreePine size={24} />
            </div>
            <div>
              <h2 className="banner-title">Lamination Panel Inventory</h2>
              <p className="banner-subtitle">
                Surplus laminated panels stored in factory section • Dimensions in Inches (″)
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
            >
              <Sparkles size={16} />
              <span>Smart Matcher</span>
            </button>
          </div>
        </div>

        {/* Inventory Cards Grid */}
        <PanelGrid
          panels={panels}
          isLoading={isLoading}
          onAddNew={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDeletePanel}
          onShare={(p) => handleOpenShare(p)}
          onMatchThis={(p) => handleOpenMatcher(p)}
        />
      </main>

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
