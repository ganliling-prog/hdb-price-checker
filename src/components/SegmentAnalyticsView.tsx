import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Building,
  Home,
  Compass,
} from 'lucide-react';
import {
  HdbFlatType,
  HdbSegmentStats,
  HdbTransaction,
  SingaporeTown,
} from '../types/housing';
import {
  ALL_HDB_FLAT_TYPES,
  ALL_SINGAPORE_TOWNS,
  calculateMedian,
  getHdbSegmentStats,
} from '../services/housingValuationEngine';

interface SegmentAnalyticsViewProps {
  transactions: HdbTransaction[];
  onSelectFlatType: (type: HdbFlatType) => void;
  onSelectTransaction: (tx: HdbTransaction) => void;
}

export const SegmentAnalyticsView: React.FC<SegmentAnalyticsViewProps> = ({
  transactions,
  onSelectFlatType,
  onSelectTransaction,
}) => {
  const [activeHighlightType, setActiveHighlightType] = useState<HdbFlatType | 'All'>('All');
  const [hoveredTx, setHoveredTx] = useState<HdbTransaction | null>(null);

  const segmentStats: HdbSegmentStats[] = useMemo(
    () => getHdbSegmentStats(transactions).filter((s) => s.totalTransactions > 0),
    [transactions]
  );

  // Compute Town x Flat Type Median PSF matrix
  const matrix = useMemo(() => {
    const data: Record<string, Record<string, number | null>> = {};
    ALL_SINGAPORE_TOWNS.forEach((t) => {
      data[t] = {};
      ALL_HDB_FLAT_TYPES.forEach((type) => {
        const matching = transactions.filter(
          (tx) => tx.town === t && tx.flat_type === type
        );
        if (matching.length > 0) {
          data[t][type] = calculateMedian(matching.map((tx) => tx.price_per_sqft));
        } else {
          data[t][type] = null;
        }
      });
    });
    return data;
  }, [transactions]);

  // Scatter plot points
  const scatterData = useMemo(() => {
    const valid = transactions.filter(
      (t) => activeHighlightType === 'All' || t.flat_type === activeHighlightType
    );
    const maxSqm = Math.max(...transactions.map((t) => t.floor_area_sqm), 150);
    const maxPrice = Math.max(...transactions.map((t) => t.resale_price), 1600000);

    return {
      points: valid,
      maxSqm: Math.ceil(maxSqm / 20) * 20,
      maxPrice: Math.ceil(maxPrice / 200000) * 200000,
    };
  }, [transactions, activeHighlightType]);

  const typeColorMap: Record<HdbFlatType, { fill: string; stroke: string }> = {
    '4 ROOM': { fill: '#10b981', stroke: '#047857' },
    '5 ROOM': { fill: '#3b82f6', stroke: '#1d4ed8' },
    '3 ROOM': { fill: '#f59e0b', stroke: '#b45309' },
    'EXECUTIVE': { fill: '#ec4899', stroke: '#be185d' },
    '2 ROOM': { fill: '#8b5cf6', stroke: '#6d28d9' },
    'MULTI-GENERATION': { fill: '#06b6d4', stroke: '#0e7490' },
    '1 ROOM': { fill: '#64748b', stroke: '#334155' },
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            HDB Market Segment Intelligence & PSF Trends
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cost per square foot distributions and resale metrics segmented by official HDB flat types.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveHighlightType('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeHighlightType === 'All'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Segments
          </button>
          {ALL_HDB_FLAT_TYPES.slice(0, 5).map((type) => (
            <button
              key={type}
              onClick={() => setActiveHighlightType(type)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeHighlightType === type
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Flat Type KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {segmentStats.map((stat) => {
          const isSelected =
            activeHighlightType === 'All' || activeHighlightType === stat.flat_type;
          return (
            <div
              key={stat.flat_type}
              onClick={() => {
                setActiveHighlightType(stat.flat_type);
                onSelectFlatType(stat.flat_type);
              }}
              className={`bg-white p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-300 shadow-xs'
                  : 'opacity-50 border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                  {stat.flat_type.split(' ')[0]}
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  +{stat.priceTrendPct}% YoY
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                {stat.flat_type}
              </h3>

              {/* Median PSF */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Median Cost / Sq Ft
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl font-extrabold text-slate-950 tabular-nums">
                    S${stat.medianPsf}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/sqft</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Median Resale:</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    S${stat.medianPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Area:</span>
                  <span className="font-mono font-medium text-slate-800 tabular-nums">
                    {stat.avgFloorAreaSqm} sqm ({stat.avgFloorAreaSqft} sqft)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Balance:</span>
                  <span className="font-mono font-medium text-slate-800 tabular-nums">
                    {stat.avgRemainingLeaseYears} yrs lease
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Transactions:</span>
                  <span className="font-mono tabular-nums">{stat.totalTransactions} recorded</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Split: PSF Spread (Left) & Price vs Floor Area (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cost Per Sq Ft Spread Visualizer */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                HDB Cost Per Sq Ft Spread by Flat Type
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observed min, median, and max transacted S$/sqft across flat segments.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {segmentStats.map((stat) => {
              const maxScale = 1400;
              const leftPct = (stat.minPsf / maxScale) * 100;
              const widthPct = ((stat.maxPsf - stat.minPsf) / maxScale) * 100;
              const medianPct = (stat.medianPsf / maxScale) * 100;

              return (
                <div key={stat.flat_type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {stat.flat_type}
                    </span>
                    <span className="font-mono font-bold text-slate-950 tabular-nums">
                      S${stat.medianPsf} / sq ft
                    </span>
                  </div>

                  <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center">
                    {/* Range Band */}
                    <div
                      className="absolute h-3 rounded-full opacity-60 transition-all duration-300"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(5, widthPct)}%`,
                        backgroundColor: typeColorMap[stat.flat_type]?.fill || '#64748b',
                      }}
                    />
                    {/* Median Pin */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-slate-950 z-10"
                      style={{ left: `${medianPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Min S${stat.minPsf}</span>
                    <span className="font-semibold text-slate-700">
                      Median S${stat.medianPsf}
                    </span>
                    <span>Max S${stat.maxPsf}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Range Axis (S$/sqft)</span>
            <span className="font-mono">S$0 to S$1,400 / sq ft</span>
          </div>
        </div>

        {/* Right: Resale Price vs Floor Area (sqm) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                Resale Price vs. Floor Area (sqm)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hover over transaction points to view HDB unit specifics.
              </p>
            </div>
            {hoveredTx && (
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                S${hoveredTx.price_per_sqft}/sqft
              </span>
            )}
          </div>

          {/* SVG Visualizer */}
          <div className="relative w-full aspect-4/3 bg-slate-50/70 border border-slate-100 rounded-lg p-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 320"
              preserveAspectRatio="none"
            >
              {/* Y Axis Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                <g key={frac}>
                  <line
                    x1="45"
                    y1={300 - frac * 270}
                    x2="480"
                    y2={300 - frac * 270}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="40"
                    y={305 - frac * 270}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    className="font-mono"
                  >
                    S${((frac * scatterData.maxPrice) / 1000000).toFixed(1)}M
                  </text>
                </g>
              ))}

              {/* X Axis Labels */}
              {[45, 70, 95, 120, 145].map((val) => {
                const xPos = 45 + (val / scatterData.maxSqm) * 435;
                return (
                  <g key={val}>
                    <line
                      x1={xPos}
                      y1="30"
                      x2={xPos}
                      y2="300"
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={xPos}
                      y="315"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {val}m²
                    </text>
                  </g>
                );
              })}

              {/* Data points */}
              {scatterData.points.map((tx) => {
                const cx = 45 + (tx.floor_area_sqm / scatterData.maxSqm) * 435;
                const cy = 300 - (tx.resale_price / scatterData.maxPrice) * 270;
                const isHovered = hoveredTx?._id === tx._id;
                const color = typeColorMap[tx.flat_type] || { fill: '#64748b', stroke: '#334155' };

                return (
                  <circle
                    key={tx._id}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 4.5}
                    fill={color.fill}
                    stroke={isHovered ? '#0f172a' : '#ffffff'}
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredTx(tx)}
                    onMouseLeave={() => setHoveredTx(null)}
                    onClick={() => onSelectTransaction(tx)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredTx && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs max-w-xs pointer-events-none">
                <div className="font-bold text-slate-900 truncate">
                  Blk {hoveredTx.block} {hoveredTx.street_name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {hoveredTx.town} · {hoveredTx.flat_type} ({hoveredTx.flat_model})
                </div>
                <div className="text-[11px] text-slate-400">
                  Storey {hoveredTx.storey_range} · {hoveredTx.floor_area_sqm} sqm ({hoveredTx.floor_area_sqft} sqft)
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3 pt-1 border-t border-slate-100">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    S${hoveredTx.resale_price.toLocaleString()}
                  </span>
                  <span className="font-mono font-semibold text-emerald-700">
                    S${hoveredTx.price_per_sqft} / sq ft
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap gap-4 pt-2">
            {ALL_HDB_FLAT_TYPES.slice(0, 5).map((type) => (
              <div
                key={type}
                onClick={() =>
                  setActiveHighlightType(
                    activeHighlightType === type ? 'All' : type
                  )
                }
                className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: typeColorMap[type]?.fill || '#64748b' }}
                />
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Singapore Town x Flat Type Matrix */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Singapore Towns Cross-Segment Price Matrix (S$/Sq Ft)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Median transacted cost per square foot segmented across Singapore towns and HDB flat types.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-4">Singapore Town</th>
                {ALL_HDB_FLAT_TYPES.slice(0, 5).map((type) => (
                  <th key={type} className="py-2.5 px-3 text-right">
                    {type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {ALL_SINGAPORE_TOWNS.slice(0, 15).map((t) => (
                <tr key={t} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {t}
                  </td>
                  {ALL_HDB_FLAT_TYPES.slice(0, 5).map((type) => {
                    const psfVal = matrix[t]?.[type];
                    return (
                      <td
                        key={type}
                        className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap"
                      >
                        {psfVal !== null && psfVal !== undefined ? (
                          <span
                            className={`font-semibold px-2 py-1 rounded ${
                              psfVal >= 800
                                ? 'bg-slate-900 text-white font-bold'
                                : psfVal >= 600
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-700'
                            }`}
                          >
                            S${psfVal}/sqft
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
