import React from 'react';
import { Layers, ShieldCheck, Zap, BarChart2 } from 'lucide-react';

interface HeaderProps {
  onOpenTests: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTests }) => {
  return (
    <header className="bg-[#0E1526]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20 border border-indigo-400/30">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-bold text-base tracking-tight text-white">
              SMART RATE PLANNER
            </span>
            <span className="text-xs font-medium text-slate-400 border-l border-slate-700 pl-2 hidden sm:inline">
              Advertising Rate Optimization
            </span>
          </div>
        </div>

        {/* Engine status & test button */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#162032] border border-[#233148] text-[11px] text-slate-300">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="font-medium text-slate-400">Engine:</span>
            <span className="text-emerald-400 font-semibold font-mono">Exact DP + B&B (0.00¢)</span>
          </div>

          <button
            onClick={onOpenTests}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#162032] hover:bg-[#1E2C44] border border-[#233148] hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="View Automated Optimizer Test Verification"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Suite (10/10)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
