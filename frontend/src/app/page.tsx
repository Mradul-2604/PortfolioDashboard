"use client";

import React from "react";
import { Header } from "@/components/Header";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SummaryCards } from "@/components/SummaryCards";
import { SectorAllocation } from "@/components/SectorAllocation";
import { HoldingsTable } from "@/components/HoldingsTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function Home() {
  const { data, loading, error, refresh, isRefreshing } = usePortfolio(15000);

  // Show full screen loading skeleton only on initial load
  const isInitialLoad = loading && !data;

  // Calculate some derived metrics based on data
  const totalHoldings = data?.holdings.length || 0;
  const profitableHoldings = data?.holdings.filter(h => (h.gainLoss || 0) > 0).length || 0;

  return (
    <div className="min-h-screen bg-slate-50 antialiased selection:bg-blue-100 selection:text-blue-900 pb-20 font-sans">
      <Header 
        isRefreshing={isRefreshing} 
        onRefresh={refresh} 
        lastUpdated={data?.lastUpdated} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {isInitialLoad ? (
          <LoadingSkeleton />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : data ? (
          <>
            <DashboardHeader totalHoldings={totalHoldings} />
            <SummaryCards 
              summary={data.summary} 
              totalHoldings={totalHoldings} 
              profitableHoldings={profitableHoldings} 
            />
            <SectorAllocation sectors={data.sectors} />
            <HoldingsTable sectors={data.sectors} totalHoldings={totalHoldings} />
          </>
        ) : null}
      </main>
    </div>
  );
}
