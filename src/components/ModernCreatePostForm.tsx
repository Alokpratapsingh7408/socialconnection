'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Image as ImageIcon, 
  Smile,
  MapPin,
  X,
  Send
} from 'lucide-react'

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
  const [showImageInput, setShowImageInput] = useState(false)
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
      
      // Reset form
      setContent('')
      setCategory('general')
      setImageUrl('')
      setShowImageInput(false)
    } catch (error) {
      setError('Failed to create post. Please try again.')
    } finally {
      setLocalLoading(false)
    }
  }

  const categoryOptions = [
    { value: 'general', label: 'General', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'announcement', label: 'Announcement', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'question', label: 'Question', color: 'bg-green-100 text-green-700 border-green-200' },
  ] as const

  const characterLimit = 280
  const charactersLeft = characterLimit - content.length

  return (
    <Card className="w-full bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header with Avatar */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                U
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              {/* Content Textarea */}
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="border-none resize-none text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[100px]"
                  maxLength={characterLimit}
                />
                <div className={`text-xs mt-2 ${charactersLeft < 20 ? 'text-red-500' : 'text-gray-400'}`}>
                  {charactersLeft} characters remaining
                </div>
              </div>

              {/* Category Selection */}
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategory(option.value)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      category === option.value
                        ? option.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Image URL Input */}
              {showImageInput && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL..."
                      className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowImageInput(false)
                        setImageUrl('')
                      }}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full w-8 h-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-xs">{error}</p>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {imageUrl && !error && (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-2xl border border-gray-200"
                    onError={() => setError('Invalid image URL')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageInput(!showImageInput)}
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full p-2"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full p-2"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full p-2"
              >
                <MapPin className="h-5 w-5" />
              </Button>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || isLoading || localLoading || charactersLeft < 0}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading || localLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Post</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
