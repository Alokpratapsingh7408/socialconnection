'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react'
import { User } from '@/lib/supabaseClient'

interface ProfileCardProps {
  user: User
  currentUserId?: string
  isFollowing?: boolean
  onFollow?: (userId: string) => void
  onUnfollow?: (userId: string) => void
  isLoading?: boolean
}

export function ProfileCard({
  user,
  currentUserId,
  isFollowing = false,
  onFollow,
  onUnfollow,
  isLoading = false,
}: ProfileCardProps) {
  const isOwnProfile = currentUserId === user.id
  const canFollow = currentUserId && !isOwnProfile

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

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-2xl">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">{user.username}</h2>
              {user.is_admin && (
                <Badge variant="secondary">Admin</Badge>
              )}
              {user.is_private && (
                <Badge variant="outline">Private</Badge>
              )}
            </div>
            
            {user.bio && (
              <p className="text-gray-600 max-w-md">{user.bio}</p>
            )}
          </div>

          {canFollow && (
            <Button
              onClick={handleFollowClick}
              variant={isFollowing ? 'outline' : 'default'}
              disabled={isLoading}
              className="w-32"
            >
              {isLoading 
                ? 'Loading...' 
                : isFollowing 
                  ? 'Unfollow' 
                  : 'Follow'
              }
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex justify-center space-x-8 py-4 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold">{user.posts_count}</div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.followers_count}</div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.following_count}</div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          {user.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{user.location}</span>
            </div>
          )}
          
          {user.website && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <LinkIcon className="h-4 w-4" />
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {user.website}
              </a>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
