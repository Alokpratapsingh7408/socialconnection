'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ModernNotifications } from '@/components/ModernNotifications'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    fetchUserId()
  }, [])

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {userId ? (
        <ModernNotifications userId={userId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Please sign in to view notifications</p>
        </div>
      )}
    </div>
  )
}
