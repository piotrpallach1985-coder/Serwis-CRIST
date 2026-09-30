export interface Batch {
  qty: number;
  price?: number;
  unitPrice?: number;
}

export interface IssueDetail {
  qty: number;
  price: number;
}

export interface FifoResult {
  newBatches: Batch[];
  totalCost: number;
  issueDetails: IssueDetail[];
}

/**
 * Oblicza koszt wydania na podstawie metody FIFO i aktualizuje stan partii (batches).
 * Zwraca obiekt z nowymi partiami, całkowitym kosztem, i szczegółami wydania.
 *
 * @param quantityToIssue Ilość do wydania
 * @param currentBatches Tablica aktualnych partii z magazynu
 */
export function calculateFifoIssue(quantityToIssue: number, currentBatches: Batch[]): FifoResult {
  let remainingToIssue: number = quantityToIssue;
  let totalCost: number = 0;
  let issueDetails: IssueDetail[] = [];
  
  // Clone batches deeply to prevent mutating original before we are sure
  let newBatches: Batch[] = currentBatches.map(b => ({ ...b }));

  while (remainingToIssue > 0 && newBatches.length > 0) {
    let oldestBatch = newBatches[0];
    
    if (oldestBatch.qty <= remainingToIssue) {
      totalCost += oldestBatch.qty * (oldestBatch.price || oldestBatch.unitPrice || 0);
      issueDetails.push({ qty: oldestBatch.qty, price: (oldestBatch.price || oldestBatch.unitPrice || 0) });
      remainingToIssue -= oldestBatch.qty;
      newBatches.shift();
    } else {
      totalCost += remainingToIssue * (oldestBatch.price || oldestBatch.unitPrice || 0);
      issueDetails.push({ qty: remainingToIssue, price: (oldestBatch.price || oldestBatch.unitPrice || 0) });
      oldestBatch.qty -= remainingToIssue;
      remainingToIssue = 0;
    }
  }

  // Jeśli pozostała ilość, a brakuje partii magazynowych, to FIFO uważa to za sytuację brzegową.
  // W naszym systemie pozwalamy na to (jeśli błędy synchronizacji), ale z ceną = 0
  if (remainingToIssue > 0) {
    issueDetails.push({ qty: remainingToIssue, price: 0 });
  }

  return { newBatches, totalCost, issueDetails };
}
