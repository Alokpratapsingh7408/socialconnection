'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showEmojiPicker])

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
    '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
    '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮',
    '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
    '😩', '😫', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '👻', '👽', '👾', '🤖', '💩', '😺', '😸',
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇',
    '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤝', '🙏', '💪', '🦵', '🦶', '👂',
    '👀', '🧠', '🦷', '🦴', '👅', '👄', '💋', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️',
    '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨',
    '🎉', '🎊', '🎁', '🎈', '🎂', '🎀', '🎗️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾',
    '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋'
  ]

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    
    setContent(newContent)
    setShowEmojiPicker(false)
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

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
                  ref={textareaRef}
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
            <div className="flex items-center space-x-3 relative">
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
              
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`rounded-full p-2 ${
                    showEmojiPicker
                      ? 'text-yellow-600 bg-yellow-100'
                      : 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                  disabled={uploadingImage || isLoading || localLoading}
                >
                  <Smile className="h-5 w-5" />
                </Button>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-80 max-h-64 overflow-y-auto z-50"
                  >
                    <div className="text-sm font-medium text-gray-700 mb-3">Choose an emoji</div>
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors duration-150 flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
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
