'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import debounce from 'lodash/debounce'
import { ModernFeed } from '@/components/ModernFeed'
import { AuthForm } from '@/components/AuthForm'
import { EditPostForm } from '@/components/EditPostForm'
import { NotificationBell } from '@/components/NotificationBell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, Post, User as DBUser } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Bell, User as UserIcon, Shield, CheckCircle, AlertCircle, Mail, Users } from 'lucide-react'
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
  const [userProfile, setUserProfile] = useState<DBUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  // Removed unused updateQueue state
  
  // Throttle post updates to prevent excessive re-renders
  const throttledSetPosts = useMemo(
    () => 
      debounce((updateFn: (prev: Post[]) => Post[]) => {
        setPosts(prev => {
          const newPosts = updateFn(prev);
          return newPosts;
        });
      }, 100), // 100ms debounce time
    []
  );

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      throttledSetPosts.cancel();
    };
  }, [throttledSetPosts]);

  // Cleanup the debounced function on unmount
  useEffect(() => {
    return () => {
      throttledSetPosts.cancel();
    };
  }, [throttledSetPosts]);

  const [authStep, setAuthStep] = useState<AuthStep>('login')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  // Function to fetch full user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile || data) // Handle different API response formats
        console.log('User profile loaded for:', userId)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsAuthLoading(false) // Set loading to false after auth check
      }
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
          await fetchUserProfile(session.user.id)
          await fetchPosts()
          await fetchLikedPosts(session.user.id)
          setIsAuthLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setPosts([])
          setLikedPosts(new Set())
          setAuthStep('login')
          setIsAuthLoading(false)
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
    if (!userId) {
      console.warn('Cannot fetch liked posts: userId is undefined')
      return
    }
    
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
      // Always refresh the session before making API calls to ensure valid token
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error || !session?.access_token) {
        // If refresh fails, try to get the current session as fallback
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (!currentSession?.access_token) {
          throw new Error('Authentication session expired. Please sign in again.')
        }
      }
      
      const activeSession = session || await supabase.auth.getSession().then(({ data: { session } }) => session)
      
      console.log('Creating post with data:', postData)
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeSession?.access_token}`,
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
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          setAuthError('Your session has expired. Please sign in again.')
        } else {
          setAuthError(errorData.error || 'Failed to create post')
        }
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
      
      // Optimistically update UI immediately
      const newLikedPosts = new Set(likedPosts)
      if (isLiked) {
        newLikedPosts.delete(postId)
      } else {
        newLikedPosts.add(postId)
      }
      setLikedPosts(newLikedPosts)
      
      // Update post like count with throttling
      throttledSetPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) }
          : post
      ))

      // Then make API call
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        // Revert changes if API call fails
        const revertedLikedPosts = new Set(likedPosts)
        if (isLiked) {
          revertedLikedPosts.add(postId)
        } else {
          revertedLikedPosts.delete(postId)
        }
        setLikedPosts(revertedLikedPosts)
        
        throttledSetPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + (isLiked ? 1 : -1) }
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
      // Get the current session to get the access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No access token available')
        return
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="text-purple-100">
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

  // Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SocialConnect
          </h1>
          <p className="text-gray-600">Loading your experience...</p>
        </div>
      </div>
    )
  }

  // Authentication page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              SocialConnect
            </h1>
            <p className="text-gray-600 text-lg">Connect with friends and share your thoughts</p>
          </div>
          
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <div className="flex justify-center space-x-1 mb-4">
                <Button
                  onClick={() => {
                    setAuthStep('login')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                  variant={authStep === 'login' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={authStep === 'login' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setAuthStep('register')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                  variant={authStep === 'register' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={authStep === 'register' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}
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
              className="text-sm bg-white/80 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-full px-6 py-2"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SocialConnect
            </Link>
            
            <div className="flex items-center space-x-6">
              {user && user.id !== 'guest' ? (
                <>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5-4.25-9.5-9.5-9.5zm0 1.5c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm-1 4v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z"/>
                      </svg>
                    </Button>
                  </Link>
                  <Link href="/discover">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl">
                      <Users className="w-6 h-6" />
                    </Button>
                  </Link>
                  <Link href="/notifications">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl relative">
                      <Bell className="w-6 h-6" />
                      <NotificationBell 
                        userId={user?.id !== 'guest' ? user?.id : undefined} 
                        className="absolute -top-1 -right-1"
                      />
                    </Button>
                  </Link>
                  <Link href={`/users/${user.id}`}>
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl flex items-center space-x-2">
                      <UserIcon className="w-5 h-5" />
                      {userProfile?.username && (
                        <span className="hidden md:inline font-medium">{userProfile.username}</span>
                      )}
                    </Button>
                  </Link>
                  {(user.user_metadata?.is_admin || userProfile?.is_admin) && (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl">
                        <Shield className="w-6 h-6" />
                      </Button>
                    </Link>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setUser(null)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-6"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SocialConnect
            </Link>
            
            <div className="flex items-center space-x-4">
              {user && user.id !== 'guest' ? (
                <>
                  {/* <Link href="/notifications">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl relative p-2">
                      <Bell className="w-5 h-5" />
                      <NotificationBell 
                        userId={user?.id !== 'guest' ? user?.id : undefined} 
                        className="absolute -top-1 -right-1"
                      />
                    </Button>
                  </Link> */}
                  <Link href={`/users/${user.id}`}>
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl p-2 flex items-center space-x-2">
                      <UserIcon className="w-5 h-5" />
                      {userProfile?.username && (
                        <span className="text-sm font-medium">{userProfile.username}</span>
                      )}
                    </Button>
                  </Link>
                </>
              ) : (
                <Button 
                  onClick={() => setUser(null)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-4"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {user && user.id !== 'guest' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="flex justify-around items-center py-2 px-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-black rounded-xl p-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5-4.25-9.5-9.5-9.5zm0 1.5c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm-1 4v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z"/>
                </svg>
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            
            <Link href="/discover">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-black rounded-xl p-3">
                <Users className="w-6 h-6" />
                <span className="text-xs">Discover</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-black rounded-xl p-3"
              onClick={() => {
                // Scroll to create post form or trigger create modal
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs">Create</span>
            </Button>
            
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-black rounded-xl p-3 relative">
                <div className="relative">
                  <Bell className="w-6 h-6" />
                  <NotificationBell 
                    userId={user?.id !== 'guest' ? user?.id : undefined} 
                    className="absolute -top-1 -right-4"
                  />
                </div>
                <span className="text-xs">Activity</span>
              </Button>
            </Link>
            
            <Link href={`/users/${user.id}`}>
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-600 hover:text-black rounded-xl p-3">
                <UserIcon className="w-6 h-6" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 pb-24 md:pb-8">
        {editingPost && (
          <div className="mb-6 px-4">
            <EditPostForm
              post={editingPost}
              onSubmit={handleUpdatePost}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          </div>
        )}
        
        <div className="px-4 md:px-0">
          <ModernFeed
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
        </div>
      </main>
    </div>
  )
}
