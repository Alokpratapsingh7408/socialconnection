'use client'

import { PostCard } from './PostCard'
import { CreatePostForm } from './CreatePostForm'
import { Post } from '@/lib/supabaseClient'

interface CreatePostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

interface FeedProps {
  posts: Post[]
  currentUserId?: string
  onCreatePost: (data: CreatePostData) => void
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onEditPost: (post: Post) => void
  onDeletePost: (postId: string) => void
  likedPosts: Set<string>
  isLoading?: boolean
  showCreateForm?: boolean
}

export function Feed({
  posts,
  currentUserId,
  onCreatePost,
  onLike,
  onComment,
  onEditPost,
  onDeletePost,
  likedPosts,
  isLoading = false,
  showCreateForm = true,
}: FeedProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {showCreateForm && currentUserId && (
        <CreatePostForm onSubmit={onCreatePost } isLoading={isLoading} />
      )}
      
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts yet</p>
            <p className="text-gray-400 text-sm">
              {showCreateForm ? 'Be the first to share something!' : 'Follow some users to see their posts here.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onLike={onLike}
              onComment={onComment}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              isLiked={likedPosts.has(post.id)}
            />
          ))
        )}
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading more posts...</p>
        </div>
      )}
    </div>
  )
}
