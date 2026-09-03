import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import type { DeliveryChallan, ChallanComponentItem } from '../../types/challan';
import {
  getSavedOrders,
  getAllChallans,
  saveChallan,
  getNextChallanNumber,
  buildOrderChallanItems
} from '../../services/challanDb';
import { compressImage } from '../../services/imageCompressor';
import {
  Truck,
  Plus,
  Printer,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Trash2,
  PackageCheck
} from 'lucide-react';

interface ChallanViewProps {
  initialOrderId?: string;
  defaultSubTab?: 'create' | 'history' | 'tracker';
  onOpenBulkMatcher?: () => void;
}

export const ChallanView: React.FC<ChallanViewProps> = ({
  initialOrderId,
  defaultSubTab,
  onOpenBulkMatcher
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const queryOrderId = searchParams.get('orderId');
  const isCreateRoute = location.pathname.includes('/new');
  const isTrackerRoute = location.pathname.includes('/tracker');

  const initialTab =
    defaultSubTab || (isTrackerRoute ? 'tracker' : isCreateRoute ? 'create' : 'history');

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history' | 'tracker'>(initialTab);

  // Sync tab with route changes
  useEffect(() => {
    if (isTrackerRoute) {
      setActiveSubTab('tracker');
    } else if (isCreateRoute) {
      setActiveSubTab('create');
    } else if (location.pathname === '/challans') {
      setActiveSubTab('history');
    }
  }, [location.pathname, isCreateRoute, isTrackerRoute]);

  // Orders list
  const orders = getSavedOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    queryOrderId || initialOrderId || (orders.length > 0 ? orders[0].id : '')
  );

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Wizard state: 1: Checklist, 2: Pallet Photos & Logistics, 3: Print Preview & Save
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Items state for current challan
  const [checklistItems, setChecklistItems] = useState<ChallanComponentItem[]>(() => {
    return activeOrder ? buildOrderChallanItems(activeOrder) : [];
  });

  // Selected item IDs to dispatch in this challan
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    // Default: pre-select all items that have remaining quantity > 0
    if (activeOrder) {
      const items = buildOrderChallanItems(activeOrder);
      items.forEach((it) => {
        if (it.dispatchingNowQty > 0) set.add(it.id);
      });
    }
    return set;
  });

  // Logistics details
  const [challanNumber] = useState<string>(() => getNextChallanNumber());
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState<string>('RJ-14 Factory Pickup');
  const [driverName, setDriverName] = useState<string>('Ramesh / Factory Transport');
  const [dispatchNotes, setDispatchNotes] = useState<string>(
    'Pallet packed with bubble wrap. Top panels marked with stickers for Unit 1 assembly.'
  );

  // Pallet photos
  const [palletPhotos, setPalletPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Past challans list
  const [challansList, setChallansList] = useState<DeliveryChallan[]>(() => getAllChallans());
  const [selectedHistoryChallan, setSelectedHistoryChallan] = useState<DeliveryChallan | null>(null);

  // When order selection changes
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      const newItems = buildOrderChallanItems(ord);
      setChecklistItems(newItems);
      const newSet = new Set<string>();
      newItems.forEach((it) => {
        if (it.dispatchingNowQty > 0) newSet.add(it.id);
      });
      setSelectedItemIds(newSet);
    }
  };

  // Toggle single item selection
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
    setChecklistItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return { ...it, dispatchingNowQty: Math.max(1, newQty) };
      })
    );
  };

  // Select all lamination panels
  const handleSelectAllLamination = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      checklistItems
        .filter((it) => it.category === 'LAMINATION')
        .forEach((it) => next.add(it.id));
      return next;
    });
  };

  // Select all frame components
  const handleSelectAllFrames = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      checklistItems
        .filter((it) => it.category === 'FRAME')
        .forEach((it) => next.add(it.id));
      return next;
    });
  };

  // Handle Pallet Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.82);
        setPalletPhotos((prev) => [...prev, compressed]);
      } catch (err) {
        console.error('Error compressing pallet photo:', err);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPalletPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter items that will be included in this challan
  const dispatchedItems = checklistItems.filter((it) => selectedItemIds.has(it.id));
  const laminationDispatched = dispatchedItems.filter((it) => it.category === 'LAMINATION');
  const framesDispatched = dispatchedItems.filter((it) => it.category === 'FRAME');

  // Save Challan
  const handleSaveChallan = () => {
    if (dispatchedItems.length === 0) {
      alert('Please select at least 1 panel or frame component to dispatch.');
      return;
    }

    const newChallan: DeliveryChallan = {
      id: `challan-${Date.now()}`,
      challanNumber,
      date: dispatchDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sourceUnit: 'Unit 2 (Lamination & Wood Processing)',
      destinationUnit: 'Unit 1 (Assembly & Finishing Workshop)',
      orderId: activeOrder ? activeOrder.id : '',
      orderTitle: activeOrder ? activeOrder.title : 'Custom Furniture Dispatch',
      items: dispatchedItems,
      palletPhotos,
      driverName,
      vehicleNumber,
      notes: dispatchNotes,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveChallan(newChallan);
    setChallansList(getAllChallans());
    alert(`Outward Challan #${challanNumber} has been generated and saved!`);
    navigate('/challans');
    setActiveSubTab('history');
    setSelectedHistoryChallan(newChallan);
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="challan-view-container">
      {/* View Header */}
      <div className="challan-page-header">
        <div className="challan-header-left">
          <div className="challan-header-icon-box">
            <Truck size={24} />
          </div>
          <div>
            <div className="challan-title-row">
              <h2 className="challan-view-title">Outward Delivery Challans</h2>
              <span className="route-badge">
                Unit 2 (Lamination) → Unit 1 (Assembly)
              </span>
            </div>
            <p className="challan-view-subtitle">
              Dispatch laminated panels & frame components with checklists, pallet photos, and printable delivery vouchers.
            </p>
          </div>
        </div>

        <div className="challan-header-actions">
          <button
            type="button"
            className={`btn-subtab ${activeSubTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('create');
              navigate('/challans/new');
            }}
          >
            <Plus size={15} />
            <span>Create New Challan</span>
          </button>

          <button
            type="button"
            className={`btn-subtab ${activeSubTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('history');
              setSelectedHistoryChallan(null);
              navigate('/challans');
            }}
          >
            <Clock size={15} />
            <span>Challan History ({challansList.length})</span>
          </button>

          <button
            type="button"
            className={`btn-subtab ${activeSubTab === 'tracker' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('tracker');
              navigate('/tracker');
            }}
          >
            <Layers size={15} />
            <span>Unit 1 Tracker</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CREATE OUTWARD CHALLAN (WIZARD)
          ========================================================================= */}
      {activeSubTab === 'create' && (
        <div className="challan-create-card">
          {/* Wizard Step Indicator */}
          <div className="challan-wizard-steps">
            <div
              className={`wizard-step ${wizardStep >= 1 ? 'step-active' : ''}`}
              onClick={() => setWizardStep(1)}
            >
              <span className="step-circle">1</span>
              <span className="step-name">Select Components</span>
              <span className="step-desc">Panels & Frames</span>
            </div>

            <div
              className={`wizard-step ${wizardStep >= 2 ? 'step-active' : ''}`}
              onClick={() => {
                if (dispatchedItems.length > 0) setWizardStep(2);
              }}
            >
              <span className="step-circle">2</span>
              <span className="step-name">Pallet Photos & Vehicle</span>
              <span className="step-desc">Transport Details</span>
            </div>

            <div
              className={`wizard-step ${wizardStep === 3 ? 'step-active' : ''}`}
              onClick={() => {
                if (dispatchedItems.length > 0) setWizardStep(3);
              }}
            >
              <span className="step-circle">3</span>
              <span className="step-name">Review & Print Format</span>
              <span className="step-desc">Paper Challan Voucher</span>
            </div>
          </div>

          {/* ================= STEP 1: COMPONENT CHECKLIST ================= */}
          {wizardStep === 1 && (
            <div className="wizard-step-body">
              {/* Top Order Selector */}
              <div className="order-selector-ribbon">
                <div className="order-selector-group">
                  <label className="field-label font-bold">Select Production Order to Dispatch:</label>
                  <select
                    className="order-dropdown-select"
                    value={selectedOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="order-actions-cluster">
                  {onOpenBulkMatcher && (
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={onOpenBulkMatcher}
                    >
                      <Sparkles size={14} />
                      <span>Check Extra Stock in Cloud</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Helper Buttons */}
              <div className="checklist-toolbar">
                <div className="checklist-stats">
                  <strong>Selected to Dispatch:</strong>
                  <span className="count-pill emerald">
                    {laminationDispatched.length} Lamination Sizes (
                    {laminationDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} panels)
                  </span>
                  <span className="count-pill amber">
                    {framesDispatched.length} Frame Components (
                    {framesDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} pcs)
                  </span>
                </div>

                <div className="checklist-batch-buttons">
                  <button
                    type="button"
                    className="btn-batch-select"
                    onClick={handleSelectAllLamination}
                  >
                    Select All Lamination
                  </button>
                  <button
                    type="button"
                    className="btn-batch-select"
                    onClick={handleSelectAllFrames}
                  >
                    Select All Frames
                  </button>
                  <button
                    type="button"
                    className="btn-batch-select text-danger"
                    onClick={() => setSelectedItemIds(new Set())}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* SECTION A: LAMINATION PANELS CHECKLIST */}
              <div className="category-section-box">
                <div className="category-header-row">
                  <div className="category-title-group">
                    <Layers size={18} className="text-emerald" />
                    <h3 className="category-title">Category 1: Lamination Panels</h3>
                    <span className="category-count">
                      ({checklistItems.filter((it) => it.category === 'LAMINATION').length} sizes)
                    </span>
                  </div>
                  <span className="category-hint">
                    Press & laminated in Unit 2 • Select which panels are loaded on the pallet
                  </span>
                </div>

                <div className="table-scroll-wrap">
                  <table className="challan-checklist-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px' }}>Send</th>
                        <th>Part Name</th>
                        <th style={{ width: '180px' }}>Dimensions (L × W × T)</th>
                        <th style={{ width: '100px' }}>Order Total</th>
                        <th style={{ width: '110px' }}>Already Sent</th>
                        <th style={{ width: '120px' }}>Dispatch Now</th>
                        <th>Remarks / Finish</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems
                        .filter((it) => it.category === 'LAMINATION')
                        .map((it) => {
                          const isChecked = selectedItemIds.has(it.id);
                          const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);

                          return (
                            <tr
                              key={it.id}
                              className={isChecked ? 'row-selected' : ''}
                              onClick={() => handleToggleItem(it.id)}
                            >
                              <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleItem(it.id)}
                                  className="challan-checkbox"
                                />
                              </td>
                              <td className="font-bold">{it.partName}</td>
                              <td className="font-mono">{it.dimensions}</td>
                              <td className="font-mono">{it.totalOrderQty} pcs</td>
                              <td className="font-mono text-muted">
                                {it.alreadyDispatchedQty > 0 ? (
                                  <span className="tag-already-sent">{it.alreadyDispatchedQty} sent</span>
                                ) : (
                                  '0'
                                )}
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min={1}
                                  max={remaining || 999}
                                  className="dispatch-qty-input font-mono font-bold"
                                  value={it.dispatchingNowQty}
                                  onChange={(e) =>
                                    handleQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                                  }
                                  disabled={!isChecked}
                                />
                              </td>
                              <td className="text-muted">{it.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: FRAME COMPONENTS CHECKLIST */}
              <div className="category-section-box mt-4">
                <div className="category-header-row">
                  <div className="category-title-group">
                    <Truck size={18} className="text-amber" />
                    <h3 className="category-title">Category 2: Frame & Structural Components</h3>
                    <span className="category-count">
                      ({checklistItems.filter((it) => it.category === 'FRAME').length} items)
                    </span>
                  </div>
                  <span className="category-hint">
                    Solid wood framing, legs, aprons, & stretchers
                  </span>
                </div>

                <div className="table-scroll-wrap">
                  <table className="challan-checklist-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px' }}>Send</th>
                        <th>Part Name</th>
                        <th style={{ width: '180px' }}>Size (Inches)</th>
                        <th style={{ width: '100px' }}>Order Total</th>
                        <th style={{ width: '110px' }}>Already Sent</th>
                        <th style={{ width: '120px' }}>Dispatch Now</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems
                        .filter((it) => it.category === 'FRAME')
                        .map((it) => {
                          const isChecked = selectedItemIds.has(it.id);
                          const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);

                          return (
                            <tr
                              key={it.id}
                              className={isChecked ? 'row-selected' : ''}
                              onClick={() => handleToggleItem(it.id)}
                            >
                              <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleItem(it.id)}
                                  className="challan-checkbox"
                                />
                              </td>
                              <td className="font-bold">{it.partName}</td>
                              <td className="font-mono">{it.dimensions}</td>
                              <td className="font-mono">{it.totalOrderQty} pcs</td>
                              <td className="font-mono text-muted">
                                {it.alreadyDispatchedQty > 0 ? (
                                  <span className="tag-already-sent">{it.alreadyDispatchedQty} sent</span>
                                ) : (
                                  '0'
                                )}
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min={1}
                                  max={remaining || 999}
                                  className="dispatch-qty-input font-mono font-bold"
                                  value={it.dispatchingNowQty}
                                  onChange={(e) =>
                                    handleQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                                  }
                                  disabled={!isChecked}
                                />
                              </td>
                              <td className="text-muted">{it.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="wizard-bottom-actions">
                <div className="selected-summary-stat">
                  <strong>Total Items to Dispatch:</strong>{' '}
                  <span className="font-bold text-emerald">
                    {dispatchedItems.reduce((s, it) => s + it.dispatchingNowQty, 0)} pieces
                  </span>{' '}
                  across {dispatchedItems.length} component sizes
                </div>

                <button
                  type="button"
                  className="btn-primary-large"
                  disabled={dispatchedItems.length === 0}
                  onClick={() => setWizardStep(2)}
                >
                  <span>Proceed to Pallet Photos & Vehicle →</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PALLET PHOTOS & VEHICLE INFO ================= */}
          {wizardStep === 2 && (
            <div className="wizard-step-body">
              <div className="step-2-grid">
                {/* Left: Pallet Photos Upload */}
                <div className="pallet-photos-card">
                  <div className="card-heading-group">
                    <Camera size={18} className="text-emerald" />
                    <strong>Pallet & Shipment Photos (For Unit 1 Assembly Reference)</strong>
                  </div>
                  <p className="helper-text">
                    Take photos of the loaded pallet/tempo so the assembly supervisor in Unit 1 can immediately identify the pieces and know how they were packed.
                  </p>

                  <div
                    className="photo-dropzone-box"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                    />
                    <Camera size={32} className="text-muted" />
                    <span className="dropzone-label font-bold">
                      Take Photo with Phone / Click to Upload
                    </span>
                    <span className="dropzone-sub">Upload loaded pallet or stack images</span>
                  </div>

                  {palletPhotos.length > 0 && (
                    <div className="pallet-photos-strip">
                      {palletPhotos.map((img, idx) => (
                        <div key={idx} className="pallet-thumb-wrap">
                          <img src={img} alt={`Pallet ${idx + 1}`} className="pallet-thumb-img" />
                          <button
                            type="button"
                            className="btn-delete-photo"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Transport & Dispatch Form */}
                <div className="transport-details-card">
                  <div className="card-heading-group">
                    <Truck size={18} className="text-emerald" />
                    <strong>Transport & Route Information</strong>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">Outward Challan #:</label>
                      <input
                        type="text"
                        className="form-input font-mono font-bold"
                        value={challanNumber}
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dispatch Date:</label>
                      <input
                        type="date"
                        className="form-input"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">From Location:</label>
                      <input
                        type="text"
                        className="form-input font-bold"
                        value="Unit 2 (Lamination & Wood Processing)"
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">To Location:</label>
                      <input
                        type="text"
                        className="form-input font-bold"
                        value="Unit 1 (Assembly & Finishing Workshop)"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">Vehicle / Tempo #:</label>
                      <input
                        type="text"
                        className="form-input font-mono"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. RJ-14 Factory Pickup"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Driver / Handover Name:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Ramesh"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pallet & Dispatch Notes for Unit 1:</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      placeholder="Notes for the assembly unit..."
                    />
                  </div>
                </div>
              </div>

              {/* Wizard Nav */}
              <div className="wizard-bottom-actions space-between">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setWizardStep(1)}
                >
                  <span>← Back to Components</span>
                </button>

                <button
                  type="button"
                  className="btn-primary-large"
                  onClick={() => setWizardStep(3)}
                >
                  <span>Proceed to Print Preview & Save →</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: REVIEW & PRINT PREVIEW ================= */}
          {wizardStep === 3 && (
            <div className="wizard-step-body">
              {/* Action Toolbar for Print */}
              <div className="print-preview-actions-bar">
                <div className="preview-meta">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <strong>Print Format Ready:</strong> You can print this outward challan now or save it to reprint anytime.
                </div>

                <div className="preview-buttons">
                  <button type="button" className="btn-secondary" onClick={handlePrint}>
                    <Printer size={16} />
                    <span>Print Challan Voucher (Paper / PDF)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveChallan}
                  >
                    <PackageCheck size={16} />
                    <span>Save & Mark Dispatched to Unit 1</span>
                  </button>
                </div>
              </div>

              {/* ================= PRINTABLE CHALLAN VOUCHER ================= */}
              <div className="printable-challan-voucher" id="printable-voucher-content">
                {/* Voucher Header */}
                <div className="voucher-header">
                  <div className="voucher-company">
                    <h1 className="company-name">FACTORY OUTWARD DELIVERY CHALLAN</h1>
                    <div className="company-sub">Internal Wood Components Transfer Voucher</div>
                  </div>

                  <div className="voucher-meta-box">
                    <div className="voucher-no font-mono font-bold">Challan No: {challanNumber}</div>
                    <div className="voucher-date">Date: {dispatchDate}</div>
                    <div className="voucher-time">
                      Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Route Information Box */}
                <div className="voucher-route-grid">
                  <div className="route-cell">
                    <span className="route-header-label">DISPATCHED FROM (SOURCE):</span>
                    <strong className="route-val">Unit 2 (Lamination & Wood Processing)</strong>
                    <div className="route-subtext">Cutting, Pressing & Framing Section</div>
                  </div>

                  <div className="route-cell">
                    <span className="route-header-label">DELIVER TO (DESTINATION):</span>
                    <strong className="route-val">Unit 1 (Furniture Assembly Workshop)</strong>
                    <div className="route-subtext">Assembly, Sanding & Final Finishing</div>
                  </div>
                </div>

                {/* Order & Transport Info Bar */}
                <div className="voucher-meta-row">
                  <div>
                    <strong>Order Ref:</strong> {activeOrder ? activeOrder.title : 'Custom Dispatch'} (
                    {activeOrder ? activeOrder.orderNumber : '—'})
                  </div>
                  <div>
                    <strong>Vehicle / Tempo:</strong> {vehicleNumber}
                  </div>
                  <div>
                    <strong>Driver / Handed By:</strong> {driverName}
                  </div>
                </div>

                {/* Table of Transported Items */}
                <div className="voucher-table-wrap">
                  <table className="voucher-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Component Description</th>
                        <th>Category</th>
                        <th style={{ width: '180px' }}>Size (L × W × T)</th>
                        <th style={{ width: '100px' }}>Dispatch Qty</th>
                        <th>Notes for Unit 1 Assembly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchedItems.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="text-center">{idx + 1}</td>
                          <td className="font-bold">{it.partName}</td>
                          <td>
                            <span className="voucher-cat-pill">
                              {it.category === 'LAMINATION' ? 'Lamination Panel' : 'Frame Component'}
                            </span>
                          </td>
                          <td className="font-mono">{it.dimensions}</td>
                          <td className="font-mono font-bold text-center">
                            {it.dispatchingNowQty} pcs
                          </td>
                          <td>{it.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={4} className="text-right">
                          TOTAL PIECES DISPATCHED:
                        </th>
                        <th className="font-mono font-bold text-center">
                          {dispatchedItems.reduce((sum, it) => sum + it.dispatchingNowQty, 0)} pcs
                        </th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pallet Photos on Backside / Bottom (as requested by user) */}
                {palletPhotos.length > 0 && (
                  <div className="voucher-pallet-photos-section">
                    <div className="voucher-photos-title">
                      📷 Loaded Pallet Reference Photos (For Unit 1 Assembly Team):
                    </div>
                    <div className="voucher-photos-grid">
                      {palletPhotos.map((pUrl, i) => (
                        <div key={i} className="voucher-photo-cell">
                          <img src={pUrl} alt={`Pallet photo ${i + 1}`} className="voucher-photo-img" />
                          <span className="photo-caption">Pallet View #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispatch Notes */}
                {dispatchNotes && (
                  <div className="voucher-notes-box">
                    <strong>Dispatch Notes:</strong> {dispatchNotes}
                  </div>
                )}

                {/* Signature Row */}
                <div className="voucher-signatures-grid">
                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Prepared & Dispatched By (Unit 2)</span>
                  </div>

                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Driver / Transport Handover</span>
                  </div>

                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Received In Good Condition (Unit 1 Assembly)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="wizard-bottom-actions space-between">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setWizardStep(2)}
                >
                  <span>← Back to Photos & Vehicle</span>
                </button>

                <div className="actions-cluster">
                  <button type="button" className="btn-secondary" onClick={handlePrint}>
                    <Printer size={16} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveChallan}
                  >
                    <CheckCircle2 size={16} />
                    <span>Save & Mark Dispatched</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CHALLAN HISTORY (PAST DISPATCHES)
          ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="challan-history-container">
          {selectedHistoryChallan ? (
            /* Selected Historical Challan Print/Inspection View */
            <div className="history-inspection-wrapper">
              <div className="history-inspection-header">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedHistoryChallan(null)}
                >
                  <span>← Back to Challans List</span>
                </button>

                <div className="history-actions">
                  <button type="button" className="btn-primary" onClick={handlePrint}>
                    <Printer size={16} />
                    <span>Print This Challan</span>
                  </button>
                </div>
              </div>

              {/* Reusable Printable Voucher */}
              <div className="printable-challan-voucher">
                <div className="voucher-header">
                  <div className="voucher-company">
                    <h1 className="company-name">FACTORY OUTWARD DELIVERY CHALLAN</h1>
                    <div className="company-sub">Internal Wood Transfer Voucher</div>
                  </div>
                  <div className="voucher-meta-box">
                    <div className="voucher-no font-mono font-bold">
                      Challan No: {selectedHistoryChallan.challanNumber}
                    </div>
                    <div className="voucher-date">Date: {selectedHistoryChallan.date}</div>
                    <div className="voucher-time">Time: {selectedHistoryChallan.time}</div>
                  </div>
                </div>

                <div className="voucher-route-grid">
                  <div className="route-cell">
                    <span className="route-header-label">FROM (SOURCE):</span>
                    <strong className="route-val">{selectedHistoryChallan.sourceUnit}</strong>
                  </div>
                  <div className="route-cell">
                    <span className="route-header-label">TO (DESTINATION):</span>
                    <strong className="route-val">{selectedHistoryChallan.destinationUnit}</strong>
                  </div>
                </div>

                <div className="voucher-meta-row">
                  <div>
                    <strong>Order Ref:</strong> {selectedHistoryChallan.orderTitle}
                  </div>
                  <div>
                    <strong>Vehicle:</strong> {selectedHistoryChallan.vehicleNumber || '—'}
                  </div>
                  <div>
                    <strong>Driver:</strong> {selectedHistoryChallan.driverName || '—'}
                  </div>
                </div>

                <div className="voucher-table-wrap">
                  <table className="voucher-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Component Description</th>
                        <th>Category</th>
                        <th>Size (Inches)</th>
                        <th style={{ width: '100px' }}>Quantity</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistoryChallan.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td className="font-bold">{it.partName}</td>
                          <td>
                            <span className="voucher-cat-pill">
                              {it.category === 'LAMINATION' ? 'Lamination Panel' : 'Frame Component'}
                            </span>
                          </td>
                          <td className="font-mono">{it.dimensions}</td>
                          <td className="font-mono font-bold text-center">
                            {it.dispatchingNowQty} pcs
                          </td>
                          <td>{it.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedHistoryChallan.palletPhotos.length > 0 && (
                  <div className="voucher-pallet-photos-section">
                    <div className="voucher-photos-title">
                      📷 Loaded Pallet Reference Photos:
                    </div>
                    <div className="voucher-photos-grid">
                      {selectedHistoryChallan.palletPhotos.map((pUrl, i) => (
                        <div key={i} className="voucher-photo-cell">
                          <img src={pUrl} alt={`Pallet photo ${i + 1}`} className="voucher-photo-img" />
                          <span className="photo-caption">Pallet View #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="voucher-signatures-grid">
                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Dispatched By (Unit 2)</span>
                  </div>
                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Driver / Handover</span>
                  </div>
                  <div className="sig-cell">
                    <div className="sig-line" />
                    <span className="sig-label">Received at Unit 1 Assembly</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Challans Table */
            <div className="challans-list-table-card">
              {challansList.length === 0 ? (
                <div className="empty-order-state">
                  <Truck size={36} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
                  <h4>No Outward Challans Created Yet</h4>
                  <p>Click "Create New Challan" above to generate your first delivery voucher for Unit 1.</p>
                </div>
              ) : (
                <div className="table-scroll-wrap">
                  <table className="bulk-order-table">
                    <thead>
                      <tr>
                        <th>Challan No</th>
                        <th>Date & Time</th>
                        <th>Order Ref</th>
                        <th>Route</th>
                        <th>Total Pieces</th>
                        <th>Pallet Photos</th>
                        <th>Vehicle / Driver</th>
                        <th style={{ width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {challansList.map((ch) => {
                        const totalPcs = ch.items.reduce((s, it) => s + it.dispatchingNowQty, 0);

                        return (
                          <tr key={ch.id}>
                            <td className="font-mono font-bold text-emerald">{ch.challanNumber}</td>
                            <td>
                              <div>{ch.date}</div>
                              <span className="text-muted text-xs">{ch.time}</span>
                            </td>
                            <td className="font-bold">{ch.orderTitle}</td>
                            <td>
                              <span className="route-micro-tag">Unit 2 → Unit 1</span>
                            </td>
                            <td className="font-mono font-bold">{totalPcs} pcs</td>
                            <td>
                              {ch.palletPhotos.length > 0 ? (
                                <div className="table-pallet-photos-preview">
                                  <img
                                    src={ch.palletPhotos[0]}
                                    alt="Pallet"
                                    className="table-pallet-img"
                                  />
                                  {ch.palletPhotos.length > 1 && (
                                    <span className="more-photos-pill">
                                      +{ch.palletPhotos.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">No photo</span>
                              )}
                            </td>
                            <td>
                              <div>{ch.vehicleNumber || '—'}</div>
                              <span className="text-muted text-xs">{ch.driverName}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => setSelectedHistoryChallan(ch)}
                              >
                                <Printer size={13} />
                                <span>View & Print</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: UNIT 1 DISPATCH PROGRESS TRACKER
          ========================================================================= */}
      {activeSubTab === 'tracker' && (
        <div className="dispatch-tracker-card">
          <div className="tracker-intro-bar">
            <div>
              <h3 className="tracker-title">Unit 1 Assembly Fulfillment Tracker</h3>
              <p className="tracker-subtitle">
                Track how many components have already reached Unit 1 vs. what is still pending in Unit 2.
              </p>
            </div>
          </div>

          <div className="orders-progress-stack">
            {orders.map((ord) => {
              const allItems = buildOrderChallanItems(ord);
              const totalNeeded = allItems.reduce((s, it) => s + it.totalOrderQty, 0);
              const totalDispatched = allItems.reduce((s, it) => s + it.alreadyDispatchedQty, 0);
              const percent = totalNeeded > 0 ? Math.round((totalDispatched / totalNeeded) * 100) : 0;

              const lamItems = allItems.filter((it) => it.category === 'LAMINATION');
              const lamNeeded = lamItems.reduce((s, it) => s + it.totalOrderQty, 0);
              const lamSent = lamItems.reduce((s, it) => s + it.alreadyDispatchedQty, 0);

              const frmItems = allItems.filter((it) => it.category === 'FRAME');
              const frmNeeded = frmItems.reduce((s, it) => s + it.totalOrderQty, 0);
              const frmSent = frmItems.reduce((s, it) => s + it.alreadyDispatchedQty, 0);

              return (
                <div key={ord.id} className="order-tracker-card">
                  <div className="order-tracker-top">
                    <div>
                      <h4 className="tracker-order-name">
                        {ord.orderNumber} - {ord.title}
                      </h4>
                      <span className="tracker-order-date">Created: {ord.date}</span>
                    </div>

                    <div className="tracker-right-summary">
                      <div className="progress-percentage font-mono font-bold">
                        {percent}% Transported
                      </div>
                      <span className="progress-pieces-count">
                        {totalDispatched} of {totalNeeded} pieces sent to Unit 1
                      </span>
                    </div>
                  </div>

                  {/* Main Progress Bar */}
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                  </div>

                  {/* Sub-Category Breakdowns */}
                  <div className="sub-category-progress-grid">
                    <div className="sub-progress-box">
                      <div className="sub-progress-header">
                        <Layers size={14} className="text-emerald" />
                        <span>Lamination Panels:</span>
                        <strong className="font-mono">
                          {lamSent} / {lamNeeded} pcs
                        </strong>
                      </div>
                      <div className="mini-progress-track">
                        <div
                          className="mini-progress-fill emerald"
                          style={{
                            width: `${lamNeeded > 0 ? (lamSent / lamNeeded) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="sub-progress-box">
                      <div className="sub-progress-header">
                        <Truck size={14} className="text-amber" />
                        <span>Frame Components:</span>
                        <strong className="font-mono">
                          {frmSent} / {frmNeeded} pcs
                        </strong>
                      </div>
                      <div className="mini-progress-track">
                        <div
                          className="mini-progress-fill amber"
                          style={{
                            width: `${frmNeeded > 0 ? (frmSent / frmNeeded) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="order-tracker-action-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        handleSelectOrder(ord.id);
                        setActiveSubTab('create');
                        setWizardStep(1);
                      }}
                    >
                      <Plus size={14} />
                      <span>Create Delivery Challan for Remaining Pieces</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
