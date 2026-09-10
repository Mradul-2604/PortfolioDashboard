// ─── Pure Calculation Functions ───────────────────────────────────────────────
// All functions are pure: no side effects, no external dependencies.
// Safe division is used everywhere to prevent NaN from reaching the API response.

/**
 * Safe division — returns null instead of Infinity or NaN.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) return null;
  const result = numerator / denominator;
  return isFinite(result) ? result : null;
}

/**
 * Round a number to a given number of decimal places.
 */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Investment = purchasePrice × quantity
 */
export function calcInvestment(purchasePrice: number, quantity: number): number {
  return round(purchasePrice * quantity, 2);
}

/**
 * Present Value = CMP × quantity
 * Returns null if CMP is unavailable.
 */
export function calcPresentValue(
  cmp: number | null,
  quantity: number
): number | null {
  if (cmp === null) return null;
  return round(cmp * quantity, 2);
}

/**
 * Gain/Loss = Present Value − Investment
 * Returns null if present value is unavailable.
 */
export function calcGainLoss(
  presentValue: number | null,
  investment: number
): number | null {
  if (presentValue === null) return null;
  return round(presentValue - investment, 2);
}

/**
 * Gain/Loss % = (Gain/Loss / Investment) × 100
 * Returns null if gain/loss is unavailable or investment is zero.
 */
export function calcGainLossPercentage(
  gainLoss: number | null,
  investment: number
): number | null {
  if (gainLoss === null) return null;
  const ratio = safeDivide(gainLoss, investment);
  if (ratio === null) return null;
  return round(ratio * 100, 2);
}

/**
 * Portfolio % = (Investment / Total Investment) × 100
 * Returns 0 if total investment is zero.
 */
export function calcPortfolioPercentage(
  investment: number,
  totalInvestment: number
): number {
  const ratio = safeDivide(investment, totalInvestment);
  if (ratio === null) return 0;
  return round(ratio * 100, 2);
}
