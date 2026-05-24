// lib/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly service: string;
  public readonly cause?: unknown;

  constructor(message: string, options: { statusCode?: number; service?: string; cause?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.service = options.service ?? 'unknown';
    this.cause = options.cause;

    // Maintains proper stack trace for our error class (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}