import React from 'react';
import type { CutLayout } from '../types/panel';
import { formatInches } from '../utils/units';

interface VisualCutDiagramProps {
  layout: CutLayout;
}

export const VisualCutDiagram: React.FC<VisualCutDiagramProps> = ({
  layout
}) => {
  const {
    stockLength,
    stockWidth,
    cutPieceLength,
    cutPieceWidth,
    cutsAlongLength,
    cutsAlongWidth,
    piecesPerSheet,
    wastePercentage,
    remnantLength,
    remnantWidth,
    rotated
  } = layout;

  // Render proportional SVG box
  const maxSvgWidth = 320;
  const maxSvgHeight = 180;
  const scale = Math.min(maxSvgWidth / stockLength, maxSvgHeight / stockWidth);

  const svgStockW = stockLength * scale;
  const svgStockH = stockWidth * scale;

  const actualPieceL = rotated ? cutPieceWidth : cutPieceLength;
  const actualPieceW = rotated ? cutPieceLength : cutPieceWidth;
  const svgPieceW = actualPieceL * scale;
  const svgPieceH = actualPieceW * scale;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">
          ✂️ Cut Optimization {rotated ? '(Rotated 90°)' : '(Standard)'}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            wastePercentage < 20
              ? 'bg-emerald-100 text-emerald-800'
              : wastePercentage < 40
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {wastePercentage}% Offcut
        </span>
      </div>

      <div className="flex justify-center p-2 bg-white rounded-lg border border-slate-200/80 overflow-hidden">
        <svg
          width={svgStockW}
          height={svgStockH}
          viewBox={`0 0 ${svgStockW} ${svgStockH}`}
          className="overflow-visible"
        >
          {/* Stock Sheet Background */}
          <rect
            x="0"
            y="0"
            width={svgStockW}
            height={svgStockH}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1"
            rx="4"
          />

          {/* Render Cut Pieces */}
          {Array.from({ length: cutsAlongLength }).map((_, xIdx) =>
            Array.from({ length: cutsAlongWidth }).map((_, yIdx) => {
              const x = xIdx * svgPieceW;
              const y = yIdx * svgPieceH;
              const pieceNumber = xIdx * cutsAlongWidth + yIdx + 1;

              return (
                <g key={`cut-${xIdx}-${yIdx}`}>
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={svgPieceW - 2}
                    height={svgPieceH - 2}
                    fill="#10b981"
                    fillOpacity="0.85"
                    stroke="#059669"
                    strokeWidth="1"
                    rx="2"
                  />
                  {svgPieceW > 35 && svgPieceH > 25 && (
                    <text
                      x={x + svgPieceW / 2}
                      y={y + svgPieceH / 2 + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      #{pieceNumber}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Offcut remnant hatch */}
          {remnantLength && remnantLength > 4 && (
            <rect
              x={cutsAlongLength * svgPieceW}
              y="0"
              width={svgStockW - cutsAlongLength * svgPieceW}
              height={svgStockH}
              fill="#f43f5e"
              fillOpacity="0.15"
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
        </svg>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span className="text-slate-400">Stock Size:</span>
          <span className="font-mono font-bold text-slate-800">
            {formatInches(stockLength)} × {formatInches(stockWidth)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="text-slate-400">Yield / Panel:</span>
          <span className="font-bold text-emerald-700">
            {piecesPerSheet} {piecesPerSheet === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>
        {remnantLength !== undefined && remnantLength > 2 && (
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-400">Usable Leftover:</span>
            <span className="font-mono text-slate-700">
              ~{formatInches(remnantLength)} × {formatInches(remnantWidth || stockWidth)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
