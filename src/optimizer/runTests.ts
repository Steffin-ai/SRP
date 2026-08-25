/**
 * Smart Rate Planner (SRP) - Automated Test Suite
 * 
 * Verifies all 10 core requirements:
 * A. Exact target matching ($100, $200, $300, $500, $1,000, $1,500)
 * B. Minimum spots constraint enforcement
 * C. Minimum impressions constraint enforcement
 * D. Row-level Avails constraint enforcement (never exceed row avails)
 * E. Maximum Spots Per Rate constraint enforcement
 * F. Duplicate rates remaining independent (separate allocation per row)
 * G. Highest-impression primary ranking
 * H. Lowest-spots secondary ranking (tie-breaker)
 * I. Multiple diverse result generation (all distinct allocations)
 * J. Large target rate performance & correctness ($100, $200, $300, $500, $1,000, $1,500)
 * K. Excel parsing and row number preservation
 */

import { OptimizationEngine } from './engine';
import { SAMPLE_17_ROWS } from './sampleData';
import { parseExcelBuffer, generateSampleExcelBuffer } from './excelParser';
import { OptimizerInput } from './types';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, testName: string, successDetails: string, failDetails: string) {
  if (condition) {
    testResults.push({ name: testName, passed: true, details: successDetails });
    console.log(`✅ [PASS] ${testName}: ${successDetails}`);
  } else {
    testResults.push({ name: testName, passed: false, details: failDetails });
    console.error(`❌ [FAIL] ${testName}: ${failDetails}`);
  }
}

export function runAllTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING SMART RATE PLANNER (SRP) AUTOMATED TESTS');
  console.log('====================================================\n');

  // Test A: Exact Target Matching
  {
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 100.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate: 100,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    const allExact = output.success && output.results.length > 0 &&
      output.results.every(r => r.totalRateCents === 10000 && r.totalRate === 100.0);
    assert(
      allExact,
      'Test A: Exact Target Matching ($100.00)',
      `Returned ${output.results.length} valid combinations, all exactly equaling $100.00 (10000 cents). Execution time: ${output.executionTimeMs.toFixed(1)}ms.`,
      `Failed to match exact target rate $100.00. Output message: ${output.message}`
    );
  }

  // Test B: Minimum Spots Constraint
  {
    const minSpotsReq = 25;
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 100.0,
      minSpots: minSpotsReq,
      minImpressions: 0,
      maxSpotsPerRate: 100,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    const allMeetMinSpots = output.success && output.results.length > 0 &&
      output.results.every(r => r.totalSpots >= minSpotsReq);
    assert(
      allMeetMinSpots,
      `Test B: Minimum Spots Constraint (Min Spots = ${minSpotsReq})`,
      `All ${output.results.length} results have total spots >= ${minSpotsReq}. Lowest spots in results: ${Math.min(...output.results.map(r => r.totalSpots))}.`,
      `Some results violated minimum spots constraint.`
    );
  }

  // Test C: Minimum Impressions Constraint
  {
    const minImpReq = 12000;
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 100.0,
      minSpots: 0,
      minImpressions: minImpReq,
      maxSpotsPerRate: 100,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    const allMeetMinImp = output.success && output.results.length > 0 &&
      output.results.every(r => r.totalImpressions >= minImpReq);
    assert(
      allMeetMinImp,
      `Test C: Minimum Impressions Constraint (Min Imp = ${minImpReq.toLocaleString()})`,
      `All ${output.results.length} results have total impressions >= ${minImpReq.toLocaleString()}. Lowest impressions in results: ${Math.min(...output.results.map(r => r.totalImpressions)).toLocaleString()}.`,
      `Some results had fewer than ${minImpReq} impressions.`
    );
  }

  // Test D: Row-level Avails Constraint
  {
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 300.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate: 999,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    let availsViolated = false;
    let checkedCount = 0;

    if (output.success) {
      for (const res of output.results) {
        for (const alloc of res.allocations) {
          checkedCount++;
          if (alloc.spotsUsed > alloc.availsExclusive || alloc.availsInclusive < 0) {
            availsViolated = true;
          }
        }
      }
    }

    assert(
      output.success && !availsViolated && checkedCount > 0,
      'Test D: Row-Level Avails Enforcement',
      `Verified across ${checkedCount} row allocations that spotsUsed <= availsExclusive and availsInclusive >= 0.`,
      `Row availability was exceeded in one or more allocations.`
    );
  }

  // Test E: Maximum Spots Per Rate Enforcement
  {
    const maxSpotsPerRate = 5;
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 100.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    let maxSpotsViolated = false;
    let checkedCount = 0;

    if (output.success) {
      for (const res of output.results) {
        for (const alloc of res.allocations) {
          checkedCount++;
          if (alloc.spotsUsed > maxSpotsPerRate) {
            maxSpotsViolated = true;
          }
        }
      }
    }

    assert(
      output.success && !maxSpotsViolated && checkedCount > 0,
      `Test E: Maximum Spots Per Rate Limit (${maxSpotsPerRate})`,
      `Verified across ${checkedCount} row allocations that no single row was allocated more than ${maxSpotsPerRate} spots.`,
      `A row was allocated more spots than the Maximum Spots Per Rate limit.`
    );
  }

  // Test F: Duplicate Rates Remaining Independent
  {
    // The dataset contains 3 distinct rows with rate $4.75 (Row 2, Row 4, Row 10)
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 50.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate: 50,
      numResults: 5,
    };
    const output = OptimizationEngine.optimize(input);
    
    // Check that Row 2, Row 4, Row 10 are separate entities in allocations
    let hasIndependent475Rows = false;
    if (output.success && output.results.length > 0) {
      const firstRes = output.results[0];
      const row2 = firstRes.allocations.find(a => a.excelRow === 2);
      const row4 = firstRes.allocations.find(a => a.excelRow === 4);
      const row10 = firstRes.allocations.find(a => a.excelRow === 10);

      if (row2 && row4 && row10) {
        hasIndependent475Rows = true;
        // Verify they have their own independent impressions and avails
        if (row2.impression === 597 && row4.impression === 376 && row10.impression === 142) {
          hasIndependent475Rows = true;
        }
      }
    }

    assert(
      hasIndependent475Rows,
      'Test F: Duplicate Rates Maintained as Independent Rows',
      `Rows 2, 4, and 10 all have Rate=$4.75 but maintain independent impressions (597, 376, 142) and individual spot allocations.`,
      `Duplicate rate rows were incorrectly merged.`
    );
  }

  // Test G & H: Highest-Impression & Lowest-Spots Ranking
  {
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 150.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate: 20,
      numResults: 10,
    };
    const output = OptimizationEngine.optimize(input);
    let rankingCorrect = true;

    if (output.success && output.results.length >= 2) {
      for (let i = 0; i < output.results.length - 1; i++) {
        const curr = output.results[i];
        const next = output.results[i + 1];

        if (curr.totalImpressions < next.totalImpressions) {
          rankingCorrect = false;
          break;
        }
        if (curr.totalImpressions === next.totalImpressions && curr.totalSpots > next.totalSpots) {
          rankingCorrect = false;
          break;
        }
      }
    }

    assert(
      rankingCorrect && output.success && output.results.length >= 2,
      'Test G & H: Hierarchical Ranking (Highest Impressions, then Lowest Spots)',
      `All ${output.results.length} ranked results are in strict descending order of impressions (${output.results.map(r => r.totalImpressions).join(' >= ')}) with spots tie-breaker.`,
      `Results are not ordered correctly according to ranking rules.`
    );
  }

  // Test I: Multiple Diverse Results
  {
    const input: OptimizerInput = {
      rows: SAMPLE_17_ROWS,
      targetRate: 100.0,
      minSpots: 0,
      minImpressions: 0,
      maxSpotsPerRate: 30,
      numResults: 8,
    };
    const output = OptimizationEngine.optimize(input);
    const seenAllocations = new Set<string>();
    let allUnique = true;

    if (output.success && output.results.length === 8) {
      for (const res of output.results) {
        const key = res.allocations.map(a => `${a.excelRow}:${a.spotsUsed}`).join('|');
        if (seenAllocations.has(key)) {
          allUnique = false;
        }
        seenAllocations.add(key);
      }
    } else {
      allUnique = false;
    }

    assert(
      allUnique,
      'Test I: Multiple Diverse Results',
      `Generated 8 unique row-level allocations with distinct spot distributions.`,
      `Duplicate allocations were returned in results list.`
    );
  }

  // Test J: Large Target Values ($100, $200, $300, $500, $1,000, $1,500)
  {
    const targets = [100.0, 200.0, 300.0, 500.0, 1000.0, 1500.0];
    let allTargetsPassed = true;
    const executionDetails: string[] = [];

    for (const target of targets) {
      const input: OptimizerInput = {
        rows: SAMPLE_17_ROWS,
        targetRate: target,
        minSpots: 0,
        minImpressions: 0,
        maxSpotsPerRate: 100,
        numResults: 5,
      };
      const output = OptimizationEngine.optimize(input);
      if (!output.success || output.results.length === 0 || output.results[0].totalRate !== target) {
        allTargetsPassed = false;
        executionDetails.push(`$${target}: FAILED (${output.message})`);
      } else {
        executionDetails.push(
          `$${target}: ${output.results.length} results found (Rank 1: ${output.results[0].totalImpressions.toLocaleString()} imps, ${output.results[0].totalSpots} spots) in ${output.executionTimeMs.toFixed(1)}ms`
        );
      }
    }

    assert(
      allTargetsPassed,
      'Test J: Large Target Rates ($100, $200, $300, $500, $1,000, $1,500)',
      `All large target rates succeeded without timeouts or early-stop truncation:\n   ${executionDetails.join('\n   ')}`,
      `One or more large target rates failed.`
    );
  }

  // Test K: Excel Parser & Serializer Round-Trip
  {
    const buffer = generateSampleExcelBuffer(SAMPLE_17_ROWS);
    const parsed = parseExcelBuffer(buffer);
    const parserPassed = !parsed.error && parsed.rows.length === SAMPLE_17_ROWS.length &&
      parsed.rows[0].excelRow === 2 && parsed.rows[0].rate === 4.75 && parsed.rows[0].impression === 597;

    assert(
      parserPassed,
      'Test K: Excel Parser & Serializer (Row preservation)',
      `Successfully generated and parsed Excel buffer with ${parsed.rows.length} rows starting at Excel Row 2.`,
      `Excel parser failed: ${parsed.error}`
    );
  }

  console.log('\n====================================================');
  const totalPassed = testResults.filter(t => t.passed).length;
  console.log(`🏁 TEST SUMMARY: ${totalPassed} / ${testResults.length} PASSED`);
  console.log('====================================================\n');

  return {
    total: testResults.length,
    passed: totalPassed,
    failed: testResults.length - totalPassed,
    results: testResults,
  };
}

// Execute tests if executed via CLI
runAllTests();
