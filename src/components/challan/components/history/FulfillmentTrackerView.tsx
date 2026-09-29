import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FactoryOrder, DeliveryChallan, ChallanComponentItem } from '../../../../types/challan';
import type { Product } from '../../../../types/product';
import {
  getAllChallans,
  getSavedOrders,
  getDetailedDispatchesForOrder,
  toggleOrderUrgency,
  markComponentAsSent,
  markAllOrderComponentsCompleted,
  type ComponentDeliveryDetail
} from '../../../../services/challan_db';
import { getAllProducts } from '../../../../services/product_db';
import { MarkSingleSentModal } from '../modals/MarkSingleSentModal';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  Printer,
  Plus,
  X,
  FileText,
  Filter,
  ArrowUpDown,
  Maximize2,
  Box
} from 'lucide-react';

export interface FulfillmentTrackerViewProps {
  orders?: FactoryOrder[];
  challans?: DeliveryChallan[];
  onSelectChallan?: (challan: DeliveryChallan) => void;
}

interface ComponentRowData {
  id: string;
  category: 'LAMINATION' | 'FRAME';
  partName: string;
  dimensions: string;
  woodType?: string;
  remarks?: string;
  totalRequired: number;
  challanSent: number;
  manualSent: number;
  totalTransported: number;
  pendingQty: number;
  isCompleted: boolean;
  challans: ComponentDeliveryDetail[];
}

interface OrderTrackerData {
  order: FactoryOrder;
  salesOrderNo: string;
  productName: string;
  productCode: string;
  customerName: string;
  photoUrl?: string;
  quantity: number;
  urgency: 'URGENT' | 'NORMAL';
  components: ComponentRowData[];
  totalRequiredPcs: number;
  totalTransportedPcs: number;
  percent: number;
  isCompleted: boolean;
  statusCategory: 'COMPLETED' | 'PARTIAL' | 'NOT_STARTED';
  uniqueChallans: { challanNumber: string; date: string; id: string }[];
}

export const FulfillmentTrackerView: React.FC<FulfillmentTrackerViewProps> = ({
  orders: propOrders,
  challans: propChallans,
  onSelectChallan
}) => {
  const navigate = useNavigate();

  // Master State
  const [orders, setOrders] = useState<FactoryOrder[]>(() => propOrders || getSavedOrders());
  const [challans, setChallans] = useState<DeliveryChallan[]>(() => propChallans || getAllChallans());
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMPLETED' | 'PARTIAL' | 'NOT_STARTED' | 'URGENT'>('ALL');
  const [sortBy, setSortBy] = useState<'URGENCY_FIRST' | 'PERCENT_DESC' | 'PERCENT_ASC' | 'NEWEST' | 'ORDER_NO'>('URGENCY_FIRST');

  // Modals State
  const [modalItem, setModalItem] = useState<ChallanComponentItem | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ url: string; title: string } | null>(null);

  // Sync prop changes if received from parent
  useEffect(() => {
    if (propOrders) setOrders(propOrders);
  }, [propOrders]);

  useEffect(() => {
    if (propChallans) setChallans(propChallans);
  }, [propChallans]);

  // Load master products for high quality product photos & fallback wood plans
  useEffect(() => {
    getAllProducts().then(setProducts).catch(console.warn);
  }, []);

  // Compute enriched tracker data for each order
  const trackerData: OrderTrackerData[] = useMemo(() => {
    return orders.map((order) => {
      // Find matching catalog product for photo
      const matchedProduct = products.find(
        (p) =>
          (order.productId && p.id === order.productId) ||
          (order.productCode && p.code.toLowerCase() === order.productCode.toLowerCase()) ||
          (order.productName && p.name.toLowerCase() === order.productName.toLowerCase())
      );

      const photoUrl = order.productImage || matchedProduct?.photoUrl;
      const salesOrderNo = order.salesOrderNo || order.orderNumber || 'SO-PENDING';
      const productName = order.productName || matchedProduct?.name || order.title;
      const productCode = order.productCode || matchedProduct?.code || '';
      const customerName = order.customerName || matchedProduct?.customerName || 'Standard Client';
      const urgency = order.urgency === 'URGENT' ? 'URGENT' : 'NORMAL';

      // Get detailed dispatches for this order
      const dispatchesMap = getDetailedDispatchesForOrder(order.id);

      const components: ComponentRowData[] = [];
      const uniqueChallansMap = new Map<string, { challanNumber: string; date: string; id: string }>();

      // 1. Lamination Panels
      order.laminationItems.forEach((lam) => {
        const dispatchInfo = dispatchesMap.get(lam.id) || {
          challans: [],
          challanSentTotal: 0,
          manualSentTotal: 0,
          totalTransported: 0
        };

        dispatchInfo.challans.forEach((ch) => {
          if (!uniqueChallansMap.has(ch.challanNumber)) {
            uniqueChallansMap.set(ch.challanNumber, {
              challanNumber: ch.challanNumber,
              date: ch.date,
              id: ch.challanId
            });
          }
        });

        const totalReq = lam.quantityNeeded;
        const totalSent = dispatchInfo.totalTransported;
        const pending = Math.max(0, totalReq - totalSent);
        const isDone = totalSent >= totalReq;

        components.push({
          id: lam.id,
          category: 'LAMINATION',
          partName: lam.partName,
          dimensions: `${lam.length}″ × ${lam.width}″ × ${lam.thickness}″`,
          woodType: lam.woodType,
          remarks: lam.remarks,
          totalRequired: totalReq,
          challanSent: dispatchInfo.challanSentTotal,
          manualSent: dispatchInfo.manualSentTotal,
          totalTransported: totalSent,
          pendingQty: pending,
          isCompleted: isDone,
          challans: dispatchInfo.challans
        });
      });

      // 2. Frame Components
      order.frameItems.forEach((frm) => {
        const dispatchInfo = dispatchesMap.get(frm.id) || {
          challans: [],
          challanSentTotal: 0,
          manualSentTotal: 0,
          totalTransported: 0
        };

        dispatchInfo.challans.forEach((ch) => {
          if (!uniqueChallansMap.has(ch.challanNumber)) {
            uniqueChallansMap.set(ch.challanNumber, {
              challanNumber: ch.challanNumber,
              date: ch.date,
              id: ch.challanId
            });
          }
        });

        const totalReq = frm.quantity;
        const totalSent = dispatchInfo.totalTransported;
        const pending = Math.max(0, totalReq - totalSent);
        const isDone = totalSent >= totalReq;

        components.push({
          id: frm.id,
          category: 'FRAME',
          partName: frm.partName,
          dimensions: frm.size,
          woodType: frm.woodType,
          remarks: frm.remarks,
          totalRequired: totalReq,
          challanSent: dispatchInfo.challanSentTotal,
          manualSent: dispatchInfo.manualSentTotal,
          totalTransported: totalSent,
          pendingQty: pending,
          isCompleted: isDone,
          challans: dispatchInfo.challans
        });
      });

      const totalRequiredPcs = components.reduce((sum, c) => sum + c.totalRequired, 0);
      const totalTransportedPcs = components.reduce((sum, c) => sum + c.totalTransported, 0);
      const percent = totalRequiredPcs > 0 ? Math.min(100, Math.round((totalTransportedPcs / totalRequiredPcs) * 100)) : 0;

      // Completion definition requested by user:
      // "completed means each component of the product is transported either by challan or by manual entry without challan"
      const isCompleted = components.length > 0 && components.every((c) => c.isCompleted);

      let statusCategory: 'COMPLETED' | 'PARTIAL' | 'NOT_STARTED' = 'NOT_STARTED';
      if (isCompleted) {
        statusCategory = 'COMPLETED';
      } else if (totalTransportedPcs > 0) {
        statusCategory = 'PARTIAL';
      }

      return {
        order,
        salesOrderNo,
        productName,
        productCode,
        customerName,
        photoUrl,
        quantity: order.quantity || 1,
        urgency,
        components,
        totalRequiredPcs,
        totalTransportedPcs,
        percent,
        isCompleted,
        statusCategory,
        uniqueChallans: Array.from(uniqueChallansMap.values())
      };
    });
  }, [orders, challans, products]);

  // Overall Statistics for KPI Dashboard
  const stats = useMemo(() => {
    const totalOrders = trackerData.length;
    const completedOrders = trackerData.filter((t) => t.isCompleted).length;
    const partialOrders = trackerData.filter((t) => t.statusCategory === 'PARTIAL').length;
    const pendingOrders = trackerData.filter((t) => t.statusCategory === 'NOT_STARTED').length;
    const urgentOrders = trackerData.filter((t) => t.urgency === 'URGENT').length;

    const totalPcsNeeded = trackerData.reduce((s, t) => s + t.totalRequiredPcs, 0);
    const totalPcsTransported = trackerData.reduce((s, t) => s + t.totalTransportedPcs, 0);
    const overallPercent = totalPcsNeeded > 0 ? Math.round((totalPcsTransported / totalPcsNeeded) * 100) : 0;

    return {
      totalOrders,
      completedOrders,
      partialOrders,
      pendingOrders,
      urgentOrders,
      totalPcsNeeded,
      totalPcsTransported,
      overallPercent
    };
  }, [trackerData]);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let result = trackerData.filter((item) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderNo = item.salesOrderNo.toLowerCase().includes(q);
        const matchesProduct = item.productName.toLowerCase().includes(q);
        const matchesCode = item.productCode.toLowerCase().includes(q);
        const matchesCustomer = item.customerName.toLowerCase().includes(q);
        const matchesComponent = item.components.some((c) => c.partName.toLowerCase().includes(q));
        const matchesChallan = item.uniqueChallans.some((ch) => ch.challanNumber.toLowerCase().includes(q));

        if (!matchesOrderNo && !matchesProduct && !matchesCode && !matchesCustomer && !matchesComponent && !matchesChallan) {
          return false;
        }
      }

      // Filter tabs
      if (activeFilter === 'COMPLETED') return item.isCompleted;
      if (activeFilter === 'PARTIAL') return item.statusCategory === 'PARTIAL';
      if (activeFilter === 'NOT_STARTED') return item.statusCategory === 'NOT_STARTED';
      if (activeFilter === 'URGENT') return item.urgency === 'URGENT';

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'URGENCY_FIRST') {
        if (a.urgency === 'URGENT' && b.urgency !== 'URGENT') return -1;
        if (a.urgency !== 'URGENT' && b.urgency === 'URGENT') return 1;
        // Secondary sort: incomplete first
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return b.percent - a.percent;
      }
      if (sortBy === 'PERCENT_DESC') return b.percent - a.percent;
      if (sortBy === 'PERCENT_ASC') return a.percent - b.percent;
      if (sortBy === 'ORDER_NO') return a.salesOrderNo.localeCompare(b.salesOrderNo);
      return b.order.date.localeCompare(a.order.date);
    });

    return result;
  }, [trackerData, searchQuery, activeFilter, sortBy]);

  // Handlers
  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedOrderIds(new Set(filteredData.map((d) => d.order.id)));
  };

  const collapseAll = () => {
    setExpandedOrderIds(new Set());
  };

  const handleToggleUrgency = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await toggleOrderUrgency(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, urgency: next } : o))
    );
  };

  const handleOpenManualEntry = (comp: ComponentRowData, order: FactoryOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToMark: ChallanComponentItem = {
      id: comp.id,
      orderId: order.id,
      orderTitle: order.title,
      productCode: order.productCode,
      productName: order.productName,
      salesOrderNo: order.salesOrderNo || order.orderNumber,
      category: comp.category,
      partName: comp.partName,
      dimensions: comp.dimensions,
      totalOrderQty: comp.totalRequired,
      alreadyDispatchedQty: comp.totalTransported,
      dispatchingNowQty: comp.pendingQty,
      woodType: comp.woodType,
      remarks: comp.remarks
    };
    setModalItem(itemToMark);
  };

  const handleSaveManualSent = (itemId: string, qtyToAdd: number) => {
    markComponentAsSent(itemId, qtyToAdd);
    setModalItem(null);
    // Refresh local lists
    setOrders([...getSavedOrders()]);
  };

  const handleMarkAllOrderComplete = (order: FactoryOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Mark all components of "${order.productName || order.title}" (SO: ${order.salesOrderNo || order.orderNumber}) as transported to Unit 1?`)) {
      markAllOrderComponentsCompleted(order);
      setOrders([...getSavedOrders()]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HERO BANNER & HEADER
      ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden print:hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold tracking-wide uppercase">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span>Unit 1 Assembly Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
              Component Fulfillment & Production Tracker
            </h1>
            <p className="text-sm text-slate-300 m-0 leading-relaxed">
              Track parts arriving from Unit 2. Identify <strong>Complete Kits</strong> ready for immediate assembly, track in-transit challans, and prioritize production runs based on urgency.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition shadow-xs border border-white/15"
              title="Print Unit 1 Daily Assembly Sheet"
            >
              <Printer size={15} />
              <span>Print Assembly Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} />
              <span>New Factory Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KEY METRICS / KPI SUMMARY CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* Card 1: Ready for Assembly */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            activeFilter === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Ready to Assemble
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 mt-2">
            {stats.completedOrders}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
            <span>100% Kit Received at Unit 1</span>
          </div>
        </button>

        {/* Card 2: Partially Transported */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'PARTIAL' ? 'ALL' : 'PARTIAL')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            activeFilter === 'PARTIAL'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              In Transit / Partial
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-950 mt-2">
            {stats.partialOrders}
          </div>
          <div className="text-[11px] font-semibold text-amber-700 mt-1">
            Waiting on remaining parts
          </div>
        </button>

        {/* Card 3: Pending from Unit 2 */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'NOT_STARTED' ? 'ALL' : 'NOT_STARTED')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            activeFilter === 'NOT_STARTED'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Pending in Unit 2
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-950 mt-2">
            {stats.pendingOrders}
          </div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1">
            0% transported yet
          </div>
        </button>

        {/* Card 4: Total Components Flow */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Component Flow
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-2">
            {stats.overallPercent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {stats.totalPcsTransported} of {stats.totalPcsNeeded} pcs in Unit 1
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEARCH & FILTER TOOLBAR
      ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by Sales Order # (PO06863), Product Name, SKU, Customer, or Part Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort Dropdown & Expand Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="URGENCY_FIRST">⚡ Urgent Priority First</option>
                <option value="PERCENT_DESC">Highest Transported %</option>
                <option value="PERCENT_ASC">Lowest Transported %</option>
                <option value="ORDER_NO">Sales Order #</option>
                <option value="NEWEST">Newest Orders</option>
              </select>
            </div>

            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={13} />
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({trackerData.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={13} />
            Ready for Assembly ({stats.completedOrders})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('PARTIAL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'PARTIAL'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Truck size={13} />
            In Transit / Partial ({stats.partialOrders})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('NOT_STARTED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'NOT_STARTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Clock size={13} />
            Pending Unit 2 ({stats.pendingOrders})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('URGENT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'URGENT'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Zap size={13} className="fill-amber-400 text-amber-400" />
            Urgent Only ({stats.urgentOrders})
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRODUCT LISTINGS (CARD VIEW)
      ========================================================================= */}
      {filteredData.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Box size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 m-0">No matching products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
            {searchQuery
              ? `No products or orders match "${searchQuery}". Try searching with a different term.`
              : 'There are currently no products under this filter.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item) => {
            const isExpanded = expandedOrderIds.has(item.order.id);

            return (
              <div
                key={item.order.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  item.isCompleted
                    ? 'border-emerald-300/80 ring-1 ring-emerald-500/10'
                    : item.urgency === 'URGENT'
                    ? 'border-red-300 ring-1 ring-red-500/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Product Card Top Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Product Thumbnail & Title Details */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() =>
                          item.photoUrl
                            ? setPreviewPhotoUrl({ url: item.photoUrl, title: item.productName })
                            : null
                        }
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative group ${
                          item.photoUrl ? 'cursor-pointer' : ''
                        }`}
                        title={item.photoUrl ? 'Click to preview product photo' : item.productName}
                      >
                        {item.photoUrl ? (
                          <>
                            <img
                              src={item.photoUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Maximize2 size={16} />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Box size={24} />
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">No Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Product Name & Identifiers */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight m-0 truncate">
                            {item.productName}
                          </h3>

                          {/* Urgency Pill Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleUrgency(item.order.id, e)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer border ${
                              item.urgency === 'URGENT'
                                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 animate-pulse'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle priority urgency for Unit 1 production planning"
                          >
                            <Zap
                              size={12}
                              className={
                                item.urgency === 'URGENT' ? 'fill-red-600 text-red-600' : 'text-slate-400'
                              }
                            />
                            <span>{item.urgency === 'URGENT' ? 'URGENT PRIORITY' : 'NORMAL PRIORITY'}</span>
                          </button>
                        </div>

                        {/* Badges: Sales Order No, SKU, Customer, Date */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {/* Sales Order Number Badge */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono font-bold text-xs">
                            <FileText size={12} className="text-indigo-600" />
                            <span>SO: {item.salesOrderNo}</span>
                          </span>

                          {item.productCode && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                              {item.productCode}
                            </span>
                          )}

                          <span className="text-slate-500 font-medium truncate">
                            Client: <strong className="text-slate-800">{item.customerName}</strong>
                          </span>

                          <span className="text-slate-400 hidden sm:inline">•</span>

                          <span className="text-slate-500">
                            Qty: <strong className="font-mono text-slate-900 font-bold">{item.quantity} units</strong>
                          </span>

                          <span className="text-slate-400 hidden sm:inline">•</span>

                          <span className="text-slate-400 text-[11px]">
                            {item.order.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Completion Status Tag & % */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Product Status Tag Requested by User */}
                      {item.isCompleted ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wide">
                          <CheckCircle2 size={16} />
                          <span>COMPLETE — READY FOR ASSEMBLY</span>
                        </div>
                      ) : item.statusCategory === 'PARTIAL' ? (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5">
                          <Truck size={14} className="text-amber-700" />
                          <span>IN TRANSIT ({item.percent}% IN UNIT 1)</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-500" />
                          <span>PENDING IN UNIT 2 (0%)</span>
                        </div>
                      )}

                      <div className="text-right text-xs font-mono font-bold text-slate-600">
                        {item.totalTransportedPcs} of {item.totalRequiredPcs} total pieces received
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : item.percent > 0
                            ? 'bg-gradient-to-r from-indigo-600 to-amber-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Delivery Challans Attached Strip */}
                  <div className="flex items-center justify-between gap-3 flex-wrap text-xs pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Truck size={13} className="text-slate-400" />
                        Challans Transported:
                      </span>

                      {item.uniqueChallans.length > 0 ? (
                        item.uniqueChallans.map((ch) => (
                          <span
                            key={ch.id}
                            onClick={() => {
                              if (onSelectChallan) {
                                const found = challans.find((c) => c.id === ch.id || c.challanNumber === ch.challanNumber);
                                if (found) onSelectChallan(found);
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-bold border border-slate-200 transition ${
                              onSelectChallan ? 'cursor-pointer hover:border-slate-400' : ''
                            }`}
                            title={`Challan ${ch.challanNumber} (${ch.date})${onSelectChallan ? ' - Click to view voucher' : ''}`}
                          >
                            <span>{ch.challanNumber}</span>
                            <span className="text-slate-400 font-normal">({ch.date})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None yet from Unit 2</span>
                      )}
                    </div>

                    {/* Bottom Action Controls on Product Card */}
                    <div className="flex items-center gap-2">
                      {!item.isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAllOrderComplete(item.order, e)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          title="Mark all remaining components as received without a formal challan"
                        >
                          Mark All Received
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(item.order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                      >
                        <span>
                          {isExpanded ? 'Hide Components' : `View Components (${item.components.length})`}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    EXPANDED COMPONENT BREAKDOWN TABLE
                ========================================================================= */}
                {isExpanded && (
                  <div className="bg-slate-50/60 p-4 sm:p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span>Kit Components & Transportation History</span>
                      <span className="text-slate-400 font-normal lowercase">
                        {item.components.filter((c) => c.isCompleted).length} of {item.components.length} parts complete
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Component / Part</th>
                            <th className="py-2.5 px-3">Dimensions / Wood</th>
                            <th className="py-2.5 px-3 text-right">Required</th>
                            <th className="py-2.5 px-3 text-right">Transported</th>
                            <th className="py-2.5 px-3 text-right">Pending</th>
                            <th className="py-2.5 px-3">Transported Via (Challans & Manual)</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {item.components.map((comp) => {
                            return (
                              <tr
                                key={comp.id}
                                className={`hover:bg-slate-50/80 transition ${
                                  comp.isCompleted ? 'bg-emerald-50/30' : ''
                                }`}
                              >
                                {/* Category Badge */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {comp.category === 'LAMINATION' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      <Layers size={11} />
                                      Lamination
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                                      <Box size={11} />
                                      Frame
                                    </span>
                                  )}
                                </td>

                                {/* Part Name */}
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  {comp.partName}
                                  {comp.remarks && (
                                    <span className="block text-[10px] text-slate-400 font-normal">
                                      {comp.remarks}
                                    </span>
                                  )}
                                </td>

                                {/* Dimensions & Wood */}
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-medium text-slate-700">{comp.dimensions}</div>
                                  {comp.woodType && (
                                    <span className="text-[10px] text-slate-500">{comp.woodType}</span>
                                  )}
                                </td>

                                {/* Required Qty */}
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {comp.totalRequired}
                                </td>

                                {/* Transported Qty */}
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                  {comp.totalTransported}
                                </td>

                                {/* Pending Qty */}
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                  {comp.pendingQty > 0 ? comp.pendingQty : 0}
                                </td>

                                {/* Transported Via (Challans & Manual History) */}
                                <td className="py-2.5 px-3 min-w-[220px]">
                                  <div className="space-y-1">
                                    {/* Challans list */}
                                    {comp.challans.map((ch, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          if (onSelectChallan) {
                                            const found = challans.find((c) => c.id === ch.challanId || c.challanNumber === ch.challanNumber);
                                            if (found) onSelectChallan(found);
                                          }
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-800 font-medium mr-1.5 mb-1 transition ${
                                          onSelectChallan ? 'cursor-pointer hover:border-slate-400' : ''
                                        }`}
                                        title={`Challan ${ch.challanNumber} (${ch.date})${onSelectChallan ? ' - Click to view voucher' : ''}`}
                                      >
                                        <Truck size={10} className="text-slate-500" />
                                        <strong className="font-mono">{ch.challanNumber}</strong>:
                                        <span className="font-mono font-bold text-emerald-700">+{ch.quantity} pcs</span>
                                        <span className="text-slate-400 text-[9px]">({ch.date})</span>
                                        {ch.driverName && (
                                          <span className="text-slate-500 text-[9px] hidden sm:inline">
                                            • {ch.driverName}
                                          </span>
                                        )}
                                      </div>
                                    ))}

                                    {/* Manual entry record without challan */}
                                    {comp.manualSent > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-900 font-medium mr-1.5 mb-1">
                                        <FileText size={10} className="text-indigo-600" />
                                        <span>Manual Transfer:</span>
                                        <strong className="font-mono text-indigo-700 font-bold">
                                          +{comp.manualSent} pcs
                                        </strong>
                                      </div>
                                    )}

                                    {comp.challans.length === 0 && comp.manualSent === 0 && (
                                      <span className="text-[11px] text-slate-400 italic">
                                        Awaiting Unit 2 dispatch
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Status Tag */}
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  {comp.isCompleted ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                      <CheckCircle2 size={11} />
                                      Complete
                                    </span>
                                  ) : comp.totalTransported > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                                      Pending
                                    </span>
                                  )}
                                </td>

                                {/* Action */}
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenManualEntry(comp, item.order, e)}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition shadow-2xs"
                                    title="Record pieces received directly without a challan voucher"
                                  >
                                    + Manual
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODALS: MANUAL PIECES RECORDING & PHOTO PREVIEW LIGHTBOX
      ========================================================================= */}
      {modalItem && (
        <MarkSingleSentModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSave={handleSaveManualSent}
        />
      )}

      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 m-0">{previewPhotoUrl.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900">
              <img
                src={previewPhotoUrl.url}
                alt={previewPhotoUrl.title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FulfillmentTrackerView;
