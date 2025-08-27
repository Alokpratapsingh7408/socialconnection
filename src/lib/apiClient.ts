import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API Client configuration
const BASE_URL = '/api';

interface RequestOptions<B = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: B;
}

export class ApiClient {
  private static async getAuthHeader(): Promise<HeadersInit> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      };
    } catch (error) {
      console.error('Error getting auth header:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  private static async request<T, B = unknown>(endpoint: string, options: RequestOptions<B> = {}): Promise<T> {
    try {
      const headers = await this.getAuthHeader();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Try to refresh session if unauthorized
        if (response.status === 401) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Authentication required');
          }
        }
        throw new Error(data.error || 'API request failed');
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return await this.request<T>(endpoint);
  }

  static async post<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    return await this.request<T>(endpoint, { method: 'POST', body });
  }

  static async put<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    return await this.request<T>(endpoint, { method: 'PUT', body });
  }

  static async patch<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    return await this.request<T>(endpoint, { method: 'PATCH', body });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return await this.request<T>(endpoint, { method: 'DELETE' });
  }
}
