/**
 * Daily production batch allocation — e.g. the Mutoko bakery line. Street
 * vendors and tuck shops ordering via WhatsApp draw dynamically from a
 * fixed daily run instead of an unbounded catalogue quantity, so the 800th
 * loaf ordered today can't oversell a batch that only made 600.
 */

interface DailyBatch {
  id: string;
  productId: string;
  label: string;
  producedQty: number;
  allocatedQty: number;
  productionDate: string;
}

const batches = new Map<string, DailyBatch>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function seedTodaysBatches() {
  const date = today();
  const seedKey = `bakery-bread-${date}`;
  if (!batches.has(seedKey)) {
    batches.set(seedKey, {
      id: seedKey,
      productId: 'bread-loaf',
      label: 'Mutoko Bakery Line — White Bread Loaf',
      producedQty: 600,
      allocatedQty: 0,
      productionDate: date,
    });
  }
}

export function getTodaysBatch(productId: string): DailyBatch | null {
  seedTodaysBatches();
  for (const batch of batches.values()) {
    if (batch.productId === productId && batch.productionDate === today()) return { ...batch };
  }
  return null;
}

export interface AllocationResult {
  success: boolean;
  allocatedQty: number;
  remainingInBatch: number;
  reason?: string;
}

/**
 * Allocates out of the current day's production run. Partial fills are
 * reported explicitly (allocatedQty may be less than requested) rather than
 * silently rounding down — the caller must relay that to the vendor.
 */
export function allocateFromBatch(productId: string, requestedQty: number): AllocationResult {
  seedTodaysBatches();
  const batch = [...batches.values()].find((b) => b.productId === productId && b.productionDate === today());
  if (!batch) {
    return { success: false, allocatedQty: 0, remainingInBatch: 0, reason: 'NO_BATCH_TODAY' };
  }
  const remaining = batch.producedQty - batch.allocatedQty;
  if (remaining <= 0) {
    return { success: false, allocatedQty: 0, remainingInBatch: 0, reason: 'BATCH_EXHAUSTED' };
  }
  const granted = Math.min(requestedQty, remaining);
  batch.allocatedQty += granted;
  return {
    success: granted > 0,
    allocatedQty: granted,
    remainingInBatch: batch.producedQty - batch.allocatedQty,
    reason: granted < requestedQty ? 'PARTIAL_FILL' : undefined,
  };
}
