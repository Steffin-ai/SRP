/**
 * Smart Rate Planner (SRP) - Core Data Types & Interfaces
 */

export interface InventoryRow {
  /** 1-based Excel row number (Row 2 is first data row) */
  excelRow: number;
  /** Rate in dollars, e.g. 4.75 */
  rate: number;
  /** Rate converted to integer cents, e.g. 475 */
  rateCents: number;
  /** Impressions contributed per spot */
  impression: number;
  /** Original available spots in Excel (Avails Exclusive) */
  avails: number;
  /** Optional custom identifier */
  id: string;
}

export interface OptimizerInput {
  /** Inventory rows parsed from Excel (independent, unmerged) */
  rows: InventoryRow[];
  /** Target total spend in dollars, e.g. 100.00 */
  targetRate: number;
  /** Minimum required total spots */
  minSpots: number;
  /** Minimum required total impressions */
  minImpressions: number;
  /** User-defined limit on maximum usable spots for any single row */
  maxSpotsPerRate: number;
  /** Maximum number of diverse top results to return */
  numResults: number;
}

export interface ResultRowAllocation {
  excelRow: number;
  rate: number;
  rateCents: number;
  impression: number;
  spotsUsed: number;
  rateContribution: number;
  rateContributionCents: number;
  impressionContribution: number;
  /** Original available inventory from Excel */
  availsExclusive: number;
  /** Remaining inventory after spot allocation (availsExclusive - spotsUsed) */
  availsInclusive: number;
}

export interface OptimizationResult {
  rank: number;
  totalRate: number;
  totalRateCents: number;
  totalSpots: number;
  totalImpressions: number;
  allocations: ResultRowAllocation[];
}

export interface OptimizerOutput {
  success: boolean;
  message?: string;
  results: OptimizationResult[];
  executionTimeMs: number;
  totalCombinationsEvaluated?: number;
}
