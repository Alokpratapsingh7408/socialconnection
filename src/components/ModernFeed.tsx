'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import { PostCard } from './ModernPostCard'
import { CreatePostForm } from './CreatePostForm'
import type { Post } from '@/lib/supabaseClient'

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  user?: {
    username: string
    avatar_url?: string
  }
}

interface CreatePostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

interface FeedProps {
  posts: Post[]
  currentUserId?: string
  currentUser?: {
    username: string
    avatar_url?: string
  }
  onCreatePost: (data: CreatePostData) => Promise<void>
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => Promise<Comment | null>
  onEditPost: (post: Post) => void
  onDeletePost: (postId: string) => void
  likedPosts: Set<string>
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  showCreateForm?: boolean
}

export const ModernFeed = memo(function ModernFeed({
  posts,
  currentUserId,
  currentUser,
  onCreatePost,
  onLike,
  onComment,
  onEditPost,
  onDeletePost,
  likedPosts,
  isLoading = false,
  isLoadingMore = false,
  hasMore = true,
  onLoadMore,
  showCreateForm = true,
}: FeedProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  // Memoize handler functions to prevent unnecessary re-renders
  const handleCreatePost = useCallback(async (data: CreatePostData) => {
    await onCreatePost(data);
  }, [onCreatePost]);

  const handleLike = useCallback((postId: string) => {
    onLike(postId);
  }, [onLike]);

  const handleComment = useCallback((postId: string, content: string) => {
    return onComment(postId, content);
  }, [onComment]);

  const handleEdit = useCallback((post: Post) => {
    onEditPost(post);
  }, [onEditPost]);

  const handleDelete = useCallback((postId: string) => {
    onDeletePost(postId);
  }, [onDeletePost]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    console.log('Setting up intersection observer:', {
      hasLoadMoreRef: !!loadMoreRef.current,
      hasOnLoadMore: !!onLoadMore,
      hasMore,
      isLoadingMore
    });

    if (!loadMoreRef.current || !onLoadMore || !hasMore || isLoadingMore) {
      console.log('Skipping intersection observer setup');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          console.log('Intersection entry:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            hasMore,
            isLoadingMore
          });
          
          if (entry.isIntersecting && hasMore && !isLoadingMore) {
            console.log('🚀 Triggering auto-load more posts');
            onLoadMore();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '20px',
      }
    );

    const currentRef = loadMoreRef.current;
    console.log('Observing element:', currentRef);
    observer.observe(currentRef);

    return () => {
      console.log('Cleaning up intersection observer');
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {showCreateForm && currentUserId && (
        <div className="px-4">
          <CreatePostForm onSubmit={handleCreatePost} isLoading={isLoading} />
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
            <div key={post.id}>
              <PostCard
                post={post}
                currentUserId={currentUserId}
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLiked={likedPosts.has(post.id)}
              />
            </div>
          ))
        )}
      </div>
      
      {/* Infinite scroll trigger - should be visible when we have more content to load */}
      {hasMore && !isLoadingMore && posts.length > 0 && (
        <div 
          ref={loadMoreRef} 
          className="w-full h-20 flex items-center justify-center bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200"
          style={{ minHeight: '50px' }}
        >
          <div className="text-xs text-gray-400">Scroll to load more...</div>
        </div>
      )}
      
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading more posts...</p>
          </div>
        </div>
      )}

      {/* Manual Load More button as fallback */}
      {/* {hasMore && !isLoadingMore && !isLoading && posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Load More
          </button>
        </div>
      )} */}

      {/* No more posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">You&apos;ve seen all the posts!</p>
        </div>
      )}
      
      {isLoading && posts.length === 0 && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading posts...</p>
          </div>
        </div>
      )}
    </div>
  )
});
