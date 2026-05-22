/**
 * Utility functions for the AI abstraction layer.
 */

/**
 * Retries a function with exponential backoff.
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Result of the function call
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if this is a retryable error (rate limit, internal error)
      const isRetryable = 
        error instanceof Error && (
          error.message.includes('rate') || 
          error.message.includes('quota') ||
          error.message.includes('429') ||
          error.message.includes('500') ||
          error.message.includes('503')
        );
      
      // If not retryable, throw immediately
      if (!isRetryable) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Estimates the number of tokens in a text string.
 * This is an approximation based on the assumption that 
 * 1 token ≈ 4 characters for English text.
 * 
 * @param text - Input text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Simple approximation: 1 token ≈ 4 characters for English
  // This is a rough estimate - actual tokenization depends on the model
  return Math.ceil(text.length / 4);
}

/**
 * Maps HTTP status codes to AI error types for common API responses.
 * 
 * @param statusCode - HTTP status code from API response
 * @returns Corresponding AI error type
 */
export function mapStatusToAIErrorType(statusCode: number): 'rate_limit' | 'safety' | 'invalid_request' | 'internal' {
  switch (statusCode) {
    case 429:
      return 'rate_limit';
    case 400:
    case 403:
      return 'invalid_request';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'internal';
    default:
      // Default to internal error for unknown status codes
      return 'internal';
  }
}