import React from "react";
import { PortfolioSummary } from "../types/portfolio";
import { formatINR, formatPercentage, getTextColorForValue } from "../lib/utils";

interface SummaryCardsProps {
  summary: PortfolioSummary;
  totalHoldings: number;
  profitableHoldings: number;
}

export function SummaryCards({ summary, totalHoldings, profitableHoldings }: SummaryCardsProps) {
  const profitablePercentage = totalHoldings > 0 
    ? ((profitableHoldings / totalHoldings) * 100).toFixed(1)
    : "0.0";

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investment */}
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Investment</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{formatINR(summary.totalInvestment)}</div>
          <div className="mt-0.5 text-xs text-slate-500 flex items-center justify-between">
            <span>Cost basis</span>
            <span className="font-medium text-slate-700">{totalHoldings} stocks</span>
          </div>
        </div>

        {/* Present Value */}
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Present Value</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{formatINR(summary.totalPresentValue)}</div>
          <div className="mt-0.5 text-xs text-slate-500 flex items-center justify-between">
            <span>Today's movement</span>
            {/* Mocking today's movement as it's not provided by the backend API currently */}
            <span className="font-medium text-slate-400">Not available</span>
          </div>
        </div>

        {/* Total Gain / Loss */}
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Gain / Loss</div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${getTextColorForValue(summary.totalGainLoss)}`}>
            {summary.totalGainLoss && summary.totalGainLoss > 0 ? "+" : ""}
            {formatINR(summary.totalGainLoss)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 flex items-center justify-between">
            <span>Profitable positions</span>
            <span className={`font-medium ${profitableHoldings > totalHoldings / 2 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {profitableHoldings} of {totalHoldings} ({profitablePercentage}%)
            </span>
          </div>
        </div>

        {/* Overall Return % */}
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Overall Return %</div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${getTextColorForValue(summary.totalGainLossPercentage)}`}>
            {formatPercentage(summary.totalGainLossPercentage)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 flex items-center justify-between">
            <span>Benchmark (Nifty 50)</span>
            <span className="font-medium text-slate-400">N/A</span>
          </div>
        </div>
      </div>
    </section>
  );
}
