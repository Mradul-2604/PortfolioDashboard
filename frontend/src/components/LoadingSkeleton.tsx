import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded"></div>
          <div className="h-4 w-96 bg-slate-200 rounded mt-2"></div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 shadow-xs">
              <div className="h-3 w-24 bg-slate-200 rounded uppercase tracking-wider mb-2"></div>
              <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 w-full bg-slate-200 rounded flex justify-between">
                <span className="w-1/2"></span>
                <span className="w-1/4"></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-xs space-y-5 p-5">
        <div className="flex justify-between">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="py-2 px-2.5 rounded bg-slate-50 border border-slate-100">
              <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
              <div className="h-5 w-16 bg-slate-200 rounded mb-1"></div>
              <div className="h-3 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
