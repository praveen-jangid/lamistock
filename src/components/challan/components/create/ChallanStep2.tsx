import React from 'react';
import type { PalletConfig, ChallanComponentItem, FactoryOrder } from '../../../../types/challan';
import { PalletSlipCard } from '../print/PalletSlipCard';
import { getProductForOrder } from '../../utils/productHelpers';
import { getStoredProductsSync } from '../../../../services/product_db';
import {
  CheckCircle2,
  Scissors,
  FileText,
  Printer,
  PackageCheck,
  Package,
  ArrowLeft
} from 'lucide-react';

export interface ChallanStep2Props {
  pallets: PalletConfig[];
  printLayoutMode: 'split-pallets' | 'full-master';
  onSetPrintLayoutMode: (mode: 'split-pallets' | 'full-master') => void;
  dispatchedItems: ChallanComponentItem[];
  laminationDispatched: ChallanComponentItem[];
  framesDispatched: ChallanComponentItem[];
  challanNumber: string;
  dispatchDate: string;
  vehicleNumber: string;
  driverName: string;
  remarks: string;
  selectedOrders: FactoryOrder[];
  getOrderDisplayName: (order: FactoryOrder) => string;
  onBackToStep1: () => void;
  onPrint: () => void;
  onSaveChallan: () => void;
}

export const ChallanStep2: React.FC<ChallanStep2Props> = ({
  pallets,
  printLayoutMode,
  onSetPrintLayoutMode,
  dispatchedItems,
  laminationDispatched,
  framesDispatched,
  challanNumber,
  dispatchDate,
  vehicleNumber,
  driverName,
  remarks,
  selectedOrders,
  getOrderDisplayName,
  onBackToStep1,
  onPrint,
  onSaveChallan
}) => {
  const products = getStoredProductsSync();

  return (
    <div className="space-y-5">
      {/* Action Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Print Format Ready: You can print now or save for records.</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                printLayoutMode === 'split-pallets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onSetPrintLayoutMode('split-pallets')}
            >
              <Scissors size={13} />
              <span>{pallets.length > 1 ? '✂ 2-Pallet Slip (Split A4)' : '✂ Half-A4 Slip (Top Half)'}</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                printLayoutMode === 'full-master'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onSetPrintLayoutMode('full-master')}
            >
              <FileText size={13} />
              <span>Combined Master</span>
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            onClick={onPrint}
          >
            <Printer size={14} />
            <span>Print Voucher</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            onClick={onSaveChallan}
          >
            <PackageCheck size={14} />
            <span>Save & Mark Dispatched</span>
          </button>
        </div>
      </div>

      {/* Print Voucher Container */}
      {printLayoutMode === 'split-pallets' ? (
        /* A4 SPLIT-PAGE: PALLET SLIPS ON SINGLE A4 SHEET WITH CUT GUIDE */
        <div className="a4-split-page space-y-4 print:space-y-0" id="printable-voucher-content">
          {/* TOP HALF: PALLET 1 SLIP */}
          <PalletSlipCard
            palletNumber={1}
            totalPallets={pallets.length}
            palletName={pallets[0]?.name || 'PALLET 1'}
            items={dispatchedItems}
            challanNumber={challanNumber}
            dispatchDate={dispatchDate}
            time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            vehicleNumber={vehicleNumber}
            driverName={driverName}
            remarks={remarks}
            orders={selectedOrders}
          />

          {pallets.length > 1 ? (
            <>
              {/* CENTER CUT GUIDE: DOTTED LINE IN HALF */}
              <div className="pallet-cut-guide my-2 border-t border-dotted border-black w-full" />

              {/* BOTTOM HALF: PALLET 2 SLIP */}
              <PalletSlipCard
                palletNumber={2}
                totalPallets={pallets.length}
                palletName={pallets[1]?.name || 'PALLET 2'}
                items={dispatchedItems}
                challanNumber={challanNumber}
                dispatchDate={dispatchDate}
                time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                vehicleNumber={vehicleNumber}
                driverName={driverName}
                remarks={remarks}
                orders={selectedOrders}
              />
            </>
          ) : (
            <>
              {/* CENTER CUT GUIDE: DOTTED LINE IN HALF (printed so user can cut sheet in half) */}
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
        /* Clean Printable Master Voucher */
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
                Challan No: {challanNumber}
              </div>
              <div className="text-slate-600 font-semibold mt-0.5">Date: {dispatchDate}</div>
              <div className="text-slate-400 font-mono text-[11px]">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Order & Product Summary Box (Handles single or multiple products) */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedOrders.map((ord) => {
                const prod = getProductForOrder(ord, products);
                const img = ord.productImage || prod?.photoUrl || '';
                return (
                  <div key={ord.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                      {img ? (
                        <img src={img} alt={ord.title} className="max-w-full max-h-full w-auto h-auto object-contain block m-auto" />
                      ) : (
                        <Package size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="text-xs space-y-0.5 flex-1 min-w-0">
                      <div className="font-black text-slate-900 truncate">
                        {getOrderDisplayName(ord)}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        SO: <strong className="font-mono text-slate-900">{ord.salesOrderNo || ord.orderNumber}</strong> • Qty: <strong>{ord.quantity || '—'} units</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Customer: <strong className="text-slate-800">{ord.customerName || 'Standard'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-700 flex-wrap gap-2">
              <div>
                <span className="text-slate-500 font-semibold">Vehicle: </span>
                <strong className="font-mono text-slate-900 font-bold">{vehicleNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Driver: </span>
                <strong className="text-slate-900">{driverName}</strong>
              </div>
              {remarks && (
                <div>
                  <span className="text-slate-500 font-semibold">Remarks: </span>
                  <span className="text-slate-900 italic">{remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table 1: Lamination */}
          {laminationDispatched.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0">
                  Lamination
                </h3>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {laminationDispatched.length} sizes •{' '}
                  {laminationDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} panels
                </span>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
                    <th className="p-2 w-44 border-r border-slate-300">Product</th>
                    <th className="p-2 w-32 border-r border-slate-300">Remarks</th>
                    <th className="p-2 border-r border-slate-300">Component Description</th>
                    <th className="p-2 w-44 border-r border-slate-300">Size</th>
                    <th className="p-2 w-20 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {laminationDispatched.map((it, idx) => (
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
          {framesDispatched.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0">
                  Frames
                </h3>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {framesDispatched.length} items •{' '}
                  {framesDispatched.reduce((s, it) => s + it.dispatchingNowQty, 0)} pcs
                </span>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
                    <th className="p-2 w-44 border-r border-slate-300">Product</th>
                    <th className="p-2 w-32 border-r border-slate-300">Remarks</th>
                    <th className="p-2 border-r border-slate-300">Component Description</th>
                    <th className="p-2 w-44 border-r border-slate-300">Size</th>
                    <th className="p-2 w-20 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {framesDispatched.map((it, idx) => (
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
              {dispatchedItems.reduce((sum, it) => sum + it.dispatchingNowQty, 0)} pcs
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

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 print:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          onClick={onBackToStep1}
        >
          <ArrowLeft size={14} />
          <span>Back to Transport & Components</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            onClick={onPrint}
          >
            <Printer size={14} />
            <span>Print Voucher</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            onClick={onSaveChallan}
          >
            <CheckCircle2 size={14} />
            <span>Save & Mark Dispatched</span>
          </button>
        </div>
      </div>
    </div>
  );
};
