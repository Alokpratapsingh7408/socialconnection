import { ApiClient } from '@/lib/apiClient';
import type { ApiResponse, AuthRequest, User } from '@/types';

export class AuthApi {
  static async register(data: AuthRequest): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>('/auth/register', data);
  }

  static async registerAdmin(data: AuthRequest): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>('/auth/register-admin', data);
  }

  static async login(data: AuthRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return await ApiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
  }

  static async logout(): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>('/auth/logout', {});
  }
}
