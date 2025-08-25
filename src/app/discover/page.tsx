'use client'

import { useState, useEffect } from 'react'
import { InstagramUserCard } from '@/components/InstagramUserCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Search, Users } from 'lucide-react'
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
  const [isSearching, setIsSearching] = useState(false)

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
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
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
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Discover People</h1>
              <p className="text-gray-600">Connect with amazing people in your community</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="font-semibold">
                Back to Feed
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for people..."
              className="pl-12 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Results
              {isSearching && <span className="ml-2 text-sm text-gray-500">(searching...)</span>}
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : !isSearching && searchQuery ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found for {searchQuery}</p>
              </div>
            ) : null}
          </section>
        )}

        {/* Suggested Users */}
        {!searchQuery && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Suggested for You
            </h2>
            
            {suggestedUsers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No suggestions available</p>
                <p className="text-gray-400 text-sm">Try following some users or check back later!</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
