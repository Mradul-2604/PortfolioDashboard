import React from "react";

interface HeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
}

export function Header({ isRefreshing, onRefresh, lastUpdated }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base">My Portfolio</span>
            <span className="text-xs text-slate-500 font-medium ml-2 pl-2 border-l border-slate-200">Live Portfolio Analytics</span>
          </div>
        </div>

        {/* Right controls: Market Status & Refresh */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-700">Live market data</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">NSE / BSE feeds</span>
          </div>

          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4 sm:pl-6">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {lastUpdated && (
              <div className="hidden md:block">
                <span className="text-[10px] text-slate-400 block leading-tight">Last updated</span>
                <span className="text-[11px] text-slate-600 font-medium">{new Date(lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
