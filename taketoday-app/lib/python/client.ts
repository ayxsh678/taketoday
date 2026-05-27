"use client";

import { useState, useCallback, useMemo } from "react";
import { appConfig } from "@/lib/config/app";
import { PythonServiceError } from "@/lib/errors/PythonServiceError";

const REQUEST_TIMEOUT = appConfig.pythonServiceTimeout;

// Define explicit interfaces for API responses
export interface Job {
  id: string;
  type: string;
  status: string;
  result?: unknown;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  active: boolean;
  trustScore: number;
  trustedCategories: string[];
  createdAt: string;
  lastScraped?: string;
  articles?: unknown[]; // Simplified for now
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version?: string;
}

// Article generation request
export interface ArticleGenerationRequest {
  topic: string;
  category?: string;
  region?: string;
  format?: string;
  length?: number;
  tone?: string;
}

// Article generation response
export interface ArticleGenerationResponse {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  region: string;
  format: string;
  tone: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Automation execution request
export interface AutomationExecutionRequest {
  pipeline: string;
  parameters?: Record<string, unknown>;
  priority?: "low" | "medium" | "high";
}

// Automation execution response
export interface AutomationExecutionResponse {
  jobId: string;
  status: string;
  message: string;
  startedAt: string;
  estimatedCompletion?: string;
}

// Generic Python service error response
// Automation service interface
export interface AutomationService {
  client: {
    getJobs: (limit?: number) => Promise<{ jobs: Job[] }>;
    getSources: () => Promise<{ sources: Source[] }>;
    createSource: (source: Omit<Source, "id" | "createdAt" | "lastScraped" | "articles">) => Promise<{ source: Source }>;
    runFullPipeline: () => Promise<{ message: string }>;
    scrapeSources: () => Promise<{ message: string }>;
    postEverywhere: (articleId: string) => Promise<{ message: string; results: unknown[] }>;
    // New methods for explicit interfaces
    healthCheck: () => Promise<boolean>;
    generateArticle: (request: ArticleGenerationRequest) => Promise<ArticleGenerationResponse>;
    executeAutomation: (request: AutomationExecutionRequest) => Promise<AutomationExecutionResponse>;
  };
  loading: boolean;
  error: Error | null;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useAutomationService(): AutomationService {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
    
  // Execute function with loading/error states
  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  // Helper function to create timeout promise
  const createTimeoutPromise = useCallback((ms: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
  }, []);

  const fetchWithRetry = useCallback(async (url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> => {
    const maxRetries = 3;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await Promise.race([
        fetch(url, { ...options, signal: controller.signal }),
        createTimeoutPromise(REQUEST_TIMEOUT)
      ]);
      
      clearTimeout(timeoutId);
      
      // Check if we should retry based on status code
      if (!response.ok && retryCount < maxRetries) {
        const shouldRetry = 
          response.status === 502 || 
          response.status === 503 || 
          response.status === 504 ||
          response.status === 0; // Network error
        
        if (shouldRetry) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = Math.pow(2, retryCount) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retryCount + 1);
        }
      }
      
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      // Retry on network errors or abort errors (timeouts)
      if (retryCount < maxRetries) {
        if (err instanceof Error) {
          if (err.name === "AbortError" || err instanceof TypeError) {
            // Exponential backoff: 100ms, 200ms, 400ms
            const delay = Math.pow(2, retryCount) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retryCount + 1);
          }
        }
      }

      throw err;
    }
  }, [createTimeoutPromise]);

  const safeJsonParse = useCallback(async (response: Response): Promise<unknown> => {
    const rawText = await response.text();

    if (!rawText) {
      throw new PythonServiceError('Empty response body', {
        statusCode: response.status,
        service: 'python-service',
      });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new PythonServiceError(
        `Expected JSON response, got: ${contentType || 'unknown'}`,
        {
          statusCode: response.status,
          service: 'python-service',
          cause: {
            receivedContentType: contentType,
            responseBody: rawText.substring(0, 200),
          },
        }
      );
    }

    try {
      return JSON.parse(rawText) as unknown;
    } catch (err) {
      throw new PythonServiceError(
        `Failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}`,
        {
          statusCode: response.status,
          service: 'python-service',
          cause: {
            responseBody: rawText.substring(0, 200),
            parseError: err instanceof Error ? err.message : String(err),
          },
        }
      );
    }
  }, []);

  const unwrapAdminResponse = useCallback(async <T,>(response: Response): Promise<T> => {
    const envelope = await safeJsonParse(response) as { ok?: boolean; data?: T; error?: string };
    if (!response.ok || envelope.ok === false) {
      throw new PythonServiceError(envelope.error || `Automation request failed: ${response.statusText}`, {
        statusCode: response.status,
        service: "python-service",
      });
    }
    return envelope.data as T;
  }, [safeJsonParse]);

  // API client methods
  const client = useMemo(() => ({
    getJobs: async (limit = 20): Promise<{ jobs: Job[] }> => {
      const response = await fetchWithRetry(
        `/api/admin/automation?resource=jobs&limit=${encodeURIComponent(String(limit))}`
      );
      return unwrapAdminResponse<{ jobs: Job[] }>(response);
    },
    
    getSources: async (): Promise<{ sources: Source[] }> => {
      const response = await fetchWithRetry(
        "/api/admin/automation?resource=sources"
      );
      return unwrapAdminResponse<{ sources: Source[] }>(response);
    },
    
    createSource: async (source: Omit<Source, "id" | "createdAt" | "lastScraped" | "articles">): Promise<{ source: Source }> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createSource", source }),
        }
      );
      return unwrapAdminResponse<{ source: Source }>(response);
    },
    
    runFullPipeline: async (): Promise<{ message: string }> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "runFullPipeline" }),
        }
      );
      return unwrapAdminResponse<{ message: string }>(response);
    },
    
    scrapeSources: async (): Promise<{ message: string }> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "scrapeSources" }),
        }
      );
      return unwrapAdminResponse<{ message: string }>(response);
    },
    
    postEverywhere: async (articleId: string): Promise<{ message: string; results: unknown[] }> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "postEverywhere", articleId }),
        }
      );
      return unwrapAdminResponse<{ message: string; results: unknown[] }>(response);
    },
    
    // New method: Health check
    healthCheck: async (): Promise<boolean> => {
      try {
        const response = await fetchWithRetry(
          "/api/admin/automation?resource=health"
        );
        
        if (!response.ok) {
          // For health check, we consider non-2xx as unhealthy, not an error to throw
          return false;
        }
        
        const data = await unwrapAdminResponse<HealthCheckResponse>(response);
        // Expecting { status: 'ok' } or similar
        const healthStatus = (data as HealthCheckResponse).status;
        return healthStatus === 'ok' || healthStatus === 'healthy';
      } catch (err) {
        // Any error means the service is unhealthy
        // Log the error for debugging in development
        if (appConfig.isDevelopment) {
          console.warn('Health check failed:', err);
        }
        return false;
      }
    },
    
    // New method: Generate article
    generateArticle: async (request: ArticleGenerationRequest): Promise<ArticleGenerationResponse> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generateArticle", request }),
        }
      );
      return unwrapAdminResponse<ArticleGenerationResponse>(response);
    },
    
    // New method: Execute automation
    executeAutomation: async (request: AutomationExecutionRequest): Promise<AutomationExecutionResponse> => {
      const response = await fetchWithRetry(
        "/api/admin/automation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "executeAutomation", request }),
        }
      );
      return unwrapAdminResponse<AutomationExecutionResponse>(response);
    }
  }), [fetchWithRetry, unwrapAdminResponse]);

  return {
    client,
    loading,
    error,
    execute,
  };
}
