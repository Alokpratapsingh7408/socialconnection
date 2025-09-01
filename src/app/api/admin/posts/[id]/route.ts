import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

// Delete post (admin only)
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
    const { isAdmin } = await checkAdminPermission(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if post exists
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Delete related records first (comments, likes, notifications)
    // Delete comments
    await supabaseAdmin
      .from('comments')
      .delete()
      .eq('post_id', id)

    // Delete likes
    await supabaseAdmin
      .from('likes')
      .delete()
      .eq('post_id', id)

    // Delete notifications related to this post
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('related_post_id', id)

    // Delete the post (using admin client to bypass RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete post error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Admin delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
