import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ExcelUpload } from './components/ExcelUpload';
import { PlannerInputs } from './components/PlannerInputs';
import { InventoryPreview } from './components/InventoryPreview';
import { ResultsSummary } from './components/ResultsSummary';
import { ResultCard } from './components/ResultCard';
import { TestSuiteModal } from './components/TestSuiteModal';
import { OptimizationEngine } from './optimizer/engine';
import { SAMPLE_17_ROWS } from './optimizer/sampleData';
import { InventoryRow, OptimizerInput, OptimizerOutput } from './optimizer/types';
import { AlertCircle, HelpCircle, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';

export default function App() {
  // Inventory state (initialized with standard 17-row reference sample dataset)
  const [rows, setRows] = useState<InventoryRow[]>(SAMPLE_17_ROWS);
  const [currentFilename, setCurrentFilename] = useState<string>('sample_inventory_17_rows.xlsx');

  // Planning parameters state
  const [plannerInput, setPlannerInput] = useState<OptimizerInput>({
    rows: SAMPLE_17_ROWS,
    targetRate: 100.0,
    minSpots: 0,
    minImpressions: 0,
    maxSpotsPerRate: 100,
    numResults: 10,
  });

  // Results & status state
  const [optimizerOutput, setOptimizerOutput] = useState<OptimizerOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Sync rows into plannerInput whenever rows change
  const handleDataLoaded = (newRows: InventoryRow[], filename: string) => {
    setRows(newRows);
    setCurrentFilename(filename);
    setPlannerInput((prev) => ({
      ...prev,
      rows: newRows,
    }));
    setErrorMessage(null);
  };

  // Run the locked optimization engine
  const handleRunOptimization = useCallback(() => {
    if (rows.length === 0) {
      setErrorMessage('Please upload an Excel inventory rate sheet or load sample data.');
      return;
    }

    if (plannerInput.targetRate <= 0) {
      setErrorMessage('Target Rate must be greater than $0.00.');
      return;
    }

    setIsOptimizing(true);
    setErrorMessage(null);

    // Run optimization asynchronously with a microtask delay so the UI remains responsive
    setTimeout(() => {
      try {
        const payload: OptimizerInput = {
          ...plannerInput,
          rows,
        };

        const output = OptimizationEngine.optimize(payload);

        if (!output.success) {
          setErrorMessage(output.message || 'No valid combinations found.');
          setOptimizerOutput(null);
        } else {
          setOptimizerOutput(output);
          setErrorMessage(null);
        }
      } catch (err) {
        setErrorMessage(`Optimization error: ${(err as Error).message}`);
        setOptimizerOutput(null);
      } finally {
        setIsOptimizing(false);
      }
    }, 50);
  }, [rows, plannerInput]);

  // Run initial optimization on mount with sample data so the user sees immediate results
  useEffect(() => {
    handleRunOptimization();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Header */}
      <Header onOpenTests={() => setIsTestModalOpen(true)} />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Section: Excel Upload & Planner Inputs (Horizontal Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Upload Card (Col 1-4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <ExcelUpload
              onDataLoaded={handleDataLoaded}
              currentFilename={currentFilename}
              rowCount={rows.length}
            />
          </div>

          {/* Planner Inputs Card (Col 5-12 on desktop) */}
          <div className="lg:col-span-8 flex flex-col">
            <PlannerInputs
              input={plannerInput}
              onChange={setPlannerInput}
              onOptimize={handleRunOptimization}
              isOptimizing={isOptimizing}
              hasInventory={rows.length > 0}
            />
          </div>
        </div>

        {/* 2. Excel Inventory Preview (Collapsible) */}
        <InventoryPreview rows={rows} filename={currentFilename} />

        {/* Error / Warning Alert Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-4 flex items-start space-x-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Optimization Constraint Notice</p>
              <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 3. Results Section */}
        {optimizerOutput && optimizerOutput.success && (
          <div className="space-y-5">
            {/* Results Summary Bar */}
            <ResultsSummary
              results={optimizerOutput.results}
              targetRate={plannerInput.targetRate}
              minSpots={plannerInput.minSpots}
              minImpressions={plannerInput.minImpressions}
              executionTimeMs={optimizerOutput.executionTimeMs}
            />

            {/* List of Ranked Combination Cards */}
            <div className="space-y-3.5">
              {optimizerOutput.results.map((result, idx) => (
                <ResultCard
                  key={result.rank}
                  result={result}
                  targetRate={plannerInput.targetRate}
                  isFirst={idx === 0}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0E1526]/80 py-4 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Rate Planner (SRP) • Enterprise Advertising Rate-Combination Optimization</span>
          <span className="font-mono text-[11px] text-slate-400">Exact Integer Cent Precision • Bounded Dual DP</span>
        </div>
      </footer>

      {/* Automated Optimizer Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
