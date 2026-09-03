import { matchOrderWithInventory } from '../services/matcher';
import { matchBulkOrderWithInventory } from '../services/bulk_matcher';
import type { LaminatedPanel, OrderRequirement, BulkOrderItem } from '../types/panel';

console.log('--- RUNNING RAPID STOCK & MULTI-BOARD MATCHING TESTS ---');

// Scenario 1: User adds 2 panels with identical dimensions (11" x 11" x 1" Mango Wood)
// They have different unique IDs and distinct front/back photos.
const boardA: LaminatedPanel = {
  id: 'board-mango-001',
  length: 11,
  width: 11,
  thickness: 1,
  woodType: 'Mango Wood',
  quantity: 1,
  frontImageUrl: 'https://storage.googleapis.com/img_front_board_1.jpg',
  backImageUrl: 'https://storage.googleapis.com/img_back_board_1.jpg',
  notes: 'Clear grain pattern on front',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const boardB: LaminatedPanel = {
  id: 'board-mango-002',
  length: 11,
  width: 11,
  thickness: 1,
  woodType: 'Mango Wood',
  quantity: 1,
  frontImageUrl: 'https://storage.googleapis.com/img_front_board_2.jpg',
  backImageUrl: 'https://storage.googleapis.com/img_back_board_2.jpg',
  notes: 'Dark sapwood streak on back',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const inventory: LaminatedPanel[] = [boardA, boardB];

// Scenario 2: User needs a 10" x 10" x 1" panel for an order
const orderReq: OrderRequirement = {
  orderNumber: 'ORD-TEST-10x10',
  length: 10,
  width: 10,
  thickness: 1,
  quantityNeeded: 1,
  allowRotation: true
};

const singleMatches = matchOrderWithInventory(orderReq, inventory);

console.log(`Single Match Results count: ${singleMatches.length}`);
if (singleMatches.length !== 2) {
  throw new Error(`Expected exactly 2 matching candidates, got ${singleMatches.length}`);
}

// Verify both board IDs are present
const matchedIds = singleMatches.map(m => m.panel.id);
if (!matchedIds.includes('board-mango-001') || !matchedIds.includes('board-mango-002')) {
  throw new Error(`Both board IDs must be uniquely returned. Got: ${matchedIds.join(', ')}`);
}

// Verify distinct photos are preserved
const matchA = singleMatches.find(m => m.panel.id === 'board-mango-001')!;
const matchB = singleMatches.find(m => m.panel.id === 'board-mango-002')!;

if (matchA.panel.frontImageUrl !== 'https://storage.googleapis.com/img_front_board_1.jpg') {
  throw new Error('Board A front photo lost!');
}
if (matchB.panel.backImageUrl !== 'https://storage.googleapis.com/img_back_board_2.jpg') {
  throw new Error('Board B back photo lost!');
}
console.log('✓ Single Matcher correctly returns both same-size boards with their unique photos and IDs!');

// Scenario 3: Bulk Order Matcher with the same requirement
const bulkItems: BulkOrderItem[] = [
  {
    id: 'item-10x10',
    partName: 'Square Top',
    length: 10,
    width: 10,
    thickness: 1,
    quantityNeeded: 1
  }
];

const bulkSummary = matchBulkOrderWithInventory('Test Order', bulkItems, inventory);
const itemCandidates = bulkSummary.results[0].candidates;

console.log(`Bulk Matcher Candidate count: ${itemCandidates.length}`);
if (itemCandidates.length !== 2) {
  throw new Error(`Bulk matcher should return both boards as candidate cuts. Got: ${itemCandidates.length}`);
}

const bulkCandidateIds = itemCandidates.map(c => c.panel.id);
if (!bulkCandidateIds.includes('board-mango-001') || !bulkCandidateIds.includes('board-mango-002')) {
  throw new Error(`Both board IDs must be in bulk candidates. Got: ${bulkCandidateIds.join(', ')}`);
}

console.log('✓ Bulk Matcher correctly displays both same-size boards as distinct selectable candidate cuts!');
console.log('--- ALL MULTI-BOARD UNIQUE MATCH TESTS PASSED! ---');
