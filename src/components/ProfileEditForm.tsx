import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, X } from 'lucide-react'
import { User } from '@/lib/supabaseClient'

interface ProfileEditFormProps {
  user: User
  onSubmit: (data: ProfileEditData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface ProfileEditData {
  username: string
  bio: string
  avatar_url: string
  website: string
  location: string
}

export function ProfileEditForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileEditData>({
    username: user.username || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || '',
    website: user.website || '',
    location: user.location || '',
  })
  const [errors, setErrors] = useState<Partial<ProfileEditData>>({})
  const [localLoading, setLocalLoading] = useState(false)

  const validateForm = useCallback(() => {
    const newErrors: Partial<ProfileEditData> = {}

    // Only validate required username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    // Bio length check (optional field)
    if (formData.bio.length > 160) {
      newErrors.bio = 'Bio must be less than 160 characters'
    }

    // Only validate website if it's provided and not empty
    if (formData.website && formData.website.trim() && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    // Only validate avatar URL if it's provided and not empty (allow blob URLs and data URLs)
    if (formData.avatar_url && formData.avatar_url.trim() && 
        !isValidUrl(formData.avatar_url) && 
        !formData.avatar_url.startsWith('blob:') && 
        !formData.avatar_url.startsWith('data:')) {
      newErrors.avatar_url = 'Please enter a valid image URL'
    }

    setErrors(newErrors)
    console.log('Validation results:', { 
      formData, 
      errors: newErrors, 
      errorCount: Object.keys(newErrors).length,
      isValid: Object.keys(newErrors).length === 0 
    })
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Validate form on mount and when formData changes
  useEffect(() => {
    validateForm()
  }, [validateForm])

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!')
    console.log('Form data:', formData)
    console.log('Errors:', errors)
    
    const isValid = validateForm()
    console.log('Form validation result:', isValid)
    
    if (!isValid) {
      console.log('Form validation failed, not submitting')
      return
    }

    console.log('Starting profile update...')
    setLocalLoading(true)
    try {
      console.log('Calling onSubmit with data:', formData)
      await onSubmit(formData)
      console.log('Profile update completed successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileEditData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const bioLength = formData.bio.length
  const bioLimit = 160

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-500 rounded-3xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit Profile
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full p-3"
        >
          <X className="h-6 w-6" />
        </Button>
      </CardHeader>

      <CardContent className="px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-6 py-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl">
            <div className="relative group">
              <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl transition-transform group-hover:scale-105">
                <AvatarImage src={formData.avatar_url} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {formData.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Avatar URL Input */}
            <div className="w-full max-w-md">
              <Label htmlFor="avatar_url" className="text-lg font-semibold text-gray-700">Avatar URL</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={`mt-2 rounded-2xl border-2 py-3 px-4 text-lg transition-all focus:ring-4 focus:ring-blue-100 ${
                  errors.avatar_url ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {errors.avatar_url && (
                <div className="flex items-center space-x-2 text-red-500 text-sm mt-2 bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.avatar_url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-3">
            <Label htmlFor="username" className="text-lg font-semibold text-gray-700">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter your username"
              className={`rounded-2xl border-2 py-4 px-4 text-lg transition-all focus:ring-4 focus:ring-blue-100 ${
                errors.username ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              maxLength={20}
            />
            {errors.username && (
              <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio" className="text-lg font-semibold text-gray-700">Bio</Label>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                bioLength > bioLimit - 20 ? 'text-red-600 bg-red-100' : 'text-gray-500 bg-gray-100'
              }`}>
                {bioLength}/{bioLimit}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell people about yourself..."
              className={`resize-none rounded-2xl border-2 py-4 px-4 text-lg transition-all focus:ring-4 focus:ring-blue-100 ${
                errors.bio ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              rows={4}
              maxLength={bioLimit}
            />
            {errors.bio && (
              <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.bio}</span>
              </div>
            )}
          </div>

          {/* Website */}
          <div className="space-y-3">
            <Label htmlFor="website" className="text-lg font-semibold text-gray-700">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className={`rounded-2xl border-2 py-4 px-4 text-lg transition-all focus:ring-4 focus:ring-blue-100 ${
                errors.website ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {errors.website && (
              <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.website}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-lg font-semibold text-gray-700">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
              className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 py-4 px-4 text-lg transition-all focus:ring-4 focus:ring-blue-100"
              maxLength={50}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || localLoading}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-lg transition-all transform hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || localLoading || Object.keys(errors).length > 0}
              onClick={() => console.log('Save button clicked! Errors count:', Object.keys(errors).length)}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading || localLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
