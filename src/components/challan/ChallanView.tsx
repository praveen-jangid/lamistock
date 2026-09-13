import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';
import type {
  DeliveryChallan,
  FactoryOrder,
  ChallanComponentItem,
  ComponentCategory
} from '../../types/challan';
import {
  getNextChallanNumber,
  getAllChallans,
  saveChallan,
  deleteChallan,
  getSavedOrders,
  markComponentAsSent
} from '../../services/challan_db';
import { getStoredProductsSync } from '../../services/product_db';
import { getOrderProductDisplayName } from './utils/productHelpers';

import { usePalletManagement } from './hooks/usePalletManagement';
import { useChallanItems } from './hooks/useChallanItems';

import { MarkSingleSentModal } from './components/modals/MarkSingleSentModal';
import { AddCustomComponentModal } from './components/modals/AddCustomComponentModal';
import { SplitComponentModal } from './components/modals/SplitComponentModal';

import { SavedChallanView } from './components/print/SavedChallanView';
import { ChallanStep1 } from './components/create/ChallanStep1';
import { ChallanStep2 } from './components/create/ChallanStep2';
import { ChallansListView } from './components/history/ChallansListView';
import { FulfillmentTrackerView } from './components/history/FulfillmentTrackerView';

export interface ChallanViewProps {
  initialOrderId?: string;
  defaultSubTab?: 'create' | 'history' | 'tracker';
  onOpenBulkMatcher?: () => void;
}

export const ChallanView: React.FC<ChallanViewProps> = ({ initialOrderId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const queryOrderId = searchParams.get('orderId');
  const isCreateRoute = location.pathname.includes('/new');
  const isTrackerRoute = location.pathname.includes('/tracker');

  // Master lists
  const orders = getSavedOrders();
  const [challansList, setChallansList] = useState<DeliveryChallan[]>(() => getAllChallans());
  const [selectedChallanToView, setSelectedChallanToView] = useState<DeliveryChallan | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // MULTI-ORDER SELECTION: Array of selected order IDs included in this dispatch
  // Starts empty by default on /challans/new unless a specific order was requested
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    const initialId = queryOrderId || initialOrderId;
    return initialId ? [initialId] : [];
  });

  // Filter tab inside checklist to view items from a specific order or all
  const [activeOrderFilter, setActiveOrderFilter] = useState<string>('ALL');

  // Selected Orders objects
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Master Products Catalog lookup
  const products = getStoredProductsSync();
  const getOrderDisplayName = (order: FactoryOrder) => getOrderProductDisplayName(order, products);

  // State to refresh checklist when manual sent quantities update
  const [refreshVersion, setRefreshVersion] = useState<number>(0);

  // Custom manual components (samples / trial pieces) added directly to challan
  const [customItems, setCustomItems] = useState<ChallanComponentItem[]>([]);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState<boolean>(false);
  const [addCustomCategory, setAddCustomCategory] = useState<ComponentCategory>('LAMINATION');

  // Selected component IDs to dispatch in this challan (none selected by default)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set<string>());

  // Custom dispatching quantities map
  const [dispatchQtyOverrides, setDispatchQtyOverrides] = useState<Record<string, number>>({});

  // Item currently being manually marked as sent (modal)
  const [itemToMarkSent, setItemToMarkSent] = useState<ChallanComponentItem | null>(null);

  // Wizard state: 1: Transport & Components, 2: Review & Print Format
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  // Logistics details with user defaults
  const [challanNumber] = useState<string>(() => getNextChallanNumber());
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState<string>('RJ19GK7638');
  const [driverName, setDriverName] = useState<string>('Ram Jangid');
  const [remarks, setRemarks] = useState<string>('');

  // Pallet management hook
  const {
    pallets,
    itemPalletMap,
    setItemPalletMap,
    itemSplits,
    setItemSplits,
    itemToSplit,
    setItemToSplit,
    selectedForPalletMove,
    isDraggingOverPallet,
    printLayoutMode,
    setPrintLayoutMode,
    handleAddPallet,
    handleRemovePallet,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleApplySplit,
    handleMergeSplit,
    handleMoveItemToPallet,
    handleMoveSelectedToPallet,
    handleToggleSelectForPalletMove,
    handleClearSelectedForPalletMove,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = usePalletManagement();

  // Derived checklist and dispatched items
  const {
    checklistItems,
    dispatchedItems,
    laminationDispatched,
    framesDispatched,
    visibleLaminationAll,
    visibleLaminationPending,
    visibleLaminationAlreadySent,
    visibleFramesAll,
    visibleFramesPending,
    visibleFramesAlreadySent,
    totalAlreadySentCount
  } = useChallanItems({
    selectedOrders,
    customItems,
    selectedItemIds,
    dispatchQtyOverrides,
    itemPalletMap,
    itemSplits,
    palletsCount: pallets.length,
    activeOrderFilter,
    refreshVersion
  });

  // Open split modal for a base item from a split board card
  const handleOpenSplitModalForBase = (baseItemId?: string) => {
    if (!baseItemId) return;
    const item = checklistItems.find((it) => it.id === baseItemId);
    if (item) {
      setItemToSplit(item);
    }
  };

  const handleOpenAddCustomModal = (category: ComponentCategory = 'LAMINATION') => {
    setAddCustomCategory(category);
    setIsAddCustomModalOpen(true);
  };

  const handleAddCustomItem = (newItem: ChallanComponentItem) => {
    setCustomItems((prev) => [...prev, newItem]);
    // Automatically select it for dispatching
    setSelectedItemIds((prev) => new Set(prev).add(newItem.id));
    // Assign to its target pallet
    if (newItem.palletNumber) {
      setItemPalletMap((prev) => ({
        ...prev,
        [newItem.id]: newItem.palletNumber || 1
      }));
    }
    setIsAddCustomModalOpen(false);
  };

  const handleDeleteCustomItem = (itemId: string) => {
    setCustomItems((prev) => prev.filter((it) => it.id !== itemId));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setItemPalletMap((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setItemSplits((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Filtered Challans for history view
  const filteredChallans = useMemo(() => {
    if (!searchQuery.trim()) return challansList;
    const q = searchQuery.toLowerCase().trim();
    return challansList.filter(
      (c) =>
        c.challanNumber.toLowerCase().includes(q) ||
        c.orderTitle.toLowerCase().includes(q) ||
        (c.driverName && c.driverName.toLowerCase().includes(q)) ||
        (c.vehicleNumber && c.vehicleNumber.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [challansList, searchQuery]);

  // Toggle single item selection for dispatch
  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Change quantity dispatching now
  const handleQtyChange = (itemId: string, newQty: number) => {
    setDispatchQtyOverrides((prev) => ({
      ...prev,
      [itemId]: Math.max(1, newQty)
    }));
  };

  // Add an order to current dispatch (none selected by default)
  const handleAddOrderToDispatch = (orderId: string) => {
    if (!selectedOrderIds.includes(orderId)) {
      const updated = [...selectedOrderIds, orderId];
      setSelectedOrderIds(updated);
    }
  };

  // Remove an order from current dispatch
  const handleRemoveOrderFromDispatch = (orderId: string) => {
    const updated = selectedOrderIds.filter((id) => id !== orderId);
    setSelectedOrderIds(updated);
    if (activeOrderFilter === orderId) {
      setActiveOrderFilter('ALL');
    }
    // Remove any selected items that belonged to this removed order
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      checklistItems
        .filter((it) => it.orderId === orderId)
        .forEach((it) => next.delete(it.id));
      return next;
    });
  };

  // Select all lamination panels
  const handleSelectAllLamination = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      const targetList = visibleLaminationPending.length > 0 ? visibleLaminationPending : visibleLaminationAll;
      targetList.forEach((it) => next.add(it.id));
      return next;
    });
  };

  // Select all frame components
  const handleSelectAllFrames = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      const targetList = visibleFramesPending.length > 0 ? visibleFramesPending : visibleFramesAll;
      targetList.forEach((it) => next.add(it.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  // Handle manual mark sent submission
  const handleSaveManualSent = (itemId: string, qtyToAdd: number) => {
    markComponentAsSent(itemId, qtyToAdd);
    setItemToMarkSent(null);
    setRefreshVersion((v) => v + 1);
  };

  // Bulk mark all currently checked components as sent without a challan
  const handleBulkMarkSelectedAsSent = () => {
    const selectedList = checklistItems.filter((it) => selectedItemIds.has(it.id));
    if (selectedList.length === 0) {
      alert('Please check the components you wish to mark as sent.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to mark ${selectedList.length} selected components as already sent without generating a delivery challan?`
      )
    ) {
      selectedList.forEach((it) => {
        const qty = dispatchQtyOverrides[it.id] ?? it.dispatchingNowQty;
        markComponentAsSent(it.id, qty);
      });
      setSelectedItemIds(new Set());
      setRefreshVersion((v) => v + 1);
      alert(`${selectedList.length} components have been marked as sent!`);
    }
  };

  const handleProceedToStep2 = () => {
    if (dispatchedItems.length === 0) {
      alert('Please select at least 1 component to dispatch before proceeding to review.');
      return;
    }
    setWizardStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Challan
  const handleSaveChallan = () => {
    if (dispatchedItems.length === 0) {
      alert('Please select at least 1 panel or frame component to dispatch.');
      return;
    }

    const orderTitlesList = selectedOrders.map((o) => `${o.productCode || ''} ${o.productName || o.title}`.trim());
    const hasCustomItems = dispatchedItems.some((it) => it.isCustomItem);
    if (selectedOrders.length === 0 && hasCustomItems) {
      orderTitlesList.push('Custom Samples & Trial Sizes');
    }
    const combinedTitle =
      selectedOrders.length === 1
        ? orderTitlesList[0]
        : selectedOrders.length > 1
        ? `${selectedOrders.length} Products: ${orderTitlesList.join(' + ')}`
        : 'Custom Samples & Miscellaneous Dispatch';

    const newChallan: DeliveryChallan = {
      id: `challan-${Date.now()}`,
      challanNumber,
      date: dispatchDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sourceUnit: 'Unit 2 (Lamination & Wood Processing)',
      destinationUnit: 'Unit 1 (Assembly & Finishing Workshop)',
      orderId: selectedOrders[0]?.id || 'custom-sample',
      orderTitle: combinedTitle,
      orderIds: selectedOrders.length > 0 ? selectedOrders.map((o) => o.id) : ['custom-sample'],
      orderTitles: orderTitlesList,
      items: dispatchedItems,
      palletPhotos: [],
      pallets,
      palletCount: pallets.length,
      driverName,
      vehicleNumber,
      notes: remarks,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveChallan(newChallan);
    setChallansList(getAllChallans());
    alert(`Outward Challan #${challanNumber} has been saved successfully!`);
    navigate('/challans');
  };

  const handleDeleteChallan = (challanId: string, challanNum: string) => {
    if (window.confirm(`Are you sure you want to delete Outward Challan #${challanNum}?`)) {
      deleteChallan(challanId);
      setChallansList(getAllChallans());
      if (selectedChallanToView?.id === challanId) {
        setSelectedChallanToView(null);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // ROUTE: /tracker (Unit 1 Fulfillment Progress)
  // =========================================================================
  if (isTrackerRoute) {
    return <FulfillmentTrackerView orders={orders} />;
  }

  // =========================================================================
  // VIEW A SAVED CHALLAN'S CLEAN PRINTABLE VOUCHER
  // =========================================================================
  if (selectedChallanToView && !isCreateRoute) {
    return (
      <SavedChallanView
        challan={selectedChallanToView}
        orders={orders}
        onClose={() => setSelectedChallanToView(null)}
      />
    );
  }

  // =========================================================================
  // ROUTE: /challans (ALL CHALLANS MADE TILL DATE)
  // =========================================================================
  if (!isCreateRoute) {
    return (
      <ChallansListView
        filteredChallans={filteredChallans}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={() => navigate('/challans/new')}
        onViewChallan={(ch) => setSelectedChallanToView(ch)}
        onDeleteChallan={handleDeleteChallan}
      />
    );
  }

  // =========================================================================
  // ROUTE: /challans/new (CREATE NEW OUTWARD CHALLAN WIZARD)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 m-0">
              Create Outward Delivery Challan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Transport components from single or multiple products in a single truck trip.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          onClick={() => navigate('/challans')}
        >
          <ArrowLeft size={14} />
          <span>Back to All Challans</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-4">
        {/* Wizard Step Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200 pb-5 print:hidden">
          {[
            { num: 1, title: 'Transport & Components', desc: 'Vehicle, Driver & Products to Dispatch' },
            { num: 2, title: 'Review & Print Format', desc: 'Paper Challan Voucher' }
          ].map((st) => (
            <div
              key={st.num}
              className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                wizardStep === st.num
                  ? 'border-slate-900 bg-slate-50 shadow-xs'
                  : wizardStep > st.num
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-200 opacity-60'
              }`}
              onClick={() => {
                if (st.num === 1 || dispatchedItems.length > 0) {
                  setWizardStep(st.num as 1 | 2);
                }
              }}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                  wizardStep === st.num
                    ? 'bg-slate-900 text-white'
                    : wizardStep > st.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {wizardStep > st.num ? '✓' : st.num}
              </span>
              <div>
                <strong className="block text-xs font-bold text-slate-900">{st.title}</strong>
                <span className="text-[11px] text-slate-400">{st.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Wizard Step 1 */}
        {wizardStep === 1 && (
          <ChallanStep1
            dispatchDate={dispatchDate}
            onDispatchDateChange={setDispatchDate}
            vehicleNumber={vehicleNumber}
            onVehicleNumberChange={setVehicleNumber}
            driverName={driverName}
            onDriverNameChange={setDriverName}
            remarks={remarks}
            onRemarksChange={setRemarks}
            orders={orders}
            selectedOrderIds={selectedOrderIds}
            selectedOrders={selectedOrders}
            customItems={customItems}
            checklistItems={checklistItems}
            activeOrderFilter={activeOrderFilter}
            onSelectOrderFilter={setActiveOrderFilter}
            onAddOrder={handleAddOrderToDispatch}
            onRemoveOrder={handleRemoveOrderFromDispatch}
            onOpenAddCustomModal={handleOpenAddCustomModal}
            getOrderDisplayName={getOrderDisplayName}
            selectedItemIds={selectedItemIds}
            onToggleItem={handleToggleItem}
            dispatchQtyOverrides={dispatchQtyOverrides}
            onQtyChange={handleQtyChange}
            pallets={pallets}
            itemPalletMap={itemPalletMap}
            itemSplits={itemSplits}
            onMoveItemToPallet={handleMoveItemToPallet}
            onOpenSplitModal={handleOpenSplitModal}
            onOpenSplitModalForBase={handleOpenSplitModalForBase}
            onMergeSplit={handleMergeSplit}
            onDeleteCustomItem={handleDeleteCustomItem}
            onSetItemToMarkSent={setItemToMarkSent}
            onBulkMarkSelectedAsSent={handleBulkMarkSelectedAsSent}
            onSelectAllLamination={handleSelectAllLamination}
            onSelectAllFrames={handleSelectAllFrames}
            onDeselectAll={handleDeselectAll}
            dispatchedItems={dispatchedItems}
            laminationDispatched={laminationDispatched}
            framesDispatched={framesDispatched}
            visibleLaminationAll={visibleLaminationAll}
            visibleLaminationPending={visibleLaminationPending}
            visibleLaminationAlreadySent={visibleLaminationAlreadySent}
            visibleFramesAll={visibleFramesAll}
            visibleFramesPending={visibleFramesPending}
            visibleFramesAlreadySent={visibleFramesAlreadySent}
            totalAlreadySentCount={totalAlreadySentCount}
            selectedForPalletMove={selectedForPalletMove}
            isDraggingOverPallet={isDraggingOverPallet}
            onAddPallet={handleAddPallet}
            onRemovePallet={handleRemovePallet}
            onMoveSelectedToPallet={handleMoveSelectedToPallet}
            onToggleSelectForPalletMove={handleToggleSelectForPalletMove}
            onClearSelectedForPalletMove={handleClearSelectedForPalletMove}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onProceedToStep2={handleProceedToStep2}
          />
        )}

        {/* Wizard Step 2 */}
        {wizardStep === 2 && (
          <ChallanStep2
            pallets={pallets}
            printLayoutMode={printLayoutMode}
            onSetPrintLayoutMode={setPrintLayoutMode}
            dispatchedItems={dispatchedItems}
            laminationDispatched={laminationDispatched}
            framesDispatched={framesDispatched}
            challanNumber={challanNumber}
            dispatchDate={dispatchDate}
            vehicleNumber={vehicleNumber}
            driverName={driverName}
            remarks={remarks}
            selectedOrders={selectedOrders}
            getOrderDisplayName={getOrderDisplayName}
            onBackToStep1={() => setWizardStep(1)}
            onPrint={handlePrint}
            onSaveChallan={handleSaveChallan}
          />
        )}
      </div>

      {/* MODAL 1: Mark Individual Item as Sent Directly */}
      {itemToMarkSent && (
        <MarkSingleSentModal
          item={itemToMarkSent}
          onClose={() => setItemToMarkSent(null)}
          onSave={handleSaveManualSent}
        />
      )}

      {/* MODAL 2: Add Custom Size / Sample Component Directly to Challan */}
      <AddCustomComponentModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        onAdd={handleAddCustomItem}
        defaultCategory={addCustomCategory}
        pallets={pallets}
      />

      {/* MODAL 3: Split Single Component Across Multiple Pallets */}
      <SplitComponentModal
        isOpen={!!itemToSplit}
        item={itemToSplit}
        totalQty={itemToSplit ? (dispatchQtyOverrides[itemToSplit.id] ?? itemToSplit.dispatchingNowQty) : 0}
        currentSplit={itemToSplit ? itemSplits[itemToSplit.id] : undefined}
        onClose={handleCloseSplitModal}
        onApply={handleApplySplit}
        onMerge={handleMergeSplit}
      />
    </div>
  );
};
