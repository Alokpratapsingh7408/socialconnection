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
  onCreatePost: (data: CreatePostData) => Promise<void>
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
    <div className="w-full max-w-lg mx-auto space-y-6">
      {showCreateForm && currentUserId && (
        <div className="px-4">
          <CreatePostForm onSubmit={onCreatePost} isLoading={isLoading} />
        </div>
      )}
      
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {showCreateForm ? 'Share your first post to get started!' : 'Follow some users to see their posts in your feed.'}
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
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading more posts...</p>
          </div>
        </div>
      )}
    </div>
  )
}
