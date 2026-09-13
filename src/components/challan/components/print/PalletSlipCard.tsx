import React from 'react';
import type { ChallanComponentItem, FactoryOrder } from '../../../../types/challan';
import { getStoredProductsSync } from '../../../../services/product_db';
import { Package } from 'lucide-react';

export interface PalletSlipCardProps {
  palletNumber: number;
  totalPallets?: number;
  palletName?: string;
  items: ChallanComponentItem[];
  challanNumber: string;
  dispatchDate: string;
  time?: string;
  vehicleNumber?: string;
  driverName?: string;
  remarks?: string;
  orders?: FactoryOrder[];
  orderTitles?: string[];
}

export const PalletSlipCard: React.FC<PalletSlipCardProps> = ({
  palletNumber,
  items,
  challanNumber,
  dispatchDate,
  time,
  vehicleNumber,
  driverName,
  remarks,
  orders = []
}) => {
  const products = getStoredProductsSync();
  const palletItems = items.filter((it) => (it.palletNumber || 1) === palletNumber);

  // Helper to resolve product details for an item
  const resolveProductInfo = (it: ChallanComponentItem) => {
    const order = orders.find((o) => o.id === it.orderId);
    const prod =
      products.find(
        (p) =>
          (order?.productId && p.id === order.productId) ||
          (it.productCode && p.code === it.productCode) ||
          (order?.productCode && p.code === order.productCode)
      ) || null;
    const isCustom = !!it.isCustomItem || it.orderId === 'custom-sample';
    const photo = order?.productImage || prod?.photoUrl || '';
    const code = it.productCode || order?.productCode || prod?.code || (isCustom ? 'SAMPLE' : '');
    const name = it.productName || order?.productName || prod?.name || it.orderTitle || (isCustom ? 'Custom Sample' : 'Standard Product');
    const customer = it.customerName || order?.customerName || (isCustom ? 'Sample / Client' : 'Standard');
    const soNumber = it.salesOrderNo || order?.salesOrderNo || order?.orderNumber || (isCustom ? 'SAMPLE' : '');
    const quantity = order?.quantity || (isCustom ? it.totalOrderQty : undefined);
    return { order, prod, photo, code, name, customer, soNumber, quantity, isCustom };
  };

  // Find unique products that have items on this pallet
  const uniqueProductsMap = new Map<string, ReturnType<typeof resolveProductInfo>>();
  palletItems.forEach((it) => {
    const key = it.orderId || it.productCode || it.productName || it.orderTitle;
    if (!uniqueProductsMap.has(key)) {
      uniqueProductsMap.set(key, resolveProductInfo(it));
    }
  });

  const uniqueProducts = Array.from(uniqueProductsMap.values());
  const isSingleProduct = uniqueProducts.length <= 1;
  const singleProd =
    uniqueProducts[0] ||
    (palletItems[0] ? resolveProductInfo(palletItems[0]) : null);

  // Dynamic row sizing based on number of items on this pallet
  const rowCount = palletItems.length;
  const rowPaddingClass =
    rowCount <= 3
      ? 'p-2.5 text-xs'
      : rowCount <= 5
      ? 'p-2 text-[11px]'
      : 'p-1 text-[10px]';

  return (
    <div className="pallet-slip-half border border-black rounded-xl p-3 sm:p-3.5 bg-white flex flex-col justify-start space-y-2 text-slate-900 overflow-hidden">
      {/* Top Header Strip: Clean title + Challan No & Date */}
      <div className="flex items-start justify-between border-b-2 border-black pb-1 flex-shrink-0">
        <div>
          <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 m-0 uppercase">
            Factory Outward Delivery Challan
          </h2>
        </div>
        <div className="text-right text-[11px]">
          <div className="font-mono font-black text-slate-900">{challanNumber}</div>
          <div className="text-slate-600 text-[10px]">
            {dispatchDate} {time && `• ${time}`}
          </div>
        </div>
      </div>

      {isSingleProduct ? (
        /* =====================================================================
           CASE A: SINGLE PRODUCT ON PALLET
           Displays enlarged item image along with:
           - Product code & name
           - Customer name
           - Sales order no
           - Vehicle
           - Quantity
           - Driver
           (+ Remarks)
           ===================================================================== */
        <>
          <div className="p-2.5 bg-slate-50 border border-black rounded-xl flex items-center gap-3.5 flex-shrink-0">
            {/* Product Photo - fully visible without cropping or overflow */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-black bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
              {singleProd?.photo ? (
                <img
                  src={singleProd.photo}
                  alt={singleProd.name}
                  className="max-w-full max-h-full w-auto h-auto object-contain block m-auto"
                />
              ) : (
                <Package size={34} className="text-slate-300" />
              )}
            </div>

            {/* Product & Transport Details Grid */}
            <div className="flex-1 min-w-0 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-black text-slate-900 text-sm sm:text-base truncate">
                  {singleProd?.code ? `${singleProd.code} — ` : ''}{singleProd?.name || 'Standard Product'}
                </div>
                {singleProd?.quantity && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-black font-mono font-bold text-[11px]">
                    Order Qty: {singleProd.quantity} units
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-[11px] text-slate-700 border-t border-black pt-1.5">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9.5px]">Customer:</span>{' '}
                  <strong className="text-slate-900 truncate block sm:inline">{singleProd?.customer || 'Standard'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9.5px]">SO No:</span>{' '}
                  <strong className="font-mono text-slate-900">{singleProd?.soNumber || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9.5px]">Vehicle:</span>{' '}
                  <strong className="font-mono text-slate-900">{vehicleNumber || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9.5px]">Driver:</span>{' '}
                  <strong className="text-slate-900">{driverName || '—'}</strong>
                </div>
              </div>

              {remarks && (
                <div className="text-[10.5px] text-slate-600 pt-1 border-t border-black truncate">
                  <span className="font-bold text-slate-500 uppercase text-[9.5px]">Remarks:</span>{' '}
                  <span className="italic text-slate-800">{remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table: Crisp 1px black borders, nowrap single-line sizes */}
          <div className="overflow-hidden rounded-lg border border-black flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-black">
                <tr>
                  <th className="p-1.5 w-7 text-center border-r border-black">#</th>
                  <th className="p-1.5 border-r border-black">Part Name & Description</th>
                  <th className="p-1.5 w-44 min-w-[150px] whitespace-nowrap border-r border-black">Size (L × W × T)</th>
                  <th className="p-1.5 w-16 text-center font-black border-r border-black">Qty</th>
                  <th className="p-1.5 w-24">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {palletItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400 italic text-[11px]">
                      No components loaded on this pallet.
                    </td>
                  </tr>
                ) : (
                  palletItems.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50">
                      <td className={`${rowPaddingClass} text-center font-mono text-slate-500 border-r border-black`}>{idx + 1}</td>
                      <td className={`${rowPaddingClass} font-bold text-slate-900 max-w-[180px] truncate border-r border-black`}>{it.partName}</td>
                      <td className={`${rowPaddingClass} font-mono font-semibold text-slate-900 whitespace-nowrap border-r border-black`}>{it.dimensions}</td>
                      <td className={`${rowPaddingClass} text-center font-mono font-black text-slate-900 bg-slate-50/80 border-r border-black`}>
                        {it.dispatchingNowQty} pcs
                      </td>
                      <td className={`${rowPaddingClass} text-slate-600 truncate max-w-[100px]`}>{it.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* =====================================================================
           CASE B: 2 OR MORE PRODUCTS ON PALLET
           - Transport strip on top
           - Larger product thumbnail in place of 'Type' column
           - Crisp 1px black borders
           - Nowrap single-line sizes
           ===================================================================== */
        <>
          <div className="p-1.5 bg-slate-50 border border-black rounded-lg flex items-center justify-between text-[10.5px] text-slate-700 flex-wrap gap-2 flex-shrink-0">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px]">Vehicle:</span>{' '}
              <strong className="font-mono text-slate-900">{vehicleNumber || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px]">Driver:</span>{' '}
              <strong className="text-slate-900">{driverName || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px]">Products:</span>{' '}
              <strong className="text-slate-900">
                {uniqueProducts.map((p) => p.code || p.name).join(' + ')}
              </strong>
            </div>
            {remarks && (
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9px]">Remarks:</span>{' '}
                <span className="italic text-slate-800">{remarks}</span>
              </div>
            )}
          </div>

          {/* Items Table: Larger Product Image in place of 'Type' column, nowrap sizes */}
          <div className="overflow-hidden rounded-lg border border-black flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-black">
                <tr>
                  <th className="p-1.5 w-7 text-center border-r border-black">#</th>
                  {/* Enlarged Product Photo & Info in place of removed 'Type' column */}
                  <th className="p-1.5 w-64 min-w-[210px] border-r border-black">Product</th>
                  <th className="p-1.5 border-r border-black">Part Name & Description</th>
                  <th className="p-1.5 w-40 min-w-[140px] whitespace-nowrap border-r border-black">Size</th>
                  <th className="p-1.5 w-16 text-center font-black border-r border-black">Qty</th>
                  <th className="p-1.5 w-20">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {palletItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-slate-400 italic text-[11px]">
                      No components loaded on this pallet.
                    </td>
                  </tr>
                ) : (
                  palletItems.map((it, idx) => {
                    const itemProd = resolveProductInfo(it);
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className={`${rowPaddingClass} text-center font-mono text-slate-500 border-r border-black`}>{idx + 1}</td>
                        {/* Enlarged image in place of removed 'Type' column */}
                        <td className={`${rowPaddingClass} border-r border-black`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md border border-black bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                              {itemProd.photo ? (
                                <img
                                  src={itemProd.photo}
                                  alt={itemProd.name}
                                  className="max-w-full max-h-full w-auto h-auto object-contain block m-auto"
                                />
                              ) : (
                                <Package size={22} className="text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[130px] text-xs" title={itemProd.name}>
                                {itemProd.code ? `${itemProd.code} ` : ''}{itemProd.name}
                              </span>
                              {itemProd.soNumber && (
                                <span className="text-[9.5px] font-mono font-bold text-slate-600 block mt-0.5">
                                  SO: {itemProd.soNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`${rowPaddingClass} font-bold text-slate-900 truncate max-w-[150px] border-r border-black`}>{it.partName}</td>
                        <td className={`${rowPaddingClass} font-mono font-semibold text-slate-900 whitespace-nowrap border-r border-black`}>{it.dimensions}</td>
                        <td className={`${rowPaddingClass} text-center font-mono font-black text-slate-900 bg-slate-50/80 border-r border-black`}>
                          {it.dispatchingNowQty} pcs
                        </td>
                        <td className={`${rowPaddingClass} text-slate-600 truncate max-w-[70px]`}>{it.remarks || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
