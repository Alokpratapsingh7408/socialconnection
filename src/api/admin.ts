import { ApiClient } from '@/lib/apiClient';
import type { ApiResponse, User, Post } from '@/types';

export class AdminApi {
  static async getUsers(): Promise<ApiResponse<{ users: User[] }>> {
    return await ApiClient.get<ApiResponse<{ users: User[] }>>('/admin/users');
  }

  static async deactivateUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/deactivate`, {});
  }

  static async getPosts(): Promise<ApiResponse<{ posts: Post[] }>> {
    return await ApiClient.get<ApiResponse<{ posts: Post[] }>>('/admin/posts');
  }

  static async deletePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.delete<ApiResponse<{ message: string }>>(`/admin/posts/${postId}`);
  }

  static async getStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    activeUsers: number;
  }>> {
    return await ApiClient.get<ApiResponse<{
      totalUsers: number;
      totalPosts: number;
      totalComments: number;
      activeUsers: number;
    }>>('/admin/stats');
  }
}
