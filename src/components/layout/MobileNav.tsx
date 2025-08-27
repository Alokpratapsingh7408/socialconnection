'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { Bell, User as UserIcon, Users } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  if (!user || user.id === 'guest') return null

  return (
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
  )
}
