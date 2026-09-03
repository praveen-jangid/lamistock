import React, { useState } from 'react';
import type { LaminatedPanel, MatchResult } from '../types/panel';
import { formatDimensions } from '../utils/units';
import { DEFAULT_MANGO_FRONT_IMAGE, DEFAULT_MANGO_BACK_IMAGE } from '../services/image_compressor';
import {
  X,
  Printer,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  TreePine
} from 'lucide-react';

interface SpecSheetModalProps {
  isOpen: boolean;
  panel: LaminatedPanel | null;
  matchResult?: MatchResult | null;
  onClose: () => void;
}

export const SpecSheetModal: React.FC<SpecSheetModalProps> = ({
  isOpen,
  panel,
  matchResult,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [managerPhone, setManagerPhone] = useState('');

  if (!isOpen || !panel) return null;

  const frontImg = panel.frontImageUrl || DEFAULT_MANGO_FRONT_IMAGE;
  const backImg = panel.backImageUrl || DEFAULT_MANGO_BACK_IMAGE;

  // Format WhatsApp message text
  const generateWhatsAppMessage = (): string => {
    let msg = `🏭 *LAMINATED PANEL SPEC SHEET*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🪵 *Material:* ${panel.woodType || 'Laminated Wood'}\n`;
    msg += `📐 *Dimensions:* ${formatDimensions(panel.length, panel.width, panel.thickness)}\n`;
    msg += `📊 *Stock Available:* ${panel.quantity} Panel(s)\n`;

    if (matchResult) {
      msg += `\n🎯 *ORDER MATCH PROPOSAL:*\n`;
      msg += `• Cut Yield: ${matchResult.yieldPerSheet} pcs / panel\n`;
      msg += `• Cut Waste: ${matchResult.wastePercentage}%\n`;
      msg += `• Panels Needed: ${matchResult.totalPanelsRequired}\n`;
    }

    if (panel.notes) {
      msg += `\n📝 *Notes:* ${panel.notes}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Please check front and back face photos & confirm if this stock works for production._`;

    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const phoneClean = managerPhone.replace(/[^0-9]/g, '');
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyClipboard = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 print:hidden">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0">
              📋 Production Spec Sheet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify Front & Back photos and dimensions in inches with your Production Manager.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Spec Card Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Header Banner */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 flex-wrap">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                FURNITURE MANUFACTURING • STOCK SPECIFICATION
              </span>
              <h1 className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1 m-0">
                {formatDimensions(panel.length, panel.width, panel.thickness)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                <TreePine size={14} className="text-emerald-600" />
                <span>{panel.woodType || 'Laminated Wood'}</span>
              </div>
              <span className="px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold rounded-full">
                {panel.quantity} Panel(s) Available
              </span>
            </div>
          </div>

          {/* Dual Photos: Front & Back side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Front Photo */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700">
                FRONT FACE (A-SIDE)
              </div>
              <div className="h-44 sm:h-52 bg-slate-200 flex items-center justify-center overflow-hidden">
                <img src={frontImg} alt="Front Face" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Back Photo */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700">
                BACK FACE (B-SIDE)
              </div>
              <div className="h-44 sm:h-52 bg-slate-200 flex items-center justify-center overflow-hidden">
                <img src={backImg} alt="Back Face" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Detailed Technical Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dimensions:</span>
              <strong className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                {formatDimensions(panel.length, panel.width, panel.thickness)}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Wood Material:</span>
              <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                {panel.woodType || 'Laminated Wood'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stock Quantity:</span>
              <strong className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                {panel.quantity} Panel(s)
              </strong>
            </div>
          </div>

          {/* If opened as part of a match result */}
          {matchResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles size={15} className="text-emerald-600" />
                <span>Order Match Proposed:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-emerald-950 font-medium">
                <div>Yield: <strong>{matchResult.yieldPerSheet} pcs / panel</strong></div>
                <div>Offcut Waste: <strong>{matchResult.wastePercentage}%</strong></div>
                <div>Panels Required: <strong>{matchResult.totalPanelsRequired}</strong></div>
              </div>
            </div>
          )}

          {panel.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
              <strong>Factory Remarks:</strong> {panel.notes}
            </div>
          )}
        </div>

        {/* Modal Action Bar (WhatsApp, Print, Copy) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">WhatsApp #:</span>
            <input
              type="tel"
              className="flex-1 sm:w-56 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="+91 9876543210 (Optional)"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              onClick={handleShareWhatsApp}
              title="Open WhatsApp with pre-filled panel specifications"
            >
              <MessageCircle size={15} />
              <span>Share WhatsApp</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              onClick={handleCopyClipboard}
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              onClick={handlePrint}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
