import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabaseAdmin'

// Simple validation function for post updates
function validateUpdateData(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format')
  }
  
  const updateData = data as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  
  if (updateData.content !== undefined) {
    if (typeof updateData.content !== 'string') {
      throw new Error('Content must be a string')
    }
    if (updateData.content.length < 1 || updateData.content.length > 280) {
      throw new Error('Content must be between 1 and 280 characters')
    }
    updates.content = updateData.content
  }
  
  if (updateData.category !== undefined) {
    if (!['general', 'announcement', 'question'].includes(updateData.category as string)) {
      throw new Error('Category must be general, announcement, or question')
    }
    updates.category = updateData.category
  }
  
  if (updateData.image_url !== undefined) {
    if (updateData.image_url && typeof updateData.image_url !== 'string') {
      throw new Error('Image URL must be a string')
    }
    updates.image_url = updateData.image_url || null
  }
  
  return updates
}

// Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .eq('id', params.id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user owns the post using admin client
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Update request body:', body)
    
    const updates = validateUpdateData(body)
    console.log('Validated updates:', updates)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', params.id)
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post', details: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Post updated successfully',
      post: updatedPost,
    })
  } catch (error) {
    console.error('Update post error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user owns the post or is admin
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', params.id)
      .single()

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!post || (post.user_id !== user.id && !userProfile?.is_admin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 400 }
      )
    }

    // Update user's post count
    const { data: currentUser } = await supabase
      .from('users')
      .select('posts_count')
      .eq('id', post.user_id)
      .single()

    if (currentUser) {
      await supabase
        .from('users')
        .update({ posts_count: Math.max(0, (currentUser.posts_count || 0) - 1) })
        .eq('id', post.user_id)
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
