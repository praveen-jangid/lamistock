import React from 'react';
import { Truck, Plus, Search, FileText, Eye, Trash2, Cloud } from 'lucide-react';
import type { DeliveryChallan } from '../../../../types/challan';
import { isFirebaseReady } from '../../../../services/firebase';

interface ChallansListViewProps {
  filteredChallans: DeliveryChallan[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  onViewChallan: (challan: DeliveryChallan) => void;
  onDeleteChallan: (id: string, challanNumber: string) => void;
}

export const ChallansListView: React.FC<ChallansListViewProps> = ({
  filteredChallans,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onViewChallan,
  onDeleteChallan,
}) => {
  const isCloudConnected = isFirebaseReady();

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 m-0">
                Outward Delivery Challans
              </h2>
              {isCloudConnected ? (
                <span
                  title="All outward challans are synced with Firebase Firestore database"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <Cloud size={12} className="text-emerald-600" />
                  <span>Cloud Synced</span>
                </span>
              ) : (
                <span
                  title="Running offline in local storage"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <span>Local Only</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              All dispatched vouchers and component transfers from Unit 2 (Lamination) to Unit 1 (Assembly).
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-center"
          onClick={onCreateClick}
        >
          <Plus size={16} />
          <span>Create Outward Challan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search challan by number, product, driver, vehicle, or remarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* All Challans Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredChallans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText size={40} className="mx-auto text-slate-300" />
            <h4 className="text-base font-bold text-slate-800 m-0">No Outward Challans Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No delivery challans match your search criteria.'
                : 'No outward delivery challans have been created yet.'}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer mt-2"
              onClick={onCreateClick}
            >
              <Plus size={14} />
              <span>Create Your First Challan</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#dce4ec] text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 w-32">Challan No</th>
                  <th className="p-3 w-32">Date & Time</th>
                  <th className="p-3">Product / Order Ref</th>
                  <th className="p-3 w-40">Vehicle & Driver</th>
                  <th className="p-3 w-28 text-center">Pieces Sent</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 w-24 text-center">Status</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((ch, idx) => {
                  const totalPieces = ch.items.reduce((s, it) => s + it.dispatchingNowQty, 0);

                  return (
                    <tr key={ch.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-black text-slate-900">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900">
                          {ch.challanNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{ch.date}</div>
                        <span className="text-[10px] font-mono text-slate-400">{ch.time}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <div>{ch.orderTitle}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {ch.vehicleNumber || '—'}
                        </div>
                        <span className="text-[11px] text-slate-500">{ch.driverName || '—'}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-emerald-700">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {totalPieces} pcs
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs italic">
                        {ch.notes || '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {ch.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                            onClick={() => onViewChallan(ch)}
                            title="View & Print Voucher"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            onClick={() => onDeleteChallan(ch.id, ch.challanNumber)}
                            title="Delete Challan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
