import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Check if user is admin
async function checkAdminPermission(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { isAdmin: false, user: null }
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { 
    isAdmin: userProfile?.is_admin || false, 
    user 
  }
}

// Get admin statistics
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { isAdmin } = await checkAdminPermission(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Get users active today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: usersActiveToday } = await supabase
      .from('posts')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get posts created today
    const { count: postsToday } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get total likes
    const { count: totalLikes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })

    // Get total comments
    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    // Get total follows
    const { count: totalFollows } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })

    // Get recent users (last 10 registered)
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, username, email, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent posts (last 10 posts with user info)
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        id, 
        content, 
        created_at,
        like_count,
        comment_count,
        users!posts_user_id_fkey (
          id,
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const stats = {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      users_active_today: usersActiveToday || 0,
      total_posts: totalPosts || 0,
      posts_today: postsToday || 0,
      total_likes: totalLikes || 0,
      total_comments: totalComments || 0,
      total_follows: totalFollows || 0,
      recent_users: recentUsers || [],
      recent_posts: recentPosts || [],
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin get stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
