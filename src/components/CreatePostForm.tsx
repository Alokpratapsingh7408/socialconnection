'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>
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
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    // Validate image URL if provided
    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim())
      } catch {
        setError('Please enter a valid image URL')
        return
      }
    }
    
    setLocalLoading(true)
    setError(null)
    
    try {
      await onSubmit({
        content: content.trim(),
        category,
        image_url: imageUrl.trim() || undefined,
      })
      
      // Only clear form on successful submission
      setContent('')
      setImageUrl('')
      setCategory('general')
    } catch (err) {
      setError('Failed to create post. Please try again.')
      console.error('Form submission error:', err)
    } finally {
      setLocalLoading(false)
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

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={localLoading || isLoading || !content.trim() || remainingChars < 0}
          >
            {(localLoading || isLoading) ? 'Posting...' : 'Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
