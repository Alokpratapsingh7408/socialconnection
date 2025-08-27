'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { User as DBUser } from '@/lib/supabaseClient'
import { Bell, User as UserIcon, Shield, Users } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'

interface HeaderProps {
  user: User | null
  userProfile: DBUser | null
  onLogout: () => void
}

export function Header({ user, userProfile, onLogout }: HeaderProps) {
  return (
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
                  onClick={onLogout} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-6"
                >
                  Sign In
                </Button>
              </Link>
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
              <Link href="/auth">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-4"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
