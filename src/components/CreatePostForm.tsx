'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ImageUpload } from '@/components/ImageUpload'
import { uploadImage } from '@/lib/imageUpload'
import { supabase } from '@/lib/supabaseClient'
import { 
  Image as ImageIcon, 
  Smile,
  MapPin,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    if (!currentUserId) {
      setError('Please log in to create a post')
      return
    }
    
    setLocalLoading(true)
    setError(null)
    
    try {
      let imageUrl: string | undefined

      // Upload image if selected
      if (selectedFile) {
        setUploadingImage(true)
        const uploadResult = await uploadImage(selectedFile, 'posts', currentUserId)
        if (uploadResult.error) {
          setError(uploadResult.error)
          setUploadingImage(false)
          setLocalLoading(false)
          return
        }
        imageUrl = uploadResult.url || undefined
        setUploadingImage(false)
      }
      
      await onSubmit({
        content: content.trim(),
        category,
        image_url: imageUrl,
      })
      
      // Reset form
      setContent('')
      setCategory('general')
      setSelectedFile(null)
      setImagePreview(null)
      setShowImageUpload(false)
    } catch {
      setError('Failed to create post. Please try again.')
    } finally {
      setLocalLoading(false)
      setUploadingImage(false)
    }
  }

  const handleImageSelect = (file: File | null) => {
    setSelectedFile(file)
    if (!file && showImageUpload) {
      setShowImageUpload(false)
    }
  }

  const handleImagePreview = (previewUrl: string | null) => {
    setImagePreview(previewUrl)
  }

  const categoryOptions = [
    { value: 'general', label: 'General', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'announcement', label: 'Announcement', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'question', label: 'Question', color: 'bg-green-100 text-green-700 border-green-200' },
  ] as const

  const characterLimit = 280
  const charactersLeft = characterLimit - content.length
  const isFormValid = content.trim() && charactersLeft >= 0 && !uploadingImage

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

              {/* Image Upload */}
              {showImageUpload && (
                <div className="space-y-2">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    onImagePreview={handleImagePreview}
                    disabled={uploadingImage || isLoading || localLoading}
                    variant="post"
                  />
                  {uploadingImage && (
                    <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-xl">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Uploading image...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
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
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={uploadingImage || isLoading || localLoading}
                className={`rounded-full p-2 ${
                  showImageUpload || selectedFile
                    ? 'text-blue-600 bg-blue-100'
                    : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full p-2"
                disabled={uploadingImage || isLoading || localLoading}
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full p-2"
                disabled={uploadingImage || isLoading || localLoading}
              >
                <MapPin className="h-5 w-5" />
              </Button>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading || localLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading || localLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : uploadingImage ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
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
