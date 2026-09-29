import React from 'react';
import type { ChallanComponentItem, FactoryOrder } from '../../../../types/challan';
import { getStoredProductsSync } from '../../../../services/product_db';
import { calculatePalletSlipAllocations } from '../../utils/palletHeightCalculator';
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
  allocatedHeightMm?: number;
  density?: 'normal' | 'compact' | 'ultra-compact';
}

export const PalletSlipCard: React.FC<PalletSlipCardProps> = ({
  palletNumber,
  totalPallets,
  palletName,
  items,
  challanNumber,
  dispatchDate,
  time,
  vehicleNumber,
  driverName,
  remarks,
  orders = [],
  allocatedHeightMm,
  density
}) => {
  const products = getStoredProductsSync();
  const palletItems = items.filter((it) => (it.palletNumber || 1) === palletNumber);
  const otherPalletItems = items.filter((it) => (it.palletNumber || 1) !== palletNumber);
  const hasMultiple = (totalPallets !== undefined ? totalPallets > 1 : false) || items.some((it) => (it.palletNumber || 1) === 2);

  // Compute dynamic height and density if not passed explicitly
  const defaultAlloc = calculatePalletSlipAllocations(
    palletNumber === 1 ? palletItems.length : otherPalletItems.length,
    palletNumber === 1 ? otherPalletItems.length : palletItems.length,
    hasMultiple
  );
  const myAlloc = palletNumber === 1 ? defaultAlloc.p1 : defaultAlloc.p2;
  const effectiveHeightMm = allocatedHeightMm || myAlloc.heightMm;
  const effectiveDensity = density || myAlloc.density;

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

  // Dynamic row and cell sizing based on effectiveDensity
  const rowPaddingClass =
    effectiveDensity === 'ultra-compact'
      ? 'py-0.5 px-1 text-[8.5px]'
      : effectiveDensity === 'compact'
      ? 'py-1 px-1.5 text-[9.5px]'
      : palletItems.length <= 3
      ? 'py-2 px-2 text-xs'
      : 'py-1.5 px-2 text-[11px]';

  const thPaddingClass =
    effectiveDensity === 'ultra-compact'
      ? 'py-0.5 px-0.5 text-[7.5px]'
      : effectiveDensity === 'compact'
      ? 'py-0.5 px-1 text-[8px]'
      : 'p-1 text-[8.5px]';

  const sizeTextClass =
    effectiveDensity === 'ultra-compact'
      ? 'text-[7.5px]'
      : effectiveDensity === 'compact'
      ? 'text-[8.5px]'
      : 'text-[9.5px]';

  const isInlineSize = effectiveDensity !== 'normal';

  return (
    <div
      className={`pallet-slip-half border border-black rounded-xl bg-white flex flex-col justify-start text-slate-900 overflow-hidden ${
        effectiveDensity === 'ultra-compact'
          ? 'p-2 space-y-1'
          : effectiveDensity === 'compact'
          ? 'p-2.5 space-y-1.5'
          : 'p-3 sm:p-3.5 space-y-2'
      }`}
      style={{
        '--slip-height': `${effectiveHeightMm}mm`,
        '--slip-padding':
          effectiveDensity === 'ultra-compact'
            ? '1.5mm 2.5mm'
            : effectiveDensity === 'compact'
            ? '2mm 3mm'
            : '3mm 3.5mm',
        flex: `${effectiveHeightMm} 1 0%`,
      } as React.CSSProperties}
    >
      {/* Top Header Strip: Clean title + Challan No & Date */}
      <div className={`flex items-start justify-between border-b-2 border-black flex-shrink-0 ${
        effectiveDensity === 'ultra-compact' ? 'pb-0.5' : 'pb-1'
      }`}>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className={`${
              effectiveDensity === 'ultra-compact' ? 'text-xs' : 'text-sm sm:text-base'
            } font-black tracking-tight text-slate-900 m-0 uppercase`}>
              Factory Outward Delivery Challan
            </h2>
            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono font-bold text-[8.5px] sm:text-[9px] uppercase tracking-wide">
              {palletName || `PALLET ${palletNumber}`}
            </span>
          </div>
        </div>
        <div className="text-right text-[11px]">
          <div className={`font-mono font-black text-slate-900 ${
            effectiveDensity === 'ultra-compact' ? 'text-[10px]' : ''
          }`}>
            {challanNumber}
          </div>
          <div className="text-slate-600 text-[9.5px]">
            {dispatchDate} {time && `• ${time}`}
          </div>
        </div>
      </div>

      {isSingleProduct ? (
        /* =====================================================================
           CASE A: SINGLE PRODUCT ON PALLET
           ===================================================================== */
        <>
          <div className={`bg-slate-50 border border-black rounded-lg flex items-center flex-shrink-0 ${
            effectiveDensity === 'ultra-compact'
              ? 'p-1.5 gap-2'
              : effectiveDensity === 'compact'
              ? 'p-2 gap-2.5'
              : 'p-2.5 gap-3.5'
          }`}>
            {/* Product Photo */}
            <div className={`${
              effectiveDensity === 'ultra-compact'
                ? 'w-10 h-10 sm:w-12 sm:h-12'
                : effectiveDensity === 'compact'
                ? 'w-14 h-14 sm:w-16 sm:h-16'
                : 'w-20 h-20 sm:w-24 sm:h-24'
            } rounded-lg border border-black bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-2xs`}>
              {singleProd?.photo ? (
                <img
                  src={singleProd.photo}
                  alt={singleProd.name}
                  className="max-w-full max-h-full w-auto h-auto object-contain block m-auto"
                />
              ) : (
                <Package size={effectiveDensity === 'ultra-compact' ? 18 : effectiveDensity === 'compact' ? 24 : 32} className="text-slate-300" />
              )}
            </div>

            {/* Product & Transport Details Grid */}
            <div className="flex-1 min-w-0 text-xs space-y-0.5">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className={`font-black text-slate-900 break-words leading-tight ${
                  effectiveDensity === 'ultra-compact'
                    ? 'text-xs'
                    : effectiveDensity === 'compact'
                    ? 'text-xs sm:text-sm'
                    : 'text-sm sm:text-base'
                }`}>
                  {singleProd?.code ? `${singleProd.code} — ` : ''}{singleProd?.name || 'Standard Product'}
                </div>
                {singleProd?.quantity && (
                  <span className={`px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-black font-mono font-bold leading-tight ${
                    effectiveDensity === 'ultra-compact' ? 'text-[9px]' : 'text-[11px]'
                  }`}>
                    Order Qty: {singleProd.quantity} units
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-0.5 text-slate-700 border-t border-black pt-1 ${
                effectiveDensity === 'ultra-compact' ? 'text-[9px]' : effectiveDensity === 'compact' ? 'text-[10px]' : 'text-[11px]'
              }`}>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[8.5px]">Customer:</span>{' '}
                  <strong className="text-slate-900 break-words block sm:inline">{singleProd?.customer || 'Standard'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[8.5px]">SO No:</span>{' '}
                  <strong className="font-mono text-slate-900">{singleProd?.soNumber || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[8.5px]">Vehicle:</span>{' '}
                  <strong className="font-mono text-slate-900">{vehicleNumber || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[8.5px]">Driver:</span>{' '}
                  <strong className="text-slate-900">{driverName || '—'}</strong>
                </div>
              </div>

              {remarks && (
                <div className="text-[9.5px] text-slate-600 pt-0.5 border-t border-black break-words leading-tight">
                  <span className="font-bold text-slate-500 uppercase text-[8.5px]">Remarks:</span>{' '}
                  <span className="italic text-slate-800">{remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table: Crisp 1px black borders, table-fixed 100% width */}
          <div className="overflow-hidden rounded-lg border border-black flex-1 w-full max-w-full min-h-0">
            <table className="w-full table-fixed text-left border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider border-b border-black">
                <tr>
                  <th className={`${thPaddingClass} w-[4%] text-center border-r border-black`}>#</th>
                  <th className={`${thPaddingClass} w-[52%] border-r border-black`}>Part Name & Size</th>
                  <th className={`${thPaddingClass} w-[11.5%] text-center font-bold border-r border-black`}>
                    <div className="leading-tight">Ordered<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[11.5%] text-center font-black border-r border-black`}>
                    <div className="leading-tight">Sent<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[11.5%] text-center font-bold border-r border-black`}>
                    <div className="leading-tight">Pending<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[9.5%] text-center`}>Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {palletItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-slate-400 italic text-[10px]">
                      No components loaded on this pallet.
                    </td>
                  </tr>
                ) : (
                  palletItems.map((it, idx) => {
                    const isExtra = it.totalOrderQty > 0 && it.dispatchingNowQty > it.totalOrderQty;
                    const extraDiff = it.dispatchingNowQty - it.totalOrderQty;
                    const isSplit = !!it.isSplitPart && !!it.splitDetails;
                    const totalSentThisChallan = isSplit && it.splitDetails ? it.splitDetails.total : it.dispatchingNowQty;
                    const alreadySent = it.alreadyDispatchedQty || 0;
                    const pendingQty = Math.max(0, (it.totalOrderQty || 0) - (alreadySent + totalSentThisChallan));

                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className={`${rowPaddingClass} text-center font-mono text-slate-500 border-r border-black`}>{idx + 1}</td>
                        <td className={`${rowPaddingClass} border-r border-black`}>
                          {isInlineSize ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap leading-tight">
                              <span className="font-bold text-slate-900">{it.partName}</span>
                              {it.dimensions && (
                                <span className={`font-mono font-medium text-slate-600 ${sizeTextClass}`}>
                                  ({it.dimensions})
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="font-bold text-slate-900 break-words leading-tight">
                                {it.partName}
                              </div>
                              {it.dimensions && (
                                <div className={`font-mono font-semibold text-slate-600 ${sizeTextClass} mt-0.5 break-words leading-tight`}>
                                  Size: {it.dimensions}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-bold text-slate-700 border-r border-black`}>
                          {it.totalOrderQty !== undefined ? `${it.totalOrderQty} pcs` : '—'}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-black text-slate-900 bg-slate-50/80 border-r border-black`}>
                          <div>{it.dispatchingNowQty} pcs</div>
                          {isExtra && (
                            <span className="block text-[7.5px] font-extrabold text-emerald-800 print:text-black leading-none mt-0.5">
                              (+{extraDiff} extra)
                            </span>
                          )}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-bold text-slate-700 border-r border-black`}>
                          {it.totalOrderQty !== undefined ? `${pendingQty} pcs` : '—'}
                        </td>
                        <td className={`${rowPaddingClass} text-slate-600 break-words leading-tight`}>{it.remarks || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* =====================================================================
           CASE B: 2 OR MORE PRODUCTS ON PALLET
           ===================================================================== */
        <>
          <div className={`bg-slate-50 border border-black rounded-lg flex items-center justify-between text-slate-700 flex-wrap gap-1.5 flex-shrink-0 ${
            effectiveDensity === 'ultra-compact'
              ? 'p-1 text-[9px]'
              : effectiveDensity === 'compact'
              ? 'p-1.5 text-[9.5px]'
              : 'p-1.5 text-[10.5px]'
          }`}>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8.5px]">Vehicle:</span>{' '}
              <strong className="font-mono text-slate-900">{vehicleNumber || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8.5px]">Driver:</span>{' '}
              <strong className="text-slate-900">{driverName || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8.5px]">Products:</span>{' '}
              <strong className="text-slate-900">
                {uniqueProducts.map((p) => p.code || p.name).join(' + ')}
              </strong>
            </div>
            {remarks && (
              <div>
                <span className="text-slate-500 font-bold uppercase text-[8.5px]">Remarks:</span>{' '}
                <span className="italic text-slate-800">{remarks}</span>
              </div>
            )}
          </div>

          {/* Items Table: Crisp 1px black borders, table-fixed 100% width */}
          <div className="overflow-hidden rounded-lg border border-black flex-1 w-full max-w-full min-h-0">
            <table className="w-full table-fixed text-left border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider border-b border-black">
                <tr>
                  <th className={`${thPaddingClass} w-[4%] text-center border-r border-black`}>#</th>
                  <th className={`${thPaddingClass} w-[26%] border-r border-black`}>Product</th>
                  <th className={`${thPaddingClass} w-[32%] border-r border-black`}>Part Name & Size</th>
                  <th className={`${thPaddingClass} w-[11%] text-center font-bold border-r border-black`}>
                    <div className="leading-tight">Ordered<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[11%] text-center font-black border-r border-black`}>
                    <div className="leading-tight">Sent<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[11%] text-center font-bold border-r border-black`}>
                    <div className="leading-tight">Pending<br />Qty</div>
                  </th>
                  <th className={`${thPaddingClass} w-[5%] text-center`}>Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {palletItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-2 text-center text-slate-400 italic text-[10px]">
                      No components loaded on this pallet.
                    </td>
                  </tr>
                ) : (
                  palletItems.map((it, idx) => {
                    const itemProd = resolveProductInfo(it);
                    const isExtra = it.totalOrderQty > 0 && it.dispatchingNowQty > it.totalOrderQty;
                    const extraDiff = it.dispatchingNowQty - it.totalOrderQty;
                    const isSplit = !!it.isSplitPart && !!it.splitDetails;
                    const totalSentThisChallan = isSplit && it.splitDetails ? it.splitDetails.total : it.dispatchingNowQty;
                    const alreadySent = it.alreadyDispatchedQty || 0;
                    const pendingQty = Math.max(0, (it.totalOrderQty || 0) - (alreadySent + totalSentThisChallan));

                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className={`${rowPaddingClass} text-center font-mono text-slate-500 border-r border-black`}>{idx + 1}</td>
                        {/* Compact product image and details */}
                        <td className={`${rowPaddingClass} border-r border-black`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`${
                              effectiveDensity === 'ultra-compact'
                                ? 'w-6 h-6 sm:w-7 sm:h-7'
                                : effectiveDensity === 'compact'
                                ? 'w-8 h-8 sm:w-9 sm:h-9'
                                : 'w-9 h-9 sm:w-10 sm:h-10'
                            } rounded border border-black bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-2xs`}>
                              {itemProd.photo ? (
                                <img
                                  src={itemProd.photo}
                                  alt={itemProd.name}
                                  className="max-w-full max-h-full w-auto h-auto object-contain block m-auto"
                                />
                              ) : (
                                <Package size={effectiveDensity === 'ultra-compact' ? 12 : 16} className="text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <span className={`font-extrabold text-slate-900 block break-words ${
                                effectiveDensity === 'ultra-compact' ? 'text-[9px]' : 'text-[10.5px]'
                              }`} title={itemProd.name}>
                                {itemProd.code ? `${itemProd.code} ` : ''}{itemProd.name}
                              </span>
                              {itemProd.soNumber && (
                                <span className={`font-mono font-bold text-slate-600 block mt-0.5 break-words ${
                                  effectiveDensity === 'ultra-compact' ? 'text-[7.5px]' : 'text-[8.5px]'
                                }`}>
                                  SO: {itemProd.soNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`${rowPaddingClass} border-r border-black`}>
                          {isInlineSize ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap leading-tight">
                              <span className="font-bold text-slate-900">{it.partName}</span>
                              {it.dimensions && (
                                <span className={`font-mono font-medium text-slate-600 ${sizeTextClass}`}>
                                  ({it.dimensions})
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="font-bold text-slate-900 break-words leading-tight">
                                {it.partName}
                              </div>
                              {it.dimensions && (
                                <div className={`font-mono font-semibold text-slate-600 ${sizeTextClass} mt-0.5 break-words leading-tight`}>
                                  Size: {it.dimensions}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-bold text-slate-700 border-r border-black`}>
                          {it.totalOrderQty !== undefined ? `${it.totalOrderQty} pcs` : '—'}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-black text-slate-900 bg-slate-50/80 border-r border-black`}>
                          <div>{it.dispatchingNowQty} pcs</div>
                          {isExtra && (
                            <span className="block text-[7.5px] font-extrabold text-emerald-800 print:text-black leading-none mt-0.5">
                              (+{extraDiff} extra)
                            </span>
                          )}
                        </td>
                        <td className={`${rowPaddingClass} text-center font-mono font-bold text-slate-700 border-r border-black`}>
                          {it.totalOrderQty !== undefined ? `${pendingQty} pcs` : '—'}
                        </td>
                        <td className={`${rowPaddingClass} text-slate-600 break-words leading-tight`}>{it.remarks || '—'}</td>
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
