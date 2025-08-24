import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export interface User {
  id: string
  email: string
  username: string
  bio?: string
  avatar_url?: string
  website?: string
  location?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_private: boolean
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  category: 'general' | 'announcement' | 'question'
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  user?: User
  users?: {
    id: string
    username: string
  }
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'like' | 'comment'
  message: string
  is_read: boolean
  created_at: string
  related_user_id?: string
  related_post_id?: string
}
