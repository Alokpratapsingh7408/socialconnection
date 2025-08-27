// Common types used across the application

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  created_at: string;
  is_admin?: boolean;
  follower_count: number;
  following_count: number;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  category: 'general' | 'announcement' | 'question';
  image_url?: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user?: User;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id?: string;
  comment_id?: string;
  created_at: string;
  read: boolean;
  actor?: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Request Types
export interface CreatePostRequest {
  content: string;
  category: 'general' | 'announcement' | 'question';
  image_url?: string;
}

// Use CreatePostRequest type for update operations
export type UpdatePostRequest = CreatePostRequest;

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateUserRequest {
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar_url?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
  username?: string;
}
