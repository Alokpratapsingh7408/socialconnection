import { ApiClient } from '@/lib/apiClient';
import type { ApiResponse, User, UpdateUserRequest } from '@/types';

export class UsersApi {
  static async getCurrentUser(): Promise<ApiResponse<{ profile: User }>> {
    return await ApiClient.get<ApiResponse<{ profile: User }>>('/users/me');
  }

  static async getUser(userId: string): Promise<ApiResponse<{ profile: User }>> {
    return await ApiClient.get<ApiResponse<{ profile: User }>>(`/users/${userId}`);
  }

  static async updateUser(userId: string, data: UpdateUserRequest): Promise<ApiResponse<{ profile: User }>> {
    return await ApiClient.patch<ApiResponse<{ profile: User }>>(`/users/${userId}`, data);
  }

  static async followUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>(`/users/${userId}/follow`, {});
  }

  static async unfollowUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.delete<ApiResponse<{ message: string }>>(`/users/${userId}/follow`);
  }

  static async getFollowers(userId: string): Promise<ApiResponse<{ followers: User[] }>> {
    return await ApiClient.get<ApiResponse<{ followers: User[] }>>(`/users/${userId}/followers`);
  }

  static async getFollowing(userId: string): Promise<ApiResponse<{ following: User[] }>> {
    return await ApiClient.get<ApiResponse<{ following: User[] }>>(`/users/${userId}/following`);
  }

  static async searchUsers(query: string): Promise<ApiResponse<{ users: User[] }>> {
    return await ApiClient.get<ApiResponse<{ users: User[] }>>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  static async discoverUsers(): Promise<ApiResponse<{ users: User[] }>> {
    return await ApiClient.get<ApiResponse<{ users: User[] }>>('/users/discover');
  }
}
