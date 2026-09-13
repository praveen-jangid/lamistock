import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { LaminatedPanel, MatchResult } from './types/panel';
import type { Product, WoodPlan } from './types/product';
import {
  initializeDatabase,
  savePanel,
  deletePanel,
  setupRealtimeSync
} from './services/db';
import {
  initializeProductsDatabase,
  saveProduct,
  deleteProduct,
  saveWoodPlanForProduct,
  setupProductsRealtimeSync
} from './services/product_db';
import {
  parseWoodPlanSpreadsheet,
  type ExtractedWoodPlanResult
} from './utils/wood_plan_parser';
import { getAllChallans } from './services/challan_db';
import { Topbar } from './components/topbar';
import { Sidebar } from './components/sidebar';
import { RightSidebar } from './components/right_sidebar';
import { BottomNav } from './components/bottom_nav';
import { StockPage } from './pages/stock_page';
import { ProductsPage } from './pages/products_page';
import { WoodPlansPage } from './pages/wood_plans_page';
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
import { AddEditProductModal } from './components/add_edit_product_modal';
import { WoodPlanPreviewModal } from './components/wood_plan_preview_modal';
import { WoodPlanViewModal } from './components/wood_plan_view_modal';
import { Cloud } from 'lucide-react';
import { isFirebaseReady } from './services/firebase';

export const App: React.FC = () => {
  // Stock Inventory State
  const [panels, setPanels] = useState<LaminatedPanel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Products & Wood Plans State
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);

  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('lamistock_right_sidebar_collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  // Location / Route info
  const location = useLocation();

  // Stock Modals State
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

  // Product & Wood Plan Modals State
  const [isAddEditProductOpen, setIsAddEditProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isWoodPlanPreviewOpen, setIsWoodPlanPreviewOpen] = useState(false);
  const [extractedWoodPlan, setExtractedWoodPlan] = useState<ExtractedWoodPlanResult | null>(null);
  const [targetProductIdForUpload, setTargetProductIdForUpload] = useState<string | null>(null);
  const [isWoodPlanViewOpen, setIsWoodPlanViewOpen] = useState(false);
  const [selectedProductForWoodPlan, setSelectedProductForWoodPlan] = useState<Product | null>(null);

  // Hidden file input for Wood Plan Excel uploads
  const woodPlanFileInputRef = useRef<HTMLInputElement>(null);

  // Reload panels and products when database/firebase settings change
  const handleConfigChanged = async () => {
    setIsLoading(true);
    setIsProductsLoading(true);
    try {
      const [loadedPanels, loadedProducts] = await Promise.all([
        initializeDatabase(),
        initializeProductsDatabase()
      ]);
      setPanels(loadedPanels);
      setProducts(loadedProducts);
    } catch (err) {
      console.error('Error reloading databases:', err);
    } finally {
      setIsLoading(false);
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initialize Stock Panels
    initializeDatabase()
      .then((loaded) => {
        if (isMounted) {
          setPanels(loaded);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading inventory:', err);
        if (isMounted) setIsLoading(false);
      });

    // 2. Initialize Products Catalog
    initializeProductsDatabase()
      .then((prods) => {
        if (isMounted) {
          setProducts(prods);
          setIsProductsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading products catalog:', err);
        if (isMounted) setIsProductsLoading(false);
      });

    // 3. Realtime subscriptions
    const unsubscribePanels = setupRealtimeSync((updatedPanels) => {
      if (isMounted) setPanels(updatedPanels);
    });

    const unsubscribeProducts = setupProductsRealtimeSync((updatedProducts) => {
      if (isMounted) setProducts(updatedProducts);
    });

    return () => {
      isMounted = false;
      unsubscribePanels();
      unsubscribeProducts();
    };
  }, []);

  // -------------------------------------------------------------
  // Panel Handlers
  // -------------------------------------------------------------
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

  const handleDeletePanel = async (panel: LaminatedPanel) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove this ${panel.length}″ × ${panel.width}″ panel from stock?`
    );
    if (!confirmDelete) return;

    await deletePanel(panel.id);
    setPanels((prev) => prev.filter((p) => p.id !== panel.id));
  };

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

  // -------------------------------------------------------------
  // Product Handlers
  // -------------------------------------------------------------
  const handleSaveProduct = async (product: Product, photoBase64?: string) => {
    const saved = await saveProduct(product, photoBase64);
    setProducts((prev) => {
      const index = prev.findIndex((p) => p.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product "${product.name} (${product.code})"? This will also remove its associated wood plan.`
    );
    if (!confirmDelete) return;

    await deleteProduct(product.id);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    if (selectedProductForWoodPlan?.id === product.id) {
      setIsWoodPlanViewOpen(false);
      setSelectedProductForWoodPlan(null);
    }
  };

  // -------------------------------------------------------------
  // Wood Plan Handlers & Excel Upload
  // -------------------------------------------------------------
  const handleTriggerWoodPlanUpload = (productId?: string) => {
    setTargetProductIdForUpload(productId || null);
    if (woodPlanFileInputRef.current) {
      woodPlanFileInputRef.current.value = '';
      woodPlanFileInputRef.current.click();
    }
  };

  const handleWoodPlanFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const extracted = parseWoodPlanSpreadsheet(buffer, file.name);

      setExtractedWoodPlan(extracted);
      setIsWoodPlanPreviewOpen(true);
    } catch (err: any) {
      console.error('Error parsing wood plan excel:', err);
      window.alert(err?.message || 'Could not parse Excel file. Please ensure it is a valid spreadsheet.');
    }
  };

  const handleSaveWoodPlanFromPreview = async (
    productId: string,
    woodPlan: WoodPlan,
    newProductData?: { name: string; code: string; customerName: string }
  ) => {
    let finalProductId = productId;

    // If saving as a brand new product
    if (productId === 'new' && newProductData) {
      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newProductData.name,
        code: newProductData.code,
        customerName: newProductData.customerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        woodPlan
      };
      const saved = await saveProduct(newProduct);
      setProducts((prev) => [saved, ...prev]);
      finalProductId = saved.id;
    } else {
      // Attaching wood plan to existing product
      const updated = await saveWoodPlanForProduct(productId, woodPlan);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    }

    // Open view modal for the freshly saved plan
    const savedProd = products.find((p) => p.id === finalProductId);
    if (savedProd) {
      setSelectedProductForWoodPlan({ ...savedProd, woodPlan });
    }
  };

  const handleUpdateWoodPlanDirectly = async (productId: string, updatedPlan: WoodPlan) => {
    const updated = await saveWoodPlanForProduct(productId, updatedPlan);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    setSelectedProductForWoodPlan(updated);
  };

  const handleViewWoodPlan = (product: Product) => {
    setSelectedProductForWoodPlan(product);
    setIsWoodPlanViewOpen(true);
  };

  // -------------------------------------------------------------
  // Modal Openers
  // -------------------------------------------------------------
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
    if (path.startsWith('/products')) return 'All Products Master Database';
    if (path.startsWith('/wood-plans')) return 'Wood Plans & Cutting Blueprints';
    if (path.startsWith('/orders')) return 'Production Orders (Excel BOM)';
    if (path.startsWith('/challans/new')) return 'Create Outward Challan (Unit 2 → Unit 1)';
    if (path.startsWith('/challans')) return 'Outward Delivery Challans';
    if (path.startsWith('/tracker')) return 'Unit 1 Assembly Dispatch Tracker';
    return 'Lamination Stock Inventory';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Hidden File Input for Excel Wood Plan Uploads */}
      <input
        type="file"
        ref={woodPlanFileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleWoodPlanFileSelected}
        className="hidden"
      />

      {/* Topbar (100% full width) */}
      <div id="topbar" className="print:hidden">
        <Topbar
          activeTabTitle={getTabTitle()}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isRightSidebarOpen={!isRightSidebarCollapsed}
          onToggleRightSidebar={() => {
            setIsRightSidebarCollapsed((prev) => {
              const next = !prev;
              localStorage.setItem('lamistock_right_sidebar_collapsed', String(next));
              return next;
            });
          }}
          onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
        />
      </div>

      {/* Main Layout Area Below Topbar */}
      <div className="flex-1 flex relative min-h-0">
        {/* Desktop Factory Sidebar */}
        <div id="sidebar" className="hidden md:block print:hidden">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenAddPanel={handleOpenAdd}
            onOpenRapidMode={() => setIsRapidStockOpen(true)}
            onOpenFirebaseSettings={() => setIsFirebaseOpen(true)}
            stockCount={panels.length}
            challansCount={challansCount}
            productsCount={products.length}
            onNavigateMobile={() => {}}
          />
        </div>

        {/* Main Viewport Shell */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 sm:p-6 md:pb-8 lg:p-8">
            {/* Online Cloud Connection Alert Strip if not connected */}
            {!isFirebaseReady() && (
              <div className="bg-white border-l-4 border-l-slate-900 border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Cloud size={18} className="text-slate-900 flex-shrink-0" />
                  <div>
                    <strong>Online Cloud Connection:</strong> Connect your free Firebase project to sync panel inventory, products, and wood plans in real time.
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

              {/* Route 2: All Products Master Database */}
              <Route
                path="/products"
                element={
                  <ProductsPage
                    products={products}
                    isLoading={isProductsLoading}
                    onOpenAddProduct={() => {
                      setProductToEdit(null);
                      setIsAddEditProductOpen(true);
                    }}
                    onEditProduct={(p) => {
                      setProductToEdit(p);
                      setIsAddEditProductOpen(true);
                    }}
                    onDeleteProduct={handleDeleteProduct}
                    onViewWoodPlan={handleViewWoodPlan}
                    onUploadExcelForProduct={(prodId) => handleTriggerWoodPlanUpload(prodId)}
                  />
                }
              />

              {/* Route 3: Wood Plans Cutting Blueprints */}
              <Route
                path="/wood-plans"
                element={
                  <WoodPlansPage
                    products={products}
                    onViewWoodPlan={handleViewWoodPlan}
                    onUploadExcelForProduct={(prodId) => handleTriggerWoodPlanUpload(prodId)}
                  />
                }
              />

              {/* Route 4: Production Orders */}
              <Route
                path="/orders"
                element={
                  <OrdersPage
                    products={products}
                    onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
                  />
                }
              />

              {/* Route 5: Outward Delivery Challans History */}
              <Route
                path="/challans"
                element={<ChallansPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Route 6: Create New Challan Wizard */}
              <Route
                path="/challans/new"
                element={<CreateChallanPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Route 7: Unit 1 Assembly Dispatch Tracker */}
              <Route
                path="/tracker"
                element={<TrackerPage onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)} />}
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/stock" replace />} />
            </Routes>
          </main>
        </div>

        {/* Desktop Right Quick Actions Sidebar */}
        <div id="right-sidebar" className="hidden lg:block print:hidden">
          <RightSidebar
            isCollapsed={isRightSidebarCollapsed}
            onToggleCollapse={() => {
              setIsRightSidebarCollapsed(true);
              localStorage.setItem('lamistock_right_sidebar_collapsed', 'true');
            }}
            onOpenRapidMode={() => setIsRapidStockOpen(true)}
            onOpenAddPanel={handleOpenAdd}
            onOpenMatcher={() => handleOpenMatcher()}
            onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar & FAB */}
      <div id="bottom-nav" className="print:hidden">
        <BottomNav
          stockCount={panels.length}
          challansCount={challansCount}
          onOpenRapidMode={() => setIsRapidStockOpen(true)}
          onOpenAddPanel={handleOpenAdd}
          onOpenMatcher={() => handleOpenMatcher()}
          onOpenBulkMatcher={() => setIsBulkMatcherOpen(true)}
        />
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

      {/* Product & Wood Plan Modals */}
      <AddEditProductModal
        isOpen={isAddEditProductOpen}
        productToEdit={productToEdit}
        onClose={() => setIsAddEditProductOpen(false)}
        onSave={handleSaveProduct}
      />

      <WoodPlanPreviewModal
        isOpen={isWoodPlanPreviewOpen}
        extractedData={extractedWoodPlan}
        products={products}
        preselectedProductId={targetProductIdForUpload}
        onClose={() => setIsWoodPlanPreviewOpen(false)}
        onSaveWoodPlan={handleSaveWoodPlanFromPreview}
      />

      <WoodPlanViewModal
        isOpen={isWoodPlanViewOpen}
        product={selectedProductForWoodPlan}
        onClose={() => setIsWoodPlanViewOpen(false)}
        onUpdateWoodPlan={handleUpdateWoodPlanDirectly}
        onTriggerExcelUpload={handleTriggerWoodPlanUpload}
      />
    </div>
  );
};

export default App;
