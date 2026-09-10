import React from "react";

interface DashboardHeaderProps {
  totalHoldings: number;
}

export function DashboardHeader({ totalHoldings }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Portfolio Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Consolidated equity valuation, sector allocations, and mark-to-market performance.</p>
      </div>
      <div className="flex items-center space-x-3 text-xs text-slate-500">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-700 border border-slate-200">
          {totalHoldings} Active Positions
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-700 border border-slate-200">
          Currency: INR (₹)
        </span>
      </div>
    </div>
  );
}
