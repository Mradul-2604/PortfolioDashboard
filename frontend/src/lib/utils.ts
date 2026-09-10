export function formatINR(value: number | null): string {
  if (value === null) return "N/A";
  
  // Format as Indian Rupee
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number | null, includeSign: boolean = true): string {
  if (value === null) return "N/A";
  
  const formatted = value.toFixed(2) + "%";
  
  if (includeSign && value > 0) {
    return "+" + formatted;
  }
  
  return formatted;
}

export function getTextColorForValue(value: number | null): string {
  if (value === null) return "text-slate-500";
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-900";
}
