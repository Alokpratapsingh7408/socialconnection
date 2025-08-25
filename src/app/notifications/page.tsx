'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Notifications } from '@/components/Notifications'
import { supabase, User } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      console.log('Checking user session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session:', session)
      
      if (session?.user) {
        console.log('User found in session:', session.user.id)
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        console.log('API response status:', response.status)
        
        if (response.ok) {
          const userData = await response.json()
          console.log('User data:', userData)
          // The API returns {profile: {...}} so we need to access the profile property
          setCurrentUser(userData.profile || userData)
        } else {
          console.error('Failed to fetch user data:', response.status)
        }
      } else {
        console.log('No session or user found')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please Sign In</h1>
          <p className="text-gray-600 mt-2">You need to be signed in to view notifications.</p>
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Notifications</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <Notifications userId={currentUser.id} />
      </main>
    </div>
  )
}
