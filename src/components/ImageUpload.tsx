'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon,
  Camera,
  FileImage
} from 'lucide-react'
import { validateImageFile, createImagePreview, revokeImagePreview } from '@/lib/imageUpload'

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void
  onImagePreview?: (previewUrl: string | null) => void
  currentImageUrl?: string
  disabled?: boolean
  className?: string
  variant?: 'avatar' | 'post'
  children?: React.ReactNode
}

export function ImageUpload({
  onImageSelect,
  onImagePreview,
  currentImageUrl,
  disabled = false,
  className = '',
  variant = 'post',
  children
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) {
        revokeImagePreview(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (file: File | null) => {
    // Cleanup previous preview
    if (previewUrl) {
      revokeImagePreview(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      setError(null)
      onImageSelect(null)
      onImagePreview?.(null)
      return
    }

    // Validate file
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Create preview
    const preview = createImagePreview(file)
    setSelectedFile(file)
    setPreviewUrl(preview)
    setError(null)
    onImageSelect(file)
    onImagePreview?.(preview)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    handleFileSelect(null)
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const displayUrl = previewUrl || currentImageUrl
  const hasImage = !!displayUrl

  if (variant === 'avatar') {
    return (
      <div className={`relative group ${className}`}>
        <div
          className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl cursor-pointer transition-all group-hover:scale-105 ${
            isDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {hasImage ? (
            <img
              src={displayUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Camera className="h-12 w-12 text-white" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Remove button */}
        {hasImage && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
            className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Post variant
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : hasImage
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasImage ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={displayUrl}
                alt="Upload preview"
                className="w-full max-h-64 object-cover"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-center">
              <p className="text-green-600 font-medium">Image selected</p>
              <p className="text-gray-500 text-sm">Click to change or drag a new image</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="h-12 w-12 text-blue-500 animate-bounce" />
              ) : (
                <FileImage className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragOver ? 'Drop your image here' : 'Upload an image'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Drag and drop or click to browse (JPEG, PNG, GIF, WebP • Max 5MB)
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Custom children (for additional buttons, etc.) */}
      {children}
    </div>
  )
}