/**
 * Structured logger for AI events.
 */

import type { AIProviderSlug, AITaskType } from "./types";

type LogLevel = "info" | "warn" | "error";

interface AILogEntry {
  level: LogLevel;
  timestamp: string;
  taskType?: AITaskType;
  provider?: AIProviderSlug | string;
  model?: string;
  latencyMs?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  message: string;
}

function log(level: LogLevel, message: string, context: Partial<Omit<AILogEntry, "level" | "timestamp" | "message">> = {}): void {
  const entry: AILogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...context,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const aiLogger = {
  info(message: string, context?: Partial<Omit<AILogEntry, "level" | "timestamp" | "message">>): void {
    log("info", message, context);
  },
  warn(message: string, context?: Partial<Omit<AILogEntry, "level" | "timestamp" | "message">>): void {
    log("warn", message, context);
  },
  error(message: string, context?: Partial<Omit<AILogEntry, "level" | "timestamp" | "message">>): void {
    log("error", message, context);
  },
};
