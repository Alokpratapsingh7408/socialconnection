'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ProfileCard } from '@/components/ProfileCard'
import { Feed } from '@/components/Feed'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { supabase, User, Post } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function UserProfile() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchCurrentUser()
      fetchUserPosts()
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData)
          checkFollowStatus(userData.id)
          fetchLikedPosts(userData.id)
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUserProfile = async () => {
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
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
    }
  }

  const fetchLikedPosts = async (currentUserId: string) => {
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

  const checkFollowStatus = async (currentUserId: string) => {
    if (currentUserId === userId) return

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
              currentUserId={currentUser?.id}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
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
                <Feed
                  posts={posts}
                  currentUserId={currentUser?.id}
                  onCreatePost={() => {}} // Not used on profile pages
                  onLike={handleLike}
                  onComment={() => {}}
                  onEditPost={() => {}}
                  onDeletePost={() => {}}
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
