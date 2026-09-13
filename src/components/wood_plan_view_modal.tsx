import React, { useState } from 'react';
import type {
  Product,
  WoodPlan,
  WoodPlanLaminationItem,
  WoodPlanFrameItem
} from '../types/product';
import * as XLSX from 'xlsx';
import { saveBlobAs } from '../utils/excel_parser';
import {
  X,
  Layers,
  Download,
  UploadCloud,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  Package
} from 'lucide-react';

interface WoodPlanViewModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onUpdateWoodPlan: (productId: string, updatedPlan: WoodPlan) => Promise<void>;
  onTriggerExcelUpload: (productId: string) => void;
}

const WoodPlanViewModalContent: React.FC<{
  product: Product;
  onClose: () => void;
  onUpdateWoodPlan: (productId: string, updatedPlan: WoodPlan) => Promise<void>;
  onTriggerExcelUpload: (productId: string) => void;
}> = ({ product, onClose, onUpdateWoodPlan, onTriggerExcelUpload }) => {
  const { woodPlan } = product;
  const [activeTab, setActiveTab] = useState<'LAMINATION' | 'FRAME'>('LAMINATION');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editable state directly from props without useEffect
  const [laminationItems, setLaminationItems] = useState<WoodPlanLaminationItem[]>(
    woodPlan ? [...woodPlan.laminationItems] : []
  );
  const [frameItems, setFrameItems] = useState<WoodPlanFrameItem[]>(
    woodPlan ? [...woodPlan.frameItems] : []
  );

  if (!woodPlan) return null;

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const updated: WoodPlan = {
        ...woodPlan,
        laminationItems: laminationItems.map((it) => ({
          ...it,
          length: Number(it.length) || 0,
          width: Number(it.width) || 0,
          thickness: Number(it.thickness) || 0,
          qtyPerUnit: Math.max(1, Number(it.qtyPerUnit) || 1)
        })),
        frameItems: frameItems.map((it) => ({
          ...it,
          length: Number(it.length) || 0,
          width: Number(it.width) || 0,
          thickness: Number(it.thickness) || 0,
          qtyPerUnit: Math.max(1, Number(it.qtyPerUnit) || 1)
        })),
        updatedAt: new Date().toISOString()
      };

      await onUpdateWoodPlan(product.id, updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving edited wood plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Lamination Sheet
    const lamHeaders = ['Part Name', 'Qty Per Unit', 'Length (″)', 'Width (″)', 'Thickness (″)', 'Wood Type', 'Remarks'];
    const lamRows = laminationItems.map((it) => [
      it.partName,
      it.qtyPerUnit,
      it.length,
      it.width,
      it.thickness,
      it.woodType,
      it.remarks || ''
    ]);
    const lamWs = XLSX.utils.aoa_to_sheet([lamHeaders, ...lamRows]);
    XLSX.utils.book_append_sheet(wb, lamWs, 'Lamination_Sizes');

    // 2. Frame Sheet
    const frameHeaders = ['Component Name', 'Qty Per Unit', 'Length (″)', 'Width (″)', 'Thickness (″)', 'Wood Type', 'Remarks'];
    const frameRows = frameItems.map((it) => [
      it.partName,
      it.qtyPerUnit,
      it.length,
      it.width,
      it.thickness,
      it.woodType,
      it.remarks || ''
    ]);
    const frameWs = XLSX.utils.aoa_to_sheet([frameHeaders, ...frameRows]);
    XLSX.utils.book_append_sheet(wb, frameWs, 'Frame_Sizes');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveBlobAs(blob, `${product.code}_Wood_Plan_${product.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const totalLamPcs = laminationItems.reduce((sum, it) => sum + (Number(it.qtyPerUnit) || 0), 0);
  const totalFrmPcs = frameItems.reduce((sum, it) => sum + (Number(it.qtyPerUnit) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                  {product.code}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg m-0">
                  {product.name} — Wood Plan
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span>Customer: <strong className="text-slate-800">{product.customerName}</strong></span>
                <span>•</span>
                <span>Source: <strong className="text-slate-800">{woodPlan.sourceFileName || 'Direct Entry'}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 size={13} /> Stored in Cloud & Local DB
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              onClick={handleExportExcel}
              title="Download Excel spreadsheet"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              onClick={() => {
                onClose();
                onTriggerExcelUpload(product.id);
              }}
              title="Replace or refresh with a new Excel file"
            >
              <UploadCloud size={14} className="text-emerald-600" />
              <span>Re-upload Excel</span>
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action / Edit Bar */}
        <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'LAMINATION'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => setActiveTab('LAMINATION')}
            >
              <Layers size={14} />
              <span>Lamination Sizes ({laminationItems.length})</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'FRAME'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => setActiveTab('FRAME')}
            >
              <Package size={14} />
              <span>Frame Sizes ({frameItems.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  onClick={() => {
                    setLaminationItems([...woodPlan.laminationItems]);
                    setFrameItems([...woodPlan.frameItems]);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  onClick={handleSaveEdits}
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={13} />
                <span>Edit Cutting Values</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'LAMINATION' ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[160px]">Laminated Panel Part</th>
                    <th className="py-3 px-2 w-20 text-center">Qty / Unit</th>
                    <th className="py-3 px-2 w-24">Length (″)</th>
                    <th className="py-3 px-2 w-24">Width (″)</th>
                    <th className="py-3 px-2 w-24">Thick (″)</th>
                    <th className="py-3 px-3 min-w-[130px]">Wood Species</th>
                    <th className="py-3 px-3 min-w-[140px]">Remarks / Finish</th>
                    {isEditing && <th className="py-3 px-2 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {laminationItems.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.partName}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].partName = e.target.value;
                              setLaminationItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          it.partName
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-extrabold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={it.qtyPerUnit}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].qtyPerUnit = parseInt(e.target.value, 10) || 1;
                              setLaminationItems(next);
                            }}
                            className="w-full text-center px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100">{it.qtyPerUnit}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.length}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].length = parseFloat(e.target.value) || 0;
                              setLaminationItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.length}″`
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.width}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].width = parseFloat(e.target.value) || 0;
                              setLaminationItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.width}″`
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.thickness}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].thickness = parseFloat(e.target.value) || 0;
                              setLaminationItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.thickness}″`
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.woodType}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].woodType = e.target.value;
                              setLaminationItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        ) : (
                          it.woodType
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.remarks || ''}
                            onChange={(e) => {
                              const next = [...laminationItems];
                              next[idx].remarks = e.target.value;
                              setLaminationItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        ) : (
                          it.remarks || '—'
                        )}
                      </td>

                      {isEditing && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            onClick={() => setLaminationItems(laminationItems.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[160px]">Frame Component</th>
                    <th className="py-3 px-2 w-20 text-center">Qty / Unit</th>
                    <th className="py-3 px-2 w-24">Length (″)</th>
                    <th className="py-3 px-2 w-24">Width (″)</th>
                    <th className="py-3 px-2 w-24">Thick (″)</th>
                    <th className="py-3 px-3 min-w-[130px]">Wood Species</th>
                    <th className="py-3 px-3 min-w-[140px]">Work / Remarks</th>
                    {isEditing && <th className="py-3 px-2 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {frameItems.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.partName}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].partName = e.target.value;
                              setFrameItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          it.partName
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-extrabold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={it.qtyPerUnit}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].qtyPerUnit = parseInt(e.target.value, 10) || 1;
                              setFrameItems(next);
                            }}
                            className="w-full text-center px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100">{it.qtyPerUnit}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.length}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].length = parseFloat(e.target.value) || 0;
                              setFrameItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.length}″`
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.width}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].width = parseFloat(e.target.value) || 0;
                              setFrameItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.width}″`
                        )}
                      </td>

                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={it.thickness}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].thickness = parseFloat(e.target.value) || 0;
                              setFrameItems(next);
                            }}
                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          `${it.thickness}″`
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.woodType}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].woodType = e.target.value;
                              setFrameItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        ) : (
                          it.woodType
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.remarks || ''}
                            onChange={(e) => {
                              const next = [...frameItems];
                              next[idx].remarks = e.target.value;
                              setFrameItems(next);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        ) : (
                          it.remarks || '—'
                        )}
                      </td>

                      {isEditing && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            onClick={() => setFrameItems(frameItems.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2 flex-shrink-0">
          <div>
            Total blueprint components:{' '}
            <strong className="text-slate-900">
              {laminationItems.length} lamination panels ({totalLamPcs} pcs)
            </strong>{' '}
            and{' '}
            <strong className="text-slate-900">
              {frameItems.length} frame components ({totalFrmPcs} pcs)
            </strong>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            onClick={onClose}
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export const WoodPlanViewModal: React.FC<WoodPlanViewModalProps> = ({
  isOpen,
  product,
  onClose,
  onUpdateWoodPlan,
  onTriggerExcelUpload
}) => {
  if (!isOpen || !product || !product.woodPlan) return null;
  const key = `${product.id}_${product.woodPlan.updatedAt || ''}`;
  return (
    <WoodPlanViewModalContent
      key={key}
      product={product}
      onClose={onClose}
      onUpdateWoodPlan={onUpdateWoodPlan}
      onTriggerExcelUpload={onTriggerExcelUpload}
    />
  );
};
