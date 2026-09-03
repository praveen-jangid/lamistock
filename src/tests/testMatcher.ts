import { calculateCutYield, matchOrderWithInventory } from '../services/matcher';
import { formatDimensions } from '../utils/units';
import { parseDimensionToInches } from '../utils/excelParser';
import { matchBulkOrderWithInventory } from '../services/bulkMatcher';
import type { BulkOrderItem, LaminatedPanel } from '../types/panel';

console.log('--- STARTING MANGO WOOD INCHES TEST SUITE ---');

// Test 1: Cut Yield 96" x 48" full sheet into 48" x 24" pieces
const test1 = calculateCutYield(96, 48, 48, 24, 0.125, true);
console.log('Test 1 (96x48 -> 48x24 pcs):', {
  fits: test1.fits,
  piecesPerSheet: test1.piecesPerSheet,
  wastePercentage: test1.wastePercentage
});
if (test1.piecesPerSheet !== 4) {
  throw new Error(`Expected 4 pieces per panel, got ${test1.piecesPerSheet}`);
}

// Test 2: Match Order with Inventory
const testOrder = {
  orderNumber: 'ORD-TEST-01',
  length: 36,
  width: 24,
  thickness: 0.75,
  quantityNeeded: 4,
  allowRotation: true
};

const sampleTestPanels = [
  {
    id: 'test-panel-1',
    length: 72,
    width: 36,
    thickness: 0.75,
    woodType: 'Teak Wood',
    quantity: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const matches = matchOrderWithInventory(testOrder, sampleTestPanels);
console.log(`Test 2: Found ${matches.length} matching panels for order 36" x 24" x 0.75".`);
matches.forEach((m, i) => {
  console.log(` Match #${i + 1}: ${formatDimensions(m.panel.length, m.panel.width, m.panel.thickness)} | Score: ${m.matchScore}% | Yield: ${m.yieldPerSheet} pcs/panel | Waste: ${m.wastePercentage}%`);
});

if (matches.length === 0) {
  throw new Error('Expected to find matching panels for 36x24 Mango Wood order');
}

// Test 4: Parse Dimension Strings (Decimals, Fractions, and Sut/Soot notation)
if (parseDimensionToInches('28-5\'\'\'') !== 28.625) {
  throw new Error(`Expected 28.625 for 28-5''', got ${parseDimensionToInches('28-5\'\'\'')}`);
}
if (parseDimensionToInches('5/8') !== 0.625) {
  throw new Error(`Expected 0.625 for 5/8, got ${parseDimensionToInches('5/8')}`);
}
if (parseDimensionToInches('15"-6\'\'\'') !== 15.75) {
  throw new Error(`Expected 15.75 for 15"-6''', got ${parseDimensionToInches('15"-6\'\'\'')}`);
}
if (parseDimensionToInches('5soot') !== 0.625) {
  throw new Error(`Expected 0.625 for 5soot, got ${parseDimensionToInches('5soot')}`);
}
if (parseDimensionToInches('0.675') !== 0.675) {
  throw new Error(`Expected 0.675 for 0.675, got ${parseDimensionToInches('0.675')}`);
}
console.log('Test 4 (Dimension Parser): Sut, Soot, and Fraction conversions passed!');

// Test 5: Multi-Item Bulk Order Matcher with Offcut Threshold
const bulkItems: BulkOrderItem[] = [
  {
    id: 'item-1',
    partName: 'Dra. Face',
    length: 27,
    width: 15.75,
    thickness: 1.0,
    quantityNeeded: 10
  },
  {
    id: 'item-2',
    partName: 'Back Panel',
    length: 27,
    width: 15.75,
    thickness: 0.675, // 0.675" thickness requested by user!
    quantityNeeded: 10
  }
];

const mockFactoryStock: LaminatedPanel[] = [
  {
    id: 'stock-panel-1',
    length: 27,
    width: 15.75,
    thickness: 1.0,
    woodType: 'Mango Wood',
    quantity: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stock-panel-2',
    length: 28, // Oversized stock panel (28x16) to test offcut threshold
    width: 16,
    thickness: 0.625, // 5 soot stock panel
    woodType: 'Mango Wood',
    quantity: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const bulkSummary = matchBulkOrderWithInventory('Desk Order', bulkItems, mockFactoryStock);

console.log('Test 5 (Bulk Matcher Candidate Cuts):', {
  totalPiecesNeeded: bulkSummary.totalPiecesNeeded,
  itemsWithStockCount: bulkSummary.itemsWithStockCount,
  item1Candidates: bulkSummary.results[0].candidates.length,
  item2Candidates: bulkSummary.results[1].candidates.length
});

if (bulkSummary.totalPiecesNeeded !== 20) throw new Error('Expected 20 total pieces needed');
if (bulkSummary.itemsWithStockCount !== 2) throw new Error('Expected 2 items with stock');
if (bulkSummary.results[0].candidates.length === 0) throw new Error('Expected candidates for item 1');
if (bulkSummary.results[1].candidates.length === 0) throw new Error('Expected candidates for item 2 (0.675 thickness matching 0.625 stock)');

// Verify ascending offcut ordering
const item2Cands = bulkSummary.results[1].candidates;
for (let i = 1; i < item2Cands.length; i++) {
  if (item2Cands[i].wastePercentage < item2Cands[i - 1].wastePercentage) {
    throw new Error('Expected candidates to be sorted by ascending offcut %');
  }
}

console.log('--- ALL STREAMLINED MANGO WOOD & BULK MATCHER TESTS PASSED SUCCESSFULLY! ---');
