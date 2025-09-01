import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(160).optional(),
  avatar_url: z.string().optional(),
  website: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL"
  }),
  location: z.string().max(50).optional(),
  is_private: z.boolean().optional(),
})

// Get current user profile
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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get posts count
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    const profileWithStats = {
      ...profile,
      posts_count: postsCount || 0,
      followers_count: followersCount || 0,
      following_count: followingCount || 0
    }

    return NextResponse.json({ profile: profileWithStats })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('Auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user ID:', user.id)

    // Check if user exists in users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Existing user from database:', existingUser)
    console.log('Fetch error:', fetchError)

    if (!existingUser) {
      console.log('User not found in users table')
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('PATCH /api/users/me - Request body:', body)
    
    const parseResult = updateProfileSchema.safeParse(body)
    if (!parseResult.success) {
      console.log('Validation error:', parseResult.error.issues)
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.issues },
        { status: 400 }
      )
    }
    
    const updates = parseResult.data
    console.log('Parsed updates:', updates)

    // Check if username is already taken (if updating username)
    if (updates.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', updates.username)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        )
      }
    }

    console.log('About to update user with:')
    console.log('User ID:', user.id)
    console.log('Updates object:', { ...updates, updated_at: new Date().toISOString() })

    // Use admin client for the update to bypass RLS
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    console.log('Update result - Data:', updatedProfile)
    console.log('Update result - Error:', updateError)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 400 }
      )
    }

    console.log('Profile updated successfully:', updatedProfile)
    return NextResponse.json(updatedProfile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
