'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
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
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh count when component becomes visible (e.g., when navigating back to feed)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('NotificationBell: Page became visible, refreshing count')
        fetchUnreadCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUnreadCount = async () => {
    if (!userId) return
    
    console.log('NotificationBell: Fetching unread count for user:', userId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/notifications?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('NotificationBell: Unread count received:', data.unread_count)
        setUnreadCount(data.unread_count || 0)
      } else {
        console.error('NotificationBell: Failed to fetch unread count:', response.status)
      }
    } catch (error) {
      console.error('NotificationBell: Error fetching unread count:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!userId) return

    console.log('Setting up notification bell subscription for user:', userId)

    supabase
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

  const handleRealtimeUpdate = (payload: {
    eventType: string
    new?: Record<string, unknown>
    old?: Record<string, unknown>
  }) => {
    console.log('NotificationBell real-time update:', payload)
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // New notification - increment unread count if it's unread
        if (newRecord && !newRecord.is_read) {
          console.log('NotificationBell: Incrementing count for new notification')
          setUnreadCount(prev => prev + 1)
        }
        break

      case 'UPDATE':
        // Notification updated - check if read status changed
        if (newRecord && oldRecord && oldRecord.is_read !== newRecord.is_read) {
          console.log('NotificationBell: Read status changed', { old: oldRecord.is_read, new: newRecord.is_read })
          setUnreadCount(prev => 
            newRecord.is_read ? Math.max(0, prev - 1) : prev + 1
          )
        }
        break

      case 'DELETE':
        // Notification deleted - decrease count if it was unread
        if (oldRecord && !oldRecord.is_read) {
          console.log('NotificationBell: Decrementing count for deleted notification')
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        break
    }
  }

  return (
    <>
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={`h-4 w-4 flex items-center justify-center text-xs rounded-full animate-pulse border-2 border-white ${className}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </>
  )
}
