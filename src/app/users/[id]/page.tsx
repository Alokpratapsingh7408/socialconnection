'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ProfileCard } from '@/components/ProfileCard'
import { ModernFeed } from '@/components/ModernFeed'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { supabase, User, Post } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function UserProfile() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

 

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session check:', session ? 'exists' : 'no session')
      
      if (session?.user) {
        // Set current user ID immediately from session
        setCurrentUserId(session.user.id)
        
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        console.log('API response status:', response.status)
        
        if (response.ok) {
          const userData = await response.json()
          console.log('Current user data:', userData)
          setCurrentUser(userData)
          // Only call these functions if we have a valid user ID
          if (userData && userData.id) {
            checkFollowStatus(userData.id)
            fetchLikedPosts(userData.id)
          }
        } else {
          console.error('API call failed:', response.status, response.statusText)
          // Even if API fails, we still have the user ID from session
        }
      } else {
        // No session means user is not authenticated
        console.log('No session found - user not authenticated')
        setCurrentUser(null)
        setCurrentUserId(null)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      setCurrentUser(null)
      setCurrentUserId(null)
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
    setIsLoading(false)
  }, [userId])

  const fetchUserPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
    }
  }, [userId])

  const fetchLikedPosts = async (currentUserId: string) => {
    if (!currentUserId) {
      console.warn('Cannot fetch liked posts: currentUserId is undefined')
      return
    }
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId)
      
      if (data) {
        setLikedPosts(new Set(data.map(like => like.post_id)))
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    }
  }


   useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchCurrentUser()
      fetchUserPosts()
    }
  }, [userId, fetchUserProfile, fetchCurrentUser, fetchUserPosts])

  const checkFollowStatus = async (currentUserId: string) => {
    if (!currentUserId || currentUserId === userId) {
      console.warn('Cannot check follow status: currentUserId is undefined or same as target user')
      return
    }

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single()
      
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        setIsFollowing(true)
        // Update follower count
        if (user) {
          setUser({ ...user, followers_count: user.followers_count + 1 })
        }
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async () => {
    if (!currentUser) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        setIsFollowing(false)
        // Update follower count
        if (user) {
          setUser({ ...user, followers_count: user.followers_count - 1 })
        }
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const handleProfileUpdate = async (data: {
    username: string
    bio: string
    avatar_url: string
    website: string
    location: string
  }) => {
    console.log('handleProfileUpdate called with:', data)
    console.log('Current user:', currentUser)
    console.log('User ID from URL:', userId)
    
    // Fix: Access the correct user ID from the nested structure
    const currentUserObj = currentUser as { profile?: { id: string } } & { id?: string }
    const currentUserId = currentUserObj?.profile?.id || currentUserObj?.id
    console.log('Current user ID:', currentUserId)
    console.log('Can update?', currentUser && currentUserId === userId)
    
    if (!currentUser || currentUserId !== userId) {
      console.log('Cannot update profile - either not logged in or not own profile')
      return
    }

    try {
      console.log('Making API call to update profile...')
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(data),
      })

      console.log('API response status:', response.status)
      
      if (response.ok) {
        const updatedUser = await response.json()
        console.log('Profile updated successfully:', updatedUser)
        setUser(updatedUser)
      } else {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) return

    try {
      const isLiked = likedPosts.has(postId)
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        const newLikedPosts = new Set(likedPosts)
        if (isLiked) {
          newLikedPosts.delete(postId)
        } else {
          newLikedPosts.add(postId)
        }
        setLikedPosts(newLikedPosts)
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!currentUser) return null
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No access token available')
        return null
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add comment')
      }

      const data = await response.json()
      // Reload posts to update comment count
      await fetchUserPosts()
      return data.comment
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <p className="text-gray-600 mt-2">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">
            {user.username || 'User Profile'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <ProfileCard
              user={user}
              currentUserId={currentUser?.id || currentUserId || undefined}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>

          {/* Posts Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Posts by {user.username}
                </h2>
              </div>
              {posts.length > 0 ? (
                <ModernFeed
                  posts={posts}
                  currentUserId={currentUser?.id || currentUserId || undefined}
                  currentUser={currentUser ? {
                    username: currentUser.username,
                    avatar_url: currentUser.avatar_url
                  } : undefined}
                  onCreatePost={async () => {}} // Not used on profile pages - async empty function
                  onLike={handleLike}
                  onComment={handleComment}
                  onEditPost={() => {}}
                  onDeletePost={async () => {}} // Fix this one too
                  likedPosts={likedPosts}
                  showCreateForm={false}
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No posts yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
