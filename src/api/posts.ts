import { ApiClient } from '@/lib/apiClient';
import type { 
  ApiResponse, 
  CreatePostRequest, 
  UpdatePostRequest, 
  Post, 
  CreateCommentRequest,
  Comment 
} from '@/types';

export class PostsApi {
  static async getPosts(): Promise<ApiResponse<{ posts: Post[] }>> {
    return await ApiClient.get<ApiResponse<{ posts: Post[] }>>('/posts');
  }

  static async getPost(postId: string): Promise<ApiResponse<{ post: Post }>> {
    return await ApiClient.get<ApiResponse<{ post: Post }>>(`/posts/${postId}`);
  }

  static async createPost(data: CreatePostRequest): Promise<ApiResponse<{ post: Post }>> {
    return await ApiClient.post<ApiResponse<{ post: Post }>>('/posts', data);
  }

  static async updatePost(postId: string, data: UpdatePostRequest): Promise<ApiResponse<{ post: Post }>> {
    return await ApiClient.patch<ApiResponse<{ post: Post }>>(`/posts/${postId}`, data);
  }

  static async deletePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.delete<ApiResponse<{ message: string }>>(`/posts/${postId}`);
  }

  static async likePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>(`/posts/${postId}/like`, {});
  }

  static async unlikePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.delete<ApiResponse<{ message: string }>>(`/posts/${postId}/like`);
  }

  static async createComment(postId: string, data: CreateCommentRequest): Promise<ApiResponse<{ comment: Comment }>> {
    return await ApiClient.post<ApiResponse<{ comment: Comment }>>(`/posts/${postId}/comments`, data);
  }

  static async getComments(postId: string): Promise<ApiResponse<{ comments: Comment[] }>> {
    return await ApiClient.get<ApiResponse<{ comments: Comment[] }>>(`/posts/${postId}/comments`);
  }
}
