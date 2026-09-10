import {
  safeDivide,
  round,
  calcInvestment,
  calcPresentValue,
  calcGainLoss,
  calcGainLossPercentage,
  calcPortfolioPercentage,
} from "../utils/calculations";

describe("calculations utility", () => {
  // ─── safeDivide ─────────────────────────────────────────────────────────────

  describe("safeDivide", () => {
    it("returns correct quotient for valid inputs", () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(7, 3)).toBeCloseTo(2.333);
    });

    it("returns null when denominator is 0", () => {
      expect(safeDivide(10, 0)).toBeNull();
    });

    it("returns null when numerator is Infinity", () => {
      expect(safeDivide(Infinity, 2)).toBeNull();
    });

    it("returns null when denominator is Infinity", () => {
      expect(safeDivide(10, Infinity)).toBeNull();
    });

    it("returns null when denominator is NaN", () => {
      expect(safeDivide(10, NaN)).toBeNull();
    });
  });

  // ─── round ──────────────────────────────────────────────────────────────────

  describe("round", () => {
    it("rounds to 2 decimal places by default", () => {
      expect(round(1.2345)).toBe(1.23);
      expect(round(1.235)).toBe(1.24);
    });

    it("rounds to specified decimal places", () => {
      expect(round(1.23456, 4)).toBe(1.2346);
    });
  });

  // ─── calcInvestment ─────────────────────────────────────────────────────────

  describe("calcInvestment", () => {
    it("returns purchasePrice × quantity", () => {
      expect(calcInvestment(1490, 50)).toBe(74500);
      expect(calcInvestment(6800, 15)).toBe(102000);
    });

    it("handles decimal purchase prices", () => {
      expect(calcInvestment(1490.5, 10)).toBe(14905);
    });

    it("handles large values without NaN", () => {
      expect(calcInvestment(22000, 5)).toBe(110000);
    });
  });

  // ─── calcPresentValue ───────────────────────────────────────────────────────

  describe("calcPresentValue", () => {
    it("returns cmp × quantity when cmp is available", () => {
      expect(calcPresentValue(1700, 50)).toBe(85000);
      expect(calcPresentValue(950.75, 80)).toBe(76060);
    });

    it("returns null when cmp is null", () => {
      expect(calcPresentValue(null, 50)).toBeNull();
    });
  });

  // ─── calcGainLoss ───────────────────────────────────────────────────────────

  describe("calcGainLoss", () => {
    it("returns presentValue - investment", () => {
      expect(calcGainLoss(85000, 74500)).toBe(10500);
      expect(calcGainLoss(70000, 74500)).toBe(-4500);
    });

    it("returns null when presentValue is null", () => {
      expect(calcGainLoss(null, 74500)).toBeNull();
    });
  });

  // ─── calcGainLossPercentage ──────────────────────────────────────────────────

  describe("calcGainLossPercentage", () => {
    it("returns (gainLoss / investment) × 100", () => {
      expect(calcGainLossPercentage(10500, 74500)).toBeCloseTo(14.09, 1);
      expect(calcGainLossPercentage(-4500, 74500)).toBeCloseTo(-6.04, 1);
    });

    it("returns null when gainLoss is null", () => {
      expect(calcGainLossPercentage(null, 74500)).toBeNull();
    });

    it("returns null when investment is 0 (division by zero)", () => {
      expect(calcGainLossPercentage(100, 0)).toBeNull();
    });
  });

  // ─── calcPortfolioPercentage ─────────────────────────────────────────────────

  describe("calcPortfolioPercentage", () => {
    it("returns (investment / totalInvestment) × 100", () => {
      expect(calcPortfolioPercentage(74500, 745000)).toBe(10);
      expect(calcPortfolioPercentage(50000, 200000)).toBe(25);
    });

    it("returns 0 when totalInvestment is 0", () => {
      expect(calcPortfolioPercentage(74500, 0)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(calcPortfolioPercentage(1, 3)).toBe(33.33);
    });
  });
});
