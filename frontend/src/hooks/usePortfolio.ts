import { useState, useEffect, useCallback } from "react";
import { PortfolioData } from "../types/portfolio";
import { fetchPortfolio } from "../lib/api";

interface UsePortfolioResult {
  data: PortfolioData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function usePortfolio(pollingIntervalMs: number = 15000): UsePortfolioResult {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const result = await fetchPortfolio();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    // Load immediately
    loadData();

    // Set up polling interval
    const intervalId = setInterval(() => {
      loadData();
    }, pollingIntervalMs);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [loadData, pollingIntervalMs]);

  const refresh = async () => {
    // Prevent concurrent manual refreshes
    if (isRefreshing) return;
    await loadData(true);
  };

  return { data, loading, error, refresh, isRefreshing };
}
