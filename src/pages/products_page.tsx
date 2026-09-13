import React, { useState, useMemo } from 'react';
import type { Product } from '../types/product';
import {
  Package,
  Plus,
  Search,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { downloadWoodPlanTemplateExcel } from '../utils/wood_plan_parser';

interface ProductsPageProps {
  products: Product[];
  isLoading: boolean;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onViewWoodPlan: (product: Product) => void;
  onUploadExcelForProduct: (productId?: string) => void;
  onCreateOrderForProduct?: (product: Product) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  isLoading,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onViewWoodPlan,
  onUploadExcelForProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'WITH_PLAN' | 'WITHOUT_PLAN'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Customer options
  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.customerName) set.add(p.customerName);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.customerName && p.customerName.toLowerCase().includes(q));

      // Customer
      const matchCustomer = customerFilter === 'ALL' || p.customerName === customerFilter;

      // Plan
      const matchPlan =
        planFilter === 'ALL' ||
        (planFilter === 'WITH_PLAN' && !!p.woodPlan) ||
        (planFilter === 'WITHOUT_PLAN' && !p.woodPlan);

      return matchSearch && matchCustomer && matchPlan;
    });
  }, [products, searchQuery, customerFilter, planFilter]);

  const totalWithPlans = products.filter((p) => !!p.woodPlan).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Package size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 m-0">
                All Products Database
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                {products.length} Products
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Master catalog of all furniture items, connected to their official <strong>Wood Plans</strong> (cutting
              sizes for lamination and framing) extracted from Excel.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            onClick={downloadWoodPlanTemplateExcel}
            title="Download blank sample Excel format for wood plans"
          >
            <Download size={15} />
            <span>Excel Template</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            onClick={() => onUploadExcelForProduct()}
            title="Upload Excel sheet to extract lamination and frame sizes"
          >
            <UploadCloud size={15} />
            <span>Upload Excel Wood Plan</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            onClick={onOpenAddProduct}
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, code, or customer..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Customer filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
          >
            <option value="ALL">All Customers</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Wood Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
          >
            <option value="ALL">All Plans ({products.length})</option>
            <option value="WITH_PLAN">Wood Plan Saved ({totalWithPlans})</option>
            <option value="WITHOUT_PLAN">No Wood Plan ({products.length - totalWithPlans})</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('GRID')}
              title="Grid Cards View"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('TABLE')}
              title="Compact Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading product catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 m-0">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || customerFilter !== 'ALL' || planFilter !== 'ALL'
              ? 'No products match your current filters. Try adjusting your search query.'
              : 'Your products database is empty. Click "+ Add Product" or upload an Excel BOM to get started.'}
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition cursor-pointer"
            onClick={onOpenAddProduct}
          >
            <Plus size={15} />
            <span>Add First Product</span>
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const hasPlan = !!product.woodPlan;
            const lamCount = product.woodPlan?.laminationItems?.length || 0;
            const frmCount = product.woodPlan?.frameItems?.length || 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
              >
                {/* Photo & Code Header */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {product.photoUrl ? (
                    <img
                      src={product.photoUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <Package size={48} className="opacity-40 mb-1" />
                      <span className="text-[11px] font-semibold">No Image Provided</span>
                    </div>
                  )}

                  {/* Code Tag */}
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-mono font-extrabold px-2.5 py-1 rounded-xl shadow-sm">
                    {product.code}
                  </div>

                  {/* Customer Badge */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {product.customerName}
                  </div>

                  {/* Action Quick Buttons */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-sm transition cursor-pointer"
                      onClick={() => onEditProduct(product)}
                      title="Edit Product Info"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 shadow-sm transition cursor-pointer"
                      onClick={() => onDeleteProduct(product)}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0 tracking-tight">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Wood Plan Blueprint Status Banner */}
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      hasPlan
                        ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                        : 'bg-amber-50/50 border-amber-200/80 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-extrabold flex items-center gap-1.5">
                        {hasPlan ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                            <span>Wood Plan Saved</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                            <span>No Wood Plan</span>
                          </>
                        )}
                      </span>

                      {hasPlan && (
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          Ready for Orders
                        </span>
                      )}
                    </div>

                    {hasPlan ? (
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        <strong>{lamCount}</strong> lamination sizes &bull; <strong>{frmCount}</strong> frame sizes
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Upload Excel BOM to automatically save lamination and frame cut sizes.
                      </div>
                    )}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasPlan ? (
                      <>
                        <button
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                          onClick={() => onViewWoodPlan(product)}
                        >
                          <Eye size={13} />
                          <span>View Wood Plan</span>
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          onClick={() => onUploadExcelForProduct(product.id)}
                          title="Re-upload or refresh Wood Plan from Excel"
                        >
                          <UploadCloud size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        onClick={() => onUploadExcelForProduct(product.id)}
                      >
                        <UploadCloud size={15} />
                        <span>Upload Excel Wood Plan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-16">Photo</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Wood Plan Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const hasPlan = !!p.woodPlan;
                  const lamCount = p.woodPlan?.laminationItems?.length || 0;
                  const frmCount = p.woodPlan?.frameItems?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-300" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                          {p.code}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                        {p.name}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.customerName}
                      </td>

                      <td className="py-3 px-4">
                        {hasPlan ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Saved ({lamCount} Lam, {frmCount} Frame)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                            <AlertCircle size={13} className="text-amber-600" />
                            <span>No Wood Plan</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {hasPlan ? (
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                              onClick={() => onViewWoodPlan(p)}
                            >
                              View Plan
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                              onClick={() => onUploadExcelForProduct(p.id)}
                            >
                              Upload Plan
                            </button>
                          )}

                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            onClick={() => onEditProduct(p)}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            onClick={() => onDeleteProduct(p)}
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
        </div>
      )}
    </div>
  );
};
