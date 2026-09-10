import { ApiResponse, PortfolioData } from "../types/portfolio";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchPortfolio(): Promise<PortfolioData> {
  try {
    const res = await fetch(`${API_URL}/api/portfolio`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // In Next.js App Router, fetch is cached by default in some cases.
      // We want fresh data on every manual/interval refresh.
      cache: "no-store", 
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json: ApiResponse<PortfolioData> = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch portfolio data");
    }

    return json.data;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
}
