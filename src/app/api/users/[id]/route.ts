import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user profile
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get posts count
    const { count: postsCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    // Get followers count
    const { count: followersCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id)

    // Get following count
    const { count: followingCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id)

    // Remove sensitive information and add counts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email: _email, ...publicUser } = user

    const userWithStats = {
      ...publicUser,
      posts_count: postsCount || 0,
      followers_count: followersCount || 0,
      following_count: followingCount || 0
    }

    return NextResponse.json(userWithStats)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
