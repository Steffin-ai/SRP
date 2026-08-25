import React from 'react';
import { Sliders, DollarSign, Layers, Eye, Maximize2, Hash, Play, Loader2 } from 'lucide-react';
import { OptimizerInput } from '../optimizer/types';

interface PlannerInputsProps {
  input: OptimizerInput;
  onChange: (input: OptimizerInput) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  hasInventory: boolean;
}

export const PlannerInputs: React.FC<PlannerInputsProps> = ({
  input,
  onChange,
  onOptimize,
  isOptimizing,
  hasInventory,
}) => {
  const handleChange = (field: keyof OptimizerInput, value: number) => {
    onChange({
      ...input,
      [field]: isNaN(value) ? 0 : value,
    });
  };

  const setTargetPreset = (val: number) => {
    onChange({
      ...input,
      targetRate: val,
    });
  };

  return (
    <div className="bg-[#111928] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Planning Parameters & Constraints
          </h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Exact Cent Precision
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
        {/* Target Rate - Prominently emphasized (Col 1-4) */}
        <div className="lg:col-span-4 bg-[#0E1524] border border-indigo-500/30 rounded-lg p-3 relative focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="targetRate" className="text-xs font-bold text-indigo-300 flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Rate (Exact $)</span>
            </label>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              Required
            </span>
          </div>

          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-base font-semibold">
              $
            </span>
            <input
              id="targetRate"
              type="number"
              min="0.01"
              step="0.01"
              value={input.targetRate || ''}
              onChange={(e) => handleChange('targetRate', parseFloat(e.target.value))}
              placeholder="100.00"
              className="w-full pl-7 pr-3 py-1.5 bg-[#162032] border border-[#233148] rounded-md text-white text-base font-semibold font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Quick presets for common test amounts */}
          <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto pb-0.5">
            <span className="text-[10px] text-slate-400 flex-shrink-0">Presets:</span>
            {[100, 200, 300, 500, 1000, 1500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTargetPreset(amt)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                  input.targetRate === amt
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-[#162032] text-slate-300 hover:text-white hover:bg-[#1F2C44]'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Spots (Col 5-6) */}
        <div className="lg:col-span-2">
          <label htmlFor="minSpots" className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Min Spots</span>
          </label>
          <input
            id="minSpots"
            type="number"
            min="0"
            step="1"
            value={input.minSpots || ''}
            onChange={(e) => handleChange('minSpots', parseInt(e.target.value, 10))}
            placeholder="0"
            className="w-full px-3 py-2 bg-[#0E1524] border border-[#233148] rounded-lg text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Total spots limit</span>
        </div>

        {/* Minimum Impressions (Col 7-8) */}
        <div className="lg:col-span-2">
          <label htmlFor="minImpressions" className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>Min Impressions</span>
          </label>
          <input
            id="minImpressions"
            type="number"
            min="0"
            step="100"
            value={input.minImpressions || ''}
            onChange={(e) => handleChange('minImpressions', parseInt(e.target.value, 10))}
            placeholder="0"
            className="w-full px-3 py-2 bg-[#0E1524] border border-[#233148] rounded-lg text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Total impr threshold</span>
        </div>

        {/* Maximum Spots Per Rate (Col 9-10) */}
        <div className="lg:col-span-2">
          <label htmlFor="maxSpotsPerRate" className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Maximize2 className="w-3 h-3 text-slate-400" />
            <span>Max Spots/Rate</span>
          </label>
          <input
            id="maxSpotsPerRate"
            type="number"
            min="1"
            step="1"
            value={input.maxSpotsPerRate || ''}
            onChange={(e) => handleChange('maxSpotsPerRate', parseInt(e.target.value, 10))}
            placeholder="100"
            className="w-full px-3 py-2 bg-[#0E1524] border border-[#233148] rounded-lg text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Cap per row avails</span>
        </div>

        {/* Number of Results (Col 11) */}
        <div className="lg:col-span-2">
          <label htmlFor="numResults" className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Hash className="w-3 h-3 text-slate-400" />
            <span>Results</span>
          </label>
          <input
            id="numResults"
            type="number"
            min="1"
            max="50"
            step="1"
            value={input.numResults || 10}
            onChange={(e) => handleChange('numResults', parseInt(e.target.value, 10))}
            placeholder="10"
            className="w-full px-3 py-2 bg-[#0E1524] border border-[#233148] rounded-lg text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Top combinations</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-4 pt-3.5 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span>Optimization priority: <strong>1. Highest Total Impressions</strong> → <strong>2. Lowest Total Spots</strong></span>
        </div>

        <button
          type="button"
          onClick={onOptimize}
          disabled={!hasInventory || isOptimizing || input.targetRate <= 0}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all duration-150 ${
            !hasInventory || input.targetRate <= 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isOptimizing
              ? 'bg-indigo-700 text-indigo-200 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/30 hover:shadow-indigo-600/40 border border-indigo-400/30 cursor-pointer'
          }`}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Calculating Optimum...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Find Combinations</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
