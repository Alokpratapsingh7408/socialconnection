import { supabase } from './supabaseClient'

export interface UploadResult {
  url: string | null
  error: string | null
}

export async function uploadImage(
  file: File,
  bucket: 'avatars' | 'posts',
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
      }
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        url: null,
        error: 'Image file size must be less than 5MB'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        url: null,
        error: 'Failed to upload image. Please try again.'
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      error: null
    }
  } catch (error) {
    console.error('Image upload error:', error)
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the image'
    }
  }
}

export async function deleteImage(
  url: string,
  bucket: 'avatars' | 'posts',
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: 'Failed to delete image'
      }
    }

    return {
      success: true,
      error: null
    }
  } catch (error) {
    console.error('Image delete error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the image'
    }
  }
}

export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeImagePreview(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return 'Image file size must be less than 5MB'
  }

  return null
}