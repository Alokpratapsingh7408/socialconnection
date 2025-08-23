'use client'

import { useState, useEffect } from 'react'
import { Feed } from '@/components/Feed'
import { AuthForm } from '@/components/AuthForm'
import { EditPostForm } from '@/components/EditPostForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, Post } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Bell, User as UserIcon, Shield, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'

interface CreatePostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

interface EditPostData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image_url?: string
}

type AuthStep = 'login' | 'register' | 'verify-email' | 'check-email'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('login')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setAuthStep('login')
          setAuthMessage(null)
          setAuthError(null)
          await fetchPosts()
          await fetchLikedPosts(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setPosts([])
          setLikedPosts(new Set())
          setAuthStep('login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPosts()
      fetchLikedPosts(user.id)
    } else {
      fetchPosts() // Show public posts even when not logged in
    }
  }, [user])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const fetchLikedPosts = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
      
      if (data) {
        setLikedPosts(new Set(data.map(like => like.post_id)))
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    }
  }

  const handleAuth = async (formData: { email: string; password: string; username?: string }) => {
    setIsLoading(true)
    setAuthError(null)
    setAuthMessage(null)
    setUserEmail(formData.email)
    
    try {
      if (authStep === 'register') {
        // Register new user using our API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const data = await response.json()
          setAuthMessage(data.message)
          // Automatically switch to login mode
          setAuthStep('login')
        } else {
          const errorData = await response.json()
          setAuthError(errorData.error || 'Registration failed')
        }
      } else {
        // Login existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setAuthStep('check-email')
            setAuthMessage('Please check your email and click the verification link to verify your account.')
          } else {
            setAuthError(error.message)
          }
        } else if (data.session) {
          setAuthMessage('Welcome back! Signed in successfully.')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    }
    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!userEmail) return
    
    setIsLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Verification email sent! Please check your inbox.')
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthMessage('Signed out successfully.')
  }

  const handleCreatePost = async (postData: CreatePostData): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session')
      }
      
      console.log('Creating post with data:', postData)
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(postData),
      })

      console.log('Post creation response:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('Post created successfully:', result)
        
        // Refresh posts
        await fetchPosts()
        
        // Show success message
        setAuthMessage('Post created successfully!')
        setTimeout(() => setAuthMessage(null), 3000)
      } else {
        const errorData = await response.json()
        console.error('Post creation failed:', errorData)
        setAuthError(errorData.error || 'Failed to create post')
        throw new Error(errorData.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Create post error:', error)
      setAuthError('Failed to create post')
      throw error // Re-throw so the form can handle it
    }
  }

  const handleLike = async (postId: string) => {
    if (!user) {
      setAuthError('Please sign in to like posts')
      return
    }

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
        // Update local state optimistically
        const newLikedPosts = new Set(likedPosts)
        if (isLiked) {
          newLikedPosts.delete(postId)
        } else {
          newLikedPosts.add(postId)
        }
        setLikedPosts(newLikedPosts)
        
        // Update post like count
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
    if (!user) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      // Reload posts to update comment count
      await fetchPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setAuthError(null)
    setAuthMessage(null)
  }

  const handleUpdatePost = async (postId: string, postData: EditPostData) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        const { post: updatedPost } = await response.json()
        // Update the post in the local state
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p))
        setEditingPost(null)
        setAuthMessage('Post updated successfully!')
        setTimeout(() => setAuthMessage(null), 3000)
      } else {
        const data = await response.json()
        setAuthError(data.error || 'Failed to update post')
      }
    } catch (error) {
      console.error('Update post error:', error)
      setAuthError('Failed to update post')
    }
    setIsLoading(false)
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
  }

  const handleDeletePost = async (postId: string) => {
    if (!user) return
    
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        })

        if (response.ok) {
          setPosts(prev => prev.filter(post => post.id !== postId))
          setAuthMessage('Post deleted successfully!')
          setTimeout(() => setAuthMessage(null), 3000)
        } else {
          const data = await response.json()
          setAuthError(data.error || 'Failed to delete post')
        }
      } catch (error) {
        console.error('Delete post error:', error)
        setAuthError('Failed to delete post')
      }
    }
  }

  // Email verification page
  if (authStep === 'check-email') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We sent a verification link to <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Check your email inbox (and spam folder)</p>
              <p>2. Click the verification link</p>
              <p>3. You&apos;ll be automatically signed in</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification} 
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              
              <Button 
                onClick={() => {
                  setAuthStep('login')
                  setAuthMessage(null)
                  setAuthError(null)
                }}
                variant="ghost"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>

            {authMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{authMessage}</span>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{authError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authentication page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SocialConnect</h1>
            <p className="text-gray-600">Connect with friends and share your thoughts</p>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-center space-x-1 mb-4">
                <Button
                  onClick={() => {
                    setAuthStep('login')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                  variant={authStep === 'login' ? 'default' : 'outline'}
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setAuthStep('register')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                  variant={authStep === 'register' ? 'default' : 'outline'}
                  size="sm"
                >
                  Sign Up
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AuthForm 
                mode={authStep === 'register' ? 'register' : 'login'} 
                onSubmit={handleAuth} 
                isLoading={isLoading} 
              />

              {authMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{authMessage}</span>
                </div>
              )}

              {authError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{authError}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setUser({ id: 'guest' } as User)
              }}
              className="text-sm"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success/Error Messages Bar */}
      {(authMessage || authError) && (
        <div className={`w-full p-3 text-center text-sm font-medium ${
          authMessage ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            {authMessage ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{authMessage || authError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuthMessage(null)
                setAuthError(null)
              }}
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">SocialConnect</h1>
          <div className="flex items-center space-x-4">
            {user && user.id !== 'guest' ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                </Link>
                <Link href={`/users/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {user.user_metadata?.is_admin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-gray-600">
                  Welcome back!
                </span>
                <Button onClick={handleLogout} variant="outline">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => setUser(null)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8">
        {editingPost && (
          <div className="mb-6">
            <EditPostForm
              post={editingPost}
              onSubmit={handleUpdatePost}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          </div>
        )}
        
        <Feed
          posts={posts}
          currentUserId={user?.id !== 'guest' ? user?.id : undefined}
          onCreatePost={handleCreatePost}
          onLike={handleLike}
          onComment={handleComment}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          likedPosts={likedPosts}
          isLoading={false}
          showCreateForm={!!(user && user.id !== 'guest') && !editingPost}
        />
      </main>
    </div>
  )
}
