import React from 'react';
import type { CutLayout } from '../../types/panel';
import { formatInches } from '../../utils/units';

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
    <div className="cut-diagram-container">
      <div className="cut-diagram-header">
        <span className="cut-diagram-title">
          ✂️ Cut Optimization {rotated ? '(Rotated 90°)' : '(Standard)'}
        </span>
        <span className={`waste-badge ${wastePercentage < 20 ? 'low-waste' : wastePercentage < 40 ? 'med-waste' : 'high-waste'}`}>
          {wastePercentage}% Offcut
        </span>
      </div>

      <div className="cut-svg-wrapper">
        <svg
          width={svgStockW}
          height={svgStockH}
          viewBox={`0 0 ${svgStockW} ${svgStockH}`}
          className="cut-svg"
        >
          {/* Stock Sheet Background */}
          <rect
            x="0"
            y="0"
            width={svgStockW}
            height={svgStockH}
            className="stock-sheet-rect"
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
                    className="cut-piece-rect"
                    rx="2"
                  />
                  {svgPieceW > 35 && svgPieceH > 25 && (
                    <text
                      x={x + svgPieceW / 2}
                      y={y + svgPieceH / 2 + 4}
                      textAnchor="middle"
                      className="cut-piece-text"
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
              className="remnant-hatch"
            />
          )}
        </svg>
      </div>

      <div className="cut-diagram-meta">
        <div className="cut-stat">
          <span className="cut-stat-label">Stock Size:</span>
          <span className="cut-stat-value">
            {formatInches(stockLength)} × {formatInches(stockWidth)}
          </span>
        </div>
        <div className="cut-stat">
          <span className="cut-stat-label">Yield / Panel:</span>
          <span className="cut-stat-value highlight-yield">
            {piecesPerSheet} {piecesPerSheet === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>
        {remnantLength !== undefined && remnantLength > 2 && (
          <div className="cut-stat">
            <span className="cut-stat-label">Usable Leftover:</span>
            <span className="cut-stat-value">
              ~{formatInches(remnantLength)} × {formatInches(remnantWidth || stockWidth)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
