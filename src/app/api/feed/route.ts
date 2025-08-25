import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Get posts from followed users + own posts
    const { data: posts, error: feedError } = await supabase
      .from('posts')
      .select(`
        *,
        users!posts_user_id_fkey(id, username, avatar_url)
      `)
      .or(`user_id.eq.${user.id},user_id.in.(select following_id from follows where follower_id = '${user.id}')`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (feedError) {
      return NextResponse.json(
        { error: 'Failed to fetch feed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      posts: posts || [], 
      page, 
      limit,
      hasMore: posts ? posts.length === limit : false
    })
  } catch (error) {
    console.error('Get feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
