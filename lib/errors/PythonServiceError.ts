// lib/errors/PythonServiceError.ts

import { AppError } from './AppError';

export class PythonServiceError extends AppError {
  public readonly endpoint: string;
  public readonly method: string;

  constructor(message: string, options: {
    statusCode?: number;
    service?: string;
    cause?: unknown;
    endpoint?: string;
    method?: string;
  } = {}) {
    super(message, { statusCode: options.statusCode, service: options.service, cause: options.cause });
    this.name = 'PythonServiceError';
    this.endpoint = options.endpoint ?? '';
    this.method = options.method ?? '';
  }
}