import React from 'react';
import { Download, Sparkles, Target, Layers, Eye, CheckCircle2, Clock } from 'lucide-react';
import { OptimizationResult } from '../optimizer/types';
import { exportResultsToExcel } from '../optimizer/excelParser';

interface ResultsSummaryProps {
  results: OptimizationResult[];
  targetRate: number;
  minSpots: number;
  minImpressions: number;
  executionTimeMs: number;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  results,
  targetRate,
  minSpots,
  minImpressions,
  executionTimeMs,
}) => {
  if (results.length === 0) return null;

  const topResult = results[0];

  const handleExportExcel = () => {
    const uint8Arr = exportResultsToExcel(results);
    const blob = new Blob([uint8Arr], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srp_optimized_results_target_${targetRate.toFixed(2)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111928] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Optimization Results
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {results.length} Valid Combinations Found
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ranked by highest total impressions, then lowest total spots.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#162032] hover:bg-[#1E2B40] border border-[#233148] hover:border-indigo-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export to Excel (.xlsx)</span>
        </button>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Target Rate */}
        <div className="bg-[#0E1524] border border-[#1E293B] rounded-lg p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Rate</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">
            ${targetRate.toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-400 flex items-center space-x-0.5 mt-0.5">
            <CheckCircle2 className="w-3 h-3 inline" />
            <span>Exact $0.00 Variance</span>
          </span>
        </div>

        {/* Metric 2: Max Impressions */}
        <div className="bg-[#0E1524] border border-[#1E293B] rounded-lg p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Best Impressions</span>
          </div>
          <p className="text-lg font-bold text-indigo-300 font-mono">
            {topResult.totalImpressions.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Rank 1 Global Optimum
          </span>
        </div>

        {/* Metric 3: Optimal Spots */}
        <div className="bg-[#0E1524] border border-[#1E293B] rounded-lg p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Spots (Rank 1)</span>
          </div>
          <p className="text-lg font-bold text-slate-100 font-mono">
            {topResult.totalSpots} spots
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {minSpots > 0 ? `Meets min ${minSpots}` : 'Zero spot constraint'}
          </span>
        </div>

        {/* Metric 4: Computation Speed */}
        <div className="bg-[#0E1524] border border-[#1E293B] rounded-lg p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Execution Time</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            {executionTimeMs < 1 ? '< 1 ms' : `${executionTimeMs.toFixed(1)} ms`}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Exact DP + B&B Solved
          </span>
        </div>
      </div>
    </div>
  );
};
