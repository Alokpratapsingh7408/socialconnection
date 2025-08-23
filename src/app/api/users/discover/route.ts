import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // Get Authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = user.id

    // Get users that current user is not following
    // First get the IDs of users the current user is already following
    const { data: followingData } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)

    const followingIds = followingData?.map(f => f.following_id) || []
    
    // Get suggested users (exclude current user and already following users)
    const excludeIds = [currentUserId, ...followingIds]
    
    const query = supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        bio,
        avatar_url,
        followers_count,
        following_count,
        posts_count,
        is_admin,
        created_at
      `)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('followers_count', { ascending: false })
      .limit(12)

    const { data: suggestedUsers, error } = await query

    if (error) {
      console.error('Error fetching suggested users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggested users' },
        { status: 400 }
      )
    }

    // Add isFollowing field (false for all since we filtered them out)
    const usersWithFollowStatus = suggestedUsers?.map(user => ({
      ...user,
      isFollowing: false,
    })) || []

    return NextResponse.json({ users: usersWithFollowStatus })
  } catch (error) {
    console.error('Discover users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
