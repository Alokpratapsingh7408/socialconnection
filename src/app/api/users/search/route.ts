import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 1) {
      return NextResponse.json({ users: [] })
    }

    // Get current user if authenticated
    const authorization = request.headers.get('authorization')
    let currentUserId: string | undefined
    
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        currentUserId = user.id
      }
    }

    // Search users by username or bio
    const searchQuery = `%${query.trim()}%`
    
    const { data: searchResults, error: searchError } = await supabaseAdmin
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
      .or(`username.ilike.${searchQuery},bio.ilike.${searchQuery}`)
      .order('followers_count', { ascending: false })
      .limit(20)

    if (searchError) {
      console.error('Error searching users:', searchError)
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 400 }
      )
    }

    // Check follow status for each user if user is authenticated
    let usersWithFollowStatus = searchResults || []
    
    if (currentUserId) {
      // Get following relationships
      const userIds = searchResults?.map(user => user.id) || []
      const { data: followingData } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', userIds)

      const followingIds = new Set(followingData?.map(f => f.following_id) || [])
      
      usersWithFollowStatus = searchResults?.map(user => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      })) || []
    } else {
      usersWithFollowStatus = searchResults?.map(user => ({
        ...user,
        isFollowing: false,
      })) || []
    }

    return NextResponse.json({ users: usersWithFollowStatus })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
