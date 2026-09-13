import React from 'react';
import { Layers, Truck } from 'lucide-react';
import type { FactoryOrder } from '../../../../types/challan';
import { buildMultiOrderChallanItems } from '../../../../services/challan_db';

interface FulfillmentTrackerViewProps {
  orders: FactoryOrder[];
}

export const FulfillmentTrackerView: React.FC<FulfillmentTrackerViewProps> = ({ orders }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 m-0">Unit 1 Assembly Fulfillment Tracker</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-0">
          Track how many components have already reached Unit 1 vs. what is still pending in Unit 2.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((ord) => {
          const allItems = buildMultiOrderChallanItems([ord]);
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

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>

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
            </div>
          );
        })}
      </div>
    </div>
  );
};
