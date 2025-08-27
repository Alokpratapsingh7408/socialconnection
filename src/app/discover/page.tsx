'use client'

import { useState, useEffect } from 'react'
import { InstagramUserCard } from '@/components/InstagramUserCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Search, Users, Sparkles, TrendingUp, UserPlus } from 'lucide-react'
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

interface SuggestedUser extends UserProfile {
  isFollowing: boolean
  mutualFollowers?: number
}

export default function DiscoverPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [searchResults, setSearchResults] = useState<SuggestedUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchSuggestedUsers()
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
    setIsLoading(false)
  }

  const fetchSuggestedUsers = async () => {
    if (!currentUser) return

    setIsLoadingSuggestions(true)
    try {
      // Get users that current user is not following
      const response = await fetch('/api/users/discover', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (response.ok) {
        const { users } = await response.json()
        setSuggestedUsers(users)
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error)
    }
    setIsLoadingSuggestions(false)
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: currentUser ? {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        } : {},
      })

      if (response.ok) {
        const { users } = await response.json()
        setSearchResults(users)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
    setIsSearching(false)
  }

  const handleFollow = async (userId: string) => {
    if (!currentUser) return

    // Optimistic update
    setFollowingUsers(prev => new Set([...prev, userId]))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        // Update both suggested users and search results
        setSuggestedUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: true, followers_count: user.followers_count + 1 }
            : user
        ))
        setSearchResults(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: true, followers_count: user.followers_count + 1 }
            : user
        ))
      } else {
        // Revert optimistic update on error
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error following user:', error)
      // Revert optimistic update on error
      setFollowingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleUnfollow = async (userId: string) => {
    if (!currentUser) return

    // Optimistic update
    setFollowingUsers(prev => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        // Update both suggested users and search results
        setSuggestedUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: false, followers_count: user.followers_count - 1 }
            : user
        ))
        setSearchResults(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: false, followers_count: user.followers_count - 1 }
            : user
        ))
      } else {
        // Revert optimistic update on error
        setFollowingUsers(prev => new Set([...prev, userId]))
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      // Revert optimistic update on error
      setFollowingUsers(prev => new Set([...prev, userId]))
    }
  }

  const UserCard = ({ user }: { user: SuggestedUser }) => (
    <InstagramUserCard
      user={user}
      currentUserId={currentUser?.id}
      isFollowing={user.isFollowing}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
      showStats={true}
      size="md"
    />
  )

  // Skeleton Loading Component
  const UserCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar skeleton */}
        <div className="w-20 h-20 rounded-full bg-gray-200"></div>
        
        {/* Username skeleton */}
        <div className="h-5 bg-gray-200 rounded-full w-24"></div>
        
        {/* Bio skeleton */}
        <div className="space-y-2 w-full">
          <div className="h-3 bg-gray-200 rounded-full w-full"></div>
          <div className="h-3 bg-gray-200 rounded-full w-3/4 mx-auto"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 bg-gray-200 rounded-full w-24"></div>
      </div>
    </div>
  )

  // Search Results Skeleton
  const SearchResultsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <UserCardSkeleton key={index} />
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header Skeleton */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Search Skeleton */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto animate-pulse">
              <div className="h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-gray-600 font-medium">Discovering amazing people...</p>
          </div>

          {/* Skeleton Cards */}
          <SearchResultsSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                Discover People
              </h1>
              <p className="text-gray-600 flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                Connect with amazing people in your community
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all">
                Back to Feed
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people..."
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl shadow-sm bg-white/70 backdrop-blur-sm hover:bg-white transition-all focus:shadow-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 hover:bg-gray-100"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                    ×
                  </div>
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  Searching for "<span className="font-medium text-blue-600">{searchQuery}</span>"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                Search Results
                {isSearching && (
                  <span className="ml-3 flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                    searching...
                  </span>
                )}
              </h2>
            </div>
            
            {isSearching ? (
              <SearchResultsSkeleton />
            ) : searchResults.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-600 mb-2">No users found</p>
                <p className="text-gray-500">Try searching with a different keyword</p>
              </div>
            ) : null}
          </section>
        )}

        {/* Suggested Users */}
        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mr-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                Suggested for You
              </h2>
              {suggestedUsers.length > 0 && !isLoadingSuggestions && (
                <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  <UserPlus className="h-4 w-4 mr-1" />
                  {suggestedUsers.length} suggestions
                </div>
              )}
              {isLoadingSuggestions && (
                <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  Loading suggestions...
                </div>
              )}
            </div>
            
            {isLoadingSuggestions ? (
              <SearchResultsSkeleton />
            ) : suggestedUsers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-600 mb-2">No suggestions available</p>
                <p className="text-gray-500 text-lg mb-6">Try following some users or check back later!</p>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                    Explore More Users
                  </Button>
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
