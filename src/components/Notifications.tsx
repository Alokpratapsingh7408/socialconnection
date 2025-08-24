'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react'
import { Notification as NotificationType, supabase } from '@/lib/supabaseClient'

interface NotificationsProps {
  userId?: string
}

export function Notifications({ userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (userId) {
      fetchNotifications()
      setupRealtimeSubscription()
    }

    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels()
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setupRealtimeSubscription = () => {
    if (!userId) return

    console.log('Setting up real-time notifications subscription for user:', userId)

    // Subscribe to notifications table changes for the current user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time notification received:', payload)
          handleRealtimeNotification(payload)
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleRealtimeNotification = async (payload: {
    eventType: string
    new?: Record<string, unknown>
    old?: Record<string, unknown>
  }) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // New notification received
        if (!newRecord) return
        console.log('New notification:', newRecord)
        
        // Fetch the complete notification with related user data
        const { data: completeNotification } = await supabase
          .from('notifications')
          .select(`
            *,
            related_user:users!notifications_related_user_id_fkey(id, username, avatar_url)
          `)
          .eq('id', newRecord.id as string)
          .single()

        if (completeNotification) {
          setNotifications(prev => [completeNotification, ...prev])
          if (!completeNotification.is_read) {
            setUnreadCount(prev => prev + 1)
            
            // Show browser notification if permission is granted
            if (window.Notification && window.Notification.permission === 'granted') {
              new window.Notification('New notification', {
                body: completeNotification.message,
                icon: '/favicon.ico'
              })
            }
          }
        }
        break

      case 'UPDATE':
        // Notification updated (e.g., marked as read)
        if (!newRecord || !oldRecord) return
        console.log('Notification updated:', newRecord)
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === newRecord.id
              ? { ...notif, ...newRecord }
              : notif
          )
        )
        
        // Update unread count if read status changed
        if (oldRecord.is_read !== newRecord.is_read) {
          setUnreadCount(prev => 
            newRecord.is_read ? Math.max(0, prev - 1) : prev + 1
          )
        }
        break

      case 'DELETE':
        // Notification deleted
        if (!oldRecord) return
        console.log('Notification deleted:', oldRecord)
        setNotifications(prev =>
          prev.filter(notif => notif.id !== oldRecord.id)
        )
        if (!oldRecord.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        break
    }
  }

  const fetchNotifications = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: NotificationType) => !n.is_read).length || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
    setIsLoading(false)
  }

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Sign in to view notifications</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.is_read 
                    ? 'bg-white' 
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
