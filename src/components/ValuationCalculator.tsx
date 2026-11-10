import React, { useState, useMemo } from 'react';
import {
  Building2,
  Sliders,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  Check,
} from 'lucide-react';
import {
  HdbEstimateRequest,
  HdbFlatModel,
  HdbFlatType,
  HdbTransaction,
  HdbValuationResult,
  SingaporeTown,
  StoreyRange,
} from '../types/housing';
import {
  ALL_FLAT_MODELS,
  ALL_HDB_FLAT_TYPES,
  ALL_SINGAPORE_TOWNS,
  ALL_STOREY_RANGES,
  calculateHdbValuation,
} from '../services/housingValuationEngine';
import { SQM_TO_SQFT } from '../data/mockTransactions';

interface ValuationCalculatorProps {
  transactions: HdbTransaction[];
  onSelectTransaction: (tx: HdbTransaction) => void;
  onViewTransactionsTab: (filterType?: HdbFlatType, town?: SingaporeTown) => void;
}

export const ValuationCalculator: React.FC<ValuationCalculatorProps> = ({
  transactions,
  onSelectTransaction,
  onViewTransactionsTab,
}) => {
  // HDB Specific Form State
  const [flatType, setFlatType] = useState<HdbFlatType>('4 ROOM');
  const [town, setTown] = useState<SingaporeTown>('TAMPINES');
  const [floorAreaSqm, setFloorAreaSqm] = useState<number>(93);
  const [storeyRange, setStoreyRange] = useState<StoreyRange>('10 TO 12');
  const [flatModel, setFlatModel] = useState<HdbFlatModel>('Model A');
  const [leaseCommenceYear, setLeaseCommenceYear] = useState<number>(2015);

  // Computed Remaining Lease
  const remainingLeaseYears = Math.max(1, 99 - (2026 - leaseCommenceYear));
  const floorAreaSqft = Math.round(floorAreaSqm * SQM_TO_SQFT);

  // Build the request matching data.gov.sg schema
  const request: HdbEstimateRequest = useMemo(
    () => ({
      town,
      flat_type: flatType,
      floor_area_sqm: floorAreaSqm,
      storey_range: storeyRange,
      flat_model: flatModel,
      lease_commence_date: leaseCommenceYear,
    }),
    [town, flatType, floorAreaSqm, storeyRange, flatModel, leaseCommenceYear]
  );

  // Valuation Result
  const valuation: HdbValuationResult = useMemo(
    () => calculateHdbValuation(request, transactions),
    [request, transactions]
  );

  const psfDiffFromMedian = valuation.estimatedPsf - valuation.benchmarkMedianPsf;
  const psfDiffPct = (
    (psfDiffFromMedian / (valuation.benchmarkMedianPsf || 1)) *
    100
  ).toFixed(1);

  // Presets from data.gov.sg
  const handleApplyPreset = (preset: 'tampines_4rm' | 'bishan_dbss' | 'punggol_5rm' | 'queenstown_high' | 'amk_3rm') => {
    if (preset === 'tampines_4rm') {
      setTown('TAMPINES');
      setFlatType('4 ROOM');
      setFloorAreaSqm(93);
      setStoreyRange('07 TO 09');
      setFlatModel('Model A');
      setLeaseCommenceYear(2015);
    } else if (preset === 'bishan_dbss') {
      setTown('BISHAN');
      setFlatType('4 ROOM');
      setFloorAreaSqm(95);
      setStoreyRange('16 TO 18');
      setFlatModel('DBSS');
      setLeaseCommenceYear(2011);
    } else if (preset === 'punggol_5rm') {
      setTown('PUNGGOL');
      setFlatType('5 ROOM');
      setFloorAreaSqm(112);
      setStoreyRange('10 TO 12');
      setFlatModel('Premium Apartment');
      setLeaseCommenceYear(2015);
    } else if (preset === 'queenstown_high') {
      setTown('QUEENSTOWN');
      setFlatType('5 ROOM');
      setFloorAreaSqm(115);
      setStoreyRange('34 TO 36');
      setFlatModel('Improved');
      setLeaseCommenceYear(2015);
    } else if (preset === 'amk_3rm') {
      setTown('ANG MO KIO');
      setFlatType('3 ROOM');
      setFloorAreaSqm(68);
      setStoreyRange('04 TO 06');
      setFlatModel('New Generation');
      setLeaseCommenceYear(1981);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              HDB Resale Price & Cost Per Sq Ft Estimator
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Parameterized against official Singapore Housing & Development Board (HDB) resale transactions from data.gov.sg.
          </p>
        </div>

        {/* Quick Sample Presets from data.gov.sg */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start md:self-auto overflow-x-auto max-w-full">
          <span className="text-xs font-semibold text-slate-500 px-2 whitespace-nowrap">
            Sample Comps:
          </span>
          <button
            onClick={() => handleApplyPreset('tampines_4rm')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs whitespace-nowrap transition-colors"
          >
            Tampines 4-Room
          </button>
          <button
            onClick={() => handleApplyPreset('bishan_dbss')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs whitespace-nowrap transition-colors"
          >
            Bishan DBSS
          </button>
          <button
            onClick={() => handleApplyPreset('punggol_5rm')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs whitespace-nowrap transition-colors"
          >
            Punggol 5-Room
          </button>
          <button
            onClick={() => handleApplyPreset('queenstown_high')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs whitespace-nowrap transition-colors"
          >
            Queenstown High-Floor
          </button>
          <button
            onClick={() => handleApplyPreset('amk_3rm')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs whitespace-nowrap transition-colors"
          >
            Ang Mo Kio 3-Room
          </button>
        </div>
      </div>

      {/* 2-Column Split: HDB Input Parameters (Left) vs Output Engine (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              Flat Parameters (HDB Schema)
            </h2>
            <button
              onClick={() => handleApplyPreset('tampines_4rm')}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* 1. HDB Flat Type Segment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              HDB Flat Type (Property Segment)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', '2 ROOM', 'MULTI-GENERATION'].map((type) => {
                const isSelected = flatType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFlatType(type as HdbFlatType);
                      // Adjust default floor area sensibly based on flat type
                      if (type === '3 ROOM' && floorAreaSqm > 80) setFloorAreaSqm(68);
                      if (type === '4 ROOM' && (floorAreaSqm < 80 || floorAreaSqm > 110)) setFloorAreaSqm(93);
                      if (type === '5 ROOM' && floorAreaSqm < 110) setFloorAreaSqm(113);
                      if (type === 'EXECUTIVE' && floorAreaSqm < 135) setFloorAreaSqm(145);
                      if (type === '2 ROOM' && floorAreaSqm > 55) setFloorAreaSqm(47);
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg text-center transition-colors border ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Singapore Town Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Singapore HDB Town
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {ALL_SINGAPORE_TOWNS.length} official towns
              </span>
            </div>
            <select
              value={town}
              onChange={(e) => setTown(e.target.value as SingaporeTown)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
            >
              {ALL_SINGAPORE_TOWNS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Floor Area (sqm) with real-time sqft conversion */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Floor Area (sqm & sq ft)
              </label>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                  {floorAreaSqm} sqm
                </span>
                <span className="text-xs text-slate-500 font-mono ml-1.5">
                  ({floorAreaSqft.toLocaleString()} sq ft)
                </span>
              </div>
            </div>
            <input
              type="range"
              min={35}
              max={180}
              step={1}
              value={floorAreaSqm}
              onChange={(e) => setFloorAreaSqm(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
              <span>35 sqm (377 sqft)</span>
              <span>100 sqm (1,076 sqft)</span>
              <span>180 sqm (1,938 sqft)</span>
            </div>
          </div>

          {/* 4. Storey Range (Floor Level Tier) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Storey Range (Floor Level)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Floor level tier
              </span>
            </div>
            <select
              value={storeyRange}
              onChange={(e) => setStoreyRange(e.target.value as StoreyRange)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
            >
              {ALL_STOREY_RANGES.map((sr) => (
                <option key={sr} value={sr}>
                  Storey {sr}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Flat Model */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              HDB Flat Model
            </label>
            <select
              value={flatModel}
              onChange={(e) => setFlatModel(e.target.value as HdbFlatModel)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
            >
              {ALL_FLAT_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Lease Commence Date & Remaining Lease */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lease Commence Year
              </label>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {leaseCommenceYear}
              </span>
            </div>
            <input
              type="range"
              min={1970}
              max={2026}
              step={1}
              value={leaseCommenceYear}
              onChange={(e) => setLeaseCommenceYear(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">Calculated Remaining Lease:</span>
              <span className="font-mono font-bold text-slate-900">
                {remainingLeaseYears} years left (out of 99)
              </span>
            </div>
          </div>
        </div>

        {/* Right Output: Estimated Resale Price & Cost Per Sq Ft (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Valuation Summary Card */}
          <div className="bg-white p-7 rounded-xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estimated HDB Resale Value
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-950 tabular-nums">
                    S${valuation.estimatedPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Conservative: S${valuation.lowPrice.toLocaleString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>Optimistic: S${valuation.highPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Sample Size & Confidence */}
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500">
                  Valuation Confidence
                </div>
                <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  {valuation.confidenceScore}% High
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Matched against {valuation.sampleSize} comps in {town}
                </div>
              </div>
            </div>

            {/* Core Metric Highlight: Cost Per Square Foot (S$/sqft) & S$/sqm */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">
                    Estimated Cost Per Square Foot
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                      S${valuation.estimatedPsf}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      / sq ft
                    </span>
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      (S${valuation.estimatedPsm.toLocaleString()} / sqm)
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-medium text-slate-500">
                    Town Benchmark ({town} {flatType})
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-800 mt-0.5">
                    Median S${valuation.benchmarkMedianPsf} / sq ft
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Variance:{' '}
                    <span
                      className={`font-semibold font-mono ${
                        psfDiffFromMedian >= 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {psfDiffFromMedian >= 0 ? '+' : ''}
                      {psfDiffPct}% ({psfDiffFromMedian >= 0 ? '+' : ''}S$
                      {psfDiffFromMedian}/sq ft)
                    </span>
                  </div>
                </div>
              </div>

              {/* Benchmark Distribution Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mb-1.5">
                  <span>Min: S${valuation.benchmarkPsfRange.min}</span>
                  <span>25th: S${valuation.benchmarkPsfRange.p25}</span>
                  <span className="font-bold text-slate-900">
                    Median: S${valuation.benchmarkPsfRange.median}
                  </span>
                  <span>75th: S${valuation.benchmarkPsfRange.p75}</span>
                  <span>Max: S${valuation.benchmarkPsfRange.max}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 bg-slate-400 rounded-full opacity-40"
                    style={{
                      left: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((valuation.benchmarkPsfRange.p25 -
                            valuation.benchmarkPsfRange.min) /
                            (valuation.benchmarkPsfRange.max -
                              valuation.benchmarkPsfRange.min || 1)) *
                            100
                        )
                      )}%`,
                      right: `${Math.max(
                        0,
                        Math.min(
                          100,
                          100 -
                            ((valuation.benchmarkPsfRange.p75 -
                              valuation.benchmarkPsfRange.min) /
                              (valuation.benchmarkPsfRange.max -
                                valuation.benchmarkPsfRange.min || 1)) *
                              100
                        )
                      )}%`,
                    }}
                  />
                  {/* Current Estimated PSF marker */}
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-slate-950 rounded-full"
                    style={{
                      left: `${Math.max(
                        2,
                        Math.min(
                          98,
                          ((valuation.estimatedPsf -
                            valuation.benchmarkPsfRange.min) /
                            (valuation.benchmarkPsfRange.max -
                              valuation.benchmarkPsfRange.min || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Itemized Valuation Drivers Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Valuation Drivers & Price-Per-Sqft Breakdown
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">Valuation Factor</th>
                      <th className="py-2.5 px-3 text-right">PSF Impact</th>
                      <th className="py-2.5 px-3 text-right">Value Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {valuation.drivers.map((driver, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">
                            {driver.label}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {driver.note}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                          {idx === 0 ? (
                            `S$${driver.impactPsf}/sqft`
                          ) : (
                            <span
                              className={
                                driver.isPositive
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }
                            >
                              {driver.isPositive ? '+' : ''}S${driver.impactPsf}/sqft
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap text-slate-900">
                          {idx === 0 ? (
                            `S$${driver.impactDollars.toLocaleString()}`
                          ) : (
                            <span
                              className={
                                driver.isPositive
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }
                            >
                              {driver.isPositive ? '+' : ''}S$
                              {Math.abs(driver.impactDollars).toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-2.5 px-3 text-slate-900">
                        Total Estimated HDB Price ({floorAreaSqm} sqm / {floorAreaSqft.toLocaleString()} sq ft)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                        S${valuation.estimatedPsf}/sqft
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-950 tabular-nums text-sm">
                        S${valuation.estimatedPrice.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Nearest Historical Comparable Sales from data.gov.sg */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Historical HDB Comps (data.gov.sg)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Closest recent registered resale transactions in {town}.
                </p>
              </div>
              <button
                onClick={() => onViewTransactionsTab(flatType, town)}
                className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <span>View All {town} {flatType} Comps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {valuation.comparables.map((comp) => {
                const tx = comp.transaction;
                return (
                  <div
                    key={tx._id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Blk {tx.block} {tx.street_name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {comp.similarityScore}% match
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{tx.town}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.floor_area_sqm} sqm ({tx.floor_area_sqft} sqft)</span>
                        <span aria-hidden="true">·</span>
                        <span>Storey {tx.storey_range}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.remaining_lease}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        S${tx.resale_price.toLocaleString()}
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                        S${tx.price_per_sqft} / sq ft
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
