import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Follow a user
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

    const followingId = id

    // Can't follow yourself
    if (user.id === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if user exists
    const { data: targetUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', followingId)
      .single()

    if (userCheckError || !targetUser) {
      console.error('Target user check error:', userCheckError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (followCheckError && followCheckError.code !== 'PGRST116') {
      console.error('Follow check error:', followCheckError)
      return NextResponse.json({ error: 'Error checking follow status' }, { status: 400 })
    }

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    const { error: followError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })

    if (followError) {
      console.error('Follow creation error:', followError)
      return NextResponse.json(
        { error: `Failed to follow user: ${followError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'User followed successfully' })
  } catch (error) {
    console.error('Follow user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unfollow a user
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

    const followingId = id

    // Remove follow relationship
    const { error: unfollowError } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (unfollowError) {
      console.error('Unfollow error:', unfollowError)
      return NextResponse.json(
        { error: `Failed to unfollow user: ${unfollowError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'User unfollowed successfully' })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
