/**
 * Client for communicating with the Python automation service
 */

import { useState, useCallback } from 'react';

interface AutomationServiceClientOptions {
  baseUrl?: string;
  token?: string;
}

export class AutomationServiceClient {
  private baseUrl: string;
  private token: string | null;

  constructor(options: AutomationServiceClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL ?? 'http://localhost:8000';
    this.token = options.token ?? null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async scrapeSources() {
    const response = await fetch(`${this.baseUrl}/api/scrape`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.statusText}`);
    }

    return response.json();
  }

  async runFullPipeline() {
    const response = await fetch(`${this.baseUrl}/api/pipeline/run`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Pipeline failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateHeadlines(count: number = 10) {
    const response = await fetch(`${this.baseUrl}/api/ai/generate-headlines`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ count }),
    });

    if (!response.ok) {
      throw new Error(`Headline generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getJobs(status?: string, limit: number = 50) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/api/jobs?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    return response.json();
  }

  async getJobStatus(jobId: string) {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.statusText}`);
    }

    return response.json();
  }

  async cancelJob(jobId: string) {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`);
    }

    return response.json();
  }

  async getSources() {
    const response = await fetch(`${this.baseUrl}/api/sources`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sources: ${response.statusText}`);
    }

    return response.json();
  }

  async createSource(sourceData: any) {
    const response = await fetch(`${this.baseUrl}/api/sources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sourceData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create source: ${response.statusText}`);
    }

    return response.json();
  }

  async generateDeliverable(template: string, data: any, format: string = 'html') {
    const response = await fetch(`${this.baseUrl}/api/deliverables/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ template, data, format }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate deliverable: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * React hook for using the automation service client
 */
export function useAutomationService() {
  const [client] = useState(() => new AutomationServiceClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    }
  }, []);

  return {
    client,
    loading,
    error,
    execute,
  };
}