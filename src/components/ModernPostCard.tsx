'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Trash2, 
  Edit, 
  ImageOff,
  Send
} from 'lucide-react'
import { Post } from '@/lib/supabaseClient'

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

interface PostCardProps {
  post: Post
  currentUserId?: string
  currentUser?: {
    username: string
    avatar_url?: string
  }
  onLike?: (postId: string) => void
  onComment?: (postId: string, content: string) => Promise<Comment | null>
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  isLiked?: boolean
}

export function PostCard({
  post,
  currentUserId,
  currentUser,
  onLike,
  onComment,
  onEdit,
  onDelete,
  isLiked = false,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const isOwner = currentUserId === post.user_id

  const categoryColors = {
    general: 'bg-blue-100 text-blue-700 border-blue-200',
    announcement: 'bg-purple-100 text-purple-700 border-purple-200',
    question: 'bg-green-100 text-green-700 border-green-200',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const loadComments = async () => {
    if (loadingComments) return
    
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentToggle = () => {
    if (!showComments && comments.length === 0) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment || !currentUserId) return

    const commentContent = newComment.trim()
    setSubmittingComment(true)
    
    // Optimistically add the comment to local state for immediate UI update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: commentContent,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      user: {
        username: currentUser?.username || 'You',
        avatar_url: currentUser?.avatar_url
      }
    }
    
    // Add the optimistic comment immediately
    setComments(prevComments => [...prevComments, optimisticComment])
    setNewComment('')

    try {
      const newComment = await onComment?.(post.id, commentContent)
      if (newComment) {
        // Replace the optimistic comment with the real one
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === optimisticComment.id ? newComment : comment
          )
        )
      } else {
        // Fallback to reloading all comments if no comment returned
        await loadComments()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      // Remove the optimistic comment on error
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== optimisticComment.id)
      )
      // Restore the comment text
      setNewComment(commentContent)
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
            <AvatarImage src={post.users?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {post.users?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {post.users?.username}
              </h3>
              <Badge className={`text-xs px-2 py-1 rounded-full border ${categoryColors[post.category]}`}>
                {post.category}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {isOwner && (
            <>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(post)}
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full w-8 h-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(post.id)}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full w-8 h-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full w-8 h-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
        
        {/* Image */}
        {post.image_url && (
          <div className="relative">
            {!imageError ? (
              <Image
                src={post.image_url}
                alt="Post image"
                width={600}
                height={400}
                className="w-full max-h-96 object-cover"
                onError={() => setImageError(true)}
                unoptimized={true}
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Image unavailable</p>
                  <a 
                    href={post.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-xs"
                  >
                    View original
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(post.id)}
                className={`flex items-center space-x-1 hover:bg-transparent p-0 ${
                  isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                } transition-colors`}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''} transition-all hover:scale-110`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentToggle}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-500 hover:bg-transparent p-0 transition-colors"
              >
                <MessageCircle className="h-6 w-6 transition-all hover:scale-110" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-gray-700 hover:text-green-500 hover:bg-transparent p-0 transition-colors"
              >
                <Share className="h-6 w-6 transition-all hover:scale-110" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-yellow-500 hover:bg-transparent p-0 transition-colors"
            >
              <Bookmark className="h-6 w-6 transition-all hover:scale-110" />
            </Button>
          </div>

          {/* Like Count */}
          {post.like_count > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
              </p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            {/* Existing Comments */}
            {loadingComments ? (
              <div className="text-center text-gray-500 py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="ml-2 text-sm">Loading comments...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.avatar_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl px-3 py-2">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.user?.username}
                        </p>
                        <p className="text-sm text-gray-800">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 pl-3">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center text-gray-500 py-6">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">Be the first to comment!</p>
                  </div>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            {currentUserId && (
              <form onSubmit={handleSubmitComment} className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-none bg-gray-50 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    disabled={submittingComment}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 p-0 disabled:opacity-50"
                  >
                    {submittingComment ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
