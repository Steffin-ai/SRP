import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Award } from 'lucide-react';
import { OptimizationResult } from '../optimizer/types';

interface ResultCardProps {
  result: OptimizationResult;
  targetRate: number;
  isFirst: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  targetRate,
  isFirst,
}) => {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [showOnlyUsedRows, setShowOnlyUsedRows] = useState(true);

  // Active allocated rows (spotsUsed > 0)
  const usedAllocations = result.allocations.filter((a) => a.spotsUsed > 0);
  const displayedAllocations = showOnlyUsedRows ? usedAllocations : result.allocations;

  return (
    <div
      className={`rounded-xl border transition-all duration-150 overflow-hidden ${
        isFirst
          ? 'bg-[#111928] border-indigo-500/40 shadow-lg shadow-indigo-950/20'
          : 'bg-[#101826] border-[#1E293B] hover:border-[#2A3B54]'
      }`}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 sm:px-5 sm:py-3.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isFirst
            ? 'bg-[#131D31] border-b border-indigo-950/60'
            : 'bg-[#111A29] border-b border-[#1A253A]'
        }`}
      >
        {/* Left: Rank & Title */}
        <div className="flex items-center space-x-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              isFirst
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-[#1E2B40] text-slate-300'
            }`}
          >
            #{result.rank}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Combination {result.rank}
              </h3>
              {isFirst && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Award className="w-3 h-3" />
                  <span>Best Optimum</span>
                </span>
              )}
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <CheckCircle className="w-2.5 h-2.5 text-indigo-400" />
                <span>Exact Target</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Utilizing {usedAllocations.length} inventory rows
            </p>
          </div>
        </div>

        {/* Right: Key Summary Metrics & Toggle */}
        <div className="flex items-center justify-between md:justify-end space-x-4 sm:space-x-6">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Total Rate
            </span>
            <span className="text-base font-bold text-white font-mono">
              ${result.totalRate.toFixed(2)}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Total Impressions
            </span>
            <span className="text-base font-bold text-indigo-300 font-mono">
              {result.totalImpressions.toLocaleString()}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Total Spots
            </span>
            <span className="text-base font-bold text-slate-200 font-mono">
              {result.totalSpots}
            </span>
          </div>

          <button
            type="button"
            className="p-1 rounded-md bg-[#162134] text-slate-400 hover:text-white border border-[#233148] transition-colors"
            aria-label={isExpanded ? 'Collapse combination details' : 'Expand combination details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Table Details */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Row-Level Spot Allocation Breakdown
            </h4>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowOnlyUsedRows(!showOnlyUsedRows)}
                className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-[#131E30] border border-[#202E44] transition-colors"
              >
                {showOnlyUsedRows ? `Show All Rows (${result.allocations.length})` : `Show Used Rows (${usedAllocations.length})`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead className="bg-[#0E1524] text-slate-400 font-sans font-semibold border-b border-[#1E293B]">
                <tr>
                  <th className="py-2.5 px-3">Excel Row</th>
                  <th className="py-2.5 px-3 text-right">Rate ($)</th>
                  <th className="py-2.5 px-3 text-right">Impression / Spot</th>
                  <th className="py-2.5 px-3 text-right font-bold text-indigo-300">Spots Used</th>
                  <th className="py-2.5 px-3 text-right">Rate Contrib.</th>
                  <th className="py-2.5 px-3 text-right">Impr. Contrib.</th>
                  <th className="py-2.5 px-3 text-right text-slate-400">Avails Exclusive</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Avails Inclusive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182338]">
                {displayedAllocations.map((alloc) => {
                  const isUsed = alloc.spotsUsed > 0;
                  return (
                    <tr
                      key={alloc.excelRow}
                      className={`transition-colors ${
                        isUsed ? 'bg-[#141E30]/70 hover:bg-[#18243A]' : 'opacity-40 hover:opacity-80'
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-semibold text-slate-200">
                        Row {alloc.excelRow}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        ${alloc.rate.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {alloc.impression.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white bg-indigo-900/30">
                        {alloc.spotsUsed}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200 font-semibold">
                        ${alloc.rateContribution.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-indigo-300 font-semibold">
                        {alloc.impressionContribution.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {alloc.availsExclusive}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                        {alloc.availsInclusive}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#0E1524] border-t-2 border-[#1E293B] font-bold">
                <tr>
                  <td className="py-2.5 px-3 font-sans text-slate-300">Total Sum</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-3 text-right text-white font-mono bg-indigo-950/40">
                    {result.totalSpots} spots
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">
                    ${result.totalRate.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-indigo-300 font-mono">
                    {result.totalImpressions.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400" colSpan={2}>
                    Variance: $0.00
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
