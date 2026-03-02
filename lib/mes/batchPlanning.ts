export type BatchPlan = {
  quantity: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
};

export function calculateSuggestedBatches(
  targetQty: number,
  defaultBatchSize?: number | null,
): BatchPlan[] {
  if (!targetQty || targetQty <= 0) return [];

  const size = defaultBatchSize && defaultBatchSize > 0 ? defaultBatchSize : targetQty;

  const fullBatches = Math.floor(targetQty / size);
  const remainder = targetQty % size;

  const batches: BatchPlan[] = [];

  for (let i = 0; i < fullBatches; i += 1) {
    batches.push({ quantity: size });
  }

  if (remainder > 0) {
    batches.push({ quantity: remainder });
  }

  return batches;
}

export function validateBatchPlan(targetQty: number, batches: BatchPlan[]) {
  const total = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  if (total > targetQty) {
    return {
      valid: false,
      total,
      error: 'Total batch quantity exceeds order target quantity',
    };
  }

  if (total <= 0) {
    return {
      valid: false,
      total,
      error: 'Total batch quantity must be greater than zero',
    };
  }

  return { valid: true, total };
}

