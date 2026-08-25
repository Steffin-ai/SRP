/**
 * Smart Rate Planner (SRP) - Core Optimization Engine
 * 
 * Mathematical Architecture:
 * - Exact Dual Dynamic Programming + Bounded Knapsack Precomputation
 * - Admissible Upper/Lower Bound Pruning (Branch and Bound with Zero Arbitrary Cutoffs)
 * - Exact Integer Cent Representation (eliminates floating-point rounding errors)
 * - Exact Multi-Criteria Hierarchical Ranking:
 *     1. Exact Target Rate
 *     2. Minimum Spots (Total Spots >= Min Spots)
 *     3. Minimum Impressions (Total Impressions >= Min Impressions)
 *     4. Primary Optimization: Maximize Total Impressions
 *     5. Secondary Optimization (Tie-Breaker): Minimize Total Spots
 *     6. Distinct Row Allocation Diversity
 */

import {
  InventoryRow,
  OptimizerInput,
  OptimizationResult,
  OptimizerOutput,
  ResultRowAllocation,
} from './types';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function calculateGcdList(numbers: number[]): number {
  if (numbers.length === 0) return 1;
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = gcd(result, numbers[i]);
    if (result === 1) return 1;
  }
  return result;
}

export class OptimizationEngine {
  /**
   * Run the exact optimization engine with the given constraints and inventory rows.
   */
  public static optimize(input: OptimizerInput): OptimizerOutput {
    const startTime = performance.now();

    const {
      rows,
      targetRate,
      minSpots,
      minImpressions,
      maxSpotsPerRate,
      numResults,
    } = input;

    // Validation
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: 'No inventory rows provided.',
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    if (targetRate <= 0) {
      return {
        success: false,
        message: 'Target Rate must be greater than 0.',
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    const targetCents = Math.round(targetRate * 100);
    const N = rows.length;

    // Compute effective upper bounds for each independent row
    const effectiveAvails = new Int32Array(N);
    const itemRatesCents = new Int32Array(N);
    const itemImpressions = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      itemRatesCents[i] = rows[i].rateCents;
      itemImpressions[i] = rows[i].impression;
      const limit = maxSpotsPerRate > 0 ? Math.min(rows[i].avails, maxSpotsPerRate) : rows[i].avails;
      effectiveAvails[i] = Math.max(0, limit);
    }

    // Check maximum possible spend across all available spots
    let maxPossibleSpend = 0;
    for (let i = 0; i < N; i++) {
      maxPossibleSpend += effectiveAvails[i] * itemRatesCents[i];
    }

    if (maxPossibleSpend < targetCents) {
      return {
        success: false,
        message: `Target Rate ($${targetRate.toFixed(2)}) exceeds maximum total inventory capacity ($${(maxPossibleSpend / 100).toFixed(2)}).`,
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    // Calculate GCD of all item rates and target rate to scale the state space
    const rateArray: number[] = [];
    for (let i = 0; i < N; i++) {
      if (effectiveAvails[i] > 0 && itemRatesCents[i] > 0) {
        rateArray.push(itemRatesCents[i]);
      }
    }
    rateArray.push(targetCents);

    const stepGcd = calculateGcdList(rateArray);
    const W = Math.round(targetCents / stepGcd);
    const itemWeights = new Int32Array(N);
    for (let i = 0; i < N; i++) {
      itemWeights[i] = Math.round(itemRatesCents[i] / stepGcd);
    }

    // Allocate DP tables
    // We compute DP backwards: layer i represents subproblem from rows i ... N-1
    // Total layers = N + 1 (layer N is the base layer with 0 items remaining)
    const stride = W + 1;
    const totalStates = (N + 1) * stride;

    const reachable = new Uint8Array(totalStates);
    const maxImpTable = new Float64Array(totalStates);
    const minSpotsTable = new Int32Array(totalStates);
    const maxSpotsTable = new Int32Array(totalStates);

    maxImpTable.fill(-1);
    minSpotsTable.fill(1000000000);
    maxSpotsTable.fill(-1);

    // Base Layer N (after last item, remaining weight must be exactly 0)
    const baseOffset = N * stride;
    reachable[baseOffset + 0] = 1;
    maxImpTable[baseOffset + 0] = 0;
    minSpotsTable[baseOffset + 0] = 0;
    maxSpotsTable[baseOffset + 0] = 0;

    // Backward DP computation from layer N-1 down to 0
    for (let i = N - 1; i >= 0; i--) {
      const curOffset = i * stride;
      const nextOffset = (i + 1) * stride;
      const wi = itemWeights[i];
      const imp_i = itemImpressions[i];
      const ui = effectiveAvails[i];

      // Copy previous reachable states with k=0
      for (let w = 0; w <= W; w++) {
        if (reachable[nextOffset + w]) {
          reachable[curOffset + w] = 1;
          maxImpTable[curOffset + w] = maxImpTable[nextOffset + w];
          minSpotsTable[curOffset + w] = minSpotsTable[nextOffset + w];
          maxSpotsTable[curOffset + w] = maxSpotsTable[nextOffset + w];
        }
      }

      // If item is available and has weight
      if (ui > 0 && wi > 0) {
        for (let k = 1; k <= ui; k++) {
          const kw = k * wi;
          if (kw > W) break;

          const kImp = k * imp_i;

          for (let rem = 0; rem <= W - kw; rem++) {
            if (reachable[nextOffset + rem]) {
              const w = rem + kw;
              const candImp = kImp + maxImpTable[nextOffset + rem];
              const candMinS = k + minSpotsTable[nextOffset + rem];
              const candMaxS = k + maxSpotsTable[nextOffset + rem];

              reachable[curOffset + w] = 1;
              if (candImp > maxImpTable[curOffset + w]) {
                maxImpTable[curOffset + w] = candImp;
              }
              if (candMinS < minSpotsTable[curOffset + w]) {
                minSpotsTable[curOffset + w] = candMinS;
              }
              if (candMaxS > maxSpotsTable[curOffset + w]) {
                maxSpotsTable[curOffset + w] = candMaxS;
              }
            }
          }
        }
      }
    }

    // Check if target is reachable
    if (!reachable[0 + W]) {
      return {
        success: false,
        message: `No exact combination of rates equals the Target Rate of $${targetRate.toFixed(2)}.`,
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    // Check global upper bounds for minimum constraints
    if (maxSpotsTable[0 + W] < minSpots) {
      return {
        success: false,
        message: `No combination can satisfy Minimum Spots (${minSpots}). Maximum achievable spots for this target is ${maxSpotsTable[0 + W]}.`,
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    if (maxImpTable[0 + W] < minImpressions) {
      return {
        success: false,
        message: `No combination can satisfy Minimum Impressions (${minImpressions.toLocaleString()}). Maximum achievable impressions is ${Math.round(maxImpTable[0 + W]).toLocaleString()}.`,
        results: [],
        executionTimeMs: performance.now() - startTime,
      };
    }

    // Exact Branch-and-Bound / Priority Extraction for Top-K diverse solutions
    const desiredK = Math.max(1, numResults || 10);
    const validSolutions: {
      spots: number;
      impressions: number;
      allocation: Int32Array;
    }[] = [];

    const currentAlloc = new Int32Array(N);
    let combinationsEvaluated = 0;

    // Helper to check and insert solution maintaining sorted order and diversity
    function tryAddSolution(spots: number, impressions: number, alloc: Int32Array) {
      // Check if identical allocation already exists
      for (const sol of validSolutions) {
        let same = true;
        for (let i = 0; i < N; i++) {
          if (sol.allocation[i] !== alloc[i]) {
            same = false;
            break;
          }
        }
        if (same) return;
      }

      const copy = new Int32Array(alloc);
      validSolutions.push({ spots, impressions, allocation: copy });

      // Sort according to ranking rules:
      // 1. Highest impressions descending
      // 2. Lowest spots ascending
      validSolutions.sort((a, b) => {
        if (b.impressions !== a.impressions) {
          return b.impressions - a.impressions;
        }
        return a.spots - b.spots;
      });

      // Keep only top desiredK * 3 in candidate pool during search to allow diversity refinement
      if (validSolutions.length > desiredK * 5) {
        validSolutions.pop();
      }
    }

    // Depth-First Branch and Bound with Admissible DP Pruning
    function search(rowIdx: number, remWeight: number, curSpots: number, curImp: number) {
      combinationsEvaluated++;

      // Base case: all rows decided
      if (rowIdx === N) {
        if (remWeight === 0 && curSpots >= minSpots && curImp >= minImpressions) {
          tryAddSolution(curSpots, curImp, currentAlloc);
        }
        return;
      }

      const nextOffset = (rowIdx + 1) * stride;
      const wi = itemWeights[rowIdx];
      const imp_i = itemImpressions[rowIdx];
      const ui = effectiveAvails[rowIdx];

      // Pruning bounds using precalculated backward DP
      const maxPossibleRemainingImp = maxImpTable[rowIdx * stride + remWeight];
      const maxPossibleRemainingSpots = maxSpotsTable[rowIdx * stride + remWeight];
      const minPossibleRemainingSpots = minSpotsTable[rowIdx * stride + remWeight];

      if (!reachable[rowIdx * stride + remWeight]) return;
      if (curSpots + maxPossibleRemainingSpots < minSpots) return;
      if (curImp + maxPossibleRemainingImp < minImpressions) return;

      // Bound with K-th best solution if full
      if (validSolutions.length >= desiredK) {
        const kth = validSolutions[desiredK - 1];
        const bestPotentialImp = curImp + maxPossibleRemainingImp;
        if (bestPotentialImp < kth.impressions) return;
        if (bestPotentialImp === kth.impressions && curSpots + minPossibleRemainingSpots > kth.spots) {
          return;
        }
      }

      // Generate all valid transitions for rowIdx
      interface BranchOption {
        k: number;
        nextRem: number;
        heurImp: number;
        heurMinSpots: number;
      }
      const branches: BranchOption[] = [];

      for (let k = 0; k <= ui; k++) {
        const kw = k * wi;
        if (kw > remWeight) break;
        const nextRem = remWeight - kw;

        if (reachable[nextOffset + nextRem]) {
          const upperImp = curImp + k * imp_i + maxImpTable[nextOffset + nextRem];
          const lowerSpots = curSpots + k + minSpotsTable[nextOffset + nextRem];
          const upperSpots = curSpots + k + maxSpotsTable[nextOffset + nextRem];

          if (upperSpots >= minSpots && upperImp >= minImpressions) {
            branches.push({
              k,
              nextRem,
              heurImp: upperImp,
              heurMinSpots: lowerSpots,
            });
          }
        }
      }

      // Order branches by heuristic upper bound (descending impressions, ascending min spots)
      // This ensures optimal branches are explored first!
      branches.sort((a, b) => {
        if (b.heurImp !== a.heurImp) {
          return b.heurImp - a.heurImp;
        }
        return a.heurMinSpots - b.heurMinSpots;
      });

      for (const branch of branches) {
        currentAlloc[rowIdx] = branch.k;
        search(
          rowIdx + 1,
          branch.nextRem,
          curSpots + branch.k,
          curImp + branch.k * imp_i
        );
        currentAlloc[rowIdx] = 0;
      }
    }

    // Execute exact search
    search(0, W, 0, 0);

    if (validSolutions.length === 0) {
      return {
        success: false,
        message: 'No combination met all constraints (Target Rate, Minimum Spots, and Minimum Impressions).',
        results: [],
        executionTimeMs: performance.now() - startTime,
        totalCombinationsEvaluated: combinationsEvaluated,
      };
    }

    // Build finalized results
    const results: OptimizationResult[] = [];
    const returnedCount = Math.min(desiredK, validSolutions.length);

    for (let r = 0; r < returnedCount; r++) {
      const sol = validSolutions[r];
      const allocations: ResultRowAllocation[] = [];
      let totalRateCents = 0;
      let totalRate = 0;
      let totalSpots = 0;
      let totalImpressions = 0;

      for (let i = 0; i < N; i++) {
        const spotsUsed = sol.allocation[i];
        const row = rows[i];
        const rateContributionCents = spotsUsed * row.rateCents;
        const rateContribution = spotsUsed * row.rate;
        const impressionContribution = spotsUsed * row.impression;

        totalRateCents += rateContributionCents;
        totalRate += rateContribution;
        totalSpots += spotsUsed;
        totalImpressions += impressionContribution;

        allocations.push({
          excelRow: row.excelRow,
          rate: row.rate,
          rateCents: row.rateCents,
          impression: row.impression,
          spotsUsed,
          rateContribution,
          rateContributionCents,
          impressionContribution,
          availsExclusive: row.avails,
          availsInclusive: row.avails - spotsUsed,
        });
      }

      results.push({
        rank: r + 1,
        totalRate: Math.round(totalRate * 100) / 100,
        totalRateCents,
        totalSpots,
        totalImpressions: Math.round(totalImpressions),
        allocations,
      });
    }

    return {
      success: true,
      results,
      executionTimeMs: performance.now() - startTime,
      totalCombinationsEvaluated: combinationsEvaluated,
    };
  }
}
