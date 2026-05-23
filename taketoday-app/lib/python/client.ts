"use client";

import { useState, useCallback } from "react";

// Define types for our API responses
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

export interface AutomationService {
  client: {
    getJobs: (limit?: number) => Promise<{ jobs: Job[] }>;
    getSources: () => Promise<{ sources: Source[] }>;
    createSource: (source: Omit<Source, "id" | "createdAt" | "lastScraped" | "articles">) => Promise<{ source: Source }>;
    runFullPipeline: () => Promise<{ message: string }>;
    scrapeSources: () => Promise<{ message: string }>;
     postEverywhere: (articleId: string) => Promise<{ message: string; results: unknown[] }>;
  };
  loading: boolean;
  error: Error | null;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useAutomationService(): AutomationService {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // In a real implementation, we would get this from environment variables
  const API_URL = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || "http://localhost:8000";
  const INTERNAL_SERVICE_TOKEN = process.env.NEXT_PUBLIC_INTERNAL_SERVICE_TOKEN || "";

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

  // API client methods
  const client = {
    getJobs: async (limit = 20): Promise<{ jobs: Job[] }> => {
      const response = await fetch(`${API_URL}/jobs?limit=${limit}`, {
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    getSources: async (): Promise<{ sources: Source[] }> => {
      const response = await fetch(`${API_URL}/sources`, {
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    createSource: async (source: Omit<Source, "id" | "createdAt" | "lastScraped" | "articles">): Promise<{ source: Source }> => {
      const response = await fetch(`${API_URL}/sources`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(source),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create source: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    runFullPipeline: async (): Promise<{ message: string }> => {
      const response = await fetch(`${API_URL}/trigger-pipeline`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger pipeline: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    scrapeSources: async (): Promise<{ message: string }> => {
      const response = await fetch(`${API_URL}/scrape-now`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger scraping: ${response.statusText}`);
      }
      
      return response.json();
    },
    
     postEverywhere: async (articleId: string): Promise<{ message: string; results: unknown[] }> => {
      const response = await fetch(`${API_URL}/post-everywhere/${articleId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger post everywhere: ${response.statusText}`);
      }
      
      return response.json();
    },
  };

  return {
    client,
    loading,
    error,
    execute,
  };
}