'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Post } from '@/lib/supabaseClient'

interface EditPostFormProps {
  post: Post
  onSubmit: (postId: string, data: EditPostData) => void
  onCancel: () => void
  isLoading?: boolean
}

interface EditPostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

export function EditPostForm({ post, onSubmit, onCancel, isLoading = false }: EditPostFormProps) {
  const [content, setContent] = useState(post.content)
  const [category, setCategory] = useState<EditPostData['category']>(post.category as EditPostData['category'])
  const [imageUrl, setImageUrl] = useState(post.image_url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(post.id, {
        content: content.trim(),
        category,
        image_url: imageUrl.trim() || undefined,
      })
    }
  }

  const remainingChars = 280 - content.length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Post</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={280}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <div className="flex space-x-2">
              {(['general', 'announcement', 'question'] as const).map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={!content.trim() || remainingChars < 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Post'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
