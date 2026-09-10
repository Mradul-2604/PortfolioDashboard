import React from "react";
import { SectorSummary, EnrichedHolding } from "../types/portfolio";
import { formatINR, formatPercentage, getTextColorForValue } from "../lib/utils";

interface HoldingsTableProps {
  sectors: SectorSummary[];
  totalHoldings: number;
}

const SECTOR_COLORS: Record<string, string> = {
  "Financials": "bg-blue-600",
  "Technology": "bg-indigo-500",
  "Consumer": "bg-teal-500",
  "Power": "bg-amber-500",
  "Pipe": "bg-sky-500",
  "Others": "bg-slate-400",
};

function getSectorColor(sectorName: string): string {
  return SECTOR_COLORS[sectorName] || "bg-slate-400";
}

function HoldingRow({ holding, maxInvestment }: { holding: EnrichedHolding, maxInvestment: number }) {
  const isPositive = holding.gainLoss ? holding.gainLoss > 0 : false;
  
  // Calculate a mock bar width for portfolio percentage to give visual hierarchy
  const barWidth = `${holding.portfolioPercentage}%`;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 pl-6 pr-4">
        <div className="font-semibold text-slate-900 text-sm">{holding.name}</div>
        <div className="text-[11px] text-slate-500">{holding.symbol.replace('.NS', '').replace('.BO', '')}</div>
      </td>
      <td className="py-3.5 px-3 text-center">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {holding.exchange}
        </span>
      </td>
      <td className="py-3.5 px-3 text-right tabular-nums">{formatINR(holding.purchasePrice)}</td>
      <td className="py-3.5 px-3 text-right tabular-nums">{holding.quantity}</td>
      <td className="py-3.5 px-3 text-right tabular-nums font-medium">{formatINR(holding.investment)}</td>
      <td className="py-3.5 px-3 text-right tabular-nums">
        <div className="flex items-center justify-end space-x-2">
          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: barWidth }}></div>
          </div>
          <span>{holding.portfolioPercentage.toFixed(1)}%</span>
        </div>
      </td>
      <td className="py-3.5 px-3 text-right tabular-nums font-medium text-slate-900">
        {formatINR(holding.cmp)}
      </td>
      <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-slate-900">
        {formatINR(holding.presentValue)}
      </td>
      <td className="py-3.5 px-3 text-right tabular-nums">
        <div className={`font-semibold ${getTextColorForValue(holding.gainLoss)}`}>
          {holding.gainLoss && holding.gainLoss > 0 ? "+" : ""}{formatINR(holding.gainLoss)}
        </div>
        <div className={`text-[11px] ${getTextColorForValue(holding.gainLossPercentage)}`}>
          {formatPercentage(holding.gainLossPercentage)}
        </div>
      </td>
      <td className="py-3.5 px-3 text-right tabular-nums text-slate-600">
        {holding.peRatio !== null ? holding.peRatio.toFixed(1) : "N/A"}
      </td>
      <td className="py-3.5 pl-3 pr-6 text-center">
        {holding.latestEarnings !== null ? (
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {formatINR(holding.latestEarnings)} EPS
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            N/A
          </span>
        )}
      </td>
    </tr>
  );
}

export function HoldingsTable({ sectors, totalHoldings }: HoldingsTableProps) {
  // Find maximum investment for the visual bar relative width
  let maxInvestment = 0;
  sectors.forEach(s => {
    s.holdings.forEach(h => {
      if (h.investment > maxInvestment) maxInvestment = h.investment;
    });
  });

  // Sort sectors by portfolioPercentage descending
  const sortedSectors = [...sectors].sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Holdings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Detailed breakdown grouped by sector with aggregate metrics</p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500">Sort: By Portfolio %</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-medium">All {totalHoldings} Equities</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-[11px]">
              <th scope="col" className="py-3.5 pl-6 pr-4 font-semibold text-slate-700 min-w-[180px]">Stock Name</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-center w-20">NSE/BSE</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">Purchase Price</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">Qty</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">Investment</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right min-w-[110px]">Portfolio %</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">CMP (₹)</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">Present Value</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right min-w-[120px]">Gain / Loss</th>
              <th scope="col" className="py-3.5 px-3 font-semibold text-slate-700 text-right">P/E Ratio</th>
              <th scope="col" className="py-3.5 pl-3 pr-6 font-semibold text-slate-700 text-center">Latest Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {sortedSectors.map((sector) => {
              // Sort holdings within sector by portfolioPercentage
              const sortedHoldings = [...sector.holdings].sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);
              const sectorColorClass = getSectorColor(sector.name);
              
              return (
                <React.Fragment key={sector.name}>
                  {/* Sector Header Row */}
                  <tr className="bg-slate-50/80 border-t border-b border-slate-200/90 font-medium">
                    <td colSpan={11} className="py-3 pl-6 pr-6">
                      <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sectorColorClass}`}></span>
                          <span className="font-bold text-slate-900 tracking-tight text-sm">{sector.name}</span>
                          <span className="text-slate-500 font-normal text-xs">({sector.holdings.length} stocks)</span>
                        </div>
                        <div className="flex items-center space-x-6 text-xs tabular-nums">
                          <div>
                            <span className="text-slate-500">Total Investment:</span>
                            <span className="font-semibold text-slate-900 ml-1">{formatINR(sector.totalInvestment)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Present Value:</span>
                            <span className="font-semibold text-slate-900 ml-1">{formatINR(sector.totalPresentValue)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Gain/Loss:</span>
                            <span className={`font-bold ${getTextColorForValue(sector.gainLoss)} ml-1`}>
                              {sector.gainLoss && sector.gainLoss > 0 ? "+" : ""}{formatINR(sector.gainLoss)} ({formatPercentage(sector.gainLossPercentage)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Holdings Rows */}
                  {sortedHoldings.map(holding => (
                    <HoldingRow key={holding.id} holding={holding} maxInvestment={maxInvestment} />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
