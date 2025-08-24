'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface NotificationBellProps {
  userId?: string
  className?: string
}

export function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (userId) {
      fetchUnreadCount()
      setupRealtimeSubscription()
    }

    return () => {
      // Cleanup subscription on unmount
      const channels = supabase.getChannels()
      channels.forEach(channel => {
        if (channel.topic.includes('notification-bell')) {
          supabase.removeChannel(channel)
        }
      })
    }
  }, [userId])

  const fetchUnreadCount = async () => {
    if (!userId) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/notifications?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!userId) return

    console.log('Setting up notification bell subscription for user:', userId)

    const channel = supabase
      .channel('notification-bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification bell update:', payload)
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe((status) => {
        console.log('Notification bell subscription status:', status)
      })
  }

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // New notification - increment unread count if it's unread
        if (!newRecord.is_read) {
          setUnreadCount(prev => prev + 1)
        }
        break

      case 'UPDATE':
        // Notification updated - check if read status changed
        if (oldRecord.is_read !== newRecord.is_read) {
          setUnreadCount(prev => 
            newRecord.is_read ? Math.max(0, prev - 1) : prev + 1
          )
        }
        break

      case 'DELETE':
        // Notification deleted - decrease count if it was unread
        if (!oldRecord.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        break
    }
  }

  return (
    <Link 
      href="/notifications" 
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 rounded-full animate-pulse"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Link>
  )
}
