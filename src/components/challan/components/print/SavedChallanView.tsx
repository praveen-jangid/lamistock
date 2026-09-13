import React, { useState } from 'react';
import type { DeliveryChallan, FactoryOrder } from '../../../../types/challan';
import { PalletSlipCard } from './PalletSlipCard';
import { getProductForOrder } from '../../utils/productHelpers';
import { getStoredProductsSync } from '../../../../services/product_db';
import { ArrowLeft, Scissors, FileText, Printer, Package } from 'lucide-react';

export interface SavedChallanViewProps {
  challan: DeliveryChallan;
  orders: FactoryOrder[];
  onClose: () => void;
}

export const SavedChallanView: React.FC<SavedChallanViewProps> = ({
  challan,
  orders,
  onClose
}) => {
  const products = getStoredProductsSync();

  const hasMultiplePallets =
    (challan.pallets && challan.pallets.length > 1) ||
    challan.items.some((it) => (it.palletNumber || 1) === 2);

  const [savedChallanPrintMode, setSavedChallanPrintMode] = useState<'split-pallets' | 'full-master'>(
    'split-pallets'
  );

  const handlePrint = () => {
    window.print();
  };

  // Unique orders in this saved challan
  const voucherOrderIds = challan.orderIds || (challan.orderId ? [challan.orderId] : []);
  const voucherOrders = orders.filter((o) => voucherOrderIds.includes(o.id));

  const vLamination = challan.items.filter((it) => it.category === 'LAMINATION');
  const vFrames = challan.items.filter((it) => it.category === 'FRAME');

  return (
    <div className="space-y-4">
      {/* Navigation & Print Actions Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs print:hidden flex-wrap">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          onClick={onClose}
        >
          <ArrowLeft size={14} />
          <span>Back to All Challans</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                savedChallanPrintMode === 'split-pallets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setSavedChallanPrintMode('split-pallets')}
            >
              <Scissors size={13} />
              <span>{hasMultiplePallets ? '✂ 2-Pallet Slip (Split A4)' : '✂ Half-A4 Slip (Top Half)'}</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                savedChallanPrintMode === 'full-master'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setSavedChallanPrintMode('full-master')}
            >
              <FileText size={13} />
              <span>Combined Master</span>
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            onClick={handlePrint}
          >
            <Printer size={14} />
            <span>Print This Challan</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      {savedChallanPrintMode === 'split-pallets' ? (
        /* A4 SPLIT-PAGE: PALLET SLIP(S) ON SINGLE A4 SHEET WITH CUT GUIDE */
        <div className="a4-split-page space-y-4 print:space-y-0" id="printable-voucher-content">
          {/* TOP HALF: PALLET 1 SLIP */}
          <PalletSlipCard
            palletNumber={1}
            totalPallets={challan.palletCount || (hasMultiplePallets ? 2 : 1)}
            palletName={challan.pallets?.[0]?.name || 'PALLET 1'}
            items={challan.items}
            challanNumber={challan.challanNumber}
            dispatchDate={challan.date}
            time={challan.time}
            vehicleNumber={challan.vehicleNumber}
            driverName={challan.driverName}
            remarks={challan.notes}
            orders={voucherOrders}
          />

          {hasMultiplePallets ? (
            <>
              {/* CENTER CUT GUIDE: DOTTED LINE IN HALF */}
              <div className="pallet-cut-guide my-2 border-t border-dotted border-black w-full" />

              {/* BOTTOM HALF: PALLET 2 SLIP */}
              <PalletSlipCard
                palletNumber={2}
                totalPallets={challan.palletCount || 2}
                palletName={challan.pallets?.[1]?.name || 'PALLET 2'}
                items={challan.items}
                challanNumber={challan.challanNumber}
                dispatchDate={challan.date}
                time={challan.time}
                vehicleNumber={challan.vehicleNumber}
                driverName={challan.driverName}
                remarks={challan.notes}
                orders={voucherOrders}
              />
            </>
          ) : (
            <>
              {/* CENTER CUT GUIDE: DOTTED LINE IN HALF (print only) */}
              <div className="pallet-cut-guide my-2 border-t border-dotted border-black w-full print:block hidden" />

              {/* BOTTOM HALF: EMPTY SPACE (print only) */}
              <div className="pallet-slip-empty hidden print:block" />

              {/* Screen preview card showing bottom half is empty */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-xs bg-slate-50/50 print:hidden space-y-1">
                <Scissors size={20} className="mx-auto text-slate-400 mb-1" />
                <div className="font-bold text-slate-700">Half-A4 Voucher Format (Single Pallet)</div>
                <p className="text-[11px] text-slate-500 m-0">
                  The slip voucher above occupies the top half of the A4 page. The bottom half is kept empty so you can cut the printed A4 sheet in half.
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Clean Printable Voucher */
        <div
          className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white space-y-5 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-4"
          id="printable-voucher-content"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 m-0 uppercase">
                Factory Outward Delivery Challan
              </h1>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                Internal Wood Processing Transfer Document
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-mono font-black text-sm sm:text-base text-slate-900">
                Challan No: {challan.challanNumber}
              </div>
              <div className="text-slate-600 font-semibold mt-0.5">Date: {challan.date}</div>
              <div className="text-slate-400 font-mono text-[11px]">{challan.time}</div>
            </div>
          </div>

          {/* Products & Transport Summary Box */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {voucherOrders.length > 0 ? (
                voucherOrders.map((vOrd) => {
                  const vProd = getProductForOrder(vOrd, products);
                  const vImg = vOrd.productImage || vProd?.photoUrl || '';
                  return (
                    <div key={vOrd.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                        {vImg ? (
                          <img src={vImg} alt={vOrd.title} className="max-w-full max-h-full w-auto h-auto object-contain block m-auto" />
                        ) : (
                          <Package size={22} className="text-slate-300" />
                        )}
                      </div>
                      <div className="text-xs space-y-0.5 flex-1 min-w-0">
                        <div className="font-black text-slate-900 truncate">
                          {vOrd.productCode && <span className="mr-1 text-slate-700">{vOrd.productCode}</span>}
                          {vOrd.productName || vOrd.title}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          SO: <strong className="font-mono text-slate-900">{vOrd.salesOrderNo || vOrd.orderNumber}</strong> • Qty: <strong>{vOrd.quantity || '—'} units</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Customer: <strong className="text-slate-800">{vOrd.customerName || 'Standard'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="font-bold text-xs text-slate-900">{challan.orderTitle}</div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-700 flex-wrap gap-2">
              <div>
                <span className="text-slate-500 font-semibold">Vehicle: </span>
                <strong className="font-mono text-slate-900 font-bold">{challan.vehicleNumber || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Driver: </span>
                <strong className="text-slate-900">{challan.driverName || '—'}</strong>
              </div>
              {challan.notes && (
                <div>
                  <span className="text-slate-500 font-semibold">Remarks: </span>
                  <span className="text-slate-900 italic">{challan.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table 1: Lamination */}
          {vLamination.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0">Lamination</h3>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {vLamination.length} sizes •{' '}
                  {vLamination.reduce((s, it) => s + it.dispatchingNowQty, 0)} panels
                </span>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
                    <th className="p-2 w-36 border-r border-slate-300">Product / Order</th>
                    <th className="p-2 w-32 border-r border-slate-300">Remarks</th>
                    <th className="p-2 border-r border-slate-300">Component Description</th>
                    <th className="p-2 w-44 border-r border-slate-300">Size</th>
                    <th className="p-2 w-20 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vLamination.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2 text-center text-slate-700 font-mono border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-200 text-[11px]">
                        {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200">{it.remarks || '—'}</td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{it.partName}</td>
                      <td className="p-2 font-mono text-slate-800 border-r border-slate-200">{it.dimensions}</td>
                      <td className="p-2 font-mono font-bold text-center text-slate-900">
                        {it.dispatchingNowQty} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 2: Frames */}
          {vFrames.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0">Frames</h3>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {vFrames.length} items •{' '}
                  {vFrames.reduce((s, it) => s + it.dispatchingNowQty, 0)} pcs
                </span>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
                    <th className="p-2 w-36 border-r border-slate-300">Product / Order</th>
                    <th className="p-2 w-32 border-r border-slate-300">Remarks</th>
                    <th className="p-2 border-r border-slate-300">Component Description</th>
                    <th className="p-2 w-44 border-r border-slate-300">Size</th>
                    <th className="p-2 w-20 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vFrames.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2 text-center text-slate-700 font-mono border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-200 text-[11px]">
                        {it.productCode ? `${it.productCode} — ` : ''}{it.productName || it.orderTitle}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200">{it.remarks || '—'}</td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{it.partName}</td>
                      <td className="p-2 font-mono text-slate-800 border-r border-slate-200">{it.dimensions}</td>
                      <td className="p-2 font-mono font-bold text-center text-slate-900">
                        {it.dispatchingNowQty} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Dispatched */}
          <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900">
            <span>TOTAL PIECES DISPATCHED:</span>
            <span className="font-mono text-sm">
              {challan.items.reduce((sum, it) => sum + it.dispatchingNowQty, 0)} pcs
            </span>
          </div>

          {/* Signature Row */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 mb-2 h-8" />
              <span className="text-slate-600 font-bold">Prepared By (Unit 2)</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-8" />
              <span className="text-slate-600 font-bold">Driver / Handover</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-8" />
              <span className="text-slate-600 font-bold">Received at Unit 1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
