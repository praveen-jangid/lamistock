import React from 'react';
import type { FactoryOrder, ChallanComponentItem } from '../../../../types/challan';
import { Package, Sparkles, Tag, X } from 'lucide-react';

export interface OrderSelectorProps {
  orders: FactoryOrder[];
  selectedOrderIds: string[];
  selectedOrders: FactoryOrder[];
  customItems: ChallanComponentItem[];
  checklistItemsCount: number;
  activeOrderFilter: string;
  onSelectOrderFilter: (filter: string) => void;
  onAddOrder: (orderId: string) => void;
  onRemoveOrder: (orderId: string) => void;
  onOpenAddCustomModal: () => void;
  getOrderDisplayName: (order: FactoryOrder) => string;
}

export const OrderSelector: React.FC<OrderSelectorProps> = ({
  orders,
  selectedOrderIds,
  selectedOrders,
  customItems,
  checklistItemsCount,
  activeOrderFilter,
  onSelectOrderFilter,
  onAddOrder,
  onRemoveOrder,
  onOpenAddCustomModal,
  getOrderDisplayName
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Package size={15} />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
              2. Select Product(s) to Dispatch:
            </label>
            <p className="text-[11px] text-slate-500 m-0">
              Choose products to transport in this truck trip
            </p>
          </div>
        </div>

        {/* Product selector dropdown & Custom sample button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenAddCustomModal}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
            title="Add custom size or sample piece not in production orders"
          >
            <Sparkles size={14} />
            <span>+ Add Custom / Sample Size</span>
          </button>

          <select
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs"
            onChange={(e) => {
              if (e.target.value) {
                onAddOrder(e.target.value);
                e.target.value = '';
              }
            }}
            value=""
          >
            <option value="" disabled>
              {selectedOrders.length === 0 ? 'Select Product to Dispatch...' : '+ Add Another Product to Trip...'}
            </option>
            {orders
              .filter((o) => !selectedOrderIds.includes(o.id))
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {getOrderDisplayName(o)} (SO: {o.salesOrderNo || o.orderNumber})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Selected Order Badges / Pills: Showing Product Code AND Product Name */}
      {(selectedOrders.length > 0 || customItems.length > 0) && (
        <div className="pt-2 space-y-2 border-t border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Dispatching:</span>
            {selectedOrders.map((ord) => (
              <div
                key={ord.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 shadow-2xs"
              >
                <Tag size={13} className="text-amber-600 flex-shrink-0" />
                <span className="font-extrabold text-slate-900">
                  {getOrderDisplayName(ord)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  SO: {ord.salesOrderNo || ord.orderNumber}
                </span>
                <button
                  type="button"
                  className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition"
                  onClick={() => onRemoveOrder(ord.id)}
                  title="Remove product from dispatch"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {customItems.length > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 shadow-2xs">
                <Sparkles size={13} className="text-purple-600 flex-shrink-0" />
                <span>Custom Samples & Trials ({customItems.length} items)</span>
              </div>
            )}
          </div>

          {/* Order Filter Tabs for Checklist */}
          {(selectedOrders.length > 1 || (selectedOrders.length >= 1 && customItems.length > 0)) && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Filter Components:</span>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeOrderFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                onClick={() => onSelectOrderFilter('ALL')}
              >
                All Items ({checklistItemsCount})
              </button>
              {selectedOrders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeOrderFilter === ord.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  onClick={() => onSelectOrderFilter(ord.id)}
                >
                  {getOrderDisplayName(ord)}
                </button>
              ))}
              {customItems.length > 0 && (
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeOrderFilter === 'CUSTOM'
                      ? 'bg-purple-900 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                  onClick={() => onSelectOrderFilter('CUSTOM')}
                >
                  <Sparkles size={12} />
                  <span>Custom Samples ({customItems.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
