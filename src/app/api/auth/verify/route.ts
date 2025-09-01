import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user data from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      console.error('Error getting auth user:', authError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ message: 'Profile already exists' })
    }

    // Get username from user metadata
    const username = authUser.user.user_metadata?.username

    if (!username) {
      return NextResponse.json({ error: 'Username not found in metadata' }, { status: 400 })
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        username,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_private: false,
        is_admin: false,
        is_active: true,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User profile created successfully' })

  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}