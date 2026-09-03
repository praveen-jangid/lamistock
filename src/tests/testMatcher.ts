import { calculateCutYield, matchOrderWithInventory } from '../services/matcher';
import { INITIAL_FACTORY_PANELS } from '../utils/seedData';
import { formatDimensions } from '../utils/units';

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

// Test 3: Pure Inch Formatter
const dimStr = formatDimensions(72, 36, 0.75);
console.log('Test 3 (Dimension Formatter):', dimStr);
if (dimStr !== '72″ × 36″ × 0.75″') {
  throw new Error(`Unexpected formatted string: ${dimStr}`);
}

console.log('--- ALL STREAMLINED MANGO WOOD TESTS PASSED SUCCESSFULLY! ---');
