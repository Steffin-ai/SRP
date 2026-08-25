/**
 * Smart Rate Planner (SRP) - Excel Parser & Serializer
 */

import * as XLSX from 'xlsx';
import { InventoryRow, OptimizationResult } from './types';

/**
 * Parses an Excel file (.xlsx, .xls, .csv) into normalized InventoryRow records.
 * Maintains exact Excel row numbers and keeps all rows independent.
 */
export function parseExcelBuffer(buffer: ArrayBuffer | Uint8Array): { rows: InventoryRow[]; error?: string } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { rows: [], error: 'Excel workbook contains no sheets.' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet || !sheet['!ref']) {
      return { rows: [], error: 'The first worksheet is empty.' };
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    // Find column headers in the first row(s)
    let headerRowIdx = -1;
    let rateColIdx = -1;
    let impColIdx = -1;
    let availsColIdx = -1;

    // Scan the first few rows to locate headers
    for (let R = range.s.r; R <= Math.min(range.e.r, 5); ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        if (cell && cell.v !== undefined) {
          const valStr = String(cell.v).trim().toLowerCase();
          if (valStr.includes('rate') || valStr.includes('cost') || valStr === 'cpm') {
            rateColIdx = C;
          } else if (valStr.includes('impression') || valStr === 'imp' || valStr === 'imps') {
            impColIdx = C;
          } else if (valStr.includes('avail') || valStr.includes('spots') || valStr === 'inventory') {
            availsColIdx = C;
          }
        }
      }
      if (rateColIdx !== -1 && impColIdx !== -1 && availsColIdx !== -1) {
        headerRowIdx = R;
        break;
      }
    }

    // Default fallback if headers weren't named identically: assume col 0 = Rate, col 1 = Impression, col 2 = Avails
    if (headerRowIdx === -1) {
      headerRowIdx = range.s.r;
      rateColIdx = 0;
      impColIdx = 1;
      availsColIdx = 2;
    }

    const rows: InventoryRow[] = [];

    // Parse data rows starting after the header
    for (let R = headerRowIdx + 1; R <= range.e.r; ++R) {
      const rateCell = sheet[XLSX.utils.encode_cell({ r: R, c: rateColIdx })];
      const impCell = sheet[XLSX.utils.encode_cell({ r: R, c: impColIdx })];
      const availsCell = sheet[XLSX.utils.encode_cell({ r: R, c: availsColIdx })];

      if (!rateCell && !impCell && !availsCell) {
        continue; // skip completely empty rows
      }

      const parseNumeric = (cell: XLSX.CellObject | undefined): number => {
        if (!cell || cell.v === undefined || cell.v === null || cell.v === '') return 0;
        if (typeof cell.v === 'number') return cell.v;
        const cleaned = String(cell.v).replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      const rateNum = parseNumeric(rateCell);
      const impNum = Math.round(parseNumeric(impCell));
      const availsNum = Math.round(parseNumeric(availsCell));

      // Skip rows where all values are 0 or invalid
      if (rateNum <= 0 && impNum <= 0 && availsNum <= 0) {
        continue;
      }

      // Excel row numbers are 1-based (R is 0-based in sheetjs)
      const excelRowNum = R + 1;

      // Rate in integer cents to prevent floating point inaccuracies
      const rateCents = Math.round(rateNum * 100);

      rows.push({
        excelRow: excelRowNum,
        rate: rateNum,
        rateCents,
        impression: impNum,
        avails: availsNum,
        id: `row-${excelRowNum}-${rateCents}-${impNum}`,
      });
    }

    if (rows.length === 0) {
      return { rows: [], error: 'No valid inventory rows found in the Excel file.' };
    }

    return { rows };
  } catch (err) {
    return { rows: [], error: `Failed to parse Excel file: ${(err as Error).message}` };
  }
}

/**
 * Creates an ArrayBuffer containing an Excel template with standard columns and sample data.
 */
export function generateSampleExcelBuffer(sampleRows: InventoryRow[]): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Rate', 'Impression', 'Avails'],
    ...sampleRows.map(r => [r.rate, r.impression, r.avails]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
}

/**
 * Exports optimizer results into an Excel workbook.
 */
export function exportResultsToExcel(results: OptimizationResult[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = results.map(r => ({
    Rank: r.rank,
    'Total Rate ($)': r.totalRate.toFixed(2),
    'Total Spots': r.totalSpots,
    'Total Impressions': r.totalImpressions,
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Rankings Summary');

  // Detailed sheet
  const detailedRows: any[] = [];
  results.forEach(r => {
    r.allocations.forEach(a => {
      detailedRows.push({
        Rank: r.rank,
        'Excel Row': a.excelRow,
        'Rate ($)': a.rate.toFixed(2),
        'Impression / Spot': a.impression,
        'Spots Used': a.spotsUsed,
        'Rate Contribution ($)': a.rateContribution.toFixed(2),
        'Impression Contribution': a.impressionContribution,
        'Avails Exclusive (Original)': a.availsExclusive,
        'Avails Inclusive (Remaining)': a.availsInclusive,
      });
    });
  });

  const wsDetail = XLSX.utils.json_to_sheet(detailedRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detailed Allocations');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}
