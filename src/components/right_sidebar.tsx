import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  Plus,
  Sparkles,
  FileSpreadsheet,
  X,
  Zap,
  Truck,
  Printer,
  Package
} from 'lucide-react';

export interface RightSidebarProps {
  onCloseMobile?: () => void;
  onOpenRapidMode?: () => void;
  onOpenAddPanel: () => void;
  onOpenMatcher: () => void;
  onOpenBulkMatcher: () => void;
  // Optional backwards-compatibility props
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onCloseMobile,
  onOpenRapidMode,
  onOpenAddPanel,
  onOpenMatcher,
  onOpenBulkMatcher
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isChallansRoute = location.pathname.startsWith('/challans');
  const isOrdersRoute = location.pathname.startsWith('/orders');
  const isProductsRoute = location.pathname.startsWith('/products');

  return (
    <aside className="w-16 h-[calc(100vh-4rem)] sticky top-16 bg-white border-l border-slate-200 text-slate-900 flex flex-col transition-all duration-300 z-30 shadow-xs select-none overflow-visible print:hidden">
      {/* Header */}
      <div className="flex items-center justify-center p-3 border-b border-slate-200 bg-slate-50/70 relative">
        <div
          className="w-8 h-8 rounded-lg bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-600"
          title="Quick Actions"
        >
          <Zap size={15} className="fill-amber-500 text-amber-500" />
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            className="lg:hidden absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            onClick={onCloseMobile}
            title="Close Quick Actions"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Action Buttons List - Dedicated Collapsed Icon Rail */}
      <div className="p-2.5 space-y-2.5 flex flex-col items-center">
        {/* ===================================================================
            1. ROUTE: OUTWARD CHALLANS (/challans or /challans/new)
            =================================================================== */}
        {isChallansRoute && (
          <>
            {/* Challan Action 1: Create Challan */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  navigate('/challans/new');
                }}
                title="Create Outward Challan"
              >
                <Truck size={19} />
              </button>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Create Outward Challan</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>

            {/* Challan Action 2: Print Challan */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  window.print();
                }}
                title="Print Challan Voucher"
              >
                <Printer size={18} />
              </button>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Print Challan Voucher</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            2. ROUTE: PRODUCTION ORDERS (/orders)
            =================================================================== */}
        {isOrdersRoute && (
          <>
            {/* Order Action 1: Bulk Matcher */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-slate-900 text-emerald-400 border-slate-900 hover:bg-slate-800 hover:text-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={onOpenBulkMatcher}
              >
                <FileSpreadsheet size={19} />
              </button>

              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Check Cutting Stock</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            3. ROUTE: ALL PRODUCTS (/products)
            =================================================================== */}
        {isProductsRoute && (
          <>
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate('/products')}
              >
                <Package size={19} />
              </button>

              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>All Products Catalog</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            4. DEFAULT ROUTE: LAMINATION STOCK (/stock or default)
            =================================================================== */}
        {!isChallansRoute && !isOrdersRoute && !isProductsRoute && (
          <>
            {/* Action 1: Rapid Daily Entry (Camera) */}
            {onOpenRapidMode && (
              <div className="relative group w-full flex justify-center">
                <button
                  type="button"
                  className="w-11 h-11 rounded-xl border flex items-center justify-center bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-xs hover:shadow-md transition-all duration-200"
                  onClick={onOpenRapidMode}
                >
                  <Camera size={19} />
                </button>

                {/* Hover Tooltip - Clean Name Only */}
                <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                  <span>Rapid Daily Entry</span>
                  <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
                </div>
              </div>
            )}

            {/* Action 2: Add Single Panel */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenAddPanel}
              >
                <Plus size={19} />
              </button>

              {/* Hover Tooltip - Clean Name Only */}
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Add Single Panel</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>

            {/* Action 3: Single Piece Match */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenMatcher}
              >
                <Sparkles size={19} />
              </button>

              {/* Hover Tooltip - Clean Name Only */}
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Single Piece Match</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>

            {/* Action 4: Bulk Order Matcher (Excel) */}
            <div className="relative group w-full flex justify-center">
              <button
                type="button"
                className="w-11 h-11 rounded-xl border flex items-center justify-center bg-slate-900 text-emerald-400 border-slate-900 hover:bg-slate-800 hover:text-emerald-300 shadow-xs hover:shadow-md transition-all duration-200"
                onClick={onOpenBulkMatcher}
              >
                <FileSpreadsheet size={19} />
              </button>

              {/* Hover Tooltip - Clean Name Only */}
              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 flex items-center">
                <span>Bulk Order Matcher</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;

