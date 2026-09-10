import React from "react";
import { SectorSummary } from "../types/portfolio";
import { formatINR } from "../lib/utils";

interface SectorAllocationProps {
  sectors: SectorSummary[];
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

export function SectorAllocation({ sectors }: SectorAllocationProps) {
  // Sort sectors by portfolioPercentage descending
  const sortedSectors = [...sectors].sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-xs space-y-5 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Portfolio by Sector</h2>
          <p className="text-xs text-slate-500 mt-0.5">Asset distribution across {sectors.length} core industry segments</p>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {sectors.length} Sectors Active • 100% Allocated
        </div>
      </div>

      {/* Allocation Visual Bar */}
      <div className="space-y-2">
        <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
          {sortedSectors.map((sector) => (
            <div
              key={sector.name}
              className={`${getSectorColor(sector.name)} h-full`}
              style={{ width: `${sector.portfolioPercentage}%` }}
              title={`${sector.name}: ${sector.portfolioPercentage.toFixed(1)}%`}
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {sortedSectors.map((sector) => (
            <div key={sector.name} className="py-1.5 px-2.5 rounded bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${getSectorColor(sector.name)} flex-shrink-0`}></span>
                <span className="text-xs font-semibold text-slate-800">{sector.name}</span>
              </div>
              <div className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
                {sector.portfolioPercentage.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">
                {formatINR(sector.totalInvestment)} inv.
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
