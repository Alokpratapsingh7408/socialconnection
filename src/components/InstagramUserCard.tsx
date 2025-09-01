'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Heart,
  Settings,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  bio?: string
  avatar_url?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_admin?: boolean
  created_at: string
}

interface InstagramUserCardProps {
  user: UserProfile
  currentUserId?: string
  isFollowing?: boolean
  onFollow?: (userId: string) => void
  onUnfollow?: (userId: string) => void
  isLoading?: boolean
  showStats?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function InstagramUserCard({
  user,
  currentUserId,
  isFollowing = false,
  onFollow,
  onUnfollow,
  isLoading = false,
  showStats = true,
  size = 'md'
}: InstagramUserCardProps) {
  const isOwnProfile = currentUserId === user.id
  const canFollow = currentUserId && !isOwnProfile

  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.(user.id)
    } else {
      onFollow?.(user.id)
    }
  }

  const avatarSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }

  const cardPadding = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-md">
      <CardContent className={cardPadding[size]}>
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Link href={`/users/${user.id}`} className="shrink-0">
            <div className="relative group">
              <Avatar className={`${avatarSizes[size]} ring-2 ring-offset-2 ring-gray-200 group-hover:ring-blue-400 transition-all duration-300 cursor-pointer`}>
                <AvatarImage 
                  src={user.avatar_url} 
                  className="object-cover" 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
          </Link>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Username and badges */}
                <Link href={`/users/${user.id}`} className="hover:underline">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-900 truncate text-lg">
                      {user.username}
                    </h3>
                    {user.is_admin && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        ✓ Admin
                      </Badge>
                    )}
                  </div>
                </Link>
                
                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {user.bio}
                  </p>
                )}
                
                {/* Stats */}
                {showStats && (
                  <div className="flex items-center space-x-6 text-sm">
                    {/* <div className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-semibold">{user.posts_count}</span>
                      <span>posts</span>
                    </div> */}
                    <div className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{user.followers_count}</span>
                      <span>followers</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
                      <Heart className="h-4 w-4" />
                      <span className="font-semibold">{user.following_count}</span>
                      <span>following</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm" className="min-w-[90px]">
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : canFollow ? (
                  <Button
                    onClick={handleFollowClick}
                    disabled={isLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className={`min-w-[100px] font-semibold transition-all duration-200 ${
                      isFollowing 
                        ? 'hover:bg-red-50 hover:border-red-300 hover:text-red-600 bg-white text-gray-700' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                ) : null}
                
                {!isOwnProfile && (
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
