/**
 * Smart Rate Planner (SRP) - Sample 17-Row Inventory Dataset
 * As specified in user prompt, preserving duplicate rates on distinct rows with distinct impressions/avails.
 */

import { InventoryRow } from './types';

export const SAMPLE_17_ROWS: InventoryRow[] = [
  { excelRow: 2, rate: 4.75, rateCents: 475, impression: 597, avails: 71, id: 'row-2' },
  { excelRow: 3, rate: 15.00, rateCents: 1500, impression: 1168, avails: 135, id: 'row-3' },
  { excelRow: 4, rate: 4.75, rateCents: 475, impression: 376, avails: 81, id: 'row-4' },
  { excelRow: 5, rate: 10.25, rateCents: 1025, impression: 510, avails: 118, id: 'row-5' },
  { excelRow: 6, rate: 3.25, rateCents: 325, impression: 113, avails: 82, id: 'row-6' },
  { excelRow: 7, rate: 4.25, rateCents: 425, impression: 221, avails: 133, id: 'row-7' },
  { excelRow: 8, rate: 1.50, rateCents: 150, impression: 71, avails: 85, id: 'row-8' },
  { excelRow: 9, rate: 4.00, rateCents: 400, impression: 96, avails: 124, id: 'row-9' },
  { excelRow: 10, rate: 4.75, rateCents: 475, impression: 142, avails: 58, id: 'row-10' },
  { excelRow: 11, rate: 8.00, rateCents: 800, impression: 278, avails: 79, id: 'row-11' },
  { excelRow: 12, rate: 6.50, rateCents: 650, impression: 450, avails: 90, id: 'row-12' },
  { excelRow: 13, rate: 12.00, rateCents: 1200, impression: 920, avails: 60, id: 'row-13' },
  { excelRow: 14, rate: 2.50, rateCents: 250, impression: 150, avails: 110, id: 'row-14' },
  { excelRow: 15, rate: 5.00, rateCents: 500, impression: 310, avails: 95, id: 'row-15' },
  { excelRow: 16, rate: 7.50, rateCents: 750, impression: 480, avails: 70, id: 'row-16' },
  { excelRow: 17, rate: 9.00, rateCents: 900, impression: 620, avails: 85, id: 'row-17' },
  { excelRow: 18, rate: 20.00, rateCents: 2000, impression: 1850, avails: 40, id: 'row-18' },
];
