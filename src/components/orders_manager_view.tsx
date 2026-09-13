import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedOrders, addOrUpdateOrder, deleteOrder } from '../services/challan_db';
import type { FactoryOrder } from '../types/challan';
import type { Product } from '../types/product';
import type { BulkOrderItem } from '../types/panel';
import {
  Search,
  Plus,
  Truck,
  Sparkles,
  Layers,
  Trash2,
  ExternalLink,
  MoreVertical,
  X,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OrdersManagerViewProps {
  products?: Product[];
  onOpenBulkMatcher: () => void;
  onCreateChallanForOrder?: (orderId: string) => void;
}

export const OrdersManagerView: React.FC<OrdersManagerViewProps> = ({
  products = [],
  onOpenBulkMatcher,
  onCreateChallanForOrder
}) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FactoryOrder[]>(() => getSavedOrders());

  // Search filter for table
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Top Section: New Order Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [salesOrderNo, setSalesOrderNo] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Dropdown menu state for table actions
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  // Modal to inspect cutting items of an order
  const [inspectingOrder, setInspectingOrder] = useState<FactoryOrder | null>(null);

  const refreshOrders = () => {
    setOrders([...getSavedOrders()]);
  };

  // When user selects a product, auto-fill customer name
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setFormError('');
    if (!prodId) {
      setCustomerName('');
      return;
    }
    const found = products.find((p) => p.id === prodId);
    if (found) {
      setCustomerName(found.customerName || '');
    }
  };

  // Helper to format date like "18-Aug-2026"
  const formatDateDDMMMYYYY = (d: Date = new Date()) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Add Order Handler
  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      setFormError('Please select a product from the All Products catalog.');
      return;
    }
    if (!salesOrderNo.trim()) {
      setFormError('Please enter a Sales Order No. (e.g. PO06863).');
      return;
    }
    const qty = parseInt(orderQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid order quantity (e.g. 26).');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      setFormError('Selected product not found.');
      return;
    }

    // Auto-generate lamination and frame items from product's Wood Plan
    const laminationItems: BulkOrderItem[] = (product.woodPlan?.laminationItems || []).map((it, idx) => ({
      id: `ord-lam-${Date.now()}-${idx}`,
      partName: it.partName,
      length: it.length,
      width: it.width,
      thickness: it.thickness,
      quantityNeeded: it.qtyPerUnit * qty,
      woodType: it.woodType,
      remarks: it.remarks,
      rawSizeString: it.rawSize
    }));

    const frameItems = (product.woodPlan?.frameItems || []).map((it, idx) => ({
      id: `ord-frm-${Date.now()}-${idx}`,
      partName: it.partName,
      size: `${it.length}″ × ${it.width}″ × ${it.thickness}″`,
      quantity: it.qtyPerUnit * qty,
      woodType: it.woodType,
      remarks: it.remarks
    }));

    const newOrder: FactoryOrder = {
      id: `order-${Date.now()}`,
      orderNumber: salesOrderNo.trim(),
      salesOrderNo: salesOrderNo.trim(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      customerName: customerName.trim() || product.customerName || 'Standard Customer',
      productImage: product.photoUrl,
      quantity: qty,
      title: `${product.code} ${product.name}`,
      date: formatDateDDMMMYYYY(),
      notes: `Order created from ${product.name} (${product.code}).`,
      status: 'PENDING',
      laminationItems,
      frameItems
    };

    addOrUpdateOrder(newOrder);
    refreshOrders();

    // Reset inputs
    setSalesOrderNo('');
    setOrderQuantity('');
    setFormError('');
  };

  const handleDelete = (orderId: string, orderTitle: string) => {
    if (window.confirm(`Are you sure you want to delete order "${orderTitle}"?`)) {
      deleteOrder(orderId);
      refreshOrders();
      setActiveMenuOrderId(null);
    }
  };

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    const q = tableSearchQuery.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((ord) => {
      const orderNo = (ord.salesOrderNo || ord.orderNumber || '').toLowerCase();
      const customer = (ord.customerName || '').toLowerCase();
      const title = (ord.title || '').toLowerCase();
      const prodName = (ord.productName || '').toLowerCase();
      const prodCode = (ord.productCode || '').toLowerCase();
      return (
        orderNo.includes(q) ||
        customer.includes(q) ||
        title.includes(q) ||
        prodName.includes(q) ||
        prodCode.includes(q)
      );
    });
  }, [orders, tableSearchQuery]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-5">
      {/* 1. TOP SECTION: Add New Order Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Plus size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base m-0">
              Create New Production Order
            </h3>
            <p className="text-xs text-slate-500 m-0">
              Select product from catalog to auto-fill customer and cutting specs, then enter sales order number and quantity.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAddOrder} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* 1. Product Search / Select */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Product *
            </label>
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 cursor-pointer truncate"
              >
                <option value="">-- Choose Product from Database --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.customerName || 'No customer'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Customer Name (Autofetched) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Auto-fetched from product"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          {/* 3. Sales Order No. */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sales Order No. *
            </label>
            <input
              type="text"
              value={salesOrderNo}
              onChange={(e) => setSalesOrderNo(e.target.value)}
              placeholder="e.g. PO06863"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 uppercase"
            />
          </div>

          {/* 4. Quantity & Submit Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                placeholder="e.g. 26"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              className="h-[42px] px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              <span>Add Order</span>
            </button>
          </div>
        </form>

        {/* Selected Product Specs Preview Strip */}
        {selectedProduct && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                {selectedProduct.photoUrl ? (
                  <img src={selectedProduct.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package size={14} className="text-slate-400 m-auto" />
                )}
              </div>
              <span>
                Selected: <strong className="text-slate-900">{selectedProduct.code} {selectedProduct.name}</strong>
              </span>
            </div>

            {selectedProduct.woodPlan ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} />
                Wood Plan Connected ({selectedProduct.woodPlan.laminationItems.length} lamination, {selectedProduct.woodPlan.frameItems.length} frame sizes)
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertCircle size={13} />
                No Wood Plan yet (you can upload one in Wood Plans section)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. TABLE SEARCH & HEADER BAR (Matching reference screenshot styling) */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Show</span>
          <span className="font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-800 border border-slate-200">
            {filteredOrders.length}
          </span>
          <span>entries</span>
        </div>

        {/* Search Bar matching screenshot format */}
        <div className="relative min-w-[260px] sm:w-80">
          <input
            type="text"
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            placeholder="Search orders (e.g. bunt, PO06863)..."
            className="w-full pl-3.5 pr-8 py-1.5 bg-white border border-slate-300 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 shadow-2xs transition"
          />
          {tableSearchQuery ? (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setTableSearchQuery('')}
            >
              <X size={14} />
            </button>
          ) : (
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* 3. TABLE SECTION (Matches user's screenshot layout and columns) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Pale Blue/Slate Table Header matching screenshot */}
            <thead className="bg-[#dce4ec] text-[#2c3e50] font-extrabold text-[12px] border-b border-slate-300 select-none">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5 min-w-[130px]">Order Date</th>
                <th className="py-3 px-3.5 min-w-[130px]">Order No.</th>
                <th className="py-3 px-4 min-w-[200px]">Customer</th>
                <th className="py-3 px-3 w-20 text-center">Image</th>
                <th className="py-3 px-4 min-w-[240px]">Product / Service</th>
                <th className="py-3 px-3.5 w-24 text-center">Ordered Qty.</th>
                <th className="py-3 px-3.5 w-28 text-center">Status</th>
                <th className="py-3 px-2.5 w-12 text-center"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching production orders found. Use the top section to add a new order.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord, idx) => {
                  // Derive code and name display (e.g. BS-BUN-06 Bunton Desk)
                  const displayCode = ord.productCode || (ord.title?.match(/^[A-Z0-9-]+/)?.[0] || '');
                  const displayName = ord.productName || ord.title || 'Finished Item';
                  const formattedProductTitle = ord.title.startsWith(displayCode)
                    ? ord.title
                    : displayCode
                    ? `${displayCode} ${displayName}`
                    : displayName;

                  const customer = ord.customerName || 'Ambiance Home Furnishing Pvt.Ltd.';
                  const orderNo = ord.salesOrderNo || ord.orderNumber || `PO0${6800 + idx}`;
                  const orderDate = ord.date || formatDateDDMMMYYYY();
                  const qty = ord.quantity || (ord.laminationItems?.[0]?.quantityNeeded || 10);
                  const isClosed = ord.status === 'CLOSED' || ord.status === 'COMPLETED';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/90 transition group">
                      {/* 1. S.No */}
                      <td className="py-3 px-3.5 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>

                      {/* 2. Order Date */}
                      <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {orderDate}
                      </td>

                      {/* 3. Order No. / Sales Order No. */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-sky-700 hover:text-sky-900 cursor-pointer">
                          <span>{orderNo}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </span>
                      </td>

                      {/* 4. Customer */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {customer}
                      </td>

                      {/* 5. Product Image */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-14 h-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200 mx-auto shadow-2xs flex items-center justify-center">
                          {ord.productImage ? (
                            <img src={ord.productImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* 6. Product Name (Code followed by Name, exactly like in screenshot) */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center gap-1 font-bold text-slate-900 text-xs sm:text-[13px]">
                            <span>{formattedProductTitle}</span>
                            <ExternalLink size={12} className="text-slate-400 opacity-80" />
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 cursor-default">
                            <Eye size={10} />
                            <span>
                              {ord.laminationItems?.length || 0} lamination &bull; {ord.frameItems?.length || 0} frame parts
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Ordered Qty */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                        {qty} pc
                      </td>

                      {/* 8. Status (Matches screenshot: Pending in golden-amber pill, Closed in olive green) */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isClosed ? (
                          <span className="inline-block px-3 py-1 rounded bg-[#556b2f] text-white font-bold text-[11px] shadow-2xs">
                            Closed
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded bg-[#b8860b] text-white font-bold text-[11px] shadow-2xs">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 9. Actions Column (⋮ menu) */}
                      <td className="py-3 px-2.5 text-center relative">
                        <button
                          type="button"
                          className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center mx-auto transition cursor-pointer"
                          onClick={() =>
                            setActiveMenuOrderId(activeMenuOrderId === ord.id ? null : ord.id)
                          }
                          title="Actions menu"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuOrderId === ord.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setActiveMenuOrderId(null)}
                            />
                            <div className="absolute right-2 top-10 z-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 text-left">
                              <button
                                type="button"
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  setActiveMenuOrderId(null);
                                  if (onCreateChallanForOrder) onCreateChallanForOrder(ord.id);
                                  navigate(`/challans/new?orderId=${ord.id}`);
                                }}
                              >
                                <Truck size={14} className="text-slate-900" />
                                <span>Create Outward Challan</span>
                              </button>

                              <button
                                type="button"
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  setActiveMenuOrderId(null);
                                  onOpenBulkMatcher();
                                }}
                              >
                                <Sparkles size={14} className="text-amber-500" />
                                <span>Check Extra Stock</span>
                              </button>

                              <button
                                type="button"
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  setActiveMenuOrderId(null);
                                  setInspectingOrder(ord);
                                }}
                              >
                                <Layers size={14} className="text-emerald-600" />
                                <span>View Cutting Items</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => handleDelete(ord.id, formattedProductTitle)}
                              >
                                <Trash2 size={14} />
                                <span>Delete Order</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Cutting Items Inspector Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base m-0">
                    {inspectingOrder.salesOrderNo || inspectingOrder.orderNumber} &bull; {inspectingOrder.title}
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Customer: {inspectingOrder.customerName || 'Standard Customer'} &bull; Ordered Qty: {inspectingOrder.quantity || 1} units
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                onClick={() => setInspectingOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Lamination Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Lamination Panels ({inspectingOrder.laminationItems.length} sizes)</span>
                </h4>
                {inspectingOrder.laminationItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No lamination panels defined for this order.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Part Name</th>
                          <th className="p-2">Cut Size</th>
                          <th className="p-2 text-center">Batch Qty</th>
                          <th className="p-2">Wood / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectingOrder.laminationItems.map((it) => (
                          <tr key={it.id}>
                            <td className="p-2 font-bold text-slate-800">{it.partName}</td>
                            <td className="p-2 font-mono">{it.length}″ × {it.width}″ × {it.thickness}″</td>
                            <td className="p-2 text-center font-mono font-bold">{it.quantityNeeded} pcs</td>
                            <td className="p-2 text-slate-600">{it.woodType} {it.remarks ? `(${it.remarks})` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Frame Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Frame Components ({inspectingOrder.frameItems.length} parts)</span>
                </h4>
                {inspectingOrder.frameItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No frame parts defined for this order.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Component Name</th>
                          <th className="p-2">Size</th>
                          <th className="p-2 text-center">Batch Qty</th>
                          <th className="p-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectingOrder.frameItems.map((it) => (
                          <tr key={it.id}>
                            <td className="p-2 font-bold text-slate-800">{it.partName}</td>
                            <td className="p-2 font-mono">{it.size}</td>
                            <td className="p-2 text-center font-mono font-bold">{it.quantity} pcs</td>
                            <td className="p-2 text-slate-600">{it.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                onClick={() => setInspectingOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
