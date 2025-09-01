'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Heart, 
  MessageCircle, 
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
  onLike?: (postId: string) => void
  onComment?: (postId: string, content: string) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  isLiked?: boolean
}

export function PostCard({
  post,
  currentUserId,
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
    general: 'bg-gray-100 text-gray-800',
    announcement: 'bg-blue-100 text-blue-800',
    question: 'bg-green-100 text-green-800',
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
    if (!newComment.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      await onComment?.(post.id, newComment.trim())
      setNewComment('')
      // Reload comments to show the new one
      await loadComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user?.avatar_url} />
              <AvatarFallback>
                {post.user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.user?.username}</p>
              <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={categoryColors[post.category]}>
              {post.category}
            </Badge>
            {isOwner && (
              <div className="flex space-x-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(post)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <div className="mb-4">
            {!imageError ? (
              <Image
                src={post.image_url}
                alt="Post image"
                width={500}
                height={300}
                className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                onError={() => setImageError(true)}
                unoptimized={true}
              />
            ) : (
              <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                  <ImageOff className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Failed to load image</p>
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

        <div className="flex items-center space-x-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id)}
            className={`flex items-center space-x-1 ${
              isLiked ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.like_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCommentToggle}
            className="flex items-center space-x-1 text-gray-600"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comment_count}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {/* Existing Comments */}
            {loadingComments ? (
              <div className="text-center text-gray-500 py-4">
                Loading comments...
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.avatar_url} />
                      <AvatarFallback>
                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="font-semibold text-sm">{comment.user?.username}</p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            {currentUserId && (
              <form onSubmit={handleSubmitComment} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {/* You can pass current user data if available */}
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                    disabled={submittingComment}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                  >
                    <Send className="h-4 w-4" />
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
