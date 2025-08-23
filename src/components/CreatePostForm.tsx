'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => void
  isLoading?: boolean
}

interface CreatePostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

export function CreatePostForm({ onSubmit, isLoading = false }: CreatePostFormProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<CreatePostData['category']>('general')
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit({
        content: content.trim(),
        category,
        image_url: imageUrl.trim() || undefined,
      })
      setContent('')
      setImageUrl('')
      setCategory('general')
    }
  }

  const remainingChars = 280 - content.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What&apos;s on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={280}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2">
              {(['general', 'announcement', 'question'] as const).map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !content.trim() || remainingChars < 0}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
