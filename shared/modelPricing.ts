/**
 * OpenAI Model Pricing (as of December 2024)
 * Prices are in USD per 1M tokens
 */

export const MODEL_PRICING = {
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.60,
  },
  'o1': {
    input: 15.00,
    output: 60.00,
  },
  'o1-mini': {
    input: 3.00,
    output: 12.00,
  },
  'gpt-5': {
    input: 5.00, // Estimated
    output: 15.00, // Estimated
  },
  'gpt-5.2-pro': {
    input: 10.00, // Estimated
    output: 30.00, // Estimated
  },
  // Fallback for unknown models
  'default': {
    input: 2.50,
    output: 10.00,
  },
} as const;

export type ModelName = keyof typeof MODEL_PRICING;

/**
 * Calculate the cost of a generation based on tokens used
 * @param model - The model name
 * @param promptTokens - Number of prompt tokens
 * @param completionTokens - Number of completion tokens
 * @returns Cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model as ModelName] || MODEL_PRICING.default;
  
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Format cost to a human-readable string
 * @param cost - Cost in USD
 * @returns Formatted cost string
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(4)}m`; // Show in thousandths of a cent
  }
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(3)}¢`; // Show in cents
  }
  if (cost < 1) {
    return `$${(cost * 100).toFixed(2)}¢`;
  }
  return `$${cost.toFixed(2)}`;
}
