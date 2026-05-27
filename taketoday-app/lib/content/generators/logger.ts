// ─── Structured pipeline logger ───────────────────────────────────────────────
// Emits newline-delimited JSON to stdout/stderr — compatible with
// Vercel, Datadog, CloudWatch, and any JSON log aggregator.

type LogLevel = "info" | "warn" | "error";

export interface PipelineLogEntry {
  ts: string;
  level: LogLevel;
  service: "content_pipeline";
  stage: string;
  format?: string;
  jobId?: string;
  attempt?: number;
  durationMs?: number;
  message: string;
  [key: string]: unknown;
}

function emit(
  level: LogLevel,
  fields: Omit<PipelineLogEntry, "ts" | "level" | "service">,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: "content_pipeline" as const,
    ...fields,
  } as PipelineLogEntry;
  const line = JSON.stringify(entry) + "\n";
  if (level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const pipelineLogger = {
  info: (fields: Omit<PipelineLogEntry, "ts" | "level" | "service">) =>
    emit("info", fields),
  warn: (fields: Omit<PipelineLogEntry, "ts" | "level" | "service">) =>
    emit("warn", fields),
  error: (fields: Omit<PipelineLogEntry, "ts" | "level" | "service">) =>
    emit("error", fields),
};
