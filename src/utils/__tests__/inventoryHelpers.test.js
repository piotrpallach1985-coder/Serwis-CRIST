import { describe, it, expect } from 'vitest';
import { calculateFifoIssue } from '../inventoryHelpers';

describe('Inventory FIFO Calculations', () => {
  it('should correctly calculate costs and deplete batches when issuing parts', () => {
    const currentBatches = [
      { qty: 10, price: 50 },  // Oldest
      { qty: 20, price: 60 }   // Newest
    ];

    // Issue 15 parts
    // Expected: takes 10 from oldest (10 * 50 = 500)
    // takes 5 from newest (5 * 60 = 300)
    // Total cost: 800
    // Remaining batches: [ { qty: 15, price: 60 } ]

    const result = calculateFifoIssue(15, currentBatches);

    expect(result.totalCost).toBe(800);
    expect(result.issueDetails.length).toBe(2);
    expect(result.issueDetails[0]).toEqual({ qty: 10, price: 50 });
    expect(result.issueDetails[1]).toEqual({ qty: 5, price: 60 });
    
    expect(result.newBatches.length).toBe(1);
    expect(result.newBatches[0]).toEqual({ qty: 15, price: 60 });
  });

  it('should handle issuing exactly one batch size', () => {
    const currentBatches = [{ qty: 10, price: 100 }];
    const result = calculateFifoIssue(10, currentBatches);
    
    expect(result.totalCost).toBe(1000);
    expect(result.newBatches.length).toBe(0);
  });

  it('should fallback to 0 cost if quantity exceeds available batches', () => {
    const currentBatches = [{ qty: 5, price: 10 }];
    const result = calculateFifoIssue(10, currentBatches);
    
    // Total cost should be 5 * 10 = 50. The remaining 5 are issued at price 0.
    expect(result.totalCost).toBe(50);
    expect(result.newBatches.length).toBe(0);
    expect(result.issueDetails.length).toBe(2);
    expect(result.issueDetails[1]).toEqual({ qty: 5, price: 0 });
  });

  it('should correctly handle unitPrice alias (backward compatibility)', () => {
    const currentBatches = [
      { qty: 10, unitPrice: 20 }
    ];

    const result = calculateFifoIssue(5, currentBatches);

    expect(result.totalCost).toBe(100);
    expect(result.newBatches[0].qty).toBe(5);
  });
});
