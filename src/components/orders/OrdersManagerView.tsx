import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedOrders } from '../../services/challanDb';
import {
  FileSpreadsheet,
  Plus,
  Truck,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface OrdersManagerViewProps {
  onOpenBulkMatcher: () => void;
  onCreateChallanForOrder?: (orderId: string) => void;
}

export const OrdersManagerView: React.FC<OrdersManagerViewProps> = ({
  onOpenBulkMatcher,
  onCreateChallanForOrder
}) => {
  const navigate = useNavigate();
  const orders = getSavedOrders();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 flex-shrink-0">
            <FileSpreadsheet size={24} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 m-0">
              Production Orders & Cutting Lists
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage furniture orders uploaded via Excel, check stock matches, and dispatch panels to Unit 1.
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            onClick={onOpenBulkMatcher}
          >
            <Plus size={16} />
            <span>Upload New Excel Order (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {orders.map((ord) => {
          const totalLamPcs = ord.laminationItems.reduce((s, it) => s + it.quantityNeeded, 0);
          const totalFrmPcs = ord.frameItems.reduce((s, it) => s + it.quantity, 0);

          return (
            <div key={ord.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-bold text-xs">
                    {ord.orderNumber}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 m-0">{ord.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Calendar size={13} /> {ord.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                    <CheckCircle2 size={13} /> In Production
                  </span>
                </div>
              </div>

              {ord.notes && <p className="text-xs text-slate-500 italic m-0">📝 {ord.notes}</p>}

              {/* Order Contents Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Layers size={15} className="text-emerald-600" />
                    <span>Lamination Panels:</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-slate-900">{totalLamPcs} pcs</span>
                    <span className="text-xs text-slate-500">across {ord.laminationItems.length} panel sizes</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Truck size={15} className="text-amber-500" />
                    <span>Frame Components:</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-slate-900">{totalFrmPcs} pcs</span>
                    <span className="text-xs text-slate-500">across {ord.frameItems.length} frame parts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                  onClick={onOpenBulkMatcher}
                  title="Check what panels are in Firestore stock to avoid making duplicates"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Check Extra Stock in Cloud</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  onClick={() => {
                    if (onCreateChallanForOrder) onCreateChallanForOrder(ord.id);
                    navigate(`/challans/new?orderId=${ord.id}`);
                  }}
                >
                  <Truck size={14} />
                  <span>Create Outward Challan for Unit 1</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
