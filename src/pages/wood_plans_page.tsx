import React, { useState } from 'react';
import type { Product } from '../types/product';
import {
  Layers,
  UploadCloud,
  Download,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Package
} from 'lucide-react';
import { downloadWoodPlanTemplateExcel } from '../utils/wood_plan_parser';

interface WoodPlansPageProps {
  products: Product[];
  onViewWoodPlan: (product: Product) => void;
  onUploadExcelForProduct: (productId?: string) => void;
}

export const WoodPlansPage: React.FC<WoodPlansPageProps> = ({
  products,
  onViewWoodPlan,
  onUploadExcelForProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      (p.woodPlan &&
        (p.woodPlan.laminationItems.some((it) => it.partName.toLowerCase().includes(q)) ||
          p.woodPlan.frameItems.some((it) => it.partName.toLowerCase().includes(q))))
    );
  });

  const withPlanCount = products.filter((p) => !!p.woodPlan).length;
  const totalLaminationPanelsCount = products.reduce(
    (sum, p) => sum + (p.woodPlan?.laminationItems?.length || 0),
    0
  );
  const totalFramePartsCount = products.reduce(
    (sum, p) => sum + (p.woodPlan?.frameItems?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Layers size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 m-0">
                Wood Plans & Cutting Blueprints
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {withPlanCount} Active Plans
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Extract cutting lists from factory Excel sheets. Once saved, lamination and frame sizes are permanently
              stored and ready for instant production orders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            onClick={downloadWoodPlanTemplateExcel}
            title="Download standard Excel template"
          >
            <Download size={15} />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            onClick={() => onUploadExcelForProduct()}
          >
            <UploadCloud size={15} />
            <span>Upload New Excel Plan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 flex-shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Configured Products</div>
            <div className="text-lg font-black text-slate-900">
              {withPlanCount} <span className="text-xs font-normal text-slate-400">/ {products.length} products</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Lamination Sizes In Catalog</div>
            <div className="text-lg font-black text-emerald-800 font-mono">
              {totalLaminationPanelsCount} panel sizes
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Frame Parts In Catalog</div>
            <div className="text-lg font-black text-amber-800 font-mono">
              {totalFramePartsCount} frame parts
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, code, customer, or individual part name..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {filtered.map((product) => {
          const hasPlan = !!product.woodPlan;
          const lam = product.woodPlan?.laminationItems || [];
          const frm = product.woodPlan?.frameItems || [];

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0">
                    {product.photoUrl ? (
                      <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={22} className="text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                        {product.code}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 m-0">
                        {product.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        for <strong>{product.customerName}</strong>
                      </span>
                    </div>
                    {hasPlan && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Extracted from: <strong>{product.woodPlan!.sourceFileName || 'Manual Entry'}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasPlan ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Saved & Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                      <AlertCircle size={14} className="text-amber-600" />
                      <span>Pending Excel Upload</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Items Breakdown or Empty State */}
              {hasPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Lamination list preview */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <Layers size={14} />
                        <span>Lamination Panels ({lam.length})</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {lam.reduce((s, it) => s + it.qtyPerUnit, 0)} total pcs / unit
                      </span>
                    </div>

                    <div className="space-y-1">
                      {lam.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200/60"
                        >
                          <span className="font-semibold text-slate-800 truncate mr-2">
                            {it.partName}
                          </span>
                          <span className="font-mono text-slate-600 text-[11px] whitespace-nowrap">
                            {it.length}″ × {it.width}″ ({it.qtyPerUnit}x)
                          </span>
                        </div>
                      ))}
                      {lam.length > 4 && (
                        <div className="text-[11px] text-slate-400 text-center pt-0.5">
                          + {lam.length - 4} more lamination sizes...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frame list preview */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <Package size={14} />
                        <span>Frame Components ({frm.length})</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {frm.reduce((s, it) => s + it.qtyPerUnit, 0)} total pcs / unit
                      </span>
                    </div>

                    <div className="space-y-1">
                      {frm.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200/60"
                        >
                          <span className="font-semibold text-slate-800 truncate mr-2">
                            {it.partName}
                          </span>
                          <span className="font-mono text-slate-600 text-[11px] whitespace-nowrap">
                            {it.length}″ × {it.width}″ ({it.qtyPerUnit}x)
                          </span>
                        </div>
                      ))}
                      {frm.length > 4 && (
                        <div className="text-[11px] text-slate-400 text-center pt-0.5">
                          + {frm.length - 4} more frame parts...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-xs text-amber-800 flex items-center justify-between gap-3 flex-wrap">
                  <span>No wood cutting plan uploaded yet for this product.</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    onClick={() => onUploadExcelForProduct(product.id)}
                  >
                    <UploadCloud size={14} />
                    <span>Upload Excel Now</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {hasPlan ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                      onClick={() => onUploadExcelForProduct(product.id)}
                    >
                      <UploadCloud size={13} className="text-emerald-600" />
                      <span>Re-upload Excel</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      onClick={() => onViewWoodPlan(product)}
                    >
                      <Eye size={13} />
                      <span>View Full Wood Plan</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    onClick={() => onUploadExcelForProduct(product.id)}
                  >
                    <UploadCloud size={14} />
                    <span>Upload Excel Cutting List</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
