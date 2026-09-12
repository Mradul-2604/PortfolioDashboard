import React from "react";
import { SectorSummary } from "../types/portfolio";
import { formatINR } from "../lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SectorAllocationProps {
  sectors: SectorSummary[];
}

const SECTOR_COLORS: Record<string, string> = {
  "Technology": "bg-blue-600",
  "Financial Sector": "bg-violet-600",
  "Financials": "bg-violet-600",
  "Consumer": "bg-teal-600",
  "Power": "bg-orange-500",
  "Pipe Sector": "bg-green-600",
  "Pipe": "bg-green-600",
  "Others": "bg-slate-500",
};

const SECTOR_HEX_COLORS: Record<string, string> = {
  "Technology": "#2563eb",
  "Financial Sector": "#7c3aed",
  "Financials": "#7c3aed",
  "Consumer": "#0d9488",
  "Power": "#f97316",
  "Pipe Sector": "#16a34a",
  "Pipe": "#16a34a",
  "Others": "#64748b",
};

function getSectorColor(sectorName: string): string {
  return SECTOR_COLORS[sectorName] || "bg-slate-500";
}

function getSectorHexColor(sectorName: string): string {
  return SECTOR_HEX_COLORS[sectorName] || "#64748b";
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SectorSummary;
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 text-sm min-w-[200px] z-50">
        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 mb-2 flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getSectorHexColor(data.name) }}
          />
          {data.name}
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-slate-500">Allocation:</span>
          <span className="font-medium text-slate-900">{data.portfolioPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-slate-500">Investment:</span>
          <span className="font-medium text-slate-900">{formatINR(data.totalInvestment)}</span>
        </div>
        {data.totalPresentValue !== null && (
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Value:</span>
            <span className="font-medium text-slate-900">{formatINR(data.totalPresentValue)}</span>
          </div>
        )}
        {data.gainLoss !== null && (
          <div className="flex justify-between py-0.5 pt-1.5 mt-1.5 border-t border-slate-50">
            <span className="text-slate-500">Gain/Loss:</span>
            <span className={`font-medium ${data.gainLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {data.gainLoss >= 0 ? "+" : ""}{formatINR(data.gainLoss)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function SectorAllocation({ sectors }: SectorAllocationProps) {
  // Sort sectors by portfolioPercentage descending
  const sortedSectors = [...sectors].sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);
  const dataForChart = sortedSectors.filter(s => s.portfolioPercentage > 0);

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Portfolio by Sector</h2>
          <p className="text-xs text-slate-500 mt-0.5">Asset distribution across {sectors.length} core industry segments</p>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {sectors.length} Sectors Active • 100% Allocated
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-center">
        {/* Chart Section */}
        <div className="relative w-[200px] h-[200px] flex-shrink-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900">100%</span>
            <span className="text-xs text-slate-500 font-medium">Allocated</span>
          </div>
          <div className="relative w-full h-full z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataForChart}
                  dataKey="portfolioPercentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={90}
                  stroke="none"
                  paddingAngle={2}
                  animationDuration={800}
                >
                  {dataForChart.map((entry) => (
                    <Cell key={entry.name} fill={getSectorHexColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Visual Bar */}
        <div className="flex-1 w-full space-y-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
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
      </div>
    </section>
  );
}
