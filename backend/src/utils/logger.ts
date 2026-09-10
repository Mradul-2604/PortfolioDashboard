// ─── Structured Logger ────────────────────────────────────────────────────────
// Lightweight console-based logger. No external dependencies.
// All log lines are prefixed with ISO timestamp, level, and an optional context.
//
// IMPORTANT: Never log API keys, secrets, or full provider responses.

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ""} ${entry.message}`;
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    return `${base} ${JSON.stringify(entry.meta)}`;
  }
  return base;
}

function log(
  level: LogLevel,
  message: string,
  context?: string,
  meta?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    meta,
  };

  const formatted = formatEntry(entry);

  if (level === "ERROR") {
    console.error(formatted);
  } else if (level === "WARN") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = {
  info: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("INFO", message, context, meta),

  warn: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("WARN", message, context, meta),

  error: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("ERROR", message, context, meta),

  debug: (message: string, context?: string, meta?: Record<string, unknown>) => {
    if (isDevelopment) log("DEBUG", message, context, meta);
  },
};
