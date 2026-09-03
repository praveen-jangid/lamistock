import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import type { DeliveryChallan, ChallanComponentItem } from '../types/challan';
import {
  getSavedOrders,
  getAllChallans,
  saveChallan,
  getNextChallanNumber,
  buildOrderChallanItems
} from '../services/challan_db';
import { compressImage } from '../services/image_compressor';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 flex-shrink-0">
            <Truck size={24} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 m-0">
                Outward Delivery Challans
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                Unit 2 (Lamination) → Unit 1 (Assembly)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Dispatch laminated panels & frame components with checklists, pallet photos, and printable delivery vouchers.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setActiveSubTab('create');
              navigate('/challans/new');
            }}
          >
            <Plus size={14} />
            <span>Create Challan</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setActiveSubTab('history');
              setSelectedHistoryChallan(null);
              navigate('/challans');
            }}
          >
            <Clock size={14} />
            <span>History ({challansList.length})</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'tracker'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setActiveSubTab('tracker');
              navigate('/tracker');
            }}
          >
            <Layers size={14} />
            <span>Unit 1 Tracker</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CREATE OUTWARD CHALLAN (WIZARD)
          ========================================================================= */}
      {activeSubTab === 'create' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Wizard Step Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200 pb-5">
            {[
              { num: 1, title: 'Select Components', desc: 'Panels & Frames' },
              { num: 2, title: 'Pallet Photos & Vehicle', desc: 'Transport Details' },
              { num: 3, title: 'Review & Print Format', desc: 'Paper Challan Voucher' }
            ].map((st) => (
              <div
                key={st.num}
                className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                  wizardStep === st.num
                    ? 'border-slate-900 bg-slate-50'
                    : wizardStep > st.num
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-200 opacity-60'
                }`}
                onClick={() => {
                  if (st.num === 1 || dispatchedItems.length > 0) {
                    setWizardStep(st.num as 1 | 2 | 3);
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

          {/* STEP 1: COMPONENT CHECKLIST */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              {/* Top Order Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Production Order to Dispatch:
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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

                {onOpenBulkMatcher && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer self-end sm:self-center"
                    onClick={onOpenBulkMatcher}
                  >
                    <Sparkles size={14} />
                    <span>Check Extra Stock in Cloud</span>
                  </button>
                )}
              </div>

              {/* Selection Helper Buttons */}
              <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-slate-700">Selected:</strong>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {laminationDispatched.length} Lamination Sizes (
                    {laminationDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} panels)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {framesDispatched.length} Frame Components (
                    {framesDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} pcs)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold transition cursor-pointer"
                    onClick={handleSelectAllLamination}
                  >
                    Select All Lamination
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold transition cursor-pointer"
                    onClick={handleSelectAllFrames}
                  >
                    Select All Frames
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg font-semibold transition cursor-pointer"
                    onClick={() => setSelectedItemIds(new Set())}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* SECTION A: LAMINATION PANELS CHECKLIST */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Layers size={16} className="text-emerald-600" />
                    <span>Category 1: Lamination Panels</span>
                    <span className="text-slate-400 font-normal">
                      ({checklistItems.filter((it) => it.category === 'LAMINATION').length} sizes)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Pressed in Unit 2 • Select loaded panels
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-10 text-center">Send</th>
                        <th className="p-2.5">Part Name</th>
                        <th className="p-2.5 w-44">Dimensions (L × W × T)</th>
                        <th className="p-2.5 w-24">Order Total</th>
                        <th className="p-2.5 w-24">Already Sent</th>
                        <th className="p-2.5 w-28">Dispatch Now</th>
                        <th className="p-2.5">Remarks / Finish</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checklistItems
                        .filter((it) => it.category === 'LAMINATION')
                        .map((it) => {
                          const isChecked = selectedItemIds.has(it.id);
                          const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);

                          return (
                            <tr
                              key={it.id}
                              className={`transition cursor-pointer ${
                                isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                              }`}
                              onClick={() => handleToggleItem(it.id)}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleItem(it.id)}
                                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">{it.partName}</td>
                              <td className="p-2.5 font-mono text-slate-700">{it.dimensions}</td>
                              <td className="p-2.5 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                              <td className="p-2.5 font-mono text-slate-400">
                                {it.alreadyDispatchedQty > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                                    {it.alreadyDispatchedQty} sent
                                  </span>
                                ) : '0'}
                              </td>
                              <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min={1}
                                  max={remaining || 999}
                                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none disabled:opacity-40"
                                  value={it.dispatchingNowQty}
                                  onChange={(e) =>
                                    handleQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                                  }
                                  disabled={!isChecked}
                                />
                              </td>
                              <td className="p-2.5 text-slate-500">{it.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: FRAME COMPONENTS CHECKLIST */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Truck size={16} className="text-amber-500" />
                    <span>Category 2: Frame & Structural Components</span>
                    <span className="text-slate-400 font-normal">
                      ({checklistItems.filter((it) => it.category === 'FRAME').length} items)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Solid wood framing, legs, aprons</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-10 text-center">Send</th>
                        <th className="p-2.5">Part Name</th>
                        <th className="p-2.5 w-44">Size (Inches)</th>
                        <th className="p-2.5 w-24">Order Total</th>
                        <th className="p-2.5 w-24">Already Sent</th>
                        <th className="p-2.5 w-28">Dispatch Now</th>
                        <th className="p-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checklistItems
                        .filter((it) => it.category === 'FRAME')
                        .map((it) => {
                          const isChecked = selectedItemIds.has(it.id);
                          const remaining = Math.max(0, it.totalOrderQty - it.alreadyDispatchedQty);

                          return (
                            <tr
                              key={it.id}
                              className={`transition cursor-pointer ${
                                isChecked ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'
                              }`}
                              onClick={() => handleToggleItem(it.id)}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleItem(it.id)}
                                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">{it.partName}</td>
                              <td className="p-2.5 font-mono text-slate-700">{it.dimensions}</td>
                              <td className="p-2.5 font-mono text-slate-600">{it.totalOrderQty} pcs</td>
                              <td className="p-2.5 font-mono text-slate-400">
                                {it.alreadyDispatchedQty > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                                    {it.alreadyDispatchedQty} sent
                                  </span>
                                ) : '0'}
                              </td>
                              <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min={1}
                                  max={remaining || 999}
                                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none disabled:opacity-40"
                                  value={it.dispatchingNowQty}
                                  onChange={(e) =>
                                    handleQtyChange(it.id, parseInt(e.target.value, 10) || 1)
                                  }
                                  disabled={!isChecked}
                                />
                              </td>
                              <td className="p-2.5 text-slate-500">{it.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-wrap">
                <div className="text-xs text-slate-600">
                  Total Items to Dispatch:{' '}
                  <strong className="text-emerald-700 font-mono text-sm">
                    {dispatchedItems.reduce((s, it) => s + it.dispatchingNowQty, 0)} pieces
                  </strong>{' '}
                  across {dispatchedItems.length} sizes
                </div>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  disabled={dispatchedItems.length === 0}
                  onClick={() => setWizardStep(2)}
                >
                  Proceed to Pallet Photos & Vehicle →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PALLET PHOTOS & VEHICLE INFO */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pallet Photos */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Camera size={16} className="text-emerald-600" />
                    <span>Pallet & Shipment Photos (For Unit 1 Reference)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Take photos of the loaded pallet/tempo so Unit 1 can verify piece placement upon arrival.
                  </p>

                  <div
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-6 text-center cursor-pointer transition"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Camera size={28} className="text-slate-400 mx-auto mb-2" />
                    <span className="block text-xs font-bold text-slate-800">
                      Snap Photo with Camera / Click to Upload
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Upload loaded pallet or stack images
                    </span>
                  </div>

                  {palletPhotos.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-2">
                      {palletPhotos.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                          <img src={img} alt={`Pallet ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                            onClick={() => handleRemovePhoto(idx)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transport & Route Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Truck size={16} className="text-amber-500" />
                    <span>Transport & Route Information</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Outward Challan #:</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                        value={challanNumber}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dispatch Date:</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">From Location:</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 truncate"
                        value="Unit 2 (Lamination)"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">To Location:</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 truncate"
                        value="Unit 1 (Assembly)"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle / Tempo #:</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. RJ-14 Factory Pickup"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name:</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Ramesh"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dispatch Notes for Unit 1:</label>
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      rows={2}
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  onClick={() => setWizardStep(1)}
                >
                  ← Back to Components
                </button>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  onClick={() => setWizardStep(3)}
                >
                  Proceed to Print Preview & Save →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & PRINT PREVIEW */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              {/* Action Toolbar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Print Format Ready: You can print now or save to reprint anytime.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    onClick={handlePrint}
                  >
                    <Printer size={14} />
                    <span>Print Voucher</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    onClick={handleSaveChallan}
                  >
                    <PackageCheck size={14} />
                    <span>Save & Mark Dispatched</span>
                  </button>
                </div>
              </div>

              {/* Printable Challan Voucher */}
              <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-5 shadow-xs" id="printable-voucher-content">
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 m-0">
                      FACTORY OUTWARD DELIVERY CHALLAN
                    </h1>
                    <div className="text-xs text-slate-500 mt-0.5">Internal Wood Components Transfer Voucher</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono font-black text-sm text-slate-900">Challan No: {challanNumber}</div>
                    <div className="text-slate-600">Date: {dispatchDate}</div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Route Box */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">DISPATCHED FROM:</span>
                    <strong className="text-slate-900">Unit 2 (Lamination & Wood Processing)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">DELIVER TO:</span>
                    <strong className="text-slate-900">Unit 1 (Furniture Assembly Workshop)</strong>
                  </div>
                </div>

                {/* Transport Info */}
                <div className="flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div><strong>Order Ref:</strong> {activeOrder ? activeOrder.title : 'Custom Dispatch'} ({activeOrder ? activeOrder.orderNumber : '—'})</div>
                  <div><strong>Vehicle:</strong> {vehicleNumber}</div>
                  <div><strong>Driver:</strong> {driverName}</div>
                </div>

                {/* Transport Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Component Description</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 w-44">Size (L × W × T)</th>
                        <th className="p-2 w-24 text-center">Dispatch Qty</th>
                        <th className="p-2">Notes for Unit 1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dispatchedItems.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{it.partName}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {it.category === 'LAMINATION' ? 'Lamination Panel' : 'Frame Component'}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{it.dimensions}</td>
                          <td className="p-2 font-mono font-bold text-center text-slate-900">
                            {it.dispatchingNowQty} pcs
                          </td>
                          <td className="p-2 text-slate-500">{it.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2 text-right">TOTAL PIECES DISPATCHED:</td>
                        <td className="p-2 font-mono text-center text-slate-900">
                          {dispatchedItems.reduce((sum, it) => sum + it.dispatchingNowQty, 0)} pcs
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pallet Photos */}
                {palletPhotos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      📷 Loaded Pallet Reference Photos (Unit 1 Team):
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      {palletPhotos.map((pUrl, i) => (
                        <div key={i} className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          <img src={pUrl} alt={`Pallet ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature Row */}
                <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 mb-2 h-8" />
                    <span className="text-slate-500 font-semibold">Prepared By (Unit 2)</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-2 h-8" />
                    <span className="text-slate-500 font-semibold">Driver / Handover</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-2 h-8" />
                    <span className="text-slate-500 font-semibold">Received at Unit 1</span>
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 print:hidden">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  onClick={() => setWizardStep(2)}
                >
                  ← Back to Photos & Vehicle
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    onClick={handlePrint}
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    onClick={handleSaveChallan}
                  >
                    <CheckCircle2 size={14} />
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
        <div className="space-y-4">
          {selectedHistoryChallan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 print:hidden">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  onClick={() => setSelectedHistoryChallan(null)}
                >
                  ← Back to Challans List
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  onClick={handlePrint}
                >
                  <Printer size={14} />
                  <span>Print This Challan</span>
                </button>
              </div>

              {/* Printable Voucher */}
              <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-5 shadow-xs">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 m-0">
                      FACTORY OUTWARD DELIVERY CHALLAN
                    </h1>
                    <div className="text-xs text-slate-500 mt-0.5">Internal Wood Transfer Voucher</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono font-black text-sm text-slate-900">
                      Challan No: {selectedHistoryChallan.challanNumber}
                    </div>
                    <div className="text-slate-600">Date: {selectedHistoryChallan.date}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{selectedHistoryChallan.time}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">FROM:</span>
                    <strong className="text-slate-900">{selectedHistoryChallan.sourceUnit}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">TO:</span>
                    <strong className="text-slate-900">{selectedHistoryChallan.destinationUnit}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div><strong>Order Ref:</strong> {selectedHistoryChallan.orderTitle}</div>
                  <div><strong>Vehicle:</strong> {selectedHistoryChallan.vehicleNumber || '—'}</div>
                  <div><strong>Driver:</strong> {selectedHistoryChallan.driverName || '—'}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Component Description</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 w-44">Size (Inches)</th>
                        <th className="p-2 w-24 text-center">Quantity</th>
                        <th className="p-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedHistoryChallan.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{it.partName}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {it.category === 'LAMINATION' ? 'Lamination Panel' : 'Frame Component'}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{it.dimensions}</td>
                          <td className="p-2 font-mono font-bold text-center text-slate-900">
                            {it.dispatchingNowQty} pcs
                          </td>
                          <td className="p-2 text-slate-500">{it.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedHistoryChallan.palletPhotos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      📷 Loaded Pallet Reference Photos:
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedHistoryChallan.palletPhotos.map((pUrl, i) => (
                        <div key={i} className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          <img src={pUrl} alt={`Pallet ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {challansList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Truck size={36} className="mx-auto text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700 m-0">No Outward Challans Created Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Create Challan" above to generate your first delivery voucher for Unit 1.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Challan No</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Order Ref</th>
                        <th className="p-3">Route</th>
                        <th className="p-3">Total Pieces</th>
                        <th className="p-3">Pallet Photos</th>
                        <th className="p-3">Vehicle / Driver</th>
                        <th className="p-3 w-28 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {challansList.map((ch) => {
                        const totalPcs = ch.items.reduce((s, it) => s + it.dispatchingNowQty, 0);

                        return (
                          <tr key={ch.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-3 font-mono font-bold text-slate-900">{ch.challanNumber}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{ch.date}</div>
                              <span className="text-[10px] text-slate-400 font-mono">{ch.time}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">{ch.orderTitle}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Unit 2 → Unit 1
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-700">{totalPcs} pcs</td>
                            <td className="p-3">
                              {ch.palletPhotos.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <img
                                    src={ch.palletPhotos[0]}
                                    alt="Pallet"
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                  />
                                  {ch.palletPhotos.length > 1 && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      +{ch.palletPhotos.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">No photo</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">
                              <div>{ch.vehicleNumber || '—'}</div>
                              <span className="text-[10px] text-slate-400">{ch.driverName}</span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                                onClick={() => setSelectedHistoryChallan(ch)}
                              >
                                <Printer size={12} />
                                <span>View</span>
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
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 m-0">Unit 1 Assembly Fulfillment Tracker</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-0">
              Track how many components have already reached Unit 1 vs. what is still pending in Unit 2.
            </p>
          </div>

          <div className="space-y-4">
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
                <div key={ord.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 m-0">
                        {ord.orderNumber} - {ord.title}
                      </h4>
                      <span className="text-xs text-slate-400">Created: {ord.date}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono text-slate-900">{percent}% Transported</div>
                      <span className="text-xs text-slate-500">
                        {totalDispatched} of {totalNeeded} pieces sent to Unit 1
                      </span>
                    </div>
                  </div>

                  {/* Main Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Sub-Category Breakdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Layers size={14} className="text-emerald-600" />
                          <span>Lamination Panels:</span>
                        </div>
                        <strong className="font-mono text-slate-900">{lamSent} / {lamNeeded} pcs</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{
                            width: `${lamNeeded > 0 ? (lamSent / lamNeeded) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Truck size={14} className="text-amber-500" />
                          <span>Frame Components:</span>
                        </div>
                        <strong className="font-mono text-slate-900">{frmSent} / {frmNeeded} pcs</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${frmNeeded > 0 ? (frmSent / frmNeeded) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
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
