import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { InventoryRow } from '../optimizer/types';
import { parseExcelBuffer, generateSampleExcelBuffer } from '../optimizer/excelParser';
import { SAMPLE_17_ROWS } from '../optimizer/sampleData';

interface ExcelUploadProps {
  onDataLoaded: (rows: InventoryRow[], filename: string) => void;
  currentFilename: string;
  rowCount: number;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  onDataLoaded,
  currentFilename,
  rowCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelBuffer(buffer);
      if (result.error || result.rows.length === 0) {
        setErrorMessage(result.error || 'No valid rows found in Excel sheet.');
        return;
      }
      onDataLoaded(result.rows, file.name);
    } catch (err) {
      setErrorMessage(`Failed to read file: ${(err as Error).message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    setErrorMessage(null);
    onDataLoaded(SAMPLE_17_ROWS, 'sample_inventory_17_rows.xlsx');
  };

  const handleDownloadTemplate = () => {
    const buffer = generateSampleExcelBuffer(SAMPLE_17_ROWS);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'srp_rate_sheet_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111928] border border-[#1E293B] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white tracking-tight">
            Inventory Rate Sheet
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 px-2 py-1 rounded bg-[#162032] border border-[#233148] transition-colors"
            title="Download formatted Excel (.xlsx) template"
          >
            <Download className="w-3 h-3" />
            <span>Template</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSampleData}
            className="text-[11px] text-indigo-300 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-indigo-950/50 border border-indigo-700/40 hover:bg-indigo-900/60 transition-colors"
            title="Load standard 17-row reference test data"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Load 17-Row Sample</span>
          </button>
        </div>
      </div>

      {/* Drag & drop upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : rowCount > 0
            ? 'border-[#23334D] bg-[#0E1524] hover:border-indigo-500/50'
            : 'border-[#28354D] bg-[#0E1524] hover:border-indigo-500/50 hover:bg-[#131D30]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {rowCount > 0 ? (
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
                  {currentFilename}
                </p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {rowCount} independent inventory rows loaded
                </p>
              </div>
            </div>
            <span className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium bg-[#162032] px-2.5 py-1 rounded border border-[#233148]">
              Replace File
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Upload className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">
                <span className="text-indigo-400 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-400">Excel (.xlsx) with Rate, Impression, Avails columns</p>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-md px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
