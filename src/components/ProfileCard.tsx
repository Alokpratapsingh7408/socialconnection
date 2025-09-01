'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Link as LinkIcon, Calendar, Edit } from 'lucide-react'
import { User } from '@/lib/supabaseClient'
import { ProfileEditForm } from './ProfileEditForm'

interface ProfileEditData {
  username: string
  bio: string
  avatar_url: string
  website: string
  location: string
}

interface ProfileCardProps {
  user: User
  currentUserId?: string
  isFollowing?: boolean
  onFollow?: (userId: string) => void
  onUnfollow?: (userId: string) => void
  onProfileUpdate?: (data: ProfileEditData) => Promise<void>
  isLoading?: boolean
}

export function ProfileCard({
  user,
  currentUserId,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onProfileUpdate,
  isLoading = false,
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const isOwnProfile = currentUserId === user.id
  const canFollow = currentUserId && !isOwnProfile

  // Debug logging
  console.log('ProfileCard Debug:', {
    currentUserId,
    userId: user.id,
    isOwnProfile,
    canFollow
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.(user.id)
    } else {
      onFollow?.(user.id)
    }
  }

  const handleProfileUpdate = async (data: ProfileEditData) => {
    await onProfileUpdate?.(data)
    setIsEditing(false)
  }

  if (isEditing && isOwnProfile) {
    return (
      <ProfileEditForm
        user={user}
        onSubmit={handleProfileUpdate}
        onCancel={() => setIsEditing(false)}
        isLoading={isLoading}
      />
    )
  }

  return (
    <Card className="w-full bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">  
      <CardHeader className="text-center px-6 py-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-white shadow-lg">
              <AvatarImage src={user.avatar_url} className="object-cover" />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
              {user.is_admin && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-2 py-0.5 rounded-full text-xs">
                  Admin
                </Badge>
              )}
              {user.is_private && (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5 rounded-full text-xs">
                  Private
                </Badge>
              )}
            </div>
            
            {user.bio && (
              <p className="text-gray-600 max-w-xs mx-auto leading-snug text-sm">{user.bio}</p>
            )}
          </div>

          <div className="flex justify-center space-x-3">
            {canFollow && (
              <Button
                onClick={handleFollowClick}
                variant={isFollowing ? 'outline' : 'default'}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all text-sm ${
                  isFollowing 
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isLoading 
                  ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) 
                  : isFollowing 
                    ? 'Following' 
                    : 'Follow'
                }
              </Button>
            )}

            {isOwnProfile && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {/* Stats */}
        <div className="flex justify-center space-x-8 py-3 mb-4 border-y border-gray-100">
          <div className="text-center group cursor-pointer">
            <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.posts_count || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Posts</div>
          </div>
          <div className="text-center group cursor-pointer">
            <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.followers_count || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Followers</div>
          </div>
          <div className="text-center group cursor-pointer">
            <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.following_count || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Following</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          {user.location && (
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{user.location}</span>
            </div>
          )}
          
          {user.website && (
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors truncate"
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium">Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
