import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { InventoryRow } from '../optimizer/types';

interface InventoryPreviewProps {
  rows: InventoryRow[];
  filename: string;
}

export const InventoryPreview: React.FC<InventoryPreviewProps> = ({ rows, filename }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (rows.length === 0) return null;

  const totalAvails = rows.reduce((acc, r) => acc + r.avails, 0);
  const totalMaxSpend = rows.reduce((acc, r) => acc + r.avails * r.rate, 0);

  return (
    <div className="bg-[#111928] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-[#131E30] border-b border-[#1E293B] flex items-center justify-between cursor-pointer hover:bg-[#17243A] transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <Database className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white tracking-tight uppercase">
            Excel Inventory Preview
          </span>
          <span className="text-[11px] text-slate-400 bg-[#0E1524] px-2 py-0.5 rounded border border-[#1E293B] font-mono">
            {rows.length} rows ({filename})
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Total Avails: <strong className="text-slate-200 font-mono">{totalAvails.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Max Capacity: <strong className="text-emerald-400 font-mono">${totalMaxSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-white p-0.5 rounded"
            aria-label={isExpanded ? 'Collapse table' : 'Expand table'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Table Content */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0E1524] text-slate-400 sticky top-0 z-10 border-b border-[#1E293B] font-semibold">
              <tr>
                <th className="py-2 px-3 text-slate-400 w-24">Excel Row</th>
                <th className="py-2 px-3 text-right">Rate ($)</th>
                <th className="py-2 px-3 text-right">Impression / Spot</th>
                <th className="py-2 px-3 text-right">Avails (Exclusive)</th>
                <th className="py-2 px-3 text-right">Max Row Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A253A] font-mono">
              {rows.map((r, idx) => (
                <tr
                  key={`${r.excelRow}-${idx}`}
                  className="hover:bg-[#162136] transition-colors"
                >
                  <td className="py-1.5 px-3 font-semibold text-indigo-400">
                    Row {r.excelRow}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-200 font-semibold">
                    ${r.rate.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300">
                    {r.impression.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300">
                    {r.avails.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400">
                    ${(r.rate * r.avails).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
