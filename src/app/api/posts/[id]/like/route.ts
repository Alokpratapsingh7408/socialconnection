import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabaseAdmin'

// Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists and get post owner
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: 'Post already liked' }, { status: 400 })
    }

    // Create like
    const { error: likeError } = await supabaseAdmin
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: id,
      })

    if (likeError) {
      return NextResponse.json(
        { error: 'Failed to like post' },
        { status: 400 }
      )
    }

    // Create notification for post owner (if not liking own post)
    if (post.user_id !== user.id) {
      const { data: liker } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'like',
          message: `${liker?.username || 'Someone'} liked your post`,
          related_user_id: user.id,
          related_post_id: id,
          is_read: false
        })
    }

    return NextResponse.json({ message: 'Post liked successfully' })
  } catch (error) {
    console.error('Like post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove like
    const { error: unlikeError } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', id)

    if (unlikeError) {
      return NextResponse.json(
        { error: 'Failed to unlike post' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Post unliked successfully' })
  } catch (error) {
    console.error('Unlike post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
