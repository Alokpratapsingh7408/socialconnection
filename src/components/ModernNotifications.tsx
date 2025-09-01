'use client'

import { useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useInView } from 'react-intersection-observer'

interface Actor {
  username: string
  avatar_url?: string
}

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow'
  actor?: Actor
  created_at: string
  read: boolean
}

interface NotificationResponse {
  notifications: Notification[]
  hasMore: boolean
  unreadCount: number
}

interface ModernNotificationsProps {
  userId?: string
}

const NOTIFICATIONS_PER_PAGE = 10

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No session')
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })
  
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json() as Promise<NotificationResponse>
}

export function ModernNotifications({ userId }: ModernNotificationsProps) {
  const { ref: loadMoreRef, inView } = useInView()
  const pageRef = useRef(1)
  
  // Use SWR for data fetching with caching
  const { data, error, mutate } = useSWR<NotificationResponse>(
    userId ? `/api/notifications?page=${pageRef.current}&limit=${NOTIFICATIONS_PER_PAGE}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  )

  const notifications = data?.notifications ?? []
  const hasMore = data?.hasMore ?? false
  const unreadCount = data?.unreadCount ?? 0
  
  // Setup realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Revalidate data immediately when new notification arrives
          await mutate()
          
          // Show browser notification
          if (payload.eventType === 'INSERT' && Notification.permission === 'granted') {
            const { actor, type } = payload.new
            new Notification('New notification', {
              body: `${actor?.username || 'Someone'} ${type === 'like' ? 'liked' : type === 'comment' ? 'commented on' : 'followed'} your post`,
              icon: actor?.avatar_url
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, mutate])

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore) {
      pageRef.current += 1
      mutate()
    }
  }, [inView, hasMore, mutate])

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      // Optimistically update UI
      mutate(
        (data) => {
          if (!data) return data
          return {
            ...data,
            notifications: data.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, data.unreadCount - 1)
          }
        },
        false // Don't revalidate immediately
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [mutate])

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600 text-center">Failed to load notifications</p>
          <Button onClick={() => mutate()} className="mt-2 mx-auto block">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg shadow-lg mb-4">
          <p className="text-center font-medium">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`transform transition-all duration-200 ${
            !notification.read ? 'border-purple-200 bg-purple-50/50' : ''
          }`}
          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {notification.type === 'like' && (
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                )}
                {notification.type === 'comment' && (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                {notification.type === 'follow' && (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{notification.actor?.username}</span>
                  {' '}
                  {notification.type === 'like' && 'liked your post'}
                  {notification.type === 'comment' && 'commented on your post'}
                  {notification.type === 'follow' && 'started following you'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {!notification.read && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  New
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center">
          <div className="animate-pulse">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin inline-block"></div>
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No notifications yet</CardTitle>
            <p className="text-gray-500">
              When someone likes or comments on your posts, or follows you, you will see it here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
